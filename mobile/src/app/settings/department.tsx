import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { NavBar, Screen } from '@/design';
import { DepartmentPicker } from '@/features/departments/DepartmentPicker';
import { useDirectory } from '@/features/departments/useDirectory';
import { useSettings } from '@/features/settings/store';
import { haptics } from '@/lib/haptics';

export default function DepartmentSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const directory = useDirectory();
  const departmentId = useSettings((settings) => settings.departmentId);
  const setDepartment = useSettings((settings) => settings.setDepartment);

  return (
    <Screen edges={['top', 'bottom']} testID="settings-department-screen">
      <NavBar
        title={t('departmentPicker.settingsTitle')}
        onBack={() => router.back()}
        backLabel={t('common.back')}
      />
      <DepartmentPicker
        directory={directory}
        selectedId={departmentId}
        onSelect={(id) => {
          // Unlike onboarding, a tap here saves at once: the current choice
          // is visible, and choosing again is one tap away.
          if (id !== departmentId) {
            haptics.success();
            setDepartment(id);
          }
          router.back();
        }}
      />
    </Screen>
  );
}
