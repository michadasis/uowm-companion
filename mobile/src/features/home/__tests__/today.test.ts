import i18n from '@/i18n';

import type { AcademicCalendar } from '@/features/calendar/schema';
import { dayStatus } from '@/features/calendar/status';

import { onDay, todayMessage } from '../today';

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
  ],
  holidays: [
    {
      from: '2026-11-17',
      to: '2026-11-17',
      name: 'Επέτειος Εξέγερσης του Πολυτεχνείου',
      key: 'polytechnic',
    },
    { from: '2026-12-24', to: '2027-01-06', name: 'Διακοπές Χριστουγέννων', key: 'christmas' },
  ],
};

const at = (iso: string) => new Date(`${iso}T10:00`);
const say = (iso: string) => {
  const now = at(iso);
  return todayMessage(dayStatus(calendar, now, 'kozani'), now, 'el', i18n.t);
};

beforeAll(async () => {
  await i18n.changeLanguage('el');
});

describe('todayMessage', () => {
  it('names a holiday & says when classes resume', () => {
    expect(say('2026-11-17')).toEqual({
      tone: 'rest',
      badge: 'Αργία',
      title: 'Επέτειος του Πολυτεχνείου',
      message: 'Σήμερα δεν γίνονται μαθήματα· ξαναρχίζουν αύριο.',
    });
  });

  it('wishes happy holidays over Christmas, back on Thursday 7 January', () => {
    expect(say('2026-12-28')).toMatchObject({
      title: 'Καλές γιορτές!',
      message: 'Τα μαθήματα ξαναρχίζουν την Πέμπτη 7 Ιανουαρίου.',
    });
  });

  it('wishes luck in the exams & warns of a holiday coming', () => {
    expect(say('2027-01-20')).toMatchObject({ tone: 'exams', title: 'Καλή επιτυχία!' });
    expect(say('2026-11-16').message).toBe(
      'Αύριο δεν γίνονται μαθήματα: Επέτειος του Πολυτεχνείου.',
    );
  });

  it('greets the weekend & the study week before the exams', () => {
    expect(say('2026-11-21')).toMatchObject({
      title: 'Καλό Σαββατοκύριακο!',
      message: 'Τα μαθήματα ξαναρχίζουν τη Δευτέρα 23 Νοεμβρίου.',
    });
    expect(say('2027-01-12')).toMatchObject({
      title: 'Εβδομάδα διαβάσματος',
      message: 'Η εξεταστική ξεκινάει τη Δευτέρα 18 Ιανουαρίου.',
    });
  });

  it('falls back to a plain greeting while the calendar is unknown', () => {
    expect(todayMessage(null, at('2026-11-20'), 'el', i18n.t)).toEqual({
      tone: 'calm',
      title: 'Καλημέρα',
    });
  });
});

describe('onDay', () => {
  it('puts the right article before each weekday', () => {
    const now = at('2026-11-20');
    expect(onDay(at('2026-11-23'), now, 'el', i18n.t)).toBe('τη Δευτέρα 23 Νοεμβρίου');
    expect(onDay(at('2026-11-24'), now, 'el', i18n.t)).toBe('την Τρίτη 24 Νοεμβρίου');
    expect(onDay(at('2026-11-28'), now, 'el', i18n.t)).toBe('το Σάββατο 28 Νοεμβρίου');
    expect(onDay(at('2026-11-21'), now, 'el', i18n.t)).toBe('αύριο');
  });
});
