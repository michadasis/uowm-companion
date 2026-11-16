import { load } from 'cheerio';

import { attachmentFormat } from '../content/blocks.js';
import type { ScheduleSource } from '../registry/index.js';

import { asScheduleFormat } from './types.js';
import type { DiscoveredDocument } from './types.js';

function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

interface Link {
  url: string;
  label: string;
  /** YYYYMM from a /uploads/YYYY/MM/ path, for "newest" ordering. */
  uploadStamp: number;
}

function documentLinks(html: string, baseUrl: string): Link[] {
  const $ = load(html);
  const content = $('.entry-content, article .entry-content, article').first();
  const scope = content.length ? content : $('body');
  const links: Link[] = [];

  scope.find('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    let url: URL;
    try {
      url = new URL(href, baseUrl);
    } catch {
      return;
    }
    if (!asScheduleFormat(attachmentFormat(url.href))) return;
    const month = /\/uploads\/(\d{4})\/(\d{2})\//.exec(url.pathname);
    links.push({
      url: url.href,
      label: $(el).text().replace(/\s+/g, ' ').trim(),
      uploadStamp: month ? Number(month[1]) * 100 + Number(month[2]) : 0,
    });
  });

  return links;
}

function toDocument(link: Link): DiscoveredDocument | null {
  const format = asScheduleFormat(attachmentFormat(link.url));
  if (!format) return null;
  return { url: link.url, format, label: link.label || link.url.split('/').pop() || link.url };
}

/** What a source yields: a title for the schedule & its documents, in order. */
export interface Discovery {
  label: string;
  documents: DiscoveredDocument[];
}

type ScheduleKind = 'exams' | 'timetable';

// A post's title says which schedule it carries. A category or a search also
// turns up notices about room changes, transport, theses & the like, which
// these patterns leave out. Matched against folded text.
const titles: Record<ScheduleKind, { want: RegExp; skip: RegExp }> = {
  exams: {
    want: /εξεταστικ|προγραμμα εξετασεων/,
    skip: /κατατακτηρ|δρομολογ|πτυχιακ|διπλωματικ|αλλαγη|αιθουσ|μεταπτυχ|παραταση|δηλωση|υλη/,
  },
  timetable: {
    want: /ωρολογι|προγραμμα (μαθηματων|διδασκαλιας)/,
    skip: /εξεταστικ|εξετασεων|μεταπτυχ|κατατακτηρ/,
  },
};

// A schedule posted longer ago than this belongs to a term that is over; it
// is better to say there is none than to show last year's as current.
const staleAfterDays = 300;

// A post can carry a schedule per semester or per sitting; past a handful the
// rest are rarely more of the same schedule.
const maxDocuments = 6;

function unique(links: Link[]): Link[] {
  const seen = new Set<string>();
  return links.filter((link) => (seen.has(link.url) ? false : (seen.add(link.url), true)));
}

interface WordPressPost {
  date?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  link?: string;
}

function decodeEntities(html: string): string {
  return load(`<p>${html}</p>`)('p').text().replace(/\s+/g, ' ').trim();
}

async function fromWordPress(
  source: Extract<ScheduleSource, { adapter: 'wordpress-posts' }>,
  kind: ScheduleKind,
  fetchText: (url: string) => Promise<string>,
  now: Date,
): Promise<Discovery | null> {
  const params = new URLSearchParams({ per_page: '20', _fields: 'date,title,content,link' });
  if (source.category !== undefined) params.set('categories', String(source.category));
  if (source.search) params.set('search', source.search);
  const posts = JSON.parse(await fetchText(`${source.apiRoot}wp/v2/posts?${params.toString()}`)) as unknown;
  if (!Array.isArray(posts)) return null;

  const { want, skip } = titles[kind];
  for (const post of posts as WordPressPost[]) {
    const title = decodeEntities(post.title?.rendered ?? '');
    const folded = fold(title);
    if (!want.test(folded) || skip.test(folded)) continue;

    // Posts come newest first; once one is too old, so is every one after.
    const published = post.date ? new Date(post.date) : null;
    if (published && now.getTime() - published.getTime() > staleAfterDays * 86_400_000) return null;

    const links = unique(documentLinks(post.content?.rendered ?? '', post.link ?? source.apiRoot));
    const documents = links
      .map(toDocument)
      .filter((doc): doc is DiscoveredDocument => doc !== null)
      .slice(0, maxDocuments);
    if (documents.length) return { label: title, documents };
  }
  return null;
}

