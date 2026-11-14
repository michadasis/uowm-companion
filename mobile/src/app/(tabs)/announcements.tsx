import { useTranslation } from 'react-i18next';

import { Screen, ScreenTitle, StateView } from '@/design';

export default function AnnouncementsScreen() {
  const { t } = useTranslation();
  return (
    <Screen testID="announcements-screen">
      <ScreenTitle title={t('announcements.title')} />
      <StateView
        kind="empty"
        icon="announcements"
        title={t('announcements.empty.title')}
        message={t('announcements.empty.message')}
      />
    </Screen>
  );
}
