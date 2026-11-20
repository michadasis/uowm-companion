import type { Block } from '../content/blocks.js';

import { docToBlocks } from './doc.js';
import { docxToBlocks } from './docx.js';
import { pdfToBlocks } from './pdf.js';
import type { DiscoveredDocument, RenderedDocument } from './types.js';
import { xlsxToBlocks } from './xlsx.js';

/** A link that promised a document but served something else, like a 404 page. */
export class NotADocumentError extends Error {
  constructor(url: string) {
    super(`Not a document: ${url}`);
    this.name = 'NotADocumentError';
  }
}

// What every file of a format starts with: PDF its header, the Office Open
// XML formats the zip signature, the old Office formats the OLE signature.
const signatures: Record<DiscoveredDocument['format'], number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  docx: [0x50, 0x4b],
  xlsx: [0x50, 0x4b],
  doc: [0xd0, 0xcf, 0x11, 0xe0],
  xls: [0xd0, 0xcf, 0x11, 0xe0],
};

function looksLike(data: Uint8Array, format: DiscoveredDocument['format']): boolean {
  // A PDF may carry a little junk before its header; allow for it.
  const window = format === 'pdf' ? 1024 : 0;
  const signature = signatures[format];
  for (let start = 0; start <= window && start + signature.length <= data.length; start++) {
    if (signature.every((byte, index) => data[start + index] === byte)) return true;
  }
  return false;
}

/**
 * Renders a discovered document as native blocks for the Original view. DOCX
 * PDF & XLSX are read here; DOC & XLS come back empty for now, so the
 * caller falls back to a link out. Nothing here throws on an unknown format.
 */
export async function renderDocument(
  document: DiscoveredDocument,
  fetchBuffer: (url: string) => Promise<Uint8Array>,
): Promise<RenderedDocument> {
  const data = await fetchBuffer(document.url);
  if (!looksLike(data, document.format)) throw new NotADocumentError(document.url);
  let blocks: Block[] = [];

  if (document.format === 'docx') {
    blocks = await docxToBlocks(Buffer.from(data), document.url);
  } else if (document.format === 'pdf') {
    blocks = await pdfToBlocks(data);
  } else if (document.format === 'xlsx') {
    blocks = await xlsxToBlocks(data);
  } else if (document.format === 'doc') {
    blocks = await docToBlocks(data);
  }

  return { document, blocks };
}
