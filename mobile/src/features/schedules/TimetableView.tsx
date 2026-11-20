import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { RefreshControlProps } from 'react-native';

import { displayNumeral } from '@/lib/greek';
import { Card, Chip, createStyles, DayStripButton, Icon, Text, useTheme } from '@/design';
import { weekDates } from '@/features/calendar/status';
import type { Language } from '@/features/settings/store';
import { useSettings } from '@/features/settings/store';

import type { ClassSession } from './schema';
import {
  byWeekday,
  formatClassTime,
  groupOf,
  nowAndNext,
  PDE_GROUP,
  semestersOf,
  todayWeekday,
  weekdayShort,
} from './timetable';

export interface TimetableViewProps {
  classes: ClassSession[];
  /**
   * True when the classes are already narrowed to the student's own courses.
   * The semester filter then steps aside: it would be redundant, & would hide
   * a course the student owes from another semester.
   */
  personalised?: boolean;
  /** Rendered above the day selector, e.g. the link to the source document. */
  header?: ReactElement;
  refreshControl?: ReactElement<RefreshControlProps>;
  /** Injectable for tests; the current moment otherwise. */
  now?: Date;
  /**
   * Why there are no classes on a day of the week shown, from the academic
   * calendar — a holiday, the exams — or null when they are held.
   */
  dayOff?: (date: Date) => string | null;
}

type Status = 'now' | 'next' | undefined;

function StatusBadge({ status }: { status: Exclude<Status, undefined> }) {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <View style={[styles.badge, status === 'now' ? styles.badgeNow : styles.badgeNext]}>
      <Text variant="overline" color={status === 'now' ? 'onPrimary' : 'primary'}>
        {t(`schedule.timetableView.${status}`)}
      </Text>
    </View>
  );
}

