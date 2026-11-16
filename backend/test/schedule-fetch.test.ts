import { describe, expect, it, vi } from 'vitest';

import type { Department } from '../src/registry/index.js';

vi.mock('../src/documents/discover.js', () => ({
  discoverDocuments: vi.fn(() =>
    Promise.resolve({
      label: 'Doc',
      documents: [{ url: 'https://x/doc.pdf', label: 'Doc', format: 'pdf' }],
    }),
  ),
}));
vi.mock('../src/documents/pipeline.js', () => ({
  renderDocument: vi.fn(() => Promise.reject(new Error('unreadable pdf'))),
}));
vi.mock('../src/http/fetch.js', () => ({ fetchText: vi.fn(), fetchBuffer: vi.fn() }));

const { fetchSchedule } = await import('../src/schedules/fetch.js');

const dept = { id: 'mech', sources: { timetable: { kind: 'document-page' } } } as unknown as Department;

describe('fetchSchedule resilience', () => {
  it('stays available with the document link when rendering throws', async () => {
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
});
