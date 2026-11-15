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
  }).format(new Date(timestamp));
}
