import { dayPart, formatToday } from '../greeting';

const at = (hour: number) => new Date(2026, 10, 14, hour, 30);

describe('dayPart', () => {
  it.each([
    [5, 'morning'],
    [11, 'morning'],
    [12, 'afternoon'],
    [17, 'afternoon'],
    [18, 'evening'],
    [23, 'evening'],
    [0, 'evening'],
    [4, 'evening'],
  ])('at %i:30 it is %s', (hour, expected) => {
    expect(dayPart(at(hour))).toBe(expected);
  });
});

describe('formatToday', () => {
  it('writes the weekday, the day and the month in Greek', () => {
    expect(formatToday(at(9), 'el')).toBe('Σάββατο 14 Νοεμβρίου');
  });

  it('writes them in English', () => {
    expect(formatToday(at(9), 'en')).toBe('Saturday, November 14');
  });
});
