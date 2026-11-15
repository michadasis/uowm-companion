import { describe, expect, it } from 'vitest';

import exams from '../api/exams.js';
import timetable from '../api/timetable.js';
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
    // Product and Systems Design Engineering has no exams source in the registry.
    const { status, response } = await call(exams, '?dept=ide');
    const body = (await response.json()) as ScheduleResponse;

    expect(status).toBe(200);
    expect(body).toMatchObject({
      dept: 'ide',
      kind: 'exams',
      available: false,
      document: null,
      exams: [],
      original: [],
    });
  });

  it('lets the CDN cache a schedule for an hour', async () => {
    const { response } = await call(exams, '?dept=ide');
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=604800',
    );
  });
});
