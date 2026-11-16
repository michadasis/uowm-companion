import { describe, expect, it } from 'vitest';

import type { Block, Inline } from '../src/content/blocks.js';
import { parseExamTable } from '../src/schedules/parse/examTable.js';
import { plausibleExams } from '../src/schedules/parse/plausible.js';

const row = (...cells: string[]): Inline[] => cells.map((text) => (text ? [{ text }] : []));
const table = (rows: Inline[][]): Block => ({ type: 'table', header: null, rows });

describe('parseExamTable', () => {
  it('reads a headed exam table, carrying each day down its rows', () => {
    const exams = parseExamTable(
      [
        table([
          row('ΗΜΕΡΟΜΗΝΙΑ', 'ΩΡΑ ΕΞΕΤΑΣΗΣ', 'ΜΑΘΗΜΑΤΑ', 'ΕΞΑΜΗΝΟ', 'ΕΙΣΗΓΗΤΗΣ', 'ΑΙΘΟΥΣΑ'),
          row(
            'ΔΕΥΤΕΡΑ 31/8',
            '9:00-11:00',
            'ΗΛΕΚΤΡΟΝΙΚΗ ΔΙΑΚΥΒΕΡΝΗΣΗ',
            '6ο ΕΞΑΜΗΝΟ',
            'ΤΡΙΑΝΤΑΦΥΛΛΙΔΟΥ',
            'ΜΕΓΑΛΟ ΑΜΦΙΘΕΑΤΡΟ',
          ),
          row('', '11:00-13:00', 'ΣΤΡΑΤΗΓΙΚΗ', '8ο ΕΞΑΜΗΝΟ', 'ΤΡΙΑΝΤΑΦΥΛΛΙΔΟΥ', 'ΑΙΘΟΥΣΑ Β9'),
          row('ΤΡΙΤΗ 1/9', '9:00-11:00', 'ΑΓΓΛΙΚΑ', '3ο ΕΞΑΜΗΝΟ', '', ''),
        ]),
      ],
      new Date('2026-11-17T12:00:00Z'),
    );

    expect(exams).toEqual([
      {
        course: 'ΗΛΕΚΤΡΟΝΙΚΗ ΔΙΑΚΥΒΕΡΝΗΣΗ',
        date: '2026-08-31',
        startTime: '09:00',
        endTime: '11:00',
        room: 'ΜΕΓΑΛΟ ΑΜΦΙΘΕΑΤΡΟ',
        semester: 'ΣΤ΄',
        examiners: ['ΤΡΙΑΝΤΑΦΥΛΛΙΔΟΥ'],
      },
      {
        course: 'ΣΤΡΑΤΗΓΙΚΗ',
        date: '2026-08-31',
        startTime: '11:00',
        endTime: '13:00',
        room: 'ΑΙΘΟΥΣΑ Β9',
        semester: 'Η΄',
        examiners: ['ΤΡΙΑΝΤΑΦΥΛΛΙΔΟΥ'],
      },
      {
        course: 'ΑΓΓΛΙΚΑ',
        date: '2026-09-01',
        startTime: '09:00',
        endTime: '11:00',
        semester: 'Γ΄',
      },
    ]);
  });

  it('places a February date in the coming year when read in November', () => {
    const [exam] = parseExamTable(
      [table([row('Ημερομηνία', 'Ώρα', 'Μάθημα'), row('2/2', '09:00', 'Φυσική')])],
      new Date('2026-11-17T12:00:00Z'),
    );
    expect(exam?.date).toBe('2027-02-02');
  });

  it('ignores a table without a course column', () => {
    expect(parseExamTable([table([row('Α', 'Β'), row('1', '2')])])).toEqual([]);
  });
});

describe('plausibleExams', () => {
  const exam = (course: string, date?: string) => ({ course, ...(date ? { date } : {}) });

  it('trusts an agenda whose exams are dated & cleanly named', () => {
    expect(
      plausibleExams(
        [exam('Α', '2026-09-01'), exam('Φυσική', '2026-09-01'), exam('Χημεία', '2026-09-02')].map(
          (e) => ({ ...e, course: `${e.course} μάθημα` }),
        ),
      ),
    ).toBe(true);
  });

  it('distrusts one with times or dates run into the names, or no dates', () => {
    expect(
      plausibleExams([
        exam('13:00-15:00 01/09/2026 ΤΡΙΤΗ', '2026-09-15'),
        exam('Γ', '2026-09-15'),
        exam('Οικονομετρία', '2026-09-15'),
      ]),
    ).toBe(false);
    expect(plausibleExams([exam('Φυσική'), exam('Χημεία'), exam('Βιολογία')])).toBe(false);
  });
});
