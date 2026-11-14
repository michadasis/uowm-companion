import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createStyles } from '../theme';

import { Text } from './Text';

export interface ScreenProps {
  children: ReactNode;
  /**
   * Which screen edges to keep clear of the status bar, notch and gesture
   * area. Tab screens only need the top: the tab bar covers the bottom.
   */
  edges?: readonly ('top' | 'bottom')[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Screen({ children, edges = ['top'], style, testID }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
      testID={testID}
    >
      <View style={[styles.content, style]}>{children}</View>
    </View>
  );
}

export interface ScreenTitleProps {
  title: string;
  subtitle?: string;
}

/** The large title at the top of a screen. */
export function ScreenTitle({ title, subtitle }: ScreenTitleProps) {
  const styles = useStyles();
  return (
    <View style={styles.title}>
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="callout" color="textMuted">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: theme.size.contentMaxWidth,
    alignSelf: 'center',
  },
  title: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[2],
    gap: theme.spacing[1],
  },
}));
