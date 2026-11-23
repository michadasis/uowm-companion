import * as SplashScreen from 'expo-splash-screen';
import { useRef } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { themes } from '@/design';
import { markColors, markPaths, markRingRadius } from '@/design/brand';
import { fontFamily } from '@/design/tokens/typography';

import {
  exit,
  markLift,
  needleRotation,
  ripple,
  ringRotation,
  splashDuration,
  splashImageWidth,
  splashMarkScale,
  wordmark,
} from './timeline';

export interface AnimatedSplashProps {
  /** Called once the splash has faded away, to take it off the screen. */
  onDone: () => void;
}

// The native image draws the 1024 grid across its width, scaled about the
// centre; this viewBox frames the same part of the grid at the same size.
const viewSpan = 1024 / splashMarkScale;
const viewBox = `${512 - viewSpan / 2} ${512 - viewSpan / 2} ${viewSpan} ${viewSpan}`;
const ringDiameter = ((2 * markRingRadius) / viewSpan) * splashImageWidth;

/**
 * Takes over from the native splash on its very first frame & plays the
 * mark: the ring turns, the needle swings & settles, the name comes in under
 * it, & the whole fades into the app. Laid over the app, which is already
 * drawn beneath. When the system asks for reduced motion it only fades.
 *
 * The colours follow the system's scheme, not the app's setting, because the
 * native splash it continues does.
 */
export function AnimatedSplash({ onDone }: AnimatedSplashProps) {
  const theme = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(0);
  const fade = useSharedValue(1);
  const started = useRef(false);

  const start = () => {
    if (started.current) return;
    started.current = true;
    // The first frame is the native image to the pixel, so it can go now.
    void SplashScreen.hide();
    const finish = (finished?: boolean) => {
      'worklet';
      if (finished) scheduleOnRN(onDone);
    };
    if (reduceMotion) {
      fade.set(withTiming(0, { duration: 200, reduceMotion: ReduceMotion.Never }, finish));
    } else {
      t.set(
        withTiming(
          splashDuration,
          { duration: splashDuration, easing: Easing.linear, reduceMotion: ReduceMotion.Never },
          finish,
        ),
      );
    }
  };

  const rootStyle = useAnimatedStyle(() => ({ opacity: exit(t.get()).opacity * fade.get() }));
  const groupStyle = useAnimatedStyle(() => ({ transform: [{ scale: exit(t.get()).scale }] }));
  const markStyle = useAnimatedStyle(() => ({ transform: [{ translateY: markLift(t.get()) }] }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation(t.get())}deg` }],
  }));
  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${needleRotation(t.get())}deg` }],
  }));
  const rippleStyle = useAnimatedStyle(() => {
    const { scale, opacity } = ripple(t.get());
    return { opacity, transform: [{ scale }] };
  });
  const nameStyle = useAnimatedStyle(() => {
    const { opacity, translateY } = wordmark(t.get());
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <Animated.View
      testID="animated-splash"
      onLayout={start}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.root, { backgroundColor: theme.colors.background }, rootStyle]}
    >
      <Animated.View style={[styles.centre, groupStyle]}>
        <Animated.View style={[styles.mark, markStyle]}>
          <Animated.View style={[styles.ripple, { borderColor: markColors.ring }, rippleStyle]} />
          <Animated.View style={[StyleSheet.absoluteFill, ringStyle]}>
            <Svg width={splashImageWidth} height={splashImageWidth} viewBox={viewBox}>
              {markPaths.ring.map((d) => (
                <Path key={d} d={d} fill={markColors.ring} />
              ))}
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, needleStyle]}>
            <Svg width={splashImageWidth} height={splashImageWidth} viewBox={viewBox}>
              <Path d={markPaths.north} fill={markColors.north} />
              <Path d={markPaths.south} fill={markColors.south} />
            </Svg>
          </Animated.View>
        </Animated.View>
        <View style={styles.nameSlot}>
          <Animated.View style={nameStyle}>
            <Text allowFontScaling={false} style={[styles.name, { color: theme.colors.text }]}>
              UoWM Companion
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  centre: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: splashImageWidth,
    height: splashImageWidth,
  },
  ripple: {
    position: 'absolute',
    left: (splashImageWidth - ringDiameter) / 2,
    top: (splashImageWidth - ringDiameter) / 2,
    width: ringDiameter,
    height: ringDiameter,
    borderRadius: ringDiameter / 2,
    borderWidth: 2.5,
  },
  // Just under the mark once it has risen.
  nameSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: splashImageWidth / 2 - 10,
    alignItems: 'center',
  },
  name: {
    fontFamily: fontFamily.semibold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.2,
  },
});
