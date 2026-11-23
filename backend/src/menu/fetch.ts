import { query } from './db.js';
import { buildMenuResponse } from './map.js';
import type { BreakfastRow, MenuItemRow, MenuMetaRow, MenuResponse } from './types.js';
import { currentCycleWeek } from './week.js';

function clampWeek(week: number, cycleWeeks: number): number {
  if (!Number.isInteger(week) || week < 1) return 1;
  return week > cycleWeeks ? cycleWeeks : week;
}

/**
 * Reads the restaurant menu from the database: one week, by default the
 * current one in the cycle, & every week beside it. Returns null when there is no menu stored,
 * so the caller can say so rather than show an empty week. The menu is the
 * same across the university's cities, so it takes no city.
 */
export async function fetchMenu(options: {
  week?: number;
  now: Date;
}): Promise<MenuResponse | null> {
  const [meta] = await query<MenuMetaRow>(
    'select cycle_weeks, source_pdf_url from menu_meta where id = 1',
  );
  if (!meta) return null;

  const week = clampWeek(
    options.week ?? currentCycleWeek(options.now, meta.cycle_weeks),
    meta.cycle_weeks,
  );

  // Every week, not just the requested one: the cycle is a few weeks of a
  // few dishes a day, and the app shows any of them.
  const items = await query<MenuItemRow>(
    'select week_num, day_name, meal_type, course, position, item_gr, item_en from menu_items',
  );
  const breakfast = await query<BreakfastRow>(
    'select category, position, item_gr, item_en from breakfast_items',
  );

  return buildMenuResponse(meta, items, breakfast, { week, now: options.now });
}
