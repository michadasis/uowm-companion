import { describe, expect, it, vi } from 'vitest';

import { discoverDocument, discoverDocuments } from '../src/documents/discover.js';
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
          post('2026-10-26T10:00:00', 'Κατατακτήριες εξετάσεις 2026', '<a href="/k.pdf">k</a>'),
          post('2026-09-01T10:00:00', 'Αστικά δρομολόγια εξεταστικής', '<a href="/d.pdf">d</a>'),
          post('2026-07-16T10:00:00', 'ΠΡΟΓΡΑΜΜΑ ΕΞΕΤΑΣΤΙΚΗΣ ΣΕΠΤΕΜΒΡΙΟΥ 2026', '<a href="/e.pdf">e</a>'),
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
        JSON.stringify([post('2024-07-30T10:00:00', 'ΠΡΟΓΡΑΜΜΑ ΕΞΕΤΑΣΕΩΝ ΣΕΠΤΕΜΒΡΙΟΥ 2024', '<a href="/old.pdf">o</a>')]),
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
    const source: ScheduleSource = { adapter: 'document-page', pageUrl: examsPage, pick: 'first-link' };

    const found = await discoverDocuments(source, 'exams', fetchText, now);
    expect(found?.documents).toHaveLength(1);
  });
});
