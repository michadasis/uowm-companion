import { useId } from 'react';
import Svg, { Defs, G, Mask, Rect } from 'react-native-svg';

import { useTheme } from '../theme';

export interface BrandMarkProps {
  size?: number;
}

// The geometry of scripts/brand.mjs, which renders the launcher icon & the
// splash image: keep the two in step.
const geometry = {
  rotate: 45,
  scale: 0.82,
  stroke: 100,
  radius: 100,
  a: 232,
  b: 372,
  side: 420,
  cutB: { x: 584, y: 318, width: 136, height: 108 },
  cutA: { x: 304, y: 598, width: 136, height: 108 },
  heart: { x: 460, y: 460, size: 104, radius: 22 },
};

/**
 * The app's mark: two rounded squares woven through each other, turned on end
 * into a diamond-shaped knot, with a small blue square at its heart. The gaps
 * where one passes under the other are cut out, so it sits on any surface.
 */
export function BrandMark({ size = 56 }: BrandMarkProps) {
  const { colors, scheme } = useTheme();
  const id = useId().replace(/:/g, '');
  const g = geometry;
  const heart = scheme === 'dark' ? '#5B93DB' : '#2F6FC0';

  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Defs>
        <Mask id={`${id}a`} maskUnits="userSpaceOnUse" x={0} y={0} width={1024} height={1024}>
          <Rect width={1024} height={1024} fill="white" />
          <Rect {...g.cutA} fill="black" />
        </Mask>
        <Mask id={`${id}b`} maskUnits="userSpaceOnUse" x={0} y={0} width={1024} height={1024}>
          <Rect width={1024} height={1024} fill="white" />
          <Rect {...g.cutB} fill="black" />
        </Mask>
      </Defs>
      <G
        transform={`translate(512 512) rotate(${g.rotate}) scale(${g.scale}) translate(-512 -512)`}
      >
        <Rect
          x={g.b}
          y={g.b}
          width={g.side}
          height={g.side}
          rx={g.radius}
          fill="none"
          stroke="#D9730D"
          strokeWidth={g.stroke}
          mask={`url(#${id}b)`}
        />
        <Rect
          x={g.a}
          y={g.a}
          width={g.side}
          height={g.side}
          rx={g.radius}
          fill="none"
          stroke={colors.brand}
          strokeWidth={g.stroke}
          mask={`url(#${id}a)`}
        />
        <Rect
          x={g.heart.x}
          y={g.heart.y}
          width={g.heart.size}
          height={g.heart.size}
          rx={g.heart.radius}
          fill={heart}
        />
      </G>
    </Svg>
  );
}
