import { describe, expect, it } from 'vitest';

import { attachmentFormat, plainText } from '../src/content/blocks.js';
import { htmlToBlocks } from '../src/content/html-to-blocks.js';

const base = 'https://cs.uowm.gr/';
const convert = (html: string) => htmlToBlocks(html, base);

describe('htmlToBlocks', () => {
  it('turns a paragraph into a paragraph block', () => {
    expect(convert('<p>Η δήλωση μαθημάτων λήγει την Παρασκευή.</p>')).toEqual([
      { type: 'paragraph', content: [{ text: 'Η δήλωση μαθημάτων λήγει την Παρασκευή.' }] },
    ]);
  });

  it('keeps bold & italic as marks on the runs', () => {
    const blocks = convert(
      '<p>Η προθεσμία είναι <strong>αυστηρή</strong> και <em>τελική</em>.</p>',
    );
    expect(blocks).toEqual([
      {
        type: 'paragraph',
        content: [
          { text: 'Η προθεσμία είναι ' },
          { text: 'αυστηρή', bold: true },
          { text: ' και ' },
          { text: 'τελική', italic: true },
          { text: '.' },
        ],
      },
    ]);
  });

  it('nests a mark inside a link', () => {
    const blocks = convert('<p>Δες <a href="/odigos/"><strong>τον οδηγό</strong></a> εδώ.</p>');
    expect(blocks[0]).toEqual({
      type: 'paragraph',
      content: [
        { text: 'Δες ' },
        { text: 'τον οδηγό', bold: true, href: 'https://cs.uowm.gr/odigos/' },
        { text: ' εδώ.' },
      ],
    });
  });

  it('resolves relative & root-relative links against the base URL', () => {
    const blocks = convert('<p><a href="../a/">one</a> <a href="https://x.gr/b">two</a></p>');
    const hrefs = (blocks[0]?.type === 'paragraph' ? blocks[0].content : [])
      .map((run) => run.href)
      .filter(Boolean);
    expect(hrefs).toEqual(['https://cs.uowm.gr/a/', 'https://x.gr/b']);
  });

  it('clamps heading levels to 2-4 and reads their text', () => {
    const blocks = convert('<h1>Α</h1><h2>Β</h2><h3>Γ</h3><h5>Δ</h5>');
    expect(
      blocks.map((b) => (b.type === 'heading' ? [b.level, plainText(b.content)] : null)),
    ).toEqual([
      [2, 'Α'],
      [2, 'Β'],
      [3, 'Γ'],
      [4, 'Δ'],
    ]);
  });

  it('reads an unordered & an ordered list', () => {
    const blocks = convert('<ul><li>ένα</li><li>δύο</li></ul><ol><li>πρώτο</li></ol>');
    expect(blocks).toEqual([
      { type: 'list', ordered: false, items: [[{ text: 'ένα' }], [{ text: 'δύο' }]] },
      { type: 'list', ordered: true, items: [[{ text: 'πρώτο' }]] },
    ]);
  });

  it('flattens a nested list into its parent', () => {
    const blocks = convert('<ul><li>μαθήματα<ul><li>5ου</li><li>7ου</li></ul></li></ul>');
    expect(blocks).toEqual([
      {
        type: 'list',
        ordered: false,
        items: [[{ text: 'μαθήματα' }], [{ text: '5ου' }], [{ text: '7ου' }]],
      },
    ]);
  });

  it('reads a table with a header row', () => {
    const html =
      '<table><thead><tr><th>Μάθημα</th><th>Αίθουσα</th></tr></thead>' +
      '<tbody><tr><td>Αλγόριθμοι</td><td>Α2</td></tr></tbody></table>';
    expect(convert(html)).toEqual([
      {
        type: 'table',
        header: [[{ text: 'Μάθημα' }], [{ text: 'Αίθουσα' }]],
        rows: [[[{ text: 'Αλγόριθμοι' }], [{ text: 'Α2' }]]],
      },
    ]);
  });

  it('reads a table that has no header row', () => {
    const blocks = convert(
      '<table><tr><td>α</td><td>β</td></tr><tr><td>γ</td><td>δ</td></tr></table>',
    );
    expect(blocks[0]).toEqual({
      type: 'table',
      header: null,
      rows: [
        [[{ text: 'α' }], [{ text: 'β' }]],
        [[{ text: 'γ' }], [{ text: 'δ' }]],
      ],
    });
  });

  it('lifts a standalone document link into an attachment block', () => {
    const html = '<p><a href="/wp-content/uploads/2026/01/Exams.docx">Πρόγραμμα Εξετάσεων</a></p>';
    expect(convert(html)).toEqual([
      {
        type: 'attachment',
        name: 'Πρόγραμμα Εξετάσεων',
        href: 'https://cs.uowm.gr/wp-content/uploads/2026/01/Exams.docx',
        format: 'docx',
      },
    ]);
  });

  it('keeps a document link that sits among other words inline', () => {
    const html = '<p>Δείτε το <a href="/files/a.pdf">αρχείο</a> προσεκτικά.</p>';
    const blocks = convert(html);
    expect(blocks[0]?.type).toBe('paragraph');
    expect(blocks[0]).toMatchObject({
      content: [
        { text: 'Δείτε το ' },
        { text: 'αρχείο', href: 'https://cs.uowm.gr/files/a.pdf' },
        { text: ' προσεκτικά.' },
      ],
    });
  });

  it('turns an image into an image block & resolves its source', () => {
    const blocks = convert('<p><img src="/img/poster.jpg" alt="Αφίσα"></p>');
    expect(blocks).toEqual([
      { type: 'image', src: 'https://cs.uowm.gr/img/poster.jpg', alt: 'Αφίσα' },
    ]);
  });

  it('reads an image & its caption out of a figure', () => {
    const html = '<figure><img src="/i/1.png"><figcaption>Ο χάρτης</figcaption></figure>';
    expect(convert(html)).toEqual([
      { type: 'image', src: 'https://cs.uowm.gr/i/1.png', alt: 'Ο χάρτης' },
    ]);
  });

  it('keeps inline image alt text but drops the image inside a paragraph', () => {
    const blocks = convert('<p>Νέο <img src="/e.png" alt="😀"> έτος</p>');
    expect(blocks[0]).toEqual({ type: 'paragraph', content: [{ text: 'Νέο 😀 έτος' }] });
  });

  it('turns a line break into a newline within one paragraph', () => {
    const blocks = convert('<p>Γραμμή ένα<br>Γραμμή δύο</p>');
    expect(blocks[0]).toEqual({ type: 'paragraph', content: [{ text: 'Γραμμή ένα\nΓραμμή δύο' }] });
  });

  it('reads a blockquote', () => {
    expect(convert('<blockquote><p>Μια ρήση.</p></blockquote>')).toEqual([
      { type: 'quote', content: [{ text: 'Μια ρήση.' }] },
    ]);
  });

  it('reads a horizontal rule as a divider', () => {
    expect(convert('<p>πριν</p><hr><p>μετά</p>')).toEqual([
      { type: 'paragraph', content: [{ text: 'πριν' }] },
      { type: 'divider' },
      { type: 'paragraph', content: [{ text: 'μετά' }] },
    ]);
  });

  it('drops empty paragraphs, stray whitespace, scripts & styles', () => {
    const html =
      '<p>&nbsp;</p><style>.x{}</style><script>alert(1)</script><p>   </p>' +
      '<p>Περιεχόμενο</p><p></p>';
    expect(convert(html)).toEqual([{ type: 'paragraph', content: [{ text: 'Περιεχόμενο' }] }]);
  });

  it('removes leading, trailing & doubled dividers', () => {
    const blocks = convert('<hr><p>α</p><hr><hr><p>β</p><hr>');
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'divider', 'paragraph']);
  });

  it('walks through layout containers as if they were not there', () => {
    const blocks = convert('<div class="wrap"><section><p>Βαθιά μέσα</p></section></div>');
    expect(blocks).toEqual([{ type: 'paragraph', content: [{ text: 'Βαθιά μέσα' }] }]);
  });

  it('collapses runs of whitespace but keeps single spaces between words', () => {
    const blocks = convert('<p>Πολλά      κενά\n\t  εδώ</p>');
    expect(blocks[0]).toEqual({ type: 'paragraph', content: [{ text: 'Πολλά κενά εδώ' }] });
  });
});

describe('attachmentFormat', () => {
  it('recognises the document types & ignores the rest', () => {
    expect(attachmentFormat('/a/b.pdf')).toBe('pdf');
    expect(attachmentFormat('/a/b.DOCX?v=2')).toBe('docx');
    expect(attachmentFormat('/a/b.xlsx#sheet')).toBe('xlsx');
    expect(attachmentFormat('/a/b.odt')).toBe('other');
    expect(attachmentFormat('https://cs.uowm.gr/page/')).toBeNull();
    expect(attachmentFormat('/photo.jpg')).toBeNull();
  });
});
