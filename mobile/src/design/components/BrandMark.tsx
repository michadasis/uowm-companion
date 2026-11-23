import Svg, { Path } from 'react-native-svg';

import { markColors, markPaths } from '../brand';

export interface BrandMarkProps {
  size?: number;
}

/**
 * The app's mark, the compass: an amber ring broken where a needle crosses
 * it, pointing north-east in blue & south-west in deep amber. Drawn to fill
 * its box; every part is filled, so it sits on any surface.
 */
export function BrandMark({ size = 56 }: BrandMarkProps) {
  return (
    // The mark spans 273–751 of the 1024 grid; the box is cropped to it.
    <Svg width={size} height={size} viewBox="256 256 512 512">
      {markPaths.ring.map((d) => (
        <Path key={d} d={d} fill={markColors.ring} />
      ))}
      <Path d={markPaths.north} fill={markColors.north} />
      <Path d={markPaths.south} fill={markColors.south} />
    </Svg>
  );
}
