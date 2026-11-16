import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Department } from '../src/registry/index.js';

const render = vi.fn<(...args: unknown[]) => Promise<{ blocks: unknown[] }>>();

vi.mock('../src/documents/discover.js', () => ({
  discoverDocuments: vi.fn(() =>
    Promise.resolve({
      label: 'Doc',
      documents: [{ url: 'https://x/doc.pdf', label: 'Doc', format: 'pdf' }],
    }),
  ),
}));
vi.mock('../src/documents/pipeline.js', () => {
  class NotADocumentError extends Error {}
  return { NotADocumentError, renderDocument: (...args: unknown[]) => render(...args) };
});
vi.mock('../src/http/fetch.js', () => ({ fetchText: vi.fn(), fetchBuffer: vi.fn() }));

const { fetchSchedule } = await import('../src/schedules/fetch.js');
const { NotADocumentError } = await import('../src/documents/pipeline.js');

const dept = { id: 'mech', sources: { timetable: { kind: 'document-page' } } } as unknown as Department;

beforeEach(() => {
  render.mockReset();
});

describe('fetchSchedule resilience', () => {
  it('stays available with the document link when rendering throws', async () => {
    render.mockRejectedValue(new Error('unreadable pdf'));

    const result = await fetchSchedule(dept, 'timetable');

    expect(result).toMatchObject({
      dept: 'mech',
      kind: 'timetable',
      available: true,
      document: { url: 'https://x/doc.pdf', format: 'pdf' },
      classes: [],
      exams: [],
      original: [],
    });
  });

  it('drops a link that serves no document at all, as if none were listed', async () => {
    render.mockRejectedValue(new NotADocumentError('https://x/doc.pdf'));

    const result = await fetchSchedule(dept, 'timetable');

    expect(result).toMatchObject({ available: true, document: null, original: [] });
  });
});
