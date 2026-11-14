import { fetchAnnouncements } from '../src/announcements/fetch.js';
import type { AnnouncementsResponse } from '../src/announcements/types.js';
import { get, json, problem } from '../src/http/respond.js';
import { findDepartment, university } from '../src/registry/index.js';

// Announcements change through the day but not minute to minute, and the
// scraped feeds are slow, so the CDN serves a copy for ten minutes & a stale
// one for a day while a fresh one is built.
const cache = { sMaxAge: 600, staleWhileRevalidate: 86_400 };

export default get(async (request) => {
  const params = new URL(request.url).searchParams;
  const scope = params.get('scope');
  const dept = params.get('dept');

  if (scope === 'university') {
    const announcements = await fetchAnnouncements(university.announcements, 'university');
    const body: AnnouncementsResponse = { source: { kind: 'university' }, announcements };
    return json(body, cache);
  }

  if (dept) {
    const department = findDepartment(dept);
    if (!department) return problem(404, `Unknown department: ${dept}`);
    const announcements = await fetchAnnouncements(department.sources.announcements, dept);
    const body: AnnouncementsResponse = {
      source: { kind: 'department', id: dept },
      announcements,
    };
    return json(body, cache);
  }

  return problem(400, 'Pass dept=<id> or scope=university');
});
