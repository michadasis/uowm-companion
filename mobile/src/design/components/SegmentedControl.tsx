import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';

import { createStyles } from '../theme';
import { spring } from '../tokens/motion';

import { Text } from './Text';

export interface SegmentedControlProps<Value extends string> {
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  /** Names the group for screen readers, for example "Theme". */
  accessibilityLabel: string;
  testID?: string;
}

/** A choice between a few options that are all visible at once. */
export function SegmentedControl<Value extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
}: SegmentedControlProps<Value>) {
  const styles = useStyles();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const segmentWidth = 100 / options.length;

  // The thumb is placed with percentages, so it is in the right place on the
  // first frame without measuring the control.
  const position = useSharedValue(selectedIndex);
  useEffect(() => {
    position.set(withSpring(selectedIndex, spring.glide));
  }, [position, selectedIndex]);
  const thumbStyle = useAnimatedStyle(() => ({ left: `${position.get() * segmentWidth}%` }));

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={styles.control}
      testID={testID}
    >
      <View style={styles.track}>
        <Animated.View style={[styles.thumb, { width: `${segmentWidth}%` }, thumbStyle]} />
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: selected }}
              onPress={() => {
                if (selected) return;
                haptics.selection();
                onChange(option.value);
              }}
              style={styles.segment}
            >
              <Text variant="label" color={selected ? 'text' : 'textMuted'} numberOfLines={1}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  control: {
    height: theme.size.touchTarget,
    padding: 3,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
  },
  track: {
    flex: 1,
    flexDirection: 'row',
  },
  thumb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: theme.radius.md - 3,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[1],
  },
}));
