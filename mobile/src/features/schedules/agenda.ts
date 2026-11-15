import type { Exam } from './schema';

export interface ExamDay {
  /** ISO date (no time). */
  date: string;
  exams: Exam[];
}

/**
 * Groups exams by day, keeping the document's order within a day & ordering
 * the days themselves. Exams with no date are gathered under an empty key at
 * the end, so nothing is lost.
 */
export function groupByDay(exams: Exam[]): ExamDay[] {
  const byDate = new Map<string, Exam[]>();
  for (const exam of exams) {
    const key = exam.date ?? '';
    const list = byDate.get(key);
    if (list) list.push(exam);
    else byDate.set(key, [exam]);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => {
      if (a === '') return 1;
      if (b === '') return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    })
    .map(([date, dayExams]) => ({ date, exams: dayExams }));
}

/** "Δευτέρα 31 Αυγούστου", or null for the no-date group. */
export function formatDayHeading(date: string, language: string): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(parsed);
}

export function formatTimeRange(exam: Exam): string | null {
  if (!exam.startTime) return null;
  return exam.endTime ? `${exam.startTime} - ${exam.endTime}` : exam.startTime;
}
