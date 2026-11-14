import { View } from 'react-native';

import { toUpperCase } from '@/lib/greek';

import { createStyles } from '../theme';

import { Text } from './Text';

export interface SectionHeaderProps {
  title: string;
  /** A short note at the end of the line, such as a count. */
  detail?: string;
}

export function SectionHeader({ title, detail }: SectionHeaderProps) {
  const styles = useStyles();
  return (
    <View style={styles.header}>
      <Text
        variant="overline"
        color="textSubtle"
        accessibilityRole="header"
        // Screen readers get the original casing; some spell out capitals.
        accessibilityLabel={title}
        style={styles.title}
      >
        {toUpperCase(title)}
      </Text>
      {detail ? (
        <Text variant="overline" color="textSubtle">
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  header: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[5],
    paddingBottom: theme.spacing[2],
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing[3],
    backgroundColor: theme.colors.background,
  },
  title: {
    flex: 1,
  },
}));
