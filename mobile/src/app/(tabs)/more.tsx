import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import {
  Card,
  createStyles,
  ListRow,
  Screen,
  ScreenTitle,
  SectionHeader,
  SegmentedControl,
  Text,
} from '@/design';
import { describeDepartment } from '@/features/departments/describe';
import { findDepartment, useDirectory } from '@/features/departments/useDirectory';
import { useSettings } from '@/features/settings/store';
import type { Language } from '@/features/settings/store';
import { showDeveloperTools } from '@/lib/env';

export default function MoreScreen() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const router = useRouter();
  const styles = useStyles();
  const directory = useDirectory();
  const departmentId = useSettings((settings) => settings.departmentId);
  const theme = useSettings((settings) => settings.theme);
  const setTheme = useSettings((settings) => settings.setTheme);
  const setLanguage = useSettings((settings) => settings.setLanguage);
  const department = findDepartment(directory, departmentId);

  return (
    <Screen testID="more-screen">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle title={t('more.title')} />

        <SectionHeader title={t('more.department.section')} />
        <Card padded={false} style={styles.card}>
          <ListRow
            icon="department"
            title={department?.shortName[language] ?? t('more.department.change')}
            subtitle={department ? describeDepartment(directory, department, language) : undefined}
            trailing="chevron"
            onPress={() => router.push('/settings/department')}
            testID="more-department"
          />
        </Card>

        <SectionHeader title={t('more.studies.section')} />
        <Card padded={false} style={styles.card}>
          <ListRow
            icon="schedule"
            title={t('universis.grades.title')}
            subtitle={t('more.studies.gradesHint')}
            trailing="chevron"
            onPress={() => router.push('/grades' as Href)}
            testID="more-grades"
          />
        </Card>

        <SectionHeader title={t('more.appearance.section')} />
        <Card style={styles.card}>
          <View style={styles.setting}>
            <Text variant="label" color="textMuted">
              {t('more.appearance.theme')}
            </Text>
            <SegmentedControl
              accessibilityLabel={t('more.appearance.theme')}
              options={[
                { value: 'system', label: t('more.appearance.themes.system') },
                { value: 'light', label: t('more.appearance.themes.light') },
                { value: 'dark', label: t('more.appearance.themes.dark') },
              ]}
              value={theme}
              onChange={setTheme}
              testID="more-theme"
            />
          </View>
          <View style={styles.setting}>
            <Text variant="label" color="textMuted">
              {t('more.appearance.language')}
            </Text>
            <SegmentedControl
              accessibilityLabel={t('more.appearance.language')}
              options={[
                { value: 'el', label: 'Ελληνικά' },
                { value: 'en', label: 'English' },
              ]}
              value={language}
              onChange={setLanguage}
              testID="more-language"
            />
          </View>
        </Card>

        {showDeveloperTools ? (
          <>
            <SectionHeader title={t('more.developer.section')} />
            <Card padded={false} style={styles.card}>
              <ListRow
                icon="designSystem"
                title={t('more.developer.designSystem')}
                subtitle={t('more.developer.designSystemHint')}
                trailing="chevron"
                onPress={() => router.push('/design-system')}
                testID="more-design-system"
              />
            </Card>
          </>
        ) : null}

        <SectionHeader title={t('more.about.section')} />
        <Card padded={false} style={styles.card}>
          <ListRow
            icon="about"
            title={t('more.about.version')}
            value={Constants.expoConfig?.version ?? ''}
          />
        </Card>
        <Text variant="caption" color="textSubtle" style={styles.notice}>
          {t('app.unofficial')}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  content: {
    paddingBottom: theme.spacing[8],
  },
  card: {
    marginHorizontal: theme.spacing[4],
    gap: theme.spacing[4],
  },
  setting: {
    gap: theme.spacing[2],
  },
  notice: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[3],
  },
}));
