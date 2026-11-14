import { useTranslation } from 'react-i18next';

import { Screen, ScreenTitle, StateView } from '@/design';

export default function ScheduleScreen() {
  const { t } = useTranslation();
  return (
    <Screen testID="schedule-screen">
      <ScreenTitle title={t('schedule.title')} />
      <StateView
        kind="empty"
        icon="schedule"
        title={t('schedule.empty.title')}
        message={t('schedule.empty.message')}
      />
    </Screen>
  );
}
