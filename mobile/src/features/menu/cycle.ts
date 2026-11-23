import type { MenuDay, MenuResponse } from './schema';

const msPerDay = 24 * 60 * 60 * 1000;

/** A calendar date as a day count, so daylight saving can't shift it. */
function dayNumber(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month, day) / msPerDay);
}

/**
 * The cycle week (1..cycleWeeks) a date falls in, counted on the phone's
 * calendar from the Monday the backend names as week 1.
 */
export function cycleWeekFor(date: Date, cycleWeeks: number, anchor: string): number {
  if (cycleWeeks < 1) return 1;
  const [year, month, day] = anchor.split('-').map(Number) as [number, number, number];
  const elapsed =
    dayNumber(date.getFullYear(), date.getMonth(), date.getDate()) -
    dayNumber(year, month - 1, day);
  const weeks = Math.floor(elapsed / 7);
  return (((weeks % cycleWeeks) + cycleWeeks) % cycleWeeks) + 1;
}

/**
 * The days of the week a date falls in. Worked out here from every week of
 * the cycle, so a menu kept from days ago still shows the right week; a
 * response from before the backend sent them all only has its own week.
 */
export function daysForDate(menu: MenuResponse, date: Date): MenuDay[] {
  if (!menu.weeks || !menu.cycleAnchor) return menu.days;
  const week = cycleWeekFor(date, menu.cycleWeeks, menu.cycleAnchor);
  return menu.weeks.find((w) => w.week === week)?.days ?? [];
}
