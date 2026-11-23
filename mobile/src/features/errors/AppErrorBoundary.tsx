import Constants from 'expo-constants';
import type { ErrorBoundaryProps } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, createStyles, Text, ThemeProvider } from '@/design';
import { useSettings } from '@/features/settings/store';
import { useUniversisAuth } from '@/features/universis/auth';
import { useSavedCourses } from '@/features/universis/saved';
import { disconnectUniversis } from '@/features/universis/useStudentCourses';

/**
 * Shown in place of the app when a screen throws while drawing, rather than
 * the app closing: the error itself, to read & send on, a retry, & for a
 * student linked to Universis a way back in by signing out, since what it
 * keeps is drawn again on every launch. It stands outside the root layout, so
 * it brings its own theme.
 */
export function AppErrorBoundary(props: ErrorBoundaryProps) {
  const preference = useSettings((s) => s.theme);
  return (
    <ThemeProvider preference={preference}>
      <CrashScreen {...props} />
    </ThemeProvider>
  );
}

function CrashScreen({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const signedIn = useUniversisAuth((s) => s.token !== null);
  const saved = useSavedCourses((s) => s.courses !== null);
  const [unlinking, setUnlinking] = useState(false);

  const details = [
    `UoWM Companion ${Constants.expoConfig?.version ?? ''}`.trim(),
    `${error.name}: ${error.message}`,
    error.stack ?? '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const unlink = async () => {
    setUnlinking(true);
    await disconnectUniversis();
    setUnlinking(false);
    await retry();
  };

  return (
    <SafeAreaView style={styles.screen} testID="app-error">
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title" accessibilityRole="header">
          {t('states.crash.title')}
        </Text>
        <Text variant="body" color="textMuted">
          {t('states.crash.message')}
        </Text>
        <View style={styles.actions}>
          <Button label={t('states.error.retry')} onPress={() => void retry()} />
          {signedIn || saved ? (
            <Button
              label={t('states.crash.unlink')}
              variant="secondary"
              loading={unlinking}
              onPress={() => void unlink()}
            />
          ) : null}
        </View>
        <Text variant="label" color="textMuted">
          {t('states.crash.details')}
        </Text>
        <Text variant="caption" selectable style={styles.details}>
          {details}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = createStyles((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing[5],
    gap: theme.spacing[4],
  },
  actions: {
    gap: theme.spacing[3],
  },
  details: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
  },
}));
