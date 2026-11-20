import WordExtractor from 'word-extractor';

import type { Block, Inline } from '../content/blocks.js';

const tidy = (text: string): string => text.replace(/\s+/g, ' ').trim();

const paragraph = (text: string): Block => ({ type: 'paragraph', content: [{ text }] });

/**
 * Reads a legacy Word (.doc) file into blocks for the Original view. The
 * extractor passes table cells on as tab-separated text, with no mark where a
 * row ends but a line break — which a cell's own line breaks blur. So where
 * the lines between the first & the last with several cells mostly have the
 * same number of them, each line is a row of a table; otherwise the text is
 * kept as lines, a row's cells divided by a bar.
 */
export async function docToBlocks(data: Uint8Array): Promise<Block[]> {
  const document = await new WordExtractor().extract(Buffer.from(data));
  const lines = document
    .getBody()
    .split('\n')
    .map((line) => line.split('\t').map(tidy))
    .filter((cells) => cells.some(Boolean));

  const filled = (cells: string[]) => cells.filter(Boolean).length;
  const first = lines.findIndex((cells) => filled(cells) >= 3);
  const last = lines.findLastIndex((cells) => filled(cells) >= 2);
  const asText = (cells: string[]) => paragraph(cells.filter(Boolean).join('  |  '));
  if (first === -1 || last <= first) return lines.map(asText);

  // A table's rows keep roughly its heading's width; lines of a cell broken
  // over several do not. Short heading rows ("Α΄ ΕΞΑΜΗΝΟ") don't count.
  const region = lines.slice(first, last + 1);
  const width = lines[first]!.length;
  const rows = region.filter((cells) => filled(cells) >= 3);
  const even = rows.filter((cells) => Math.abs(cells.length - width) <= 2).length;
  if (rows.length < 4 || even < rows.length * 0.7) return lines.map(asText);

  const row = (cells: string[]): Inline[] =>
    cells.slice(0, width).map((cell) => (cell ? [{ text: cell }] : []));
  return [
    ...lines.slice(0, first).map(asText),
    { type: 'table', header: null, rows: region.map(row) },
    ...lines.slice(last + 1).map(asText),
  ];
}
