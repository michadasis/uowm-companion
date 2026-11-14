import { createContext, useContext } from 'react';
import { StyleSheet } from 'react-native';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import { darkColors, lightColors } from './tokens/colors';
import type { ColorTokens } from './tokens/colors';
import { radius, size, spacing } from './tokens/layout';
import { typography } from './tokens/typography';

export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'system' | ColorScheme;

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  size: typeof size;
  typography: typeof typography;
}

const shared = { spacing, radius, size, typography };

export const themes: Record<ColorScheme, Theme> = {
  light: { scheme: 'light', colors: lightColors, ...shared },
  dark: { scheme: 'dark', colors: darkColors, ...shared },
};

export const ThemeContext = createContext<Theme>(themes.light);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

type NamedStyles<T> = { [K in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Themed styles without per-render work. The factory runs once per colour
 * scheme and the result is registered with StyleSheet, so a component that
 * renders a thousand times still creates its styles twice at most.
 */
export function createStyles<T extends NamedStyles<T>>(factory: (theme: Theme) => T): () => T {
  const cache = new Map<ColorScheme, T>();
  return function useStyles() {
    const theme = useTheme();
    let styles = cache.get(theme.scheme);
    if (!styles) {
      styles = StyleSheet.create(factory(theme));
      cache.set(theme.scheme, styles);
    }
    return styles;
  };
}
