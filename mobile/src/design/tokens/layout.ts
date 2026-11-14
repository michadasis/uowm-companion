/** A 4pt grid. `spacing[4]` is 16. */
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const size = {
  /** The smallest area anything tappable may occupy. */
  touchTarget: 48,
  icon: { sm: 18, md: 22, lg: 28 },
  /** Lists stop growing here so lines stay readable on tablets and the web. */
  contentMaxWidth: 640,
} as const;
