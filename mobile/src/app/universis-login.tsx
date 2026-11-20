import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

import { createStyles, NavBar, Screen, Text, useTheme } from '@/design';
import { useSettings } from '@/features/settings/store';
import { givenNameFromToken, isTokenExpired, useUniversisAuth } from '@/features/universis/auth';
import { fetchStudentProfile, UniversisError } from '@/features/universis/client';
import type { StudentProfile } from '@/features/universis/client';
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

  // One sign-in is acted on: the first live token. `busy` holds off others
  // while it is checked; `settled` once it has been taken.
  const busy = useRef(false);
  const settled = useRef(false);

  const onMessage = (event: WebViewMessageEvent) => {
    const token = parseTokenMessage(event.nativeEvent.data);
    if (!token || busy.current || settled.current) return;
    // The page may hand over a token left from an earlier session before the
    // student signs in; one already expired is no sign-in.
    if (isTokenExpired(token)) return;
    busy.current = true;
    const onboarding = useSettings.getState().departmentId === null;

    void (async () => {
      if (!onboarding) {
        settled.current = true;
        await signIn(token);
        useSavedCourses.getState().saveProfile({ givenName: givenNameFromToken(token) });
        // A fresh token means a fresh read, even if a saved copy is on hand.
        refreshStudentCourses();
        goBack();
        return;
      }

      // On a first launch the student's department is read with the token.
      setFinding(true);
      let profile: StudentProfile | null;
      try {
        profile = await fetchStudentProfile(token);
      } catch (error) {
        if (error instanceof UniversisError && error.status === 401) {
          // Universis turned the token down: not the student's own sign-in
          // yet. Wait for the one that follows.
          setFinding(false);
          busy.current = false;
          return;
        }
        profile = null;
      }
      settled.current = true;
      await signIn(token);
      useSavedCourses.getState().saveProfile({ givenName: givenNameFromToken(token) });
      const found = profile ? applyProfile(token, profile) : null;
      refreshStudentCourses();
      if (found) {
        // Setting the department ends onboarding; Home is theirs.
        router.replace('/');
      } else {
        // No department the app knows came back: the student picks it.
        router.replace({ pathname: '/department', params: { universis: 'unmatched' } });
      }
    })();
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
