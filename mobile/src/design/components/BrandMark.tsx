import Svg, { G, Path } from 'react-native-svg';

import { useTheme } from '../theme';

export interface BrandMarkProps {
  size?: number;
}

const petal = 'M512 772 C352 640 366 372 512 214 C658 372 672 640 512 772 Z';
const stigma = 'M512 760 L512 500';

/**
 * The app's mark: a saffron crocus, three petals with the three stigmas the
 * spice is made from. Drawn from the same paths as the launcher icon.
 */
export function BrandMark({ size = 56 }: BrandMarkProps) {
  const { colors, scheme } = useTheme();
  const side = colors.primary;
  const centre = scheme === 'dark' ? '#D2CBFB' : '#8D7EE4';

  return (
    <Svg width={size} height={size} viewBox="150 180 724 620">
      <G>
        <Path d={petal} fill={side} transform="rotate(-28 512 772)" />
        <Path d={petal} fill={side} transform="rotate(28 512 772)" />
        <Path d={petal} fill={centre} />
        {[-12, 12, 0].map((angle) => (
          <Path
            key={angle}
            d={stigma}
            stroke={colors.accent}
            strokeWidth={24}
            strokeLinecap="round"
            transform={`rotate(${angle} 512 772)`}
          />
        ))}
      </G>
    </Svg>
  );
}
