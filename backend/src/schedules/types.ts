import type { Block } from '../content/blocks.js';
import type { DocumentFormat } from '../documents/types.js';

export type ScheduleKind = 'exams' | 'timetable';

/**
 * A structured exam, parsed from the schedule document. Fields are optional
 * because a parser keeps what it can read & leaves the rest; an exam with
 * only a course and a date is still worth showing. Parsing fills this in a
 * later step — for now the list is empty and the Original view carries the
 * content.
 */
/**
 * The optional Pedagogical & Teaching Proficiency programme (ΠΔΕ) a student may
 * take alongside the regular curriculum. Its courses sit outside the semester
 * ladder, so they are tagged rather than numbered.
 */
export type CourseTrack = 'pde';

export interface Exam {
  course: string;
  /** ISO date, no time. */
  date?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  semester?: string;
  track?: CourseTrack;
  examiners?: string[];
}

export interface ClassSession {
  course: string;
  /** 1 (Monday) to 7 (Sunday). */
  day?: number;
  startTime?: string;
  endTime?: string;
  room?: string;
  type?: string;
  semester?: string;
  track?: CourseTrack;
  teacher?: string;
}

export interface ScheduleDocument {
  url: string;
  label: string;
  format: DocumentFormat;
}

export interface ScheduleResponse {
  dept: string;
  kind: ScheduleKind;
  /** False when the department publishes no such schedule we can reach. */
  available: boolean;
  document: ScheduleDocument | null;
  /** Structured items, filled by the parser in a later step. */
  exams: Exam[];
  classes: ClassSession[];
  /** The document rendered natively, the Original view. */
  original: Block[];
}
