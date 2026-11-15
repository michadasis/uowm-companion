import { z } from 'zod';

import { attachmentFormats, blocksSchema } from '@/features/content/schema';

const attachment = z.object({
  name: z.string(),
  href: z.string(),
  format: z.enum(attachmentFormats),
});

export const announcementSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string().nullable(),
  excerpt: z.string(),
  body: blocksSchema,
  images: z.array(z.string()),
  attachments: z.array(attachment),
  sourceUrl: z.string(),
});

export const announcementsResponseSchema = z.object({
  source: z.union([
    z.object({ kind: z.literal('department'), id: z.string() }),
    z.object({ kind: z.literal('university') }),
  ]),
  announcements: z.array(announcementSchema),
});

export type Announcement = z.infer<typeof announcementSchema>;
export type AnnouncementsResponse = z.infer<typeof announcementsResponseSchema>;
