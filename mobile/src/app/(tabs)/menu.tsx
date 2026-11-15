import { useTranslation } from 'react-i18next';

import { Screen, ScreenTitle } from '@/design';
import { MenuView } from '@/features/menu/MenuView';

export default function MenuScreen() {
  const { t } = useTranslation();
  return (
    <Screen testID="menu-screen">
      <ScreenTitle title={t('menu.title')} />
      <MenuView />
    </Screen>
  );
}
