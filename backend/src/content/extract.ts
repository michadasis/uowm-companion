import { load } from 'cheerio';

/** Strips tags & decodes entities, for titles & excerpts that arrive as HTML. */
export function decodeHtml(html: string): string {
  return load(`<uowm-x>${html}</uowm-x>`)('uowm-x').text().replace(/\s+/g, ' ').trim();
}

// Where a WordPress theme keeps the post body, most specific first. The post
// page is far more uniform than an archive, so a short list covers the sites
// that have to be scraped.
const contentSelectors = [
  '.entry-content',
  '.elementor-widget-theme-post-content .elementor-widget-container',
  '.td-post-content',
  'article .post-content',
  '.post-content',
  'article',
];

export interface PostPageContent {
  title: string | null;
  /** ISO 8601, or null when the page exposes no machine-readable date. */
  date: string | null;
  /** The inner HTML of the post body, for htmlToBlocks. */
  bodyHtml: string | null;
  excerpt: string | null;
}

/**
 * Reads a post's title, date & body out of its own page. Leans on the
 * metadata the SEO plugins on these sites already emit (og:title,
 * article:published_time) before falling back to visible markup.
 */
export function parsePostPage(html: string): PostPageContent {
  const $ = load(html);
  $('script, style, noscript').remove();

  const meta = (selector: string, attr = 'content') =>
    $(selector).first().attr(attr)?.trim() || null;

  const title =
    meta('meta[property="og:title"]') ||
    $('h1.entry-title, .entry-title, article h1, h1').first().text().replace(/\s+/g, ' ').trim() ||
    null;

  const rawDate =
    meta('meta[property="article:published_time"]') ||
    meta('time.entry-date', 'datetime') ||
    meta('time[datetime]', 'datetime') ||
    $('.post-date, .entry-date, .posted-on, time').first().text().trim() ||
    null;
  const date = rawDate ? toIsoDate(rawDate) : null;

  let bodyHtml: string | null = null;
  for (const selector of contentSelectors) {
    const node = $(selector).first();
    if (node.length) {
      bodyHtml = node.html();
      break;
    }
  }

  const excerpt =
    meta('meta[property="og:description"]') || meta('meta[name="description"]') || null;

  return { title, date, bodyHtml, excerpt };
}

/** The post permalinks linked from a category archive, in page order, deduped. */
export function parseArchiveLinks(html: string, baseUrl: string, postPathPrefix: string): string[] {
  return parseArchiveEntries(html, baseUrl, postPathPrefix).map((entry) => entry.url);
}

export interface ArchiveEntry {
  url: string;
  /** The date the listing prints beside the link, as ISO; null if none. */
  date: string | null;
}

// How far up from a link to look for the listing item that holds its date.
const itemDepth = 5;

/**
 * The post links on an archive page, in order, each with the date the listing
 * shows for it. Some themes print a post's date only in the listing, never on
 * the post's own page, so this is the one place to read it.
 */
export function parseArchiveEntries(
  html: string,
  baseUrl: string,
  postPathPrefix: string,
): ArchiveEntry[] {
  const $ = load(html);
  const host = new URL(baseUrl).host;
  const entries: ArchiveEntry[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    let url: URL;
    try {
      url = new URL(href, baseUrl);
    } catch {
      return;
    }
    if (url.host !== host || !url.pathname.startsWith(postPathPrefix)) return;
    // The prefix itself is the archive/category root, not a post.
    if (url.pathname === postPathPrefix) return;
    const clean = `${url.origin}${url.pathname}`;
    const known = entries.find((entry) => entry.url === clean);
    if (known?.date) return;

    // Climb from the link to the item that holds it — the closest ancestor
    // with a date in it — but no further than one that also links another
    // post, since that is the list itself.
    const isOtherPost = (a: Parameters<typeof $>[0]): boolean => {
      try {
        const other = new URL($(a).attr('href') ?? '', baseUrl);
        return (
          other.host === host &&
          other.pathname.startsWith(postPathPrefix) &&
          other.pathname !== postPathPrefix &&
          `${other.origin}${other.pathname}` !== clean
        );
      } catch {
        return false;
      }
    };
    let date: string | null = null;
    let item = $(el).parent();
    for (let depth = 0; depth < itemDepth && item.length && !date; depth++) {
      if (item.find('a[href]').filter((__, a) => isOtherPost(a)).length > 0) break;
      const stamp =
        item.find('time[datetime]').attr('datetime') ??
        item.find('.post-date, .entry-date, .posted-on, time').first().text().trim();
      if (stamp) date = toIsoDate(stamp);
      item = item.parent();
    }
    // A post linked twice, say from a sidebar first, keeps its first place but
    // takes the date from wherever the listing prints one.
    if (known) known.date = date;
    else entries.push({ url: clean, date });
  });

  return entries;
}

// Greek month names, genitive & nominative, mapped to a month index. Dates on
// these pages read "14 Νοεμβρίου 2026" or "14 October 2026".
const greekMonths: Record<string, number> = {};
[
  ['ιανουαρ', 0],
  ['φεβρουαρ', 1],
  ['μαρτ', 2],
  ['μαρτιου', 2],
  ['απριλ', 3],
  ['μα', 4], // Μαΐου / Μάιος, matched last so it can't shadow March
  ['ιουν', 5],
  ['ιουλ', 6],
  ['αυγουστ', 7],
  ['σεπτεμβρ', 8],
  ['οκτωβρ', 9],
  ['νοεμβρ', 10],
  ['δεκεμβρ', 11],
].forEach(([stem, index]) => {
  greekMonths[stem as string] = index as number;
});

// English months too, since the archives of a couple of sites print the date
// in English ("14 October 2026"). Latin stems never collide with Greek ones.
['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].forEach(
  (stem, index) => {
    greekMonths[stem] = index;
  },
);

function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Turns a date one of these sites emits into ISO UTC. Handles ISO strings,
 * the English form Date.parse already knows, "DD/MM/YYYY", and the Greek
 * "DD Μηνός YYYY" form. A date with no time is pinned to midnight UTC so it
 * does not slip to the day before when it is formatted.
 */
export function toIsoDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }

  const dmy = /(\d{1,2})[/.](\d{1,2})[/.](\d{4})/.exec(trimmed);
  if (dmy) {
    return isoFrom(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  }

  const greek = /(\d{1,2})\s+([\p{L}]+)\s+(\d{4})/u.exec(trimmed);
  if (greek) {
    const folded = fold(greek[2]!);
    const entry = Object.entries(greekMonths).find(([stem]) => folded.startsWith(stem));
    if (entry) return isoFrom(Number(greek[3]), entry[1], Number(greek[1]));
  }

  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function isoFrom(year: number, monthIndex: number, day: number): string | null {
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;
  return new Date(Date.UTC(year, monthIndex, day)).toISOString();
}
