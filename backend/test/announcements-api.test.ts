import { afterEach, describe, expect, it, vi } from 'vitest';

import endpoint from '../api/announcements.js';
import type { AnnouncementsResponse } from '../src/announcements/types.js';

type Routes = Record<string, () => Response>;

function mockFetch(routes: Routes) {
  globalThis.fetch = vi.fn((input: string | URL | Request): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const match = Object.keys(routes).find((key) => url.startsWith(key) || url.includes(key));
    if (!match) return Promise.reject(new Error(`unexpected fetch: ${url}`));
    return Promise.resolve(routes[match]!());
  });
}

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
const htmlResponse = (body: string) =>
  new Response(body, { headers: { 'Content-Type': 'text/html' } });

const wpPost = {
  id: 1,
  date_gmt: '2026-11-09T13:40:10',
  link: 'https://cs.uowm.gr/a-post/',
  title: { rendered: 'Μια ανακοίνωση' },
  excerpt: { rendered: '<p>Περίληψη.</p>' },
  content: { rendered: '<p>Σώμα.</p>' },
};

async function call(query: string): Promise<{ status: number; response: Response }> {
  const response = await endpoint.fetch(
    new Request(`https://backend.test/api/announcements${query}`),
  );
  return { status: response.status, response };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/announcements', () => {
  it('returns a department feed from WordPress', async () => {
    mockFetch({ 'cs.uowm.gr/wp-json': () => jsonResponse([wpPost]) });

    const { status, response } = await call('?dept=cs');
    const body = (await response.json()) as AnnouncementsResponse;

    expect(status).toBe(200);
    expect(body.source).toEqual({ kind: 'department', id: 'cs' });
    expect(body.announcements).toHaveLength(1);
    expect(body.announcements[0]).toMatchObject({ id: 'cs:1', title: 'Μια ανακοίνωση' });
  });

  it('returns the university feed from uowm.gr', async () => {
    mockFetch({ 'www.uowm.gr/wp-json': () => jsonResponse([wpPost]) });

    const { status, response } = await call('?scope=university');
    const body = (await response.json()) as AnnouncementsResponse;

    expect(status).toBe(200);
    expect(body.source).toEqual({ kind: 'university' });
  });

  it('scrapes the feed of a department that blocks the REST API', async () => {
    mockFetch({
      'mst.uowm.gr/epikairotita/anakoinoseis/': () =>
        htmlResponse('<a href="https://mst.uowm.gr/nea/post-a/">Α</a>'),
      'mst.uowm.gr/nea/post-a/': () =>
        htmlResponse(
          '<meta property="og:title" content="Σκραπαρισμένη">' +
            '<meta property="article:published_time" content="2026-11-12T10:00:00+00:00">' +
            '<div class="entry-content"><p>Κείμενο.</p></div>',
        ),
    });

    const { status, response } = await call('?dept=mst');
    const body = (await response.json()) as AnnouncementsResponse;

    expect(status).toBe(200);
    expect(body.announcements[0]).toMatchObject({ id: 'mst:post-a', title: 'Σκραπαρισμένη' });
  });

  it('lets the CDN serve the feed for ten minutes & a stale day', async () => {
    mockFetch({ 'cs.uowm.gr/wp-json': () => jsonResponse([wpPost]) });

    const { response } = await call('?dept=cs');

    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
    );
  });

  it('is a 404 for an unknown department', async () => {
    const { status } = await call('?dept=nope');
    expect(status).toBe(404);
  });

  it('is a 400 when neither a department nor the university scope is given', async () => {
    const { status } = await call('');
    expect(status).toBe(400);
  });

  it('is a 500, uncached, when the upstream source cannot be read', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch({ 'cs.uowm.gr/wp-json': () => new Response('nope', { status: 500 }) });

    const { status, response } = await call('?dept=cs');

    expect(status).toBe(500);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
