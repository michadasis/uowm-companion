import { cycleWeekFor, daysForDate } from '../cycle';
import type { MenuDay, MenuResponse } from '../schema';

const anchor = '2025-09-08';

function day(name: string, main: string): MenuDay {
  const none = { first: [], main: [], extra: [] };
  return { day: name, lunch: { ...none, main: [{ el: main, en: main }] }, dinner: none };
}

const menu: MenuResponse = {
  cycleWeeks: 2,
  week: 1,
  currentWeek: 1,
  days: [day('monday', 'Φακές')],
  weeks: [
    { week: 1, days: [day('monday', 'Φακές')] },
    { week: 2, days: [day('monday', 'Ψάρι')] },
  ],
  cycleAnchor: anchor,
  breakfast: [],
  sourceUrl: null,
};

describe('cycleWeekFor', () => {
  it('counts weeks from the anchor Monday, wrapping around the cycle', () => {
    expect(cycleWeekFor(new Date(2025, 8, 8, 9), 2, anchor)).toBe(1);
    expect(cycleWeekFor(new Date(2025, 8, 14, 23), 2, anchor)).toBe(1);
    expect(cycleWeekFor(new Date(2025, 8, 15, 0, 5), 2, anchor)).toBe(2);
    expect(cycleWeekFor(new Date(2025, 8, 29, 12), 4, anchor)).toBe(4);
  });

  it('counts back before the anchor too', () => {
    expect(cycleWeekFor(new Date(2025, 8, 1, 12), 2, anchor)).toBe(2);
  });

  it('agrees with the restaurant app on Monday 23 November 2026', () => {
    expect(cycleWeekFor(new Date(2026, 10, 23, 8), 2, anchor)).toBe(2);
  });

  it('is not thrown off by the clocks changing', () => {
    // The clocks go back on 26 October 2025; that week is still one week.
    expect(cycleWeekFor(new Date(2025, 9, 26, 23), 2, anchor)).toBe(1);
    expect(cycleWeekFor(new Date(2025, 9, 27, 0, 30), 2, anchor)).toBe(2);
  });
});

describe('daysForDate', () => {
  it('picks the week the date falls in from every week of the cycle', () => {
    expect(daysForDate(menu, new Date(2025, 8, 8, 12))[0]?.lunch.main[0]?.el).toBe('Φακές');
    expect(daysForDate(menu, new Date(2025, 8, 15, 12))[0]?.lunch.main[0]?.el).toBe('Ψάρι');
  });

  it('falls back to the one week a menu kept from an older backend has', () => {
    const { weeks: _weeks, cycleAnchor: _anchor, ...older } = menu;
    expect(daysForDate(older, new Date(2025, 8, 15, 12))).toBe(older.days);
  });
});
