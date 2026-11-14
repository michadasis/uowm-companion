import type { TextStyle } from 'react-native';

/**
 * Commissioner, drawn by the Greek designer Kostas Bartsokas, so the Greek
 * is original work rather than an extension of a Latin design. Each weight
 * is a file of its own, which is why weights are chosen by family name and
 * never with `fontWeight`.
 */
export const fontFamily = {
  regular: 'Commissioner_400Regular',
  medium: 'Commissioner_500Medium',
  semibold: 'Commissioner_600SemiBold',
  bold: 'Commissioner_700Bold',
} as const;

export interface TypeStyle extends Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'
> {
  fontSize: number;
  lineHeight: number;
  /**
   * How far the system font size setting may enlarge this style. Reading
   * text follows the setting a long way; labels in fixed chrome only a
   * little, because a tab bar cannot grow.
   */
  maxScale: number;
}

// Line heights are generous on purpose: Greek carries accents above its
// capitals and descenders on more letters than English does.
export const typography = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.4,
    maxScale: 1.3,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.2,
    maxScale: 1.4,
  },
  heading: {
    fontFamily: fontFamily.semibold,
    fontSize: 19,
    lineHeight: 26,
    letterSpacing: -0.1,
    maxScale: 1.5,
  },
  subheading: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    lineHeight: 22,
    maxScale: 1.6,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    maxScale: 2,
  },
  bodyStrong: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    lineHeight: 24,
    maxScale: 2,
  },
  callout: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    maxScale: 2,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    maxScale: 1.5,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    maxScale: 1.6,
  },
  overline: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    maxScale: 1.4,
  },
  tab: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.1,
    maxScale: 1.2,
  },
} as const satisfies Record<string, TypeStyle>;

export type TypeVariant = keyof typeof typography;
