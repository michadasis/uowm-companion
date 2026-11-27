import { describe, expect, it, vi } from 'vitest';

import {
  academicYearIn,
  discoverDocument,
  discoverDocuments,
  sittingEndsIn,
} from '../src/documents/discover.js';
import type { ScheduleSource } from '../src/registry/index.js';

function pages(map: Record<string, string>) {
  return vi.fn((url: string) => {
    const body = map[url];
    if (body === undefined) return Promise.reject(new Error(`no page: ${url}`));
    return Promise.resolve(body);
  });
}

const examsPage = 'https://cs.uowm.gr/exams/';

describe('discoverDocument', () => {
  it('takes the first document on a document page', async () => {
    const fetchText = pages({
      [examsPage]:
        '<div class="entry-content">' +
        '<a href="/uploads/2026/08/current.docx">Τρέχον</a>' +
        '<a href="/uploads/2026/01/old.docx">Παλαιότερο</a>' +
        '</div>',
    });
    const source: ScheduleSource = {
      adapter: 'document-page',
      pageUrl: examsPage,
      pick: 'first-link',
    };

    const doc = await discoverDocument(source, fetchText);

    expect(doc).toEqual({
      url: 'https://cs.uowm.gr/uploads/2026/08/current.docx',
      format: 'docx',
      label: 'Τρέχον',
    });
  });

  it('takes the newest upload when that is how the page is kept', async () => {
    const fetchText = pages({
      [examsPage]:
        '<article>' +
        '<a href="/wp-content/uploads/2026/03/a.pdf">Α</a>' +
        '<a href="/wp-content/uploads/2026/10/b.pdf">Β</a>' +
        '<a href="/wp-content/uploads/2025/11/c.pdf">Γ</a>' +
        '</article>',
    });
    const source: ScheduleSource = {
      adapter: 'document-page',
      pageUrl: examsPage,
      pick: 'newest-upload',
    };

    const doc = await discoverDocument(source, fetchText);

    expect(doc?.url).toBe('https://cs.uowm.gr/wp-content/uploads/2026/10/b.pdf');
  });

  it('ignores links that are not documents', async () => {
    const fetchText = pages({
      [examsPage]:
        '<article><a href="/page/">Σελίδα</a><a href="/photo.jpg">Φωτό</a>' +
        '<a href="/real.pdf">Έγγραφο</a></article>',
    });
    const source: ScheduleSource = {
      adapter: 'document-page',
      pageUrl: examsPage,
      pick: 'first-link',
    };

    expect((await discoverDocument(source, fetchText))?.url).toBe('https://cs.uowm.gr/real.pdf');
  });

  it('follows a menu link straight to a document, matching by the start of the label', async () => {
    const home = 'https://econ.uowm.gr/';
    const fetchText = pages({
      [home]:
        '<a href="/about/">Σχετικά</a>' +
        '<a href="/uploads/2026/09/wrp.pdf">Ωρολόγιο Πρόγραμμα χειμερινού 2026</a>',
    });
    const source: ScheduleSource = {
      adapter: 'menu-link',
      pageUrl: home,
      label: 'Ωρολόγιο Πρόγραμμα',
    };

    const doc = await discoverDocument(source, fetchText);

    expect(doc).toMatchObject({
      url: 'https://econ.uowm.gr/uploads/2026/09/wrp.pdf',
      format: 'pdf',
    });
  });

  it('follows a menu link to a page & then to the first document on it', async () => {
    const home = 'https://ot.uowm.gr/';
    const schedulePage = 'https://ot.uowm.gr/programma/';
    const fetchText = pages({
      [home]: '<a href="/programma/">Πρόγραμμα εξεταστικής</a>',
      [schedulePage]: '<article><a href="/uploads/2026/07/exams.pdf">Σεπτέμβριος</a></article>',
    });
    const source: ScheduleSource = {
      adapter: 'menu-link',
      pageUrl: home,
      label: 'Πρόγραμμα εξεταστικής',
    };

    expect((await discoverDocument(source, fetchText))?.url).toBe(
      'https://ot.uowm.gr/uploads/2026/07/exams.pdf',
    );
  });

  it('finds a document entry by its label when a note follows it, as on the Informatics site', async () => {
    const studies = 'https://cs.uowm.gr/el/studies/';
    const entry = (href: string, label: string, note: string) =>
      `<li><a class="doc-item" href="${href}"><span class="doc-item-text">` +
      `<span class="doc-item-label">${label}</span><span class="doc-item-note">${note}</span>` +
      '</span><span class="tag">DOCX</span></a></li>';
    const fetchText = pages({
      [studies]:
        '<ul>' +
        entry(
          '/docs/cs/2026/timetable-che.docx',
          'Ωρολόγιο πρόγραμμα μαθημάτων',
          'Χειμερινό 2026-2027',
        ) +
        entry(
          '/docs/cs/2026/exams-cs-sep.docx',
          'Πρόγραμμα εξεταστικής',
          'Επαναληπτική Σεπτεμβρίου',
        ) +
        '</ul>',
    });
    const source = (label: string): ScheduleSource => ({
      adapter: 'menu-link',
      pageUrl: studies,
      label,
    });

    expect((await discoverDocument(source('Πρόγραμμα εξεταστικής'), fetchText))?.url).toBe(
      'https://cs.uowm.gr/docs/cs/2026/exams-cs-sep.docx',
    );
    expect((await discoverDocument(source('Ωρολόγιο πρόγραμμα'), fetchText))?.url).toBe(
      'https://cs.uowm.gr/docs/cs/2026/timetable-che.docx',
    );
  });

  it('returns null when a page has no document', async () => {
    const fetchText = pages({ [examsPage]: '<article><a href="/page/">Σελίδα</a></article>' });
    const source: ScheduleSource = {
      adapter: 'document-page',
      pageUrl: examsPage,
      pick: 'first-link',
    };

    expect(await discoverDocument(source, fetchText)).toBeNull();
  });
});

