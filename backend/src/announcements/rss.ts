import { load } from 'cheerio';

import { collectAttachments, collectImages } from '../content/blocks.js';
import { htmlToBlocks } from '../content/html-to-blocks.js';

import { excerptOf, slugOf } from './htmlListing.js';
import type { Announcement } from './types.js';
import { attachmentBlocks } from './wordpress.js';

/**
 * Announcements from an RSS 2.0 feed whose items carry the whole post as HTML
 * in their description. A file given only as the item's enclosure is added
 * to the body, so a post that is just a title & a file still reads as one.
 * An item without a title or a link is left out.
 */
export function parseRssFeed(xml: string, deptId: string): Announcement[] {
  const $ = load(xml, { xml: true });
  return $('item')
    .toArray()
    .flatMap((el): Announcement[] => {
      const item = $(el);
      const field = (name: string) => item.children(name).first().text().trim();
      const title = field('title');
      let link: URL;
      try {
        link = new URL(field('link') || field('guid'));
      } catch {
        return [];
      }
      if (!title) return [];

      let body = htmlToBlocks(field('description'), link.href);
      const linked = new Set(collectAttachments(body).map((file) => file.href));
      const enclosures = item
        .children('enclosure')
        .toArray()
        .map((enclosure) => $(enclosure).attr('url'))
        .filter((url): url is string => Boolean(url) && !linked.has(url!));
      body = [...body, ...attachmentBlocks(enclosures.map((url) => ({ source_url: url })))];

      const published = new Date(field('pubDate'));
      return [
        {
          id: `${deptId}:${slugOf(link.href)}`,
          title,
          date: Number.isNaN(published.getTime()) ? null : published.toISOString(),
          excerpt: excerptOf(null, body),
          body,
          images: collectImages(body),
          attachments: collectAttachments(body),
          sourceUrl: link.href,
        },
      ];
    });
}
