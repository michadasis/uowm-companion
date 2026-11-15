import { nextExam } from '../nextExam';
import type { Exam } from '../schema';

const exam = (date: string | undefined, startTime?: string, course = 'Μάθημα'): Exam => ({
  course,
  ...(date ? { date } : {}),
  ...(startTime ? { startTime } : {}),
});

const now = new Date('2026-01-18T08:00:00Z');

describe('nextExam', () => {
  it('returns the soonest exam from today on', () => {
    const result = nextExam(
      [
        exam('2026-01-10', '09:00', 'past'),
        exam('2026-01-22', '12:00', 'later'),
        exam('2026-01-20', '09:00', 'soonest'),
      ],
      now,
    );
    expect(result?.course).toBe('soonest');
  });

  it('counts an exam later today as next & breaks ties by start time', () => {
    const result = nextExam(
      [exam('2026-01-18', '15:00', 'afternoon'), exam('2026-01-18', '09:00', 'morning')],
      now,
    );
    expect(result?.course).toBe('morning');
  });

  it('skips exams with no date & returns nothing when all are past', () => {
    expect(nextExam([exam(undefined, '09:00'), exam('2026-01-01', '09:00')], now)).toBeUndefined();
  });

  it('returns nothing for an empty list', () => {
    expect(nextExam([], now)).toBeUndefined();
  });
});
