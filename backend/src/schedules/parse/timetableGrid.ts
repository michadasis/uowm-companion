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

// Words a line of a course title can end on only if the title runs on to the
// next line: "ΕΙΣΑΓΩΓΗ ΣΤΗ" / "ΔΙΟΙΚΗΣΗ ΕΠΙΧΕΙΡΗΣΕΩΝ".
const joiningEnd =
  /(\s|^)(στη|στην|στον|στο|στα|στις|στους|σε|του|της|των|τον|την|και|με|για|απο|&|-|–)$/u;

// A course code some departments put before the title: "ΜΠ103 ", "ΕΘ102Ε - ".
const courseCode = /^[Α-ΩA-Z]{1,4}\s?\d{2,4}[Α-ΩA-Z]?\s*[-–:]?\s+/u;

/**
 * Splits a cell with no italic teacher by its lines. The course is the first
 * line, & the next ones too while the title plainly runs on — the line ends on
 * a joining word, or the next starts in lower case. Of the rest, a line that
 * is just a teacher's name is the teacher; the others are where it is held.
 */
function splitByLines(cell: Inline): { course: string; teacher?: string; room: string } {
  const all = cellText(cell).split('\n').map(tidy).filter(Boolean);
  // A room printed above the course belongs with the rest of the details.
  const leading = all.findIndex((line) => !looksLikeRoom(line));
  const lines = leading > 0 ? [...all.slice(leading), ...all.slice(0, leading)] : all;
  let courseEnd = 1;
  while (
    courseEnd < lines.length &&
    (joiningEnd.test(fold(lines[courseEnd - 1]!)) || /^[α-ωά-ώ]/u.test(lines[courseEnd]!))
  ) {
    courseEnd += 1;
  }
  // A title over two lines, its room right after: "Θεμελιώδεις Έννοιες" /
  // "Μαθηματικών" / "Αίθουσα Β2".
  const second = lines[courseEnd];
  if (
    courseEnd === 1 &&
    second &&
    !looksLikeRoom(second) &&
    !teacherLine.test(second) &&
    lines[2] !== undefined &&
    looksLikeRoom(lines[2])
  ) {
    courseEnd = 2;
  }
  // A course code closing a line, "(301)" or "(Υ001)", ends the title there.
  const coded = lines.findIndex((line) => /\(\s*[Α-ΩA-Z]{0,3}-?\d{3,4}[Α-ΩA-Z]?\s*\)$/u.test(line));
  if (coded >= 0 && coded <= 2 && !lines.slice(0, coded + 1).some(looksLikeRoom)) {
    courseEnd = coded + 1;
  }
  const course = lines.slice(0, courseEnd).join(' ').replace(courseCode, '');
  const rest = lines.slice(courseEnd);
  const teacherIndex = rest.findIndex((line) => teacherLine.test(line));
  const teacher = teacherIndex >= 0 ? rest[teacherIndex] : undefined;
  const room = rest.filter((_, i) => i !== teacherIndex).join(' ');
  return { course, teacher, room };
}

