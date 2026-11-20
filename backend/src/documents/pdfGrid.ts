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

// Latin letters that look Greek, as typed into a Greek heading: "ΗΜ/NIA".
const lookalikes: Record<string, string> = {
  a: 'α',
  b: 'β',
  e: 'ε',
  h: 'η',
  i: 'ι',
  k: 'κ',
  m: 'μ',
  n: 'ν',
  o: 'ο',
  p: 'ρ',
  t: 'τ',
  x: 'χ',
  y: 'υ',
  z: 'ζ',
};

function fold(text: string): string {
  const folded = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  // In text that is Greek at all, a Latin lookalike is a Greek letter mistyped.
  return /[α-ω]/u.test(folded)
    ? folded.replace(/[abehikmnoptxyz]/g, (c) => lookalikes[c]!)
    : folded;
}

const weekdays = ['δευτερα', 'τριτη', 'τεταρτη', 'πεμπτη', 'παρασκευη', 'σαββατο'];

function weekdayOf(text: string): number | undefined {
  const folded = fold(text);
  const index = weekdays.findIndex((day) => folded === day || folded.startsWith(`${day} `));
  return index === -1 ? undefined : index + 1;
}

const columnLabel =
  /^(μαθημα|μαθ\.?|καθηγ\.?|καθ\.?|αιθ\.?|αιθουσα|ομαδα|θ-ε-απ|διδασκων|καθηγητης|\s)+$/u;

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
      let previous: Placed | undefined;
      for (const piece of line.sort((a, b) => a.across - b.across)) {
        const text = piece.text.trim();
        const gap = previous ? piece.across - (previous.across + previous.width) : Infinity;
        // Pieces that touch, with no space at either edge, are one word some
        // generators split ("15" ":00", "1" "8").
        const touching = gap < 1 && !/\s$/.test(previous!.text) && !/^\s/.test(piece.text);
        if (fields.length && touching) fields[fields.length - 1] = `${fields.at(-1)!}${text}`;
        else if (fields.length && gap <= fieldGap)
          fields[fields.length - 1] = `${fields.at(-1)!} ${text}`;
        else fields.push(text);
        previous = piece;
      }
      return fields.map((field) => field.replace(/\s+/g, ' ').trim());
    })
    .filter(Boolean)
    .join('\n');
}

// Some grids give bare hours, on a 12-hour clock: "9 - 10", "12 - 1", "1 - 2".
const hourRange = /^(\d{1,2})\s*[-–]\s*(\d{1,2})$/;

// No class starts before 8 in the morning: a smaller hour is the afternoon's.
const fromHour = (hour: number): string =>
  `${String(hour < 8 ? hour + 12 : hour).padStart(2, '0')}:00`;

const pad = (time: string): string => time.replace('.', ':').replace(/^(\d):/, '0$1:');

