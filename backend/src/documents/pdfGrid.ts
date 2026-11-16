import type { Block, Inline } from '../content/blocks.js';

/** A piece of text on a PDF page, where it starts & how far it runs. */
export interface PositionedText {
  text: string;
  x: number;
  y: number;
  width: number;
}

/**
 * The same piece on the page as read: `across` grows left to right along a
 * row, `down` grows top to bottom. A page laid out sideways keeps its days
 * running down the raw coordinates; this undoes that.
 */
interface Placed {
  text: string;
  across: number;
  down: number;
  width: number;
}

function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

const weekdays = ['δευτερα', 'τριτη', 'τεταρτη', 'πεμπτη', 'παρασκευη', 'σαββατο'];

function weekdayOf(text: string): number | undefined {
  const folded = fold(text);
  const index = weekdays.findIndex((day) => folded === day || folded.startsWith(`${day} `));
  return index === -1 ? undefined : index + 1;
}

const timeOfDay = /\d{1,2}[:.]\d{2}/;
const timeRange = /(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/;

// Pieces this close on the axis that separates rows count as one line.
const lineTolerance = 3;

function groupBy<T>(items: T[], key: (item: T) => number, tolerance: number): T[][] {
  const sorted = [...items].sort((a, b) => key(a) - key(b));
  const groups: T[][] = [];
  for (const item of sorted) {
    const group = groups.at(-1);
    if (group && Math.abs(key(item) - key(group[0]!)) <= tolerance) group.push(item);
    else groups.push([item]);
  }
  return groups;
}

/**
 * Finds the row of weekday names a timetable grid is headed by, & from it how
 * the page is turned: days side by side along y (a page printed upright) or
 * along x (one printed sideways).
 */
function orient(items: PositionedText[]): { placed: Placed[]; headerDown: number } | null {
  const days = items.filter((item) => weekdayOf(item.text) !== undefined);
  for (const axis of ['y', 'x'] as const) {
    for (const row of groupBy(days, (item) => item[axis], lineTolerance)) {
      const distinct = new Set(row.map((item) => weekdayOf(item.text)));
      if (distinct.size < 3) continue;

      const along = axis === 'y' ? 'x' : 'y';
      const monday = row.reduce((a, b) => (weekdayOf(a.text)! < weekdayOf(b.text)! ? a : b));
      const friday = row.reduce((a, b) => (weekdayOf(a.text)! > weekdayOf(b.text)! ? a : b));
      const acrossSign = friday[along] >= monday[along] ? 1 : -1;
      // Rows run away from the header; most of the page's text sits that way.
      const beyond = items.filter((item) => item[axis] > row[0]![axis]).length;
      const downSign = beyond > items.length / 2 ? 1 : -1;

      const placed = items.map((item) => ({
        text: item.text,
        across: item[along] * acrossSign,
        down: item[axis] * downSign,
        width: item.width,
      }));
      return { placed, headerDown: row[0]![axis] * downSign };
    }
  }
  return null;
}

// Pieces on one line further apart than this are separate fields — a course &
// its room set in sub-columns — rather than words of one phrase.
const fieldGap = 8;

function joinLines(pieces: Placed[]): string {
  return groupBy(pieces, (piece) => piece.down, lineTolerance)
    .flatMap((line) => {
      const fields: string[] = [];
      let previousEnd: number | undefined;
      for (const piece of line.sort((a, b) => a.across - b.across)) {
        const text = piece.text.trim();
        if (previousEnd !== undefined && piece.across - previousEnd <= fieldGap && fields.length) {
          fields[fields.length - 1] = `${fields.at(-1)!} ${text}`;
        } else fields.push(text);
        previousEnd = piece.across + piece.width;
      }
      return fields.map((field) => field.replace(/\s+/g, ' ').trim());
    })
    .filter(Boolean)
    .join('\n');
}

const pad = (time: string): string => time.replace('.', ':').replace(/^(\d):/, '0$1:');

/**
 * Rebuilds a timetable grid from where its text sits on a PDF page, which the
 * text layer alone loses: the weekday names head the columns, the times down
 * the first column start the rows, & every other piece of text falls into the
 * cell its position puts it in. The result is a table with the weekday header
 * the grid parser reads, preceded by the lines above it (a title naming the
 * semester, say). A page with no such grid gives null & is read as text.
 */
export function gridBlocks(items: PositionedText[]): Block[] | null {
  const oriented = orient(items.filter((item) => item.text.trim()));
  if (!oriented) return null;
  const { placed, headerDown } = oriented;

  const header = placed
    .filter((piece) => Math.abs(piece.down - headerDown) <= lineTolerance)
    .filter((piece) => weekdayOf(piece.text) !== undefined)
    .sort((a, b) => a.across - b.across);
  const centres = header.map((piece) => piece.across + piece.width / 2);
  const firstGap = (centres[1] ?? centres[0]! + 100) - centres[0]!;
  // Column edges sit halfway between neighbouring day names.
  const edges = [
    centres[0]! - firstGap / 2,
    ...centres.slice(1).map((centre, index) => (centre + centres[index]!) / 2),
  ];
  const columnOf = (piece: Placed): number => {
    const centre = piece.across + piece.width / 2;
    let column = 0;
    edges.forEach((edge, index) => {
      if (centre >= edge) column = index + 1;
    });
    return column; // 0 is the time column
  };

  const below = placed.filter((piece) => piece.down > headerDown + lineTolerance);

  // The time column's lines that hold a time start the rows.
  const anchors = groupBy(
    below.filter((piece) => columnOf(piece) === 0),
    (piece) => piece.down,
    lineTolerance,
  )
    .map((line) => ({
      down: line[0]!.down,
      text: line
        .sort((a, b) => a.across - b.across)
        .map((piece) => piece.text.trim())
        .join(' '),
    }))
    .filter((line) => timeOfDay.test(line.text));
  // A time printed over two lines ("9:00-" above "10:00") is one row.
  const rowsAt: { down: number; text: string }[] = [];
  for (const anchor of anchors) {
    const previous = rowsAt.at(-1);
    if (previous && !timeRange.test(previous.text) && anchor.down - previous.down < 14) {
      previous.text = `${previous.text} ${anchor.text}`;
    } else rowsAt.push({ ...anchor });
  }
  if (rowsAt.length < 2) return null;

  const gaps = rowsAt.slice(1).map((row, index) => row.down - rowsAt[index]!.down);
  const typicalGap = gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)]!;
  // A cell's text may sit a little above its time; rows split between times.
  const lead = typicalGap * 0.35;
  const startOf = (index: number) => rowsAt[index]!.down - lead;
  const end = rowsAt.at(-1)!.down - lead + typicalGap;

  const timeText = rowsAt.map((row, index) => {
    const range = timeRange.exec(row.text);
    if (range) return `${pad(range[1]!)} - ${pad(range[2]!)}`;
    const start = timeOfDay.exec(row.text)?.[0];
    const next = rowsAt[index + 1] ? timeOfDay.exec(rowsAt[index + 1]!.text)?.[0] : undefined;
    return start && next ? `${pad(start)} - ${pad(next)}` : row.text;
  });

  const cells: Placed[][][] = rowsAt.map(() => header.map(() => []));
  const after: Placed[] = [];
  for (const piece of below) {
    const column = columnOf(piece);
    if (piece.down >= end) {
      after.push(piece);
      continue;
    }
    // Column labels under the weekday names sit above the first time.
    if (column === 0 || piece.down < startOf(0)) continue;
    let row = 0;
    rowsAt.forEach((_, index) => {
      if (piece.down >= startOf(index)) row = index;
    });
    cells[row]![column - 1]!.push(piece);
  }

  const asInline = (text: string): Inline => (text ? [{ text }] : []);
  const table: Block = {
    type: 'table',
    header: null,
    rows: [
      [asInline('ΩΡΑ'), ...header.map((piece) => asInline(piece.text.trim()))],
      ...cells.map((row, index) => [
        asInline(timeText[index]!),
        ...row.map((cell) => asInline(joinLines(cell))),
      ]),
    ],
  };

  const above = placed.filter((piece) => piece.down < headerDown - lineTolerance);
  const paragraphs = (pieces: Placed[]): Block[] =>
    joinLines(pieces)
      .split('\n')
      .filter(Boolean)
      .map((text) => ({ type: 'paragraph', content: [{ text }] }));

  return [...paragraphs(above), table, ...paragraphs(after)];
}
