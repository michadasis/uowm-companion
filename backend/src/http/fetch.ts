// Identifies the backend to the sites it reads, names the app & links the
// repo, so an administrator who sees it in their logs knows what it is.
export const userAgent = 'UoWMCompanion/1.2 (+https://github.com/michadasis/uowm-companion)';

const defaultTimeoutMs = 15_000;

export class FetchError extends Error {
  readonly status?: number;
  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = 'FetchError';
    this.status = options?.status;
  }
}

async function request(url: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': userAgent, Accept: '*/*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(defaultTimeoutMs),
    });
  } catch (cause) {
    throw new FetchError(`Could not reach ${url}`, { cause });
  }
  if (!response.ok) {
    throw new FetchError(`${url} answered ${response.status}`, { status: response.status });
  }
  return response;
}

/**
 * Whether an error is the site being slow or briefly down — worth a retry
 * later — rather than a page that isn't there. A response built around such a
 * failure would be cached as if the site had less to say; better to fail the
 * request, which the CDN never caches, & keep serving the last good answer.
 */
export function isTransient(error: unknown): boolean {
  if (!(error instanceof FetchError)) return false;
  return error.status === undefined || error.status >= 500 || error.status === 429;
}

// The body can time out too, after the headers came back in time.
async function body<T>(url: string, read: (response: Response) => Promise<T>): Promise<T> {
  const response = await request(url);
  try {
    return await read(response);
  } catch (cause) {
    throw new FetchError(`Could not read ${url}`, { cause });
  }
}

export async function fetchText(url: string): Promise<string> {
  return body(url, (response) => response.text());
}

export async function fetchBuffer(url: string): Promise<Uint8Array> {
  return body(url, async (response) => new Uint8Array(await response.arrayBuffer()));
}

export async function fetchJson(url: string): Promise<unknown> {
  const response = await request(url);
  try {
    return await response.json();
  } catch (cause) {
    throw new FetchError(`${url} did not return JSON`, { cause });
  }
}

/**
 * Runs a set of tasks a few at a time, in order, keeping the results that
 * succeed & dropping the ones that throw. The scraped sites are slow & the
 * odd post page 404s; one bad page should not sink the whole feed.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: (R | typeof skip)[] = Array.from({ length: items.length }, () => skip);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = await task(items[index]!);
      } catch {
        results[index] = skip;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results.filter((value): value is R => value !== skip);
}

const skip = Symbol('skip');
