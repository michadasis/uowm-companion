import { Image } from 'expo-image';
import { useState } from 'react';

import { createStyles } from '@/design';
import { apiUrl } from '@/lib/api';

export interface AutoImageProps {
  src: string;
  alt?: string;
}

const universityHost = /^https:\/\/([a-z0-9-]+\.)*uowm\.gr\//i;

/**
 * Where to load an image from: a university site's own through the backend,
 * which passes it on. The sites mark their images as for their own pages
 * (`Cross-Origin-Resource-Policy: same-site`), & the backend's copy is cached
 * on its CDN; anything else, & any build without a backend, loads it direct.
 */
export function imageSources(src: string, api: string | null = apiUrl): string[] {
  if (!api || !universityHost.test(src)) return [src];
  return [`${api}/api/image?url=${encodeURIComponent(src)}`, src];
}

/**
 * An image that keeps its own proportions. The intrinsic size isn't known
 * until it loads, so it starts at a gentle 4:3 and settles to the real ratio,
 * capped so a tall image can't take over the screen. Should it not load from
 * the backend it tries the site itself, & failing that it steps aside rather
 * than leave an empty frame.
 */
export function AutoImage({ src, alt }: AutoImageProps) {
  const styles = useStyles();
  const [aspectRatio, setAspectRatio] = useState(4 / 3);
  const sources = imageSources(src);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);

  if (attempt >= sources.length) return null;

  return (
    <Image
      source={{ uri: sources[attempt] }}
      accessibilityLabel={alt}
      accessibilityRole="image"
      // Whole, never cropped: announcements are often posters, words to the edge.
      contentFit="contain"
      transition={160}
      onLoad={({ source }) => {
        if (source.width > 0 && source.height > 0) {
          setAspectRatio(Math.max(source.width / source.height, 0.6));
        }
        setLoaded(true);
      }}
      onError={() => setAttempt((current) => current + 1)}
      style={[styles.image, loaded ? styles.loaded : null, { aspectRatio }]}
      testID="content-image"
    />
  );
}

const useStyles = createStyles((theme) => ({
  image: {
    width: '100%',
    // A poster stands tall but not past most of a phone's screen.
    maxHeight: 520,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.skeleton,
  },
  // Once in, a poster narrower than the column sits on the page, not a grey frame.
  loaded: {
    backgroundColor: 'transparent',
  },
}));
