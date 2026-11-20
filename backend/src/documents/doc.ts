import WordExtractor from 'word-extractor';

import type { Block, Inline } from '../content/blocks.js';

const tidy = (text: string): string => text.replace(/\s+/g, ' ').trim();

const paragraph = (text: string): Block => ({ type: 'paragraph', content: [{ text }] });

const foldWord = (text: string): string =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const weekday = /^(δευτερα|τριτη|τεταρτη|πεμπτη|παρασκευη|σαββατο)/;
const hoursHeading = /^(ωρες|ωρα)$/;
const timeLike = /^\d{1,2}([:.]\d{2})?\s*[-–]\s*\d{1,2}([:.]\d{2})?$|^\d{1,2}[:.]\d{2}$/;

// A line that is only a course's code, "ΔΕΟΣ0103" or "ΔΕΟΣ 0708".
const codeLine = /^[Α-ΩA-Z]{2,6}\s?\d{3,5}$/u;
// A heading over a day's room column: "Αιθ", "Aιθ" (a Latin A), "Αίθουσα".
const roomHeading = /^[aα]ιθ/;

/** A cell's lines, tidied, without the empty ones or a bare course code. */
const cellLines = (text: string): string[] =>
  text
    .split('\n')
    .map(tidy)
    .filter((line) => line && !codeLine.test(line))
    // A code opening the title's line: "ΔΕΟΣ0710 Ιστορία Οικονομικών".
    .map((line) => line.replace(/^[Α-ΩA-Z]{2,6}\s?\d{3,5}\s+(?=\S)/u, ''));

const cellOf = (lines: string[]): Inline => (lines.length ? [{ text: lines.join('\n') }] : []);

// The teacher, as these grids write it: a line of capitals ("ΣΙΣΚΟΣ"),
// names joined by a stroke ("Βελέντζας/Κυριακούλης") or "Ακ. Υπότροφος".
const teacherText =
  /^(?:[Α-ΩΆ-Ώ][Α-ΩΆ-Ώ.' -]+|[Α-ΩΆ-Ώ][α-ωά-ώ]+(?:\s*\/\s*[Α-ΩΆ-Ώ][α-ωά-ώ]+)+|Ακ\.\s*Υπότροφος)$/u;
// A title closing on its teacher after a stroke: "Μακρο-Οικονομική Ανάλυση / ΡΟΚΟΠΑΝΟΣ".
const titledTeacher = /^(.*\S)\s*\/\s*([Α-ΩΆ-Ώ]{3,})$/u;

/**
 * A class cell of a Word grid as the class parser reads it: the course, the
 * teacher marked as a source marks a teacher, in italics, & the room from the
 * day's room column. The teacher is the cell's closing line, or the name
 * after a stroke closing its title.
 */
function classCell(lines: string[], room: string): Inline {
  // A line saying how it's taught ("ΑΝΤΑΠΟΔΟΤΙΚΗ") is no part of the title.
  const body = lines.filter((line) => !/^ανταποδοτικ/u.test(foldWord(line)));
  const teachers: string[] = [];
  // "/ΠΑΝΟΥ" on a line of its own is a second teacher of the title above.
  while (body.length > 1 && /^\/\s*[Α-ΩΆ-Ώ]{3,}$/u.test(body.at(-1)!)) {
    teachers.unshift(body.pop()!.replace(/^\/\s*/, ''));
  }
  if (body.length > 1 && teacherText.test(body.at(-1)!) && !teachers.length) {
    teachers.unshift(body.pop()!);
  }
  const titled = titledTeacher.exec(body.join(' '));
  if (titled && teacherText.test(titled[2]!)) {
    body.splice(0, body.length, titled[1]!);
    teachers.unshift(titled[2]!);
  }
  const course = body.join('\n');
  if (!course) return cellOf([...lines, room].filter(Boolean));
  return [
    { text: course },
    ...(teachers.length ? [{ text: `\n${teachers.join(', ')}`, italic: true }] : []),
    ...(room ? [{ text: `\n${room}` }] : []),
  ];
}

const linesAsParagraphs = (text: string): Block[] =>
  text.split('\n').map(tidy).filter(Boolean).map(paragraph);

/**
 * Word ends every table cell with a mark, & every row with one more; the
 * extractor gives each as a tab. A cell's own line breaks are only text in it.
 * So a timetable, its rows the hours & its columns the weekdays, can be rebuilt
 * exactly: its heading row ("ΩΡΕΣ | Δευτέρα | Αιθ | …") counts its cells, &
 * every row after it is that many cells & the row's mark. A row whose hour cell
 * is blank continues the hour above it, merged across both. A day's room
 * column is folded into the day's cell, its last line, as the class parser
 * reads a cell. Text outside the tables, as each one's "ΕΞΑΜΗΝΟ: 1ο", is kept
 * as paragraphs before it. Null when the document holds no such table.
 */
function weekTables(body: string): Block[] | null {
  const tokens = body.split('\t');
  const blocks: Block[] = [];
  let tables = 0;
  let pending = '';
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i]!;
    const lines = token.split('\n');
    const last = lines[lines.length - 1] ?? '';
    const isHeading =
      hoursHeading.test(foldWord(last)) &&
      tokens.slice(i + 1, i + 13).filter((cell) => weekday.test(foldWord(cell))).length >= 2;
    if (!isHeading) {
      pending += `${token}\n`;
      i++;
      continue;
    }
    // Text above the heading, in the same run, is the table's caption.
    pending += lines.slice(0, -1).join('\n');
    blocks.push(...linesAsParagraphs(pending));
    pending = '';

    let width = 1;
    while (i + width < tokens.length && tokens[i + width]!.trim() !== '') width++;
    const heading = [last, ...tokens.slice(i + 1, i + width)].map((cell) => tidy(cell));
    // Each column a day's, or its room's, or the hours'.
    const rooms = heading.map((cell) => roomHeading.test(foldWord(cell)));
    const keep = heading.map((_, index) => !rooms[index]);

    const rows: Inline[][] = [];
    let hour = '';
    let at = i + width + 1;
    while (at + width <= tokens.length) {
      const row = tokens.slice(at, at + width);
      const first = cellLines(row[0]!).join(' ');
      if (first && !timeLike.test(first)) break;
      if (!first && !hour) break;
      hour = first || hour;
      const cells = row.map((cell) => cellLines(cell));
      cells[0] = [hour];
      // A day's cell takes its room from the room column after it.
      const built = cells.map((cell, index): Inline => {
        if (index === 0 || !cell.length || rooms[index]) return cellOf(cell);
        const room = rooms[index + 1] ? (cells[index + 1] ?? []).join(' ') : '';
        return classCell(cell, room);
      });
      rows.push(built.filter((_, index) => keep[index]));
      // Text after the table can run straight on from the last row's mark.
      const mark = tokens[at + width] ?? '';
      if (mark.trim()) pending += `${mark}\n`;
      at += width + 1;
    }
    if (rows.length) {
      const header = heading.filter((_, index) => keep[index]).map((cell) => cellOf([cell]));
      blocks.push({ type: 'table', header, rows });
      tables++;
    }
    i = rows.length ? at : i + width;
  }
  blocks.push(...linesAsParagraphs(pending));
  return tables ? blocks : null;
}

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
  const weekly = weekTables(document.getBody());
  if (weekly) return weekly;
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
