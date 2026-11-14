import { load } from 'cheerio';
import { isTag, isText } from 'domhandler';
import type { AnyNode, Element } from 'domhandler';

import { attachmentFormat } from './blocks.js';
import type { Block, Inline, InlineRun } from './blocks.js';

/**
 * Turns the HTML a WordPress site serves for a post (or the main content of a
 * page) into the app's block model. It keeps the shapes the app can render
 * and throws the rest away: an announcement is text, lists, tables, images,
 * the documents it links & the odd rule, not a web layout.
 */
export function htmlToBlocks(html: string, baseUrl: string): Block[] {
  const $ = load(html);
  $('script, style, noscript, iframe, form, button, svg').remove();
  const root = $('body')[0];
  const blocks: Block[] = [];
  if (root) walkChildren(root, blocks, baseUrl);
  return mergeAdjacent(blocks);
}

const headingTags: Record<string, 2 | 3 | 4> = { h1: 2, h2: 2, h3: 3, h4: 4, h5: 4, h6: 4 };
// Containers that carry no meaning of their own: walk into them as if their
// children sat where they do.
const transparentTags = new Set(['div', 'section', 'article', 'main', 'header', 'span', 'a']);
// Block-level tags that can turn up inside something inline (a nested list in
// a list item, say); their content belongs to their own block, not the text.
const blockWithinInline = new Set(['ul', 'ol', 'table', 'figure', 'blockquote']);

function isElement(node: AnyNode): node is Element {
  return isTag(node);
}

function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function walkChildren(parent: AnyNode & { children?: AnyNode[] }, out: Block[], baseUrl: string) {
  for (const child of parent.children ?? []) {
    walk(child, out, baseUrl);
  }
}

function walk(node: AnyNode, out: Block[], baseUrl: string) {
  if (isText(node)) {
    // Loose text between block elements becomes a paragraph of its own.
    const content = normalise([{ text: node.data }]);
    if (content.length) out.push({ type: 'paragraph', content });
    return;
  }
  if (!isElement(node)) return;

  const tag = node.name.toLowerCase();

  if (tag in headingTags) {
    const content = inlineOf(node, baseUrl, {});
    if (content.length) out.push({ type: 'heading', level: headingTags[tag]!, content });
    return;
  }

  switch (tag) {
    case 'p':
      pushParagraphOrMedia(node, out, baseUrl);
      return;
    case 'ul':
    case 'ol':
      pushList(node, out, baseUrl, tag === 'ol');
      return;
    case 'blockquote': {
      const content = inlineOf(node, baseUrl, {});
      if (content.length) out.push({ type: 'quote', content });
      return;
    }
    case 'table':
      pushTable(node, out, baseUrl);
      return;
    case 'figure':
    case 'picture':
      pushFigure(node, out, baseUrl);
      return;
    case 'img':
      pushImage(node, out, baseUrl);
      return;
    case 'hr':
      out.push({ type: 'divider' });
      return;
    case 'br':
      return;
    case 'li':
    case 'tr':
    case 'td':
    case 'th':
      // Reached out of context (malformed markup); treat as a paragraph.
      pushParagraphOrMedia(node, out, baseUrl);
      return;
    default:
      if (transparentTags.has(tag)) {
        // A standalone link to a document is an attachment wherever it sits.
        if (tag === 'a' && isDocumentLink(node, baseUrl) && !hasText(node)) {
          pushAttachment(node, out, baseUrl);
          return;
        }
        walkChildren(node, out, baseUrl);
      }
      return;
  }
}

function pushParagraphOrMedia(node: Element, out: Block[], baseUrl: string) {
  // A paragraph that is really just a document link, or just an image, is
  // lifted to a block of its own instead of a line of text.
  const link = onlyDocumentLink(node, baseUrl);
  if (link) {
    pushAttachment(link, out, baseUrl);
    return;
  }
  const image = onlyImage(node);
  if (image) {
    pushImage(image, out, baseUrl);
    return;
  }
  const content = inlineOf(node, baseUrl, {});
  if (content.length) out.push({ type: 'paragraph', content });
}

