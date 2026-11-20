import type { Block, Inline } from '../../content/blocks.js';
import type { Exam } from '../types.js';

function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

const cellText = (cell: Inline | undefined): string =>
  (cell ?? [])
    .map((run) => run.text)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

type Column = 'date' | 'time' | 'course' | 'semester' | 'examiner' | 'room';

// Header words for each column, matched against the folded header cell.
const headers: [Column, RegExp][] = [
  ['date', /ημερομηνια|ημερα|^ημ\/νια|^date/],
  ['time', /ωρα|^κυμα|^time/],
  ['course', /μαθημα|^τιτλος|course/],
  ['semester', /^εξαμ|semester/],
  ['examiner', /εισηγητ|εξεταστ|διδασκ|καθηγητ|υπευθυν/],
  ['room', /αιθουσ|χωρος|room/],
];

function columnsOf(row: Inline[]): Map<Column, number> {
  const columns = new Map<Column, number>();
  row.forEach((cell, index) => {
    const text = fold(cellText(cell));
    if (!text || text.length > 40) return;
    for (const [column, pattern] of headers) {
      if (!columns.has(column) && pattern.test(text)) {
        columns.set(column, index);
        break;
      }
    }
  });
  return columns;
}

const letters = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ', 'Ζ', 'Η', 'Θ', 'Ι'];

/** "6ο ΕΞΑΜΗΝΟ" -> "ΣΤ΄"; a semester already written in letters is kept. */
function semesterOf(text: string): string | undefined {
  if (!text) return undefined;
  const number = /(\d{1,2})/.exec(text)?.[1];
  if (number) return letters[Number(number) - 1] ? `${letters[Number(number) - 1]}΄` : undefined;
  const letter = /^([Α-Ω]{1,2})['΄’]?(\s|$)/u.exec(text.trim())?.[1];
  return letter ? `${letter}΄` : undefined;
}

/**
 * "ΔΕΥΤΕΡΑ 31/8", "31/08/2026" or "31-8-26" -> an ISO date. A date given
 * without its year is placed in the year that brings it nearest to `now`, as
 * a schedule is read within months of its dates.
 */
// Months as written out, by their folded stems: "31 Αυγούστου", "31 Αύγουστος".
const monthNames: [RegExp, number][] = [
  [/ιανουαρ/u, 1],
  [/φεβρουαρ/u, 2],
  [/μαρτ/u, 3],
  [/απριλ/u, 4],
  [/μαι/u, 5],
  [/ιουνι/u, 6],
  [/ιουλι/u, 7],
  [/αυγουστ/u, 8],
  [/σεπτεμβρ/u, 9],
  [/οκτωβρ/u, 10],
  [/νοεμβρ/u, 11],
  [/δεκεμβρ/u, 12],
];

function dateOf(text: string, now: Date): string | undefined {
  const written = /(\d{1,2})\s+([α-ω]+)\s*(\d{4})?/u.exec(fold(text));
  const named = written ? monthNames.find(([stem]) => stem.test(written[2]!))?.[1] : undefined;
  if (written && named) text = `${written[1]}/${named}${written[3] ? `/${written[3]}` : ''}`;
  const match = /(\d{1,2})\s*[/.-]\s*(\d{1,2})(?:\s*[/.-]\s*(\d{2,4}))?/.exec(text);
  if (!match) return undefined;
  const day = Number(match[1]);
  const month = Number(match[2]);
  if (day < 1 || day > 31 || month < 1 || month > 12) return undefined;
  let year: number;
  if (match[3]) {
    year = Number(match[3]);
    if (year < 100) year += 2000;
  } else {
    const nowYear = now.getUTCFullYear();
    year = [nowYear - 1, nowYear, nowYear + 1].reduce((best, candidate) =>
      Math.abs(Date.UTC(candidate, month - 1, day) - now.getTime()) <
      Math.abs(Date.UTC(best, month - 1, day) - now.getTime())
        ? candidate
        : best,
    );
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1) return undefined;
  return date.toISOString().slice(0, 10);
}

function timesOf(text: string): { startTime?: string; endTime?: string } {
  const pad = (time: string) => time.replace(/^(\d):/, '0$1:').replace('.', ':');
  const range = /(\d{1,2}[:.]\d{2})\s*[-–—]\s*(\d{1,2}[:.]\d{2})/.exec(text);
  if (range) return { startTime: pad(range[1]!), endTime: pad(range[2]!) };
  // Bare hours, as "9-11" or "13 - 15".
  const hours = /^(\d{1,2})\s*[-–—]\s*(\d{1,2})$/.exec(text.trim());
  if (hours) {
    const hour = (value: string) => `${value.padStart(2, '0')}:00`;
    return { startTime: hour(hours[1]!), endTime: hour(hours[2]!) };
  }
  const single = /(\d{1,2}[:.]\d{2})/.exec(text);
  return single ? { startTime: pad(single[1]!) } : {};
}

// A row that only names a semester, heading the exams under it.
const semesterRow = /^(ΣΤ|[Α-Ι])['΄’]?\s*εξαμην/iu;

/**
 * Parses an exam schedule laid out as a table with a header row — a date, a
 * time & a course column at the least, optionally the semester, the examiner &
 * the room. The date is carried down rows that leave it blank, as such sheets
 * write each day once. A document with no such table yields nothing.
 */
export function parseExamTable(blocks: Block[], now: Date = new Date()): Exam[] {
  const exams: Exam[] = [];
  for (const block of blocks) {
    if (block.type !== 'table') continue;
    const rows = block.header ? [block.header, ...block.rows] : block.rows;
    // A heading row names the course column, or — with both a date & a time
    // column named — leaves the first column, the course, unnamed.
    const headerIndex = rows.findIndex((row) => {
      const columns = columnsOf(row);
      return columns.has('course')
        ? columns.has('date') || columns.has('time')
        : columns.has('date') && columns.has('time') && ![...columns.values()].includes(0);
    });
    if (headerIndex === -1) continue;
    const columns = columnsOf(rows[headerIndex]!);
    if (!columns.has('course')) columns.set('course', 0);
    const at = (row: Inline[], column: Column) => {
      const index = columns.get(column);
      return index === undefined ? '' : cellText(row[index]);
    };

    let date: string | undefined;
    let heading: string | undefined;
    for (const row of rows.slice(headerIndex + 1)) {
      const cells = row.map((cell) => cellText(cell)).filter(Boolean);
      if (cells.length <= 2 && semesterRow.test(cells[0] ?? '')) {
        heading = semesterOf(cells[0]!.replace(/\s*εξ.*$/iu, ''));
        continue;
      }
      const ownDate = dateOf(at(row, 'date'), now);
      date = ownDate ?? date;
      const course = at(row, 'course');
      if (!course || columnsOf(row).has('course')) continue;
      const times = timesOf(at(row, 'time'));
      // A row with neither its own date nor a time is no sitting: coursework
      // handed in, say.
      if (!ownDate && !times.startTime) continue;
      const semester = semesterOf(at(row, 'semester')) ?? heading;
      const examiner = at(row, 'examiner');
      // A room left as a dash or a stray stroke is no room.
      const room = at(row, 'room').replace(/^[\s_–-]+|[\s_–-]+$/g, '');
      exams.push({
        course,
        ...(date ? { date } : {}),
        ...times,
        ...(room ? { room } : {}),
        ...(semester ? { semester } : {}),
        ...(examiner ? { examiners: examiner.split(/\s*[,/]\s*|\n/).filter(Boolean) } : {}),
      });
    }
  }
  return exams;
}
