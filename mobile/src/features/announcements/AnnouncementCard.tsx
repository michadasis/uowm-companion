import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, createStyles, Icon, Text } from '@/design';
import type { Language } from '@/features/settings/store';

import { formatListDate } from './format';
import type { Announcement } from './schema';

export interface AnnouncementCardProps {
  announcement: Announcement;
  onPress: () => void;
}

export function AnnouncementCard({ announcement, onPress }: AnnouncementCardProps) {
  const { i18n } = useTranslation();
  const styles = useStyles();
  const date = formatListDate(announcement.date, i18n.language as Language);
  const attachments = announcement.attachments.length;

  return (
    <Card onPress={onPress} accessibilityLabel={announcement.title} style={styles.card}>
      <View style={styles.meta}>
        {date ? (
          <Text variant="caption" color="textSubtle">
            {date}
          </Text>
        ) : null}
        {attachments > 0 ? (
          <View style={styles.metaItem}>
            <Icon name="file" size={13} color="textSubtle" />
            <Text variant="caption" color="textSubtle">
              {attachments}
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="subheading" numberOfLines={3}>
        {announcement.title}
      </Text>
      {announcement.excerpt ? (
        <Text variant="callout" color="textMuted" numberOfLines={2}>
          {announcement.excerpt}
        </Text>
      ) : null}
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    marginHorizontal: theme.spacing[4],
    gap: theme.spacing[2],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
}));
