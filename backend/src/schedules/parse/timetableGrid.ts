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

// The kind of class a title closes on: "(Θ)", "(Ε)", "(Ε1)", "(Θ,Ε)", "(Θ/Ε)".
const kindMark = /\((?:Θ|Ε|E)\d?(?:\s*[,/]\s*(?:Θ|Ε|E))?\)$/u;

// A course code closing a line: "(301)", "(Υ105)".
const codeMark = /\(\s*[Α-ΩA-Z]{0,3}-?\d{3,4}[Α-ΩA-Z]?\s*\)$/u;

// Notes on a teacher's post, printed under the name: "(ΑΚΑΔΗΜΑΪΚΟΣ ΥΠΟΤΡΟΦΟΣ)",
// "ΕΠΙΚΟΥΡΙΑ ΥΠΟΨΗΦΙΑΣ ΔΙΔΑΚΤΟΡΑ".
const postNote = /υποτροφ|ακαδημαικ|εμπειρι|επικουρ|υποψηφ|διδακτορ/u;

// A line saying only what kind of class it is, as a column of its own prints it.
const kindLine = /^(?:\(?(?:θ|ε|θ\s*[,/]\s*ε)\)?|εργ\.?)$/u;

// The kind written out in lower case, on a line of its own: "θεωρία". In
// capitals it is as likely the end of a title, "Μακροοικονομική Θεωρία".
const kindWord = /^(?:θεωρία|εργαστήριο)$/u;

// A line saying only which group it is for: "Α", "ΟΛΕΣ".
const groupLine = /^(?:[α-ω]|ολες)$/u;

/**
 * A line naming only where a class is held, in the shapes the rest of a cell
 * leaves alone: a room code ("ΑΠ1_8", "Β7", "M2", "Α 3", "ΕΥ1, ΕΥ2"), a number
 * ("1307", "15"), or a hall ("Μεγ. Αμφ.", "Α.Δ 2").
 */
function roomLine(line: string): boolean {
  if (looksLikeRoom(line)) return true;
  // A dash left where the teacher was split off: "Εργ.7 -".
  const folded = fold(line).replace(/\s*[-–]$/u, '');
  const code = String.raw`[α-ωa-z]{1,3}\s?\d{1,2}(?:_\d{1,2})?\.?`;
  return (
    new RegExp(`^${code}(?:\\s*,\\s*${code})*$`, 'u').test(folded) ||
    /^\d{1,4}-?$/u.test(folded) ||
    /^(?:μεγ|μικ)[α-ω]*\.?\s*αμφ/u.test(folded) ||
    /^[α-ω]{1,3}\s?\d[-_]\d{1,2}(?:\s+ζεπ)?$/u.test(folded) ||
    /^α\.δ\.?\s?\d/u.test(folded) ||
    /^εργ\.?\s?\d{1,2}$/u.test(folded) ||
    // Kozani's ΖΕΠ campus.
    /^\(?ζεπ\)?$/u.test(folded)
  );
}

// A short room code on the end of a title line, where the sheet set the room
// beside the title: "ΝΟΜΙΣΜΑΤΙΚΕΣ ΣΧΕΣΕΙΣ Β6".
const trailingRoom = /\s((?:Εργ\.\s?)?[Α-ΩA-Z]{0,2}\d{1,2})\s*-?$/u;

