import i18n from '@/i18n';
import type { AcademicCalendar } from '@/features/calendar/schema';

import { closureMessage, closureOn } from '../closure';

// Parts of the 2026–27 calendar as the backend serves it.
const calendar: AcademicCalendar = {
  academicYear: '2026-2027',
  periods: [
    { kind: 'teaching', term: 'winter', from: '2026-09-28', to: '2026-12-23', name: 'Χειμερινό' },
    { kind: 'exams', term: 'spring', from: '2027-06-07', to: '2027-06-25', name: 'Εξεταστική' },
    { kind: 'resits', term: null, from: '2027-08-30', to: '2027-09-24', name: 'Επαναληπτική' },
  ],
  holidays: [
    { from: '2026-10-28', to: '2026-10-28', name: 'Εθνική εορτή', key: 'national-day' },
    {
      from: '2026-11-11',
      to: '2026-11-11',
      name: 'Αργία για την πόλη της Καστοριάς',
      key: 'local',
      cities: ['kastoria'],
    },
    { from: '2026-12-24', to: '2027-01-06', name: 'Διακοπές Χριστουγέννων', key: 'christmas' },
    { from: '2027-04-26', to: '2027-05-09', name: 'Διακοπές Πάσχα', key: 'easter' },
  ],
  source: { url: 'https://www.uowm.gr/', label: 'ΠΔΜ' },
};

const on = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12);
const t = i18n.t.bind(i18n);

describe('closureOn', () => {
  it('says nothing on an ordinary day', () => {
    expect(closureOn(calendar, on(2026, 11, 23), 'kastoria')).toBeNull();
  });

  it('covers the Christmas & Easter breaks from end to end', () => {
    expect(closureOn(calendar, on(2026, 12, 23), null)).toBeNull();
    expect(closureOn(calendar, on(2026, 12, 24), null)?.kind).toBe('christmas');
    expect(closureOn(calendar, on(2027, 1, 6), null)?.kind).toBe('christmas');
    expect(closureOn(calendar, on(2027, 1, 7), null)).toBeNull();
    expect(closureOn(calendar, on(2027, 5, 1), null)?.kind).toBe('easter');
  });

  it("names a single holiday, the city's own only in that city", () => {
    expect(closureOn(calendar, on(2026, 10, 28), null)).toMatchObject({
      kind: 'holiday',
      holiday: { key: 'national-day' },
    });
    expect(closureOn(calendar, on(2026, 11, 11), 'kastoria')?.kind).toBe('holiday');
    expect(closureOn(calendar, on(2026, 11, 11), 'kozani')).toBeNull();
  });

  it('takes the summer from the end of the spring exams to the September resits', () => {
    expect(closureOn(calendar, on(2027, 6, 25), null)).toBeNull();
    expect(closureOn(calendar, on(2027, 6, 26), null)?.kind).toBe('summer');
    expect(closureOn(calendar, on(2027, 8, 29), null)?.kind).toBe('summer');
  });

  it('warns over the first week of the resits that it may not have opened yet', () => {
    expect(closureOn(calendar, on(2027, 8, 30), null)?.kind).toBe('reopening');
    expect(closureOn(calendar, on(2027, 9, 5), null)?.kind).toBe('reopening');
    expect(closureOn(calendar, on(2027, 9, 6), null)).toBeNull();
  });
});

describe('closureMessage', () => {
  it('words each kind, naming a single holiday', () => {
    const message = (year: number, month: number, day: number) =>
      closureMessage(closureOn(calendar, on(year, month, day), 'kastoria')!, t);

    expect(message(2026, 10, 28)).toBe(
      'Η λέσχη μπορεί να είναι κλειστή λόγω αργίας: Εθνική εορτή.',
    );
    expect(message(2026, 11, 11)).toBe('Η λέσχη μπορεί να είναι κλειστή λόγω της τοπικής αργίας.');
    expect(message(2026, 12, 25)).toBe(
      'Η λέσχη μπορεί να είναι κλειστή λόγω των διακοπών των Χριστουγέννων.',
    );
    expect(message(2027, 7, 15)).toBe(
      'Η λέσχη μπορεί να είναι κλειστή για τις καλοκαιρινές διακοπές.',
    );
  });
});
