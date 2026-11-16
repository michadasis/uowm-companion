import type { Block } from '../content/blocks.js';

import { docxToBlocks } from './docx.js';
import { pdfToBlocks } from './pdf.js';
import type { DiscoveredDocument, RenderedDocument } from './types.js';
import { xlsxToBlocks } from './xlsx.js';

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
  let blocks: Block[] = [];

  if (document.format === 'docx') {
    blocks = await docxToBlocks(Buffer.from(data), document.url);
  } else if (document.format === 'pdf') {
    blocks = await pdfToBlocks(data);
  } else if (document.format === 'xlsx') {
    blocks = await xlsxToBlocks(data);
  }

  return { document, blocks };
}
