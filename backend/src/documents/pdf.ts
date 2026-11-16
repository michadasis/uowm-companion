// unpdf ships a serverless build of pdfjs that needs no native canvas or DOM
// shims, so PDF text extraction runs the same locally & on Vercel.
import { getDocumentProxy } from 'unpdf';

import type { Block } from '../content/blocks.js';

import { gridBlocks } from './pdfGrid.js';
import type { PositionedText } from './pdfGrid.js';

interface Line {
  text: string;
  y: number;
  height: number;
}

/**
 * Extracts a PDF's text into paragraph blocks for the Original view. This is
 * the native rich-text fallback: it reads the text layer line by line and
 * joins lines into paragraphs by the gaps between them. A page laid out as a
 * weekly timetable grid is rebuilt as a table instead, from where its text
 * sits, so the grid parser can read it; a PDF with no text layer at all comes
 * back empty, for the caller to handle.
 */
export async function pdfToBlocks(data: Uint8Array): Promise<Block[]> {
  const doc = await getDocumentProxy(data);
  const blocks: Block[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();

    const positioned: PositionedText[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      positioned.push({
        text: item.str,
        x: item.transform[4] as number,
        y: item.transform[5] as number,
        width: item.width,
      });
    }
    const grid = gridBlocks(positioned);
    if (grid) {
      if (pageNumber > 1) blocks.push({ type: 'divider' });
      blocks.push(...grid);
      page.cleanup();
      continue;
    }

    const lines: Line[] = [];
    let current = '';
    let y = 0;
    let height = 0;
    for (const item of content.items) {
      if (!('str' in item)) continue;
      current += item.str;
      y = item.transform[5] as number;
      height = Math.max(height, item.height || 0);
      if (item.hasEOL) {
        const text = current.replace(/\s+/g, ' ').trim();
        if (text) lines.push({ text, y, height: height || 10 });
        current = '';
        height = 0;
      }
    }
    const tail = current.replace(/\s+/g, ' ').trim();
    if (tail) lines.push({ text: tail, y, height: height || 10 });

    if (pageNumber > 1 && lines.length) blocks.push({ type: 'divider' });
    blocks.push(...linesToParagraphs(lines));
    page.cleanup();
  }

  return blocks;
}

/** Joins lines into paragraphs: a gap taller than a line starts a new one. */
function linesToParagraphs(lines: Line[]): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let previousY: number | null = null;
  let previousHeight = 10;

  const flush = () => {
    if (paragraph.length)
      blocks.push({ type: 'paragraph', content: [{ text: paragraph.join(' ') }] });
    paragraph = [];
  };

  for (const line of lines) {
    if (previousY !== null) {
      const gap = previousY - line.y;
      if (gap > previousHeight * 1.8) flush();
    }
    paragraph.push(line.text);
    previousY = line.y;
    previousHeight = line.height;
  }
  flush();
  return blocks;
}