// A row of column labels under the weekday names, as some grids have.
const labelsOnly =
  /^(μαθημα|μαθ\.?|καθηγ\.?|καθ\.?|αιθ\.?|αιθουσα|ομαδα|θ-ε-απ|διδασκων|καθηγητης|\s)+$/u;

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
  if (!course || labelsOnly.test(fold(cellText(cell).replace(/\n/g, ' ')))) return null;
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
  // "Α΄ εξάμηνο", "Α’ Εξαμήνου", "Εξάμηνο Α'".
  const lettered =
    /([Α-Ω]{1,2}['΄’])\s*(?:[εΕ]ξ[αά]μ[ηή]ν|ΕΞΑΜΗΝ)/u.exec(text)?.[1] ??
    /(?:[εΕ]ξ[αά]μ[ηή]ν[οου]*|ΕΞΑΜΗΝ[ΟΟΥ]*)\s+([Α-Ω]{1,2}['΄’])(?![Α-Ωα-ω])/u.exec(text)?.[1];
  if (lettered) return lettered.replace(/['’]/u, '΄');
  const numbered =
    /(\d{1,2})\s*[οo]?\s*εξαμην/u.exec(fold(text)) ??
    /εξαμην[οου]*\s*:?\s*(\d{1,2})\s*[οo]?(?!\d)/u.exec(fold(text));
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
  return /^\(?\s*(αιθουσα|αιθ(?![α-ω])|αμφιθεατρο|αμφ(?![α-ω])|εργαστηριο|εργ\.\s|[βb]\d)/u.test(
    fold(trimmed),
  );
}

/**
 * The classes a cell stacks one under another, as some grids list every
 * class of a slot in one cell: each ends on the line naming its room. A cell
 * with one class, or with italic runs that mark its parts, is left whole.
 */
function stackedParts(cell: Inline): Inline[] {
  if (cell.some((run) => run.italic)) return [cell];
  const lines = cellText(cell).split('\n').map(tidy).filter(Boolean);
  // Only a cell naming two rooms or more can hold more than one class.
  if (lines.filter(looksLikeRoom).length < 2) return [cell];
  const parts: string[][] = [[]];
  lines.forEach((line, index) => {
    parts.at(-1)!.push(line);
    const next = lines[index + 1];
    if (
      next !== undefined &&
      looksLikeRoom(line) &&
      !looksLikeRoom(next) &&
      !teacherLine.test(next) &&
      !looksLikeName(next)
    ) {
      parts.push([]);
    }
  });
  // A part of a single line is a stray, not a class: keep the cell whole.
  if (parts.length < 2 || parts.some((part) => part.length < 2)) return [cell];
  return parts.map((part) => [{ text: part.join('\n') }]);
}

// A cell saying "as above": a ditto mark or two.
const ditto = /^["“”„'΄`〃]+$/u;

type ColumnRole = 'course' | 'teacher' | 'room';

/** The role of each day column, from a row of labels under the day names. */
function columnRoles(row: Inline[], columns: Map<number, number>): Map<number, ColumnRole> {
  const roles = new Map<number, ColumnRole>();
  // A row of times holds classes, not labels.
  if (timeRange.test(cellText(row[0] ?? []))) return roles;
  for (const col of columns.keys()) {
    const label = fold(cellText(row[col] ?? []));
    if (/^μαθημα(τα)?$/u.test(label)) roles.set(col, 'course');
    else if (/^(διδασκων|διδασκοντες|διδασκουσα|καθηγητης|καθηγητες)$/u.test(label)) {
      roles.set(col, 'teacher');
    } else if (/^αιθουσα$/u.test(label)) roles.set(col, 'room');
  }
  return roles;
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

    // Some sheets split each day into labelled columns under it — "Μάθημα",
    // "Διδάσκων", "Αίθουσα" — in a row of their own.
    const roles = columnRoles(rows[headerIndex + 1] ?? [], columns);
    const body = rows.slice(headerIndex + (roles.size >= 2 ? 2 : 1));

    // The class last placed in each column, & the slot it ended in.
    const last = new Map<number, { session: ClassSession; slot: number }>();
    let slot = 0;
    let slotEnd: string | undefined;

    for (const row of body) {
      // The class each day's course column holds in this row, for the
      // teacher & room columns beside it.
      const inRow = new Map<number, ClassSession>();
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

        const role = roles.get(col);
        if (role === 'teacher' || role === 'room') {
          const session = inRow.get(day);
          if (session && !ditto.test(text)) session[role] ??= tidy(text);
          continue;
        }
        // Ditto marks under a class: it runs on into this slot.
        if (ditto.test(text)) {
          if (above && time && above.slot === slot - 1) {
            above.session.endTime = pad(time[2]!);
            above.slot = slot;
            inRow.set(day, above.session);
          }
          continue;
        }

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
        // A lone "Ε. Surname" spilt from the cell above, when rows differ in
        // height, is that class's teacher.
        if (fromSlotAbove && teacherLine.test(text)) {
          above.session.teacher ??= tidy(text);
          continue;
        }
        // A room under a course is where it is held; one with no course above
        // it belongs to a class the grid prints lower down, & is not a class.
        if (looksLikeRoom(text)) {
          if (above && above.slot >= slot - 1 && !above.session.room)
            above.session.room = tidy(text);
          continue;
        }
        if (!time) continue;

        for (const part of stackedParts(cell)) {
          const session = parseCell(part, day, pad(time[1]!), pad(time[2]!), semester, track);
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
            inRow.set(day, above.session);
            continue;
          }
          classes.push(session);
          last.set(col, { session, slot });
          inRow.set(day, session);
        }
      }
    }
  }

  return classes;
}
