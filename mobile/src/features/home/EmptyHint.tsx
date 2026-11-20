import { View } from 'react-native';

import { Card, createStyles, Icon, Text } from '@/design';
import type { IconName } from '@/design';

export interface EmptyHintProps {
  icon: IconName;
  text: string;
}

/** The quiet placeholder a Home section shows when it has nothing yet. */
export function EmptyHint({ icon, text }: EmptyHintProps) {
  const styles = useStyles();
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Icon name={icon} color="textSubtle" />
        </View>
        <Text variant="callout" color="textMuted" style={styles.text}>
          {text}
        </Text>
      </View>
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    marginHorizontal: theme.spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  // A bare icon, as the list rows have: a placeholder should be quiet.
  icon: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
}));
