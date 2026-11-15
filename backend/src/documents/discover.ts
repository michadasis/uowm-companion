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

/**
 * Finds the department's current schedule document from the source the
 * registry records. Returns null for a source this pipeline doesn't read yet
 * (an embedded Google Sheet, or a schedule published as a post), and for a
 * page that has no document on it.
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

  // embedded-sheet & wordpress-category are not read by this pipeline yet.
  return null;
}
