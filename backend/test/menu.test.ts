import { describe, expect, it } from 'vitest';

import { buildMenuResponse } from '../src/menu/map.js';
import type { BreakfastRow, MenuItemRow, MenuMetaRow } from '../src/menu/types.js';
import { currentCycleWeek } from '../src/menu/week.js';

describe('currentCycleWeek', () => {
  it('counts weeks from the anchor Monday, wrapping around the cycle', () => {
    // 6 Jan 2025 is the anchor (week 1 of a 2-week cycle).
    expect(currentCycleWeek(new Date('2025-01-06T10:00:00Z'), 2)).toBe(1);
    expect(currentCycleWeek(new Date('2025-01-12T10:00:00Z'), 2)).toBe(1);
    expect(currentCycleWeek(new Date('2025-01-13T10:00:00Z'), 2)).toBe(2);
    expect(currentCycleWeek(new Date('2025-01-20T10:00:00Z'), 2)).toBe(1);
  });

  it('works for a longer cycle & before the anchor', () => {
    expect(currentCycleWeek(new Date('2025-01-27T00:00:00Z'), 4)).toBe(4);
    expect(currentCycleWeek(new Date('2024-12-30T00:00:00Z'), 2)).toBe(2);
  });
});

const meta: MenuMetaRow = { cycle_weeks: 2, source_pdf_url: 'https://uowm.gr/menu.pdf' };

function item(over: Partial<MenuItemRow>): MenuItemRow {
  return {
    week_num: 1,
    day_name: 'monday',
    meal_type: 'lunch',
    course: 'main',
    position: 1,
    item_gr: 'Φαγητό',
    item_en: 'Food',
    ...over,
  };
}

const breakfast: BreakfastRow[] = [
  { category: 'breads', position: 1, item_gr: 'Ψωμί', item_en: 'Bread' },
  { category: 'drinks', position: 1, item_gr: 'Τσάι', item_en: 'Tea' },
  { category: 'drinks', position: 2, item_gr: 'Γάλα', item_en: 'Milk' },
];

describe('buildMenuResponse', () => {
  const now = new Date('2025-01-06T10:00:00Z');

  it('lays the week out by day, meal & course', () => {
    const menu = buildMenuResponse(
      meta,
      [
        item({ course: 'first', position: 1, item_gr: 'Σούπα', item_en: 'Soup' }),
        item({ course: 'main', position: 2, item_gr: 'Ρύζι', item_en: 'Rice' }),
        item({ course: 'main', position: 1, item_gr: 'Κοτόπουλο', item_en: 'Chicken' }),
        item({ meal_type: 'dinner', course: 'extra', item_gr: 'Φρούτο', item_en: 'Fruit' }),
      ],
      breakfast,
      { week: 1, now },
    );

    expect(menu.days).toHaveLength(1);
    expect(menu.days[0]).toMatchObject({
      day: 'monday',
      lunch: {
        first: [{ el: 'Σούπα', en: 'Soup' }],
        main: [
          { el: 'Κοτόπουλο', en: 'Chicken' },
          { el: 'Ρύζι', en: 'Rice' },
        ],
        extra: [],
      },
      dinner: { first: [], main: [], extra: [{ el: 'Φρούτο', en: 'Fruit' }] },
    });
  });

  it('keeps only the requested week & orders the days Monday first', () => {
    const menu = buildMenuResponse(
      meta,
      [
        item({ week_num: 1, day_name: 'wednesday' }),
        item({ week_num: 1, day_name: 'monday' }),
        item({ week_num: 2, day_name: 'tuesday' }),
      ],
      [],
      { week: 1, now },
    );

    expect(menu.days.map((d) => d.day)).toEqual(['monday', 'wednesday']);
  });

  it('groups breakfast by category in the printed order & reports the current week', () => {
    const menu = buildMenuResponse(meta, [], breakfast, { week: 2, now });

    expect(menu.breakfast).toEqual([
      {
        category: 'drinks',
        items: [
          { el: 'Τσάι', en: 'Tea' },
          { el: 'Γάλα', en: 'Milk' },
        ],
      },
      { category: 'breads', items: [{ el: 'Ψωμί', en: 'Bread' }] },
    ]);
    expect(menu).toMatchObject({
      cycleWeeks: 2,
      week: 2,
      currentWeek: 1,
      sourceUrl: meta.source_pdf_url,
    });
  });
});
