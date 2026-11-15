import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { createStyles, Screen, ScreenTitle, SegmentedControl } from '@/design';
import { ScheduleView } from '@/features/schedules/ScheduleView';
import type { ScheduleKind } from '@/features/schedules/schema';
import { useSettings } from '@/features/settings/store';

export default function ScheduleScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const departmentId = useSettings((settings) => settings.departmentId);
  const [kind, setKind] = useState<ScheduleKind>('exams');

  return (
    <Screen testID="schedule-screen">
      <ScreenTitle title={t('schedule.title')} />
      <View style={styles.tabs}>
        <SegmentedControl
          accessibilityLabel={t('schedule.title')}
          options={[
            { value: 'exams', label: t('schedule.tabs.exams') },
            { value: 'timetable', label: t('schedule.tabs.timetable') },
          ]}
          value={kind}
          onChange={setKind}
          testID="schedule-kind-toggle"
        />
      </View>
      <ScheduleView key={kind} scope={departmentId} kind={kind} />
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  tabs: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[1],
    paddingBottom: theme.spacing[2],
  },
}));
