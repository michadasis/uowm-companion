import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import {
  Card,
  CardSkeleton,
  Chip,
  createStyles,
  SegmentedControl,
  SkeletonGroup,
  StateView,
  Text,
} from '@/design';
import type { Language } from '@/features/settings/store';

import { dayLabel } from './format';
import type { Course, MealKind, Meal, MenuDay, MenuItem } from './schema';
import { courses } from './schema';
import { todayName, useMenu } from './useMenu';

function itemText(item: MenuItem, language: Language): string {
  return language === 'en' ? item.en || item.el : item.el;
}

function MealCourses({ meal, language }: { meal: Meal; language: Language }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const filled = courses.filter((course) => meal[course].length > 0);

  if (filled.length === 0) {
    return (
      <Text variant="callout" color="textMuted" style={styles.noMeal}>
        {t('menu.noMeal')}
      </Text>
    );
  }

  return (
    <View style={styles.courses}>
      {filled.map((course: Course) => (
        <Card key={course} style={styles.courseCard}>
          <Text variant="overline" color="primary">
            {t(`menu.courses.${course}`)}
          </Text>
          <View style={styles.items}>
            {meal[course].map((item, index) => (
              <Text key={index} variant="body">
                {itemText(item, language)}
              </Text>
            ))}
          </View>
        </Card>
      ))}
    </View>
  );
}

export function MenuView() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const styles = useStyles();
  const { data, isLoading, isError, fetchStatus, refetch } = useMenu();
  const offline = fetchStatus === 'paused';

  const days = data?.days ?? [];
  const defaultDay = days.find((d) => d.day === todayName())?.day ?? days[0]?.day;
  const [day, setDay] = useState<string | undefined>(undefined);
  const [meal, setMeal] = useState<MealKind>('lunch');
  const selectedDay = day ?? defaultDay;
  const activeDay: MenuDay | undefined = days.find((d) => d.day === selectedDay);

  if (isLoading) {
    return (
      <SkeletonGroup accessibilityLabel={t('states.loading')} style={styles.loading}>
        <CardSkeleton />
        <CardSkeleton />
      </SkeletonGroup>
    );
  }

  if (!data || isError) {
    return (
      <StateView
        kind={offline ? 'offline' : 'error'}
        title={offline ? t('states.offline.title') : t('states.error.title')}
        message={offline ? t('states.offline.message') : t('states.error.message')}
        action={{ label: t('states.error.retry'), onPress: () => void refetch() }}
      />
    );
  }

  if (days.length === 0) {
    return (
      <StateView
        kind="empty"
        icon="menu"
        title={t('menu.empty.title')}
        message={t('menu.empty.message')}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.meal}>
        <SegmentedControl
          accessibilityLabel={t('menu.title')}
          options={[
            { value: 'breakfast', label: t('menu.meals.breakfast') },
            { value: 'lunch', label: t('menu.meals.lunch') },
            { value: 'dinner', label: t('menu.meals.dinner') },
          ]}
          value={meal}
          onChange={setMeal}
          testID="menu-meal-toggle"
        />
      </View>

      {meal === 'breakfast' ? (
        <View style={styles.courses}>
          {data.breakfast.map((group) => (
            <Card key={group.category} style={styles.courseCard}>
              <Text variant="overline" color="primary">
                {t(`menu.breakfastCategories.${group.category}`, { defaultValue: group.category })}
              </Text>
              <View style={styles.items}>
                {group.items.map((item, index) => (
                  <Text key={index} variant="body">
                    {itemText(item, language)}
                  </Text>
                ))}
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.days}
          >
            {days.map((d) => (
              <Chip
                key={d.day}
                label={dayLabel(d.day, language, 'short')}
                selected={d.day === selectedDay}
                onPress={() => setDay(d.day)}
                testID={`menu-day-${d.day}`}
              />
            ))}
          </ScrollView>
          {activeDay ? <MealCourses meal={activeDay[meal]} language={language} /> : null}
        </>
      )}
    </ScrollView>
  );
}

const useStyles = createStyles((theme) => ({
  loading: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    gap: theme.spacing[3],
  },
  content: {
    paddingBottom: theme.spacing[10],
  },
  meal: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[1],
  },
  days: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    gap: theme.spacing[2],
  },
  courses: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
    gap: theme.spacing[3],
  },
  courseCard: {
    gap: theme.spacing[2],
  },
  items: {
    gap: theme.spacing[1],
  },
  noMeal: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
  },
}));
