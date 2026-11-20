import type { CityId } from '../registry/index.js';

/**
 * A stretch of the academic year: weeks of teaching, an exam period, the
 * September resits, or a week left empty between them.
 */
export interface CalendarPeriod {
  kind: 'teaching' | 'exams' | 'resits' | 'break';
  term: 'winter' | 'spring' | null;
  /** Inclusive, YYYY-MM-DD. */
  from: string;
  to: string;
  /** As the decision words it, e.g. "Χειμερινό εξάμηνο". */
  name: string;
}

/** Holidays the app can name in either language; others go by `name`. */
export type HolidayKey =
  | 'national-day'
  | 'polytechnic'
  | 'christmas'
  | 'three-hierarchs'
  | 'carnival'
  | 'clean-monday'
  | 'easter'
  | 'may-day'
  | 'whit-monday'
  | 'local';

/** A day or run of days with no classes. */
export interface CalendarHoliday {
  /** Inclusive, YYYY-MM-DD. */
  from: string;
  to: string;
  /** As the decision words it, e.g. "Επέτειος Εξέγερσης του Πολυτεχνείου". */
  name: string;
  key: HolidayKey | null;
  /** Only these cities keep it; absent, the whole university does. */
  cities?: CityId[];
}

export interface AcademicCalendar {
  /** "2026-2027". */
  academicYear: string;
  periods: CalendarPeriod[];
  holidays: CalendarHoliday[];
  source: { url: string; label: string };
}
