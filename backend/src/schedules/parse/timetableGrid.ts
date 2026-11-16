import { plainText } from '../../content/blocks.js';
import type { Block, Inline } from '../../content/blocks.js';
import type { ClassSession, CourseTrack } from '../types.js';

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
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
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
  const lines = cellText(cell).split('\n').map(tidy).filter(Boolean);
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
function parseCell(
  cell: Inline,
  day: number,
  start: string,
  end: string,
  semester?: string,
  track?: CourseTrack,
): ClassSession | null {
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
    ...(track ? { track } : {}),
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

const timeRange = /(\d{1,2}[:.]\d{2})\s*[–-]\s*(\d{1,2}[:.]\d{2})/u;

const pad = (time: string): string => time.replace('.', ':').replace(/^(\d):/, '0$1:');

const semesterLetters = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ', 'Ζ', 'Η', 'Θ', 'Ι'];

/** The semester a heading names, as "Γ΄", whether it is written "Γ΄" or "3ο". */
function semesterIn(text: string): string | undefined {
  const lettered =
    /([Α-Ω]{1,2}['΄’])\s*εξάμην/u.exec(text) ?? /([Α-Ω]{1,2}['΄’])\s*ΕΞΑΜΗΝ/u.exec(text);
  if (lettered) return lettered[1]!.replace(/['’]/u, '΄');
  const numbered = /(\d{1,2})\s*ο?\s*εξαμην/u.exec(fold(text));
  const letter = numbered ? semesterLetters[Number(numbered[1]) - 1] : undefined;
  return letter ? `${letter}΄` : undefined;
}

/**
 * The column -> day map, with the columns a day spans: a day with parallel
 * groups heads only its first column, the others left blank in the header.
 */
function spannedDayColumns(header: Inline[]): Map<number, number> {
  const named = dayColumns(header);
  const map = new Map<number, number>();
  let current: number | undefined;
  header.forEach((cell, index) => {
    if (index === 0) return;
    const day = named.get(index);
    if (day) current = day;
    else if (cellText(cell).trim()) current = undefined;
    if (current) map.set(index, current);
  });
  return map;
}

/**
 * A cell that holds only a person's name — a surname or two, in capitals, as
 * a sheet puts the teacher on the line under the course.
 */
function looksLikeName(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.includes('\n') || /\d/.test(trimmed) || trimmed.length > 40) return false;
  const words = trimmed.split(/[\s,–-]+/).filter(Boolean);
  return words.length <= 3 && words.every((word) => /^[Α-ΩΆ-ΏΪΫ][Α-ΩΆ-ΏΪΫ.]*$/u.test(word));
}

/** A cell that names only a room, as a sheet puts it under the course. */
function looksLikeRoom(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.includes('\n') || trimmed.length > 40) return false;
  return /^(αιθουσα|αιθ\.?\s|αμφιθεατρο|αμφ\.?\s|εργαστηριο|εργ\.\s|[βb]\d)/u.test(fold(trimmed));
}

/**
 * Parses a timetable laid out as a grid: a header row of weekday columns, then
 * a row per time slot whose first cell is the time & whose other cells hold a
 * class — as a course, its teacher & its room on separate lines (Informatics),
 * or with the teacher in the row beneath (sheets like Communication's). A class
 * that runs over consecutive slots reads as one. Several tables, one per
 * semester, are read in turn, the semester taken from the heading before each.
 */
export function parseTimetableGrid(blocks: Block[]): ClassSession[] {
  const classes: ClassSession[] = [];
  let semester: string | undefined;
  let track: CourseTrack | undefined;

  for (const block of blocks) {
    if (block.type === 'paragraph' || block.type === 'heading') {
      const text = plainText(block.content);
      const named = semesterIn(text);
      if (named) {
        // A new semester heading ends any teaching-proficiency section before it.
        semester = named;
        track = undefined;
      } else if (/επαρκει/u.test(fold(text))) {
        // The teaching-proficiency programme is its own section with no
        // semester; without this its classes would inherit the last one seen.
        track = 'pde';
        semester = undefined;
      }
      continue;
    }
    if (block.type !== 'table') continue;

    const rows = block.header ? [block.header, ...block.rows] : block.rows;
    const headerIndex = rows.findIndex((row) => dayColumns(row).size >= 3);
    if (headerIndex === -1) continue;
    const columns = spannedDayColumns(rows[headerIndex]!);
    // A sheet may title the table with its semester in a row above the days.
    for (const row of rows.slice(0, headerIndex)) {
      const named = semesterIn(row.map(cellText).join(' '));
      if (named) {
        semester = named;
        track = undefined;
      }
    }

    // The class last placed in each column, & the slot it ended in.
    const last = new Map<number, { session: ClassSession; slot: number }>();
    let slot = 0;
    let slotEnd: string | undefined;

    for (const row of rows.slice(headerIndex + 1)) {
      const time = timeRange.exec(cellText(row[0] ?? []));
      if (time) {
        slot += 1;
        slotEnd = pad(time[2]!);
      }
      for (const [col, day] of columns) {
        const cell = row[col] ?? [];
        const text = cellText(cell).trim();
        if (!text) continue;
        const above = last.get(col);
        const fromSlotAbove = above !== undefined && above.slot >= slot - (time ? 1 : 0);

        // A name under a course is that course's teacher, not a class of its
        // own; on a timed row it also means the course runs on into this slot.
        if (fromSlotAbove && !above.session.teacher && looksLikeName(text)) {
          above.session.teacher = tidy(text);
          if (time && slotEnd) {
            above.session.endTime = slotEnd;
            above.slot = slot;
          }
          continue;
        }
        // A room under a course is where it is held.
        if (above && above.slot >= slot - 1 && !above.session.room && looksLikeRoom(text)) {
          above.session.room = tidy(text);
          continue;
        }
        if (!time) continue;

        const session = parseCell(cell, day, pad(time[1]!), pad(time[2]!), semester, track);
        if (!session) continue;
        // The same course in the next slot is the same class running on.
        if (
          above &&
          above.slot === slot - 1 &&
          above.session.course === session.course &&
          above.session.endTime === session.startTime &&
          (session.teacher === undefined || session.teacher === above.session.teacher)
        ) {
          above.session.endTime = session.endTime;
          above.slot = slot;
          if (!above.session.room && session.room) above.session.room = session.room;
          continue;
        }
        classes.push(session);
        last.set(col, { session, slot });
      }
    }
  }

  return classes;
}
