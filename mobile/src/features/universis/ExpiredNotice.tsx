import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { createStyles, Icon, PressableScale, Text } from '@/design';
import { formatUpdatedAt } from '@/features/announcements/format';

export interface ExpiredNoticeProps {
  /** When the saved courses & grades were last read, in epoch milliseconds. */
  updatedAt: number | null;
  onReconnect: () => void;
}

/**
 * Says, in one line, that the Universis connection has run out & what is on
 * screen is the copy saved at the last read — with the way to bring it up to
 * date at its end. The full explanation is what a screen reader hears.
 */
export function ExpiredNotice({ updatedAt, onReconnect }: ExpiredNoticeProps) {
  const { t, i18n } = useTranslation();
  const styles = useStyles();
  const time = updatedAt ? formatUpdatedAt(updatedAt, i18n.language) : null;
  return (
    <View style={styles.notice} testID="universis-expired">
      <View
        accessible
        accessibilityRole="alert"
        accessibilityLabel={`${t('universis.expired.title')}. ${
          time ? t('universis.expired.detail', { time }) : t('universis.expired.detailUndated')
        }`}
        style={styles.text}
      >
        <Icon name="offline" size={16} color="textSubtle" />
        <Text variant="caption" color="textMuted" numberOfLines={1} style={styles.label}>
          {time ? t('universis.expired.short', { time }) : t('universis.expired.shortUndated')}
        </Text>
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={t('universis.expired.cta')}
        hitSlop={10}
        onPress={onReconnect}
        style={styles.action}
      >
        <Icon name="retry" size={14} color="accent" />
        <Text variant="label" color="accent">
          {t('universis.expired.cta')}
        </Text>
      </PressableScale>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  // A quiet line, not a box: the saved copy is still good to use.
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    paddingVertical: theme.spacing[1],
  },
  text: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  label: {
    flexShrink: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
}));
