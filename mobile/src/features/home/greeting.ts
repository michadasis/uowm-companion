export type DayPart = 'morning' | 'afternoon' | 'evening';

/** Which greeting fits the hour: morning until noon, evening from six. */
export function dayPart(date: Date): DayPart {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

/** The date as a student would say it, such as "Σάββατο 14 Νοεμβρίου". */
export function formatToday(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}
