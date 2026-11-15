const dayIndex: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

// 5 January 2025 is a Sunday; adding the weekday index lands on that weekday,
// so a day name can be formatted without carrying a real date around.
const sundayAnchor = Date.UTC(2025, 0, 5);

/** A localized weekday name, e.g. "Δευτέρα" or short "Δευ", for a day key. */
export function dayLabel(day: string, language: string, length: 'long' | 'short'): string {
  const index = dayIndex[day];
  if (index === undefined) return day;
  const date = new Date(sundayAnchor + index * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat(language, { weekday: length, timeZone: 'UTC' }).format(date);
}
