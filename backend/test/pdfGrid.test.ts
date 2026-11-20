import { describe, expect, it } from 'vitest';

import type { Block } from '../src/content/blocks.js';
import { gridBlocks, listBlocks } from '../src/documents/pdfGrid.js';
import type { PositionedText } from '../src/documents/pdfGrid.js';
import { parseClassTable } from '../src/schedules/parse/classTable.js';
import { parseTimetableGrid } from '../src/schedules/parse/timetableGrid.js';

const piece = (text: string, x: number, y: number, width = 40): PositionedText => ({
  text,
  x,
  y,
  width,
});

const days = ['ΔΕΥΤΕΡΑ', 'ΤΡΙΤΗ', 'ΤΕΤΑΡΤΗ', 'ΠΕΜΠΤΗ', 'ΠΑΡΑΣΚΕΥΗ'];

// An upright page: y grows upwards, so the title sits above the header at a
// larger y & the rows run down to smaller ones.
const upright: PositionedText[] = [
  piece('1o ΕΞΑΜΗΝΟ', 300, 560, 80),
  ...days.map((day, index) => piece(day, 120 + index * 150, 510)),
  piece('9:00-10:00', 40, 476),
  piece('10:00-11:00', 40, 446),
  piece('11:00-12:00', 40, 416),
  piece('Χημεία', 120, 478),
  piece('ΑΠ3_8', 170, 478, 30),
  piece('Μαθηματική Ανάλυση στη', 270, 448, 100),
  piece('γεωμετρία', 270, 438, 50),
  piece('Φυσική', 570, 418),
];

describe('gridBlocks', () => {
  it('rebuilds a weekly grid from where its text sits, with the title above it', () => {
    const blocks = gridBlocks(upright)!;
    expect(blocks[0]).toEqual({ type: 'paragraph', content: [{ text: '1o ΕΞΑΜΗΝΟ' }] });
    const table = blocks[1] as Extract<Block, { type: 'table' }>;
    const text = table.rows.map((row) => row.map((cell) => cell.map((run) => run.text).join('')));
    expect(text[0]).toEqual(['ΩΡΑ', ...days]);
    expect(text[1]).toEqual(['09:00 - 10:00', 'Χημεία\nΑΠ3_8', '', '', '', '']);
    expect(text[2]).toEqual(['10:00 - 11:00', '', 'Μαθηματική Ανάλυση στη\nγεωμετρία', '', '', '']);
    expect(text[3]).toEqual(['11:00 - 12:00', '', '', '', 'Φυσική', '']);
  });

  it('reads a page printed sideways, its days running down the raw coordinates', () => {
    // Turned a quarter: across is y, down is x.
    const sideways = upright.map((item) => ({ ...item, x: item.y, y: item.x }));
    const blocks = gridBlocks(sideways)!;
    const table = blocks.find((block) => block.type === 'table') as Extract<
      Block,
      { type: 'table' }
    >;
    expect(table.rows[0]!.map((cell) => cell.map((run) => run.text).join(''))).toEqual([
      'ΩΡΑ',
      ...days,
    ]);
    expect(table.rows).toHaveLength(4);
  });

  it('leaves a page with no weekday header to be read as text', () => {
    expect(gridBlocks([piece('Ανακοίνωση', 40, 500), piece('Κείμενο', 40, 480)])).toBeNull();
  });

  it('gives classes the grid parser reads, title running on & semester from the heading', () => {
    expect(parseTimetableGrid(gridBlocks(upright)!)).toEqual([
      expect.objectContaining({
        course: 'Χημεία',
        day: 1,
        startTime: '09:00',
        room: 'ΑΠ3_8',
        semester: 'Α΄',
      }),
      expect.objectContaining({
        course: 'Μαθηματική Ανάλυση στη γεωμετρία',
        day: 2,
        startTime: '10:00',
      }),
      expect.objectContaining({ course: 'Φυσική', day: 4, startTime: '11:00' }),
    ]);
  });
});

