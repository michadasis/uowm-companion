import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Card, createStyles, Icon, Screen, SectionHeader, Text } from '@/design';
import type { IconName } from '@/design';
import { describeDepartment } from '@/features/departments/describe';
import { findDepartment, useDirectory } from '@/features/departments/useDirectory';
import { dayPart, formatToday } from '@/features/home/greeting';
import { useSettings } from '@/features/settings/store';
import type { Language } from '@/features/settings/store';

interface ComingUpProps {
  icon: IconName;
  title: string;
  text: string;
}

/** A home section that has nothing to show yet, and says what will. */
function ComingUp({ icon, title, text }: ComingUpProps) {
  const styles = useStyles();
  return (
    <View>
      <SectionHeader title={title} />
      <Card style={styles.card}>
        <View style={styles.comingUp}>
          <View style={styles.comingUpIcon}>
            <Icon name={icon} color="textMuted" />
          </View>
          <Text variant="callout" color="textMuted" style={styles.comingUpText}>
            {text}
          </Text>
        </View>
      </Card>
    </View>
  );
}

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

        <ComingUp icon="schedule" title={t('home.nextUp.title')} text={t('home.nextUp.empty')} />
        <ComingUp icon="menu" title={t('home.menuToday.title')} text={t('home.menuToday.empty')} />
        <ComingUp
          icon="announcements"
          title={t('home.latest.title')}
          text={t('home.latest.empty')}
        />
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
  comingUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  comingUpIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingUpText: {
    flex: 1,
  },
}));
