import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { createStyles, useTheme } from '../theme';

const PulseContext = createContext<SharedValue<number> | null>(null);

export interface SkeletonGroupProps {
  /** Read by screen readers in place of the placeholders, e.g. "Loading". */
  accessibilityLabel: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps the placeholders of one loading area. Every block inside pulses off
 * the same clock, so a list of them breathes together instead of flickering,
 * and it costs one animation however many blocks there are. The pulse stops
 * when the system asks for reduced motion.
 */
export function SkeletonGroup({ accessibilityLabel, children, style }: SkeletonGroupProps) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 900 }), -1, true));
  }, [pulse]);

  return (
    <PulseContext.Provider value={pulse}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ busy: true }}
        style={style}
      >
        {children}
      </View>
    </PulseContext.Provider>
  );
}

export interface SkeletonProps {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** One placeholder block. It only pulses inside a `SkeletonGroup`. */
export function Skeleton({ width = '100%', height, radius, style }: SkeletonProps) {
  const theme = useTheme();
  const pulse = useContext(PulseContext);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse ? 1 - pulse.get() * 0.45 : 1,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radius.sm,
          backgroundColor: theme.colors.skeleton,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}

/** The loading shape of a `ListRow` with an icon tile, a title and a subtitle. */
export function ListRowSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Skeleton width={40} height={40} radius={12} />
      <View style={styles.rowText}>
        <Skeleton width="62%" height={16} />
        <Skeleton width="38%" height={12} />
      </View>
    </View>
  );
}

/** The loading shape of a card that holds a title and two lines of text. */
export function CardSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <Skeleton width="45%" height={12} />
      <Skeleton width="80%" height={18} />
      <Skeleton width="60%" height={14} />
    </View>
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
  rowText: {
    flex: 1,
    gap: theme.spacing[2],
  },
  card: {
    padding: theme.spacing[4],
    gap: theme.spacing[3],
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
}));