async function fromEmbeddedSheet(
  pageUrl: string,
  fetchText: (url: string) => Promise<string>,
): Promise<Discovery | null> {
  const $ = load(await fetchText(pageUrl));
  const ids: string[] = [];
  // The sheets are embedded as iframes, & usually linked too; either gives the id.
  $('iframe[src], a[href]').each((_, el) => {
    const url = $(el).attr('src') ?? $(el).attr('href') ?? '';
    const id = /docs\.google\.com\/spreadsheets\/d\/([\w-]+)/.exec(url)?.[1];
    if (id && id !== 'e' && !ids.includes(id)) ids.push(id);
  });
  if (ids.length === 0) return null;

  const label =
    $('h1').first().text().replace(/\s+/g, ' ').trim() ||
    $('title').text().split(/[|–-]/)[0]!.trim() ||
    pageUrl;
  return {
    label,
    documents: ids.slice(0, maxDocuments).map((id) => ({
      // Google serves any sheet it lets the public view as a workbook download.
      url: `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`,
      format: 'xlsx',
      label,
    })),
  };
}

/**
 * Finds the department's current schedule from the source the registry
 * records: the documents that make it up — usually one, but a schedule can be
 * split by semester or sitting — & a title for it. Returns null when the
 * source has no current schedule on it.
 */
export async function discoverDocuments(
  source: ScheduleSource,
  kind: ScheduleKind,
  fetchText: (url: string) => Promise<string>,
  now: Date = new Date(),
): Promise<Discovery | null> {
  if (source.adapter === 'wordpress-posts') return fromWordPress(source, kind, fetchText, now);
  if (source.adapter === 'embedded-sheet') return fromEmbeddedSheet(source.pageUrl, fetchText);
  const document = await discoverDocument(source, fetchText);
  return document ? { label: document.label, documents: [document] } : null;
}

/**
 * Finds the current document behind a page or a menu link: the single-document
 * sources. The others go through `discoverDocuments`.
 */
export async function discoverDocument(
  source: ScheduleSource,
  fetchText: (url: string) => Promise<string>,
): Promise<DiscoveredDocument | null> {
  if (source.adapter === 'document-page') {
    const links = documentLinks(await fetchText(source.pageUrl), source.pageUrl);
    if (links.length === 0) return null;
    const chosen =
      source.pick === 'newest-upload'
        ? [...links].sort((a, b) => b.uploadStamp - a.uploadStamp)[0]!
        : links[0]!;
    return toDocument(chosen);
  }

  if (source.adapter === 'menu-link') {
    const wanted = fold(source.label);
    const html = await fetchText(source.pageUrl);
    const $ = load(html);

    // The menu link points either straight at the document or at a page that
    // holds it. Find the anchor by the start of its label.
    let target: string | null = null;
    $('a[href]').each((_, el) => {
      if (target) return;
      const text = fold($(el).text());
      const href = $(el).attr('href');
      if (!href || !text.startsWith(wanted)) return;
      try {
        target = new URL(href, source.pageUrl).href;
      } catch {
        /* ignore an unparseable href */
      }
    });
    if (!target) return null;

    if (asScheduleFormat(attachmentFormat(target))) {
      return toDocument({ url: target, label: source.label, uploadStamp: 0 });
    }
    // The label led to a page; take the first document on it.
    const links = documentLinks(await fetchText(target), target);
    return links.length ? toDocument(links[0]!) : null;
  }

  return null;
}
