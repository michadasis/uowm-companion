import { formatDayHeading, formatTimeRange, groupByDay } from '../agenda';
import type { Exam } from '../schema';

const exam = (over: Partial<Exam>): Exam => ({ course: 'Μάθημα', ...over });

describe('groupByDay', () => {
  it('groups exams under their day & orders the days', () => {
    const groups = groupByDay([
      exam({ course: 'Β', date: '2026-09-08' }),
      exam({ course: 'Α', date: '2026-08-31' }),
      exam({ course: 'Γ', date: '2026-08-31' }),
    ]);

    expect(groups).toEqual([
      {
        date: '2026-08-31',
        exams: [
          exam({ course: 'Α', date: '2026-08-31' }),
          exam({ course: 'Γ', date: '2026-08-31' }),
        ],
      },
      { date: '2026-09-08', exams: [exam({ course: 'Β', date: '2026-09-08' })] },
    ]);
  });

  it('keeps the document order of exams within a day', () => {
    const groups = groupByDay([
      exam({ course: 'first', date: '2026-08-31', startTime: '09:00' }),
      exam({ course: 'second', date: '2026-08-31', startTime: '13:00' }),
    ]);
    expect(groups[0]?.exams.map((e) => e.course)).toEqual(['first', 'second']);
  });

  it('gathers undated exams at the end', () => {
    const groups = groupByDay([
      exam({ course: 'no date' }),
      exam({ course: 'dated', date: '2026-08-31' }),
    ]);
    expect(groups.map((g) => g.date)).toEqual(['2026-08-31', '']);
  });
});

describe('formatDayHeading', () => {
  it('writes the weekday, day & month, and nothing for the undated group', () => {
    expect(formatDayHeading('2026-08-31', 'el')).toBe('Δευτέρα 31 Αυγούστου');
    expect(formatDayHeading('2026-08-31', 'en')).toBe('Monday, August 31');
    expect(formatDayHeading('', 'el')).toBeNull();
  });
});

describe('formatTimeRange', () => {
  it('joins the start & end, or shows the start alone', () => {
    expect(formatTimeRange(exam({ startTime: '09:00', endTime: '11:00' }))).toBe('09:00 - 11:00');
    expect(formatTimeRange(exam({ startTime: '09:00' }))).toBe('09:00');
    expect(formatTimeRange(exam({}))).toBeNull();
  });
});
