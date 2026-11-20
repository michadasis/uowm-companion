import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { createStyles, Screen } from '@/design';
import { describeDepartment } from '@/features/departments/describe';
import { findDepartment, useDirectory } from '@/features/departments/useDirectory';
import {
  LatestAnnouncementsSection,
  NextUpSection,
  TodayMenuSection,
} from '@/features/home/sections';
import { TodayHero } from '@/features/home/TodayHero';
import { useSettings } from '@/features/settings/store';
import type { Language } from '@/features/settings/store';

export default function HomeScreen() {
  const { i18n } = useTranslation();
  const language = i18n.language as Language;
  const styles = useStyles();
  const directory = useDirectory();
  const departmentId = useSettings((settings) => settings.departmentId);
  const department = findDepartment(directory, departmentId);
  // A development build can be shown another day, for previews: /?today=2026-12-28.
  const { today } = useLocalSearchParams<{ today?: string }>();
  const now =
    __DEV__ && today && /^\d{4}-\d{2}-\d{2}$/.test(today) ? new Date(`${today}T10:00`) : new Date();

  return (
    <Screen testID="home-screen">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TodayHero
          now={now}
          city={department?.city ?? null}
          departmentLine={
            department
              ? [
                  department.shortName[language],
                  describeDepartment(directory, department, language),
                ]
                  .filter(Boolean)
                  .join(' · ')
              : undefined
          }
        />

        {departmentId ? (
          <>
            <NextUpSection scope={departmentId} city={department?.city ?? null} />
            <TodayMenuSection />
            <LatestAnnouncementsSection scope={departmentId} />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  content: {
    paddingBottom: theme.spacing[10],
  },
}));
