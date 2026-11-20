import type { Block, Inline } from '../../content/blocks.js';
import type { ClassSession } from '../types.js';

function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

const cellText = (cell: Inline | undefined): string =>
  (cell ?? [])
    .map((run) => run.text)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

type Column = 'semester' | 'day' | 'time' | 'course' | 'teacher' | 'room';

// Heading words for each column, matched against the folded heading cell. A
// date column ("ημερομηνία") makes a table an exam schedule, which this skips.
const headings: [Column, RegExp][] = [
  ['semester', /^εξαμην/],
  ['day', /^ημερα$/],
  ['time', /^ωρ/],
  ['course', /^μαθημα/],
  ['teacher', /^(καθηγητ|διδασκ)/],
  ['room', /^αιθουσ/],
];

function columnsOf(row: Inline[]): Map<Column, number> {
  const columns = new Map<Column, number>();
  row.forEach((cell, index) => {
    const text = fold(cellText(cell));
    if (!text || text.length > 30) return;
    for (const [column, pattern] of headings) {
      if (!columns.has(column) && pattern.test(text)) columns.set(column, index);
    }
  });
  return columns;
}

const weekdays = ['δευτερα', 'τριτη', 'τεταρτη', 'πεμπτη', 'παρασκευη', 'σαββατο'];

function dayOf(text: string): number | undefined {
  const folded = fold(text);
  const index = weekdays.findIndex((day) => folded.startsWith(day));
  return index === -1 ? undefined : index + 1;
}

const letters = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ', 'Ζ', 'Η', 'Θ', 'Ι'];

/** "Α", "Α΄", "3", "3ο" -> a semester in letters. */
function semesterOf(text: string): string | undefined {
  const trimmed = text.trim();
  const number = /^(\d{1,2})\s*[οo]?$/u.exec(trimmed)?.[1];
  if (number) {
    const letter = letters[Number(number) - 1];
    return letter ? `${letter}΄` : undefined;
  }
  const letter = /^(ΣΤ|[Α-Ι])['΄’]?$/u.exec(trimmed)?.[1];
  return letter ? `${letter}΄` : undefined;
}

const pad = (time: string): string => time.replace('.', ':').replace(/^(\d):/, '0$1:');

/**
 * Parses a timetable set out as a list rather than a grid: a heading row with
 * a day, a time & a course column at the least, optionally the semester, the
 * teacher & the room. A day or semester left blank carries down from the row
 * above, as such lists often write each once.
 */
export function parseClassTable(blocks: Block[]): ClassSession[] {
  const classes: ClassSession[] = [];
  let day: number | undefined;
  let semester: string | undefined;

  for (const block of blocks) {
    if (block.type !== 'table') continue;
    const rows = block.header ? [block.header, ...block.rows] : block.rows;
    const headerIndex = rows.findIndex((row) => {
      const columns = columnsOf(row);
      return columns.has('day') && columns.has('time') && columns.has('course');
    });
    if (headerIndex === -1) continue;
    const columns = columnsOf(rows[headerIndex]!);
    const at = (row: Inline[], column: Column): string => {
      const index = columns.get(column);
      return index === undefined ? '' : cellText(row[index]);
    };

    for (const row of rows.slice(headerIndex + 1)) {
      day = dayOf(at(row, 'day')) ?? day;
      semester = semesterOf(at(row, 'semester')) ?? semester;
      const time = /(\d{1,2}[:.]\d{2})\s*[-–—]\s*(\d{1,2}[:.]\d{2})/.exec(at(row, 'time'));
      const course = at(row, 'course');
      if (!course || !time || day === undefined) continue;
      const teacher = at(row, 'teacher');
      const room = at(row, 'room');
      classes.push({
        course,
        day,
        startTime: pad(time[1]!),
        endTime: pad(time[2]!),
        ...(room ? { room } : {}),
        ...(semester ? { semester } : {}),
        ...(teacher ? { teacher } : {}),
      });
    }
  }
  return classes;
}
