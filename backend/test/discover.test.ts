import { describe, expect, it, vi } from 'vitest';

import { discoverDocument } from '../src/documents/discover.js';
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

  it('returns null for a source the pipeline does not read yet', async () => {
    const fetchText = pages({});
    const sheet: ScheduleSource = { adapter: 'embedded-sheet', pageUrl: 'https://cdm.uowm.gr/p/' };

    expect(await discoverDocument(sheet, fetchText)).toBeNull();
    expect(fetchText).not.toHaveBeenCalled();
  });
});
