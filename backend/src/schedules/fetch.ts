import { discoverDocument } from '../documents/discover.js';
import { renderDocument } from '../documents/pipeline.js';
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

  const document = await discoverDocument(source, fetchText);
  if (!document) return empty;

  const meta = { url: document.url, label: document.label, format: document.format };
  try {
    const rendered = await renderDocument(document, fetchBuffer);
    return {
      ...empty,
      document: meta,
      exams: kind === 'exams' ? parseExamList(rendered.blocks) : [],
      classes: kind === 'timetable' ? parseTimetableGrid(rendered.blocks) : [],
      original: rendered.blocks,
    };
  } catch {
    // The document was found but could not be read (an unreadable PDF, say).
    // Still report it as available with its link, so the app offers the source
    // instead of failing the whole request.
    return { ...empty, document: meta };
  }
}
