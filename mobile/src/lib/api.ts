import type { ZodType } from 'zod';

const configured = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

/**
 * The backend's base URL, or null in a build made without one. The app is
 * usable without it: it falls back to what it bundles and what it cached.
 */
export const apiUrl: string | null = configured ? configured : null;

/** Why a request failed, so a screen can choose the right state to show. */
export type ApiErrorKind = 'network' | 'http' | 'invalid';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options?.status;
  }
}

/**
 * Fetches a backend endpoint and checks the response against a schema, so a
 * malformed payload fails here, with a clear error, instead of somewhere
 * inside a screen.
 */
export async function getJson<T>(
  path: string,
  schema: ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (!apiUrl) throw new ApiError('network', 'No backend URL is configured');

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, { headers: { Accept: 'application/json' }, signal });
  } catch (cause) {
    throw new ApiError('network', `Could not reach ${path}`, { cause });
  }
  if (!response.ok) {
    throw new ApiError('http', `${path} answered ${response.status}`, { status: response.status });
  }

  const parsed = schema.safeParse(await response.json().catch(() => undefined));
  if (!parsed.success) {
    throw new ApiError('invalid', `${path} returned an unexpected shape`, { cause: parsed.error });
  }
  return parsed.data;
}
