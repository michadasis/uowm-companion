import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, Chip, createStyles, Icon, Text } from '@/design';

import type { CourseFilter } from './types';

export interface CourseFilterBarProps {
  /** True once the student has linked their Universis account. */
  linked: boolean;
  filter: CourseFilter;
  onFilter: (filter: CourseFilter) => void;
  onConnect: () => void;
}

const filters: CourseFilter[] = ['all', 'owed', 'registered'];

/**
 * The course filter for the schedule: a prompt to link Universis when the
 * student has not, or chips to narrow the schedule to their courses once they
 * have.
 */
export function CourseFilterBar({ linked, filter, onFilter, onConnect }: CourseFilterBarProps) {
  const { t } = useTranslation();
  const styles = useStyles();

  if (!linked) {
    return (
      <View style={styles.prompt}>
        <Text variant="caption" color="textMuted" style={styles.hint}>
          {t('universis.link.hint')}
        </Text>
        <Button
          label={t('universis.link.cta')}
          variant="secondary"
          icon="department"
          onPress={onConnect}
        />
      </View>
    );
  }

  return (
    <View style={styles.bar}>
      <View style={styles.linked}>
        <Icon name="check" size={13} color="primary" />
        <Text variant="caption" color="textSubtle">
          {t('universis.linked')}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
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
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    padding: theme.spacing[3],
  },
  hint: {
    flex: 1,
  },
  bar: {
    gap: theme.spacing[2],
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
