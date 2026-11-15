import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, View } from 'react-native';

import {
  createStyles,
  OfflineNotice,
  SearchField,
  SkeletonGroup,
  CardSkeleton,
  StateView,
  useTheme,
} from '@/design';
import type { Language } from '@/features/settings/store';
import { fold } from '@/lib/greek';

import { AnnouncementCard } from './AnnouncementCard';
import { formatUpdatedAt } from './format';
import type { Announcement } from './schema';
import { useAnnouncements } from './useAnnouncements';
import type { Scope } from './useAnnouncements';

export interface AnnouncementsFeedProps {
  scope: Scope;
}

function matches(announcement: Announcement, words: string[]): boolean {
  if (words.length === 0) return true;
  const haystack = fold(`${announcement.title} ${announcement.excerpt}`);
  return words.every((word) => haystack.includes(word));
}

export function AnnouncementsFeed({ scope }: AnnouncementsFeedProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const { data, isLoading, isRefetching, refetch, fetchStatus, dataUpdatedAt } =
    useAnnouncements(scope);
  const offline = fetchStatus === 'paused';

  if (isLoading) {
    return (
      <SkeletonGroup accessibilityLabel={t('states.loading')} style={styles.loading}>
        {[0, 1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </SkeletonGroup>
    );
  }

  if (!data) {
    return (
      <StateView
        kind={offline ? 'offline' : 'error'}
        title={offline ? t('states.offline.title') : t('states.error.title')}
        message={offline ? t('states.offline.message') : t('states.error.message')}
        action={{ label: t('states.error.retry'), onPress: () => void refetch() }}
      />
    );
  }

  const words = fold(query).split(' ').filter(Boolean);
  const results = data.announcements.filter((announcement) => matches(announcement, words));

  return (
    <FlashList
      data={results}
      extraData={i18n.language}
      keyExtractor={(announcement) => announcement.id}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          {offline ? (
            <OfflineNotice
              title={t('states.offline.notice')}
              detail={t('states.offline.lastUpdated', {
                time: formatUpdatedAt(dataUpdatedAt, i18n.language as Language),
              })}
            />
          ) : null}
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder={t('announcements.search')}
            clearLabel={t('departmentPicker.clearSearch')}
            testID="announcements-search"
          />
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <StateView
            kind="empty"
            icon={query ? 'search' : 'announcements'}
            title={query ? t('announcements.noResults.title') : t('announcements.empty.title')}
            message={
              query ? t('announcements.noResults.message') : t('announcements.empty.message')
            }
          />
        </View>
      }
      renderItem={({ item }) => (
        <AnnouncementCard
          announcement={item}
          onPress={() => router.push({ pathname: '/announcement/[id]', params: { id: item.id } })}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const useStyles = createStyles((theme) => ({
  content: {
    paddingBottom: theme.spacing[8],
  },
  loading: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    gap: theme.spacing[3],
  },
  header: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[3],
    gap: theme.spacing[3],
  },
  separator: {
    height: theme.spacing[3],
  },
  empty: {
    paddingTop: theme.spacing[10],
  },
}));
