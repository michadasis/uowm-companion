import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BrandMark, createStyles, Text } from '@/design';
import type { TextColor } from '@/design';
import { useCalendar } from '@/features/calendar/useCalendar';
import { dayStatus } from '@/features/calendar/status';

import { formatToday } from './greeting';
import { todayMessage } from './today';
import type { TodayTone } from './today';

export interface TodayHeroProps {
  now: Date;
  /** The department's city, for the holidays only it keeps. */
  city: string | null;
  /** "Σχολή Θετικών Επιστημών · Καστοριά", when the day has nothing to say. */
  departmentLine?: string;
}

const badgeColors: Record<
  TodayTone,
  { background: 'successMuted' | 'primaryMuted' | 'accentMuted' | 'surfaceMuted'; text: TextColor }
> = {
  rest: { background: 'successMuted', text: 'onSuccessMuted' },
  exams: { background: 'primaryMuted', text: 'onPrimaryMuted' },
  study: { background: 'accentMuted', text: 'onAccentMuted' },
  calm: { background: 'surfaceMuted', text: 'textMuted' },
};

/**
 * The top of the Home screen: today's date & a few words about the day — a
 * holiday, the break, the exams, the weekend, or simply a greeting — from the
 * university's academic calendar.
 */
export function TodayHero({ now, city, departmentLine }: TodayHeroProps) {
  const { t, i18n } = useTranslation();
  const styles = useStyles();
  const { data: calendar } = useCalendar();
  const status = calendar ? dayStatus(calendar, now, city) : null;
  const { badge, tone, title, message } = todayMessage(status, now, i18n.language, t);
  const colors = badgeColors[tone];

  return (
    <View style={styles.hero} testID="home-today">
      <View style={styles.dateRow}>
        <BrandMark size={22} />
        <Text variant="label" color="textMuted">
          {formatToday(now, i18n.language)}
        </Text>
      </View>
      {badge ? (
        <View style={[styles.badge, styles[colors.background]]}>
          <Text variant="label" color={colors.text}>
            {badge}
          </Text>
        </View>
      ) : null}
      <Text variant="display" accessibilityRole="header">
        {title}
      </Text>
      {message ? (
        <Text variant="body" color="textMuted">
          {message}
        </Text>
      ) : null}
      {departmentLine ? (
        <Text variant="caption" color="textSubtle" numberOfLines={1}>
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
    paddingBottom: theme.spacing[2],
    gap: theme.spacing[2],
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
  },
  successMuted: { backgroundColor: theme.colors.successMuted },
  primaryMuted: { backgroundColor: theme.colors.primaryMuted },
  accentMuted: { backgroundColor: theme.colors.accentMuted },
  surfaceMuted: { backgroundColor: theme.colors.surfaceMuted },
}));
