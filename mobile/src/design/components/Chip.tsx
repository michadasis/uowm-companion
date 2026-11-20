import { StyleSheet } from 'react-native';

import { createStyles } from '../theme';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  /** A leading icon, for a chip that does something rather than filter. */
  icon?: IconName;
  onPress: () => void;
  testID?: string;
}

/** A filter that is either on or off — or, with an icon, a shortcut beside them. */
export function Chip({ label, selected = false, icon, onPress, testID }: ChipProps) {
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
      style={[styles.chip, icon ? styles.withIcon : null, selected ? styles.selected : null]}
    >
      {icon ? <Icon name={icon} size={16} color={selected ? 'background' : 'primary'} /> : null}
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
  withIcon: {
    flexDirection: 'row',
    gap: theme.spacing[1],
    paddingLeft: theme.spacing[3],
  },
  // The chosen filter is inked in, the way a pen marks it on paper.
  selected: {
    borderColor: theme.colors.text,
    backgroundColor: theme.colors.text,
  },
}));
