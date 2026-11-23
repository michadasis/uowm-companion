import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import {
  Card,
  createStyles,
  Icon,
  ListRow,
  ListRowSkeleton,
  SectionHeader,
  SkeletonGroup,
  Text,
} from '@/design';
import { formatListDate } from '@/features/announcements/format';
import { useAnnouncements } from '@/features/announcements/useAnnouncements';
import { isoDay, isTeachingDay } from '@/features/calendar/status';
import { useCalendar } from '@/features/calendar/useCalendar';
import { formatDayHeading } from '@/features/schedules/agenda';
import { formatClassTime, weekdayLabel } from '@/features/schedules/timetable';
import { useSchedule } from '@/features/schedules/useSchedule';
import { daysForDate } from '@/features/menu/cycle';
import { closureMessage, closureOn } from '@/features/menu/closure';
import { mealFor } from '@/features/menu/hours';
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
 * A class or an exam with its time set apart on the left, the way a diary
 * reads: when first, then what & where.
 */
function NextCard({
  time,
  when,
  title,
  room,
  teacher,
  tag,
  onPress,
}: {
  time: string;
  when: string;
  title: string;
  room?: string;
  teacher?: string;
  tag?: string;
  onPress: () => void;
}) {
  const styles = useStyles();
  return (
    <Card onPress={onPress} accessibilityLabel={`${when} ${time}, ${title}`} style={styles.card}>
      <View style={styles.next}>
        <View style={styles.when}>
          <Text variant="heading">{time}</Text>
          <Text variant="caption" color="primary" numberOfLines={2}>
            {when}
          </Text>
        </View>
        <View style={styles.rule} />
        <View style={styles.what}>
          {tag ? (
            <Text variant="label" color="primary">
              {tag}
            </Text>
          ) : null}
          <Text variant="subheading" numberOfLines={2}>
            {title}
          </Text>
          {room ? <Meta icon="location" text={room} /> : null}
          {teacher ? <Meta icon="department" text={teacher} /> : null}
        </View>
      </View>
    </Card>
  );
}

/**
 * The student's next class or exam, whichever is sooner. The class comes from
 * the weekly timetable & skips the days the academic calendar has no classes
 * — holidays, the breaks, the exam periods.
 */
export function NextUpSection({
  scope,
  city,
  now = new Date(),
}: {
  scope: string;
  city: string | null;
  now?: Date;
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const router = useRouter();
  const exams = useSchedule(scope, 'exams');
  const timetable = useSchedule(scope, 'timetable');
  const { data: calendar } = useCalendar();
  const semester = useSettings((s) => s.semester);
  const { courses } = useStudentCourses();

  const next = pickNextUp({
    classes: timetable.data?.classes ?? [],
    exams: exams.data?.exams ?? [],
    courses,
    semester,
    isTeachingDay: calendar ? (date) => isTeachingDay(calendar, date, city) : undefined,
    now,
  });

  let body;
  if (exams.isLoading || timetable.isLoading) {
    body = <Loading />;
  } else if (next.kind === 'class') {
    const { session, daysAhead, inProgress } = next.upcoming;
    const date = new Date(now);
    date.setDate(date.getDate() + daysAhead);
    const when = inProgress
      ? t('home.nextUp.now')
      : daysAhead === 0
        ? t('home.nextUp.today')
        : daysAhead === 1
          ? t('home.nextUp.tomorrow')
          : daysAhead < 7
            ? weekdayLabel(session.day ?? 1, language)
            : (formatDayHeading(isoDay(date), language) ?? '');
    body = (
      <NextCard
        time={session.startTime ?? formatClassTime(session) ?? '—'}
        when={when}
        title={session.course}
        room={session.room ?? undefined}
        teacher={session.teacher ?? undefined}
        onPress={() => router.push({ pathname: '/schedule', params: { kind: 'timetable' } })}
      />
    );
  } else if (next.kind === 'exam') {
    const { exam } = next;
    body = (
      <NextCard
        time={exam.startTime ?? '—'}
        when={exam.date ? (formatDayHeading(exam.date, language) ?? '') : ''}
        title={exam.course}
        room={exam.room ?? undefined}
        tag={t('home.nextUp.exam')}
        onPress={() => router.push({ pathname: '/schedule', params: { kind: 'exams' } })}
      />
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

export function TodayMenuSection({ city }: { city: string | null }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const router = useRouter();
  const styles = useStyles();
  const { data, isLoading } = useMenu();

  const now = new Date();
  const today = data ? daysForDate(data, now).find((day) => day.day === todayName(now)) : undefined;
  // The meal being served, or the next one. Breakfast is the same every day,
  // so it is shown a line per group rather than dish by dish.
  const meal = mealFor(now);
  const text = (item: { el: string; en: string }) =>
    language === 'en' ? item.en || item.el : item.el;
  const lines =
    meal === 'breakfast'
      ? (data?.breakfast ?? []).map((group) => group.items.map(text).join(', '))
      : (today?.[meal].main ?? []).map(text);
  // Over a break the food may be on the menu with no one serving it.
  const { data: calendar } = useCalendar();
  const closure = calendar ? closureOn(calendar, now, city) : null;

  return (
    <View>
      <SectionHeader
        title={t('home.menuToday.title')}
        action={{ label: t('home.menuToday.all'), onPress: () => router.push('/menu') }}
      />
      {isLoading ? (
        <Loading />
      ) : closure ? (
        <EmptyHint icon="date" text={closureMessage(closure, t)} />
      ) : lines.length > 0 ? (
        <Card
          onPress={() => router.push('/menu')}
          accessibilityLabel={t('home.menuToday.title')}
          style={styles.card}
        >
          <Text variant="label" color="primary">
            {t(`menu.meals.${meal}`)}
          </Text>
          <View style={styles.items}>
            {lines.map((line, index) => (
              <Text key={index} variant="body" numberOfLines={1}>
                {line}
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
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const styles = useStyles();
  const { data, isLoading } = useAnnouncements(scope);
  // Two, as lines: Home points to the news, the News tab is where it is read.
  const latest = data?.announcements.slice(0, 2) ?? [];

  return (
    <View>
      <SectionHeader
        title={t('home.latest.title')}
        action={{ label: t('home.latest.all'), onPress: () => router.push('/announcements') }}
      />
      {isLoading ? (
        <Loading />
      ) : latest.length > 0 ? (
        <Card padded={false} style={styles.card}>
          {latest.map((announcement, index) => (
            <View key={announcement.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <ListRow
                title={announcement.title}
                subtitle={formatListDate(announcement.date, i18n.language) ?? undefined}
                trailing="chevron"
                onPress={() =>
                  router.push({ pathname: '/announcement/[id]', params: { id: announcement.id } })
                }
              />
            </View>
          ))}
        </Card>
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
  next: {
    flexDirection: 'row',
    gap: theme.spacing[4],
  },
  when: {
    width: 72,
    gap: theme.spacing[0.5],
  },
  rule: {
    width: 3,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand,
  },
  what: {
    flex: 1,
    gap: theme.spacing[1],
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
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: theme.spacing[4],
    backgroundColor: theme.colors.border,
  },
}));
