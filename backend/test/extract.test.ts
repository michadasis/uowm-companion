import { describe, expect, it } from 'vitest';

import {
  parseArchiveEntries,
  parseArchiveLinks,
  parsePostPage,
  toIsoDate,
} from '../src/content/extract.js';

describe('toIsoDate', () => {
  it('keeps an ISO timestamp', () => {
    expect(toIsoDate('2026-11-14T09:30:00+00:00')).toBe('2026-11-14T09:30:00.000Z');
  });

  it('reads the English form WordPress archives print', () => {
    expect(toIsoDate('14 October 2026')).toBe('2026-10-14T00:00:00.000Z');
  });

  it('reads the Greek genitive month form', () => {
    expect(toIsoDate('14 Νοεμβρίου 2026')).toBe('2026-11-14T00:00:00.000Z');
    expect(toIsoDate('1 Μαΐου 2026')).toBe('2026-05-01T00:00:00.000Z');
    expect(toIsoDate('3 Μαρτίου 2025')).toBe('2025-03-03T00:00:00.000Z');
    expect(toIsoDate('Δημοσιεύτηκε 28 Σεπτεμβρίου 2024')).toBe('2024-09-28T00:00:00.000Z');
  });

  it('reads DD/MM/YYYY', () => {
    expect(toIsoDate('07/01/2026')).toBe('2026-01-07T00:00:00.000Z');
  });

  it('returns null for text with no date in it', () => {
    expect(toIsoDate('')).toBeNull();
    expect(toIsoDate('καμία ημερομηνία')).toBeNull();
  });
});

describe('parseArchiveLinks', () => {
  const base = 'https://rdcbs.uowm.gr/category/anakoinoseis/';
  const html = `
    <article class="post-list-item">
      <h3><a href="https://rdcbs.uowm.gr/anakoinoseis/orkomosia-2026/">Ορκωμοσία</a></h3>
      <a href="https://rdcbs.uowm.gr/anakoinoseis/orkomosia-2026/" class="btn">Read more</a>
      <a href="https://rdcbs.uowm.gr/category/anakoinoseis/">Ανακοινώσεις</a>
    </article>
    <article class="post-list-item">
      <h3><a href="/anakoinoseis/diloseis-mathimaton/">Δηλώσεις</a></h3>
    </article>
    <a href="https://rdcbs.uowm.gr/epikoinonia/">Επικοινωνία</a>
    <a href="https://other.gr/anakoinoseis/x/">Άλλο</a>`;

  it('returns each post link once, in page order', () => {
    expect(parseArchiveLinks(html, base, '/anakoinoseis/')).toEqual([
      'https://rdcbs.uowm.gr/anakoinoseis/orkomosia-2026/',
      'https://rdcbs.uowm.gr/anakoinoseis/diloseis-mathimaton/',
    ]);
  });

  it('leaves out the category root, other sections & other hosts', () => {
    const links = parseArchiveLinks(html, base, '/anakoinoseis/');
    expect(links).not.toContain('https://rdcbs.uowm.gr/category/anakoinoseis/');
    expect(links.some((l) => l.includes('epikoinonia'))).toBe(false);
    expect(links.some((l) => l.includes('other.gr'))).toBe(false);
  });
});

describe('parsePostPage', () => {
  it('reads the title, date & body from a post page', () => {
    const html = `<!doctype html><html><head>
      <meta property="og:title" content="Ορκωμοσία αποφοίτων">
      <meta property="article:published_time" content="2026-10-14T08:00:00+00:00">
      <meta property="og:description" content="Η τελετή θα γίνει την Τετάρτη.">
      </head><body>
      <article><div class="entry-content">
        <p>Σας ενημερώνουμε για την <strong>ορκωμοσία</strong>.</p>
        <p><a href="/files/programma.pdf">Πρόγραμμα</a></p>
      </div></article>
      </body></html>`;
    const page = parsePostPage(html);
    expect(page.title).toBe('Ορκωμοσία αποφοίτων');
    expect(page.date).toBe('2026-10-14T08:00:00.000Z');
    expect(page.excerpt).toBe('Η τελετή θα γίνει την Τετάρτη.');
    expect(page.bodyHtml).toContain('ορκωμοσία');
  });

  it('falls back to a visible Greek date when there is no meta tag', () => {
    const html = `<html><body><article>
      <h1 class="entry-title">Μια ανακοίνωση</h1>
      <div class="post-date"><span>14 Νοεμβρίου 2026</span></div>
      <div class="entry-content"><p>Κείμενο.</p></div>
      </article></body></html>`;
    const page = parsePostPage(html);
    expect(page.title).toBe('Μια ανακοίνωση');
    expect(page.date).toBe('2026-11-14T00:00:00.000Z');
  });
});

describe('parseArchiveEntries', () => {
  it('reads the date a listing prints beside each post, even after a sidebar link to it', () => {
    const html =
      '<aside><a href="/nea/second/">Δεύτερο</a></aside>' +
      '<div class="post-list-item"><h4><a href="/nea/first/">Πρώτο</a></h4>' +
      '<div class="post-date"><span>16 Νοεμβρίου 2026</span></div>' +
      '<a href="/category/nea/">Ανακοινώσεις</a></div>' +
      '<div class="post-list-item"><h4><a href="/nea/second/">Δεύτερο</a></h4>' +
      '<div class="post-date"><span>13 Νοεμβρίου 2026</span></div></div>' +
      '<nav><a href="/nea/about/">Σχετικά</a></nav>';

    expect(parseArchiveEntries(html, 'https://mst.uowm.gr/list/', '/nea/')).toEqual([
      { url: 'https://mst.uowm.gr/nea/second/', date: '2026-11-13T00:00:00.000Z' },
      { url: 'https://mst.uowm.gr/nea/first/', date: '2026-11-16T00:00:00.000Z' },
      { url: 'https://mst.uowm.gr/nea/about/', date: null },
    ]);
  });
});
