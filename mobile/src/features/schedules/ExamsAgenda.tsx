import { FlashList } from '@shopify/flash-list';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { RefreshControlProps } from 'react-native';

import { displayNumeral } from '@/lib/greek';
import { Card, createStyles, Icon, SectionHeader, Text } from '@/design';
import type { Language } from '@/features/settings/store';

import { formatDayHeading, formatTimeRange, groupByDay } from './agenda';
import type { Exam } from './schema';

type Row =
  { kind: 'day'; key: string; heading: string } | { kind: 'exam'; key: string; exam: Exam };

export interface ExamsAgendaProps {
  exams: Exam[];
  /** Rendered above the list, e.g. the link to the source document. */
  header?: ReactElement;
  /** Rendered after the list, e.g. the link to the source document. */
  footer?: ReactElement;
  refreshControl?: ReactElement<RefreshControlProps>;
}

function ExamCard({ exam }: { exam: Exam }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const time = formatTimeRange(exam);

  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        {time ? (
          <Text variant="label" color="primary">
            {time}
          </Text>
        ) : null}
        {exam.semester ? (
          <Text variant="caption" color="textSubtle">
            {displayNumeral(t('schedule.semester', { semester: exam.semester }))}
          </Text>
        ) : null}
      </View>
      <Text variant="subheading" numberOfLines={3}>
        {exam.course}
      </Text>
      <View style={styles.meta}>
        {exam.room ? (
          <View style={styles.metaItem}>
            <Icon name="location" size={14} color="textSubtle" />
            <Text variant="caption" color="textMuted" numberOfLines={1} style={styles.metaText}>
              {exam.room}
            </Text>
          </View>
        ) : null}
        {exam.examiners?.length ? (
          <View style={styles.metaItem}>
            <Icon name="department" size={14} color="textSubtle" />
            <Text variant="caption" color="textMuted" numberOfLines={1} style={styles.metaText}>
              {exam.examiners.join(', ')}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

/** The exam schedule as an agenda grouped by day. */
export function ExamsAgenda({ exams, header, footer, refreshControl }: ExamsAgendaProps) {
  const { t, i18n } = useTranslation();
  const styles = useStyles();
  const language = i18n.language as Language;

  const rows: Row[] = groupByDay(exams).flatMap((day) => {
    const heading = formatDayHeading(day.date, language) ?? t('schedule.otherExams');
    return [
      { kind: 'day' as const, key: `day:${day.date}`, heading },
      ...day.exams.map((exam, index) => ({
        kind: 'exam' as const,
        key: `${day.date}:${index}`,
        exam,
      })),
    ];
  });

  return (
    <FlashList
      data={rows}
      extraData={language}
      getItemType={(row) => row.kind}
      keyExtractor={(row) => row.key}
      contentContainerStyle={styles.content}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      refreshControl={refreshControl}
      renderItem={({ item }) =>
        item.kind === 'day' ? (
          <SectionHeader title={item.heading} />
        ) : (
          <View style={styles.cardWrap}>
            <ExamCard exam={item.exam} />
          </View>
        )
      }
    />
  );
}

const useStyles = createStyles((theme) => ({
  content: {
    paddingBottom: theme.spacing[10],
  },
  cardWrap: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
  },
  card: {
    gap: theme.spacing[2],
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
}));
