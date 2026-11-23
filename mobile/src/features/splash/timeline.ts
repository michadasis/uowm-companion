// The splash's choreography as plain functions of the time since it began,
// in milliseconds. Each runs as a worklet on the UI thread, and as ordinary
// code in the tests.
//
// At 0 every value is at rest, so the first frame is the native splash image
// exactly; the handover from one to the other can't be seen.

/** How wide the native splash image is drawn, in dp (imageWidth in app.config.ts). */
export const splashImageWidth = 120;
/** How large the mark is drawn in that image (scripts/render-icons.mjs). */
export const splashMarkScale = 1.75;

export const splashDuration = 1550;

function clamp01(value: number): number {
  'worklet';
  return Math.min(1, Math.max(0, value));
}

/** 0 before `start`, 1 after `start + duration`, linear between. */
function progress(t: number, start: number, duration: number): number {
  'worklet';
  return clamp01((t - start) / duration);
}

function easeInOutCubic(p: number): number {
  'worklet';
  return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
}

function easeOutCubic(p: number): number {
  'worklet';
  return 1 - (1 - p) ** 3;
}

function easeInCubic(p: number): number {
  'worklet';
  return p * p * p;
}

/**
 * The ring makes a half-turn anticlockwise. It looks the same after one, so
 * it comes to rest as it started.
 */
export function ringRotation(t: number): number {
  'worklet';
  return -180 * easeInOutCubic(progress(t, 120, 820));
}

/**
 * The needle swings as the housing turns under it & settles back where it
 * points, as a compass needle does: a swing that dies away, eased to exactly
 * zero at the end so it doesn't stop on a twitch.
 */
export function needleRotation(t: number): number {
  'worklet';
  const elapsed = t - 120;
  if (elapsed <= 0) return 0;
  const swing = 48 * Math.sin((2 * Math.PI * elapsed) / 430) * Math.exp(-elapsed / 280);
  return swing * (1 - easeInOutCubic(progress(t, 820, 200)));
}

/**
 * A ping of amber leaves the ring as the needle settles. It fades before it
 * reaches the name, so the two never cross.
 */
export function ripple(t: number): { scale: number; opacity: number } {
  'worklet';
  const p = progress(t, 860, 480);
  return { scale: 1 + 0.3 * easeOutCubic(p), opacity: p === 0 ? 0 : 0.6 * (1 - p) ** 2 };
}

/** The mark rises to make room for the name beneath it, in dp. */
export function markLift(t: number): number {
  'worklet';
  return -26 * easeInOutCubic(progress(t, 640, 460));
}

/** The name fades in & rises into place under the mark. */
export function wordmark(t: number): { opacity: number; translateY: number } {
  'worklet';
  const p = easeOutCubic(progress(t, 760, 380));
  return { opacity: p, translateY: 12 * (1 - p) };
}

/** The whole splash grows a little & fades into the app. */
export function exit(t: number): { opacity: number; scale: number } {
  'worklet';
  const p = progress(t, splashDuration - 300, 300);
  return { opacity: 1 - easeInCubic(p), scale: 1 + 0.06 * easeInOutCubic(p) };
}
