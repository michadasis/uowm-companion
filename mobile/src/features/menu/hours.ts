import type { MealKind } from './schema';

// When the restaurant serves, the same in every city, from the university's
// page on its restaurants: breakfast 08:00–09:30 on weekdays & 09:00–10:00
// at the weekend, lunch 12:00–15:30, dinner 18:00–21:00.
const breakfastEnds = { weekday: 9 * 60 + 30, weekend: 10 * 60 };
const lunchEnds = 15 * 60 + 30;

/**
 * The meal being served now, or the next one: breakfast until it ends, lunch
 * until 15:30, dinner after that. The menu opens on it.
 */
export function mealFor(now: Date): MealKind {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const weekend = now.getDay() === 0 || now.getDay() === 6;
  if (minutes < breakfastEnds[weekend ? 'weekend' : 'weekday']) return 'breakfast';
  if (minutes < lunchEnds) return 'lunch';
  return 'dinner';
}
