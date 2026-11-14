import { z } from 'zod';

import { collectAttachments, collectImages } from '../content/blocks.js';
import { decodeHtml } from '../content/extract.js';
import { htmlToBlocks } from '../content/html-to-blocks.js';

import type { Announcement } from './types.js';

const rendered = z.object({ rendered: z.string() });

export const wpPostSchema = z.object({
  id: z.number(),
  // date_gmt is the post time in UTC; `date` alone is the site's local time
  // with no zone, which would be read as UTC & come out hours off.
  date_gmt: z.string(),
  link: z.string().url(),
  title: rendered,
  excerpt: rendered,
  content: rendered,
});

export const wpPostsSchema = z.array(wpPostSchema);

export type WpPost = z.infer<typeof wpPostSchema>;

/** The fields & query a department's announcement feed needs from WordPress. */
export function wordpressPostsUrl(apiRoot: string, categories: number[], perPage: number): string {
  const params = new URLSearchParams({
    categories: categories.join(','),
    per_page: String(perPage),
    _fields: 'id,date_gmt,link,title,excerpt,content',
    orderby: 'date',
    order: 'desc',
  });
  return `${apiRoot.replace(/\/$/, '')}/wp/v2/posts?${params.toString()}`;
}

export function parseWordPressPosts(posts: WpPost[], deptId: string): Announcement[] {
  return posts.map((post) => {
    const body = htmlToBlocks(post.content.rendered, post.link);
    return {
      id: `${deptId}:${post.id}`,
      title: decodeHtml(post.title.rendered),
      // date_gmt has no zone marker but is UTC by definition.
      date: new Date(`${post.date_gmt}Z`).toISOString(),
      excerpt: decodeHtml(post.excerpt.rendered),
      body,
      images: collectImages(body),
      attachments: collectAttachments(body),
      sourceUrl: post.link,
    };
  });
}
