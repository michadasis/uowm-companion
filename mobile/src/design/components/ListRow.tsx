import { Pressable, View } from 'react-native';
import type { ReactNode } from 'react';
import type { AccessibilityRole } from 'react-native';

import { createStyles, useTheme } from '../theme';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { Text } from './Text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** An icon at the start of the row. */
  icon?: IconName;
  /** A short value at the end of the row, such as the current setting. */
  value?: string;
  /**
   * What closes the row: a chevron for rows that navigate, a check for the
   * chosen row of a list, or any element.
   */
  trailing?: 'chevron' | 'check' | ReactNode;
  onPress?: () => void;
  /** Marks the row as the chosen one of its group. */
  selected?: boolean;
  accessibilityRole?: AccessibilityRole;
  testID?: string;
}

export function ListRow({
  title,
  subtitle,
  icon,
  value,
  trailing,
  onPress,
  selected,
  accessibilityRole,
  testID,
}: ListRowProps) {
  const theme = useTheme();
  const styles = useStyles();

  const content = (
    <>
      {icon ? (
        <View style={styles.iconTile}>
          <Icon name={icon} color="primary" />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text variant="subheading" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="callout" color="textMuted" numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      ) : null}
      {trailing === 'chevron' ? (
        <Icon name="forward" size={theme.size.icon.sm} color="textSubtle" />
      ) : trailing === 'check' ? (
        // The slot is kept when unchecked so titles don't shift between rows.
        <View style={styles.check}>
          {selected ? <Icon name="check" color="primary" weight="bold" /> : null}
        </View>
      ) : (
        trailing
      )}
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.row} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityState={selected === undefined ? undefined : { selected, checked: selected }}
      android_ripple={{ color: theme.colors.pressed }}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  row: {
    minHeight: 64,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  pressed: {
    backgroundColor: theme.colors.pressed,
  },
  // The icon stands bare, in a column of its own so the titles line up.
  iconTile: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: theme.spacing[0.5],
  },
  value: {
    maxWidth: '40%',
  },
  check: {
    width: theme.size.icon.md,
    height: theme.size.icon.md,
  },
}));
