/**
 * The palette comes from the saffron crocus grown around Kozani: violet
 * petals for the primary colour, saffron for the accent and the red of the
 * stigma for errors, on warm paper rather than pure white.
 *
 * Components only ever use the semantic names below. The dark theme is a
 * separate set of values, not an inversion: surfaces get lighter as they
 * come forward and the violet is lifted so it keeps its contrast.
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
  background: '#F7F6F2',
  surface: '#FFFFFF',
  surfaceMuted: '#EEECE6',
  border: '#E3E0D8',
  borderStrong: '#8B877D',

  text: '#1B1A1F',
  textMuted: '#55535F',
  textSubtle: '#6C6A76',
  textDisabled: '#A19FA8',

  primary: '#5746C6',
  onPrimary: '#FFFFFF',
  primaryMuted: '#ECE9FB',
  onPrimaryMuted: '#3E3199',

  accent: '#C47A12',
  accentMuted: '#FCEFD6',
  onAccentMuted: '#7A4A06',

  danger: '#B93A22',
  dangerMuted: '#FBE6E0',
  onDangerMuted: '#8F2A17',

  success: '#1E7F47',
  successMuted: '#DFF3E6',
  onSuccessMuted: '#155C33',

  skeleton: '#E8E5DD',
  pressed: 'rgba(27, 26, 31, 0.06)',
  scrim: 'rgba(20, 18, 30, 0.45)',
};

export const darkColors: ColorTokens = {
  background: '#121116',
  surface: '#1B1A21',
  surfaceMuted: '#25242C',
  border: '#2F2E38',
  borderStrong: '#6F6D7B',

  text: '#EDEBF3',
  textMuted: '#B4B1BF',
  textSubtle: '#9390A0',
  textDisabled: '#666472',

  primary: '#A99BF5',
  onPrimary: '#1A1440',
  primaryMuted: '#2A2650',
  onPrimaryMuted: '#D2CBFB',

  accent: '#F0B45A',
  accentMuted: '#3A2C12',
  onAccentMuted: '#F6CE8C',

  danger: '#F28B76',
  dangerMuted: '#3D1D17',
  onDangerMuted: '#F7B3A4',

  success: '#6FCF97',
  successMuted: '#16301F',
  onSuccessMuted: '#A5E3BF',

  skeleton: '#27262E',
  pressed: 'rgba(237, 235, 243, 0.08)',
  scrim: 'rgba(0, 0, 0, 0.6)',
};
