import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { createStyles, useTheme } from '../theme';
import { spring } from '../tokens/motion';

import { Text } from './Text';

interface TabProps {
  label: string;
  focused: boolean;
  icon: ReactNode;
  onPress: () => void;
  onLongPress: () => void;
  testID?: string;
}

function Tab({ label, focused, icon, onPress, onLongPress, testID }: TabProps) {
  const theme = useTheme();
  const styles = useStyles();

  // The pill behind the icon grows out from the centre when its tab is
  // chosen, which shows where the selection went without moving the icons.
  const progress = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    progress.set(withSpring(focused ? 1 : 0, spring.glide));
  }, [focused, progress]);
  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scaleX: 0.5 + progress.get() * 0.5 }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      android_ripple={{ color: theme.colors.pressed, borderless: true, radius: 44 }}
      onLongPress={onLongPress}
      onPress={onPress}
      style={styles.tab}
      testID={testID}
    >
      <View style={styles.iconArea}>
        <Animated.View style={[styles.pill, pillStyle]} />
        {/* In a browser a bare SVG paints under the absolutely placed pill;
            a view of its own keeps the icon on top everywhere. */}
        <View>{icon}</View>
      </View>
      <Text
        variant="tab"
        color={focused ? 'text' : 'textMuted'}
        numberOfLines={1}
        // Greek labels run long; shrinking slightly beats an ellipsis.
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * The bottom navigation. It replaces the navigator's own bar so that the
 * icons, type and selection indicator come from the design system and look
 * the same on Android and iOS.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View accessibilityRole="tablist" style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const options = descriptors[route.key]?.options;
        const focused = index === state.index;
        const label = options?.title ?? route.name;

        return (
          <Tab
            key={route.key}
            focused={focused}
            icon={options?.tabBarIcon?.({
              focused,
              color: focused ? theme.colors.onPrimaryMuted : theme.colors.textMuted,
              size: theme.size.icon.md,
            })}
            label={label}
            onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
            onPress={() => {
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            }}
            testID={options?.tabBarButtonTestID}
          />
        );
      })}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  bar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[1],
  },
  iconArea: {
    width: 56,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryMuted,
  },
}));
