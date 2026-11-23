import { Screen } from '@/design';
import { findDepartment, useDirectory } from '@/features/departments/useDirectory';
import { MenuView } from '@/features/menu/MenuView';
import { useSettings } from '@/features/settings/store';
import { usePreviewNow } from '@/lib/usePreviewNow';

export default function MenuScreen() {
  const now = usePreviewNow();
  const directory = useDirectory();
  const departmentId = useSettings((settings) => settings.departmentId);
  const city = findDepartment(directory, departmentId)?.city ?? null;
  return (
    <Screen tone="amber" testID="menu-screen">
      <MenuView now={now} city={city} />
    </Screen>
  );
}
