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
const codeMark = /\(\s*[Α-ΩA-Z]{0,3}\s?-?\d{3,4}[Α-ΩA-Z]?\s*\)$/u;

// Notes on a teacher's post, printed under the name: "(ΑΚΑΔΗΜΑΪΚΟΣ ΥΠΟΤΡΟΦΟΣ)",
// "ΕΠΙΚΟΥΡΙΑ ΥΠΟΨΗΦΙΑΣ ΔΙΔΑΚΤΟΡΑ".
const postNote = /υποτροφ|ακαδημαικ|εμπειρι|επικουρ|υποψηφ|διδακτορ/u;

// A line saying only what kind of class it is, as a column of its own prints it.
const kindLine = /^(?:\(?(?:θ|ε|θ\s*[,/]\s*ε)\)?|-?εργ\.?|απ)$/u;

// The kind written out in lower case, on a line of its own: "θεωρία". In
// capitals it is as likely the end of a title, "Μακροοικονομική Θεωρία".
const kindWord = /^(?:θεωρία|εργαστήριο)$/u;

// A line saying only which group it is for: "Α", "ΟΛΕΣ".
const groupLine = /^(?:[α-ω]|στ|ολες)$/u;

// Latin letters that look Greek, typed into Greek text: "EΡΓ. Η/Υ".
const lookalike: Record<string, string> = {
  A: 'Α',
  B: 'Β',
  E: 'Ε',
  H: 'Η',
  I: 'Ι',
  K: 'Κ',
  M: 'Μ',
  N: 'Ν',
  O: 'Ο',
  P: 'Ρ',
  T: 'Τ',
  X: 'Χ',
  Y: 'Υ',
  Z: 'Ζ',
  a: 'α',
  e: 'ε',
  i: 'ι',
  k: 'κ',
  o: 'ο',
  p: 'ρ',
  t: 'τ',
  x: 'χ',
  y: 'υ',
};

function greekLookalikes(text: string): string {
  return /[Α-Ωα-ωΆ-ώ]/u.test(text) ? text.replace(/[A-Za-z]/gu, (c) => lookalike[c] ?? c) : text;
}

/**
 * A line naming only where a class is held, in the shapes the rest of a cell
 * leaves alone: a room code ("ΑΠ1_8", "Β7", "M2", "Α 3", "ΕΥ1, ΕΥ2"), a number
 * ("1307", "15"), or a hall ("Μεγ. Αμφ.", "Α.Δ 2").
 */
function roomLine(line: string): boolean {
  if (looksLikeRoom(line) || looksLikeRoom(greekLookalikes(line)) || /^&$/u.test(line.trim())) {
    return true;
  }
  // A dash left where the teacher was split off, "Εργ.7 -"; a second room
  // joined on, "& ΑΠ3_2".
  const folded = greekLookalikes(fold(line))
    .replace(/\s*[-–]$/u, '')
    .replace(/^&\s*/u, '');
  const code = String.raw`[α-ωa-z]{1,3}\s?\d{1,2}(?:_\d{1,2})?\.?`;
  return (
    new RegExp(`^${code}(?:\\s*,\\s*${code})*$`, 'u').test(folded) ||
    /^\d{1,4}-?$/u.test(folded) ||
    /^(?:μεγ|μικ)[α-ω]*\.?\s*αμφ/u.test(folded) ||
    /^[α-ω]{1,3}\s?\d[-_]\d{1,2}(?:\s+ζεπ)?$/u.test(folded) ||
    /^α\.δ\.?\s?\d/u.test(folded) ||
    /^εργ\.?\s?\d{1,2}$/u.test(folded) ||
    // Kozani's ΖΕΠ campus.
    /^\(?ζεπ\)?$/u.test(folded) ||
    // Agriculture's "15 / ΑΓΡΟ", "9 / ΘΕΡΜ": a room & its building.
    /^\d{1,2}\s*\/\s*[α-ω]{2,5}$/u.test(folded)
  );
}

// A short room code on the end of a title line, where the sheet set the room
// beside the title: "ΝΟΜΙΣΜΑΤΙΚΕΣ ΣΧΕΣΕΙΣ Β6".
const trailingRoom = /\s((?:Εργ\.\s?)?[Α-ΩA-Z]{0,2}\d{1,2})\s*-?$/u;

// Endings only a surname has: "Τουρλιδάκης", "Σαπίδης", "Καραγιαννοπούλου".
const surnameEnd =
  /(?:άκης|ίδης|ιάδης|όπουλος|ούλης|άρης|ίτης|ούδης|ίδου|ιάδου|οπούλου|ούλου|άκη)$/u;

