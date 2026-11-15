export interface MenuItem {
  el: string;
  en: string;
}

/** One meal: a first course, main dishes & the extra (sweet or fruit). */
export interface Meal {
  first: MenuItem[];
  main: MenuItem[];
  extra: MenuItem[];
}

export interface MenuDay {
  /** Lowercase English day name, monday..sunday. */
  day: string;
  lunch: Meal;
  dinner: Meal;
}

export interface BreakfastGroup {
  category: string;
  items: MenuItem[];
}

export interface MenuResponse {
  cycleWeeks: number;
  /** The week this response holds, 1..cycleWeeks. */
  week: number;
  /** The week that is current now, so the app can mark or default to it. */
  currentWeek: number;
  days: MenuDay[];
  /** Breakfast is the same every day, so it is given once. */
  breakfast: BreakfastGroup[];
  sourceUrl: string | null;
}

// --- the shapes read from the database ---

export interface MenuMetaRow {
  cycle_weeks: number;
  source_pdf_url: string | null;
}

export interface MenuItemRow {
  week_num: number;
  day_name: string;
  meal_type: string;
  course: string;
  position: number;
  item_gr: string;
  item_en: string;
}

export interface BreakfastRow {
  category: string;
  position: number;
  item_gr: string;
  item_en: string;
}
