import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { createStyles, Screen } from '@/design';
import { findDepartment, useDirectory } from '@/features/departments/useDirectory';
import {
  LatestAnnouncementsSection,
  NextUpSection,
  TodayMenuSection,
} from '@/features/home/sections';
import { GradesSection } from '@/features/home/GradesSection';
import { toneOfDay, TodayHero, useToday } from '@/features/home/TodayHero';
import { useSettings } from '@/features/settings/store';
import type { Language } from '@/features/settings/store';
import { useSavedCourses } from '@/features/universis/saved';
import { genderOf } from '@/lib/greekName';
import { usePreviewNow } from '@/lib/usePreviewNow';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const styles = useStyles();
  const directory = useDirectory();
  const departmentId = useSettings((settings) => settings.departmentId);
  const department = findDepartment(directory, departmentId);
  const now = usePreviewNow();
  // "Φοιτητής" or "Φοιτήτρια" as Universis records it, or as the name tells;
  // otherwise just the department.
  const savedGender = useSavedCourses((s) => s.gender);
  const givenName = useSavedCourses((s) => s.givenName);
  const gender = savedGender ?? genderOf(givenName);
  const today = useToday(now, department?.city ?? null);

  return (
    <Screen tone={toneOfDay(today.tone)} testID="home-screen">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TodayHero
          now={now}
          today={today}
          departmentLine={
            department
              ? t(
                  gender === 'female'
                    ? 'home.departmentLineFemale'
                    : gender === 'male'
                      ? 'home.departmentLineMale'
                      : 'home.departmentLine',
                  {
                    name: department.shortName[language],
                    city:
                      directory.cities.find((city) => city.id === department.city)?.name[
                        language
                      ] ?? '',
                  },
                )
              : undefined
          }
        />

        {departmentId ? (
          <>
            <NextUpSection scope={departmentId} city={department?.city ?? null} now={now} />
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
