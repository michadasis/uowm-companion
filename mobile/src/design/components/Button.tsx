import { ActivityIndicator, View } from 'react-native';

import { createStyles, useTheme } from '../theme';
import type { ColorTokens } from '../tokens/colors';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import type { TextColor } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  /** Shows a spinner in place of the label and ignores presses. */
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

const fills: Record<Variant, { background: keyof ColorTokens | null; label: TextColor }> = {
  primary: { background: 'primary', label: 'onPrimary' },
  secondary: { background: 'primaryMuted', label: 'onPrimaryMuted' },
  ghost: { background: null, label: 'primary' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const styles = useStyles();
  const inactive = disabled || loading;
  const fill = fills[variant];
  const labelColor: TextColor = disabled ? 'textDisabled' : fill.label;
  const background = disabled
    ? variant === 'ghost'
      ? undefined
      : theme.colors.surfaceMuted
    : fill.background
      ? theme.colors[fill.background]
      : undefined;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      testID={testID}
      style={[styles.button, { backgroundColor: background }]}
    >
      {/* The label stays in the layout while loading so the button keeps its width. */}
      <View style={[styles.content, loading ? styles.hidden : null]}>
        {icon ? <Icon name={icon} size={theme.size.icon.sm} color={labelColor} /> : null}
        <Text variant="subheading" color={labelColor} numberOfLines={1}>
          {label}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator style={styles.spinner} color={theme.colors[fill.label]} />
      ) : null}
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  button: {
    minHeight: 52,
    paddingHorizontal: theme.spacing[5],
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  hidden: {
    opacity: 0,
  },
  spinner: {
    position: 'absolute',
  },
}));
