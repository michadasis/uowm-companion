import { Screen } from '@/design';
import { MenuView } from '@/features/menu/MenuView';
import { usePreviewNow } from '@/lib/usePreviewNow';

export default function MenuScreen() {
  const now = usePreviewNow();
  return (
    <Screen tone="amber" testID="menu-screen">
      <MenuView now={now} />
    </Screen>
  );
}
