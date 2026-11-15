// The restaurant menu is a fixed cycle of weeks that repeats. Which week is
// "this week" is counted from a known Monday, the same anchor the myCS app
// used, so the two agree. The week offset the watcher applied is already
// baked into the stored week numbers, so it is not reapplied here.
const anchor = Date.UTC(2025, 0, 6); // Monday 6 January 2025
const msPerWeek = 7 * 24 * 60 * 60 * 1000;

/** The cycle week (1..cycleWeeks) that the given date falls in. */
export function currentCycleWeek(now: Date, cycleWeeks: number): number {
  if (cycleWeeks < 1) return 1;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const weeksElapsed = Math.floor((today - anchor) / msPerWeek);
  return (((weeksElapsed % cycleWeeks) + cycleWeeks) % cycleWeeks) + 1;
}
