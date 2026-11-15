/**
 * A student's course as the University's information system (Universis) knows
 * it, normalised to just what we need to decide whether to show it in the
 * schedule. The raw API carries far more; the grades client maps it down to
 * this.
 */
export interface StudentCourse {
  /** The course's display code, e.g. "Π-Α-01"; not always present. */
  code?: string;
  /** The course title, as Universis spells it. */
  name: string;
  /** "Υ" compulsory, "Ε" elective, and so on. */
  type?: string;
  ects?: number;
  /** The numeric grade, when the course has been graded. */
  grade?: number;
  /** True once the student has passed the course. */
  passed: boolean;
  /** True while the course is in the student's current registration. */
  registered?: boolean;
  /** The semester the course sits in, 1-based. */
  semester?: number;
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
