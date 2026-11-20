import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  Card,
  CardSkeleton,
  createStyles,
  DayStripButton,
  Icon,
  PressableScale,
  ScreenTitle,
  SkeletonGroup,
  StateView,
  Text,
} from '@/design';
import type { IconName } from '@/design';
import { weekDates } from '@/features/calendar/status';
import type { Language } from '@/features/settings/store';

import { dayLabel } from './format';
import type { Course, MealKind, Meal, MenuDay, MenuItem } from './schema';
import { courses } from './schema';
import { todayName, useMenu } from './useMenu';
import { isNetworkError } from '@/lib/api';

function itemText(item: MenuItem, language: Language): string {
  return language === 'en' ? item.en || item.el : item.el;
}

const mealIcons: Record<MealKind, IconName> = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
};

const courseIcons: Record<Course, IconName> = {
  first: 'soup',
  main: 'mainDish',
  extra: 'dessert',
};

const breakfastIcons: Record<string, IconName> = {
  drinks: 'breakfast',
  spreads: 'spread',
  breads: 'bread',
  staples: 'egg',
};

const weekdayOf: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

interface Section {
  key: string;
  label: string;
  icon: IconName;
  items: string[];
  /** The course a meal is chosen by, set larger. */
  lead?: boolean;
}

/**
 * A meal as a printed menu sets it: one card, a section per course, each with
 * its own small picture & divided from the next by a hairline.
 */
function MenuCard({ sections }: { sections: Section[] }) {
  const styles = useStyles();
  return (
    <Card style={styles.menuCard}>
      {sections.map((section, index) => (
        <View key={section.key} style={[styles.section, index > 0 ? styles.sectionRule : null]}>
          <View style={styles.courseIcon}>
            <Icon name={section.icon} size={20} color="onPrimaryMuted" />
          </View>
          <View style={styles.sectionText}>
            <Text variant="label" color="primary">
              {section.label}
            </Text>
            {section.items.map((item, itemIndex) => (
              <Text key={itemIndex} variant={section.lead ? 'heading' : 'body'}>
                {item}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </Card>
  );
}

function MealCourses({ meal, language }: { meal: Meal; language: Language }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const filled = courses.filter((course) => meal[course].length > 0);

  if (filled.length === 0) {
    return (
      <View style={styles.noMeal}>
        <Icon name="mainDish" size={28} color="textSubtle" />
        <Text variant="callout" color="textMuted" align="center">
          {t('menu.noMeal')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.courses}>
      <MenuCard
        sections={filled.map((course: Course) => ({
          key: course,
          label: t(`menu.courses.${course}`),
          icon: courseIcons[course],
          items: meal[course].map((item) => itemText(item, language)),
          lead: course === 'main',
        }))}
      />
    </View>
  );
}

/** The three meals as a row of buttons, each with its picture. */
function MealPicker({ value, onChange }: { value: MealKind; onChange: (meal: MealKind) => void }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const meals: MealKind[] = ['breakfast', 'lunch', 'dinner'];
  return (
    <View accessibilityRole="radiogroup" style={styles.meals} testID="menu-meal-toggle">
      {meals.map((meal) => {
        const selected = meal === value;
        return (
          <PressableScale
            key={meal}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={t(`menu.meals.${meal}`)}
            onPress={() => onChange(meal)}
            style={[styles.meal, selected ? styles.mealSelected : null]}
          >
            <Icon
              name={mealIcons[meal]}
              size={20}
              color={selected ? 'background' : 'onPrimaryMuted'}
            />
            <Text variant="label" color={selected ? 'background' : 'text'}>
              {t(`menu.meals.${meal}`)}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

export function MenuView({ now = new Date() }: { now?: Date }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const styles = useStyles();
  const { data, isLoading, isError, fetchStatus, refetch, error } = useMenu();
  // No network at all, or a request that tried & could not get through.
  const offline = fetchStatus === 'paused' || isNetworkError(error);

  const days = data?.days ?? [];
  const defaultDay = days.find((d) => d.day === todayName(now))?.day ?? days[0]?.day;
  const [day, setDay] = useState<string | undefined>(undefined);
  const [meal, setMeal] = useState<MealKind>('lunch');
  const selectedDay = day ?? defaultDay;
  const activeDay: MenuDay | undefined = days.find((d) => d.day === selectedDay);
  const dates = weekDates(now, false);

  const header = (
    <ScreenTitle title={t('menu.title')} tone="amber" icon="mainDish">
      <MealPicker value={meal} onChange={setMeal} />
    </ScreenTitle>
  );

  if (isLoading) {
    return (
      <View>
        {header}
        <SkeletonGroup accessibilityLabel={t('states.loading')} style={styles.loading}>
          <CardSkeleton />
          <CardSkeleton />
        </SkeletonGroup>
      </View>
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
      {header}

      {meal === 'breakfast' ? (
        <View style={[styles.courses, styles.afterHeader]}>
          <MenuCard
            sections={data.breakfast.map((group) => ({
              key: group.category,
              label: t(`menu.breakfastCategories.${group.category}`, {
                defaultValue: group.category,
              }),
              icon: breakfastIcons[group.category] ?? 'breakfast',
              items: group.items.map((item) => itemText(item, language)),
            }))}
          />
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.days}
          >
            {days.map((d) => (
              <DayStripButton
                key={d.day}
                label={dayLabel(d.day, language, 'short')}
                date={dates.get(weekdayOf[d.day] ?? 0)}
                selected={d.day === selectedDay}
                today={d.day === todayName(now)}
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
    paddingTop: theme.spacing[4],
    gap: theme.spacing[3],
  },
  content: {
    paddingBottom: theme.spacing[10],
  },
  meals: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  meal: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing[1],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  mealSelected: {
    backgroundColor: theme.colors.text,
  },
  days: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[2],
    gap: theme.spacing[1],
  },
  afterHeader: {
    paddingTop: theme.spacing[4],
  },
  courses: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
  },
  menuCard: {
    paddingVertical: theme.spacing[1],
  },
  section: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    paddingVertical: theme.spacing[3],
  },
  sectionRule: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  courseIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionText: {
    flex: 1,
    gap: theme.spacing[1],
  },
  noMeal: {
    alignItems: 'center',
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[8],
  },
}));
