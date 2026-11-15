import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';

import {
  Button,
  Card,
  CardSkeleton,
  createStyles,
  OfflineNotice,
  SkeletonGroup,
  StateView,
  Text,
  useTheme,
} from '@/design';
import { formatUpdatedAt } from '@/features/announcements/format';
import { BlockRenderer } from '@/features/content/BlockRenderer';
import { openExternal } from '@/features/content/links';
import type { Language } from '@/features/settings/store';

import type { ScheduleKind } from './schema';
import { useSchedule } from './useSchedule';

export interface ScheduleViewProps {
  scope: string | null;
  kind: ScheduleKind;
}

/**
 * One schedule: the exam schedule or the timetable. For now it shows the
 * document rendered natively (the Original view) with a link to open the
 * source; the structured agenda goes above this once the parser lands.
 */
export function ScheduleView({ scope, kind }: ScheduleViewProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const { data, isLoading, isRefetching, refetch, fetchStatus, dataUpdatedAt } = useSchedule(
    scope,
    kind,
  );
  const offline = fetchStatus === 'paused';

  if (isLoading) {
    return (
      <SkeletonGroup accessibilityLabel={t('states.loading')} style={styles.loading}>
        <CardSkeleton />
        <CardSkeleton />
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

  if (!data.available || !data.document) {
    return (
      <StateView
        kind="empty"
        icon="schedule"
        title={t(`schedule.unavailable.${kind}.title`)}
        message={t(`schedule.unavailable.${kind}.message`)}
      />
    );
  }

  const document = data.document;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {offline ? (
        <OfflineNotice
          title={t('states.offline.notice')}
          detail={t('states.offline.lastUpdated', {
            time: formatUpdatedAt(dataUpdatedAt, i18n.language as Language),
          })}
        />
      ) : null}

      <Card style={styles.docCard}>
        <View style={styles.docText}>
          <Text variant="overline" color="textSubtle">
            {t(`schedule.original.${kind}`)}
          </Text>
          <Text variant="subheading" numberOfLines={2}>
            {document.label}
          </Text>
        </View>
        <Button
          label={t('schedule.viewDocument')}
          variant="secondary"
          icon="externalLink"
          onPress={() => openExternal(document.url)}
        />
      </Card>

      {data.original.length > 0 ? (
        <View style={styles.original}>
          <BlockRenderer blocks={data.original} onLinkPress={openExternal} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const useStyles = createStyles((theme) => ({
  loading: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    gap: theme.spacing[3],
  },
  content: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[10],
    gap: theme.spacing[4],
  },
  docCard: {
    gap: theme.spacing[3],
  },
  docText: {
    gap: theme.spacing[0.5],
  },
  original: {
    gap: theme.spacing[4],
  },
}));