describe('discoverDocuments', () => {
  const now = new Date('2026-11-16T12:00:00Z');
  const api = 'https://ece.uowm.gr/wp-json/';
  const post = (date: string, title: string, content: string) => ({
    date,
    title: { rendered: title },
    content: { rendered: content },
    link: 'https://ece.uowm.gr/post/',
  });

  it('takes the newest post whose title names the schedule, with all its documents', async () => {
    const fetchText = vi.fn<(url: string) => Promise<string>>(() =>
      Promise.resolve(
        JSON.stringify([
          post('2026-10-20T10:00:00', 'Αλλαγή αιθουσών εξετάσεων', '<a href="/x.pdf">x</a>'),
          post(
            '2026-10-10T10:00:00',
            'Ωρολόγιο πρόγραμμα χειμερινού εξαμήνου 2026&#8211;27',
            '<a href="/uploads/A.pdf">Α εξάμηνο</a><a href="/uploads/G.pdf">Γ εξάμηνο</a><a href="/uploads/A.pdf">ξανά</a>',
          ),
        ]),
      ),
    );
    const source: ScheduleSource = { adapter: 'wordpress-posts', apiRoot: api, category: 89 };

    const found = await discoverDocuments(source, 'timetable', fetchText, now);

    expect(found?.label).toBe('Ωρολόγιο πρόγραμμα χειμερινού εξαμήνου 2026–27');
    expect(found?.documents.map((d) => d.url)).toEqual([
      'https://ece.uowm.gr/uploads/A.pdf',
      'https://ece.uowm.gr/uploads/G.pdf',
    ]);
    expect(String(fetchText.mock.calls[0]![0])).toContain('categories=89');
  });

  it('skips notices that only mention an exam', async () => {
    const fetchText = vi.fn(() =>
      Promise.resolve(
        JSON.stringify([
          post('2026-11-14T10:00:00', 'Κατατακτήριες εξετάσεις 2026', '<a href="/k.pdf">k</a>'),
          post('2026-11-12T10:00:00', 'Αστικά δρομολόγια εξεταστικής', '<a href="/d.pdf">d</a>'),
          post(
            '2026-11-10T10:00:00',
            'ΠΡΟΓΡΑΜΜΑ ΕΞΕΤΑΣΤΙΚΗΣ ΙΑΝΟΥΑΡΙΟΥ-ΦΕΒΡΟΥΑΡΙΟΥ 2027',
            '<a href="/e.pdf">e</a>',
          ),
        ]),
      ),
    );
    const source: ScheduleSource = { adapter: 'wordpress-posts', apiRoot: api, search: 'εξετ' };

    const found = await discoverDocuments(source, 'exams', fetchText, now);
    expect(found?.documents[0]?.url).toBe('https://ece.uowm.gr/e.pdf');
  });

  it('gives no schedule when the newest one is from a term long over', async () => {
    const fetchText = vi.fn(() =>
      Promise.resolve(
        JSON.stringify([
          post(
            '2024-07-30T10:00:00',
            'ΠΡΟΓΡΑΜΜΑ ΕΞΕΤΑΣΕΩΝ ΣΕΠΤΕΜΒΡΙΟΥ 2024',
            '<a href="/old.pdf">o</a>',
          ),
        ]),
      ),
    );
    const source: ScheduleSource = { adapter: 'wordpress-posts', apiRoot: api, category: 131 };

    expect(await discoverDocuments(source, 'exams', fetchText, now)).toBeNull();
  });

  it('reads the Google Sheets a page embeds as workbook downloads', async () => {
    const page = 'https://cdm.uowm.gr/programma/';
    const fetchText = pages({
      [page]:
        '<h1>Πρόγραμμα Εξεταστικής</h1>' +
        '<iframe src="https://docs.google.com/spreadsheets/d/AAA111/edit?gid=1"></iframe>' +
        '<a href="https://docs.google.com/spreadsheets/d/AAA111/edit?usp=sharing">ίδιο</a>' +
        '<iframe src="https://docs.google.com/spreadsheets/d/BBB222/edit"></iframe>',
    });
    const source: ScheduleSource = { adapter: 'embedded-sheet', pageUrl: page };

    const found = await discoverDocuments(source, 'exams', fetchText, now);

    expect(found).toEqual({
      label: 'Πρόγραμμα Εξεταστικής',
      documents: [
        {
          url: 'https://docs.google.com/spreadsheets/d/AAA111/export?format=xlsx',
          format: 'xlsx',
          label: 'Πρόγραμμα Εξεταστικής',
        },
        {
          url: 'https://docs.google.com/spreadsheets/d/BBB222/export?format=xlsx',
          format: 'xlsx',
          label: 'Πρόγραμμα Εξεταστικής',
        },
      ],
    });
  });

  it('wraps a single-document source', async () => {
    const fetchText = pages({ [examsPage]: '<article><a href="/a.docx">Α</a></article>' });
    const source: ScheduleSource = {
      adapter: 'document-page',
      pageUrl: examsPage,
      pick: 'first-link',
    };

    const found = await discoverDocuments(source, 'exams', fetchText, now);
    expect(found?.documents).toHaveLength(1);
  });
});