function pushList(node: Element, out: Block[], baseUrl: string, ordered: boolean) {
  const items: Inline[] = [];
  for (const li of childElements(node, 'li')) {
    const content = inlineOf(li, baseUrl, {});
    if (content.length) items.push(content);
    // A list nested inside this item is flattened in after it.
    for (const nested of childElements(li, 'ul', 'ol')) {
      const nestedBlocks: Block[] = [];
      pushList(nested, nestedBlocks, baseUrl, nested.name.toLowerCase() === 'ol');
      for (const block of nestedBlocks) {
        if (block.type === 'list') items.push(...block.items);
      }
    }
  }
  if (items.length) out.push({ type: 'list', ordered, items });
}

function pushTable(node: Element, out: Block[], baseUrl: string) {
  const rows: Inline[][] = [];
  let header: Inline[] | null = null;

  for (const tr of descendantElements(node, 'tr')) {
    const cells = childElements(tr, 'td', 'th').map((cell) => inlineOf(cell, baseUrl, {}));
    if (!cells.length) continue;
    const allHeaderCells = childElements(tr, 'td', 'th').every(
      (cell) => cell.name.toLowerCase() === 'th',
    );
    if (header === null && allHeaderCells) header = cells;
    else rows.push(cells);
  }

  if (header || rows.length) out.push({ type: 'table', header, rows });
}

function pushFigure(node: Element, out: Block[], baseUrl: string) {
  const img = descendantElements(node, 'img')[0];
  if (!img) {
    walkChildren(node, out, baseUrl);
    return;
  }
  const caption = descendantElements(node, 'figcaption')[0];
  const alt = textOf(img.attribs['alt']) || (caption ? plainTextOf(caption) : '') || undefined;
  pushImage(img, out, baseUrl, alt);
}

