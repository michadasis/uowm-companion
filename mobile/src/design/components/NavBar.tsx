import { Pressable, View } from 'react-native';

import { createStyles, useTheme } from '../theme';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { Text } from './Text';

export interface NavBarAction {
  icon: IconName;
  label: string;
  onPress: () => void;
}

export interface NavBarProps {
  title: string;
  onBack: () => void;
  /** Read out for the back button. */
  backLabel: string;
  /** An optional button at the far end, such as "View on website". */
  action?: NavBarAction;
}

/** The bar at the top of a screen that was pushed on top of another. */
export function NavBar({ title, onBack, backLabel, action }: NavBarProps) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        android_ripple={{ color: theme.colors.pressed, borderless: true, radius: 22 }}
        onPress={onBack}
        style={styles.button}
        testID="nav-back"
      >
        <Icon name="back" />
      </Pressable>
      <Text variant="heading" numberOfLines={1} accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          android_ripple={{ color: theme.colors.pressed, borderless: true, radius: 22 }}
          onPress={action.onPress}
          style={styles.button}
          testID="nav-action"
        >
          <Icon name={action.icon} />
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  bar: {
    height: 56,
    paddingHorizontal: theme.spacing[1],
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: theme.size.touchTarget,
    height: theme.size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    marginLeft: theme.spacing[1],
    marginRight: theme.spacing[2],
  },
}));
