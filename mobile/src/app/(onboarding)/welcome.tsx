import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { BrandMark, Button, createStyles, Icon, Screen, SegmentedControl, Text } from '@/design';
import type { IconName } from '@/design';
import { useSettings } from '@/features/settings/store';

interface PromiseRowProps {
  icon: IconName;
  title: string;
  body: string;
}

function PromiseRow({ icon, title, body }: PromiseRowProps) {
  const styles = useStyles();
  return (
    <View style={styles.promise}>
      <View style={styles.promiseIcon}>
        <Icon name={icon} color="onPrimaryMuted" />
      </View>
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
          <BrandMark />
          <Text variant="overline" color="primary">
            {t('app.name')}
          </Text>
          <Text variant="display" accessibilityRole="header">
            {t('welcome.title')}
          </Text>
          <Text variant="body" color="textMuted">
            {t('welcome.subtitle')}
          </Text>
        </View>

        <View style={styles.promises}>
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
          <PromiseRow icon="menu" title={t('welcome.menu.title')} body={t('welcome.menu.body')} />
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
  content: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[6],
    gap: theme.spacing[10],
  },
  language: {
    alignSelf: 'flex-end',
    width: 200,
  },
  intro: {
    gap: theme.spacing[3],
  },
  promises: {
    gap: theme.spacing[5],
  },
  promise: {
    flexDirection: 'row',
    gap: theme.spacing[4],
  },
  promiseIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
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
