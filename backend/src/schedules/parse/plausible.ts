import type { ClassSession, Exam } from '../types.js';

// A course name that holds a date or a time range is a parse that ran two
// cells or two lines together.
const dateOrTime = /\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2}/;

function wellNamed(course: string): boolean {
  const words = course.split(/\s+/).length;
  return course.length >= 3 && course.length <= 140 && words <= 18 && !dateOrTime.test(course);
}

const share = <T>(items: T[], test: (item: T) => boolean): number =>
  items.length ? items.filter(test).length / items.length : 0;

/**
 * Whether exams a parser read out of a document can be trusted enough to show
 * as an agenda. A parser fed a layout it doesn't know — a PDF's table flattened
 * to lines — can still find "exams", but with dates missing & names run
 * together; then the document itself, shown as written, serves a student
 * better than a wrong agenda.
 */
export function plausibleExams(exams: Exam[]): boolean {
  if (exams.length < 3) return false;
  return (
    share(exams, (exam) => exam.date !== undefined) >= 0.95 &&
    share(exams, (exam) => wellNamed(exam.course)) >= 0.9
  );
}

/** The same check for a timetable's classes. */
export function plausibleClasses(classes: ClassSession[]): boolean {
  if (classes.length < 3) return false;
  return (
    share(classes, (session) => session.day !== undefined && session.startTime !== undefined) >=
      0.9 && share(classes, (session) => wellNamed(session.course)) >= 0.9
  );
}
