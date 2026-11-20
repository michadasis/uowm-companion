import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Chip, createStyles, Text } from '@/design';

import { ExpiredNotice } from './ExpiredNotice';
import type { CourseFilter } from './types';

/**
 * Where the student's Universis link stands:
 * - `disconnected` — never linked, nothing to filter by;
 * - `loading` — linked, reading the courses for the first time;
 * - `error` — linked, but the read failed & there is no saved copy;
 * - `ready` — there are courses to filter by, fresh or saved.
 */
export type CourseFilterStatus = 'disconnected' | 'loading' | 'error' | 'ready';

export interface CourseChipsProps {
  status: CourseFilterStatus;
  filter: CourseFilter;
  onFilter: (filter: CourseFilter) => void;
  onConnect: () => void;
  onRetry?: () => void;
  /** Adds the "all" chip; leave it out where the row has its own, as the timetable's. */
  includeAll?: boolean;
}

/**
 * The course filter as chips, to share one row with the schedule's other
 * filters: the student's declared & owed courses once Universis is linked, a
 * chip to link it until then — never a second row or a banner of its own.
 */
export function CourseChips({
  status,
  filter,
  onFilter,
  onConnect,
  onRetry,
  includeAll = false,
}: CourseChipsProps) {
  const { t } = useTranslation();
  const styles = useStyles();

  if (status === 'disconnected') {
    return (
      <Chip
        label={t('universis.link.mine')}
        icon="department"
        onPress={onConnect}
        testID="course-filter-connect"
      />
    );
  }
  if (status === 'loading') {
    return (
      <Text variant="caption" color="textSubtle" style={styles.status}>
        {t('universis.loadingShort')}
      </Text>
    );
  }
  if (status === 'error') {
    return onRetry ? (
      <Chip
        label={t('universis.retryShort')}
        icon="retry"
        onPress={onRetry}
        testID="course-filter-retry"
      />
    ) : null;
  }

  // Declared only: owed courses are mostly the declared ones, so a second chip
  // filtered nearly the same.
  const shown: CourseFilter[] = includeAll ? ['registered', 'all'] : ['registered'];
  return (
    <>
      {shown.map((value) => (
        <Chip
          key={value}
          label={t(`universis.filter.${value}`)}
          selected={filter === value}
          onPress={() => onFilter(value)}
          testID={`course-filter-${value}`}
        />
      ))}
    </>
  );
}

export interface CourseFilterBarProps extends Omit<CourseChipsProps, 'includeAll'> {
  /** Ready from the saved copy only: the token ran out & can't refresh it. */
  expired?: boolean;
  /** When the saved copy was read, for the expired notice. */
  updatedAt?: number | null;
  /** More chips for the same row, after the course filter's. */
  children?: ReactNode;
}

/**
 * The course filter in a row of its own, for a schedule with no other
 * filters: the exams, or a document shown as written. When the link has
 * lapsed, a notice says the courses are the saved copy, with a way to refresh.
 */
export function CourseFilterBar({
  expired = false,
  updatedAt = null,
  children,
  ...chips
}: CourseFilterBarProps) {
  const styles = useStyles();
  return (
    <View style={styles.bar}>
      {expired ? <ExpiredNotice updatedAt={updatedAt} onReconnect={chips.onConnect} /> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <CourseChips {...chips} includeAll />
        {children}
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  bar: {
    gap: theme.spacing[2],
  },
  chips: {
    gap: theme.spacing[2],
    alignItems: 'center',
  },
  status: {
    alignSelf: 'center',
  },
}));
