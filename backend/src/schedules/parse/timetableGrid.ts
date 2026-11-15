import { plainText } from '../../content/blocks.js';
import type { Block, Inline } from '../../content/blocks.js';
import type { ClassSession } from '../types.js';

const dayNames: Record<string, number> = {
  δευτερα: 1,
  τριτη: 2,
  τεταρτη: 3,
  πεμπτη: 4,
  παρασκευη: 5,
  σαββατο: 6,
  κυριακη: 7,
};

function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// The cell's text with its line breaks kept — plainText would fold them into
// spaces, but a cell's course, teacher & room sit on separate lines & we need
// them apart.
const cellText = (cell: Inline): string => cell.map((run) => run.text).join('');

const tidy = (text: string): string => text.replace(/\s+/gu, ' ').trim();

function classType(course: string): { course: string; type?: string } {
  const folded = fold(course);
  const stripped = course.replace(/\(\s*(?:φροντιστήριο|εργαστήριο)\s*\)/giu, '');
  if (/φροντιστ/u.test(folded)) return { course: tidy(stripped), type: 'tutorial' };
  if (/εργαστ/u.test(folded)) return { course: tidy(stripped), type: 'lab' };
  return { course: tidy(course) };
}

// Clean a room, dropping a stray closing guillemet left when a quoted room name
// wrapped onto a line the cell split away.
function cleanRoom(room: string): string {
  const tidied = tidy(room);
  return tidied.includes('«') ? tidied : tidied.replace(/»/gu, '').trim();
}

// A line that is just a teacher's name: initials & a surname. Used only where
// the source failed to mark the teacher italic, so the run split can't find it.
const teacherLine = /^(?:[Α-ΩΆ-Ώ]\.\s*){1,3}[Α-ΩΆ-Ώ][α-ωά-ώϊΐ'’]+$/u;

function splitByLines(cell: Inline): { course: string; teacher?: string; room: string } {
  const lines = cellText(cell)
    .split('\n')
    .map(tidy)
    .filter(Boolean);
  const teacherIndex = lines.findIndex((line, i) => i > 0 && teacherLine.test(line));
  const course = lines[0] ?? '';
  const teacher = teacherIndex >= 0 ? lines[teacherIndex] : undefined;
  const room = lines
    .slice(1)
    .filter((_, i) => i + 1 !== teacherIndex)
    .join(' ');
  return { course, teacher, room };
}

/**
 * Splits one class cell by the teacher's run, which the source marks italic:
 * the course is the text before it, the room the text after. A multi-name
 * teacher or a course title that wrapped across lines is kept whole this way,
 * where splitting on line breaks alone would not.
 */
function parseCell(cell: Inline, day: number, start: string, end: string, semester?: string): ClassSession | null {
  const italics = cell
    .map((run, index) => ({ run, index }))
    .filter(({ run }) => run.italic === true && run.text.trim() !== '');

  let courseText: string;
  let teacher: string | undefined;
  let roomText: string;
  if (italics.length > 0) {
    const first = italics[0]!.index;
    const last = italics.at(-1)!.index;
    courseText = cellText(cell.slice(0, first));
    teacher = tidy(italics.map((m) => m.run.text).join(' '));
    roomText = cellText(cell.slice(last + 1));
  } else {
    const lines = splitByLines(cell);
    courseText = lines.course;
    teacher = lines.teacher;
    roomText = lines.room;
  }

  const { course, type } = classType(courseText);
  if (!course) return null;
  const room = cleanRoom(roomText);

  return {
    course,
    day,
    startTime: start,
    endTime: end,
    ...(room ? { room } : {}),
    ...(type ? { type } : {}),
    ...(semester ? { semester } : {}),
    ...(teacher ? { teacher } : {}),
  };
}

/** The column -> day map from a header row whose cells are day names. */
function dayColumns(headerCells: Inline[]): Map<number, number> {
  const map = new Map<number, number>();
  headerCells.forEach((cell, index) => {
    const day = dayNames[fold(cellText(cell))];
    if (day) map.set(index, day);
  });
  return map;
}

const timeRange = /(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/u;

/**
 * Parses a timetable laid out as a grid: a header row of weekday columns, then
 * a row per time slot whose first cell is the time & whose other cells hold a
 * class as a course, its teacher & its room on separate lines. Several tables,
 * one per semester, are read in turn, the semester taken from the heading
 * before each. The format the Informatics department uses; another shape
 * yields nothing.
 */
export function parseTimetableGrid(blocks: Block[]): ClassSession[] {
  const classes: ClassSession[] = [];
  let semester: string | undefined;

  for (const block of blocks) {
    if (block.type === 'paragraph' || block.type === 'heading') {
      const text = plainText(block.content);
      const match = /([Α-Ω]['΄’])\s*εξάμην/u.exec(text);
      if (match) semester = match[1];
      continue;
    }
    if (block.type !== 'table') continue;

    const rows = block.header ? [block.header, ...block.rows] : block.rows;
    const headerIndex = rows.findIndex((row) => dayColumns(row).size >= 3);
    if (headerIndex === -1) continue;
    const columns = dayColumns(rows[headerIndex]!);

    for (const row of rows.slice(headerIndex + 1)) {
      const time = timeRange.exec(cellText(row[0] ?? []));
      if (!time) continue;
      const [, start, end] = time;
      for (const [col, day] of columns) {
        const cell = row[col] ?? [];
        if (!cellText(cell).trim()) continue;
        const session = parseCell(cell, day, start!, end!, semester);
        if (session) classes.push(session);
      }
    }
  }

  return classes;
}
