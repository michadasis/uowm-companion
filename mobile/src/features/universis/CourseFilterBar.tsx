import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, Chip, createStyles, Icon, PressableScale, Text } from '@/design';

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

export interface CourseFilterBarProps {
  status: CourseFilterStatus;
  /** Ready from the saved copy only: the token ran out & can't refresh it. */
  expired?: boolean;
  /** When the saved copy was read, for the expired notice. */
  updatedAt?: number | null;
  filter: CourseFilter;
  onFilter: (filter: CourseFilter) => void;
  onConnect: () => void;
  onRetry?: () => void;
  onDisconnect?: () => void;
}

const filters: CourseFilter[] = ['all', 'owed', 'registered'];

/**
 * The course filter for the schedule: a prompt to link Universis when the
 * student has not, & chips to narrow the schedule to their courses once they
 * have. When the link has lapsed the chips stay, working from the saved
 * courses, with a way to refresh them.
 */
export function CourseFilterBar({
  status,
  expired = false,
  updatedAt = null,
  filter,
  onFilter,
  onConnect,
  onRetry,
  onDisconnect,
}: CourseFilterBarProps) {
  const { t } = useTranslation();
  const styles = useStyles();

  if (status === 'disconnected') {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${t('universis.link.cta')}: ${t('universis.link.hint')}`}
        onPress={onConnect}
        style={styles.prompt}
      >
        <Icon name="department" size={18} color="accent" />
        <Text variant="caption" color="textMuted" style={styles.grow}>
          {t('universis.link.hint')}
        </Text>
        <Text variant="label" color="primary">
          {t('universis.link.cta')}
        </Text>
      </PressableScale>
    );
  }

  if (status === 'loading') {
    return (
      <View style={styles.prompt}>
        <Text variant="caption" color="textMuted" style={styles.grow}>
          {t('universis.loading')}
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.prompt}>
        <Text variant="caption" color="textMuted" style={styles.grow}>
          {t('universis.error')}
        </Text>
        {onRetry ? (
          <Button label={t('states.error.retry')} variant="ghost" icon="retry" onPress={onRetry} />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.bar}>
      {expired ? (
        <ExpiredNotice updatedAt={updatedAt} onReconnect={onConnect} />
      ) : (
        <View style={styles.top}>
          <View style={styles.linked}>
            <Icon name="check" size={13} color="primary" />
            <Text variant="caption" color="textSubtle">
              {t('universis.linked')}
            </Text>
          </View>
          {onDisconnect ? (
            <Button label={t('universis.signOut')} variant="ghost" onPress={onDisconnect} />
          ) : null}
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {filters.map((value) => (
          <Chip
            key={value}
            label={t(`universis.filter.${value}`)}
            selected={filter === value}
            onPress={() => onFilter(value)}
            testID={`course-filter-${value}`}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    minHeight: theme.size.touchTarget,
    backgroundColor: theme.colors.accentMuted,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  grow: {
    flex: 1,
  },
  bar: {
    gap: theme.spacing[2],
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  chips: {
    gap: theme.spacing[2],
  },
}));
