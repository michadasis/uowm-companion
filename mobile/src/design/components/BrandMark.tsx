import Svg, { Path } from 'react-native-svg';

export interface BrandMarkProps {
  size?: number;
}

// The paths of scripts/brand.mjs, which renders the launcher icon & the
// splash image: keep the two in step.
const ring = [
  'M 751.11 362.5 A 282 282 0 0 1 362.5 751.11 L 418.21 695.41 A 206 206 0 0 0 695.41 418.21 L 751.11 362.5 Z',
  'M 272.89 661.5 A 282 282 0 0 1 661.5 272.89 L 605.79 328.59 A 206 206 0 0 0 328.59 605.79 L 272.89 661.5 Z',
];
const north =
  'M 693.59 316.76 A 10 10 0 0 1 707.24 330.41 L 583.16 546.99 A 6 6 0 0 1 573.71 548.25 L 475.75 450.29 A 6 6 0 0 1 477.01 440.84 L 693.59 316.76 Z';
const south =
  'M 330.41 707.24 A 10 10 0 0 1 316.76 693.59 L 440.84 477.01 A 6 6 0 0 1 450.29 475.75 L 548.25 573.71 A 6 6 0 0 1 546.99 583.16 L 330.41 707.24 Z';

/**
 * The app's mark, the compass: an amber ring broken where a needle crosses
 * it, pointing north-east in blue & south-west in deep amber. Drawn to fill
 * its box; every part is filled, so it sits on any surface.
 */
export function BrandMark({ size = 56 }: BrandMarkProps) {
  return (
    // The mark spans 273–751 of the 1024 grid; the box is cropped to it.
    <Svg width={size} height={size} viewBox="256 256 512 512">
      {ring.map((d) => (
        <Path key={d} d={d} fill="#F29A16" />
      ))}
      <Path d={north} fill="#1F5AA6" />
      <Path d={south} fill="#A8510A" />
    </Svg>
  );
}
