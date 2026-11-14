import type { Attachment, Block } from '../content/blocks.js';

export interface Announcement {
  /** Unique across the app: the department id & the post's own id. */
  id: string;
  title: string;
  /** ISO 8601 UTC, or null when the source exposes no machine-readable date. */
  date: string | null;
  excerpt: string;
  body: Block[];
  images: string[];
  attachments: Attachment[];
  /** The post's page, for the "View on website" action & attribution. */
  sourceUrl: string;
}

export type AnnouncementSource = { kind: 'department'; id: string } | { kind: 'university' };

export interface AnnouncementsResponse {
  source: AnnouncementSource;
  announcements: Announcement[];
}
