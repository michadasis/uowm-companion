import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { createStyles, Screen, ScreenTitle, SegmentedControl } from '@/design';
import { AnnouncementsFeed } from '@/features/announcements/AnnouncementsFeed';
import { universityScope } from '@/features/announcements/useAnnouncements';
import { useSettings } from '@/features/settings/store';

type Feed = 'department' | 'university';

export default function AnnouncementsScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const departmentId = useSettings((settings) => settings.departmentId);
  const [feed, setFeed] = useState<Feed>('department');

  // departmentId is always set once onboarding is done, which the router
  // guarantees before this tab can be reached.
  const scope = feed === 'university' ? universityScope : (departmentId ?? universityScope);

  return (
    <Screen testID="announcements-screen">
      <ScreenTitle title={t('announcements.title')} />
      <View style={styles.tabs}>
        <SegmentedControl
          accessibilityLabel={t('announcements.title')}
          options={[
            { value: 'department', label: t('announcements.feeds.department') },
            { value: 'university', label: t('announcements.feeds.university') },
          ]}
          value={feed}
          onChange={setFeed}
          testID="announcements-feed-toggle"
        />
      </View>
      {/* Keyed by scope so switching feeds resets the list to the top. */}
      <AnnouncementsFeed key={scope} scope={scope} />
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  tabs: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[1],
    paddingBottom: theme.spacing[2],
  },
}));