function ClassCard({ session, status }: { session: ClassSession; status: Status }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const time = formatClassTime(session);
  const typeLabel =
    session.type === 'lab' || session.type === 'tutorial'
      ? t(`schedule.timetableView.types.${session.type}`)
      : null;

  return (
    <Card style={[styles.card, status === 'now' ? styles.cardNow : null]}>
      <View style={styles.cardTop}>
        {time ? (
          <Text variant="label" color="primary">
            {time}
          </Text>
        ) : null}
        <View style={styles.cardTopRight}>
          {session.track === 'pde' ? (
            <Text variant="caption" color="textSubtle">
              {t('schedule.timetableView.pde')}
            </Text>
          ) : session.semester ? (
            <Text variant="caption" color="textSubtle">
              {displayNumeral(t('schedule.semester', { semester: session.semester }))}
            </Text>
          ) : null}
          {status ? <StatusBadge status={status} /> : null}
        </View>
      </View>
      <Text variant="subheading" numberOfLines={3}>
        {session.course}
      </Text>
      <View style={styles.meta}>
        {session.room ? (
          <View style={styles.metaItem}>
            <Icon name="location" size={14} color="textSubtle" />
            <Text variant="caption" color="textMuted" numberOfLines={1} style={styles.metaText}>
              {session.room}
            </Text>
          </View>
        ) : null}
        {session.teacher ? (
          <View style={styles.metaItem}>
            <Icon name="department" size={14} color="textSubtle" />
            <Text variant="caption" color="textMuted" numberOfLines={1} style={styles.metaText}>
              {session.teacher}
            </Text>
          </View>
        ) : null}
        {typeLabel ? (
          <View style={styles.typePill}>
            <Text variant="overline" color="textSubtle">
              {typeLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

/** The timetable as a day at a time, with a chip per weekday that has classes. */
export function TimetableView({
  classes,
  personalised = false,
  header,
  refreshControl,
  now = new Date(),
  dayOff,
}: TimetableViewProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const language = i18n.language as Language;

  const savedSemester = useSettings((s) => s.semester);
  const setSemester = useSettings((s) => s.setSemester);

  const semesters = useMemo(() => semestersOf(classes), [classes]);
  // Keep to the saved semester only while it is one these classes offer, so a
  // stale pick from another department does not empty the screen.
  const activeSemester =
    !personalised && savedSemester && semesters.includes(savedSemester) ? savedSemester : null;
  const shown = useMemo(
    () => (activeSemester ? classes.filter((c) => groupOf(c) === activeSemester) : classes),
    [classes, activeSemester],
  );

  const week = useMemo(() => byWeekday(shown), [shown]);
  const today = todayWeekday(now);
  const [selectedDay, setSelectedDay] = useState(() =>
    week.some((d) => d.day === today) ? today : (week[0]?.day ?? today),
  );
  // The chosen day may vanish when the semester filter changes; fall back
  // rather than show an empty day with no chip selected.
  const effectiveDay = week.some((d) => d.day === selectedDay)
    ? selectedDay
    : (week[0]?.day ?? selectedDay);

  const selected = week.find((d) => d.day === effectiveDay);
  const dayClasses = selected?.classes ?? [];

  const dates = useMemo(() => weekDates(now), [now]);
  const offReason = (day: number) => {
    const date = dates.get(day);
    return date && dayOff ? dayOff(date) : null;
  };
  const selectedOff = selected ? offReason(selected.day) : null;

  const isToday = selected?.day === today && today <= 5;
  const { nowIndex, nextIndex } = isToday
    ? nowAndNext(dayClasses, now.getHours() * 60 + now.getMinutes())
    : { nowIndex: -1, nextIndex: -1 };

  const statusAt = (index: number): Status =>
    index === nowIndex ? 'now' : index === nextIndex && nowIndex === -1 ? 'next' : undefined;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        refreshControl ?? (
          <RefreshControl
            refreshing={false}
            tintColor={theme.colors.primary}
            onRefresh={() => {}}
          />
        )
      }
    >
      {header}
      {!personalised && semesters.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.days}
        >
          <Chip
            label={t('schedule.timetableView.allSemesters')}
            selected={activeSemester === null}
            onPress={() => setSemester(null)}
            testID="timetable-semester-all"
          />
          {semesters.map((semester) => (
            <Chip
              key={semester}
              label={
                semester === PDE_GROUP
                  ? t('schedule.timetableView.pde')
                  : displayNumeral(t('schedule.semester', { semester }))
              }
              selected={activeSemester === semester}
              onPress={() => setSemester(semester)}
              testID={`timetable-semester-${semester}`}
            />
          ))}
        </ScrollView>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.days}
      >
        {week.map((day) => (
          <DayStripButton
            key={day.day}
            label={weekdayShort(day.day, language)}
            date={dayOff ? dates.get(day.day) : undefined}
            selected={day.day === effectiveDay}
            today={day.day === today}
            off={offReason(day.day) !== null}
            onPress={() => setSelectedDay(day.day)}
            testID={`timetable-day-${day.day}`}
          />
        ))}
      </ScrollView>

      {selectedOff ? (
        <View style={styles.offNotice} testID="timetable-day-off">
          <Text variant="label" color="onSuccessMuted">
            {selectedOff}
          </Text>
          <Text variant="caption" color="onSuccessMuted">
            {t('calendar.noClassesThatDay')}
          </Text>
        </View>
      ) : null}
      <View style={[styles.list, selectedOff ? styles.listOff : null]}>
        {dayClasses.length > 0 ? (
          dayClasses.map((session, index) => (
            <ClassCard
              key={`${session.course}:${session.startTime ?? index}`}
              session={session}
              status={statusAt(index)}
            />
          ))
        ) : (
          <Text variant="body" color="textMuted" style={styles.empty}>
            {t('schedule.timetableView.noClasses')}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const useStyles = createStyles((theme) => ({
  content: {
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[10],
    gap: theme.spacing[3],
  },
  days: {
    paddingHorizontal: theme.spacing[4],
    gap: theme.spacing[2],
  },
  list: {
    paddingHorizontal: theme.spacing[4],
    gap: theme.spacing[3],
  },
  // A day without classes keeps its usual timetable in view, faded.
  listOff: {
    opacity: 0.72,
  },
  offNotice: {
    marginHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.successMuted,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    gap: theme.spacing[0.5],
  },
  card: {
    gap: theme.spacing[2],
  },
  cardNow: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  badge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[0.5],
    borderRadius: theme.radius.full,
  },
  badgeNow: {
    backgroundColor: theme.colors.primary,
  },
  badgeNext: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  meta: {
    gap: theme.spacing[1],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  metaText: {
    flex: 1,
  },
  typePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[0.5],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceMuted,
  },
  empty: {
    paddingVertical: theme.spacing[6],
    textAlign: 'center',
  },
}));