describe('listBlocks', () => {
  // ΕΞΑΜΗΝΟ · ΗΜΕΡΑ · ΩΡΑ · ΜΑΘΗΜΑ · ΚΑΘΗΓΗΤΗΣ · ΑΙΘΟΥΣΑ, with a semester & a
  // day each written once in a cell merged over the rows they cover, & not
  // at the middle of them.
  const heading = [
    piece('ΕΞΑΜΗΝΟ', 96, 702, 50),
    piece('ΗΜΕΡΑ', 168, 707, 35),
    piece('ΩΡΑ', 241, 707, 20),
    piece('ΜΑΘΗΜΑ', 340, 707, 45),
    piece('ΚΑΘΗΓΗΤΗΣ', 440, 707, 60),
    piece('ΑΙΘΟΥΣΑ', 530, 707, 45),
  ];
  const row = (y: number, time: string, course: string, teacher: string, room: string) => [
    piece(time, 226, y, 50),
    piece(course, 312, y, 100),
    piece(teacher, 440, y, 50),
    piece(room, 530, y, 30),
  ];
  const page1 = [
    ...heading,
    piece('Α', 116, 641, 10),
    piece('ΔΕΥΤΕΡΑ', 165, 660, 40),
    ...row(660, '15:00 – 18:00', 'Μικροοικονομική Ι', 'Κώντσας', 'Μ. ΑΜΦ'),
    // Τρίτη's label sits below its first row & above its second.
    piece('ΤΡΙΤΗ', 173, 590, 26),
    ...row(608, '09:00 – 12:00', 'Μαθηματικά', 'Τρανουλίδης', 'ΑΙΘ. 10'),
    ...row(576, '12:00 – 15:00', 'Στατιστική', 'Τρανουλίδης', 'ΑΙΘ. 10'),
    piece('Γ', 116, 520, 9),
    piece('ΤΡΙΤΗ', 173, 540, 26),
    ...row(545, '11:00 – 13:00', 'Πληροφοριακά Συστήματα', 'Ντιό', 'ΕΡΓ. 12'),
    ...row(510, '13:00 – 16:00', 'Προγραμματισμός', 'Συνδουκάς', 'ΑΙΘ. 08'),
    piece('ΤΕΤΑΡΤΗ', 166, 470, 40),
    ...row(478, '10:00 – 13:00', 'Οικονομετρία', 'Αδαμόπουλος', 'ΑΙΘ. 09'),
  ];
  // The list runs on to a page with no heading of its own.
  const page2 = [
    piece('ΠΕΜΠΤΗ', 166, 740, 39),
    ...row(740, '09:00 – 12:00', 'Διαχείριση Εφοδιαστικής', 'Τσιλιγκαρίδης', 'ΑΙΘ. 08'),
    piece('Ε', 116, 690, 9),
    piece('ΔΕΥΤΕΡΑ', 168, 690, 36),
    ...row(690, '09:00 – 12:00', 'Επιχειρηματικά Σχέδια', 'Καλογιαννίδης', 'ΑΙΘ. 08'),
  ];

  it('gives each row the day & semester of the merged cells it lies in, over pages', () => {
    const first = listBlocks(page1)!;
    const second = listBlocks(page2, first.layout)!;
    const classes = parseClassTable([...first.blocks, ...second.blocks]);
    expect(classes.map((c) => [c.semester, c.day, c.startTime, c.course])).toEqual([
      ['Α΄', 1, '15:00', 'Μικροοικονομική Ι'],
      ['Α΄', 2, '09:00', 'Μαθηματικά'],
      ['Α΄', 2, '12:00', 'Στατιστική'],
      ['Γ΄', 2, '11:00', 'Πληροφοριακά Συστήματα'],
      ['Γ΄', 2, '13:00', 'Προγραμματισμός'],
      ['Γ΄', 3, '10:00', 'Οικονομετρία'],
      ['Γ΄', 4, '09:00', 'Διαχείριση Εφοδιαστικής'],
      ['Ε΄', 1, '09:00', 'Επιχειρηματικά Σχέδια'],
    ]);
    expect(classes[0]).toMatchObject({ teacher: 'Κώντσας', room: 'Μ. ΑΜΦ', endTime: '18:00' });
  });

  it('joins a word or a time a generator split into touching pieces', () => {
    const split = [
      ...heading,
      piece('ΔΕΥΤΕΡΑ', 165, 660, 40),
      piece('15', 226, 660, 9),
      piece(':00', 235, 660, 11),
      piece('–', 248, 660, 5),
      piece('1', 255, 660, 5),
      piece('8', 260, 660, 5),
      piece(':00', 265, 660, 11),
      piece('Διαχείριση Αλυσίδα', 312, 660, 106),
      piece('ς', 418, 660, 4),
      ...row(620, '09:00 – 12:00', 'Λογιστική', 'Κοντέος', 'ΑΙΘ. 09'),
    ];
    const [first] = parseClassTable(listBlocks(split)!.blocks);
    expect(first).toMatchObject({
      startTime: '15:00',
      endTime: '18:00',
      course: 'Διαχείριση Αλυσίδας',
    });
  });

  it('leaves a weekly grid to the grid reader', () => {
    expect(listBlocks(upright)).toBeNull();
  });
});

