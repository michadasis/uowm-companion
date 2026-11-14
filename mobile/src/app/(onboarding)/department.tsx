import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, createStyles, NavBar, Screen, ScreenTitle } from '@/design';
import { DepartmentPicker } from '@/features/departments/DepartmentPicker';
import { useDirectory } from '@/features/departments/useDirectory';
import { useSettings } from '@/features/settings/store';
import { haptics } from '@/lib/haptics';

export default function OnboardingDepartmentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useStyles();
  const directory = useDirectory();
  const setDepartment = useSettings((settings) => settings.setDepartment);
  // The choice is only saved on Continue. Saving it on the first tap would
  // end onboarding before the student had a chance to correct a slip.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Screen edges={['top', 'bottom']} testID="onboarding-department-screen">
      <NavBar title="" onBack={() => router.back()} backLabel={t('common.back')} />
      <DepartmentPicker
        directory={directory}
        selectedId={selectedId}
        onSelect={setSelectedId}
        header={
          <ScreenTitle
            title={t('departmentPicker.title')}
            subtitle={t('departmentPicker.subtitle')}
          />
        }
      />
      <View style={styles.footer}>
        <Button
          label={t('departmentPicker.continue')}
          disabled={selectedId === null}
          onPress={() => {
            if (selectedId === null) return;
            haptics.success();
            // Choosing a department is what ends onboarding: the root layout
            // swaps to the tabs as soon as one is stored.
            setDepartment(selectedId);
          }}
          testID="department-continue"
        />
      </View>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  footer: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
}));
