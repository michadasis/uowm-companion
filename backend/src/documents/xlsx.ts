import { load } from 'cheerio';
import JSZip from 'jszip';

import type { Block, Inline } from '../content/blocks.js';

/** "B12" -> zero-based column 1. */
function columnOf(ref: string): number {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? 'A';
  let column = 0;
  for (const letter of letters) column = column * 26 + (letter.charCodeAt(0) - 64);
  return column - 1;
}

function joinPath(base: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1);
  return `${base}${target}`;
}

/**
 * Reads an XLSX workbook into tables for the Original view: one table per
 * visible sheet, headed by the sheet's name when there is more than one. Cell
 * text is taken as stored — a spreadsheet's dates & times come through as the
 * numbers the format hides, so a sheet that relies on them reads less well,
 * but a timetable typed as text, the usual case, reads as written.
 *
 * Only the workbook's own XML is read, with the zip library the DOCX reader
 * already brings, rather than a full spreadsheet engine.
 */
export async function xlsxToBlocks(data: Uint8Array): Promise<Block[]> {
  const zip = await JSZip.loadAsync(data);
  const read = async (path: string): Promise<string | null> => {
    const file = zip.file(path);
    return file ? file.async('string') : null;
  };

  const xml = (text: string) => load(text, { xml: true });

  const shared: string[] = [];
  const sharedXml = await read('xl/sharedStrings.xml');
  if (sharedXml) {
    const $ = xml(sharedXml);
    $('si').each((_, si) => {
      shared.push(
        $(si)
          .find('t')
          .map((__, t) => $(t).text())
          .get()
          .join(''),
      );
    });
  }

  const relsXml = await read('xl/_rels/workbook.xml.rels');
  const targets = new Map<string, string>();
  if (relsXml) {
    const $ = xml(relsXml);
    $('Relationship').each((_, rel) => {
      targets.set($(rel).attr('Id') ?? '', $(rel).attr('Target') ?? '');
    });
  }

  const workbookXml = await read('xl/workbook.xml');
  if (!workbookXml) return [];
  const $book = xml(workbookXml);
  const sheets: { name: string; path: string }[] = [];
  $book('sheet').each((_, sheet) => {
    const $sheet = $book(sheet);
    if ($sheet.attr('state') === 'hidden' || $sheet.attr('state') === 'veryHidden') return;
    const target = targets.get($sheet.attr('r:id') ?? '');
    if (target) sheets.push({ name: $sheet.attr('name') ?? '', path: joinPath('xl/', target) });
  });

  const blocks: Block[] = [];
  for (const sheet of sheets) {
    const sheetXml = await read(sheet.path);
    if (!sheetXml) continue;
    const $ = xml(sheetXml);

    const grid: string[][] = [];
    $('sheetData row').each((_, row) => {
      const cells: string[] = [];
      $(row)
        .find('c')
        .each((__, cell) => {
          const $cell = $(cell);
          const type = $cell.attr('t');
          let value: string;
          if (type === 's') value = shared[Number($cell.find('v').text())] ?? '';
          else if (type === 'inlineStr') value = $cell.find('is t').text();
          else value = $cell.find('v').text();
          const column = columnOf($cell.attr('r') ?? 'A');
          cells[column] = value.replace(/\r\n?/g, '\n').trim();
        });
      grid.push(Array.from(cells, (cell) => cell ?? ''));
    });

    // Drop the empty rows & the columns no row uses.
    const rows = grid.filter((row) => row.some((cell) => cell !== ''));
    if (rows.length === 0) continue;
    const width = Math.max(...rows.map((row) => row.length));
    const used = Array.from({ length: width }, (_, column) =>
      rows.some((row) => (row[column] ?? '') !== ''),
    );
    const toInline = (text: string): Inline => (text ? [{ text }] : []);
    const table: Inline[][] = rows.map((row) =>
      used.flatMap((keep, column) => (keep ? [toInline(row[column] ?? '')] : [])),
    );

    if (sheets.length > 1 && sheet.name) {
      blocks.push({ type: 'heading', level: 3, content: [{ text: sheet.name }] });
    }
    blocks.push({ type: 'table', header: null, rows: table });
  }
  return blocks;
}
