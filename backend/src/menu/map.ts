import type {
  BreakfastGroup,
  BreakfastRow,
  Meal,
  MenuDay,
  MenuItemRow,
  MenuMetaRow,
  MenuResponse,
} from './types.js';
import { currentCycleWeek } from './week.js';

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const courses = ['first', 'main', 'extra'] as const;
// The order the restaurant prints breakfast in; anything else follows.
const categoryOrder = ['drinks', 'spreads', 'breads', 'staples'];

function byPosition<T extends { position: number }>(a: T, b: T): number {
  return a.position - b.position;
}

function mealFrom(rows: MenuItemRow[], day: string, meal: string): Meal {
  const pick = (course: string) =>
    rows
      .filter((r) => r.day_name === day && r.meal_type === meal && r.course === course)
      .sort(byPosition)
      .map((r) => ({ el: r.item_gr, en: r.item_en }));
  return { first: pick('first'), main: pick('main'), extra: pick('extra') };
}

function hasAnything(meal: Meal): boolean {
  return courses.some((course) => meal[course].length > 0);
}

/**
 * Builds the menu response for one week out of the rows read from the
 * database: the days that actually have food, in week order, with breakfast
 * given once since it does not change from day to day.
 */
export function buildMenuResponse(
  meta: MenuMetaRow,
  items: MenuItemRow[],
  breakfast: BreakfastRow[],
  options: { week: number; now: Date },
): MenuResponse {
  const weekRows = items.filter((row) => row.week_num === options.week);

  const days: MenuDay[] = [];
  for (const day of dayOrder) {
    const lunch = mealFrom(weekRows, day, 'lunch');
    const dinner = mealFrom(weekRows, day, 'dinner');
    if (hasAnything(lunch) || hasAnything(dinner)) days.push({ day, lunch, dinner });
  }

  const groups = new Map<string, BreakfastGroup>();
  for (const row of [...breakfast].sort(byPosition)) {
    const group = groups.get(row.category) ?? { category: row.category, items: [] };
    group.items.push({ el: row.item_gr, en: row.item_en });
    groups.set(row.category, group);
  }
  const breakfastGroups = [...groups.values()].sort(
    (a, b) => categoryRank(a.category) - categoryRank(b.category),
  );

  return {
    cycleWeeks: meta.cycle_weeks,
    week: options.week,
    currentWeek: currentCycleWeek(options.now, meta.cycle_weeks),
    days,
    breakfast: breakfastGroups,
    sourceUrl: meta.source_pdf_url,
  };
}

function categoryRank(category: string): number {
  const index = categoryOrder.indexOf(category);
  return index === -1 ? categoryOrder.length : index;
}
