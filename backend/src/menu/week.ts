// The restaurant menu is a fixed cycle of weeks that repeats. Which week is
// "this week" is counted from Monday 8 September 2025, week 1 of the menu
// as served, as generic-restaurant-app counts it. Counting from
// 6 January 2025, as this did before, put the menu a week behind. The week
// offset the watcher applied is already baked into the stored week numbers,
// so it is not reapplied here.
//
// The app counts the same way on the phone from `cycleAnchor`, so a menu it
// has kept shows the right week whatever day it is opened on.
export const cycleAnchor = '2025-09-08';

const anchor = Date.parse(`${cycleAnchor}T00:00:00Z`);
const msPerWeek = 7 * 24 * 60 * 60 * 1000;

const athensDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Athens',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * The day it is in Greece, as midnight UTC of that date. A new week starts
 * at midnight there, not at midnight UTC two or three hours later.
 */
function dayInGreece(now: Date): number {
  return Date.parse(`${athensDate.format(now)}T00:00:00Z`);
}

/** The cycle week (1..cycleWeeks) that the given moment falls in, in Greece. */
export function currentCycleWeek(now: Date, cycleWeeks: number): number {
  if (cycleWeeks < 1) return 1;
  const weeksElapsed = Math.floor((dayInGreece(now) - anchor) / msPerWeek);
  return (((weeksElapsed % cycleWeeks) + cycleWeeks) % cycleWeeks) + 1;
}
