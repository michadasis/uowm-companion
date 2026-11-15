import { z } from 'zod';

/**
 * The app's copy of the backend block model. The backend builds these; this
 * schema validates them on the way in, so a shape the app can't render fails
 * here with a clear error rather than deep inside a list. It mirrors
 * backend/src/content/blocks.ts.
 */

const inlineRun = z.object({
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  href: z.string().optional(),
});

const inline = z.array(inlineRun);

const headingBlock = z.object({
  type: z.literal('heading'),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  content: inline,
});

const paragraphBlock = z.object({ type: z.literal('paragraph'), content: inline });

const listBlock = z.object({
  type: z.literal('list'),
  ordered: z.boolean(),
  items: z.array(inline),
});

const quoteBlock = z.object({ type: z.literal('quote'), content: inline });

const imageBlock = z.object({
  type: z.literal('image'),
  src: z.string(),
  alt: z.string().optional(),
});

const tableBlock = z.object({
  type: z.literal('table'),
  header: z.array(inline).nullable(),
  rows: z.array(z.array(inline)),
});

const dividerBlock = z.object({ type: z.literal('divider') });

export const attachmentFormats = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'other',
] as const;

const attachmentBlock = z.object({
  type: z.literal('attachment'),
  name: z.string(),
  href: z.string(),
  format: z.enum(attachmentFormats),
});

export const blockSchema = z.discriminatedUnion('type', [
  headingBlock,
  paragraphBlock,
  listBlock,
  quoteBlock,
  imageBlock,
  tableBlock,
  dividerBlock,
  attachmentBlock,
]);

export const blocksSchema = z.array(blockSchema);

export type InlineRun = z.infer<typeof inlineRun>;
export type Inline = z.infer<typeof inline>;
export type Block = z.infer<typeof blockSchema>;
export type HeadingBlock = z.infer<typeof headingBlock>;
export type ParagraphBlock = z.infer<typeof paragraphBlock>;
export type ListBlock = z.infer<typeof listBlock>;
export type QuoteBlock = z.infer<typeof quoteBlock>;
export type ImageBlock = z.infer<typeof imageBlock>;
export type TableBlock = z.infer<typeof tableBlock>;
export type AttachmentBlock = z.infer<typeof attachmentBlock>;
export type AttachmentFormat = (typeof attachmentFormats)[number];
