/**
 * A student's course as the University's information system (Universis) knows
 * it, normalised to what the app shows: whether to keep it in the schedule, &
 * its line on the grades screen. The raw API carries far more; the client maps
 * it down to this.
 */
export interface StudentCourse {
  /** The course's display code, e.g. "Π-Α-01"; not always present. */
  code?: string;
  /** The course title, as Universis spells it. */
  name: string;
  /** "Υ" compulsory, "Ε" elective, and so on. */
  type?: string;
  /** True once the student has passed the course. */
  passed: boolean;
  /** True while the course is on the student's current declaration. */
  registered?: boolean;
  /** The semester the course sits in, 1-based. */
  semester?: number;
  /** The grade out of 10, once the course has been graded — passed or not. */
  grade?: number;
  /** The exam period it was graded in, e.g. "ΦΕΒΡ 2025-2026". */
  gradedIn?: string;
  ects?: number;
  /** The course's weight in the degree mark. */
  coefficient?: number;
}

/**
 * Which of the student's courses the schedule should show:
 * - `all` — no filter, every class and exam;
 * - `owed` — courses not yet passed, electives from earlier semesters included,
 *   which is everything the student still has to sit;
 * - `registered` — the courses on the student's latest submitted declaration
 *   (Universis "Προηγούμενες Δηλώσεις"), not a declaration still being drafted.
 */
export type CourseFilter = 'all' | 'owed' | 'registered';
