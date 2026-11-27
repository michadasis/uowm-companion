import { describe, expect, it } from 'vitest';

import { parseHtmlListingPost } from '../src/announcements/htmlListing.js';
import { parseRssFeed } from '../src/announcements/rss.js';
import {
  attachmentBlocks,
  parseWordPressPosts,
  withAttachments,
  wordpressMediaUrl,
  wordpressPostsUrl,
} from '../src/announcements/wordpress.js';
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

describe('attachmentBlocks', () => {
  it('turns the documents uploaded to a post into attachments, skipping images', () => {
    expect(
      attachmentBlocks([
        {
          source_url:
            'https://eled.uowm.gr/u/4%CE%B7-%CE%A0%CE%A1%CE%9F%CE%9A%CE%97%CE%A1%CE%A5%CE%9E%CE%97.pdf',
        },
        {
          source_url: 'https://eled.uowm.gr/u/form.doc',
          title: { rendered: 'Αίτηση &#8211; έντυπο' },
        },
        { source_url: 'https://eled.uowm.gr/u/photo.jpg' },
      ]),
    ).toEqual([
      {
        type: 'attachment',
        name: '4η ΠΡΟΚΗΡΥΞΗ',
        href: 'https://eled.uowm.gr/u/4%CE%B7-%CE%A0%CE%A1%CE%9F%CE%9A%CE%97%CE%A1%CE%A5%CE%9E%CE%97.pdf',
        format: 'pdf',
      },
      {
        type: 'attachment',
        name: 'Αίτηση – έντυπο',
        href: 'https://eled.uowm.gr/u/form.doc',
        format: 'doc',
      },
    ]);
  });

  it('fills only a post that has no text of its own', () => {
    const [post] = parseWordPressPosts([{ ...wpPost(), content: { rendered: '' } }], 'eled');
    const files = attachmentBlocks([{ source_url: 'https://x/a.pdf' }]);

    const filled = withAttachments(post!, files);
    expect(filled.body).toEqual(files);
    expect(filled.attachments).toHaveLength(1);

    const [withText] = parseWordPressPosts([wpPost()], 'eled');
    expect(withAttachments(withText!, files)).toBe(withText);
  });

  it('asks WordPress for the files by the post id', () => {
    expect(wordpressMediaUrl('https://eled.uowm.gr/wp-json/', 42)).toBe(
      'https://eled.uowm.gr/wp-json/wp/v2/media?parent=42&_fields=source_url%2Ctitle',
    );
  });
});

describe('parseRssFeed', () => {
  const item = (inner: string) => `<item>${inner}</item>`;
  const feed = (...items: string[]) =>
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Ανακοινώσεις</title>${items.join('')}</channel></rss>`;

  it('normalises an item into an announcement', () => {
    const [announcement] = parseRssFeed(
      feed(
        item(
          '<title>Ημερίδα: “Πιθανότητες &amp; Εφαρμογές”</title>' +
            '<link>https://cs.uowm.gr/el/news/a/s759069bef372/</link>' +
            '<guid isPermaLink="true">https://cs.uowm.gr/el/news/a/s759069bef372/</guid>' +
            '<pubDate>Thu, 26 Nov 2026 22:25:31 +0200</pubDate>' +
            '<category>Εκδηλώσεις</category>' +
            '<description>&lt;p&gt;Την Παρασκευή στην &lt;strong&gt;Αίθουσα Β2&lt;/strong&gt;.&lt;/p&gt;' +
            '&lt;p&gt;&lt;a href="https://cs.uowm.gr/uploads/announcements/2026/s75-1.pdf"&gt;Αφίσα&lt;/a&gt;&lt;/p&gt;</description>',
        ),
      ),
      'cs',
    );

    expect(announcement).toMatchObject({
      id: 'cs:s759069bef372',
      title: 'Ημερίδα: “Πιθανότητες & Εφαρμογές”',
      date: '2026-11-26T20:25:31.000Z',
      excerpt: 'Την Παρασκευή στην Αίθουσα Β2.',
      sourceUrl: 'https://cs.uowm.gr/el/news/a/s759069bef372/',
    });
    expect(announcement?.attachments).toEqual([
      expect.objectContaining({
        href: 'https://cs.uowm.gr/uploads/announcements/2026/s75-1.pdf',
        format: 'pdf',
      }),
    ]);
  });

  it('reads a description given as CDATA', () => {
    const [announcement] = parseRssFeed(
      feed(
        item(
          '<title>Α</title><link>https://cs.uowm.gr/el/news/a/x1/</link>' +
            '<description><![CDATA[<p>Σώμα.</p>]]></description>',
        ),
      ),
      'cs',
    );
    expect(announcement?.excerpt).toBe('Σώμα.');
  });

  it('adds an enclosure the body does not already link, once', () => {
    const pdf = 'https://cs.uowm.gr/newsletters/newsletter-04.pdf';
    const [onlyEnclosed, alsoLinked] = parseRssFeed(
      feed(
        item(
          '<title>Newsletter</title><link>https://cs.uowm.gr/el/news/a/n1/</link>' +
            `<enclosure url="${pdf}" length="1" type="application/pdf"/>`,
        ),
        item(
          '<title>Newsletter</title><link>https://cs.uowm.gr/el/news/a/n2/</link>' +
            `<description>&lt;p&gt;&lt;a href="${pdf}"&gt;Το τεύχος&lt;/a&gt;&lt;/p&gt;</description>` +
            `<enclosure url="${pdf}" length="1" type="application/pdf"/>`,
        ),
      ),
      'cs',
    );

    expect(onlyEnclosed?.body).toEqual([
      { type: 'attachment', name: 'newsletter 04', href: pdf, format: 'pdf' },
    ]);
    expect(alsoLinked?.attachments).toHaveLength(1);
  });

  it('leaves out an item without a title or a link & keeps an undated one undated', () => {
    const announcements = parseRssFeed(
      feed(
        item('<link>https://cs.uowm.gr/el/news/a/no-title/</link>'),
        item('<title>Χωρίς σύνδεσμο</title>'),
        item(
          '<title>Χωρίς ημερομηνία</title><link>https://cs.uowm.gr/el/news/a/d1/</link>' +
            '<pubDate>ποτέ</pubDate><description>&lt;p&gt;Κάτι.&lt;/p&gt;</description>',
        ),
      ),
      'cs',
    );
    expect(announcements.map((a) => [a.id, a.date])).toEqual([['cs:d1', null]]);
  });
});
