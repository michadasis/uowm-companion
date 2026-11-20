import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

import { createStyles, NavBar, Screen, Text, useTheme } from '@/design';
import { useSettings } from '@/features/settings/store';
import { givenNameFromToken, useUniversisAuth } from '@/features/universis/auth';
import { fetchStudentProfile } from '@/features/universis/client';
import { INJECTED_TOKEN_HOOK, parseTokenMessage } from '@/features/universis/login';
import { useSavedCourses } from '@/features/universis/saved';
import { applyProfile, refreshStudentCourses } from '@/features/universis/useStudentCourses';

/** The Universis sign-in: the real web app in a WebView, token read on success. */
export default function UniversisLoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles();
  const signIn = useUniversisAuth((s) => s.signIn);
  const [loading, setLoading] = useState(true);
  // On a first launch, signing in is how the student's department is found.
  const [finding, setFinding] = useState(false);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/schedule'));

  const onMessage = (event: WebViewMessageEvent) => {
    const token = parseTokenMessage(event.nativeEvent.data);
    if (!token) return;
    const onboarding = useSettings.getState().departmentId === null;
    void signIn(token).then(async () => {
      // The token may name the student; greet them by it at once.
      useSavedCourses.getState().saveProfile({ givenName: givenNameFromToken(token) });
      if (!onboarding) {
        // A fresh token means a fresh read, even if a saved copy is on hand.
        refreshStudentCourses();
        goBack();
        return;
      }
      setFinding(true);
      const found = await fetchStudentProfile(token)
        .then((profile) => applyProfile(token, profile))
        .catch(() => null);
      refreshStudentCourses();
      if (found) {
        // Setting the department ends onboarding; Home is theirs.
        router.replace('/');
      } else {
        // Universis named no department the app knows: the student picks it.
        router.replace({ pathname: '/department', params: { universis: 'unmatched' } });
      }
    });
  };

  return (
    <Screen edges={['top', 'bottom']} testID="universis-login">
      <NavBar title={t('universis.link.title')} onBack={goBack} backLabel={t('common.back')} />
      <View style={styles.webWrap}>
        <WebView
          source={{ uri: 'https://students2.uowm.gr' }}
          injectedJavaScriptBeforeContentLoaded={INJECTED_TOKEN_HOOK}
          onMessage={onMessage}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          // The student signs in on the University's own pages; we never see it.
          incognito={false}
        />
        {loading || finding ? (
          <View style={[styles.overlay, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text variant="caption" color="textMuted">
              {finding ? t('universis.findingDepartment') : t('universis.loading')}
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const useStyles = createStyles(() => ({
  webWrap: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
}));
