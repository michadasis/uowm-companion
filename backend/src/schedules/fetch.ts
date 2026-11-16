import type { Block } from '../content/blocks.js';
import { discoverDocuments } from '../documents/discover.js';
import { NotADocumentError, renderDocument } from '../documents/pipeline.js';
import { fetchBuffer, fetchText } from '../http/fetch.js';
import type { Department } from '../registry/index.js';

import { parseExamList } from './parse/examList.js';
import { parseTimetableGrid } from './parse/timetableGrid.js';
import type { ScheduleKind, ScheduleResponse } from './types.js';

/**
 * Builds a department's exam or class schedule: finds the current document,
 * renders it natively for the Original view, and (later) parses it into
 * structured items. A department with no such source, or one this pipeline
 * can't read yet, comes back with `available` set accordingly & an empty
 * Original, so the app can show the right state.
 */
export async function fetchSchedule(
  department: Department,
  kind: ScheduleKind,
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

  const discovery = await discoverDocuments(source, kind, fetchText);
  if (!discovery) return empty;

  // Each document is read on its own: one that can't be read leaves the rest.
  // A link that turns out to serve no document at all — a dead link landing on
  // a 404 page — is dropped, as if it had never been listed.
  const results = await Promise.all(
    discovery.documents.map((document) =>
      renderDocument(document, fetchBuffer).then(
        (result) => ({ document, blocks: result.blocks }),
        (error: unknown) =>
          error instanceof NotADocumentError ? null : { document, blocks: [] as Block[] },
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
  const blocks: Block[] =
    !named
      ? rendered.flat()
      : rendered.flatMap((part, index) =>
          part.length
            ? [
                { type: 'heading', level: 3, content: [{ text: documents[index]!.label }] },
                ...part,
              ]
            : [],
        );

  try {
    return {
      ...empty,
      document: meta,
      exams: kind === 'exams' ? parseExamList(blocks) : [],
      classes: kind === 'timetable' ? parseTimetableGrid(blocks) : [],
      original: blocks,
    };
  } catch {
    // A parser tripped on an unusual document. The schedule still shows as
    // written, with its link, rather than failing the whole request.
    return { ...empty, document: meta, original: blocks };
  }
}
