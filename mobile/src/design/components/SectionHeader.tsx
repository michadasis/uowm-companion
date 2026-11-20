import { View } from 'react-native';

import { createStyles } from '../theme';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface SectionHeaderProps {
  title: string;
  /** A short note at the end of the line, such as a count. */
  detail?: string;
  /** A link at the end of the line, such as "See all". Wins over `detail`. */
  action?: { label: string; onPress: () => void };
}

/**
 * Heads a group of content in plain sentence case, a step above body text.
 * Spaced-out capitals read as shouting in Greek, & strip its accents.
 */
export function SectionHeader({ title, detail, action }: SectionHeaderProps) {
  const styles = useStyles();
  return (
    <View style={styles.header}>
      <Text variant="subheading" accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {action ? (
        <PressableScale
          accessibilityRole="link"
          accessibilityLabel={action.label}
          hitSlop={12}
          onPress={action.onPress}
        >
          <Text variant="label" color="primary">
            {action.label}
          </Text>
        </PressableScale>
      ) : detail ? (
        <Text variant="caption" color="textSubtle">
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  header: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[3],
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing[3],
    backgroundColor: theme.colors.background,
  },
  title: {
    flex: 1,
  },
}));
