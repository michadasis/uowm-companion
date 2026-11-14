import { Pressable, View } from 'react-native';

import { createStyles, useTheme } from '../theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface NavBarProps {
  title: string;
  onBack: () => void;
  /** Read out for the back button. */
  backLabel: string;
}

/** The bar at the top of a screen that was pushed on top of another. */
export function NavBar({ title, onBack, backLabel }: NavBarProps) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        android_ripple={{ color: theme.colors.pressed, borderless: true, radius: 22 }}
        onPress={onBack}
        style={styles.back}
        testID="nav-back"
      >
        <Icon name="back" />
      </Pressable>
      <Text variant="heading" numberOfLines={1} accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
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
  back: {
    width: theme.size.touchTarget,
    height: theme.size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    marginLeft: theme.spacing[1],
    marginRight: theme.spacing[4],
  },
}));
