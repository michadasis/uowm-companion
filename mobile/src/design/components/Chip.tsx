import { StyleSheet } from 'react-native';

import { createStyles } from '../theme';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  testID?: string;
}

/** A filter that is either on or off. */
export function Chip({ label, selected = false, onPress, testID }: ChipProps) {
  const styles = useStyles();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      // The chip is 36 high; the slop brings the tappable area up to 48.
      hitSlop={6}
      onPress={onPress}
      testID={testID}
      style={[styles.chip, selected ? styles.selected : null]}
    >
      <Text variant="label" color={selected ? 'background' : 'textMuted'} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  chip: {
    height: 36,
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The chosen filter is inked in, the way a pen marks it on paper.
  selected: {
    borderColor: theme.colors.text,
    backgroundColor: theme.colors.text,
  },
}));
