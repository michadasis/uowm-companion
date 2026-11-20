import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Screen, ScreenTitle, SegmentedControl } from '@/design';
import { ScheduleView } from '@/features/schedules/ScheduleView';
import type { ScheduleKind } from '@/features/schedules/schema';
import { useSettings } from '@/features/settings/store';

const isKind = (value: unknown): value is ScheduleKind =>
  value === 'timetable' || value === 'exams';

export default function ScheduleScreen() {
  const { t } = useTranslation();
  const departmentId = useSettings((settings) => settings.departmentId);
  // The Home screen's "next up" card opens the schedule it came from.
  const params = useLocalSearchParams<{ kind?: string }>();
  // The timetable is what a student checks daily; exams only for a few weeks.
  const [kind, setKind] = useState<ScheduleKind>(isKind(params.kind) ? params.kind : 'timetable');

  // The tab stays mounted, so a later visit with another `kind` arrives as a
  // change of params, not as a fresh screen; follow it when it changes.
  const [seenKind, setSeenKind] = useState(params.kind);
  if (params.kind !== seenKind) {
    setSeenKind(params.kind);
    if (isKind(params.kind)) setKind(params.kind);
  }

  return (
    <Screen tone="blue" testID="schedule-screen">
      <ScreenTitle title={t('schedule.title')} tone="blue" icon="schedule">
        <SegmentedControl
          onTint
          accessibilityLabel={t('schedule.title')}
          options={[
            { value: 'timetable', label: t('schedule.tabs.timetable') },
            { value: 'exams', label: t('schedule.tabs.exams') },
          ]}
          value={kind}
          onChange={setKind}
          testID="schedule-kind-toggle"
        />
      </ScreenTitle>
      <ScheduleView key={kind} scope={departmentId} kind={kind} />
    </Screen>
  );
}
