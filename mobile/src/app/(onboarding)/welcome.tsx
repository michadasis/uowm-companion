import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BrandMark, Button, createStyles, Icon, Screen, SegmentedControl, Text } from '@/design';
import type { IconName } from '@/design';
import { useSettings } from '@/features/settings/store';

interface PromiseRowProps {
  icon: IconName;
  title: string;
  body: string;
  last?: boolean;
}

/** One thing the app does, as a line of a list rather than a tile. */
function PromiseRow({ icon, title, body, last = false }: PromiseRowProps) {
  const styles = useStyles();
  return (
    <View style={[styles.promise, last ? null : styles.promiseRule]}>
      <Icon name={icon} color="primary" />
      <View style={styles.promiseText}>
        <Text variant="subheading">{title}</Text>
        <Text variant="callout" color="textMuted">
          {body}
        </Text>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useStyles();
  const language = useSettings((settings) => settings.language);
  const setLanguage = useSettings((settings) => settings.setLanguage);

  return (
    <Screen edges={['top', 'bottom']} testID="welcome-screen">
      {/* The knot, large & faint, behind the page's corner. */}
      <View style={styles.watermark} pointerEvents="none">
        <BrandMark size={320} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.language}>
          <SegmentedControl
            accessibilityLabel={t('welcome.language')}
            options={[
              { value: 'el', label: 'Ελληνικά' },
              { value: 'en', label: 'English' },
            ]}
            value={language}
            onChange={setLanguage}
            testID="welcome-language"
          />
        </View>

        <View style={styles.intro}>
          <View style={styles.brand}>
            <BrandMark size={44} />
            <Text variant="heading">{t('app.name')}</Text>
          </View>
          <Text variant="display" accessibilityRole="header">
            {t('welcome.title')}
          </Text>
          <Text variant="body" color="textMuted">
            {t('welcome.subtitle')}
          </Text>
        </View>

        <View>
          <PromiseRow
            icon="announcements"
            title={t('welcome.announcements.title')}
            body={t('welcome.announcements.body')}
          />
          <PromiseRow
            icon="schedule"
            title={t('welcome.schedule.title')}
            body={t('welcome.schedule.body')}
          />
          <PromiseRow
            icon="date"
            title={t('welcome.calendar.title')}
            body={t('welcome.calendar.body')}
          />
          <PromiseRow
            icon="menu"
            title={t('welcome.menu.title')}
            body={t('welcome.menu.body')}
            last
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t('welcome.start')}
          onPress={() => router.push('/department')}
          testID="welcome-start"
        />
        <Text variant="caption" color="textSubtle" align="center">
          {t('app.unofficial')}
        </Text>
      </View>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  watermark: {
    position: 'absolute',
    top: 56,
    right: -150,
    opacity: theme.scheme === 'dark' ? 0.06 : 0.09,
  },
  content: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[6],
    gap: theme.spacing[8],
  },
  language: {
    alignSelf: 'flex-end',
    width: 200,
  },
  intro: {
    gap: theme.spacing[3],
    paddingTop: theme.spacing[6],
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[2],
  },
  promise: {
    flexDirection: 'row',
    gap: theme.spacing[4],
    paddingVertical: theme.spacing[4],
  },
  promiseRule: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  promiseText: {
    flex: 1,
    gap: theme.spacing[0.5],
  },
  footer: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[4],
    gap: theme.spacing[3],
  },
}));
