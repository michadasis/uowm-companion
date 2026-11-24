/** The announcement date as "9 Νοεμβρίου 2026", or null when there is none. */
export function formatDate(iso: string | null, language: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** A short "last updated" time, e.g. "14:40", for the offline note. */
export function formatUpdatedAt(timestamp: number, language: string): string {
  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    // "09:09", not "09:09 π.μ.", whose own full stop ends up doubled in a sentence.
    hourCycle: 'h23',
  }).format(new Date(timestamp));
}

/**
 * "Σήμερα", "Χθες", "Προχθές" or "Πριν από 3 ημέρες", written out here because
 * Hermes on Android has no Intl.RelativeTimeFormat.
 */
function daysAgo(days: number, language: string): string {
  if (language === 'el') return ['Σήμερα', 'Χθες', 'Προχθές'][days] ?? `Πριν από ${days} ημέρες`;
  return ['Today', 'Yesterday'][days] ?? `${days} days ago`;
}

/**
 * A post's date as a list shows it: "Σήμερα", "Χθες" or "Πριν από 3 ημέρες"
 * within the week, then the day & month — & the year only when it isn't this
 * one.
 */
export function formatListDate(
  iso: string | null,
  language: string,
  now: Date = new Date(),
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((midnight(now) - midnight(date)) / 86_400_000);
  if (days >= 0 && days < 7) return daysAgo(days, language);
  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date);
}