describe('gridBlocks on other layouts', () => {
  it('reads bare hours on a 12-hour clock & a room column beside each day', () => {
    const blocks = gridBlocks([
      piece('Δευτέρα', 120, 510),
      piece('Αιθ', 175, 510, 15),
      piece('Τρίτη', 230, 510),
      piece('Αιθ', 285, 510, 15),
      piece('Τετάρτη', 340, 510),
      piece('Αιθ', 395, 510, 15),
      piece('12 - 1', 40, 476, 25),
      piece('1 - 2', 40, 446, 25),
      piece('Λογιστική Ι', 225, 478, 45),
      piece('1307', 285, 478, 18),
    ])!;
    const classes = parseTimetableGrid(blocks);
    expect(classes).toEqual([
      expect.objectContaining({
        course: 'Λογιστική Ι',
        day: 2,
        startTime: '12:00',
        endTime: '13:00',
        room: '1307',
      }),
    ]);
  });

  it('splits a cell listing several classes, each closed by its room', () => {
    const classes = parseTimetableGrid(
      gridBlocks([
        ...days.map((day, index) => piece(day, 120 + index * 150, 510)),
        piece('09:00-12:00', 40, 440),
        piece('Πιθανότητες ΙΙ (301)', 100, 480, 80),
        piece('Χατζόπουλος', 100, 470, 50),
        piece('(ΑΙΘ: 5)', 100, 460, 30),
        piece('Μαθηματική', 100, 440, 50),
        piece('Στατιστική (501)', 100, 430, 70),
        piece('Παγκαλίδου', 100, 420, 50),
        piece('(ΑΙΘ: 6)', 100, 410, 30),
        piece('12:00-15:00', 40, 360),
      ])!,
    );
    expect(classes.map((c) => [c.course, c.startTime])).toEqual([
      ['Πιθανότητες ΙΙ (301)', '09:00'],
      ['Μαθηματική Στατιστική (501)', '09:00'],
    ]);
  });
});

describe('listBlocks, a heading typed with Latin letters', () => {
  it('reads "ΗΜ/NIA", its NIA in Latin capitals, as the date heading', () => {
    const blocks = listBlocks([
      piece('ΗΜ/NIA', 60, 707, 40),
      piece('ΩΡΑ', 140, 707, 20),
      piece('ΜΑΘΗΜΑ', 300, 707, 45),
      piece('31/8/2026', 50, 660, 50),
      piece('09:00 – 11:00', 125, 660, 50),
      piece('Γεωλογία', 290, 660, 60),
      piece('1/9/2026', 50, 620, 50),
      piece('11:00 – 13:00', 125, 620, 50),
      piece('Ορυκτολογία', 290, 620, 60),
    ]);
    expect(blocks).not.toBeNull();
    const table = blocks!.blocks.find((block) => block.type === 'table');
    expect(table).toBeDefined();
  });
});
