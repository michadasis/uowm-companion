import type { TFunction } from 'i18next';

import { holidayName } from '@/features/calendar/names';
import type { AcademicCalendar, CalendarHoliday } from '@/features/calendar/schema';
import { addDays, dateOf, holidaysOn, isoDay } from '@/features/calendar/status';

/**
 * Why the restaurant may be closed on a day, read from the academic calendar:
 * a break the university takes (Christmas, Easter), a single holiday (the
 * university's or the city's own), the summer between the spring exams & the
 * September resits, or the first week of the resits, when it may not have
 * opened again yet. The restaurant publishes no dates of its own, so the
 * notice only ever says it may be closed.
 */
export type Closure =
  | { kind: 'christmas' | 'easter'; holiday: CalendarHoliday }
  | { kind: 'holiday'; holiday: CalendarHoliday }
  | { kind: 'summer' }
  | { kind: 'reopening' };

const reopeningDays = 7;

export function closureOn(
  calendar: AcademicCalendar,
  date: Date,
  city: string | null,
): Closure | null {
  const [holiday] = holidaysOn(calendar, date, city);
  if (holiday) {
    if (holiday.key === 'christmas' || holiday.key === 'easter') {
      return { kind: holiday.key, holiday };
    }
    return { kind: 'holiday', holiday };
  }

  const iso = isoDay(date);
  const springExams = calendar.periods.find((p) => p.kind === 'exams' && p.term === 'spring');
  const resits = calendar.periods.find((p) => p.kind === 'resits');
  if (springExams && resits) {
    if (iso > springExams.to && iso < resits.from) return { kind: 'summer' };
    const reopened = isoDay(addDays(dateOf(resits.from), reopeningDays));
    if (iso >= resits.from && iso < reopened) return { kind: 'reopening' };
  }
  return null;
}

/** The notice for a closure, in the reader's language. */
export function closureMessage(closure: Closure, t: TFunction): string {
  if (closure.kind === 'holiday' && closure.holiday.key === 'local') {
    return t('menu.closure.local');
  }
  if (closure.kind === 'holiday') {
    return t('menu.closure.holiday', { name: holidayName(closure.holiday, t) });
  }
  return t(`menu.closure.${closure.kind}`);
}
