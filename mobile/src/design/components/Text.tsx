import { Text as NativeText, StyleSheet } from 'react-native';
import type { TextProps as NativeTextProps, TextStyle } from 'react-native';

import { useTheme } from '../theme';
import type { ColorTokens } from '../tokens/colors';
import { typography } from '../tokens/typography';
import type { TypeVariant } from '../tokens/typography';

export type TextColor = Extract<
  keyof ColorTokens,
  | 'text'
  | 'textMuted'
  | 'textSubtle'
  | 'textDisabled'
  | 'primary'
  | 'onPrimary'
  | 'onPrimaryMuted'
  | 'onAccentMuted'
  | 'danger'
  | 'onDangerMuted'
  | 'success'
  | 'onSuccessMuted'
>;

export interface TextProps extends NativeTextProps {
  variant?: TypeVariant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
}

const variantStyles = StyleSheet.create(
  Object.fromEntries(
    Object.entries(typography).map(([name, { maxScale: _maxScale, ...style }]) => [
      name,
      // Android pads text above and below by default, which pushes labels
      // off centre inside buttons and chips.
      { ...style, includeFontPadding: false },
    ]),
  ) as Record<TypeVariant, TextStyle>,
);

export function Text({ variant = 'body', color = 'text', align, style, ...rest }: TextProps) {
  const theme = useTheme();
  return (
    <NativeText
      maxFontSizeMultiplier={typography[variant].maxScale}
      {...rest}
      style={[
        variantStyles[variant],
        { color: theme.colors[color] },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
