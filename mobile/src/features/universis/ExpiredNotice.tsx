import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { createStyles, Icon, PressableScale, Text, useTheme } from '@/design';
import { formatUpdatedAt } from '@/features/announcements/format';

export interface ExpiredNoticeProps {
  /** When the saved courses & grades were last read, in epoch milliseconds. */
  updatedAt: number | null;
  onReconnect: () => void;
}

/**
 * Says that the Universis connection has run out & what is on screen is the
 * copy saved at the last read, so a student knows a newer grade or declaration
 * may be missing — with the way to bring it up to date right there.
 */
export function ExpiredNotice({ updatedAt, onReconnect }: ExpiredNoticeProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View accessible accessibilityRole="alert" style={styles.notice} testID="universis-expired">
      <View style={styles.row}>
        <Icon name="offline" size={theme.size.icon.sm} color="onAccentMuted" />
        <View style={styles.text}>
          <Text variant="label" color="onAccentMuted">
            {t('universis.expired.title')}
          </Text>
          <Text variant="caption" color="onAccentMuted">
            {updatedAt
              ? t('universis.expired.detail', {
                  time: formatUpdatedAt(updatedAt, i18n.language),
                })
              : t('universis.expired.detailUndated')}
          </Text>
        </View>
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={t('universis.expired.cta')}
        hitSlop={8}
        onPress={onReconnect}
        style={styles.action}
      >
        <Icon name="retry" size={16} color="accent" />
        <Text variant="label" color="accent">
          {t('universis.expired.cta')}
        </Text>
      </PressableScale>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  notice: {
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentMuted,
    gap: theme.spacing[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing[2],
  },
  text: {
    flex: 1,
    gap: theme.spacing[0.5],
  },
  // A link under the text, lined up with it, rather than a second button-shaped
  // colour inside the notice's own.
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing[1],
    marginLeft: theme.size.icon.sm + theme.spacing[2],
  },
}));
