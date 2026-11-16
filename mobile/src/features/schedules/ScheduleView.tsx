import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
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
import { useSettings } from '@/features/settings/store';
import type { Language } from '@/features/settings/store';
import { CourseFilterBar } from '@/features/universis/CourseFilterBar';
import { filterByCourses, selectedCourseKeys } from '@/features/universis/match';
import { disconnectUniversis, useStudentCourses } from '@/features/universis/useStudentCourses';

import { ExamsAgenda } from './ExamsAgenda';
import type { ScheduleKind } from './schema';
import { TimetableView } from './TimetableView';
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
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles();
  const { data, isLoading, isRefetching, refetch, fetchStatus, dataUpdatedAt } = useSchedule(
    scope,
    kind,
  );
  const offline = fetchStatus === 'paused';

  const courseFilter = useSettings((s) => s.courseFilter);
  const setCourseFilter = useSettings((s) => s.setCourseFilter);
  const student = useStudentCourses();
  // Only narrow once there are courses to narrow by. A read still in flight, or
  // one that failed, leaves the whole schedule showing — never an empty one.
  const courseKeys = student.courses ? selectedCourseKeys(student.courses, courseFilter) : null;

  const courseFilterBar = (
    <CourseFilterBar
      status={
        student.courses
          ? 'ready'
          : !student.connected
            ? 'disconnected'
            : student.isError
              ? 'error'
              : 'loading'
      }
      expired={student.expired}
      updatedAt={student.updatedAt}
      filter={courseFilter}
      onFilter={setCourseFilter}
      onConnect={() => router.push('/universis-login' as Href)}
      onRetry={student.refetch}
      onDisconnect={() => void disconnectUniversis()}
    />
  );

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
  const refreshControl = (
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={() => void refetch()}
      tintColor={theme.colors.primary}
      colors={[theme.colors.primary]}
    />
  );
  const offlineNotice = offline ? (
    <OfflineNotice
      title={t('states.offline.notice')}
      detail={t('states.offline.lastUpdated', {
        time: formatUpdatedAt(dataUpdatedAt, i18n.language as Language),
      })}
    />
  ) : null;
  const documentCard = (
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
  );

  // When the document parsed into structured items, those are the screen; the
  // source document stays one tap away at the top. Otherwise the document
  // itself, rendered natively, is the screen.
  const structuredHeader = (
    <View style={styles.agendaHeader}>
      {offlineNotice}
      {documentCard}
      {courseFilterBar}
    </View>
  );

  if (kind === 'exams' && data.exams.length > 0) {
    return (
      <ExamsAgenda
        exams={filterByCourses(data.exams, courseKeys)}
        refreshControl={refreshControl}
        header={structuredHeader}
      />
    );
  }

  if (kind === 'timetable' && data.classes.length > 0) {
    return (
      <TimetableView
        classes={filterByCourses(data.classes, courseKeys)}
        personalised={courseKeys !== null}
        refreshControl={refreshControl}
        header={structuredHeader}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {offlineNotice}
      {documentCard}
      {courseFilterBar}
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
  agendaHeader: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
    gap: theme.spacing[3],
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
