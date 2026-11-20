import { get, json, problem } from '../src/http/respond.js';
import { warm, warmCategories, warmPaths } from '../src/warm.js';
import type { WarmCategory } from '../src/warm.js';

// A scheduler calls this once per category, rather than once per department.
// The answer is itself cached for a few minutes, so calling it again & again
// sends no extra traffic to the department sites.
const cache = { sMaxAge: 300, staleWhileRevalidate: 0 };

export default get(async (request) => {
  const url = new URL(request.url);
  const category = url.searchParams.get('category') as WarmCategory | null;
  if (!category || !warmCategories.includes(category)) {
    return problem(400, `Pass category=${warmCategories.join('|')}`);
  }

  const started = Date.now();
  const results = await warm(url.origin, warmPaths(category));
  const failed = results.filter((r) => r.status === null || r.status >= 500);
  return json(
    {
      category,
      warmed: results.length - failed.length,
      failed: failed.map((r) => ({ path: r.path, status: r.status })),
      ms: Date.now() - started,
    },
    cache,
  );
});
