import { useTranslation } from 'react-i18next';

import { Screen, ScreenTitle, StateView } from '@/design';

export default function MenuScreen() {
  const { t } = useTranslation();
  return (
    <Screen testID="menu-screen">
      <ScreenTitle title={t('menu.title')} />
      <StateView
        kind="empty"
        icon="menu"
        title={t('menu.empty.title')}
        message={t('menu.empty.message')}
      />
    </Screen>
  );
}
