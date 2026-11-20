import { departments } from './registry/index.js';

export const warmCategories = ['announcements', 'timetable', 'exams', 'menu', 'calendar'] as const;
export type WarmCategory = (typeof warmCategories)[number];

/**
 * The public paths a category's data is read at, every department's that
 * has it. Requesting them through the CDN keeps each one's cached copy fresh,
 * so a student opening the app never waits on a slow department site.
 */
export function warmPaths(category: WarmCategory): string[] {
  switch (category) {
    case 'announcements':
      return [
        '/api/announcements?scope=university',
        ...departments.map((d) => `/api/announcements?dept=${d.id}`),
      ];
    case 'timetable':
      return departments
        .filter((d) => d.sources.timetable)
        .map((d) => `/api/timetable?dept=${d.id}`);
    case 'exams':
      return departments.filter((d) => d.sources.exams).map((d) => `/api/exams?dept=${d.id}`);
    case 'menu':
      return ['/api/menu'];
    case 'calendar':
      return ['/api/calendar'];
  }
}

export interface WarmResult {
  path: string;
  status: number | null;
  ms: number;
}

/** Requests each path from `origin`, a few at a time, & reports how each went. */
export async function warm(
  origin: string,
  paths: string[],
  fetcher: typeof fetch = fetch,
  concurrency = 5,
): Promise<WarmResult[]> {
  const results: WarmResult[] = new Array<WarmResult>(paths.length);
  let next = 0;
  async function worker() {
    while (next < paths.length) {
      const index = next++;
      const path = paths[index]!;
      const started = Date.now();
      try {
        const response = await fetcher(`${origin}${path}`, {
          signal: AbortSignal.timeout(50_000),
        });
        // Read the body through, so the CDN stores the whole response.
        await response.arrayBuffer();
        results[index] = { path, status: response.status, ms: Date.now() - started };
      } catch {
        results[index] = { path, status: null, ms: Date.now() - started };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, paths.length) }, worker));
  return results;
}
