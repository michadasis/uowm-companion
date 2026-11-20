import { fetchCalendar } from '../src/calendar/fetch.js';
import { get, json, problem } from '../src/http/respond.js';

// The calendar is decided once a year & amended rarely: the CDN holds it for
// a day & a stale copy for a month.
const cache = { sMaxAge: 86_400, staleWhileRevalidate: 2_592_000 };

export default get(async () => {
  const calendar = await fetchCalendar();
  if (!calendar) return problem(404, 'No academic calendar is published');
  return json(calendar, cache);
});
