// The app's mark, the compass ("Πυξίδα"): an amber ring broken in two where
// a needle crosses it, the needle pointing north-east in blue & south-west in
// deep amber — the student finding their way through the day & the five
// cities. Original, not the university's emblem: the app is unofficial.
//
// Drawn on a 1024 grid, centred, filling the middle 47% of it, so it sits
// inside the safe zone of Android's adaptive icon as drawn. Every part is a
// filled path, so the mark sits on any background. src/design/brand.ts holds
// the same paths for the app: keep the two in step.

export const paths = {
  /** The two halves of the ring. */
  ring: [
    'M 751.11 362.5 A 282 282 0 0 1 362.5 751.11 L 418.21 695.41 A 206 206 0 0 0 695.41 418.21 L 751.11 362.5 Z',
    'M 272.89 661.5 A 282 282 0 0 1 661.5 272.89 L 605.79 328.59 A 206 206 0 0 0 328.59 605.79 L 272.89 661.5 Z',
  ],
  /** The needle's point, north-east. */
  north:
    'M 693.59 316.76 A 10 10 0 0 1 707.24 330.41 L 583.16 546.99 A 6 6 0 0 1 573.71 548.25 L 475.75 450.29 A 6 6 0 0 1 477.01 440.84 L 693.59 316.76 Z',
  /** Its tail, south-west. */
  south:
    'M 330.41 707.24 A 10 10 0 0 1 316.76 693.59 L 440.84 477.01 A 6 6 0 0 1 450.29 475.75 L 548.25 573.71 A 6 6 0 0 1 546.99 583.16 L 330.41 707.24 Z',
};

export const palette = {
  amber: '#F29A16',
  amberDeep: '#A8510A',
  blue: '#1F5AA6',
  ink: '#1F1B16',
  paper: '#FAF7F2',
  night: '#13110E',
};

/**
 * The mark as SVG markup, scaled about the centre: 1 is the size the adaptive
 * icon's safe zone takes, larger for an icon with nothing cropping it.
 * @param {{ ring?: string, north?: string, south?: string, background?: string, scale?: number }} options
 */
export function markSvg({
  ring = palette.amber,
  north = palette.blue,
  south = palette.amberDeep,
  background,
  scale = 1,
} = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${background ? `<rect width="1024" height="1024" fill="${background}"/>` : ''}
  <g transform="translate(512 512) scale(${scale}) translate(-512 -512)">
    ${paths.ring.map((d) => `<path d="${d}" fill="${ring}"/>`).join('\n    ')}
    <path d="${paths.north}" fill="${north}"/>
    <path d="${paths.south}" fill="${south}"/>
  </g>
</svg>`;
}
