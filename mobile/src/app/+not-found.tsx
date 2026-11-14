import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, StateView } from '@/design';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Screen edges={['top', 'bottom']}>
      <StateView
        kind="empty"
        icon="search"
        title={t('notFound.title')}
        action={{ label: t('notFound.action'), onPress: () => router.replace('/') }}
      />
    </Screen>
  );
}
