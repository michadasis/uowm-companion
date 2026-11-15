import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { createStyles, Icon, NavBar, Screen, StateView, Text } from '@/design';
import { formatDate } from '@/features/announcements/format';
import {
  findById,
  findBySourceUrl,
  scopeOfId,
  useAnnouncements,
} from '@/features/announcements/useAnnouncements';
import { BlockRenderer } from '@/features/content/BlockRenderer';
import { openExternal } from '@/features/content/links';
import type { Language } from '@/features/settings/store';

export default function AnnouncementReaderScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const styles = useStyles();
  // expo-router has already decoded the param, so the id with its colon
  // arrives whole.
  const { id } = useLocalSearchParams<{ id: string }>();

  // The feed the announcement belongs to is named by its id, and it is
  // already in the cache from the list the reader was opened from.
  const { data, isLoading } = useAnnouncements(scopeOfId(id));
  const announcement = findById(data, id);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/announcements'));

  if (!announcement) {
    return (
      <Screen edges={['top', 'bottom']} testID="announcement-reader">
        <NavBar title="" onBack={goBack} backLabel={t('common.back')} />
        {!isLoading ? (
          <StateView
            kind="empty"
            icon="announcements"
            title={t('announcements.notFound.title')}
            message={t('announcements.notFound.message')}
          />
        ) : null}
      </Screen>
    );
  }

  const date = formatDate(announcement.date, i18n.language as Language);

  const onLinkPress = (href: string) => {
    // A link to another announcement already in this feed opens in the app;
    // anything else opens in an in-app browser.
    const internal = findBySourceUrl(data, href);
    if (internal) router.push({ pathname: '/announcement/[id]', params: { id: internal.id } });
    else openExternal(href);
  };

  return (
    <Screen edges={['top', 'bottom']} testID="announcement-reader">
      <NavBar
        title=""
        onBack={goBack}
        backLabel={t('common.back')}
        action={{
          icon: 'externalLink',
          label: t('announcements.viewOnWebsite'),
          onPress: () => openExternal(announcement.sourceUrl),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {date ? (
          <View style={styles.date}>
            <Icon name="date" size={14} color="textSubtle" />
            <Text variant="caption" color="textSubtle">
              {date}
            </Text>
          </View>
        ) : null}
        <Text variant="title" accessibilityRole="header">
          {announcement.title}
        </Text>
        <View style={styles.body}>
          <BlockRenderer blocks={announcement.body} onLinkPress={onLinkPress} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  content: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[10],
    gap: theme.spacing[3],
  },
  date: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  body: {
    paddingTop: theme.spacing[2],
  },
}));
