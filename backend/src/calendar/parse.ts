import { academicYearIn } from '../documents/discover.js';
import type { CityId } from '../registry/index.js';

import type { CalendarHoliday, CalendarPeriod, HolidayKey } from './types.js';

function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

const iso = (year: number, month: number, day: number): string =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

// "28/09/2026 – 23/12/2026"
const numericRange = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[–—-]\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/g;

function rangesIn(text: string): { from: string; to: string }[] {
  return [...text.matchAll(numericRange)].map((m) => ({
    from: iso(Number(m[3]), Number(m[2]), Number(m[1])),
    to: iso(Number(m[6]), Number(m[5]), Number(m[4])),
  }));
}

// Months as written in a date, by the start of their folded genitive.
const months: [string, number][] = [
  ['ιανουαρ', 1],
  ['φεβρουαρ', 2],
  ['μαρτ', 3],
  ['απριλ', 4],
  ['μαι', 5],
  ['ιουν', 6],
  ['ιουλ', 7],
  ['αυγουστ', 8],
  ['σεπτεμβρ', 9],
  ['οκτωβρ', 10],
  ['νοεμβρ', 11],
  ['δεκεμβρ', 12],
];

/** The written-out dates in a holiday's line, "28 Οκτωβρίου 2026", in order. */
function writtenDates(text: string): { day: number; month: number; year?: number }[] {
  const dates: { day: number; month: number; year?: number }[] = [];
  for (const m of fold(text).matchAll(/(\d{1,2})\s+([α-ω]+)(?:\s+(\d{4}))?/g)) {
    const month = months.find(([stem]) => m[2]!.startsWith(stem))?.[1];
    if (month) dates.push({ day: Number(m[1]), month, ...(m[3] ? { year: Number(m[3]) } : {}) });
  }
  return dates;
}

const holidayKeys: [RegExp, HolidayKey][] = [
  [/εθνικη/, 'national-day'],
  [/πολυτεχνει/, 'polytechnic'],
  [/χριστουγενν/, 'christmas'],
  [/τριων ιεραρχων/, 'three-hierarchs'],
  [/αποκρια/, 'carnival'],
  [/καθαρα δευτερα/, 'clean-monday'],
  [/πασχα/, 'easter'],
  [/πρωτομαγια/, 'may-day'],
  [/αγιου πνευματος/, 'whit-monday'],
];

const cityNames: [RegExp, CityId][] = [
  [/κοζαν/, 'kozani'],
  [/γρεβεν/, 'grevena'],
  [/πτολεμαιδ/, 'ptolemaida'],
  [/φλωριν/, 'florina'],
  [/καστορι/, 'kastoria'],
];

/**
 * Reads the Senate's decision approving an academic year's calendar, as the
 * lines of its text: the teaching weeks & exam periods of each term with
 * their dates, the empty weeks between them, & the holidays — the whole
 * university's, & each city's own.
 */
export function parseCalendar(lines: string[]): {
  academicYear: string;
  periods: CalendarPeriod[];
  holidays: CalendarHoliday[];
} | null {
  const text = lines.join('\n');
  const startYear = academicYearIn(/ετους\s+\d{4}\s*[-–]\s*\d{4}/u.exec(fold(text))?.[0] ?? text);
  if (startYear === undefined) return null;

  const at = (pattern: RegExp, from = 0) =>
    lines.findIndex((line, index) => index >= from && pattern.test(fold(line)));
  const decision = at(/αποφασιζει/);
  const notes = at(/^σημειωση/, decision);
  const holidaysAt = at(/ημερες εορτων/, decision);
  if (decision === -1 || holidaysAt === -1) return null;
  const end = (() => {
    const index = at(/λυεται η συνεδριαση|στη συνεχεια/, holidaysAt);
    return index === -1 ? lines.length : index;
  })();

  // Each term's lines: a name, perhaps wrapped over a line or two, then one
  // or more date ranges.
  const periods: CalendarPeriod[] = [];
  let current: { name: string; ranges: { from: string; to: string }[] } | null = null;
  const flush = () => {
    if (!current || current.ranges.length === 0) return;
    const name = current.name.replace(/\s*\(.*$/u, '').trim();
    const folded = fold(name);
    const kind = /επαναληπτικ|σεπτεμβρ/.test(folded)
      ? 'resits'
      : /εξεταστικ/.test(folded)
        ? 'exams'
        : 'teaching';
    const term = /χειμεριν/.test(folded) ? 'winter' : /εαριν/.test(folded) ? 'spring' : null;
    for (const range of current.ranges) periods.push({ kind, term, ...range, name });
  };
  for (const line of lines.slice(decision + 1, notes === -1 ? holidaysAt : notes)) {
    const ranges = rangesIn(line);
    const words = line.replace(numericRange, '').trim();
    if (/[Α-Ωα-ωΆ-ώ]{3}/u.test(words)) {
      if (current && current.ranges.length === 0) current.name += ` ${words}`;
      else {
        flush();
        current = { name: words, ranges: [] };
      }
    }
    current?.ranges.push(...ranges);
  }
  flush();

  // The notes name the empty weeks between teaching & exams.
  if (notes !== -1) {
    for (const range of rangesIn(lines.slice(notes, holidaysAt).join(' '))) {
      periods.push({ kind: 'break', term: null, ...range, name: 'Κενή εβδομάδα' });
    }
  }

  // Holidays are bullets, some wrapped onto a second line; page furniture
  // falls between them.
  const bullets: string[] = [];
  for (const line of lines.slice(holidaysAt + 1, end)) {
    const folded = fold(line);
    if (/^σελιδα \d+ απο \d+/.test(folded) || /^ακαδημαικο ημερολογιο/.test(folded)) continue;
    if (/^[▪•·-]/u.test(line.trim())) bullets.push(line.trim().replace(/^[▪•·-]\s*/u, ''));
    else if (bullets.length) bullets[bullets.length - 1] += ` ${line.trim()}`;
  }

  const yearOf = (month: number) => (month >= 9 ? startYear : startYear + 1);
  const holidays: CalendarHoliday[] = [];
  for (const bullet of bullets) {
    const folded = fold(bullet);
    const cities = cityNames.filter(([pattern]) => pattern.test(folded)).map(([, id]) => id);
    const local = cities.length > 0 && /πολη/.test(folded);
    const named =
      /\(([^)]+)\)/u.exec(bullet)?.[1] ??
      (bullet.includes(':') ? bullet.split(':').pop()!.trim() : bullet);
    const key = local
      ? 'local'
      : (holidayKeys.find(([pattern]) => pattern.test(fold(named)))?.[1] ?? null);

    let dates = writtenDates(bullet);
    if (dates.length === 0 && key === 'may-day') dates = [{ day: 1, month: 5 }];
    if (dates.length === 0) continue;
    // A date left without its year takes the next one's, or the term's.
    const dated = dates.map((date, index) => {
      const year = date.year ?? dates.slice(index + 1).find((later) => later.year)?.year;
      return iso(year ?? yearOf(date.month), date.month, date.day);
    });

    const base = { name: named, key, ...(local ? { cities } : {}) };
    if (/εως/.test(folded) && dated.length >= 2) {
      holidays.push({ from: dated[0]!, to: dated[1]!, ...base });
    } else {
      for (const day of dated) holidays.push({ from: day, to: day, ...base });
    }
  }

  return {
    academicYear: `${startYear}-${startYear + 1}`,
    periods: periods.sort((a, b) => a.from.localeCompare(b.from)),
    holidays: holidays.sort((a, b) => a.from.localeCompare(b.from)),
  };
}
