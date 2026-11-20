import { parseArchiveEntries } from '../content/extract.js';
import { FetchError, fetchJson, fetchText, mapWithConcurrency } from '../http/fetch.js';
import type { AnnouncementsSource } from '../registry/index.js';

import { parseHtmlListingPost } from './htmlListing.js';
import type { Announcement } from './types.js';
import {
  attachmentBlocks,
  parseWordPressPosts,
  withAttachments,
  wordpressMediaUrl,
  wordpressPostsUrl,
  wpMediaSchema,
  wpPostsSchema,
} from './wordpress.js';

const perPage = 20;
// As many as the REST departments give, so no feed is shorter for its site.
const htmlListingLimit = perPage;
const htmlListingConcurrency = 4;
// Fewer announcements than this on a listing's first page sends us to its next ones.
const minimumListed = htmlListingLimit;
// A listing of only a few posts a page is read on, up to this page.
const listingLastPage = 6;

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
    const announcements = parseWordPressPosts(wpPostsSchema.parse(data), id);
    // A post with no text may still carry files; ask for them, a few at a time.
    return mapWithConcurrency(announcements, htmlListingConcurrency, async (announcement) => {
      if (announcement.body.length > 0) return announcement;
      const postId = Number(announcement.id.split(':').pop());
      try {
        const media = wpMediaSchema.parse(
          await fetchJson(wordpressMediaUrl(source.apiRoot, postId)),
        );
        return withAttachments(announcement, attachmentBlocks(media));
      } catch {
        return announcement;
      }
    });
  }

  const archive = await fetchText(source.listingUrl);
  let all = parseArchiveEntries(archive, source.listingUrl, source.postPathPrefix);
  // A listing that shows only a few posts a page is read on, page by page,
  // until it has enough: Management Science & Technology shows four.
  const nextPage = `${new URL(source.listingUrl).pathname}page/2/`;
  const datedCount = () => all.filter((entry) => entry.date).length;
  if (archive.includes(nextPage)) {
    for (let page = 2; page <= listingLastPage && datedCount() < minimumListed; page++) {
      const more = await fetchText(`${source.listingUrl}page/${page}/`).then(
        (html) => parseArchiveEntries(html, source.listingUrl, source.postPathPrefix),
        () => [],
      );
      const known = new Set(all.map((entry) => entry.url));
      const fresh = more.filter((entry) => !known.has(entry.url));
      if (fresh.length === 0) break;
      all = [...all, ...fresh];
    }
  }
  // Where the listing dates its items, an undated link is the site's menu or
  // sidebar pointing at a standing page, not an announcement.
  const dated = all.filter((entry) => entry.date !== null);
  const entries = (dated.length >= 3 ? dated : all).slice(0, htmlListingLimit);
  const announcements = await mapWithConcurrency(entries, htmlListingConcurrency, async (entry) => {
    const announcement = parseHtmlListingPost(await fetchText(entry.url), entry.url, id);
    if (!announcement) throw new Error(`Could not parse ${entry.url}`);
    // A theme that dates posts only in the listing still gets them dated.
    return announcement.date ? announcement : { ...announcement, date: entry.date };
  });
  // The odd post that won't load is left out; most of them failing is the
  // site struggling, & a feed of the few that made it would be cached as if
  // that were all there is.
  if (entries.length >= 4 && announcements.length < entries.length / 2) {
    throw new FetchError(
      `Only ${announcements.length} of ${entries.length} posts loaded from ${source.listingUrl}`,
    );
  }
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
