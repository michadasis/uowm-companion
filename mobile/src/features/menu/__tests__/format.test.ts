import { dayLabel } from '../format';
import { todayName } from '../useMenu';

describe('dayLabel', () => {
  it('writes the weekday in Greek & English', () => {
    expect(dayLabel('monday', 'el', 'long')).toBe('Δευτέρα');
    expect(dayLabel('friday', 'el', 'long')).toBe('Παρασκευή');
    expect(dayLabel('monday', 'en', 'long')).toBe('Monday');
    expect(dayLabel('monday', 'en', 'short')).toBe('Mon');
  });

  it('returns the key unchanged for an unknown day', () => {
    expect(dayLabel('someday', 'el', 'long')).toBe('someday');
  });
});

describe('todayName', () => {
  it('maps a date to its lowercase English day name', () => {
    expect(todayName(new Date('2025-01-06T12:00:00'))).toBe('monday');
    expect(todayName(new Date('2025-01-05T12:00:00'))).toBe('sunday');
  });
});