function pushImage(node: Element, out: Block[], baseUrl: string, altOverride?: string) {
  const rawSrc = node.attribs['src'] ?? firstSrcFromSet(node.attribs['srcset']);
  if (!rawSrc) return;
  const src = resolveUrl(rawSrc, baseUrl);
  if (!src) return;
  // Tracking pixels & layout spacers carry no content.
  if (
    /width=['"]?1\b/.test(node.attribs['width'] ?? '') ||
    /wp-smiley/.test(node.attribs['class'] ?? '')
  ) {
    return;
  }
  const alt = altOverride ?? (textOf(node.attribs['alt']) || undefined);
  out.push({ type: 'image', src, ...(alt ? { alt } : {}) });
}

function pushAttachment(link: Element, out: Block[], baseUrl: string) {
  const href = resolveUrl(link.attribs['href'] ?? '', baseUrl);
  if (!href) return;
  const format = attachmentFormat(href);
  if (!format) return;
  const name = plainTextOf(link) || decodeURIComponent(href.split('/').pop() ?? href);
  out.push({ type: 'attachment', name, href, format });
}

// --- inline ---

function inlineOf(
  node: Element,
  baseUrl: string,
  marks: { bold?: boolean; italic?: boolean },
): Inline {
  const runs: InlineRun[] = [];
  collectInline(node, baseUrl, marks, undefined, runs);
  return normalise(runs);
}

function collectInline(
  node: AnyNode,
  baseUrl: string,
  marks: { bold?: boolean; italic?: boolean },
  href: string | undefined,
  out: InlineRun[],
) {
  for (const child of (node as Element).children ?? []) {
    if (isText(child)) {
      // A newline in HTML text is just whitespace; only <br> breaks a line.
      out.push({ text: child.data.replace(/\s+/g, ' '), ...marks, ...(href ? { href } : {}) });
      continue;
    }
    if (!isElement(child)) continue;
    const tag = child.name.toLowerCase();
    if (tag === 'br') {
      out.push({ text: '\n' });
      continue;
    }
    // Block-level content nested inside inline is handled as its own block,
    // so it is skipped here rather than flattened into the text.
    if (blockWithinInline.has(tag)) continue;
    if (tag === 'img') {
      // Inline images are dropped, but their alt text is kept so a sentence
      // that leans on the image still reads.
      const alt = textOf(child.attribs['alt']);
      if (alt) out.push({ text: alt, ...marks, ...(href ? { href } : {}) });
      continue;
    }
    const nextMarks = {
      bold: marks.bold || tag === 'strong' || tag === 'b',
      italic: marks.italic || tag === 'em' || tag === 'i',
    };
    let nextHref = href;
    if (tag === 'a') {
      const resolved = resolveUrl(child.attribs['href'] ?? '', baseUrl);
      if (resolved) nextHref = resolved;
    }
    collectInline(child, baseUrl, nextMarks, nextHref, out);
  }
}

function normalise(runs: InlineRun[]): Inline {
  const cleaned: InlineRun[] = [];
  for (const run of runs) {
    // Collapse runs of whitespace but keep the newlines <br> produced.
    const text = run.text.replace(/[^\S\n]+/g, ' ').replace(/ *\n */g, '\n');
    if (text === '') continue;
    cleaned.push({ ...run, text });
  }
  // Drop leading & trailing whitespace across the whole inline.
  while (cleaned.length && cleaned[0]!.text.trim() === '' && !cleaned[0]!.href) cleaned.shift();
  while (
    cleaned.length &&
    cleaned[cleaned.length - 1]!.text.trim() === '' &&
    !cleaned[cleaned.length - 1]!.href
  ) {
    cleaned.pop();
  }
  const merged: InlineRun[] = [];
  for (const run of cleaned) {
    const last = merged[merged.length - 1];
    if (
      last &&
      Boolean(last.bold) === Boolean(run.bold) &&
      Boolean(last.italic) === Boolean(run.italic) &&
      last.href === run.href
    ) {
      last.text += run.text;
    } else {
      merged.push({ ...run });
    }
  }
  // Marks are only kept when true, so equal runs compare & serialise cleanly.
  return merged.map((run) => {
    const out: InlineRun = { text: run.text };
    if (run.bold) out.bold = true;
    if (run.italic) out.italic = true;
    if (run.href) out.href = run.href;
    return out;
  });
}

function mergeAdjacent(blocks: Block[]): Block[] {
  // Two dividers in a row, or a leading or trailing divider, are noise.
  const out: Block[] = [];
  for (const block of blocks) {
    if (block.type === 'divider' && (out.length === 0 || out[out.length - 1]!.type === 'divider')) {
      continue;
    }
    out.push(block);
  }
  while (out.length && out[out.length - 1]!.type === 'divider') out.pop();
  return out;
}

// --- helpers ---

function childElements(node: Element, ...names: string[]): Element[] {
  const wanted = new Set(names);
  return (node.children ?? []).filter(
    (child): child is Element => isElement(child) && wanted.has(child.name.toLowerCase()),
  );
}

function descendantElements(node: Element, name: string): Element[] {
  const found: Element[] = [];
  const visit = (current: AnyNode) => {
    for (const child of (current as Element).children ?? []) {
      if (!isElement(child)) continue;
      if (child.name.toLowerCase() === name) found.push(child);
      else visit(child);
    }
  };
  visit(node);
  return found;
}

function textOf(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function plainTextOf(node: Element): string {
  return textOf(collectText(node));
}

function collectText(node: AnyNode): string {
  let text = '';
  for (const child of (node as Element).children ?? []) {
    if (isText(child)) text += child.data;
    else if (isElement(child)) text += collectText(child);
  }
  return text;
}

function hasText(node: Element): boolean {
  return collectText(node).trim() !== '';
}

function firstSrcFromSet(srcset: string | undefined): string | undefined {
  if (!srcset) return undefined;
  return srcset.split(',')[0]?.trim().split(/\s+/)[0];
}

function isDocumentLink(node: Element, baseUrl: string): boolean {
  const href = resolveUrl(node.attribs['href'] ?? '', baseUrl);
  return href !== null && attachmentFormat(href) !== null;
}

/** The sole link in a block when that block is nothing but that link. */
function onlyDocumentLink(node: Element, baseUrl: string): Element | null {
  const links = descendantElements(node, 'a').filter((a) => isDocumentLink(a, baseUrl));
  if (links.length !== 1) return null;
  // The paragraph's text must be only the link's own text.
  const linkText = collectText(links[0]!).trim();
  const allText = collectText(node).trim();
  return linkText === allText ? links[0]! : null;
}

function onlyImage(node: Element): Element | null {
  const images = descendantElements(node, 'img');
  if (images.length !== 1) return null;
  return collectText(node).trim() === '' ? images[0]! : null;
}
