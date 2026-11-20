import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Screen, ScreenTitle, SegmentedControl } from '@/design';
import { AnnouncementsFeed } from '@/features/announcements/AnnouncementsFeed';
import { universityScope } from '@/features/announcements/useAnnouncements';
import { useSettings } from '@/features/settings/store';

type Feed = 'department' | 'university';

export default function AnnouncementsScreen() {
  const { t } = useTranslation();
  const departmentId = useSettings((settings) => settings.departmentId);
  const [feed, setFeed] = useState<Feed>('department');

  // departmentId is always set once onboarding is done, which the router
  // guarantees before this tab can be reached.
  const scope = feed === 'university' ? universityScope : (departmentId ?? universityScope);

  return (
    <Screen tone="green" testID="announcements-screen">
      <ScreenTitle title={t('announcements.title')} tone="green" icon="announcements">
        <SegmentedControl
          onTint
          accessibilityLabel={t('announcements.title')}
          options={[
            { value: 'department', label: t('announcements.feeds.department') },
            { value: 'university', label: t('announcements.feeds.university') },
          ]}
          value={feed}
          onChange={setFeed}
          testID="announcements-feed-toggle"
        />
      </ScreenTitle>
      {/* Keyed by scope so switching feeds resets the list to the top. */}
      <AnnouncementsFeed key={scope} scope={scope} />
    </Screen>
  );
}
