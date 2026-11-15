import { Image } from 'expo-image';
import { useState } from 'react';

import { createStyles } from '@/design';

export interface AutoImageProps {
  src: string;
  alt?: string;
}

/**
 * An image that keeps its own proportions. The intrinsic size isn't known
 * until it loads, so it starts at a gentle 4:3 and settles to the real ratio,
 * capped so a tall image can't take over the screen.
 */
export function AutoImage({ src, alt }: AutoImageProps) {
  const styles = useStyles();
  const [aspectRatio, setAspectRatio] = useState(4 / 3);

  return (
    <Image
      source={{ uri: src }}
      accessibilityLabel={alt}
      accessibilityRole="image"
      contentFit="cover"
      transition={160}
      onLoad={({ source }) => {
        if (source.width > 0 && source.height > 0) {
          setAspectRatio(Math.max(source.width / source.height, 0.75));
        }
      }}
      style={[styles.image, { aspectRatio }]}
    />
  );
}

const useStyles = createStyles((theme) => ({
  image: {
    width: '100%',
    maxHeight: 420,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.skeleton,
  },
}));
