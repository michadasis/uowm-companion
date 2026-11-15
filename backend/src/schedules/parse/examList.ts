import { plainText } from '../../content/blocks.js';
import type { Block } from '../../content/blocks.js';
import type { Exam } from '../types.js';

const weekdays: Record<string, number> = {
  δευτερα: 1,
  τριτη: 2,
  τεταρτη: 3,
  πεμπτη: 4,
  παρασκευη: 5,
  σαββατο: 6,
  κυριακη: 7,
};

function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** "Δευτέρα 31-08-2026" -> the ISO date, or null if the line is not a day. */
function parseDay(text: string): string | null {
  const match = /^([Α-Ωα-ωΆ-ώ]+)\s+(\d{1,2})[-/](\d{1,2})[-/](\d{4})/.exec(text.trim());
  if (!match || !(fold(match[1]!) in weekdays)) return null;
  const [, , day, month, year] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    .toISOString()
    .slice(0, 10);
}

// A room starts at one of these tokens; everything from there to the end of
// the line is the room (there can be several, comma-separated).
const roomStart = /(Μ\.?\s?Αμφ|Αμφ\.?|Εργ\.?\s|Αίθ\.?|ΑΙΘ|(?:^|[\s,])[ΒB]\d)/u;

// Initials and a surname at the end of what's left, e.g. "Κ. Μόσχου" or
// "Β. Μ. Πανάτσα".
const trailingExaminer = /(?:^|\s)((?:[Α-ΩΆ-Ώ]\.\s*){1,3}[Α-ΩΆ-Ώ][α-ωά-ώϊΐ'’]+)\s*$/u;

// Enrollment counts like "(5+0)" or "(141+4+6)", which carry no meaning here.
const counts = /\s*,?\s*\(\d+(?:\s*\+\s*\d+)+\)/gu;

function parseExamLine(line: string, date: string | undefined): Exam | null {
  const time = /^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})\s+(.+)$/u.exec(line.trim());
  if (!time) return null;
  const [, startTime, endTime, afterTime] = time;

  let rest = afterTime!;
  let room: string | undefined;
  const roomMatch = roomStart.exec(rest);
  if (roomMatch && roomMatch.index > 0) {
    room = rest.slice(roomMatch.index).replace(/\s+/g, ' ').trim();
    rest = rest.slice(0, roomMatch.index);
  }

  rest = rest.replace(counts, ' ');

  let examiners: string[] | undefined;
  const examinerMatch = trailingExaminer.exec(rest);
  if (examinerMatch) {
    examiners = [examinerMatch[1]!.replace(/\s+/g, ' ').trim()];
    rest = rest.slice(0, examinerMatch.index);
  }

  // Semester markers are the parenthetical groups that contain an ordinal.
  const semesters = [...rest.matchAll(/\(([^)]*['’΄][^)]*)\)/gu)].map((m) => m[1]!.trim());
  const course = rest
    .replace(/\([^)]*\)/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[\s,]+$/u, '')
    .trim();

  if (!course) return null;

  return {
    course,
    ...(date ? { date } : {}),
    startTime,
    endTime,
    ...(semesters.length ? { semester: semesters.join(', ') } : {}),
    ...(room ? { room } : {}),
    ...(examiners ? { examiners } : {}),
  };
}

/**
 * Parses an exam schedule written as a run of paragraphs: a day line
 * ("Δευτέρα 31-08-2026") sets the date for the exam lines under it, each of
 * which starts with a time range. This is the format the Informatics
 * department uses. A document in another shape yields nothing, so it is safe
 * to run on any schedule.
 */
export function parseExamList(blocks: Block[]): Exam[] {
  const exams: Exam[] = [];
  let date: string | undefined;

  for (const block of blocks) {
    if (block.type !== 'paragraph' && block.type !== 'heading') continue;
    const text = plainText(block.content);
    const day = parseDay(text);
    if (day) {
      date = day;
      continue;
    }
    const exam = parseExamLine(text, date);
    if (exam) exams.push(exam);
  }

  return exams;
}
