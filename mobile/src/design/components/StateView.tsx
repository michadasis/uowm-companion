import { View } from 'react-native';

import { createStyles, useTheme } from '../theme';
import type { ColorTokens } from '../tokens/colors';

import { Button } from './Button';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { Text } from './Text';

type Kind = 'empty' | 'offline' | 'error';

export interface StateViewProps {
  /**
   * Why there is nothing to show: nothing exists yet, the device is offline
   * with nothing cached, or the request failed.
   */
  kind: Kind;
  title: string;
  message?: string;
  /** Overrides the icon of the `empty` kind to match the screen. */
  icon?: IconName;
  action?: { label: string; onPress: () => void };
  testID?: string;
}

const looks: Record<
  Kind,
  { icon: IconName; background: keyof ColorTokens; foreground: keyof ColorTokens }
> = {
  empty: { icon: 'empty', background: 'surfaceMuted', foreground: 'textMuted' },
  offline: { icon: 'offline', background: 'accentMuted', foreground: 'onAccentMuted' },
  error: { icon: 'error', background: 'dangerMuted', foreground: 'onDangerMuted' },
};

/** Fills the space where content would be when there is none to show. */
export function StateView({ kind, title, message, icon, action, testID }: StateViewProps) {
  const theme = useTheme();
  const styles = useStyles();
  const look = looks[kind];

  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.badge, { backgroundColor: theme.colors[look.background] }]}>
        <Icon
          name={kind === 'empty' && icon ? icon : look.icon}
          size={30}
          color={look.foreground}
        />
      </View>
      <View style={styles.text}>
        <Text variant="heading" align="center" accessibilityRole="header">
          {title}
        </Text>
        {message ? (
          <Text variant="callout" color="textMuted" align="center">
            {message}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="secondary"
          icon={kind === 'empty' ? undefined : 'retry'}
        />
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[8],
    gap: theme.spacing[5],
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    maxWidth: 320,
    gap: theme.spacing[2],
  },
}));
