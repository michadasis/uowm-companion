import { describe, expect, it } from 'vitest';

import type { Block, Inline } from '../src/content/blocks.js';
import { parseExamGrid } from '../src/schedules/parse/examGrid.js';
import { parseExamTable } from '../src/schedules/parse/examTable.js';

const row = (...cells: string[]): Inline[] => cells.map((text) => (text ? [{ text }] : []));
const table = (rows: Inline[][]): Block => ({ type: 'table', header: null, rows });
const now = new Date('2026-08-20T12:00:00Z');

describe('parseExamGrid', () => {
  // As the Economics department sets a week of its exam schedule.
  const week = table([
    row('ΩΡΑ', 'ΔΕΥΤΕΡΑ', 'ΤΡΙΤΗ', 'ΤΕΤΑΡΤΗ'),
    row(
      '09:00 - 11:00',
      '31/8/2026 ΕΙΣΑΓΩΓΗ ΣΤΗΝ ΕΠΙΣΤΗΜΗ ΤΩΝ Η/Υ ΚΑΙ ΤΗΣ ΔΙΑΧΕΙΡΙΣΗΣ B7 ΠΛΗΡΟΦΟΡΙΩΝ Α΄ ΕΞΑΜΗΝΟ',
      '1/9/2026 ΒΑΣΕΙΣ ΚΑΙ ΔΙΑΧΕΙΡΙΣΗ ΔΕΔΟΜΕΝΩΝ B7 Β΄ ΕΞΑΜΗΝΟ ΣΙΣΙΑΣ',
      '2/9/2026',
    ),
    row(
      '11:00 - 13:00',
      'ΣΙΣΙΑΣ ΣΤΑΤΙΣΤΙΚΗ (ΑΠ) Ε4 Β΄ ΕΞΑΜΗΝΟ ΔΗΜΗΤΡΙΑΔΗΣ',
      '',
      'ΣΤΑΤΙΣΤΙΚΗ ΕΠΙΧΕΙΡΗΣΕΩΝ Β΄ ΕΞΑΜΗΝΟ ΔΡΙΤΣΑΚΗ ---------- ΟΙΚΟΝΟΜΕΤΡΙΑ Ε΄ ΕΞΑΜΗΝΟ Β7 ΛΑΣΠΙΤΑ',
    ),
  ]);

  it('reads each day’s column under its date & each sitting at its hour', () => {
    expect(parseExamGrid([week], now)).toEqual([
      {
        course: 'ΕΙΣΑΓΩΓΗ ΣΤΗΝ ΕΠΙΣΤΗΜΗ ΤΩΝ Η/Υ ΚΑΙ ΤΗΣ ΔΙΑΧΕΙΡΙΣΗΣ ΠΛΗΡΟΦΟΡΙΩΝ',
        date: '2026-08-31',
        startTime: '09:00',
        endTime: '11:00',
        room: 'B7',
        semester: 'Α΄',
        // The surname slipped into the cell below, & is given back.
        examiners: ['ΣΙΣΙΑΣ'],
      },
      {
        course: 'ΣΤΑΤΙΣΤΙΚΗ (ΑΠ)',
        date: '2026-08-31',
        startTime: '11:00',
        endTime: '13:00',
        room: 'Ε4',
        semester: 'Β΄',
        examiners: ['ΔΗΜΗΤΡΙΑΔΗΣ'],
      },
      {
        course: 'ΒΑΣΕΙΣ ΚΑΙ ΔΙΑΧΕΙΡΙΣΗ ΔΕΔΟΜΕΝΩΝ',
        date: '2026-09-01',
        startTime: '09:00',
        endTime: '11:00',
        room: 'B7',
        semester: 'Β΄',
        examiners: ['ΣΙΣΙΑΣ'],
      },
      {
        course: 'ΣΤΑΤΙΣΤΙΚΗ ΕΠΙΧΕΙΡΗΣΕΩΝ',
        date: '2026-09-02',
        startTime: '11:00',
        endTime: '13:00',
        semester: 'Β΄',
        examiners: ['ΔΡΙΤΣΑΚΗ'],
      },
      {
        course: 'ΟΙΚΟΝΟΜΕΤΡΙΑ',
        date: '2026-09-02',
        startTime: '11:00',
        endTime: '13:00',
        room: 'Β7',
        semester: 'Ε΄',
        examiners: ['ΛΑΣΠΙΤΑ'],
      },
    ]);
  });

  it('leaves a table without a weekday header alone', () => {
    expect(
      parseExamGrid([table([row('ΗΜΕΡΟΜΗΝΙΑ', 'ΩΡΑ', 'ΜΑΘΗΜΑ'), row('31/8', '9:00', 'Α')])], now),
    ).toEqual([]);
  });
});

describe('parseExamTable, courses sharing a sitting', () => {
  it('splits a cell of several coded courses, each with its examiner', () => {
    const exams = parseExamTable(
      [
        table([
          row('ΗΜΕΡΟΜΗΝΙΑ', 'ΗΜΕΡΑ', 'ΩΡΑ', 'ΜΑΘΗΜΑ', 'ΔΙΔΑΣΚΩΝ/ΔΙΔΑΣΚΟΥΣΑ'),
          row(
            '31/08/2026',
            'ΔΕΥΤΕΡΑ',
            '09:00-12:00',
            'ΠΑΡΑΓΩΓΗ ΕΚΠΑΙΔΕΥΤΙΚΟΥ ΥΛΙΚΟΥ (ΥΕ272/Υ118) ΣΤΟΙΧΕΙΑ ΑΡΙΘΜΗΤΙΚΗΣ (Υ308)',
            'ΤΑΜΟΥΤΣΕΛΗΣ ΝΙΚΟΛΑΟΣ ΝΙΚΟΛΑΝΤΩΝΑΚΗΣ ΚΩΝΣΤΑΝΤΙΝΟΣ',
          ),
          row(
            '31/08/2026',
            'ΔΕΥΤΕΡΑ',
            '12:00-15:00',
            'ΑΓΩΓΗ ΥΓΕΙΑΣ (ΕΕ334)',
            'ΤΟΣΟΥΝΙΔΗΣ ΑΝΤΩΝΙΟΣ',
          ),
        ]),
      ],
      now,
    );
    expect(exams.map((exam) => [exam.course, exam.examiners])).toEqual([
      ['ΠΑΡΑΓΩΓΗ ΕΚΠΑΙΔΕΥΤΙΚΟΥ ΥΛΙΚΟΥ (ΥΕ272/Υ118)', ['ΤΑΜΟΥΤΣΕΛΗΣ ΝΙΚΟΛΑΟΣ']],
      ['ΣΤΟΙΧΕΙΑ ΑΡΙΘΜΗΤΙΚΗΣ (Υ308)', ['ΝΙΚΟΛΑΝΤΩΝΑΚΗΣ ΚΩΝΣΤΑΝΤΙΝΟΣ']],
      ['ΑΓΩΓΗ ΥΓΕΙΑΣ (ΕΕ334)', ['ΤΟΣΟΥΝΙΔΗΣ ΑΝΤΩΝΙΟΣ']],
    ]);
  });
});
