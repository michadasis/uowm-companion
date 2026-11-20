import { describe, expect, it, vi } from 'vitest';

import { departments } from '../src/registry/departments.js';
import { warm, warmPaths } from '../src/warm.js';

describe('warmPaths', () => {
  it('lists every department that has the data, & the university for announcements', () => {
    const announcements = warmPaths('announcements');
    expect(announcements[0]).toBe('/api/announcements?scope=university');
    expect(announcements).toContain('/api/announcements?dept=cs');
    expect(warmPaths('timetable')).toContain('/api/timetable?dept=cs');
    // Every department has a timetable source now.
    expect(warmPaths('timetable')).toHaveLength(departments.length);
    expect(warmPaths('menu')).toEqual(['/api/menu']);
  });
});

describe('warm', () => {
  it('requests each path from the origin & reports a failure without stopping', async () => {
    const fetcher = vi.fn((url: string) =>
      url.endsWith('b')
        ? Promise.reject(new Error('down'))
        : Promise.resolve(new Response('{}', { status: 200 })),
    );
    const results = await warm(
      'https://x.test',
      ['/a', '/b', '/c'],
      fetcher as unknown as typeof fetch,
    );
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(results.map((r) => [r.path, r.status])).toEqual([
      ['/a', 200],
      ['/b', null],
      ['/c', 200],
    ]);
  });
});
