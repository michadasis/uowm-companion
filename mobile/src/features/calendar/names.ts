import type { TFunction } from 'i18next';

import type { AcademicCalendar, CalendarHoliday } from './schema';
import { holidaysOn, periodOn } from './status';

/** A holiday's name in the reader's language, falling back to the decision's wording. */
export function holidayName(holiday: CalendarHoliday, t: TFunction): string {
  return holiday.key ? t(`calendar.holidays.${holiday.key}`) : holiday.name;
}

/**
 * Why there are no classes on a weekday, in a few words — a holiday, the exam
 * period, a break between terms — or null when classes are held as usual.
 */
export function dayOffReason(
  calendar: AcademicCalendar,
  date: Date,
  city: string | null,
  t: TFunction,
): string | null {
  const [holiday] = holidaysOn(calendar, date, city);
  if (holiday) return holidayName(holiday, t);
  const period = periodOn(calendar, date);
  if (period?.kind === 'teaching') return null;
  if (period?.kind === 'exams' || period?.kind === 'resits') return t('calendar.off.exams');
  if (period?.kind === 'break') return t('calendar.off.break');
  return t('calendar.off.term');
}
