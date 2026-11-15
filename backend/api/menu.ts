import { fetchMenu } from '../src/menu/fetch.js';
import { get, json, problem } from '../src/http/respond.js';

// The menu changes a few times a semester, so the CDN holds it for an hour &
// a stale copy for a week. The current week is recomputed each time the
// origin is hit.
const cache = { sMaxAge: 3_600, staleWhileRevalidate: 604_800 };

export default get(async (request) => {
  const params = new URL(request.url).searchParams;

  const weekParam = params.get('week');
  let week: number | undefined;
  if (weekParam !== null) {
    week = Number(weekParam);
    if (!Number.isInteger(week) || week < 1) return problem(400, 'week must be a positive integer');
  }

  // city is accepted for a stable URL shape, but the menu is the same in every
  // city, so it does not change the result.
  const menu = await fetchMenu({ week, now: new Date() });
  if (!menu) return problem(404, 'No menu is available');

  return json(menu, cache);
});
