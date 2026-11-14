import { collectAttachments, collectImages, plainText } from '../content/blocks.js';
import { parsePostPage } from '../content/extract.js';
import { htmlToBlocks } from '../content/html-to-blocks.js';

import type { Announcement } from './types.js';

function slugOf(url: string): string {
  const path = new URL(url).pathname.replace(/\/$/, '');
  return path.split('/').pop() || url;
}

/** The excerpt a post page gives, or the start of its first paragraph. */
function excerptOf(pageExcerpt: string | null, body: Announcement['body']): string {
  if (pageExcerpt) return pageExcerpt;
  const firstParagraph = body.find((block) => block.type === 'paragraph');
  if (firstParagraph?.type !== 'paragraph') return '';
  const text = plainText(firstParagraph.content);
  return text.length > 200 ? `${text.slice(0, 200).trimEnd()}…` : text;
}

/**
 * Builds one announcement from a scraped post page. Returns null when the
 * page is missing what a card needs — a title & a body — so an odd page drops
 * out instead of showing up blank. The date can be absent: some department
 * themes expose none, and a dated-but-hidden announcement still beats nothing.
 */
export function parseHtmlListingPost(
  html: string,
  url: string,
  deptId: string,
): Announcement | null {
  const page = parsePostPage(html);
  if (!page.title || !page.bodyHtml) return null;

  const body = htmlToBlocks(page.bodyHtml, url);
  if (!body.length) return null;

  return {
    id: `${deptId}:${slugOf(url)}`,
    title: page.title,
    date: page.date,
    excerpt: excerptOf(page.excerpt, body),
    body,
    images: collectImages(body),
    attachments: collectAttachments(body),
    sourceUrl: url,
  };
}
