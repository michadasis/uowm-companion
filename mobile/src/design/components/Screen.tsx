import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createStyles, useTheme } from '../theme';
import type { Theme } from '../theme';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { Text } from './Text';

/**
 * The colour a section of the app is known by, after the small coloured
 * squares of the university's mark: the restaurant amber, the schedule blue,
 * the news green.
 */
export type ScreenTone = 'amber' | 'blue' | 'green';

/** The band & the ink of a section's colour, for a band drawn outside `ScreenTitle`. */
export function useToneColors(tone: ScreenTone): { band: string; ink: string } {
  return toneColors(useTheme(), tone);
}

function toneColors(theme: Theme, tone: ScreenTone) {
  const { colors } = theme;
  return {
    amber: { band: colors.primaryMuted, ink: colors.onPrimaryMuted },
    blue: { band: colors.accentMuted, ink: colors.onAccentMuted },
    green: { band: colors.successMuted, ink: colors.onSuccessMuted },
  }[tone];
}

export interface ScreenProps {
  children: ReactNode;
  /**
   * Which screen edges to keep clear of the status bar, notch and gesture
   * area. Tab screens only need the top: the tab bar covers the bottom.
   */
  edges?: readonly ('top' | 'bottom')[];
  style?: StyleProp<ViewStyle>;
  /** Paints the strip behind the status bar to match a toned `ScreenTitle`. */
  tone?: ScreenTone;
  testID?: string;
}

export function Screen({ children, edges = ['top'], style, tone, testID }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View
      style={[
        styles.screen,
        tone ? { backgroundColor: toneColors(theme, tone).band } : null,
        {
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
      testID={testID}
    >
      <View style={[styles.content, tone ? styles.toned : null, style]}>{children}</View>
    </View>
  );
}

export interface ScreenTitleProps {
  title: string;
  subtitle?: string;
  /** Sets the title on a band of the section's colour; pair with `Screen`'s. */
  tone?: ScreenTone;
  /** Drawn large & faint at the band's end, as its illustration. */
  icon?: IconName;
  /** Content kept on the band under the title, such as a section switch. */
  children?: ReactNode;
}

/** The large title at the top of a screen, plain or on a coloured band. */
export function ScreenTitle({ title, subtitle, tone, icon, children }: ScreenTitleProps) {
  const theme = useTheme();
  const styles = useStyles();
  if (!tone) {
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
        {children}
      </View>
    );
  }

  const { band, ink } = toneColors(theme, tone);
  return (
    <View style={[styles.band, { backgroundColor: band }]}>
      {icon ? (
        <View style={styles.illustration} pointerEvents="none">
          <Icon
            name={icon}
            size={132}
            color={
              tone === 'amber'
                ? 'onPrimaryMuted'
                : tone === 'blue'
                  ? 'onAccentMuted'
                  : 'onSuccessMuted'
            }
          />
        </View>
      ) : null}
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="callout" style={{ color: ink }}>
          {subtitle}
        </Text>
      ) : null}
      {children ? <View style={styles.bandChildren}>{children}</View> : null}
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
  // Under a toned band the page goes back to the plain background.
  toned: {
    backgroundColor: theme.colors.background,
  },
  band: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[5],
    gap: theme.spacing[1],
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  illustration: {
    position: 'absolute',
    right: -20,
    top: -18,
    opacity: theme.scheme === 'dark' ? 0.14 : 0.12,
    transform: [{ rotate: '-12deg' }],
  },
  bandChildren: {
    marginTop: theme.spacing[3],
  },
}));
