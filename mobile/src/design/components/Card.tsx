import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { createStyles } from '../theme';

import { PressableScale } from './PressableScale';

export interface CardProps {
  children: ReactNode;
  /** Makes the whole card one button. Needs an `accessibilityLabel`. */
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Turn off when the content draws to the card's edges, such as a list. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * A surface that groups related content. It is separated from the page by
 * a hairline and a slightly different tone instead of a shadow: Android
 * shadows cannot be tinted or softened, and they vanish in the dark theme.
 */
export function Card({
  children,
  onPress,
  accessibilityLabel,
  padded = true,
  style,
  testID,
}: CardProps) {
  const styles = useStyles();
  const cardStyle = [styles.card, padded ? styles.padded : null, style];

  if (onPress) {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        testID={testID}
        style={cardStyle}
      >
        {children}
      </PressableScale>
    );
  }

  return (
    <View style={cardStyle} testID={testID}>
      {children}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.lg + 2,
    overflow: 'hidden',
  },
  padded: {
    padding: theme.spacing[4],
  },
}));
