import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  Card,
  createStyles,
  Icon,
  ListRowSkeleton,
  SectionHeader,
  SkeletonGroup,
  Text,
} from '@/design';
import { AnnouncementCard } from '@/features/announcements/AnnouncementCard';
import { useAnnouncements } from '@/features/announcements/useAnnouncements';
import { formatDayHeading, formatTimeRange } from '@/features/schedules/agenda';
import { nextExam } from '@/features/schedules/nextExam';
import { useSchedule } from '@/features/schedules/useSchedule';
import { useMenu, todayName } from '@/features/menu/useMenu';
import type { Language } from '@/features/settings/store';

import { EmptyHint } from './EmptyHint';

function Loading() {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <SkeletonGroup accessibilityLabel={t('states.loading')} style={styles.card}>
      <Card padded={false}>
        <ListRowSkeleton />
      </Card>
    </SkeletonGroup>
  );
}

export function NextUpSection({ scope }: { scope: string }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const styles = useStyles();
  const { data, isLoading } = useSchedule(scope, 'exams');
  const exam = data ? nextExam(data.exams) : undefined;

  return (
    <View>
      <SectionHeader title={t('home.nextUp.title')} />
      {isLoading ? (
        <Loading />
      ) : exam ? (
        <Card
          onPress={() => router.push('/schedule')}
          accessibilityLabel={exam.course}
          style={styles.card}
        >
          <Text variant="label" color="primary">
            {[
              exam.date ? formatDayHeading(exam.date, i18n.language as Language) : null,
              formatTimeRange(exam),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Text variant="heading" numberOfLines={2}>
            {exam.course}
          </Text>
          {exam.room ? (
            <View style={styles.meta}>
              <Icon name="location" size={14} color="textSubtle" />
              <Text variant="caption" color="textMuted">
                {exam.room}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : (
        <EmptyHint icon="schedule" text={t('home.nextUp.empty')} />
      )}
    </View>
  );
}

export function TodayMenuSection() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const router = useRouter();
  const styles = useStyles();
  const { data, isLoading } = useMenu();

  const today = data?.days.find((day) => day.day === todayName());
  const mains = today?.lunch.main ?? [];

  return (
    <View>
      <SectionHeader title={t('home.menuToday.title')} />
      {isLoading ? (
        <Loading />
      ) : mains.length > 0 ? (
        <Card
          onPress={() => router.push('/menu')}
          accessibilityLabel={t('home.menuToday.title')}
          style={styles.card}
        >
          <Text variant="overline" color="primary">
            {t('menu.meals.lunch')}
          </Text>
          <View style={styles.items}>
            {mains.map((item, index) => (
              <Text key={index} variant="body" numberOfLines={1}>
                {language === 'en' ? item.en || item.el : item.el}
              </Text>
            ))}
          </View>
        </Card>
      ) : (
        <EmptyHint icon="menu" text={t('home.menuToday.empty')} />
      )}
    </View>
  );
}

export function LatestAnnouncementsSection({ scope }: { scope: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useStyles();
  const { data, isLoading } = useAnnouncements(scope);
  const latest = data?.announcements.slice(0, 3) ?? [];

  return (
    <View>
      <SectionHeader title={t('home.latest.title')} />
      {isLoading ? (
        <Loading />
      ) : latest.length > 0 ? (
        <View style={styles.list}>
          {latest.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onPress={() =>
                router.push({ pathname: '/announcement/[id]', params: { id: announcement.id } })
              }
            />
          ))}
        </View>
      ) : (
        <EmptyHint icon="announcements" text={t('home.latest.empty')} />
      )}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    marginHorizontal: theme.spacing[4],
    gap: theme.spacing[2],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  items: {
    gap: theme.spacing[1],
  },
  list: {
    gap: theme.spacing[3],
  },
}));
