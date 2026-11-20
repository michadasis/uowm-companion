import { load } from 'cheerio';
import { getDocumentProxy } from 'unpdf';

import { academicYearIn } from '../documents/discover.js';
import { fetchBuffer, fetchText } from '../http/fetch.js';

import { parseCalendar } from './parse.js';
import type { AcademicCalendar } from './types.js';

/** The university's page listing each year's calendar decision. */
export const calendarPage = 'https://www.uowm.gr/to-panepistimio/akadimaiko-imerologio/';

interface Candidate {
  url: string;
  label: string;
  year: number;
  /** YYYYMM of the upload, to prefer an amendment over the decision it amends. */
  uploaded: number;
}

/**
 * The calendar decisions the page links: PDFs named in Greek (the Senate's
 * decisions, not the designed English leaflets) for an academic year.
 */
export function calendarCandidates(html: string, pageUrl: string): Candidate[] {
  const $ = load(html);
  const candidates: Candidate[] = [];
  $('a[href]').each((_, el) => {
    let url: URL;
    try {
      url = new URL($(el).attr('href')!, pageUrl);
    } catch {
      return;
    }
    if (!/\.pdf$/i.test(url.pathname)) return;
    let name: string;
    try {
      name = decodeURIComponent(url.pathname.split('/').pop()!);
    } catch {
      return;
    }
    if (!/[Α-Ωα-ωΆ-ώ]/u.test(name)) return;
    const year = academicYearIn(name);
    if (year === undefined) return;
    const month = /\/uploads\/(\d{4})\/(\d{2})\//.exec(url.pathname);
    candidates.push({
      url: url.href,
      label: $(el).text().replace(/\s+/g, ' ').trim() || name,
      year,
      uploaded: month ? Number(month[1]) * 100 + Number(month[2]) : 0,
    });
  });
  return candidates;
}

/**
 * The academic year a day falls in, by its start: from October on, the new
 * one — September still holds the year before's resits.
 */
export function academicYearOf(now: Date): number {
  return now.getUTCMonth() >= 9 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

async function pdfLines(data: Uint8Array): Promise<string[]> {
  // Quiet: pdf.js warns of every odd font instruction,   const doc = await getDocumentProxy(data); the logs are for errors.
  const doc = await getDocumentProxy(data, { verbosity: 0 });
  const lines: string[] = [];
  for (let number = 1; number <= doc.numPages; number++) {
    const page = await doc.getPage(number);
    let line = '';
    for (const item of (await page.getTextContent()).items) {
      if (!('str' in item)) continue;
      line += item.str;
      if (item.hasEOL) {
        if (line.trim()) lines.push(line.replace(/\s+/g, ' ').trim());
        line = '';
      }
    }
    if (line.trim()) lines.push(line.replace(/\s+/g, ' ').trim());
    page.cleanup();
  }
  return lines;
}

/**
 * The current academic year's calendar, read from the Senate decision the
 * university's calendar page links — the newest for that year, so an
 * amendment wins over what it amends. Failing that year, the latest one
 * published. Null when the page links none that reads.
 */
export async function fetchCalendar(now: Date = new Date()): Promise<AcademicCalendar | null> {
  const candidates = calendarCandidates(await fetchText(calendarPage), calendarPage);
  if (candidates.length === 0) return null;
  const wanted = academicYearOf(now);
  const year = candidates.some((c) => c.year === wanted)
    ? wanted
    : Math.max(...candidates.map((c) => c.year));
  const ordered = candidates.filter((c) => c.year === year).sort((a, b) => b.uploaded - a.uploaded);

  for (const candidate of ordered) {
    const parsed = parseCalendar(await pdfLines(await fetchBuffer(candidate.url)));
    if (parsed && parsed.periods.length > 0) {
      return { ...parsed, source: { url: candidate.url, label: candidate.label } };
    }
  }
  return null;
}
