import { fold } from '@/lib/greek';

import type { CourseFilter, StudentCourse } from './types';

// Small words that come & go between two spellings of the same title:
// "Εισαγωγή σε Υπολογιστές" & "Εισαγωγή στους Υπολογιστές" are one course.
const stopwords = new Set([
  'και',
  'σε',
  'στο',
  'στον',
  'στην',
  'στουσ',
  'στισ',
  'στα',
  'με',
  'του',
  'τησ',
  'των',
  'το',
  'τον',
  'την',
  'οι',
  'τα',
  'η',
  'ο',
  'για',
  'απο',
]);

// Latin letters typed in place of the Greek ones they look like — a timetable
// can say "IΙ" with one of each. Both sides get the same mapping, so a title
// that really is in English still matches itself.
const lookalikes: Record<string, string> = {
  a: 'α',
  b: 'β',
  e: 'ε',
  h: 'η',
  i: 'ι',
  k: 'κ',
  m: 'μ',
  n: 'ν',
  o: 'ο',
  p: 'ρ',
  t: 'τ',
  x: 'χ',
  y: 'υ',
  z: 'ζ',
};

/**
 * A comparison key for a course title, so the same course matches across the
 * schedule document & the information system however each spells it. Universis
 * writes "ΠΙΘΑΝΟΤΗΤΕΣ - ΣΤΑΤΙΣΤΙΚΗ" where the timetable has
 * "Πιθανότητες-Στατιστική (ΑΠ)": the key drops case, accents, punctuation, a
 * trailing note in brackets or a lab's "-ΑΠ" suffix, & the small joining words.
 */
export function courseKey(name: string): string {
  return fold(name.replace(/\s*\([^)]*\)\s*$/u, ''))
    .replace(/[a-z]/g, (letter) => lookalikes[letter] ?? letter)
    .replace(/[-–\s]+απ$/u, '')
    .replace(/&/g, ' και ')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token !== '' && !stopwords.has(token))
    .join(' ');
}

/**
 * The keys of every course a title names. An exam line can hold two courses
 * that are examined together, written "Α / Β"; either one should match.
 */
export function courseKeys(name: string): string[] {
  return name
    .split('/')
    .map(courseKey)
    .filter((key) => key !== '');
}

/** Something in the schedule that names a course, like a class or an exam. */
interface HasCourse {
  course: string;
}

/**
 * The set of course keys the schedule should keep for a filter, or null when
 * the filter is `all` & nothing should be hidden. `owed` keeps courses not yet
 * passed; `registered` keeps the current declaration.
 */
export function selectedCourseKeys(
  courses: StudentCourse[],
  filter: CourseFilter,
): Set<string> | null {
  if (filter === 'all') return null;
  const keep = (course: StudentCourse): boolean =>
    filter === 'owed' ? !course.passed : course.registered === true;
  return new Set(courses.filter(keep).flatMap((course) => courseKeys(course.name)));
}

/**
 * Keeps only the schedule items whose course is in the selected set. A null set
 * (the `all` filter) keeps everything. Items whose course the information system
 * does not list are left out of a narrowed view, since the student is not taking
 * them.
 */
export function filterByCourses<T extends HasCourse>(items: T[], keys: Set<string> | null): T[] {
  if (!keys) return items;
  return items.filter((item) => courseKeys(item.course).some((key) => keys.has(key)));
}
