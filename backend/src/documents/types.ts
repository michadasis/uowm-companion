import type { Block } from '../content/blocks.js';

export type DocumentFormat = 'docx' | 'doc' | 'pdf' | 'xlsx' | 'xls';

export interface DiscoveredDocument {
  url: string;
  format: DocumentFormat;
  /** The link text it was found under, for display. */
  label: string;
}

/** The document rendered as native blocks, plus where it came from. */
export interface RenderedDocument {
  document: DiscoveredDocument;
  blocks: Block[];
}

const scheduleFormats = new Set<DocumentFormat>(['docx', 'doc', 'pdf', 'xlsx', 'xls']);

export function asScheduleFormat(format: string | null): DocumentFormat | null {
  return format && scheduleFormats.has(format as DocumentFormat)
    ? (format as DocumentFormat)
    : null;
}
