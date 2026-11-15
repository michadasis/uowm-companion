import { Commissioner_400Regular } from '@expo-google-fonts/commissioner/400Regular';
import { Commissioner_500Medium } from '@expo-google-fonts/commissioner/500Medium';
import { Commissioner_600SemiBold } from '@expo-google-fonts/commissioner/600SemiBold';
import { Commissioner_700Bold } from '@expo-google-fonts/commissioner/700Bold';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from '@/design';
import { useSettings, useSettingsHydrated } from '@/features/settings/store';
import { connectQueryClientToDevice, persistOptions, queryClient } from '@/lib/query';

// Held until the fonts and the saved settings are in, so the first frame is
// already in the right typeface, theme and language, on the right screen.
void SplashScreen.preventAutoHideAsync();

/** Gives the navigator's own surfaces the app's colours. */
function NavigationTheme({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <NavigationThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
        },
      }}
    >
      {children}
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Commissioner_400Regular,
    Commissioner_500Medium,
    Commissioner_600SemiBold,
    Commissioner_700Bold,
  });
  const hydrated = useSettingsHydrated();
  const themePreference = useSettings((settings) => settings.theme);
  const onboarded = useSettings((settings) => settings.departmentId !== null);

  useEffect(() => connectQueryClientToDevice(), []);

  // A font that fails to load is not worth a blank screen: the system font
  // takes over.
  const ready = hydrated && (fontsLoaded || fontError !== null);
  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <ThemeProvider preference={themePreference}>
          <NavigationTheme>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Protected guard={!onboarded} redirectTo="/">
                <Stack.Screen name="(onboarding)" />
              </Stack.Protected>
              <Stack.Protected guard={onboarded} redirectTo="/welcome">
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="announcement/[id]" />
                <Stack.Screen name="settings/department" />
                <Stack.Screen name="design-system" />
              </Stack.Protected>
            </Stack>
          </NavigationTheme>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
