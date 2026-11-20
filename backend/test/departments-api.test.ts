import { describe, expect, it } from 'vitest';

import endpoint from '../api/departments.js';
import type { Directory } from '../src/departments/directory.js';
import { departments } from '../src/registry/departments.js';

const url = 'https://backend.test/api/departments';

async function getDirectory(): Promise<{ response: Response; body: Directory }> {
  const response = await endpoint.fetch(new Request(url));
  return { response, body: (await response.json()) as Directory };
}

describe('GET /api/departments', () => {
  it('returns the cities, schools and departments', async () => {
    const { response, body } = await getDirectory();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/application\/json/);
    expect(body.cities).toHaveLength(5);
    expect(body.schools).toHaveLength(7);
    expect(body.departments).toHaveLength(22);
  });

  it('describes a department without its scraping details', async () => {
    const { body } = await getDirectory();
    const informatics = body.departments.find((department) => department.id === 'cs');

    expect(informatics).toEqual({
      id: 'cs',
      name: { el: 'Τμήμα Πληροφορικής', en: 'Department of Informatics' },
      shortName: { el: 'Πληροφορικής', en: 'Informatics' },
      aliases: [],
      school: 'sciences',
      city: 'kastoria',
      website: 'https://cs.uowm.gr',
      features: ['announcements', 'exams', 'timetable'],
    });
  });

  it('lists only the features a department has a source for', async () => {
    // Every department has both schedules now; take one away to see it go.
    const mst = departments.find((department) => department.id === 'mst')!;
    const sources = mst.sources as { exams?: unknown; timetable?: unknown };
    const { exams, timetable } = sources;
    delete sources.exams;
    delete sources.timetable;
    try {
      const { body } = await getDirectory();
      const listed = body.departments.find((department) => department.id === 'mst');
      expect(listed?.features).not.toContain('exams');
      expect(listed?.features).not.toContain('timetable');
      expect(listed?.features).toContain('announcements');
    } finally {
      Object.assign(sources, { exams, timetable });
    }
  });

  it('has an exam & a class schedule source for every department', async () => {
    const { body } = await getDirectory();
    for (const department of body.departments) {
      expect(department.features).toEqual(expect.arrayContaining(['exams', 'timetable']));
    }
  });

  it('lets the CDN cache the response', async () => {
    const { response } = await getDirectory();

    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
    );
  });

  it('answers HEAD requests', async () => {
    const response = await endpoint.fetch(new Request(url, { method: 'HEAD' }));

    expect(response.status).toBe(200);
  });

  it('rejects other methods without caching the refusal', async () => {
    const response = await endpoint.fetch(new Request(url, { method: 'POST' }));

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET, HEAD');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
