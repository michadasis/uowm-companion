import { parseArchiveLinks } from '../content/extract.js';
import { fetchJson, fetchText, mapWithConcurrency } from '../http/fetch.js';
import type { AnnouncementsSource } from '../registry/index.js';

import { parseHtmlListingPost } from './htmlListing.js';
import type { Announcement } from './types.js';
import { parseWordPressPosts, wordpressPostsUrl, wpPostsSchema } from './wordpress.js';

const perPage = 20;
const htmlListingLimit = 15;
const htmlListingConcurrency = 4;

/**
 * Reads a department's or the university's announcements from whichever source
 * the registry records for it. WordPress REST is one request; the two sites
 * that block it are scraped, their post pages fetched a few at a time.
 */
export async function fetchAnnouncements(
  source: AnnouncementsSource,
  id: string,
): Promise<Announcement[]> {
  if (source.adapter === 'wordpress-rest') {
    const data = await fetchJson(wordpressPostsUrl(source.apiRoot, source.categories, perPage));
    return parseWordPressPosts(wpPostsSchema.parse(data), id);
  }

  const archive = await fetchText(source.listingUrl);
  const links = parseArchiveLinks(archive, source.listingUrl, source.postPathPrefix).slice(
    0,
    htmlListingLimit,
  );
  const announcements = await mapWithConcurrency(links, htmlListingConcurrency, async (url) => {
    const announcement = parseHtmlListingPost(await fetchText(url), url, id);
    if (!announcement) throw new Error(`Could not parse ${url}`);
    return announcement;
  });
  return orderNewestFirst(announcements);
}

/**
 * Newest first. When every item has a date they are sorted by it, which
 * drops a pinned older post to where it belongs. When none do (a theme that
 * exposes no dates), the archive's own order is kept, since it is already
 * newest-first and there is nothing to sort on.
 */
function orderNewestFirst(announcements: Announcement[]): Announcement[] {
  if (!announcements.every((announcement) => announcement.date !== null)) return announcements;
  return [...announcements].sort((a, b) => (a.date! < b.date! ? 1 : a.date! > b.date! ? -1 : 0));
}
