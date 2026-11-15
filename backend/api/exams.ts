import { get, json, problem } from '../src/http/respond.js';
import { findDepartment } from '../src/registry/index.js';
import { fetchSchedule } from '../src/schedules/fetch.js';

// Schedule documents change a few times a semester, and parsing one is slow,
// so the CDN serves a copy for an hour & a stale one for a week.
const cache = { sMaxAge: 3_600, staleWhileRevalidate: 604_800 };

export default get(async (request) => {
  const dept = new URL(request.url).searchParams.get('dept');
  if (!dept) return problem(400, 'Pass dept=<id>');

  const department = findDepartment(dept);
  if (!department) return problem(404, `Unknown department: ${dept}`);

  return json(await fetchSchedule(department, 'exams'), cache);
});
