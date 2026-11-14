import { z } from 'zod';

import type * as Api from '../api';

const schema = z.object({ ok: z.boolean() });

function loadApi(url: string | undefined): typeof Api {
  if (url === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = url;

  let api!: typeof Api;
  // The base URL is read once, when the module loads, so each case needs a
  // fresh copy of the module.
  jest.isolateModules(() => {
    api = jest.requireActual('../api');
  });
  return api;
}

function respondWith(body: unknown, init?: ResponseInit) {
  const fetchMock = jest.fn(() => Promise.resolve(new Response(JSON.stringify(body), init)));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

async function failure(promise: Promise<unknown>): Promise<Api.ApiError> {
  try {
    await promise;
  } catch (error) {
    return error as Api.ApiError;
  }
  throw new Error('Expected the request to fail');
}

describe('apiUrl', () => {
  it('is null when the build has no backend', () => {
    expect(loadApi(undefined).apiUrl).toBeNull();
    expect(loadApi('  ').apiUrl).toBeNull();
  });

  it('drops trailing slashes so paths can be appended', () => {
    expect(loadApi('https://backend.test/').apiUrl).toBe('https://backend.test');
  });
});

describe('getJson', () => {
  it('returns the parsed response', async () => {
    const { getJson } = loadApi('https://backend.test');
    const fetchMock = respondWith({ ok: true, extra: 'ignored' });

    await expect(getJson('/api/thing', schema)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://backend.test/api/thing',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('fails as a network error when the request cannot be made', async () => {
    const { getJson } = loadApi('https://backend.test');
    globalThis.fetch = jest.fn(() => Promise.reject(new TypeError('Network request failed')));

    const error = await failure(getJson('/api/thing', schema));

    expect(error.name).toBe('ApiError');
    expect(error.kind).toBe('network');
  });

  it('fails as a network error when there is no backend to ask', async () => {
    const { getJson } = loadApi(undefined);

    expect((await failure(getJson('/api/thing', schema))).kind).toBe('network');
  });

  it('fails with the status when the backend answers with an error', async () => {
    const { getJson } = loadApi('https://backend.test');
    respondWith({ error: 'Internal error' }, { status: 500 });

    const error = await failure(getJson('/api/thing', schema));

    expect(error.kind).toBe('http');
    expect(error.status).toBe(500);
  });

  it('fails as invalid when the response is not what the schema describes', async () => {
    const { getJson } = loadApi('https://backend.test');
    respondWith({ ok: 'yes' });

    expect((await failure(getJson('/api/thing', schema))).kind).toBe('invalid');
  });

  it('fails as invalid when the response is not JSON at all', async () => {
    const { getJson } = loadApi('https://backend.test');
    globalThis.fetch = jest.fn(() =>
      Promise.resolve(new Response('<html>Bad gateway</html>')),
    ) as unknown as typeof fetch;

    expect((await failure(getJson('/api/thing', schema))).kind).toBe('invalid');
  });
});
