import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

/**
 * Springs for anything the finger drives or that moves between two places;
 * timing only for fades. Reanimated skips both when the system asks for
 * reduced motion, which is its default and is left alone here.
 */
export const spring = {
  /** Presses and toggles: settles fast with no visible bounce. */
  snappy: { duration: 220, dampingRatio: 1 },
  /** Things that travel, such as a selection indicator: a hint of overshoot. */
  glide: { duration: 320, dampingRatio: 0.82 },
} as const satisfies Record<string, WithSpringConfig>;

export const timing = {
  fade: { duration: 160 },
} as const satisfies Record<string, WithTimingConfig>;

export const pressedScale = 0.97;
