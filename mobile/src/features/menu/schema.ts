import { z } from 'zod';

const menuItem = z.object({ el: z.string(), en: z.string() });

const meal = z.object({
  first: z.array(menuItem),
  main: z.array(menuItem),
  extra: z.array(menuItem),
});

const menuDay = z.object({
  day: z.string(),
  lunch: meal,
  dinner: meal,
});

const menuWeek = z.object({
  week: z.number(),
  days: z.array(menuDay),
});

const breakfastGroup = z.object({
  category: z.string(),
  items: z.array(menuItem),
});

export const menuResponseSchema = z.object({
  cycleWeeks: z.number(),
  week: z.number(),
  currentWeek: z.number(),
  days: z.array(menuDay),
  // Missing from a menu kept from before the backend sent every week.
  weeks: z.array(menuWeek).optional(),
  cycleAnchor: z.string().optional(),
  breakfast: z.array(breakfastGroup),
  sourceUrl: z.string().nullable(),
});

export type MenuItem = z.infer<typeof menuItem>;
export type Meal = z.infer<typeof meal>;
export type MenuDay = z.infer<typeof menuDay>;
export type BreakfastGroup = z.infer<typeof breakfastGroup>;
export type MenuResponse = z.infer<typeof menuResponseSchema>;

export type MealKind = 'breakfast' | 'lunch' | 'dinner';
export const courses = ['first', 'main', 'extra'] as const;
export type Course = (typeof courses)[number];
