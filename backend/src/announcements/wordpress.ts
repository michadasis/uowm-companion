import { z } from 'zod';

import { attachmentFormat, collectAttachments, collectImages } from '../content/blocks.js';
import type { Block } from '../content/blocks.js';
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

export const wpMediaSchema = z.array(
  z.object({ source_url: z.string(), title: rendered.optional() }).passthrough(),
);

/** The files uploaded to a post, asked of WordPress by the post's id. */
export function wordpressMediaUrl(apiRoot: string, postId: number): string {
  const params = new URLSearchParams({ parent: String(postId), _fields: 'source_url,title' });
  return `${apiRoot.replace(/\/$/, '')}/wp/v2/media?${params.toString()}`;
}

/** A file's name as a reader would give it: its title, or its file name tidied. */
function fileName(url: string, title: string | undefined): string {
  if (title?.trim()) return decodeHtml(title);
  let base = url.split('/').pop() ?? url;
  try {
    base = decodeURIComponent(base);
  } catch {
    /* keep it encoded */
  }
  return base.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim();
}

/**
 * Attachment blocks for the documents uploaded to a post. Some sites publish
 * an announcement as a title & a few files, never putting the files in the
 * text; without this such a post reads as empty. Images are left out — they
 * are decoration here, not the message.
 */
export function attachmentBlocks(media: z.infer<typeof wpMediaSchema>): Block[] {
  const seen = new Set<string>();
  return media.flatMap((file) => {
    const format = attachmentFormat(file.source_url);
    if (!format || format === 'other' || seen.has(file.source_url)) return [];
    seen.add(file.source_url);
    return [
      {
        type: 'attachment' as const,
        name: fileName(file.source_url, file.title?.rendered),
        href: file.source_url,
        format,
      },
    ];
  });
}

/** Gives a post that has no text the files uploaded to it as its body. */
export function withAttachments(announcement: Announcement, files: Block[]): Announcement {
  if (announcement.body.length > 0 || files.length === 0) return announcement;
  return { ...announcement, body: files, attachments: collectAttachments(files) };
}