describe('telling a past term from the current one', () => {
  it('reads the academic year a title or file name gives, in any of its spellings', () => {
    expect(academicYearIn('ΩΡΟΛΟΓΙΟ ΠΡΟΓΡΑΜΜΑ 2026-2027')).toBe(2026);
    expect(academicYearIn('AF-Πρόγραμμα-μαθημάτων-Χειμ-2026-27.pdf')).toBe(2026);
    expect(academicYearIn('MECH_schedule_winter_26-27_v2-2.pdf')).toBe(2026);
    expect(academicYearIn('Πρόγραμμα εαρινό 2025 – 2026')).toBe(2025);
    expect(academicYearIn('2026-10-08-AF-Πρόγραμμα')).toBeUndefined();
    expect(academicYearIn('ώρες 09-10')).toBeUndefined();
  });

  it('reads when a sitting a title names is over', () => {
    expect(sittingEndsIn('ΠΡΟΓΡΑΜΜΑ ΕΞΕΤΑΣΤΙΚΗΣ ΣΕΠΤΕΜΒΡΙΟΥ 2026')?.toISOString()).toBe(
      '2026-10-01T00:00:00.000Z',
    );
    expect(sittingEndsIn('Εξεταστική Ιανουαρίου-Φεβρουαρίου 2027')?.toISOString()).toBe(
      '2027-03-01T00:00:00.000Z',
    );
    expect(sittingEndsIn('Πρόγραμμα Εξεταστικής')).toBeUndefined();
  });

  const now = new Date('2026-11-16T12:00:00Z');

  it("drops a page's timetable for a past year, though its folder is years old either way", async () => {
    const page = (file: string) =>
      pages({
        'https://mech.uowm.gr/': `<a href="https://mech.uowm.gr/wp-content/uploads/2019/10/${file}">Ωρολόγιο Πρόγραμμα</a>`,
      });
    const source: ScheduleSource = {
      adapter: 'menu-link',
      pageUrl: 'https://mech.uowm.gr/',
      label: 'Ωρολόγιο Πρόγραμμα',
    };
    expect(
      await discoverDocuments(source, 'timetable', page('MECH_schedule_winter_26-27.pdf'), now),
    ).not.toBeNull();
    expect(
      await discoverDocuments(source, 'timetable', page('MECH_schedule_spring_25-26.pdf'), now),
    ).toBeNull();
  });

  it("drops a winter term's timetable once spring has begun", async () => {
    const page = pages({
      'https://mech.uowm.gr/': `<a href="https://mech.uowm.gr/wp-content/uploads/2019/10/MECH_schedule_winter_26-27.pdf">Ωρολόγιο Πρόγραμμα</a>`,
    });
    const source: ScheduleSource = {
      adapter: 'menu-link',
      pageUrl: 'https://mech.uowm.gr/',
      label: 'Ωρολόγιο Πρόγραμμα',
    };
    expect(
      await discoverDocuments(source, 'timetable', page, new Date('2027-02-10T12:00:00Z')),
    ).not.toBeNull();
    expect(
      await discoverDocuments(source, 'timetable', page, new Date('2027-03-10T12:00:00Z')),
    ).toBeNull();
  });

  it('drops an exam schedule for a sitting over by more than a week', async () => {
    const posted = (title: string) =>
      vi.fn(() =>
        Promise.resolve(
          JSON.stringify([
            {
              date: '2026-08-20T10:00:00',
              title: { rendered: title },
              content: { rendered: '<a href="/e.pdf">e</a>' },
              link: 'https://ece.uowm.gr/e/',
            },
          ]),
        ),
      );
    const source: ScheduleSource = {
      adapter: 'wordpress-posts',
      apiRoot: 'https://ece.uowm.gr/wp-json/',
    };
    expect(
      await discoverDocuments(
        source,
        'exams',
        posted('Πρόγραμμα εξεταστικής Σεπτεμβρίου 2026'),
        now,
      ),
    ).toBeNull();
    expect(
      await discoverDocuments(
        source,
        'exams',
        posted('Πρόγραμμα εξεταστικής Ιανουαρίου 2027'),
        now,
      ),
    ).not.toBeNull();
  });
});

