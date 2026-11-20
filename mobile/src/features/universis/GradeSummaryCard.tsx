import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Card, createStyles, Text, useTheme } from '@/design';

import type { GradeSummary } from './grades';

// The ring is an open arc, three quarters of a circle with its gap at the
// bottom, filled in proportion to the average out of 10.
const sweep = 270;

function arcPath(size: number, stroke: number, fraction: number): string {
  const radius = (size - stroke) / 2;
  const centre = size / 2;
  const start = 135; // degrees, clockwise from the right: bottom left
  const end = start + sweep * Math.min(Math.max(fraction, 0), 1);
  const point = (degrees: number) => {
    const radians = (degrees * Math.PI) / 180;
    return `${centre + radius * Math.cos(radians)} ${centre + radius * Math.sin(radians)}`;
  };
  const large = end - start > 180 ? 1 : 0;
  return `M ${point(start)} A ${radius} ${radius} 0 ${large} 1 ${point(end)}`;
}

/** The average out of 10 as a gauge, its whole part large & its decimals small. */
export function GradeRing({ average, size = 104 }: { average: number | null; size?: number }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const stroke = 9;
  const [whole, decimals] = (average ?? 0)
    .toLocaleString(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .split(/[,.]/);
  const separator = i18n.language === 'el' ? ',' : '.';

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityLabel={
        average === null
          ? t('universis.grades.noAverage')
          : `${t('universis.grades.average')}: ${whole}${separator}${decimals}`
      }
    >
      <Svg width={size} height={size}>
        <Path
          d={arcPath(size, stroke, 1)}
          stroke={theme.colors.surfaceMuted}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        {average !== null ? (
          <Path
            d={arcPath(size, stroke, average / 10)}
            stroke={theme.colors.brand}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
      </Svg>
      <View style={styles.ringText}>
        {average !== null ? (
          <Text variant="display" style={styles.whole}>
            {whole}
            <Text variant="heading" style={styles.decimals}>
              {separator}
              {decimals}
            </Text>
          </Text>
        ) : (
          <Text variant="display">—</Text>
        )}
        <Text variant="caption" color="textMuted">
          {t('universis.grades.averageShort')}
        </Text>
      </View>
    </View>
  );
}

export interface GradeSummaryCardProps {
  summary: GradeSummary;
  /** Makes the card open the grades screen. */
  onPress?: () => void;
}

/** The student's average as a ring, beside their ECTS & the courses passed. */
export function GradeSummaryCard({ summary, onPress }: GradeSummaryCardProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <Card
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={onPress ? t('universis.grades.title') : undefined}
      testID="grade-summary"
    >
      <GradeRing average={summary.average} />
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text variant="caption" color="textMuted">
            {t('universis.grades.ects')}
          </Text>
          <Text variant="title">{summary.ects}</Text>
        </View>
        <View style={styles.stat}>
          <Text variant="caption" color="textMuted">
            {t('universis.grades.passed')}
          </Text>
          <Text variant="title">
            {summary.passed}
            <Text variant="body" color="textSubtle">
              /{summary.total}
            </Text>
          </Text>
        </View>
      </View>
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[5],
  },
  ringText: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing[1],
  },
  whole: {
    lineHeight: 34,
  },
  decimals: {
    fontSize: 16,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing[5],
  },
  stat: {
    gap: theme.spacing[0.5],
  },
}));
