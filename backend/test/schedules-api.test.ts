import { describe, expect, it } from 'vitest';

import exams from '../api/exams.js';
import timetable from '../api/timetable.js';
import { departments } from '../src/registry/departments.js';
import type { ScheduleResponse } from '../src/schedules/types.js';

async function call(endpoint: typeof exams, query: string) {
  const response = await endpoint.fetch(new Request(`https://backend.test/api/x${query}`));
  return { status: response.status, response };
}

describe('GET /api/exams & /api/timetable', () => {
  it('is a 400 without a department', async () => {
    expect((await call(exams, '')).status).toBe(400);
    expect((await call(timetable, '')).status).toBe(400);
  });

  it('is a 404 for an unknown department', async () => {
    expect((await call(exams, '?dept=nope')).status).toBe(404);
  });

  it('reports a department that publishes no such schedule, without fetching', async () => {
    // Every department has an exams source now; take one away.
    const sources = departments.find((department) => department.id === 'mst')!.sources as {
      exams?: unknown;
    };
    const source = sources.exams;
    delete sources.exams;
    try {
      const { status, response } = await call(exams, '?dept=mst');
      const body = (await response.json()) as ScheduleResponse;

      expect(status).toBe(200);
      expect(body).toMatchObject({
        dept: 'mst',
        kind: 'exams',
        available: false,
        document: null,
        exams: [],
        original: [],
      });
      // Cached for an hour like any schedule.
      expect(response.headers.get('cache-control')).toBe(
        'public, max-age=0, s-maxage=3600, stale-while-revalidate=604800',
      );
    } finally {
      sources.exams = source;
    }
  });
});
