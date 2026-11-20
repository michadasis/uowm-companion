import { View } from 'react-native';

import { createStyles } from '../theme';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface DayStripButtonProps {
  /** The weekday, short: "Δευ". */
  label: string;
  /** Its date this week, shown under the name. */
  date?: Date;
  selected: boolean;
  /** Marks the day with a dot of the brand's amber. */
  today?: boolean;
  /** Greys a day out, as a holiday. */
  off?: boolean;
  onPress: () => void;
  testID?: string;
}

/**
 * A day of a week strip — its short name over its date — for screens that go
 * a day at a time: the timetable, the restaurant's menu.
 */
export function DayStripButton({
  label,
  date,
  selected,
  today = false,
  off = false,
  onPress,
  testID,
}: DayStripButtonProps) {
  const styles = useStyles();
  const color = selected ? 'background' : off ? 'textDisabled' : undefined;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={date ? `${label} ${date.getDate()}` : label}
      onPress={onPress}
      style={[styles.day, selected ? styles.selected : null]}
      testID={testID}
    >
      <Text variant="caption" color={color ?? 'textMuted'}>
        {label}
      </Text>
      {date ? (
        <Text variant="subheading" color={color ?? 'text'}>
          {date.getDate()}
        </Text>
      ) : null}
      <View style={[styles.dot, today ? styles.dotToday : null]} />
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  day: {
    minWidth: 52,
    paddingHorizontal: theme.spacing[2],
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[1],
    borderRadius: theme.radius.md,
    alignItems: 'center',
    gap: 2,
  },
  selected: {
    backgroundColor: theme.colors.text,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
  dotToday: {
    backgroundColor: theme.colors.brand,
  },
}));
