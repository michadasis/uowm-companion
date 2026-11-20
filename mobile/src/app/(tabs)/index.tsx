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
import { GradesSection } from '@/features/home/GradesSection';
import { TodayHero } from '@/features/home/TodayHero';
import { useSettings } from '@/features/settings/store';
import type { Language } from '@/features/settings/store';
import { usePreviewNow } from '@/lib/usePreviewNow';

export default function HomeScreen() {
  const { i18n } = useTranslation();
  const language = i18n.language as Language;
  const styles = useStyles();
  const directory = useDirectory();
  const departmentId = useSettings((settings) => settings.departmentId);
  const department = findDepartment(directory, departmentId);
  const now = usePreviewNow();

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
            <GradesSection />
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
