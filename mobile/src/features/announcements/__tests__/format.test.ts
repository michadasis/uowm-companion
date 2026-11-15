import { formatDate, formatUpdatedAt } from '../format';

describe('formatDate', () => {
  it('writes the date in Greek & in English', () => {
    expect(formatDate('2026-11-09T13:40:10.000Z', 'el')).toBe('9 Νοεμβρίου 2026');
    expect(formatDate('2026-11-09T13:40:10.000Z', 'en')).toBe('November 9, 2026');
  });

  it('returns null when there is no date or it is unreadable', () => {
    expect(formatDate(null, 'el')).toBeNull();
    expect(formatDate('not a date', 'el')).toBeNull();
  });
});

describe('formatUpdatedAt', () => {
  it('writes a short day & time', () => {
    const when = new Date('2026-11-14T12:40:00.000Z').getTime();
    // The exact string depends on the test machine's zone; the shape is what
    // matters.
    expect(formatUpdatedAt(when, 'en')).toMatch(/Nov\s+14/);
  });
});
