import type { Block, Inline } from '../../content/blocks.js';
import type { Exam } from '../types.js';

import { dateOf, semesterOf, timesOf } from './examTable.js';

const cellText = (cell: Inline | undefined): string =>
  (cell ?? [])
    .map((run) => run.text)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

const fold = (text: string): string =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const weekdays = /^(δευτερα|τριτη|τεταρτη|πεμπτη|παρασκευη|σαββατο)/;

// "Α΄ ΕΞΑΜΗΝΟ", "ΣΤ' εξάμηνο": the semester that ends a course's entry.
const semesterMark = /(ΣΤ|[Α-Θ])\s*['΄’]\s*ΕΞΑΜΗΝΟ/giu;
// A room as these grids write it: a letter & a number, "B7", "Ε4".
const roomToken = /(?<![\p{L}\d])[A-ZΑ-Ω]\d{1,2}(?![\p{L}\d])/gu;
const leadingDate = /^\s*\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{2,4}\s*/;
// A run of dashes some sheets draw between two courses in one cell.
const separator = /-{3,}/g;

interface Entry {
  course: string;
  semester?: string;
  room?: string;
  examiner?: string;
}

/**
 * The exams in one cell, each written as its name (a room may sit inside it,
 * where the name wrapped), its semester, then the examiner's surname — "ΟΙΚΟΝΟΜΕΤΡΙΑ
 * Ε΄ ΕΞΑΜΗΝΟ Β7 ΔΡΙΤΣΑΚΗ". A cell may hold several, one after the other.
 */
function entriesIn(text: string): Entry[] {
  const clean = text.replace(leadingDate, '').replace(separator, ' ').replace(/\s+/g, ' ').trim();
  const marks = [...clean.matchAll(semesterMark)];
  const entries: Entry[] = [];
  let start = 0;
  marks.forEach((mark, index) => {
    const before = clean.slice(start, mark.index);
    const afterStart = mark.index + mark[0].length;
    const afterEnd = marks[index + 1]?.index ?? clean.length;
    // After the semester: perhaps a room, then the examiner's surname.
    const tail = /^\s*([A-ZΑ-Ω]\d{1,2}(?![\p{L}\d]))?\s*([Α-ΩΆ-Ώ][Α-ΩΆ-Ώ.-]+(?![\p{L}]))?/u.exec(
      clean.slice(afterStart, afterEnd),
    )!;
    const room = tail[1] ?? [...before.matchAll(roomToken)].map((m) => m[0])[0];
    const examiner = tail[2];
    const course = before.replace(roomToken, ' ').replace(/\s+/g, ' ').trim();
    const semester = semesterOf(`${mark[1]}΄`);
    if (course) {
      entries.push({
        course,
        ...(semester ? { semester } : {}),
        ...(room ? { room } : {}),
        ...(examiner ? { examiner } : {}),
      });
    }
    // What follows the examiner is the next course's name.
    start = afterStart + tail[0].length;
  });
  return entries;
}

/**
 * Parses an exam schedule set out as a week's grid: the hours down the side,
 * the weekdays across the top, each day's date written in its column & each
 * sitting's courses in the cells, as "ΩΡΑ | ΔΕΥΤΕΡΑ | ΤΡΙΤΗ | …". A sheet
 * runs one such grid a week. A document with no such grid yields nothing.
 */
export function parseExamGrid(blocks: Block[], now: Date = new Date()): Exam[] {
  const exams: Exam[] = [];
  for (const block of blocks) {
    if (block.type !== 'table') continue;
    const rows = block.header ? [block.header, ...block.rows] : block.rows;
    const headerIndex = rows.findIndex((row) => {
      const cells = row.map((cell) => fold(cellText(cell)));
      return /^ωρα/.test(cells[0] ?? '') && cells.filter((cell) => weekdays.test(cell)).length >= 3;
    });
    if (headerIndex === -1) continue;
    const header = rows[headerIndex]!;
    const body = rows.slice(headerIndex + 1);
    const dayColumns = header
      .map((cell, index) => (weekdays.test(fold(cellText(cell))) ? index : -1))
      .filter((index) => index > 0);

    for (const column of dayColumns) {
      // The day's date is written in its column, usually at the top.
      const date = body
        .map((row) => leadingDate.exec(cellText(row[column]))?.[0])
        .find((text): text is string => Boolean(text));
      const iso = date ? dateOf(date, now) : undefined;
      if (!iso) continue;

      let last: Exam | undefined;
      for (const row of body) {
        const times = timesOf(cellText(row[0]));
        if (!times.startTime) continue;
        let text = cellText(row[column]).replace(leadingDate, '');
        // A surname that slipped below its cell's line opens the next one:
        // give it back to the sitting above if that one has none.
        const stray = /^([Α-ΩΆ-Ώ]{3,})\s+(?=\S)/u.exec(text);
        if (stray && last && !last.examiners && !semesterMark.test(stray[1]!)) {
          const next = text.slice(stray[0].length);
          semesterMark.lastIndex = 0;
          if (semesterMark.test(next)) {
            last.examiners = [stray[1]!];
            text = next;
          }
        }
        semesterMark.lastIndex = 0;
        for (const entry of entriesIn(text)) {
          const exam: Exam = {
            course: entry.course,
            date: iso,
            ...times,
            ...(entry.room ? { room: entry.room } : {}),
            ...(entry.semester ? { semester: entry.semester } : {}),
            ...(entry.examiner ? { examiners: [entry.examiner] } : {}),
          };
          exams.push(exam);
          last = exam;
        }
      }
    }
  }
  return exams;
}
