import mammoth from 'mammoth';

import type { Block } from '../content/blocks.js';
import { htmlToBlocks } from '../content/html-to-blocks.js';

/**
 * A DOCX becomes blocks by letting mammoth turn it into clean semantic HTML
 * (headings, paragraphs, lists, tables, bold & italic) and running that
 * through the same converter the announcements use, so a document & a web
 * announcement render identically.
 */
export async function docxToBlocks(buffer: Buffer, sourceUrl: string): Promise<Block[]> {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  return htmlToBlocks(html, sourceUrl);
}