/** A line that can only be a teacher, wherever it sits in the cell. */
function surelyTeacher(line: string, capitalCourse: boolean): boolean {
  return (
    teacherLine.test(line) ||
    // "Τσιώρας Κων.", "ΓΕΩΡΓΙΑΔΟΥ ΤΡ.": a surname & a shortened first name.
    /^[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+(?:-[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+)?\s+[Α-ΩΆ-Ώ][α-ωά-ώ]{0,3}\.$/u.test(line) ||
    /^[Α-ΩΆ-ΏΪ]{3,}(?:-[Α-ΩΆ-ΏΪ]{3,})?\s+[Α-Ω]{1,3}\.$/u.test(line) ||
    // "(ΣΚΛΑΒΟΣ ΑΝΑΣΤΑΣΙΟΣ)", "(ΣΤΗΜΟΝΙΑΡΗΣ/ΚΟΥΝΤΟΥΡΑΣ)".
    (/^\([Α-ΩΆ-ΏΪ]{4,}(?:[\s\-/,]+[Α-ΩΆ-ΏΪ]{3,}){0,3}\)$/u.test(line) &&
      !postNote.test(fold(line))) ||
    // "Τσιαμπαλή Χαρά" under a title in capitals: a name, in the case titles aren't.
    (capitalCourse && /^[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+(?:\s+[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+){1,2}$/u.test(line))
  );
}

/** A line that may be a teacher's name: one to three words, each capitalised. */
function nameLike(line: string): boolean {
  if (/[\d()]/u.test(line) || line.length > 40 || postNote.test(fold(line))) return false;
  const words = line.split(/\s+/u);
  return (
    words.length <= 3 &&
    words.every((word) => /^[Α-ΩΆ-ΏΪΫ][α-ωά-ώϊΐϋΰΑ-ΩΆ-ΏΪΫ'’.\-/,]*$/u.test(word)) &&
    line.replace(/[^Α-ωΆ-ώ]/gu, '').length >= 3
  );
}

/**
 * The details of a cell set out as "Course (Θ) Teacher - Room", wrapped at
 * any word (Electrical & Computer Engineering's sheets).
 */
function markedDetails(lines: string[]): { course: string; teacher: string; room: string } | null {
  const match =
    /^(.*?\((?:Θ|Ε|E)(?:\s*[,/]\s*(?:Θ|Ε|E))?\))\s*(?:Έκτακτος\s+)?-?\s*([^()]+?)\s*-\s*([Α-ΩA-Z]{1,3}\d[Α-ΩA-Z0-9_]*(?:\s*,\s*[Α-ΩA-Z]{1,3}\d[Α-ΩA-Z0-9_]*)*)$/u.exec(
      lines.join(' '),
    );
  if (!match || /\d/u.test(match[2]!)) return null;
  return { course: tidy(match[1]!), teacher: tidy(match[2]!), room: match[3]! };
}

/**
 * A one-line cell that ends on its teachers' surnames in capitals, set apart
 * by a comma or a wide gap: "DET103 ΧΡΗΜΑΤΟΟΙΚΟΝΟΜΙΚΗ ΛΟΓΙΣΤΙΚΗ Ι, ΣΠΙΝΘΗΡΟΠΟΥΛΟΣ",
 * "DET503 ΒΑΣΕΙΣ ΔΕΔΟΜΕΝΩΝ        ΠΑΝΥΤΣΙΔΗΣ" (Management Science & Technology).
 */
function inlineTeacher(text: string): { course: string; teacher: string } | null {
  if (text.includes('\n')) return null;
  const surname = String.raw`[Α-ΩΆ-ΏΪ]{4,}(?:\s+(?:[Α-ΩΆ-ΏΪ]{4,}|[Α-Ω]{1,2}\.))?`;
  // A gap of two spaces is enough after a coded title, as such sheets type it.
  const gap = courseCode.test(text.trim()) ? String.raw`\s{2,}` : String.raw`\s{3,}`;
  const match = new RegExp(
    String.raw`^(.+?)(?:,\s*|${gap}|\s+[-–]\s+)(${surname}(?:\s*[-–]\s*${surname})*)\s*$`,
    'u',
  ).exec(text.trim());
  if (!match || /εργαστ|θεωρ/u.test(fold(match[2]!))) return null;
  return {
    course: tidy(match[1]!)
      .replace(/^([Α-ΩA-Z]{1,4}\s?\d{2,4}[Α-ΩA-Z]?),/u, '$1')
      .replace(courseCode, ''),
    teacher: tidy(match[2]!),
  };
}

/**
 * Splits a cell with no italic teacher by its lines, as sheets set a class's
 * title, room & teacher in an order of their own. Each line is told apart by
 * its shape: a room code, a kind ("Θ"), a group, a note on a teacher's post,
 * or a name — one that can only be a name, or the last line where its place
 * says so: after the room, or after a title that has closed. What is left,
 * in order, is the title.
 */
function splitByLines(cell: Inline): { course: string; teacher?: string; room: string } {
  const all = cellText(cell).split('\n').map(tidy).filter(Boolean);
  const marked = markedDetails(all);
  if (marked) return marked;
  const inline = inlineTeacher(cellText(cell));
  if (inline) return { ...inline, room: '' };

  // A room & a teacher run onto one line: "Εργ.8 - Β. Παπαγεωργίου".
  const split = all.flatMap((line) => {
    const joined = /^(.*\S)\s*[-–]\s*((?:[Α-ΩΆ-Ώ]\.\s*){1,3}[Α-ΩΆ-Ώ][α-ωά-ώϊΐ'’]+)$/u.exec(line);
    return joined && roomLine(joined[1]!) ? [joined[1]!, joined[2]!] : [line];
  });
  all.splice(0, all.length, ...split);
  const firstTitle = all.find((line) => !teacherLine.test(line)) ?? '';
  const capitalCourse = firstTitle !== '' && !/[α-ωά-ώ]/u.test(firstTitle);
  type Kind = 'text' | 'room' | 'kind' | 'group' | 'note' | 'teacher';
  const kinds: Kind[] = all.map((line, index) => {
    const folded = fold(line);
    if (index > 0 && (kindLine.test(folded) || kindWord.test(line))) return 'kind';
    if (roomLine(line)) return 'room';
    if (index > 0 && groupLine.test(folded)) return 'group';
    if (index > 0 && postNote.test(folded)) return 'note';
    if (index > 0 && surelyTeacher(line, capitalCourse)) return 'teacher';
    // "Γ. Ψαραδάκης" over the title, as a sheet may set it.
    if (index === 0 && all.length > 1 && teacherLine.test(line)) return 'teacher';
    return 'text';
  });
  const lines = [...all];
  // A room whose bracket the next lines close: "ΑΙΘ/ΕΡΓ (ΕΡΓ Η/Υ" ... "ΖΕΠ)".
  kinds.forEach((kind, index) => {
    if (kind !== 'room') return;
    const open = (lines[index]!.match(/\(/gu) ?? []).length;
    if (open <= (lines[index]!.match(/\)/gu) ?? []).length) return;
    const close = kinds.findIndex(
      (k, i) => i > index && k === 'text' && /^[^(]*\)$/u.test(lines[i]!),
    );
    if (close > 0) kinds[close] = 'room';
  });
  // A room's name in quotes wrapped onto the next line: "Αμφιθέατρο 2" /
  // "«Φίλιππος Πετσάλνικος»".
  kinds.forEach((kind, index) => {
    if (kind === 'text' && kinds[index - 1] === 'room' && /^«/u.test(lines[index]!)) {
      kinds[index] = 'room';
    }
  });

  let teacher = kinds.flatMap((kind, index) => (kind === 'teacher' ? [lines[index]!] : []));
  // A name in brackets closing a title line: "Μηχανική (ΑΝΤΩΝΙΑΔΟΥ)".
  if (teacher.length === 0) {
    kinds.forEach((kind, index) => {
      if (kind !== 'text' || teacher.length > 0) return;
      const named = /^(.+?)\s*\(([Α-ΩΆ-ΏΪ]{5,}(?:[\s\-/,]+[Α-ΩΆ-ΏΪ]{3,}){0,3})\)$/u.exec(
        lines[index]!,
      );
      if (named && !postNote.test(fold(named[2]!))) {
        lines[index] = named[1]!;
        teacher = [named[2]!];
      }
    });
  }
  // The last line of text, where its place says it is a name.
  const texts = kinds.flatMap((kind, index) => (kind === 'text' ? [index] : []));
  if (teacher.length === 0 && texts.length >= 2) {
    const last = texts.at(-1)!;
    const before = texts.at(-2)!;
    const line = lines[last]!;
    const afterRoom = kinds.slice(0, last).some((kind) => kind === 'room');
    const afterClosedTitle =
      kindMark.test(lines[before]!) ||
      codeMark.test(lines[before]!) ||
      /^\([^()]+\)$/u.test(lines[before]!);
    const capitalWord =
      capitalCourse &&
      /^[Α-ΩΆ-ΏΪ]+$/u.test(line) &&
      // Three letters over a room number is a teacher's short code: "ΚΟΡ" / "3401".
      ((line.length === 3 && /^\d{3,4}$/u.test(lines[last + 1] ?? '')) ||
        (texts.length >= 3 && !joiningEnd.test(fold(lines[before]!))));
    if (nameLike(line) && (afterRoom || afterClosedTitle || capitalWord)) {
      kinds[last] = 'teacher';
      teacher = [line];
    }
  }
  // A name set just above the room while the title runs on below it:
  // "ΕΙΣΑΓΩΓΗ ΣΤΟΝ" / "ΚΟΡ" / "4204" / "ΠΡΟΓΡΑΜΜΑΤΙΣΜΟ (Θ)".
  const firstRoom = kinds.indexOf('room');
  if (teacher.length === 0 && capitalCourse && firstRoom > 1 && kinds[firstRoom - 1] === 'text') {
    const line = lines[firstRoom - 1]!;
    const titleRunsOn = lines
      .slice(firstRoom + 1)
      .some((after, i) => kindMark.test(after) || kinds[firstRoom + 1 + i] === 'kind');
    if (titleRunsOn && /^[Α-ΩΆ-ΏΪ]{3,}$/u.test(line) && texts.length >= 2) {
      kinds[firstRoom - 1] = 'teacher';
      teacher = [line];
    }
  }
  // After a kind printed in a column of its own, with no room before it, the
  // text left is where the class is held: "Ε" / "ΑΝΑΤΟΜΙΚΗΣ" / "Α" / name.
  const lone = kinds.findIndex((kind, index) => kind === 'kind' && !/^\(/u.test(lines[index]!));
  const named = kinds.lastIndexOf('teacher');
  if (lone > 0 && named > lone && !kinds.slice(0, lone).includes('room')) {
    kinds.forEach((kind, index) => {
      if (index > lone && index < named && kind === 'text') kinds[index] = 'room';
    });
  }

  // A room beside the title, where no line gives one: "ΣΧΕΣΕΙΣ Β6".
  if (!kinds.includes('room')) {
    kinds.forEach((kind, index) => {
      const beside = kind === 'text' && index > 0 ? trailingRoom.exec(lines[index]!) : null;
      if (!beside || kinds.includes('room')) return;
      lines[index] = lines[index]!.slice(0, beside.index);
      lines.push(beside[1]!);
      kinds.push('room');
    });
  }

  const of = (wanted: Kind): string[] =>
    lines.filter((line, index) => kinds[index] === wanted && line);
  // A bracketed kind closing the cell, "(Θ)", stays with its title.
  const kindsOnTitle = kinds.flatMap((kind, index) =>
    kind === 'kind' && /^\(/u.test(lines[index]!) ? [lines[index]!] : [],
  );
  const course = [...of('text'), ...kindsOnTitle].join(' ').replace(courseCode, '');
  const room = [...new Set(of('room').map((line) => line.replace(/\s*[-–]$/u, '')))].join(' ');
  const teachers = teacher.map((name) => name.replace(/^\((.*)\)$/u, '$1'));
  return { course, ...(teachers.length ? { teacher: teachers.join(', ') } : {}), room };
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
  // Two classes side by side, read across: their titles, then each one's
  // "Teacher - Room" — "Ηλεκ. Κυκλώματα ΙΙ (Ε)" / "Ηλεκ. Μετρήσεις (Ε)" /
  // "Πασχόπουλος - ΑΠ1_1" / "Βανδίκας - ΑΠ1_10".
  const titles = lines.findIndex((line) => !kindMark.test(line));
  if (
    titles >= 2 &&
    lines.length === titles * 2 &&
    lines.slice(titles).every((line) => /^[^()]+\s-\s*[Α-ΩA-Z]{1,3}\d/u.test(line))
  ) {
    return lines.slice(0, titles).map((title, i) => [{ text: `${title}\n${lines[titles + i]!}` }]);
  }
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
      // The class each column holds in this row, for a room in the column
      // beside it.
      const inColumn = new Map<number, ClassSession>();
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
        // A room in the column right of a class, as a sheet with a room column
        // per group sets it, is that class's room.
        const beside = inColumn.get(col - 1);
        if (beside && columns.get(col - 1) === day && roomLine(text)) {
          beside.room ??= tidy(text);
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
            inColumn.set(col, above.session);
            continue;
          }
          classes.push(session);
          last.set(col, { session, slot });
          inRow.set(day, session);
          inColumn.set(col, session);
        }
      }
    }
  }

  return classes;
}
