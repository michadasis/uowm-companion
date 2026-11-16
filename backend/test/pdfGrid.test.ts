import { describe, expect, it } from 'vitest';

import type { Block } from '../src/content/blocks.js';
import { gridBlocks } from '../src/documents/pdfGrid.js';
import type { PositionedText } from '../src/documents/pdfGrid.js';
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
