export interface CachePolicy {
  /** Seconds Vercel's CDN serves the response without asking the function. */
  sMaxAge: number;
  /** Seconds a stale response may still be served while a fresh one is built. */
  staleWhileRevalidate: number;
}

function cacheControl({ sMaxAge, staleWhileRevalidate }: CachePolicy): string {
  // max-age=0 keeps clients revalidating against the CDN, so a new deployment
  // reaches the app as soon as the CDN copy is replaced.
  return `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
}

export function json(body: unknown, cache: CachePolicy): Response {
  return Response.json(body, {
    headers: { 'Cache-Control': cacheControl(cache) },
  });
}

export function problem(
  status: number,
  message: string,
  headers: Record<string, string> = {},
): Response {
  return Response.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'no-store', ...headers } },
  );
}

/**
 * Wraps a GET-only endpoint: other methods get a 405, and a thrown error
 * becomes a 500 that is never cached.
 */
export function get(handler: (request: Request) => Response | Promise<Response>) {
  return {
    async fetch(request: Request): Promise<Response> {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return problem(405, 'Method not allowed', { Allow: 'GET, HEAD' });
      }
      try {
        return await handler(request);
      } catch (error) {
        console.error(error);
        return problem(500, 'Internal error');
      }
    },
  };
}
