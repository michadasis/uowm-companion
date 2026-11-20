import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BrandMark, createStyles, Text, useToneColors } from '@/design';
import type { ScreenTone } from '@/design';
import { dayStatus } from '@/features/calendar/status';
import { useCalendar } from '@/features/calendar/useCalendar';
import { useSavedCourses } from '@/features/universis/saved';
import { greetingName } from '@/lib/greekName';

import { formatToday } from './greeting';
import { todayMessage } from './today';
import type { TodayMessage, TodayTone } from './today';

/** What today is, in words, from the academic calendar — the greeting while it loads. */
export function useToday(now: Date, city: string | null): TodayMessage {
  const { t, i18n } = useTranslation();
  const { data: calendar } = useCalendar();
  const givenName = useSavedCourses((s) => s.givenName);
  const status = calendar ? dayStatus(calendar, now, city) : null;
  const name = greetingName(givenName);
  // In English, a Greek name in the middle of the greeting would mix scripts.
  const usable = name && (i18n.language === 'el' || !/[Α-Ωα-ωΆ-ώ]/u.test(name)) ? name : null;
  return todayMessage(status, now, i18n.language, t, usable);
}

/** The colour the day's band takes: green for a day off, blue for study, amber otherwise. */
export function toneOfDay(tone: TodayTone): ScreenTone {
  return tone === 'rest' ? 'green' : tone === 'study' ? 'blue' : 'amber';
}

export interface TodayHeroProps {
  now: Date;
  today: TodayMessage;
  /** "Πληροφορικής · Σχολή Θετικών Επιστημών · Καστοριά". */
  departmentLine?: string;
}

/**
 * The top of the Home screen, on a band of the day's colour: today's date & a
 * few words about the day — a holiday, the break, the exams, the weekend, or
 * simply a greeting — with the knot large & faint behind them.
 */
export function TodayHero({ now, today, departmentLine }: TodayHeroProps) {
  const { i18n } = useTranslation();
  const styles = useStyles();
  const { band, ink } = useToneColors(toneOfDay(today.tone));

  return (
    <View style={[styles.hero, { backgroundColor: band }]} testID="home-today">
      <View style={styles.watermark} pointerEvents="none">
        <BrandMark size={210} />
      </View>
      <View style={styles.dateRow}>
        <BrandMark size={22} />
        <Text variant="label" style={{ color: ink }}>
          {formatToday(now, i18n.language)}
        </Text>
      </View>
      {today.badge ? (
        <View style={styles.badge}>
          <Text variant="label" style={{ color: ink }}>
            {today.badge}
          </Text>
        </View>
      ) : null}
      <Text variant="display" accessibilityRole="header">
        {today.title}
      </Text>
      {today.message ? (
        <Text variant="body" style={{ color: ink }}>
          {today.message}
        </Text>
      ) : null}
      {departmentLine ? (
        <Text variant="caption" style={[styles.department, { color: ink }]} numberOfLines={1}>
          {departmentLine}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  hero: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[5],
    paddingBottom: theme.spacing[6],
    gap: theme.spacing[2],
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: -56,
    top: -24,
    opacity: theme.scheme === 'dark' ? 0.1 : 0.14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[1],
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.full,
    backgroundColor: theme.scheme === 'dark' ? 'rgba(0, 0, 0, 0.28)' : 'rgba(255, 255, 255, 0.6)',
  },
  department: {
    opacity: 0.8,
  },
}));
