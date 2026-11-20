import { View } from 'react-native';

import { createStyles, useTheme } from '../theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface OfflineNoticeProps {
  title: string;
  /** When the content underneath was last fetched, already formatted. */
  detail?: string;
  testID?: string;
}

/**
 * Sits above content that is being shown from the cache. Unlike the offline
 * `StateView`, there is something to read here, so it only says how old it is.
 */
export function OfflineNotice({ title, detail, testID }: OfflineNoticeProps) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View accessible accessibilityRole="alert" style={styles.notice} testID={testID}>
      <Icon name="offline" size={theme.size.icon.sm} color="onAccentMuted" />
      <Text variant="label" color="onAccentMuted" style={styles.text}>
        {detail ? `${title}. ${detail}` : title}
      </Text>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  notice: {
    minHeight: 40,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentMuted,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  text: {
    flex: 1,
  },
}));
