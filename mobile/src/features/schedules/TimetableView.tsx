import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { RefreshControlProps } from 'react-native';

import { Card, Chip, createStyles, Icon, Text, useTheme } from '@/design';
import type { Language } from '@/features/settings/store';

import type { ClassSession } from './schema';
import { byWeekday, formatClassTime, nowAndNext, todayWeekday, weekdayShort } from './timetable';

export interface TimetableViewProps {
  classes: ClassSession[];
  /** Rendered above the day selector, e.g. the link to the source document. */
  header?: ReactElement;
  refreshControl?: ReactElement<RefreshControlProps>;
  /** Injectable for tests; the current moment otherwise. */
  now?: Date;
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
        {status ? <StatusBadge status={status} /> : null}
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
export function TimetableView({ classes, header, refreshControl, now = new Date() }: TimetableViewProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const language = i18n.language as Language;

  const week = useMemo(() => byWeekday(classes), [classes]);
  const today = todayWeekday(now);
  const defaultDay = week.some((d) => d.day === today) ? today : (week[0]?.day ?? today);
  const [selectedDay, setSelectedDay] = useState(defaultDay);

  const selected = week.find((d) => d.day === selectedDay) ?? week[0];
  const dayClasses = selected?.classes ?? [];

  const isToday = selected?.day === today;
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
          <RefreshControl refreshing={false} tintColor={theme.colors.primary} onRefresh={() => {}} />
        )
      }
    >
      {header}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.days}
      >
        {week.map((day) => (
          <Chip
            key={day.day}
            label={weekdayShort(day.day, language)}
            selected={day.day === selectedDay}
            onPress={() => setSelectedDay(day.day)}
            testID={`timetable-day-${day.day}`}
          />
        ))}
      </ScrollView>

      <View style={styles.list}>
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
