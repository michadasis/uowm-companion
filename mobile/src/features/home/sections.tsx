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
import { formatClassTime, weekdayLabel } from '@/features/schedules/timetable';
import { useSchedule } from '@/features/schedules/useSchedule';
import { useMenu, todayName } from '@/features/menu/useMenu';
import { useSettings } from '@/features/settings/store';
import type { Language } from '@/features/settings/store';
import { useStudentCourses } from '@/features/universis/useStudentCourses';

import { EmptyHint } from './EmptyHint';
import { pickNextUp } from './nextUp';

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

function Meta({ icon, text }: { icon: 'location' | 'department'; text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.meta}>
      <Icon name={icon} size={14} color="textSubtle" />
      <Text variant="caption" color="textMuted" numberOfLines={1} style={styles.metaText}>
        {text}
      </Text>
    </View>
  );
}

/**
 * The student's next class or exam, whichever is sooner. The class comes from
 * the weekly timetable, so there is one to show all term — not only in the
 * weeks an exam schedule is out.
 */
export function NextUpSection({ scope }: { scope: string }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const router = useRouter();
  const styles = useStyles();
  const exams = useSchedule(scope, 'exams');
  const timetable = useSchedule(scope, 'timetable');
  const semester = useSettings((s) => s.semester);
  const { courses } = useStudentCourses();

  const next = pickNextUp({
    classes: timetable.data?.classes ?? [],
    exams: exams.data?.exams ?? [],
    courses,
    semester,
  });

  let body;
  if (exams.isLoading || timetable.isLoading) {
    body = <Loading />;
  } else if (next.kind === 'class') {
    const { session, daysAhead, inProgress } = next.upcoming;
    const when = inProgress
      ? t('home.nextUp.now')
      : daysAhead === 0
        ? t('home.nextUp.today')
        : daysAhead === 1
          ? t('home.nextUp.tomorrow')
          : weekdayLabel(session.day ?? 1, language);
    body = (
      <Card
        onPress={() => router.push({ pathname: '/schedule', params: { kind: 'timetable' } })}
        accessibilityLabel={session.course}
        style={styles.card}
      >
        <Text variant="label" color="primary">
          {[when, formatClassTime(session)].filter(Boolean).join(' · ')}
        </Text>
        <Text variant="heading" numberOfLines={2}>
          {session.course}
        </Text>
        {session.room ? <Meta icon="location" text={session.room} /> : null}
        {session.teacher ? <Meta icon="department" text={session.teacher} /> : null}
      </Card>
    );
  } else if (next.kind === 'exam') {
    const { exam } = next;
    body = (
      <Card
        onPress={() => router.push({ pathname: '/schedule', params: { kind: 'exams' } })}
        accessibilityLabel={exam.course}
        style={styles.card}
      >
        <Text variant="label" color="primary">
          {[
            t('home.nextUp.exam'),
            exam.date ? formatDayHeading(exam.date, language) : null,
            formatTimeRange(exam),
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <Text variant="heading" numberOfLines={2}>
          {exam.course}
        </Text>
        {exam.room ? <Meta icon="location" text={exam.room} /> : null}
      </Card>
    );
  } else {
    body = (
      <EmptyHint
        icon="schedule"
        text={next.personalised ? t('home.nextUp.empty') : t('home.nextUp.personalise')}
      />
    );
  }

  return (
    <View>
      <SectionHeader title={t('home.nextUp.title')} />
      {body}
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
  metaText: {
    flex: 1,
  },
  items: {
    gap: theme.spacing[1],
  },
  list: {
    gap: theme.spacing[3],
  },
}));
