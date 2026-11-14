import { afterEach, describe, expect, it, vi } from 'vitest';

import { get, json } from '../src/http/respond.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('get', () => {
  it('turns a thrown error into an uncached 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const endpoint = get(() => {
      throw new Error('boom');
    });

    const response = await endpoint.fetch(new Request('https://backend.test/api/x'));

    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'Internal error' });
  });

  it('awaits asynchronous handlers', async () => {
    const endpoint = get(async () => {
      await Promise.resolve();
      return json({ ok: true }, { sMaxAge: 60, staleWhileRevalidate: 300 });
    });

    const response = await endpoint.fetch(new Request('https://backend.test/api/x'));

    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    );
  });
});
