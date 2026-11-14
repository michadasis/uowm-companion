import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { Icon, TabBar } from '@/design';
import type { IconName } from '@/design';

function tabIcon(name: IconName) {
  // A filled glyph on the chosen tab says "you are here" twice over, with
  // the pill behind it, so it still reads without colour.
  const TabIcon = ({ focused, size }: { focused: boolean; size: number }) => (
    <Icon
      name={name}
      size={size}
      color={focused ? 'onPrimaryMuted' : 'textMuted'}
      weight={focused ? 'fill' : 'regular'}
    />
  );
  return TabIcon;
}

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: tabIcon('home'),
          tabBarButtonTestID: 'tab-home',
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: t('tabs.announcements'),
          tabBarIcon: tabIcon('announcements'),
          tabBarButtonTestID: 'tab-announcements',
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: t('tabs.schedule'),
          tabBarIcon: tabIcon('schedule'),
          tabBarButtonTestID: 'tab-schedule',
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: t('tabs.menu'),
          tabBarIcon: tabIcon('menu'),
          tabBarButtonTestID: 'tab-menu',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('tabs.more'),
          tabBarIcon: tabIcon('more'),
          tabBarButtonTestID: 'tab-more',
        }}
      />
    </Tabs>
  );
}
