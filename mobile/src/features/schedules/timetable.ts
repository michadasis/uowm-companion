import type { ClassSession } from './schema';

export interface WeekdayClasses {
  /** 1 = Monday … 7 = Sunday. */
  day: number;
  classes: ClassSession[];
}

/** The semesters present in a set of classes, in the order they first appear. */
export function semestersOf(classes: ClassSession[]): string[] {
  const seen: string[] = [];
  for (const session of classes) {
    if (session.semester && !seen.includes(session.semester)) seen.push(session.semester);
  }
  return seen;
}

/** Minutes since midnight for an "HH:MM" time, or null when it is missing. */
export function minutesOf(time?: string): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function startMinutes(session: ClassSession): number {
  return minutesOf(session.startTime) ?? Number.MAX_SAFE_INTEGER;
}

/**
 * Groups classes by weekday, keeping only days that have any & ordering both
 * the days & each day's classes by start time, so the view can show one day at
 * a time in reading order.
 */
export function byWeekday(classes: ClassSession[]): WeekdayClasses[] {
  const byDay = new Map<number, ClassSession[]>();
  for (const session of classes) {
    const day = session.day ?? 0;
    if (day < 1) continue;
    const list = byDay.get(day);
    if (list) list.push(session);
    else byDay.set(day, [session]);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, list]) => ({
      day,
      classes: [...list].sort((a, b) => startMinutes(a) - startMinutes(b)),
    }));
}

/** Today as 1 = Monday … 7 = Sunday, to match the stored day numbers. */
export function todayWeekday(now: Date = new Date()): number {
  const day = now.getDay();
  return day === 0 ? 7 : day;
}

/** A localised weekday name, e.g. "Δευτέρα" or "Monday", for day 1…7. */
export function weekdayLabel(day: number, language: string): string {
  // 1 January 2024 was a Monday; stepping from it gives each weekday's name.
  const date = new Date(Date.UTC(2024, 0, day));
  return new Intl.DateTimeFormat(language, { weekday: 'long', timeZone: 'UTC' }).format(date);
}

/** A short localised weekday name, e.g. "Δευ" or "Mon", for the day chips. */
export function weekdayShort(day: number, language: string): string {
  const date = new Date(Date.UTC(2024, 0, day));
  return new Intl.DateTimeFormat(language, { weekday: 'short', timeZone: 'UTC' }).format(date);
}

export function formatClassTime(session: ClassSession): string | null {
  if (!session.startTime) return null;
  return session.endTime ? `${session.startTime} - ${session.endTime}` : session.startTime;
}

/**
 * The class happening now & the one coming next within a single day's sorted
 * classes, by index. "Now" is a class whose span covers the moment; "next" is
 * the first class that starts after it. Either can be -1.
 */
export function nowAndNext(
  classes: ClassSession[],
  nowMinutes: number,
): { nowIndex: number; nextIndex: number } {
  let nowIndex = -1;
  classes.forEach((session, index) => {
    const start = minutesOf(session.startTime);
    const end = minutesOf(session.endTime);
    if (start === null || end === null) return;
    if (nowMinutes >= start && nowMinutes < end) nowIndex = index;
  });

  const nextIndex = classes.findIndex((session) => {
    const start = minutesOf(session.startTime);
    return start !== null && start > nowMinutes;
  });

  return { nowIndex, nextIndex };
}
