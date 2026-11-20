import type { AcademicCalendar, CalendarHoliday, CalendarPeriod } from './schema';

/** A day as the calendar writes it, in the phone's own time zone. */
export function isoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Noon on a calendar day, so adding days never trips over a clock change. */
export function dateOf(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year!, month! - 1, day!, 12);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
  return next;
}

const within = (iso: string, span: { from: string; to: string }) =>
  iso >= span.from && iso <= span.to;

const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

/** The holidays a city keeps on a day: the university's & its own. */
export function holidaysOn(
  calendar: AcademicCalendar,
  date: Date,
  city: string | null,
): CalendarHoliday[] {
  const iso = isoDay(date);
  return calendar.holidays.filter(
    (holiday) =>
      within(iso, holiday) && (!holiday.cities || (city !== null && holiday.cities.includes(city))),
  );
}

export function periodOn(calendar: AcademicCalendar, date: Date): CalendarPeriod | undefined {
  const iso = isoDay(date);
  return calendar.periods.find((period) => within(iso, period));
}

/** Whether classes are held on a day: a weekday of a teaching term, no holiday. */
export function isTeachingDay(
  calendar: AcademicCalendar,
  date: Date,
  city: string | null,
): boolean {
  if (isWeekend(date)) return false;
  if (periodOn(calendar, date)?.kind !== 'teaching') return false;
  return holidaysOn(calendar, date, city).length === 0;
}

/** The first day classes are held from `date` on (itself included), within a year. */
export function nextTeachingDay(
  calendar: AcademicCalendar,
  date: Date,
  city: string | null,
): Date | undefined {
  for (let offset = 0; offset <= 366; offset++) {
    const day = addDays(date, offset);
    if (isTeachingDay(calendar, day, city)) return day;
  }
  return undefined;
}

// Breaks that run over days, which a student plans around: "the holidays".
const vacationKeys = new Set(['christmas', 'easter']);

/**
 * What kind of day it is for a student, for the Home screen to greet them
 * with: a holiday, the Christmas or Easter break, a weekend, an exam period,
 * the empty week before one, an ordinary teaching day, or the summer.
 */
export type DayStatus =
  | { kind: 'vacation'; holiday: CalendarHoliday; resumes?: Date }
  | { kind: 'holiday'; holiday: CalendarHoliday; resumes?: Date }
  | { kind: 'weekend'; during: CalendarPeriod['kind'] | null; resumes?: Date }
  | { kind: 'exams'; period: CalendarPeriod }
  | { kind: 'gap'; next?: CalendarPeriod }
  | { kind: 'teaching'; aheadHoliday?: { holiday: CalendarHoliday; date: Date } }
  | { kind: 'off'; next?: CalendarPeriod };

export function dayStatus(calendar: AcademicCalendar, now: Date, city: string | null): DayStatus {
  const today = addDays(now, 0);
  const iso = isoDay(today);
  const period = periodOn(calendar, today);
  const resumes = () => nextTeachingDay(calendar, addDays(today, 1), city);

  const [holiday] = holidaysOn(calendar, today, city);
  if (holiday) {
    const kind = holiday.key && vacationKeys.has(holiday.key) ? 'vacation' : 'holiday';
    return {
      kind,
      holiday,
      resumes: period?.kind === 'teaching' || kind === 'vacation' ? resumes() : undefined,
    };
  }
  // A weekend of the summer is still the summer.
  if (isWeekend(today) && period) {
    return {
      kind: 'weekend',
      during: period?.kind ?? null,
      resumes: period?.kind === 'teaching' ? resumes() : undefined,
    };
  }
  if (period?.kind === 'exams' || period?.kind === 'resits') return { kind: 'exams', period };
  if (period?.kind === 'break') {
    return { kind: 'gap', next: calendar.periods.find((next) => next.from > iso) };
  }
  if (period?.kind === 'teaching') {
    // A day off in the coming week is worth a word ahead of time.
    for (let offset = 1; offset <= 7; offset++) {
      const day = addDays(today, offset);
      if (isWeekend(day)) continue;
      const [ahead] = holidaysOn(calendar, day, city);
      if (ahead) return { kind: 'teaching', aheadHoliday: { holiday: ahead, date: day } };
    }
    return { kind: 'teaching' };
  }
  return { kind: 'off', next: calendar.periods.find((next) => next.from > iso) };
}
