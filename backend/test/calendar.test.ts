import { describe, expect, it } from 'vitest';

import { academicYearOf, calendarCandidates } from '../src/calendar/fetch.js';
import { parseCalendar } from '../src/calendar/parse.js';

// The lines of the Senate's decision on 2026-2027, as its PDF reads.
const decision = [
  'Έγκριση Ακαδημαϊκού Ημερολογίου έτους 2026-2027',
  'αποφασίζει ομόφωνα την έγκριση Ακαδημαϊκού Ημερολογίου έτους 2026-2027 ως ακολούθως:',
  'Χειμερινό εξάμηνο (13 εβδομάδες μαθημάτων) 28/09/2026 – 23/12/2026',
  '07/01/2027 - 08/01/2027',
  'Εξεταστική περίοδος χειμερινού εξαμήνου (3 εβδομάδες,',
  'περιλαμβάνεται και η εξεταστική για τους επί πτυχίω φοιτητές) 18/01/2027 – 05/02/2027',
  'Εαρινό εξάμηνο (13 εβδομάδες μαθημάτων) 15/02/2027 – 23/04/2027',
  '10/05/2027 - 28/05/2027',
  'Εξεταστική περίοδος εαρινού εξαμήνου (3 εβδομάδες,',
  'περιλαμβάνεται και η εξεταστική για τους επί πτυχίω φοιτητές)',
  '07/06/2027 – 25/06/2027',
  'Επαναληπτική εξεταστική περίοδος Σεπτεμβρίου 2027 (4',
  'εβδομάδες) 30/08/2027 – 24/09/2027',
  'Σημείωση :',
  '• Μετά τη λήξη του Χειμερινού εξαμήνου και πριν την έναρξη της εξεταστικής περιόδου υπάρχει μία (1)',
  'κενή εβδομάδα (11/01/2027 – 15/01/2027)',
  'ΗΜΕΡΕΣ ΕΟΡΤΩΝ ΚΑΙ ΑΡΓΙΩΝ',
  '▪ Τετάρτη 28 Οκτωβρίου 2026 (Εθνική εορτή)',
  '▪ Τρίτη 17 Νοεμβρίου 2026 (Επέτειος Εξέγερσης του Πολυτεχνείου)',
  '▪ 24 Δεκεμβρίου 2026 έως και 6 Ιανουαρίου 2027 (Διακοπές Χριστουγέννων)',
  '▪ 26 Απριλίου έως 09 Μαΐου 2027 (Διακοπές Πάσχα)',
  '▪ Πρωτομαγιά',
  'Ακαδημαϊκό Ημερολόγιο ακαδημαϊκού έτους 2026-2027',
  'Σελίδα 4 από 4',
  '▪ 21 Ιουνίου 2027 (Αγίου Πνεύματος)',
  '▪ Κυριακή 11 Οκτωβρίου 2026 και Κυριακή 6 Δεκεμβρίου 2026: Αργίες για την πόλη της Κοζάνης',
  '▪ Τετάρτη 11 Νοεμβρίου 2026: Αργία για την πόλη της Καστοριάς',
  'Στη συνέχεια επειδή δεν υπάρχει άλλο θέμα, λύεται η συνεδρίαση',
];

describe('parseCalendar', () => {
  const calendar = parseCalendar(decision)!;

  it('reads each term, its exam period & the resits, a name wrapped over lines kept whole', () => {
    expect(calendar.academicYear).toBe('2026-2027');
    expect(calendar.periods).toEqual([
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
      {
        kind: 'exams',
        term: 'winter',
        from: '2027-01-18',
        to: '2027-02-05',
        name: 'Εξεταστική περίοδος χειμερινού εξαμήνου',
      },
      {
        kind: 'teaching',
        term: 'spring',
        from: '2027-02-15',
        to: '2027-04-23',
        name: 'Εαρινό εξάμηνο',
      },
      {
        kind: 'teaching',
        term: 'spring',
        from: '2027-05-10',
        to: '2027-05-28',
        name: 'Εαρινό εξάμηνο',
      },
      {
        kind: 'exams',
        term: 'spring',
        from: '2027-06-07',
        to: '2027-06-25',
        name: 'Εξεταστική περίοδος εαρινού εξαμήνου',
      },
      {
        kind: 'resits',
        term: null,
        from: '2027-08-30',
        to: '2027-09-24',
        name: 'Επαναληπτική εξεταστική περίοδος Σεπτεμβρίου 2027',
      },
    ]);
  });

  it('reads holidays, ranges with a year left off, a dateless May Day & each city’s own', () => {
    expect(calendar.holidays).toEqual([
      {
        from: '2026-10-11',
        to: '2026-10-11',
        name: 'Αργίες για την πόλη της Κοζάνης',
        key: 'local',
        cities: ['kozani'],
      },
      { from: '2026-10-28', to: '2026-10-28', name: 'Εθνική εορτή', key: 'national-day' },
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
      {
        from: '2026-12-06',
        to: '2026-12-06',
        name: 'Αργίες για την πόλη της Κοζάνης',
        key: 'local',
        cities: ['kozani'],
      },
      { from: '2026-12-24', to: '2027-01-06', name: 'Διακοπές Χριστουγέννων', key: 'christmas' },
      { from: '2027-04-26', to: '2027-05-09', name: 'Διακοπές Πάσχα', key: 'easter' },
      { from: '2027-05-01', to: '2027-05-01', name: 'Πρωτομαγιά', key: 'may-day' },
      { from: '2027-06-21', to: '2027-06-21', name: 'Αγίου Πνεύματος', key: 'whit-monday' },
    ]);
  });

  it('gives nothing for a document that is no calendar decision', () => {
    expect(parseCalendar(['Ανακοίνωση', 'Κείμενο'])).toBeNull();
  });
});

describe('finding the calendar decision', () => {
  it('keeps the Greek decisions for a year, not the English leaflets', () => {
    const page = `
      <a href="https://www.uowm.gr/wp-content/uploads/2026/03/ΣΤ07_Έγκριση-Ακαδημαϊκού-Ημερολογίου-έτους-2026-2027_signed.pdf">2026-2027</a>
      <a href="https://www.uowm.gr/wp-content/uploads/2024/06/UoWM_Calendar_2024_2025-en.pdf">EN</a>
      <a href="https://www.uowm.gr/to-panepistimio/">Το Πανεπιστήμιο</a>`;
    expect(
      calendarCandidates(page, 'https://www.uowm.gr/').map((c) => [c.year, c.uploaded]),
    ).toEqual([[2026, 202603]]);
  });

  it('turns to the new academic year in October, after the September resits', () => {
    expect(academicYearOf(new Date('2027-09-20T12:00:00Z'))).toBe(2026);
    expect(academicYearOf(new Date('2027-10-01T12:00:00Z'))).toBe(2027);
  });
});
