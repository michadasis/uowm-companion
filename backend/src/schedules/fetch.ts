import type { Block } from '../content/blocks.js';
import { discoverDocuments } from '../documents/discover.js';
import { NotADocumentError, renderDocument } from '../documents/pipeline.js';
import { fetchBuffer, fetchText, isTransient } from '../http/fetch.js';
import type { Department } from '../registry/index.js';

import { parseClassTable } from './parse/classTable.js';
import { parseExamList } from './parse/examList.js';
import { parseExamTable } from './parse/examTable.js';
import { plausibleClasses, plausibleExams } from './parse/plausible.js';
import { parseTimetableGrid } from './parse/timetableGrid.js';
import type { ScheduleKind, ScheduleResponse } from './types.js';

/**
 * Builds a department's exam or class schedule: finds the current document,
 * renders it natively for the Original view, and (later) parses it into
 * structured items. A department with no such source, or one this pipeline
 * can't read yet, comes back with `available` set accordingly & an empty
 * Original, so the app can show the right state.
 */
const isLongPast = (date: string, now: Date): boolean =>
  now.getTime() - new Date(`${date}T23:59:59Z`).getTime() > 7 * 86_400_000;

export async function fetchSchedule(
  department: Department,
  kind: ScheduleKind,
  now: Date = new Date(),
): Promise<ScheduleResponse> {
  const source = kind === 'exams' ? department.sources.exams : department.sources.timetable;
  const empty: ScheduleResponse = {
    dept: department.id,
    kind,
    available: source !== undefined,
    document: null,
    exams: [],
    classes: [],
    original: [],
  };

  if (!source) return empty;

  const discovery = await discoverDocuments(source, kind, fetchText, now);
  if (!discovery) return empty;

  // Each document is read on its own: one that can't be read leaves the rest.
  // A link that turns out to serve no document at all — a dead link landing on
  // a 404 page — is dropped, as if it had never been listed. A site that is
  // only slow fails the whole request instead, so the last full schedule
  // stays served rather than one missing a part.
  const results = await Promise.all(
    discovery.documents.map((document) =>
      renderDocument(document, fetchBuffer).then(
        (result) => ({ document, blocks: result.blocks }),
        (error: unknown) => {
          if (isTransient(error)) throw error;
          return error instanceof NotADocumentError ? null : { document, blocks: [] as Block[] };
        },
      ),
    ),
  );
  const parts = results.filter((part) => part !== null);
  if (parts.length === 0) return empty;
  const documents = parts.map((part) => part.document);
  const rendered = parts.map((part) => part.blocks);

  const meta = { url: documents[0]!.url, label: discovery.label, format: documents[0]!.format };
  // A schedule split into several documents reads as one, each part headed by
  // the name it was linked under.
  const named = new Set(documents.map((document) => document.label)).size > 1;
  const blocks: Block[] = !named
    ? rendered.flat()
    : rendered.flatMap((part, index) =>
        part.length
          ? [{ type: 'heading', level: 3, content: [{ text: documents[index]!.label }] }, ...part]
          : [],
      );

  try {
    const exams = kind === 'exams' ? parseExams(blocks) : [];
    // A sitting whose every exam is over by a week is last term's, not the
    // coming one: better to say none is out yet.
    if (exams.length && exams.every((exam) => exam.date && isLongPast(exam.date, now)))
      return empty;
    return {
      ...empty,
      document: meta,
      exams,
      classes: kind === 'timetable' ? parseClasses(blocks) : [],
      original: blocks,
    };
  } catch {
    // A parser tripped on an unusual document. The schedule still shows as
    // written, with its link, rather than failing the whole request.
    return { ...empty, document: meta, original: blocks };
  }
}

/**
 * The exams in a schedule, read by whichever parser recognises its layout: a
 * list of day & time lines, or a table with a header row. Both are tried; the
 * one that finds more is the one that matched.
 */
function parseExams(blocks: Block[]): ReturnType<typeof parseExamList> {
  const fromList = parseExamList(blocks);
  const fromTable = parseExamTable(blocks);
  const best = fromTable.length > fromList.length ? fromTable : fromList;
  // An agenda that doesn't hold together is worse than none: the app then
  // shows the document as written.
  if (!plausibleExams(best)) return [];
  return best.map(({ semester, ...exam }) => {
    const tidied = semester === undefined ? undefined : tidySemester(semester);
    return tidied ? { ...exam, semester: tidied } : exam;
  });
}

// Latin letters a semester is often typed with in place of the Greek ones.
const latinToGreek: Record<string, string> = { A: 'Α', B: 'Β', E: 'Ε', H: 'Η', Z: 'Ζ', I: 'Ι' };

/**
 * One spelling for a semester, as the app's semester filter matches them:
 * "Δ’", "B'", " Ζ’" -> "Δ΄", "Β΄", "Ζ΄". Several ("Ε’/ΣΤ’") are kept as
 * written, tidied; none gives undefined.
 */
export function tidySemester(semester: string): string | undefined {
  const tidied = semester
    .trim()
    .replace(/[A-Z]/g, (letter) => latinToGreek[letter] ?? letter)
    .replace(/['’`΄]/gu, '΄')
    .replace(/\s*[/,]\s*/g, '/')
    .replace(/^\/+|\/+$/g, '');
  return tidied && tidied !== '΄' ? tidied : undefined;
}

/** The classes in a timetable, read as a weekly grid or as a list, whichever finds more. */
function parseClasses(blocks: Block[]): ReturnType<typeof parseTimetableGrid> {
  const fromGrid = parseTimetableGrid(blocks);
  const fromList = parseClassTable(blocks);
  const classes = fromList.length > fromGrid.length ? fromList : fromGrid;
  return plausibleClasses(classes) ? classes : [];
}
