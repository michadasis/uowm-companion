import { Pressable } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { pressedScale, spring } from '../tokens/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
}

/**
 * The press feedback for anything with its own outline: buttons, cards and
 * chips sink slightly under the finger and spring back. Full-width rows use
 * a background highlight instead, since scaling a row would break the list.
 */
export function PressableScale({ style, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.get() * (1 - pressedScale) }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        pressed.set(withSpring(1, spring.snappy));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.set(withSpring(0, spring.snappy));
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    />
  );
}
