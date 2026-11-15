import { fold } from '@/lib/greek';

import type { CourseFilter, StudentCourse } from './types';

/**
 * A comparison key for a course title: folded (no case, accents or final
 * sigma) and stripped of a trailing parenthetical like "(ΑΠ)" or
 * "(Φροντιστήριο)", so the same course matches across the schedule document &
 * the information system even when one carries an extra note.
 */
export function courseKey(name: string): string {
  return fold(name.replace(/\s*\([^)]*\)\s*$/u, ''));
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
  return new Set(courses.filter(keep).map((course) => courseKey(course.name)));
}

/**
 * Keeps only the schedule items whose course is in the selected set. A null set
 * (the `all` filter) keeps everything. Items whose course the information system
 * does not list are left out of a narrowed view, since the student is not taking
 * them.
 */
export function filterByCourses<T extends HasCourse>(items: T[], keys: Set<string> | null): T[] {
  if (!keys) return items;
  return items.filter((item) => keys.has(courseKey(item.course)));
}
