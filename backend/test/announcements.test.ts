import { describe, expect, it } from 'vitest';

import { parseHtmlListingPost } from '../src/announcements/htmlListing.js';
import { parseWordPressPosts, wordpressPostsUrl } from '../src/announcements/wordpress.js';
import type { WpPost } from '../src/announcements/wordpress.js';

const wpPost = (over: Partial<WpPost> = {}): WpPost => ({
  id: 101,
  date_gmt: '2026-11-09T13:40:10',
  link: 'https://cs.uowm.gr/anakoinosi-vathmologion/',
  title: { rendered: 'Ανακοίνωση βαθμολογιών &#8211; Σεπτέμβριος' },
  excerpt: { rendered: '<p>Οι βαθμολογίες αναρτήθηκαν.</p>' },
  content: {
    rendered:
      '<p>Οι βαθμολογίες <strong>αναρτήθηκαν</strong>.</p>' +
      '<p><a href="/wp-content/uploads/2026/09/vathmoi.pdf">Αναλυτικά</a></p>' +
      '<figure><img src="/img/table.png" alt="Πίνακας"></figure>',
  },
  ...over,
});

describe('parseWordPressPosts', () => {
  it('normalises a post into an announcement', () => {
    const [announcement] = parseWordPressPosts([wpPost()], 'cs');

    expect(announcement).toMatchObject({
      id: 'cs:101',
      title: 'Ανακοίνωση βαθμολογιών – Σεπτέμβριος',
      date: '2026-11-09T13:40:10.000Z',
      excerpt: 'Οι βαθμολογίες αναρτήθηκαν.',
      sourceUrl: 'https://cs.uowm.gr/anakoinosi-vathmologion/',
    });
  });

  it('reads the entities out of the title & the tags out of the excerpt', () => {
    const [announcement] = parseWordPressPosts([wpPost()], 'cs');
    expect(announcement?.title).not.toContain('&#');
    expect(announcement?.excerpt).not.toContain('<p>');
  });

  it('turns the body into blocks & pulls out images & attachments', () => {
    const [announcement] = parseWordPressPosts([wpPost()], 'cs');

    expect(announcement?.body[0]).toEqual({
      type: 'paragraph',
      content: [{ text: 'Οι βαθμολογίες ' }, { text: 'αναρτήθηκαν', bold: true }, { text: '.' }],
    });
    expect(announcement?.images).toEqual(['https://cs.uowm.gr/img/table.png']);
    expect(announcement?.attachments).toEqual([
      {
        name: 'Αναλυτικά',
        href: 'https://cs.uowm.gr/wp-content/uploads/2026/09/vathmoi.pdf',
        format: 'pdf',
      },
    ]);
  });

  it('reads the post date as UTC, not as local time', () => {
    const [announcement] = parseWordPressPosts([wpPost({ date_gmt: '2026-01-01T23:30:00' })], 'cs');
    expect(announcement?.date).toBe('2026-01-01T23:30:00.000Z');
  });

  it('builds the WordPress query with the fields it needs', () => {
    const url = new URL(wordpressPostsUrl('https://cs.uowm.gr/wp-json/', [39, 40], 20));
    expect(url.pathname).toBe('/wp-json/wp/v2/posts');
    expect(url.searchParams.get('categories')).toBe('39,40');
    expect(url.searchParams.get('per_page')).toBe('20');
    expect(url.searchParams.get('_fields')).toContain('date_gmt');
  });
});

describe('parseHtmlListingPost', () => {
  const url = 'https://mst.uowm.gr/nea/anavoli-mathimatos/';
  const page = `<!doctype html><html><head>
    <meta property="og:title" content="Αναβολή μαθήματος">
    <meta property="article:published_time" content="2026-11-12T10:00:00+00:00">
    </head><body><article><div class="entry-content">
      <p>Το μάθημα αναβάλλεται.</p>
    </div></article></body></html>`;

  it('builds an announcement from a scraped post page', () => {
    expect(parseHtmlListingPost(page, url, 'mst')).toMatchObject({
      id: 'mst:anavoli-mathimatos',
      title: 'Αναβολή μαθήματος',
      date: '2026-11-12T10:00:00.000Z',
      excerpt: 'Το μάθημα αναβάλλεται.',
      sourceUrl: url,
    });
  });

  it('skips a page with no title or body rather than show it blank', () => {
    expect(parseHtmlListingPost('<html><body><p>x</p></body></html>', url, 'mst')).toBeNull();
  });

  it('keeps a post that has a title & body but no date', () => {
    const noDate = page.replace(/<meta property="article:published_time"[^>]*>/, '');
    expect(parseHtmlListingPost(noDate, url, 'mst')).toMatchObject({
      title: 'Αναβολή μαθήματος',
      date: null,
      excerpt: 'Το μάθημα αναβάλλεται.',
    });
  });
});
