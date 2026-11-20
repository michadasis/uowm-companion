import { FetchError, userAgent } from '../http/fetch.js';

/** The largest image passed on; a poster runs to a megabyte or two. */
export const maxImageBytes = 10 * 1024 * 1024;

/**
 * Whether a URL is one this proxy passes on: an https address on the
 * university's own sites. Anything else is refused, so the endpoint can't be
 * used to fetch the wider web through the backend.
 */
export function isUniversityImageUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  return host === 'uowm.gr' || host.endsWith('.uowm.gr');
}

export interface ProxiedImage {
  bytes: Uint8Array;
  contentType: string;
}

/**
 * Reads an image from a university site for the app. The sites send
 * `Cross-Origin-Resource-Policy: same-site`, so a page elsewhere — the app's
 * web build — can't show their images directly; passed on from here, it can,
 * & the CDN keeps a copy so the site is asked once.
 */
export async function fetchUniversityImage(raw: string): Promise<ProxiedImage> {
  let response: Response;
  try {
    response = await fetch(raw, {
      headers: { 'User-Agent': userAgent, Accept: 'image/*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });
  } catch (cause) {
    throw new FetchError(`Could not reach ${raw}`, { cause });
  }
  if (!response.ok) {
    throw new FetchError(`${raw} answered ${response.status}`, { status: response.status });
  }
  // A redirect may not lead off the university's sites.
  if (response.url && !isUniversityImageUrl(response.url)) {
    throw new FetchError(`${raw} redirected off the university's sites`, { status: 403 });
  }
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
  if (!contentType.startsWith('image/')) {
    throw new FetchError(`${raw} is not an image`, { status: 415 });
  }
  const length = Number(response.headers.get('content-length') ?? 0);
  if (length > maxImageBytes) {
    throw new FetchError(`${raw} is too large`, { status: 413 });
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > maxImageBytes) {
    throw new FetchError(`${raw} is too large`, { status: 413 });
  }
  return { bytes, contentType };
}