/** A surname in title case, or several by slashes: "Τουρλιδάκης", "Κορρές/Ταουσανίδης". */
function titleSurnames(line: string): boolean {
  return (
    /^[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+(?:\s*\/\s*[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+)*$/u.test(line) &&
    (line.includes('/') || surnameEnd.test(line))
  );
}

/** A line that can only be a teacher, wherever it sits in the cell. */
function surelyTeacher(line: string, capitalCourse: boolean): boolean {
  return (
    teacherLine.test(line) ||
    titleSurnames(line) ||
    /^[Α-ΩΆ-ΏΪ]{3,}(?:ΙΔΗΣ|ΑΚΗΣ|ΟΠΟΥΛΟΣ|ΙΑΔΗΣ|ΙΔΟΥ|ΟΠΟΥΛΟΥ|ΤΖΗΣ|ΤΣΗΣ)$/u.test(line) ||
    // "Τσιώρας Κων.", "ΓΕΩΡΓΙΑΔΟΥ ΤΡ.": a surname & a shortened first name.
    /^[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+(?:-[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+)?\s+[Α-ΩΆ-Ώ][α-ωά-ώ]{0,3}\.$/u.test(line) ||
    /^[Α-ΩΆ-ΏΪ]{3,}(?:-[Α-ΩΆ-ΏΪ]{3,})?\s+[Α-Ω]{1,3}\.$/u.test(line) ||
    // "(ΣΚΛΑΒΟΣ ΑΝΑΣΤΑΣΙΟΣ)", "(ΣΤΗΜΟΝΙΑΡΗΣ/ΚΟΥΝΤΟΥΡΑΣ)".
    (/^\([Α-ΩΆ-ΏΪ]{4,}\.?(?:[\s\-/,]+[Α-ΩΆ-ΏΪ]{2,}\.?){0,5},?\)$/u.test(line) &&
      !postNote.test(fold(line))) ||
    // "Τσιαμπαλή Χαρά" under a title in capitals: a name, in the case titles aren't.
    (capitalCourse && /^[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+(?:\s+[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+){1,2}$/u.test(line))
  );
}

/** A line that may be a teacher's name: one to three words, each capitalised. */
function nameLike(text: string): boolean {
  // "Κωνσταντινίδης / Καραγιαννάκης" is two names; "π." a priest's title.
  const line = text.replace(/\s*\/\s*/gu, '/').replace(/^π\.\s*/u, '');
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
function inlineTeacher(raw: string): { course: string; teacher: string } | null {
  if (raw.includes('\n')) return null;
  // Notes after the teachers: "Επικουρία: ...", "- Υπ. Διδάκτορας ή ...".
  const text = raw.replace(/\s+Επικουρία:.*$/u, '').replace(/\s*[-–]\s+Υπ\.\s.*$/u, '');
  const surname = String.raw`[Α-ΩΆ-ΏΪ]{4,}(?:\s+(?:[Α-ΩΆ-ΏΪ]{4,}|[Α-Ω]{1,2}\.))?`;
  // A gap of two spaces is enough after a coded title, as such sheets type it.
  const gap = courseCode.test(text.trim()) ? String.raw`\s{2,}` : String.raw`\s{3,}`;
  const match = new RegExp(
    String.raw`^(.+?)(?:,\s*|${gap}${courseCode.test(text.trim()) ? String.raw`|\s+[-–]\s+` : ''})(${surname}(?:\s*[-–]\s*${surname})*)\s*$`,
    'u',
  ).exec(text.trim());
  // One space is gap enough before a coded title's surname with an ending only
  // a surname has: "DET 701 ... ΕΠΙΧΕΙΡΗΣΕΙΣ ΧΑΤΖΗΘΕΟΔΩΡΙΔΗΣ".
  const found =
    match ??
    (courseCode.test(text.trim())
      ? /^(.+?)\s+([Α-ΩΆ-ΏΪ]{4,}(?:ΙΔΗΣ|ΑΚΗΣ|ΟΠΟΥΛΟΣ|ΙΑΔΗΣ|ΙΔΟΥ|ΟΥΛΟΥ|ΑΚΗ))$/u.exec(text.trim())
      : null);
  if (!found || /εργαστ|θεωρ/u.test(fold(found[2]!))) return null;
  if (
    !/[Α-Ωα-ωA-Za-z]{3,}/u.test(
      tidy(found[1]!)
        .replace(courseCode, '')
        .replace(/^[Α-ΩA-Z]{1,4}\s?\d{2,4}[Α-ΩA-Z]?,?$/u, ''),
    )
  ) {
    return null;
  }
  return {
    course: tidy(found[1]!)
      .replace(/^([Α-ΩA-Z]{1,4}\s?\d{2,4}[Α-ΩA-Z]?),/u, '$1')
      .replace(courseCode, ''),
    teacher: tidy(found[2]!),
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
function splitByLines(cell: Inline): {
  course: string;
  teacher?: string;
  room: string;
  type?: string;
} {
  // Column labels a cell took in from the row above: "ΜΑΘΗΜΑ", "ΟΜΑΔΑ".
  const all = cellText(cell)
    .split('\n')
    .map(tidy)
    .filter((line) => line && !labelsOnly.test(fold(line)));
  const marked = markedDetails(all);
  if (marked) return marked;
  const inline = inlineTeacher(cellText(cell));
  if (inline) return { ...inline, room: '' };
  // "Studio I - 2204 Σχεδ Α", "Επιχειρησιακή Έρευνα - A4", "... - Μ.Α."
  // (Industrial Design): the room after the last dash.
  const dashed =
    all.length === 1
      ? /^(.+\S)\s*[-–]\s*(\d{4}(?:\s+\S.{0,12})?|[ΑA]\d{1,2}|Μ\.\s?Α\.?)$/u.exec(all[0]!)
      : null;
  if (dashed) return { course: dashed[1]!, room: dashed[2]! };

  // "Μικρό" / "Αμφιθέατρο ΤΑΧΜΑΤΖΙΔΗΣ Δ.": a hall's name wrapped.
  for (let i = all.length - 2; i >= 0; i--) {
    const hall = /^(.*\S)\s+(Μικρό|Μεγάλο)$/u.exec(all[i]!);
    if (hall && /^Αμφ/u.test(all[i + 1]!)) {
      all[i] = hall[1]!;
      all[i + 1] = `${hall[2]} ${all[i + 1]}`;
    }
    // "... ΥΕ512 Αίθ." / "ΝΚ3 ΜΕΓΑΡΗ Κ.": a room's number wrapped.
    const room = /^(.*\S)\s+(Αίθ\.)$/u.exec(all[i]!);
    if (room && /^[Α-ΩA-Z]{0,3}\s?\d/u.test(all[i + 1]!)) {
      all[i] = room[1]!;
      all[i + 1] = `${room[2]} ${all[i + 1]}`;
    }
  }
  // A room within a line, the title before it, the teacher after: "ΕΕ608 Αίθ.
  // Α4 ΦΛΩΡΑ ΑΙΚΑΤΕΡΙΝΗ", "ΘΕΩΡΙΕΣ ΠΡΟΣΩΠΙΚΟΤΗΤΑΣ θεωρία" (Psychology).
  const inner = /(Αίθ\.\s*[Α-ΩA-Z]{0,3}\s?\d{1,2}\.?|(?:Μικρό|Μεγάλο)\s+Αμφ(?:ιθέατρο|ιθ\.|\.)?)/u;
  const afterInner = new Set<string>();
  const opened = all.flatMap((line) => {
    const kind = /^(.*\S)\s+(θεωρία|εργαστήριο)$/u.exec(line);
    if (kind) return [kind[1]!, kind[2]!];
    const at = inner.exec(line);
    if (!at || at[0] === line) return [line];
    const before = line.slice(0, at.index).trim();
    const after = line.slice(at.index + at[0].length).trim();
    if (after) afterInner.add(after);
    return [before, at[0], after].filter(Boolean);
  });
  all.splice(0, all.length, ...opened);
  // Teachers' short codes over a room number (Mineral Resources): "ΠΑΥ 4203",
  // "... (Θ) ΚΑΠ" / "4204", "ΚΑΠ/" / "ΜΕΘΟΔΟΛΟΓΙΑ ΕΡΕΥΝΑΣ" / "4204" / "ΠΑΥ".
  const teacherCodes = new Set<string>();
  if (all.some((line) => /(?:^|\s)\d{4}$|^\(?ΖΕΠ\)?$/u.test(line))) {
    const shortCode = (word: string): boolean =>
      /^[Α-ΩΆ-ΏΪ]{3,5}\/?$/u.test(word) &&
      !/^(?:ΚΑΙ|ΤΗΣ|ΤΩΝ|ΣΤΗ|ΣΤΟ|ΣΤΑ|ΓΙΑ|ΑΠΟ|ΤΟΝ|ΤΗΝ|ΙΙΙ|ΙΙ|ΖΕΠ)\/?$/u.test(word);
    for (let i = all.length - 1; i >= 0; i--) {
      const line = all[i]!;
      const coded = /^([Α-ΩΆ-ΏΪ]{3,4})\s+(\d{4})$/u.exec(line);
      if (coded) {
        all.splice(i, 1, coded[1]!, coded[2]!);
        teacherCodes.add(coded[1]!);
        continue;
      }
      // The whole on one line: "ΥΠΑΙΘΡΙΑ ΕΚΜΕΤΑΛΛΕΥΣΗ (Θ) ΠΑΥ 4203".
      const titled = /^(.*\S)\s+([Α-ΩΆ-ΏΪ]{3,4})\s+(\d{4})$/u.exec(line);
      if (titled && shortCode(titled[2]!)) {
        all.splice(i, 1, titled[1]!, titled[2]!, titled[3]!);
        teacherCodes.add(titled[2]!);
        continue;
      }
      const ending = /^(.*\S)\s+([Α-ΩΆ-ΏΪ]{3,5})$/u.exec(line);
      const roomNext = /^\d{4}$/u.test(all[i + 1] ?? '') || /^\(?ΖΕΠ\)?$/u.test(all[i + 1] ?? '');
      if (ending && roomNext && shortCode(ending[2]!)) {
        all.splice(i, 1, ending[1]!, ending[2]!);
        teacherCodes.add(ending[2]!);
        continue;
      }
      // A code on a line of its own is three or four letters; five only
      // closing a title, before its room ("ΗΛΕΚΤΡΟΚΙΝΗΣΗ ΤΣΙΑΜ" / "ΖΕΠ").
      if (all.length > 1 && shortCode(line) && (line.replace('/', '').length <= 4 || roomNext)) {
        teacherCodes.add(line);
      }
    }
  }
  // A room & a teacher run onto one line: "Εργ.8 - Β. Παπαγεωργίου".
  const ledRooms = new Set<string>();
  const split = all.flatMap((line) => {
    const joined = /^(.*\S)\s*[-–]\s*((?:[Α-ΩΆ-Ώ]\.\s*){1,3}[Α-ΩΆ-Ώ][α-ωά-ώϊΐ'’]+)$/u.exec(line);
    if (joined && roomLine(joined[1]!)) return [joined[1]!, joined[2]!];
    // A room code set before a title line in capitals: "Β4 ΕΠΙΧΕΙΡΗΣΕΩΝ (Κ-ΟΕ)".
    const led = /^([Α-ΩA-Z]\d{1,2})\s+([^a-zα-ωά-ώ]{4,})$/u.exec(line);
    if (led) ledRooms.add(led[1]!);
    return led ? [led[1]!, led[2]!] : [line];
  });
  // A name in brackets wrapped onto the next line: "(ΠΛΙΟΓΚΟΥ ΒΑΣ.," /
  // "ΛΥΚΟΜΗΤΡΟΥ ΣΟΝ.)".
  for (let i = split.length - 2; i >= 0; i--) {
    if (/^\([^()]+$/u.test(split[i]!) && /^[^()]+\)$/u.test(split[i + 1]!)) {
      split.splice(i, 2, `${split[i]} ${split[i + 1]}`);
    }
  }
  // A surname opening a list, set at the end of a title line: "ΠΟΙΟΤΙΚΗ
  // ΕΚΤΙΜΗΣΗ ΚΑΣΑΠΙΔΟΥ /".
  for (let i = split.length - 1; i >= 0; i--) {
    const opening = /^(.*[Α-ΩΆ-ΏΪ]{2,}.*?)\s+([Α-ΩΆ-ΏΪ]{4,}\s*\/)$/u.exec(split[i]!);
    if (opening) split.splice(i, 1, opening[1]!, opening[2]!);
  }
  // A list of names wrapped after its slash: "ΚΑΡΑΓΙΑΝΝΗΣ /" / "ΠΑΠΑΔΟΠΟΥΛΟΣ".
  for (let i = split.length - 2; i >= 1; i--) {
    if (/\s\/$/u.test(split[i]!) && /^[Α-ΩΆ-ΏΪ]{4,}(?:\s*\/.*)?$/u.test(split[i + 1]!)) {
      split.splice(i, 2, `${split[i]} ${split[i + 1]}`);
    }
  }
  // A list still open, its next name further down: "ΤΣΑΚΙΡΗΣ /" ... "ΚΕΣΙΔΗΣ".
  const openLists = new Set(split.filter((line, i) => i > 0 && /^[Α-ΩΆ-ΏΪ]{4,}\s*\/$/u.test(line)));
  // Surnames set apart by slashes, the room or lab after them: "ΠΑΠΑΘΑΝΑΣΙΟΥ /
  // ΠΑΣΧΟΥΔΗ / ΣΙΣΤΑΝΗΣ ΕΡ ΒΟΤ", "ΚΑΡΑΓΙΑΝΝΗΣ / 9 / ΑΓΡΟ" (Agriculture).
  const listedRooms = new Set<string>();
  for (let i = split.length - 1; i >= 1; i--) {
    if (roomLine(split[i]!)) continue;
    const listed =
      /^([Α-ΩΆ-ΏΪ]{4,}(?:\s*\/\s*[Α-ΩΆ-ΏΪ]{4,})*)(?:\s*\/?\s+((?:\d+|[Α-ΩA-Z]{1,4})(?:(?:\s*\/\s*|\s+)(?:\d+|[Α-ΩA-Z]{1,4}))*))?$/u.exec(
        split[i]!,
      );
    if (!listed) continue;
    const names = listed[1]!;
    const where = listed[2];
    // One name alone only before a room number: "ΚΑΡΑΓΙΑΝΝΗΣ / 9 / ΑΓΡΟ".
    if (!names.includes('/') && !/^\d/u.test(where ?? '')) continue;
    // A last surname wrapped under the room: "ΜΠΑΝΤΗΣ / ΧΑΤΖΗ / 15 / ΘΕΡΜ" / "ΒΑΘΙΣΤΑΣ".
    const wrapped = where && i === split.length - 2 && /^[Α-ΩΆ-ΏΪ]{4,}$/u.test(split[i + 1]!);
    const all = wrapped ? `${names} / ${split[i + 1]}` : names;
    split.splice(
      i,
      wrapped ? 2 : 1,
      `(${all.replace(/\s*\/\s*/gu, '/')})`,
      ...(where ? [where] : []),
    );
    if (where) listedRooms.add(where);
  }
  all.splice(0, all.length, ...split);
  // Rooms & labs in short codes, as Agriculture names them: "ΕΡ ΓΕΩ", "ΕΜ /
  // ΕΠ", "15 / ΕΓΧ (ΑΓΡ)", "Ε ΑΝΑΠ / ΑΓΡΟ", "ΕΧ (ΝΈΟ)", "ΕΡΓ" / "ΠΛΦ" — under a
  // title marked with its kind, & never a teacher's code by a room number.
  const labRooms = new Set<string>();
  if (all.some((line) => kindAnywhere.test(line))) {
    // A surname with its room on one line: "ΠΑΠΑΔΟΠΟΥΛΟΣ ΕΧ (ΝΈΟ)", "ΠΑΠΑΔΟΠΟΥΛΟΣ (ΝΕΟ)".
    for (let i = all.length - 1; i >= 1; i--) {
      const named = /^([Α-ΩΆ-ΏΪ]{6,})\s+((?:[Α-ΩΆ-ΏΪ]{1,4}\s+)?\([Α-ΩΆ-ΏΪ]{2,4}\))$/u.exec(all[i]!);
      if (named) {
        all.splice(i, 1, named[1]!, named[2]!);
        labRooms.add(named[2]!);
      }
    }
    for (let i = all.length - 2; i >= 1; i--) {
      if (all[i] === 'ΕΡΓ' && /^[Α-ΩΆ-ΏΪ]{2,5}$/u.test(all[i + 1]!)) {
        all.splice(i, 2, `ΕΡΓ ${all[i + 1]}`);
      }
    }
    const token = String.raw`(?:\d{1,2}|[Α-ΩΆ-ΏΪ]{1,5}|\([Α-ΩΆ-ΏΪ]{2,4}\))`;
    const coded = new RegExp(String.raw`^${token}(?:(?:\s*\/\s*|\s+)${token})+$`, 'u');
    all.forEach((line, index) => {
      if (index > 0 && coded.test(line) && !/^[Α-ΩΆ-ΏΪ]{3,4}\s+\d{4}$/u.test(line)) {
        labRooms.add(line);
      }
      // A lab's two letters alone: "ΕΧ", "ΕΠ".
      if (index > 0 && /^[Α-ΩΆ-ΏΪ]{2}$/u.test(line) && !/^(?:ΑΠ)$/u.test(line)) labRooms.add(line);
    });
  }
  // The first line that is neither a room nor a name is the title's, telling
  // whether titles are in capitals.
  // A sheet with a column for the group ("ΟΛΕΣ", "Α") prints its teachers in
  // title case under titles in capitals (Occupational Therapy).
  const grouped = all.some(
    (line, index) => index > 0 && groupLine.test(fold(line)) && !kindLine.test(fold(line)),
  );
  const firstTitle =
    all.find(
      (line) =>
        !roomLine(line) &&
        !teacherLine.test(line) &&
        !(grouped && /^[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+(?:\s+[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+){0,2}$/u.test(line)),
    ) ?? '';
  const capitalCourse = firstTitle !== '' && !/[α-ωά-ώ]/u.test(firstTitle);
  // Under a title in capitals, words in title case are a name: "ΕΡΓΟΘΕΡΑΠΕΙΑ ΣΕ
  // ΗΛΙΚΙΩΜΕΝΟΥΣ Παπανικολάου" / "Φωτεινή", "Συμεών" / "ΕΡΓΟΥ Δασκάλου".
  const nameParts = new Set<string>();
  if (capitalCourse && grouped) {
    const titleCase = String.raw`[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+`;
    // Words in title case that are no name: a kind, a hall.
    const noName = /(?:θεωρια|εργαστηρι|φροντιστηρι|αμφιθεατρ|αιθουσα|ομαδα)/u;
    const parted = all.flatMap((line) => {
      if (noName.test(fold(line))) return [line];
      if (new RegExp(`^${titleCase}$`, 'u').test(line)) {
        nameParts.add(line);
        return [line];
      }
      const trailing = new RegExp(
        `^(.*[Α-ΩΆ-ΏΪ]{2,}\\S*)\\s+(${titleCase}(?:\\s+${titleCase})?)$`,
        'u',
      ).exec(line);
      if (!trailing || /[α-ωά-ώ]/u.test(trailing[1]!)) return [line];
      nameParts.add(trailing[2]!);
      return [trailing[1]!, trailing[2]!];
    });
    all.splice(0, all.length, ...parted);
  }
  type Kind = 'text' | 'room' | 'kind' | 'group' | 'note' | 'teacher';
  const kinds: Kind[] = all.map((line, index) => {
    const folded = fold(line);
    if (index > 0 && (kindLine.test(folded) || kindWord.test(line))) return 'kind';
    if (roomLine(line) || listedRooms.has(line) || labRooms.has(line)) return 'room';
    if (index > 0 && groupLine.test(folded)) return 'group';
    if (index > 0 && postNote.test(folded)) return 'note';
    if (index > 0 && surelyTeacher(line, capitalCourse)) return 'teacher';
    // "Γ. Ψαραδάκης" over the title, as a sheet may set it.
    if (index === 0 && all.length > 1 && surelyTeacher(line, false)) {
      return 'teacher';
    }
    if (teacherCodes.has(line) || nameParts.has(line) || openLists.has(line)) return 'teacher';
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
  // A second kind letter, after the first, is the group's: "Ε" / ... / "Ε".
  const firstKind = kinds.findIndex(
    (kind, i) => kind === 'kind' && /^[θε]$/u.test(fold(lines[i]!)),
  );
  kinds.forEach((kind, i) => {
    if (i > firstKind + 1 && firstKind >= 0 && kind === 'kind' && /^[θε]$/u.test(fold(lines[i]!))) {
      kinds[i] = 'group';
    }
  });
  // "15 / ΕΓΧ" / "(ΑΓΡ)": a short code in brackets after a room is its own.
  kinds.forEach((kind, i) => {
    if (kind === 'text' && kinds[i - 1] === 'room' && /^\([Α-ΩΆ-ΏΪ]{2,4}\)$/u.test(lines[i]!)) {
      kinds[i] = 'room';
    }
  });
  // "Αίθ. Α3" / "Θεωρία": the kind, in capitals, right after a room.
  kinds.forEach((kind, index) => {
    if (
      kind === 'text' &&
      kinds[index - 1] === 'room' &&
      /^(?:Θεωρία|Εργαστήριο)$/u.test(lines[index]!)
    ) {
      kinds[index] = 'kind';
    }
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
    // A lab's short code closing the cell, a surname before it: "ΖΑΡΑΛΗΣ" / "ΕΖΔ".
    if (
      /^[Α-ΩΆ-ΏΪ]{2,4}$/u.test(line) &&
      /^[Α-ΩΆ-ΏΪ]{5,}$/u.test(lines[before]!) &&
      kindAnywhere.test(lines.slice(0, before).join(' ')) &&
      !teacherCodes.has(line) &&
      !kinds.includes('room')
    ) {
      kinds[last] = 'room';
      kinds[before] = 'teacher';
      teacher = [lines[before]!];
    }
    const afterRoom = kinds.slice(0, last).some((kind) => kind === 'room');
    const afterClosedTitle =
      kindMark.test(lines[before]!) ||
      codeMark.test(lines[before]!) ||
      /\)$/u.test(lines[before]!) ||
      kinds
        .slice(before + 1, last)
        .some((kind, i) => kind === 'kind' && /^\(/u.test(lines[before + 1 + i]!));
    const capitalWord =
      capitalCourse &&
      /^[Α-ΩΆ-ΏΪ]+$/u.test(line) &&
      // Three letters over a room number is a teacher's short code: "ΚΟΡ" / "3401".
      ((line.length === 3 && /^\d{3,4}$/u.test(lines[last + 1] ?? '')) ||
        (texts.length >= 3 && !joiningEnd.test(fold(lines[before]!))));
    const capitalName = !/[α-ωά-ώ]/u.test(line);
    if (
      teacher.length === 0 &&
      nameLike(line) &&
      !(grouped && capitalName) &&
      (afterRoom || afterClosedTitle || capitalWord)
    ) {
      kinds[last] = 'teacher';
      teacher = [line];
      // A name wrapped over two lines after the room: "ΑΝΤΥΠΑ ΑΡΓΥΡΩ" / "ΔΕΣΠΟΙΝΑ".
      const firstRoomAt = kinds.indexOf('room');
      const previous = lines[before]!;
      if (
        afterInner.has(previous) &&
        firstRoomAt >= 0 &&
        before > firstRoomAt &&
        /^[Α-ΩΆ-ΏΪ]{3,}(?:\s+[Α-ΩΆ-ΏΪ]{2,}\.?)?$/u.test(previous) &&
        /^[Α-ΩΆ-ΏΪ]{3,}$/u.test(line)
      ) {
        kinds[before] = 'teacher';
        teacher = [`${previous} ${line}`];
      }
    }
  }
  // The line closing the text, rooms only after it, as a cell read column by
  // column gives it: "Χημεία" / "Τόλης" / "ΑΠ3_8". A title's own last line
  // ends as a title does ("Μαθηματικών", "Μηχανικής"); a name does not.
  const onlyOpen = teacher.length > 0 && teacher.every((name) => openLists.has(name));
  if ((teacher.length === 0 || onlyOpen) && texts.length >= 2) {
    const last = texts.at(-1)!;
    const before = texts.at(-2)!;
    const line = lines[last]!;
    // A lab's short code closing the cell, a surname before it: "ΖΑΡΑΛΗΣ" / "ΕΖΔ".
    if (
      /^[Α-ΩΆ-ΏΪ]{2,4}$/u.test(line) &&
      /^[Α-ΩΆ-ΏΪ]{5,}$/u.test(lines[before]!) &&
      kindAnywhere.test(lines.slice(0, before).join(' ')) &&
      !teacherCodes.has(line)
    ) {
      kinds[last] = 'room';
      kinds[before] = 'teacher';
      teacher = [...teacher, lines[before]!];
    }
  }
  const stillOpen = teacher.length > 0 && teacher.every((name) => openLists.has(name));
  if ((teacher.length === 0 || stillOpen) && texts.length >= 2 && kinds[texts.at(-1)!] === 'text') {
    const last = texts.at(-1)!;
    const before = texts.at(-2)!;
    const line = lines[last]!;
    const roomsAfter =
      kinds.slice(last + 1).includes('room') &&
      kinds.slice(last + 1).every((kind) => kind === 'room' || kind === 'kind' || kind === 'group');
    const titleEnding =
      /(?:ών|ων|ικής|ικης|ικού|ικου|ικά|ικα|ίας|ιας|ισμού|ισμου|ότητας|οτητας|σεων|ήσεων|ματος|μάτων|ματων|ματα|σεις|ής|ού|ΩΝ|ΜΑΤΑ|ΣΕΙΣ|ΙΚΗΣ|ΙΚΟΥ|ΙΚΑ|ΙΑΣ|ΙΣΜΟΥ|ΟΤΗΤΑΣ|ΣΕΩΝ|ΜΑΤΩΝ|Ι|ΙΙ|ΙΙΙ)$/u;
    if (
      roomsAfter &&
      nameLike(line) &&
      line.split(/\s+/u).length <= 2 &&
      !titleEnding.test(line) &&
      !joiningEnd.test(fold(lines[before]!)) &&
      !(grouped && !/[α-ωά-ώ]/u.test(line))
    ) {
      kinds[last] = 'teacher';
      teacher = [...(stillOpen ? teacher : []), line];
    }
  }
  // A name set just above the room while the title runs on below it:
  // "ΕΙΣΑΓΩΓΗ ΣΤΟΝ" / "ΚΟΡ" / "4204" / "ΠΡΟΓΡΑΜΜΑΤΙΣΜΟ (Θ)".
  const firstRoom = kinds.indexOf('room');
  if (teacher.length === 0 && capitalCourse && firstRoom > 1 && kinds[firstRoom - 1] === 'text') {
    const line = lines[firstRoom - 1]!;
    const titleRunsOn = lines
      .slice(firstRoom + 1)
      // A title word & its bracket: "ΠΡΟΓΡΑΜΜΑΤΙΣΜΟ (Θ)", "ΥΠΑΙΘΡΟΥ (ΑΟ)".
      .some((after, i) => /\S\s+\([^()]+\)$/u.test(after) || kinds[firstRoom + 1 + i] === 'kind');
    if (
      titleRunsOn &&
      /^[Α-ΩΆ-ΏΪ]{3,}$/u.test(line) &&
      !/(?:ΟΤΗΤΑ|ΙΚΗΣ|ΙΑΣ|ΩΝ)$/u.test(line) &&
      texts.length >= 2
    ) {
      kinds[firstRoom - 1] = 'teacher';
      teacher = [line];
    }
  }
  // After a kind printed in a column of its own, with no room before it, the
  // text left is where the class is held: "Ε" / "ΑΝΑΤΟΜΙΚΗΣ" / "Α" / name.
  const lone = kinds.findIndex((kind, index) => kind === 'kind' && !/^\(/u.test(lines[index]!));
  const named = kinds.lastIndexOf('teacher');
  const group = kinds.findIndex((kind, index) => index > lone && kind === 'group');
  const roomsEnd = group > lone ? group : named;
  if (lone > 0 && (named > lone || group > lone) && !kinds.slice(0, lone).includes('room')) {
    kinds.forEach((kind, index) => {
      if (index > lone && index < roomsEnd && kind === 'text') kinds[index] = 'room';
    });
  }

  // A surname closing the title's last line, its ending only a surname's:
  // "ΓΑΛΛΙΚΗ ... ΟΡΟΛΟΓΙΑ ΣΚΑΛΙΔΗ".
  if (teacher.length === 0 && kinds.includes('room')) {
    const lastText = kinds.lastIndexOf('text');
    const closing =
      lastText >= 0
        ? /^(.*\S)\s+([Α-ΩΆ-ΏΪ]{3,}(?:ΙΔΗΣ|ΙΔΗ|ΑΚΗΣ|ΑΚΗ|ΟΠΟΥΛΟΣ|ΟΠΟΥΛΟΥ|ΙΑΔΗΣ|ΙΔΟΥ|ΤΖΗΣ|ΤΣΗΣ))$/u.exec(
            lines[lastText]!,
          )
        : null;
    if (closing) {
      lines[lastText] = closing[1]!;
      teacher = [closing[2]!];
    }
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
  const joined = [...of('text'), ...kindsOnTitle]
    .join(' ')
    .replace(/(?:\s*[—–]){2,}/gu, '')
    .replace(/[,:]$/u, '')
    .trim()
    .replace(courseCode, '');
  // A cell holding one class twice, as two slots squeezed together: the
  // title once, its code between the two left out.
  const words = joined
    // A code glued to the title before it: "ΚΛΙΝΙΚΗ ΑΣΚΗΣΗ ΙΕΘ304Ε - ...".
    .replace(/([Α-ΩA-Z])([Α-ΩA-Z]{2}\d{3}[Α-ΩA-Z]?\s*-\s)/gu, '$1 $2')
    .replace(/\s[Α-ΩA-Z]{2,4}\d{2,4}[Α-ΩA-Z]?\s*-?\s/gu, ' ')
    .split(' ');
  const half = words.length / 2;
  const course =
    Number.isInteger(half) &&
    half >= 2 &&
    words.slice(0, half).join(' ') === words.slice(half).join(' ')
      ? words.slice(0, half).join(' ')
      : joined;
  const rooms = [...new Set(of('room').map((line) => line.replace(/\s*[-–]$/u, '')))];
  // A code before a title line may be the room of the class beside it; a room
  // on a line of its own is surer.
  const sure = rooms.filter((one) => !ledRooms.has(one));
  const room = (sure.length ? sure : rooms).join(' ');
  const distinct = [...new Set(teacher.map((name) => name.replace(/^\((.*)\)$/u, '$1')))];
  const teachers: string[] = [];
  for (const raw of distinct) {
    const name = raw.replace(/\s*\/$/u, '');
    const previous = teachers.at(-1);
    // A list left open by a slash goes on with the next name.
    if (previous?.endsWith('/')) {
      teachers[teachers.length - 1] = `${previous}${name}`;
      if (raw.endsWith('/')) teachers[teachers.length - 1] += '/';
      continue;
    }
    if (raw !== name && openLists.has(raw)) {
      teachers.push(`${name}/`);
      continue;
    }
    if (previous && nameParts.has(name) && !/\s/u.test(previous) && !/\s/u.test(name)) {
      teachers[teachers.length - 1] = `${previous} ${name}`;
    } else teachers.push(name);
  }
  // A kind on a line of its own: "Ε" or "εργαστήριο" a lab, "ΑΠ" a tutorial.
  const kindsAlone = lines.filter((line, index) => kinds[index] === 'kind').map(fold);
  const type = kindsAlone.some((kind) => /^(?:ε|-?εργ|εργαστηριο)/u.test(kind))
    ? 'lab'
    : kindsAlone.includes('απ')
      ? 'tutorial'
      : undefined;
  return {
    course,
    ...(teachers.length
      ? { teacher: teachers.map((one) => one.replace(/\/$/u, '')).join(', ') }
      : {}),
    room,
    ...(type ? { type } : {}),
  };
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
  let lineType: string | undefined;
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
    lineType = lines.type;
  }

  const { course, type: titleType } = classType(courseText);
  const type = titleType ?? lineType;
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

// A class's kind anywhere in a line: "και Καινοτομίας (Θ) Παυλίδου -".
const kindAnywhere = /\((?:Θ|Ε|E)\d?(?:\s*[,/]\s*(?:Θ|Ε|E))?\)/u;

// A line ruled across a cell to set its classes apart: "— — —".
const rule = /^\s*(?:(?:[—–]\s*){2,}|(?:-\s*){3,})$/u;

/** A cell's text cut at its rules, the empty pieces left out. */
function segments(text: string): string[] {
  const pieces: string[][] = [[]];
  for (const line of text.split('\n')) {
    if (rule.test(line)) pieces.push([]);
    else pieces.at(-1)!.push(line);
  }
  return pieces.map((piece) => piece.join('\n').trim()).filter(Boolean);
}

/**
 * The classes a cell stacks one under another, as some grids list every
 * class of a slot in one cell: each ends on the line naming its room. A cell
 * with one class, or with italic runs that mark its parts, is left whole.
 */
function stackedParts(cell: Inline): Inline[] {
  if (cell.some((run) => run.italic)) return [cell];
  // Classes the document set side by side, each told apart by a blank line,
  // a few lines apiece.
  const split = cellText(cell)
    .split(/\n\s*\n/u)
    .map((part) => part.trim())
    .filter(Boolean);
  // A part with no title of its own — only rooms, or only the teachers where
  // the other parts' titles carry a mark ("(Θ)", "ΜΠ103") — is the details of
  // the class beside it.
  const titled = (part: string): boolean =>
    part.split('\n').some((line) => kindAnywhere.test(line) || courseCode.test(tidy(line)));
  const marking = split.some(titled);
  const detailsOnly = (part: string): boolean =>
    part
      .split('\n')
      .every((line) => rule.test(line) || roomLine(tidy(line)) || /^[^(]*\)$/u.test(tidy(line))) ||
    (marking && !titled(part)) ||
    /^[Α-ΩΆ-ΏΪ]{4,}\s*\/$/u.test(part.split('\n')[0]!.trim());
  const apart: string[] = [];
  for (const part of split) {
    const previous = apart.at(-1);
    if (previous === undefined || !detailsOnly(part)) {
      apart.push(part);
      continue;
    }
    // Classes stacked down one column, their rooms down the next, each set
    // off by a rule: the nth room goes with the nth class.
    const classes = segments(previous);
    const details = segments(part);
    if (classes.length > 1 && classes.length === details.length) {
      apart.splice(-1, 1, ...classes.map((one, i) => `${one}\n${details[i]!}`));
    } else apart[apart.length - 1] = `${previous}\n${part}`;
  }
  if (apart.length > 1 && detailsOnly(apart[0]!)) apart.splice(0, 2, `${apart[1]}\n${apart[0]}`);
  if (apart.length > 1 && apart.every((part) => part.includes('\n'))) {
    return apart.flatMap((part) => stackedParts([{ text: part }]));
  }
  // Classes stacked in one cell, a rule between each: "— — —".
  const ruled = segments(apart.join('\n'));
  if (ruled.length > 1) return ruled.map((part) => [{ text: part }]);
  const lines = cellText(cell).split('\n').map(tidy).filter(Boolean);
  // The next class's coded title, run on after this one's teacher as a slot's
  // edge fell: "... Χρυσάνθου" / "Χρύσανθος" / "ΕΘ504 - ΗΘΙΚΗ".
  const coded = (line: string): boolean => /^[Α-ΩA-Z]{1,4}\d{2,4}[Α-ΩA-Z]?\s*[-–]\s/u.test(line);
  const runOn = lines.findIndex(
    (line, index) =>
      index > 1 &&
      coded(line) &&
      lines.some((one, i) => i > 0 && groupLine.test(fold(one)) && !kindLine.test(fold(one))) &&
      /^[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+(?:\s+[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+){0,2}$/u.test(lines[index - 1]!),
  );
  if (runOn > 0) {
    // Read column by column, this class's kind, room & group follow the next
    // one's title: they stay with this class.
    const rest = lines.slice(runOn);
    const details = rest.filter((line) => !coded(line));
    return [
      ...stackedParts([{ text: [...lines.slice(0, runOn), ...details].join('\n') }]),
      ...rest.filter(coded).map((line) => [{ text: line }]),
    ];
  }
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
  // Only a cell naming two rooms or more can hold more than one class. Rooms
  // a hall's name gives ("Αίθουσα") are sure; a bare code ("ΒΠ3_11") is sure
  // only where each class it ends has a title, a teacher & the room.
  const sure = lines.filter(looksLikeRoom).length >= 2;
  const isRoom = sure ? looksLikeRoom : roomLine;
  if (lines.filter(isRoom).length < 2) return [cell];
  const parts: string[][] = [[]];
  lines.forEach((line, index) => {
    parts.at(-1)!.push(line);
    const next = lines[index + 1];
    if (
      next !== undefined &&
      isRoom(line) &&
      !roomLine(next) &&
      !surelyTeacher(next, false) &&
      !teacherLine.test(next) &&
      !looksLikeName(next)
    ) {
      parts.push([]);
    }
  });
  // A part too short to be a class is a stray: keep the cell whole.
  const least = sure ? 2 : 3;
  if (parts.length < 2 || parts.some((part) => part.length < least)) return [cell];
  return parts.map((part) => [{ text: part.join('\n') }]);
}

/**
 * Whether a class is only a word of another's title, cut off where a slot's
 * edge fell, with nothing of its own: "Μαθηματικός" under "Μαθηματικός
 * Προγραμματισμός", "Ανάλυση" over "Χρηματοοικονομικών Καταστάσεων Ανάλυση".
 */
function fragmentOf(piece: ClassSession, whole: ClassSession): boolean {
  if (piece.teacher || piece.room || piece.course.includes(' ')) return false;
  return whole.course.startsWith(`${piece.course} `) || whole.course.endsWith(` ${piece.course}`);
}

/**
 * Whether two slots' titles are one class's: the same, or one cut short of
 * the other where a slot's edge fell across it ("Νανοδομημένα και" /
 * "Νανοδομημένα και Νανοσύνθετα Πολυμερικά Υλικά").
 */
function sameTitle(a: string, b: string): boolean {
  if (a === b) return true;
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  return (
    short.split(' ').length >= 2 &&
    long.startsWith(`${short} `) &&
    !long.slice(short.length + 1).startsWith('(')
  );
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
    // The last teacher or room each labelled column gave, for a ditto under it.
    const lastInColumn = new Map<number, string>();
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
          // A ditto mark under a teacher or room: the same as the row above's.
          const value = ditto.test(text) ? lastInColumn.get(col) : tidy(text);
          if (session && value) session[role] ??= value;
          if (value) lastInColumn.set(col, value);
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

        // The teacher of the class above alone in the next slot: the class runs on.
        if (
          above &&
          time &&
          above.slot === slot - 1 &&
          above.session.teacher !== undefined &&
          tidy(text) === above.session.teacher
        ) {
          above.session.endTime = pad(time[2]!);
          above.slot = slot;
          continue;
        }
        // A name under a course is that course's teacher, not a class of its
        // own; on a timed row it also means the course runs on into this slot.
        if (
          fromSlotAbove &&
          !above.session.teacher &&
          (looksLikeName(text) ||
            titleSurnames(text) ||
            (!/[α-ωά-ώ]/u.test(above.session.course) &&
              /^[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+(?:\s+[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]+){1,2}$/u.test(text)))
        ) {
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
        if (looksLikeRoom(text) || (!text.includes('\n') && roomLine(text))) {
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
            (sameTitle(above.session.course, session.course) ||
              fragmentOf(session, above.session) ||
              fragmentOf(above.session, session)) &&
            above.session.endTime === session.startTime &&
            above.session.type === session.type &&
            (!session.room || !above.session.room || session.room === above.session.room) &&
            (session.teacher === undefined ||
              above.session.teacher === undefined ||
              session.teacher === above.session.teacher)
          ) {
            if (session.course.length > above.session.course.length) {
              above.session.course = session.course;
            }
            above.session.teacher ??= session.teacher;
            above.session.endTime = session.endTime;
            above.slot = slot;
            if (!above.session.room && session.room) above.session.room = session.room;
            inRow.set(day, above.session);
            inColumn.set(col, above.session);
            continue;
          }
          // A title that starts on a joining word runs on from the slot
          // above, where a slot's edge cut it: "ΗΘΙΚΗ" / "ΚΑΙ ΔΕΟΝΤΟΛΟΓΙΑ ...".
          if (
            above &&
            above.slot === slot - 1 &&
            above.session.endTime === session.startTime &&
            /^(?:και|της|των|στην|στη|στο|στον|στις|για|με)\s/iu.test(fold(session.course))
          ) {
            above.session.course = `${above.session.course} ${session.course}`;
            above.session.teacher ??= session.teacher;
            above.session.room ??= session.room;
            above.session.endTime = session.endTime;
            above.slot = slot;
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

  return withKnownTeachers(classes);
}

/**
 * Gives a class with no teacher the one its title closes on, where the sheet
 * names that teacher for another class — a surname set on the title's line,
 * "... ΦΥΤΩΝ ΤΕΣΤΕΜΠΑΣΗΣ ΕΡ ΜΚ" — the rest after it the room.
 */
function withKnownTeachers(classes: ClassSession[]): ClassSession[] {
  // A name the sheet gives as a teacher more often than it prints it in a
  // title, & that does not end as a title's word does ("ΑΝΑΤΟΜΙΑ").
  const asTeacher = new Map<string, number>();
  const inTitles = new Map<string, number>();
  for (const one of classes) {
    for (const name of (one.teacher ?? '').split(/\s*[,/]\s*/u)) {
      asTeacher.set(name, (asTeacher.get(name) ?? 0) + 1);
    }
    for (const word of new Set(one.course.split(' '))) {
      inTitles.set(word, (inTitles.get(word) ?? 0) + 1);
    }
  }
  const known = new Set(
    [...asTeacher].flatMap(([name, count]) =>
      /^[Α-ΩΆ-ΏΪ]{5,}$|^[Α-ΩΆ-Ώ][α-ωά-ώϊΐ]{4,}$/u.test(name) &&
      count >= 2 &&
      count >= (inTitles.get(name) ?? 0) &&
      !/(?:ΙΑ|ΙΑΣ|ΙΚΗ|ΙΚΗΣ|ΙΚΑ|ΟΤΗΤΑ|ΟΤΗΤΕΣ|ΤΗΤΕΣ|ΣΕΙΣ|ΜΑΤΑ|ΩΝ|ία|ική|ικά|ότητα|ών)$/u.test(name)
        ? [name]
        : [],
    ),
  );
  for (const one of classes) {
    if (one.teacher) continue;
    const words = one.course.split(' ');
    const at = words.findIndex((word, i) => i > 0 && known.has(word));
    if (at < 0) continue;
    const after = words.slice(at + 1).join(' ');
    // After the name, nothing, or a room, or the title's kind: "(Θ)".
    const rest = after.replace(/\s*\((?:Θ|Ε|E)\d?\)$/u, '');
    if (
      rest &&
      !roomLine(rest) &&
      !/^(?:[Α-ΩΆ-ΏΪ]{1,5}|\d{1,2})(?:(?:\s*\/\s*|\s+)(?:[Α-ΩΆ-ΏΪ]{1,5}|\d{1,2}))*$/u.test(rest)
    ) {
      continue;
    }
    one.teacher = words[at]!;
    one.course = [...words.slice(0, at), after.slice(rest.length).trim()].filter(Boolean).join(' ');
    if (rest) one.room ??= rest;
  }
  return classes;
}
