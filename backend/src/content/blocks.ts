/**
 * The one content model the whole app renders. Announcement HTML, web pages
 * and the documents departments publish are all turned into these blocks on
 * the backend, and the app draws them with its own native components. The
 * model is deliberately small: every shape here has to be worth a renderer
 * and a test on the app side.
 *
 * The app keeps a zod schema that mirrors this file. The two are checked
 * against each other by a shared set of fixtures, so neither can drift.
 */

export interface Mark {
  bold?: boolean;
  italic?: boolean;
}

/** A run of text, optionally marked and optionally a link. */
export interface InlineRun extends Mark {
  text: string;
  /** An absolute URL. Present when the run is a link. */
  href?: string;
}

/** Inline content: a paragraph, a heading cell or a list item is made of runs. */
export type Inline = InlineRun[];

export interface HeadingBlock {
  type: 'heading';
  /** Clamped to 2-4: the announcement's own title is the level-1 heading. */
  level: 2 | 3 | 4;
  content: Inline;
}

export interface ParagraphBlock {
  type: 'paragraph';
  content: Inline;
}

export interface ListBlock {
  type: 'list';
  ordered: boolean;
  items: Inline[];
}

export interface QuoteBlock {
  type: 'quote';
  content: Inline;
}

export interface ImageBlock {
  type: 'image';
  src: string;
  alt?: string;
}

export interface TableBlock {
  type: 'table';
  /** The header row, or null when the table has no header. */
  header: Inline[] | null;
  rows: Inline[][];
}

export interface DividerBlock {
  type: 'divider';
}

export type AttachmentFormat = 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'other';

/**
 * A document linked from the content. In Phase 2 it is shown as a native card
 * that links out; the pipeline that turns the document itself into blocks
 * comes with the schedules in a later phase.
 */
export interface AttachmentBlock {
  type: 'attachment';
  name: string;
  href: string;
  format: AttachmentFormat;
}

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | QuoteBlock
  | ImageBlock
  | TableBlock
  | DividerBlock
  | AttachmentBlock;

const documentFormats: Record<string, AttachmentFormat> = {
  pdf: 'pdf',
  doc: 'doc',
  docx: 'docx',
  xls: 'xls',
  xlsx: 'xlsx',
  ppt: 'ppt',
  pptx: 'pptx',
  odt: 'other',
  ods: 'other',
};

/** The document format a URL points at, or null if it is not a document. */
export function attachmentFormat(url: string): AttachmentFormat | null {
  const match = /\.([a-z0-9]+)(?:[?#]|$)/i.exec(url);
  if (!match) return null;
  const extension = match[1]?.toLowerCase();
  return extension && extension in documentFormats ? documentFormats[extension]! : null;
}

export function plainText(content: Inline): string {
  return content
    .map((run) => run.text)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

export function collectImages(blocks: Block[]): string[] {
  return blocks.filter((block): block is ImageBlock => block.type === 'image').map((b) => b.src);
}

export interface Attachment {
  name: string;
  href: string;
  format: AttachmentFormat;
}

export function collectAttachments(blocks: Block[]): Attachment[] {
  return blocks
    .filter((block): block is AttachmentBlock => block.type === 'attachment')
    .map(({ name, href, format }) => ({ name, href, format }));
}
