import type { Exam } from './schema';

/**
 * The soonest exam from today on, for the Home screen. Exams with no date
 * can't be placed in time, so they're skipped. "Today" counts: an exam later
 * today is still next.
 */
export function nextExam(exams: Exam[], now = new Date()): Exam | undefined {
  const today = now.toISOString().slice(0, 10);
  return exams
    .filter((exam): exam is Exam & { date: string } => Boolean(exam.date) && exam.date! >= today)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return (a.startTime ?? '').localeCompare(b.startTime ?? '');
    })[0];
}
