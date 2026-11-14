import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { ThemeContext, themes } from './theme';
import type { ColorScheme, ThemePreference } from './theme';

interface ThemeProviderProps {
  preference: ThemePreference;
  children: ReactNode;
}

export function resolveScheme(
  preference: ThemePreference,
  system: string | null | undefined,
): ColorScheme {
  if (preference !== 'system') return preference;
  return system === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ preference, children }: ThemeProviderProps) {
  const scheme = resolveScheme(preference, useColorScheme());
  const theme = themes[scheme];

  useEffect(() => {
    // The native window sits behind every screen and shows through during
    // keyboard and navigation transitions; matching it avoids a white flash
    // in the dark theme.
    void SystemUI.setBackgroundColorAsync(theme.colors.background);
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}
