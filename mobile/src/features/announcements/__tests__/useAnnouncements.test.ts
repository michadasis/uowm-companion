import { findById, findBySourceUrl, scopeOfId } from '../useAnnouncements';
import type { AnnouncementsResponse } from '../schema';

const response: AnnouncementsResponse = {
  source: { kind: 'department', id: 'cs' },
  announcements: [
    {
      id: 'cs:1',
      title: 'Ένα',
      date: null,
      excerpt: '',
      body: [],
      images: [],
      attachments: [],
      sourceUrl: 'https://cs.uowm.gr/one/',
    },
    {
      id: 'cs:2',
      title: 'Δύο',
      date: null,
      excerpt: '',
      body: [],
      images: [],
      attachments: [],
      sourceUrl: 'https://cs.uowm.gr/two/',
    },
  ],
};

describe('scopeOfId', () => {
  it('reads the feed an announcement belongs to from its id', () => {
    expect(scopeOfId('cs:123')).toBe('cs');
    expect(scopeOfId('university:9')).toBe('university');
  });

  it('returns the whole id when there is no colon', () => {
    expect(scopeOfId('cs')).toBe('cs');
  });
});

describe('findById', () => {
  it('finds an announcement & returns nothing for an unknown id or no feed', () => {
    expect(findById(response, 'cs:2')?.title).toBe('Δύο');
    expect(findById(response, 'cs:9')).toBeUndefined();
    expect(findById(undefined, 'cs:1')).toBeUndefined();
  });
});

describe('findBySourceUrl', () => {
  it('matches an internal link to the announcement it points at', () => {
    expect(findBySourceUrl(response, 'https://cs.uowm.gr/two/')?.id).toBe('cs:2');
    expect(findBySourceUrl(response, 'https://cs.uowm.gr/elsewhere/')).toBeUndefined();
  });
});
