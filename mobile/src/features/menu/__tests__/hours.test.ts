import { mealFor } from '../hours';

// Monday 23 & Saturday 28 November 2026.
const monday = (hours: number, minutes = 0) => new Date(2026, 10, 23, hours, minutes);
const saturday = (hours: number, minutes = 0) => new Date(2026, 10, 28, hours, minutes);

describe('mealFor', () => {
  it('opens on breakfast until it ends, which is later at the weekend', () => {
    expect(mealFor(monday(6))).toBe('breakfast');
    expect(mealFor(monday(9, 29))).toBe('breakfast');
    expect(mealFor(monday(9, 30))).toBe('lunch');
    expect(mealFor(saturday(9, 45))).toBe('breakfast');
    expect(mealFor(saturday(10))).toBe('lunch');
  });

  it('opens on lunch until 15:30 & on dinner after it', () => {
    expect(mealFor(monday(13))).toBe('lunch');
    expect(mealFor(monday(15, 29))).toBe('lunch');
    expect(mealFor(monday(15, 30))).toBe('dinner');
    expect(mealFor(monday(19))).toBe('dinner');
    expect(mealFor(monday(23, 30))).toBe('dinner');
  });

  it('starts the next day on breakfast', () => {
    expect(mealFor(monday(0, 10))).toBe('breakfast');
  });
});
