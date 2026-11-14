import { contrastRatio } from '../contrast';
import { darkColors, lightColors } from '../tokens/colors';
import type { ColorTokens } from '../tokens/colors';

type Pair = [foreground: keyof ColorTokens, background: keyof ColorTokens];

// WCAG AA: 4.5 for text, 3 for the edges of controls and for icons.
const text: Pair[] = [
  ['text', 'background'],
  ['text', 'surface'],
  ['text', 'surfaceMuted'],
  ['textMuted', 'background'],
  ['textMuted', 'surface'],
  ['textMuted', 'surfaceMuted'],
  ['textSubtle', 'background'],
  ['textSubtle', 'surface'],
  ['primary', 'background'],
  ['primary', 'surface'],
  ['onPrimary', 'primary'],
  ['onPrimaryMuted', 'primaryMuted'],
  ['onAccentMuted', 'accentMuted'],
  ['danger', 'surface'],
  ['danger', 'background'],
  ['onDangerMuted', 'dangerMuted'],
  ['success', 'surface'],
  ['onSuccessMuted', 'successMuted'],
];

const graphics: Pair[] = [
  ['borderStrong', 'surface'],
  ['accent', 'surface'],
  ['accent', 'background'],
];

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
])('%s theme', (_name, colors) => {
  it.each(text)('%s is readable on %s', (foreground, background) => {
    expect(contrastRatio(colors[foreground], colors[background])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(graphics)('%s stands out against %s', (foreground, background) => {
    expect(contrastRatio(colors[foreground], colors[background])).toBeGreaterThanOrEqual(3);
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for a colour on itself', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21);
    expect(contrastRatio('#5746C6', '#5746C6')).toBe(1);
  });

  it('does not depend on the order of the colours', () => {
    expect(contrastRatio('#1B1A1F', '#F7F6F2')).toBe(contrastRatio('#F7F6F2', '#1B1A1F'));
  });

  it('rejects anything that is not #rrggbb', () => {
    expect(() => contrastRatio('rgba(0, 0, 0, 0.5)', '#FFFFFF')).toThrow();
  });
});
