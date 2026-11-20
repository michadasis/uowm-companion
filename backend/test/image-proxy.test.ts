import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchUniversityImage, isUniversityImageUrl } from '../src/images/proxy.js';

describe('isUniversityImageUrl', () => {
  it('takes https addresses on the university sites', () => {
    expect(isUniversityImageUrl('https://cs.uowm.gr/wp-content/uploads/a.jpg')).toBe(true);
    expect(isUniversityImageUrl('https://uowm.gr/wp-content/uploads/a.png')).toBe(true);
  });

  it('refuses everything else', () => {
    expect(isUniversityImageUrl('http://cs.uowm.gr/a.jpg')).toBe(false);
    expect(isUniversityImageUrl('https://evil.example/a.jpg')).toBe(false);
    expect(isUniversityImageUrl('https://uowm.gr.evil.example/a.jpg')).toBe(false);
    expect(isUniversityImageUrl('https://notuowm.gr/a.jpg')).toBe(false);
    expect(isUniversityImageUrl('https://user:pw@cs.uowm.gr/a.jpg')).toBe(false);
    expect(isUniversityImageUrl('https://cs.uowm.gr:8443/a.jpg')).toBe(false);
    expect(isUniversityImageUrl('not a url')).toBe(false);
  });
});

describe('fetchUniversityImage', () => {
  afterEach(() => vi.restoreAllMocks());

  const reply = (
    body: ConstructorParameters<typeof Response>[0],
    headers: Record<string, string>,
    url: string,
  ) => {
    const response = new Response(body, { headers });
    Object.defineProperty(response, 'url', { value: url });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
  };

  it('passes an image on with its type', async () => {
    reply(new Uint8Array([1, 2, 3]), { 'content-type': 'image/png' }, 'https://cs.uowm.gr/a.png');
    const image = await fetchUniversityImage('https://cs.uowm.gr/a.png');
    expect(image.contentType).toBe('image/png');
    expect(Array.from(image.bytes)).toEqual([1, 2, 3]);
  });

  it('refuses what is not an image, & a redirect off the university sites', async () => {
    reply('<html>', { 'content-type': 'text/html' }, 'https://cs.uowm.gr/a.png');
    await expect(fetchUniversityImage('https://cs.uowm.gr/a.png')).rejects.toThrow(/not an image/);

    reply(new Uint8Array([1]), { 'content-type': 'image/png' }, 'https://evil.example/a.png');
    await expect(fetchUniversityImage('https://cs.uowm.gr/a.png')).rejects.toThrow(/redirected/);
  });
});
