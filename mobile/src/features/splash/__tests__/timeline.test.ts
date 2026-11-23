import {
  exit,
  markLift,
  needleRotation,
  ringRotation,
  ripple,
  splashDuration,
  wordmark,
} from '../timeline';

describe('the splash timeline', () => {
  it('starts at rest, so its first frame is the native splash image', () => {
    expect(ringRotation(0)).toBeCloseTo(0);
    expect(needleRotation(0)).toBeCloseTo(0);
    expect(markLift(0)).toBeCloseTo(0);
    expect(ripple(0).opacity).toBe(0);
    expect(wordmark(0).opacity).toBe(0);
    expect(exit(0)).toEqual({ opacity: 1, scale: 1 });
  });

  it('swings the needle both ways before it settles', () => {
    const angles = Array.from({ length: 100 }, (_, i) => needleRotation(120 + i * 9));
    expect(Math.max(...angles)).toBeGreaterThan(20);
    expect(Math.min(...angles)).toBeLessThan(-10);
  });

  it('brings the mark to rest as it started, with the name shown, before it fades', () => {
    const settled = splashDuration - 300;
    expect(needleRotation(settled)).toBeCloseTo(0);
    // A half-turn of the ring looks the same as none.
    expect(ringRotation(settled)).toBe(-180);
    expect(wordmark(settled)).toEqual({ opacity: 1, translateY: 0 });
    expect(exit(settled).opacity).toBe(1);
  });

  it('has faded away completely by the end', () => {
    expect(exit(splashDuration).opacity).toBe(0);
  });
});