const isTime = (text: string): boolean => timeOfDay.test(text) || hourRange.test(text.trim());

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

  const headerLine = placed
    .filter((piece) => Math.abs(piece.down - headerDown) <= lineTolerance)
    .sort((a, b) => a.across - b.across);
  const header = headerLine.filter((piece) => weekdayOf(piece.text) !== undefined);
  // Every label on the header line heads a column; one past the first day that
  // is not a day itself ("Αιθ" for the room) belongs to the day before it.
  const firstDay = headerLine.indexOf(header[0]!);
  const labels = headerLine.slice(firstDay);
  let day = 0;
  const owners = labels.map((label) => (weekdayOf(label.text) !== undefined ? ++day : day));
  const centres = labels.map((piece) => piece.across + piece.width / 2);
  const firstGap = (centres[1] ?? centres[0]! + 100) - centres[0]!;
  // Column edges sit halfway between neighbouring labels.
  const edges = [
    centres[0]! - firstGap / 2,
    ...centres.slice(1).map((centre, index) => (centre + centres[index]!) / 2),
  ];
  const columnOf = (piece: Placed): number => {
    const centre = piece.across + piece.width / 2;
    let column = 0;
    edges.forEach((edge, index) => {
      if (centre >= edge) column = owners[index]!;
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
    .filter((line) => isTime(line.text));
  // A time printed over two lines ("9:00-" above "10:00") is one row.
  const rowsAt: { down: number; text: string; top: number }[] = [];
  for (const anchor of anchors) {
    const previous = rowsAt.at(-1);
    if (previous && !timeRange.test(previous.text) && anchor.down - previous.top < 14) {
      previous.text = `${previous.text} ${anchor.text}`;
      // A time over two lines centres on the middle of them.
      previous.down = (previous.top + anchor.down) / 2;
    } else rowsAt.push({ ...anchor, top: anchor.down });
  }
  if (rowsAt.length < 2) return null;

  const gaps = rowsAt.slice(1).map((row, index) => row.down - rowsAt[index]!.down);
  const typicalGap = gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)]!;
  // A time sits in the middle of its row, as does the cell's text beside it,
  // which may run above & below the time: rows split halfway between times.
  const lead = typicalGap * 0.5;
  const startOf = (index: number) => rowsAt[index]!.down - lead;
  const end = rowsAt.at(-1)!.down - lead + typicalGap;

  const timeText = rowsAt.map((row, index) => {
    const hours = hourRange.exec(row.text.trim());
    if (hours) return `${fromHour(Number(hours[1]))} - ${fromHour(Number(hours[2]))}`;
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
    if (column === 0) continue;
    // Above the first time sit the first row's upper lines, or labels some
    // grids put under the weekday names ("ΜΑΘΗΜΑ", "ΑΙΘ.").
    if (piece.down < startOf(0) && columnLabel.test(fold(piece.text))) continue;
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

/**
 * Joins pieces of one word that a generator split ("Αλυσίδα" "ς"), so the
 * whole word falls in one column: pieces on a line that touch, with no space
 * at the edge between them.
 */
function mergeTouching(pieces: Placed[]): Placed[] {
  const merged: Placed[] = [];
  for (const line of groupBy(pieces, (piece) => piece.down, lineTolerance)) {
    let previous: Placed | undefined;
    for (const piece of line.sort((a, b) => a.across - b.across)) {
      const gap = previous ? piece.across - (previous.across + previous.width) : Infinity;
      if (previous && gap < 1 && !/\s$/.test(previous.text) && !/^\s/.test(piece.text)) {
        previous.text += piece.text;
        previous.width = piece.across + piece.width - previous.across;
      } else {
        previous = { ...piece };
        merged.push(previous);
      }
    }
  }
  return merged;
}

/** Whether three weekday names or more sit side by side on one line. */
function hasWeekdayRow(placed: Placed[]): boolean {
  const days = placed.filter((piece) => weekdayOf(piece.text) !== undefined);
  return groupBy(days, (piece) => piece.down, lineTolerance).some(
    (line) => new Set(line.map((piece) => weekdayOf(piece.text))).size >= 3,
  );
}

// Column headings a schedule set out as a list uses, matched against a
// heading's folded text.
const listHeading =
  /^(εξαμ|ημερα|ημερομην|ημ\/νια|ωρα|ωρες|κυμα|μαθημα|τιτλος|καθηγητ|διδασκ|εισηγητ|εξεταστ|επιτηρητ|αιθουσ|τροπος|ατομα|χωρητικ|αρ\.?\s?επιτ|δηλ)/u;

// The columns a list must have: what is held, when in the day & on which day.
const courseHeading = /^(μαθημα|τιτλος)/u;
const timeHeading = /^(ωρ|κυμα)/u;
const dayHeading = /^(ημερα|ημερομην|ημ\/νια)/u;

// Columns whose cells are often merged over many rows, their text centred.
const spanning = /^(εξαμ|ημερα|ημερομην|ημ\/νια)/u;

/**
 * Rebuilds a schedule set out as a list — a heading row such as ΕΞΑΜΗΝΟ ·
 * ΗΜΕΡΑ · ΩΡΑ · ΜΑΘΗΜΑ · ΚΑΘΗΓΗΤΗΣ · ΑΙΘΟΥΣΑ, then a row per class or exam —
 * from where its text sits. Each time in the time column starts a row; other
 * text joins the row it sits nearest. A day or semester written once in a cell
 * merged over several rows goes to every row it is the nearest of its column
 * to. Upright pages only; a page with no such heading row gives null.
 */
/** The columns a list's heading row set out, kept for the pages it runs on to. */
export type ListLayout = Placed[];

export function listBlocks(
  items: PositionedText[],
  carried?: ListLayout,
): { blocks: Block[]; layout: ListLayout } | null {
  const placed = mergeTouching(
    items
      .filter((item) => item.text.trim())
      .map((item) => ({ text: item.text, across: item.x, down: -item.y, width: item.width })),
  );

  // A page headed by weekday names side by side is a grid, not a list.
  if (orient(items.filter((item) => item.text.trim())) && hasWeekdayRow(placed)) return null;

  // The heading row; its cells may sit at slightly different heights.
  const headings = placed.filter(
    (piece) => piece.text.trim().length <= 25 && listHeading.test(fold(piece.text)),
  );
  const line = groupBy(headings, (piece) => piece.down, 15)
    .filter((group) => group.some((piece) => courseHeading.test(fold(piece.text))))
    .filter((group) => group.some((piece) => timeHeading.test(fold(piece.text))))
    .filter((group) => group.some((piece) => dayHeading.test(fold(piece.text))))
    .sort((a, b) => b.length - a.length)[0];
  // A page that goes on with the list from the page before needn't repeat
  // the heading: its columns are where they were.
  const found = line && line.length >= 3 ? [...line].sort((a, b) => a.across - b.across) : null;
  if (!found && !carried) return null;
  const labels = found ?? carried!;
  const centres = labels.map((piece) => piece.across + piece.width / 2);
  const edges = centres.slice(1).map((centre, index) => (centre + centres[index]!) / 2);
  const columnOf = (piece: Placed): number => {
    const centre = piece.across + piece.width / 2;
    return edges.filter((edge) => centre >= edge).length;
  };
  const timeColumn = labels.findIndex((piece) => timeHeading.test(fold(piece.text)));
  const headingTop = found ? Math.min(...found.map((piece) => piece.down)) : -Infinity;
  const headingBottom = found ? Math.max(...found.map((piece) => piece.down)) : -Infinity;

  const below = placed.filter((piece) => piece.down > headingBottom + lineTolerance);
  const rowsAt = groupBy(
    below.filter((piece) => columnOf(piece) === timeColumn),
    (piece) => piece.down,
    lineTolerance,
  )
    .filter((group) => timeOfDay.test(joinLines(group)))
    .map((group) => group[0]!.down);
  if (rowsAt.length < 2) return null;

  const gaps = rowsAt.slice(1).map((down, index) => down - rowsAt[index]!);
  const widest = Math.max(...gaps);
  const nearestRow = (down: number): number =>
    rowsAt.reduce(
      (best, at, index) => (Math.abs(at - down) < Math.abs(rowsAt[best]! - down) ? index : best),
      0,
    );

  const cells: Placed[][][] = rowsAt.map(() => labels.map(() => []));
  const merged: Placed[][] = labels.map(() => []);
  const after: Placed[] = [];
  const before: Placed[] = [];
  for (const piece of below) {
    // On a page that runs on without a heading, text well above the first
    // row is the page's own title.
    if (piece.down < rowsAt[0]! - widest) {
      before.push(piece);
      continue;
    }
    // Text well past the last row is a footnote or a signature.
    if (piece.down > rowsAt.at(-1)! + widest) {
      after.push(piece);
      continue;
    }
    const column = columnOf(piece);
    if (spanning.test(fold(labels[column]!.text))) merged[column]!.push(piece);
    else cells[nearestRow(piece.down)]![column]!.push(piece);
  }
  // A merged cell's text need not sit at the middle of the rows it spans. It
  // does sit within one of them; & within a day (or a date) the times run
  // forward, so where they run back is where the next cell begins.
  const minutes = cells.map((row) => {
    const time = /(\d{1,2})[:.](\d{2})/.exec(joinLines(row[timeColumn]!));
    return time ? Number(time[1]) * 60 + Number(time[2]) : undefined;
  });
  const runsBack = (row: number): boolean =>
    row > 0 && minutes[row] !== undefined && minutes[row - 1] !== undefined
      ? minutes[row] <= minutes[row - 1]!
      : false;
  const rowOf = (down: number): number => {
    let row = 0;
    rowsAt.forEach((at, index) => {
      if (index > 0 && down >= (rowsAt[index - 1]! + at) / 2) row = index;
    });
    return row;
  };
  const semesterColumn = labels.findIndex((piece) => /^εξαμ/u.test(fold(piece.text)));
  const dayColumn = labels.findIndex((piece) => /^ημερα$/u.test(fold(piece.text)));
  merged.forEach((pieces, column) => {
    if (column === semesterColumn && dayColumn >= 0) return; // read from the days below
    const anchored = groupBy(pieces, (piece) => piece.down, 14)
      .map((group) => ({ row: rowOf(group[0]!.down), pieces: group }))
      .sort((a, b) => a.row - b.row);
    if (anchored.length === 0) return;
    const firstBack = (from: number, to: number): number | undefined => {
      for (let row = from + 1; row <= to; row++) if (runsBack(row)) return row;
      return undefined;
    };
    // Rows before the first label, up to where the times run back, carry on
    // the page before's.
    const lead = firstBack(-1, anchored[0]!.row) ?? 0;
    anchored.forEach((label, index) => {
      const next = anchored[index + 1];
      const start =
        index === 0 ? lead : (firstBack(anchored[index - 1]!.row, label.row) ?? label.row);
      const end = next ? (firstBack(label.row, next.row) ?? next.row) : rowsAt.length;
      for (let row = start; row < end; row++) cells[row]![column] = label.pieces;
    });
  });

  // A semester's rows run through the week once: where the days run back to
  // its start, the next semester begins. An earlier hour of the same day may
  // also mark one, or only parallel classes; it is counted on only when the
  // days alone don't account for every semester named on the page.
  if (semesterColumn >= 0 && dayColumn >= 0) {
    const days = cells.map((row) => weekdayOf(joinLines(row[dayColumn]!).split('\n')[0] ?? ''));
    const back = (row: number, sameDayToo: boolean): boolean => {
      const day = days[row];
      const before = days[row - 1];
      if (row === 0 || day === undefined || before === undefined) return false;
      return day < before || (sameDayToo && day === before && runsBack(row));
    };
    const semesterLabels = groupBy(merged[semesterColumn]!, (piece) => piece.down, 14);
    const fits = (starts: number[]) => {
      const offset = starts.length - semesterLabels.length;
      return offset === 0 || offset === 1;
    };
    const rows = rowsAt.map((_, row) => row);
    const strong = [0, ...rows.filter((row) => back(row, false))];
    const weak = [0, ...rows.filter((row) => back(row, true))];
    const starts = fits(strong) ? strong : fits(weak) ? weak : null;
    if (starts) {
      // Rows above the page's first label continue the semester of the page before.
      const offset = starts.length - semesterLabels.length;
      starts.forEach((start, run) => {
        const end = starts[run + 1] ?? rowsAt.length;
        const label = run - offset >= 0 ? semesterLabels[run - offset]! : [];
        for (let row = start; row < end; row++) cells[row]![semesterColumn] = label;
      });
    } else if (semesterLabels.length) {
      rowsAt.forEach((at, row) => {
        cells[row]![semesterColumn] = semesterLabels.reduce((best, group) =>
          Math.abs(group[0]!.down - at) < Math.abs(best[0]!.down - at) ? group : best,
        );
      });
    }
  }

  const asInline = (text: string): Inline => (text ? [{ text }] : []);
  const table: Block = {
    type: 'table',
    header: null,
    rows: [
      labels.map((piece) => asInline(piece.text.trim())),
      ...cells.map((row) => row.map((cell) => asInline(joinLines(cell).replace(/\n/g, ' ')))),
    ],
  };
  const above = [...placed.filter((piece) => piece.down < headingTop - lineTolerance), ...before];
  const paragraphs = (pieces: Placed[]): Block[] =>
    joinLines(pieces)
      .split('\n')
      .filter(Boolean)
      .map((text) => ({ type: 'paragraph', content: [{ text }] }));
  return { blocks: [...paragraphs(above), table, ...paragraphs(after)], layout: labels };
}
