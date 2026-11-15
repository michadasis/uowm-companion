import type { ClassSession } from '../schema';
import {
  byWeekday,
  formatClassTime,
  minutesOf,
  nowAndNext,
  semestersOf,
  todayWeekday,
  weekdayLabel,
  weekdayShort,
} from '../timetable';

const session = (day: number, startTime: string, course: string, endTime?: string): ClassSession => ({
  course,
  day,
  startTime,
  ...(endTime ? { endTime } : {}),
});

describe('byWeekday', () => {
  it('keeps only days with classes & sorts days and their classes by time', () => {
    const grouped = byWeekday([
      session(3, '13:00', 'Γ'),
      session(1, '11:00', 'Β'),
      session(1, '09:00', 'Α'),
    ]);

    expect(grouped.map((d) => d.day)).toEqual([1, 3]);
    expect(grouped[0]!.classes.map((c) => c.course)).toEqual(['Α', 'Β']);
  });

  it('drops classes with no weekday', () => {
    expect(byWeekday([{ course: 'Χωρίς μέρα' }])).toEqual([]);
  });
});

describe('semestersOf', () => {
  it('lists each semester once, in first-seen order, skipping classes without one', () => {
    expect(
      semestersOf([
        { course: 'Α', day: 1, semester: 'Γ΄' },
        { course: 'Β', day: 1, semester: 'Α΄' },
        { course: 'Γ', day: 2, semester: 'Γ΄' },
        { course: 'Δ', day: 3 },
      ]),
    ).toEqual(['Γ΄', 'Α΄']);
  });
});

describe('todayWeekday', () => {
  it('numbers Monday 1 through Sunday 7', () => {
    expect(todayWeekday(new Date('2026-01-19T08:00:00'))).toBe(1); // Monday
    expect(todayWeekday(new Date('2026-01-18T08:00:00'))).toBe(7); // Sunday
  });
});

describe('weekday names', () => {
  it('are localised', () => {
    expect(weekdayLabel(1, 'el')).toBe('Δευτέρα');
    expect(weekdayLabel(1, 'en')).toBe('Monday');
    expect(weekdayShort(5, 'en')).toBe('Fri');
  });
});

describe('minutesOf', () => {
  it('reads an HH:MM time & rejects a missing or malformed one', () => {
    expect(minutesOf('09:30')).toBe(570);
    expect(minutesOf(undefined)).toBeNull();
    expect(minutesOf('nope')).toBeNull();
  });
});

describe('formatClassTime', () => {
  it('shows a range, or just the start when there is no end', () => {
    expect(formatClassTime(session(1, '09:00', 'Α', '10:00'))).toBe('09:00 - 10:00');
    expect(formatClassTime(session(1, '09:00', 'Α'))).toBe('09:00');
  });
});

describe('nowAndNext', () => {
  const day = [
    session(1, '09:00', 'Α', '10:00'),
    session(1, '11:00', 'Β', '12:00'),
    session(1, '13:00', 'Γ', '14:00'),
  ];

  it('marks the class in progress and the one after it', () => {
    const { nowIndex, nextIndex } = nowAndNext(day, 11 * 60 + 30);
    expect(nowIndex).toBe(1);
    expect(nextIndex).toBe(2);
  });

  it('marks only the next class when none is in progress', () => {
    const { nowIndex, nextIndex } = nowAndNext(day, 10 * 60 + 30);
    expect(nowIndex).toBe(-1);
    expect(nextIndex).toBe(1);
  });

  it('finds neither once the day is over', () => {
    expect(nowAndNext(day, 15 * 60)).toEqual({ nowIndex: -1, nextIndex: -1 });
  });
});
