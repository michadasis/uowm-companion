import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Card, createStyles, Icon, Screen, Text } from '@/design';
import { describeDepartment } from '@/features/departments/describe';
import { findDepartment, useDirectory } from '@/features/departments/useDirectory';
import { dayPart, formatToday } from '@/features/home/greeting';
import {
  LatestAnnouncementsSection,
  NextUpSection,
  TodayMenuSection,
} from '@/features/home/sections';
import { useSettings } from '@/features/settings/store';
import type { Language } from '@/features/settings/store';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const styles = useStyles();
  const directory = useDirectory();
  const departmentId = useSettings((settings) => settings.departmentId);
  const department = findDepartment(directory, departmentId);
  const now = new Date();

  return (
    <Screen testID="home-screen">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <Text variant="label" color="textMuted">
            {formatToday(now, language)}
          </Text>
          <Text variant="display" accessibilityRole="header">
            {t(`home.greeting.${dayPart(now)}`)}
          </Text>
        </View>

        {department ? (
          <Card style={styles.card} testID="home-department">
            <View style={styles.department}>
              <View style={styles.departmentIcon}>
                <Icon name="department" color="onPrimary" size={26} />
              </View>
              <View style={styles.departmentText}>
                <Text variant="heading">{department.shortName[language]}</Text>
                <Text variant="caption" color="textMuted">
                  {describeDepartment(directory, department, language)}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        {departmentId ? (
          <>
            <NextUpSection scope={departmentId} />
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
    paddingBottom: theme.spacing[8],
  },
  greeting: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[5],
    paddingBottom: theme.spacing[5],
    gap: theme.spacing[1],
  },
  card: {
    marginHorizontal: theme.spacing[4],
  },
  department: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[4],
  },
  departmentIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  departmentText: {
    flex: 1,
    gap: theme.spacing[0.5],
  },
}));