describe('discoverDocuments from a post listing', () => {
  const listing = 'https://rdcbs.uowm.gr/category/anakoinoseis/';
  const post = 'https://rdcbs.uowm.gr/anakoinoseis/programma-exetastikis-ianouariou/';
  const source: ScheduleSource = { adapter: 'listing-posts', listingUrl: listing };

  it("takes the newest post titled as the schedule & the documents in it, not the page's menu", async () => {
    const fetchText = pages({
      [listing]: `<a href="/anakoinoseis/dilosi/">Δήλωση μαθημάτων</a>
        <a href="${post}">ΠΡΟΓΡΑΜΜΑ ΕΞΕΤΑΣΤΙΚΗΣ ΙΑΝΟΥΑΡΙΟΥ 2027</a>
        <a href="/anakoinoseis/old/">ΠΡΟΓΡΑΜΜΑ ΕΞΕΤΑΣΤΙΚΗΣ ΣΕΠΤΕΜΒΡΙΟΥ 2026</a>`,
      [post]: `<nav><a href="/wp-content/uploads/2020/10/odigos.pdf">Οδηγός</a></nav>
        <div class="post-content"><a href="/wp-content/uploads/2026/12/exams.doc">Πρόγραμμα</a></div>`,
    });

    const found = await discoverDocuments(
      source,
      'exams',
      fetchText,
      new Date('2026-12-20T12:00:00Z'),
    );
    expect(found?.label).toBe('ΠΡΟΓΡΑΜΜΑ ΕΞΕΤΑΣΤΙΚΗΣ ΙΑΝΟΥΑΡΙΟΥ 2027');
    expect(found?.documents).toEqual([
      {
        url: 'https://rdcbs.uowm.gr/wp-content/uploads/2026/12/exams.doc',
        format: 'doc',
        label: 'Πρόγραμμα',
      },
    ]);
  });

  it('gives none when the newest such post is for a sitting long over', async () => {
    const fetchText = pages({
      [listing]: `<a href="${post}">ΠΡΟΓΡΑΜΜΑ ΕΞΕΤΑΣΤΙΚΗΣ ΣΕΠΤΕΜΒΡΙΟΥ 2026</a>`,
    });
    expect(
      await discoverDocuments(source, 'exams', fetchText, new Date('2026-11-20T12:00:00Z')),
    ).toBeNull();
  });
});

