import { buildDirectory } from '../src/departments/directory.js';
import { get, json } from '../src/http/respond.js';

// The directory only changes with a deployment, and a deployment replaces
// what the CDN holds, so it can be cached for a long time.
export default get(() =>
  json(buildDirectory(), { sMaxAge: 86_400, staleWhileRevalidate: 604_800 }),
);
