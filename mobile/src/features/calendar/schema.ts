import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const calendarPeriodSchema = z.object({
  kind: z.enum(['teaching', 'exams', 'resits', 'break']),
  term: z.enum(['winter', 'spring']).nullable(),
  from: isoDate,
  to: isoDate,
  name: z.string(),
});

export const holidayKeys = [
  'national-day',
  'polytechnic',
  'christmas',
  'three-hierarchs',
  'carnival',
  'clean-monday',
  'easter',
  'may-day',
  'whit-monday',
  'local',
] as const;

export const calendarHolidaySchema = z.object({
  from: isoDate,
  to: isoDate,
  name: z.string(),
  // A key this build doesn't know yet reads as none, & the holiday goes by name.
  key: z.enum(holidayKeys).nullable().catch(null),
  cities: z.array(z.string()).optional(),
});

export const academicCalendarSchema = z.object({
  academicYear: z.string(),
  periods: z.array(calendarPeriodSchema),
  holidays: z.array(calendarHolidaySchema),
  source: z.object({ url: z.string(), label: z.string() }),
});

export type CalendarPeriod = z.infer<typeof calendarPeriodSchema>;
export type CalendarHoliday = z.infer<typeof calendarHolidaySchema>;
export type AcademicCalendar = z.infer<typeof academicCalendarSchema>;
