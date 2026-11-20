import { nextClass } from '@/features/schedules/timetable';

import type { AcademicCalendar } from '../schema';
import { dayStatus, isTeachingDay, nextTeachingDay } from '../status';

// The 2026-2027 calendar, as the backend serves it, trimmed.
const calendar: AcademicCalendar = {
  academicYear: '2026-2027',
  source: { url: 'https://www.uowm.gr/x.pdf', label: '2026-2027' },
  periods: [
    {
      kind: 'teaching',
      term: 'winter',
      from: '2026-09-28',
      to: '2026-12-23',
      name: 'Χειμερινό εξάμηνο',
    },
    {
      kind: 'teaching',
      term: 'winter',
      from: '2027-01-07',
      to: '2027-01-08',
      name: 'Χειμερινό εξάμηνο',
    },
    { kind: 'break', term: null, from: '2027-01-11', to: '2027-01-15', name: 'Κενή εβδομάδα' },
    { kind: 'exams', term: 'winter', from: '2027-01-18', to: '2027-02-05', name: 'Εξεταστική' },
    {
      kind: 'teaching',
      term: 'spring',
      from: '2027-02-15',
      to: '2027-04-23',
      name: 'Εαρινό εξάμηνο',
    },
  ],
  holidays: [
    {
      from: '2026-11-11',
      to: '2026-11-11',
      name: 'Αργία για την πόλη της Καστοριάς',
      key: 'local',
      cities: ['kastoria'],
    },
    {
      from: '2026-11-17',
      to: '2026-11-17',
      name: 'Επέτειος Εξέγερσης του Πολυτεχνείου',
      key: 'polytechnic',
    },
    { from: '2026-12-24', to: '2027-01-06', name: 'Διακοπές Χριστουγέννων', key: 'christmas' },
  ],
};

const day = (iso: string, hour = 10) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!, hour);
};

describe('isTeachingDay', () => {
  it('holds classes on a term weekday, not on a holiday, a weekend or in exams', () => {
    expect(isTeachingDay(calendar, day('2026-11-16'), 'kozani')).toBe(true);
    expect(isTeachingDay(calendar, day('2026-11-17'), 'kozani')).toBe(false);
    expect(isTeachingDay(calendar, day('2026-11-21'), 'kozani')).toBe(false);
    expect(isTeachingDay(calendar, day('2027-01-20'), 'kozani')).toBe(false);
  });

  it("keeps a city's own holiday for that city only", () => {
    expect(isTeachingDay(calendar, day('2026-11-11'), 'kastoria')).toBe(false);
    expect(isTeachingDay(calendar, day('2026-11-11'), 'kozani')).toBe(true);
  });

  it('finds when classes resume after the Christmas break', () => {
    expect(nextTeachingDay(calendar, day('2026-12-24'), 'kozani')?.getDate()).toBe(7);
  });
});

describe('dayStatus', () => {
  it('names the holiday, & the day classes resume', () => {
    const status = dayStatus(calendar, day('2026-11-17'), 'kozani');
    expect(status).toMatchObject({ kind: 'holiday', holiday: { key: 'polytechnic' } });
    expect(status.kind === 'holiday' && status.resumes?.getDate()).toBe(18);
  });

  it('calls the Christmas break a vacation, back on 7 January', () => {
    const status = dayStatus(calendar, day('2026-12-28'), 'kozani');
    expect(status.kind).toBe('vacation');
    expect(status.kind === 'vacation' && status.resumes?.toDateString()).toBe(
      day('2027-01-07').toDateString(),
    );
  });

  it('greets a weekend of the term, & tells a teaching day of a holiday coming', () => {
    expect(dayStatus(calendar, day('2026-11-14'), 'kozani')).toMatchObject({
      kind: 'weekend',
      during: 'teaching',
    });
    expect(dayStatus(calendar, day('2026-11-16'), 'kozani')).toMatchObject({
      kind: 'teaching',
      aheadHoliday: { holiday: { key: 'polytechnic' } },
    });
  });

  it('knows the exam period, the empty week before it & the time between terms', () => {
    expect(dayStatus(calendar, day('2027-01-20'), 'kozani')).toMatchObject({ kind: 'exams' });
    expect(dayStatus(calendar, day('2027-01-12'), 'kozani')).toMatchObject({
      kind: 'gap',
      next: { kind: 'exams' },
    });
    expect(dayStatus(calendar, day('2026-09-10'), 'kozani')).toMatchObject({
      kind: 'off',
      next: { kind: 'teaching' },
    });
    // A Saturday between terms is no weekend of the term.
    expect(dayStatus(calendar, day('2026-09-12'), 'kozani')).toMatchObject({ kind: 'off' });
  });
});

describe('nextClass with the calendar', () => {
  const tuesday = { course: 'Βάσεις Δεδομένων', day: 2, startTime: '09:00', endTime: '11:00' };

  it('skips a holiday', () => {
    // Monday 16 November: the next Tuesday is the 17th, Polytechnic day.
    const next = nextClass([tuesday], day('2026-11-16'), (date) =>
      isTeachingDay(calendar, date, 'kozani'),
    );
    expect(next?.daysAhead).toBe(8);
  });

  it('skips the Christmas break & the exam period, to the spring term', () => {
    const next = nextClass([tuesday], day('2027-01-09'), (date) =>
      isTeachingDay(calendar, date, 'kozani'),
    );
    // Saturday 9 January → Tuesday 16 February.
    expect(next?.daysAhead).toBe(38);
  });
});
