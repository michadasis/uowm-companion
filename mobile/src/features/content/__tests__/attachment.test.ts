import { attachmentName } from '../attachment';
import { imageSources } from '../AutoImage';

describe('attachmentName', () => {
  it('writes a file name as words', () => {
    expect(attachmentName('Erasmus_Final_Poster')).toBe('Erasmus Final Poster');
    expect(attachmentName('Πρόγραμμα--Εξεταστικής__2026')).toBe('Πρόγραμμα Εξεταστικής 2026');
    expect(attachmentName('Ανακοίνωση Ε-Μ')).toBe('Ανακοίνωση Ε-Μ');
  });
});

describe('imageSources', () => {
  it('loads a university image through the backend first, then direct', () => {
    expect(
      imageSources('https://cs.uowm.gr/wp-content/uploads/a b.jpg', 'https://api.test'),
    ).toEqual([
      'https://api.test/api/image?url=https%3A%2F%2Fcs.uowm.gr%2Fwp-content%2Fuploads%2Fa%20b.jpg',
      'https://cs.uowm.gr/wp-content/uploads/a b.jpg',
    ]);
  });

  it('loads anything else, or without a backend, direct', () => {
    expect(imageSources('https://example.org/a.jpg', 'https://api.test')).toEqual([
      'https://example.org/a.jpg',
    ]);
    expect(imageSources('https://cs.uowm.gr/a.jpg', null)).toEqual(['https://cs.uowm.gr/a.jpg']);
  });
});
