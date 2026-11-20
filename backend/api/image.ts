import { FetchError, isTransient } from '../src/http/fetch.js';
import { get, problem } from '../src/http/respond.js';
import { fetchUniversityImage, isUniversityImageUrl } from '../src/images/proxy.js';

// An upload's address changes when its file does, so a copy keeps: the CDN
// holds it for a month & the phone for a day.
const cacheControl = 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=31536000';

export default get(async (request) => {
  const url = new URL(request.url).searchParams.get('url');
  if (!url || !isUniversityImageUrl(url)) {
    return problem(400, 'Only images on the university sites are passed on');
  }
  try {
    const image = await fetchUniversityImage(url);
    return new Response(image.bytes, {
      headers: {
        'Content-Type': image.contentType,
        'Cache-Control': cacheControl,
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    // A brief failure is not cached, so the next request tries again.
    if (isTransient(error)) throw error;
    const status = error instanceof FetchError && error.status ? error.status : 502;
    return problem(status >= 400 && status < 600 ? status : 502, 'Could not pass the image on');
  }
});