describe('discoverDocuments from a listing over several pages', () => {
  const listing = 'https://rdcbs.uowm.gr/category/anakoinoseis/';
  const post = 'https://rdcbs.uowm.gr/anakoinoseis/neo-orologio/';

  it('reads on to later pages for the newest such post', async () => {
    const fetchText = pages({
      [listing]: '<a href="/anakoinoseis/a/">Δηλώσεις μαθημάτων</a>',
      [`${listing}page/2/`]: `<a href="${post}">ΝΕΟ – ΩΡΟΛΟΓΙΟ ΠΡΟΓΡΑΜΜΑ ΜΑΘΗΜΑΤΩΝ</a>`,
      [post]:
        '<div class="post-content"><a href="/wp-content/uploads/2026/10/orologio.docx">Ωρολόγιο</a></div>',
    });
    const found = await discoverDocuments(
      { adapter: 'listing-posts', listingUrl: listing, pages: 3 },
      'timetable',
      fetchText,
      new Date('2026-11-20T12:00:00Z'),
    );
    expect(found?.documents.map((doc) => doc.url)).toEqual([
      'https://rdcbs.uowm.gr/wp-content/uploads/2026/10/orologio.docx',
    ]);
  });

  it("judges a post whose title names no year by its files' names & upload months", async () => {
    const fetchText = pages({
      [listing]: `<a href="${post}">ΝΕΟ – ΩΡΟΛΟΓΙΟ ΠΡΟΓΡΑΜΜΑ ΜΑΘΗΜΑΤΩΝ</a>`,
      [post]:
        '<div class="post-content"><a href="/wp-content/uploads/2025/03/ΩΡΟΛΟΓΙΟ-ΕΑΡΙΝΟΥ-2024-2025.docx">Ωρολόγιο</a></div>',
    });
    const found = await discoverDocuments(
      { adapter: 'listing-posts', listingUrl: listing, pages: 2 },
      'timetable',
      fetchText,
      new Date('2026-11-20T12:00:00Z'),
    );
    expect(found).toBeNull();
  });
});

describe('discoverDocuments from the media library', () => {
  const apiRoot = 'https://eled.uowm.gr/wp-json/';
  const source: ScheduleSource = { adapter: 'wordpress-media', apiRoot, search: 'εξεταστικ' };
  const media = (items: object[]) =>
    pages({
      [`${apiRoot}wp/v2/media?search=%CE%B5%CE%BE%CE%B5%CF%84%CE%B1%CF%83%CF%84%CE%B9%CE%BA&per_page=20&orderby=date&order=desc&_fields=date%2Csource_url%2Ctitle`]:
        JSON.stringify(items),
    });

  it('takes the newest upload named as the schedule, past the bus timetable', async () => {
    const fetchText = media([
      {
        date: '2026-08-31T10:00:00',
        source_url:
          'https://eled.uowm.gr/wp-content/uploads/2026/08/Πρόγραμμα-αστικών-δρομολογίων-Εξεταστικής.pdf',
      },
      {
        date: '2026-07-31T10:00:00',
        source_url:
          'https://eled.uowm.gr/wp-content/uploads/2026/07/Πρόγραμμα-εξεταστικής-του-ΠΤΔΕ_Σεπτέμβριος-2026.pdf',
      },
    ]);
    const found = await discoverDocuments(
      source,
      'exams',
      fetchText,
      new Date('2026-08-20T12:00:00Z'),
    );
    expect(found?.label).toBe('Πρόγραμμα εξεταστικής του ΠΤΔΕ Σεπτέμβριος 2026');
    expect(found?.documents).toHaveLength(1);
  });

  it('gives none once that sitting is over', async () => {
    const fetchText = media([
      {
        date: '2026-07-31T10:00:00',
        source_url:
          'https://eled.uowm.gr/wp-content/uploads/2026/07/Πρόγραμμα-εξεταστικής-του-ΠΤΔΕ_Σεπτέμβριος-2026.pdf',
      },
    ]);
    const found = await discoverDocuments(
      source,
      'exams',
      fetchText,
      new Date('2026-11-20T12:00:00Z'),
    );
    expect(found).toBeNull();
  });
});
