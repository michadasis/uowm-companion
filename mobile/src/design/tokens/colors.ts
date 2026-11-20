/**
 * The palette takes after the university's own colours: the amber of its
 * interlaced mark for the primary colour, the blue of its small squares for
 * the accent, on warm paper rather than pure white. The bright amber of the
 * mark itself is too light to carry text, so it is kept apart as `brand`, for
 * the logo & for decoration; text & controls use a deeper amber that reads.
 *
 * Components only ever use the semantic names below. The dark theme is a
 * separate set of values, not an inversion: surfaces get lighter as they
 * come forward, and the amber is lifted so it keeps its contrast.
 */
export interface ColorTokens {
  /** The page behind everything. */
  background: string;
  /** Cards, sheets and bars that sit on the background. */
  surface: string;
  /** Inputs, unselected chips and other recessed areas. */
  surfaceMuted: string;
  border: string;
  borderStrong: string;

  text: string;
  textMuted: string;
  textSubtle: string;
  /** Placeholders and disabled labels. Not for anything that must be read. */
  textDisabled: string;

  /** The mark's own amber: the logo & decoration, never text. */
  brand: string;

  primary: string;
  onPrimary: string;
  primaryMuted: string;
  onPrimaryMuted: string;

  accent: string;
  accentMuted: string;
  onAccentMuted: string;

  danger: string;
  dangerMuted: string;
  onDangerMuted: string;

  success: string;
  successMuted: string;
  onSuccessMuted: string;

  skeleton: string;
  /** Feedback painted over a pressed row. */
  pressed: string;
  /** The dimming layer behind sheets and dialogs. */
  scrim: string;
}

export const lightColors: ColorTokens = {
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceMuted: '#F2ECE3',
  border: '#E8E1D6',
  borderStrong: '#8C8273',

  text: '#1F1B16',
  textMuted: '#5A5248',
  textSubtle: '#716858',
  textDisabled: '#ADA597',

  brand: '#F29A16',

  primary: '#A8510A',
  onPrimary: '#FFFFFF',
  primaryMuted: '#FBEBD3',
  onPrimaryMuted: '#7A3B05',

  accent: '#1F5AA6',
  accentMuted: '#E4EDF9',
  onAccentMuted: '#17457F',

  danger: '#B42318',
  dangerMuted: '#FBE5E1',
  onDangerMuted: '#8F1B12',

  success: '#1E7A45',
  successMuted: '#DFF2E6',
  onSuccessMuted: '#155C33',

  skeleton: '#EDE7DD',
  pressed: 'rgba(31, 27, 22, 0.06)',
  scrim: 'rgba(24, 20, 14, 0.45)',
};

export const darkColors: ColorTokens = {
  background: '#13110E',
  surface: '#1C1915',
  surfaceMuted: '#26221D',
  border: '#302B24',
  borderStrong: '#7A7062',

  text: '#F4EFE8',
  textMuted: '#BFB6A9',
  textSubtle: '#9E9486',
  textDisabled: '#5F574C',

  brand: '#F29A16',

  primary: '#F2A541',
  onPrimary: '#1F1B16',
  primaryMuted: '#3A2A13',
  onPrimaryMuted: '#F9D29A',

  accent: '#8DB9F2',
  accentMuted: '#172637',
  onAccentMuted: '#BFD7F7',

  danger: '#F28B76',
  dangerMuted: '#3D1D17',
  onDangerMuted: '#F7B3A4',

  success: '#6FCF97',
  successMuted: '#16301F',
  onSuccessMuted: '#A5E3BF',

  skeleton: '#26221D',
  pressed: 'rgba(244, 239, 232, 0.08)',
  scrim: 'rgba(0, 0, 0, 0.6)',
};
