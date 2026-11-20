import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';

import {
  Card,
  CardSkeleton,
  Chip,
  createStyles,
  ListRow,
  NavBar,
  Screen,
  SectionHeader,
  SkeletonGroup,
  StateView,
  Text,
  useTheme,
} from '@/design';
import { formatUpdatedAt } from '@/features/announcements/format';
import { ExpiredNotice } from '@/features/universis/ExpiredNotice';
import { bySemester, formatGrade, semesterLetter, summarise } from '@/features/universis/grades';
import type { StudentCourse } from '@/features/universis/types';
import { useStudentCourses } from '@/features/universis/useStudentCourses';
import { displayNumeral } from '@/lib/greek';

type Show = 'all' | 'passed' | 'owed';

function GradeValue({ course, language }: { course: StudentCourse; language: string }) {
  if (course.grade === undefined) {
    return (
      <Text variant="label" color="textSubtle">
        —
      </Text>
    );
  }
  return (
    <Text variant="heading" color={course.passed ? 'success' : 'danger'}>
      {formatGrade(course.grade, language)}
    </Text>
  );
}

/**
 * The student's grades, read from Universis & kept on the device: they open
 * straight from the saved copy, with or without a live sign-in, & a notice
 * says when that copy may be out of date.
 */
export default function GradesScreen() {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles();
  const student = useStudentCourses();
  const [show, setShow] = useState<Show>('all');

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/more'));
  const connect = () => router.push('/universis-login' as Href);

  let body;
  if (student.courses === undefined) {
    if (student.isLoading) {
      body = (
        <SkeletonGroup accessibilityLabel={t('states.loading')} style={styles.content}>
          <CardSkeleton />
          <CardSkeleton />
        </SkeletonGroup>
      );
    } else if (student.isError) {
      body = (
        <StateView
          kind="error"
          title={t('states.error.title')}
          message={t('universis.grades.error')}
          action={{ label: t('states.error.retry'), onPress: student.refetch }}
        />
      );
    } else {
      body = (
        <StateView
          kind="empty"
          icon="department"
          title={t('universis.grades.connectTitle')}
          message={t('universis.grades.connectMessage')}
          action={{ label: t('universis.link.cta'), onPress: connect }}
        />
      );
    }
  } else {
    const summary = summarise(student.courses);
    const shown = student.courses.filter((course) =>
      show === 'passed' ? course.passed : show === 'owed' ? !course.passed : true,
    );
    body = (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          student.connected ? (
            <RefreshControl
              refreshing={student.isRefreshing}
              onRefresh={student.refetch}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          ) : undefined
        }
      >
        {student.expired ? (
          <ExpiredNotice updatedAt={student.updatedAt} onReconnect={connect} />
        ) : null}

        <Card style={styles.summary}>
          <View style={styles.stat}>
            <Text variant="title">
              {summary.average !== null ? formatGrade(summary.average, language) : '—'}
            </Text>
            <Text variant="caption" color="textMuted">
              {t('universis.grades.average')}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text variant="title">{`${summary.passed}/${summary.total}`}</Text>
            <Text variant="caption" color="textMuted">
              {t('universis.grades.passed')}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text variant="title">{formatGrade(summary.ects, language)}</Text>
            <Text variant="caption" color="textMuted">
              ECTS
            </Text>
          </View>
        </Card>
        {!student.expired && student.updatedAt ? (
          <Text variant="caption" color="textSubtle">
            {t('universis.grades.updated', {
              time: formatUpdatedAt(student.updatedAt, language),
            })}
          </Text>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {(['all', 'passed', 'owed'] as const).map((value) => (
            <Chip
              key={value}
              label={t(`universis.grades.show.${value}`)}
              selected={show === value}
              onPress={() => setShow(value)}
              testID={`grades-show-${value}`}
            />
          ))}
        </ScrollView>

        {bySemester(shown).map((group) => (
          <View key={group.semester} style={styles.group}>
            <SectionHeader
              title={
                group.semester > 0
                  ? displayNumeral(
                      t('universis.grades.semester', { letter: semesterLetter(group.semester) }),
                    )
                  : t('universis.grades.noSemester')
              }
              style={styles.groupHeader}
            />
            <Card padded={false}>
              {group.courses.map((course) => (
                <ListRow
                  key={`${course.code ?? ''}:${course.name}`}
                  title={course.name}
                  subtitle={[course.code, course.gradedIn].filter(Boolean).join(' · ') || undefined}
                  trailing={<GradeValue course={course} language={language} />}
                />
              ))}
            </Card>
          </View>
        ))}
        {shown.length === 0 ? (
          <Text variant="body" color="textMuted" style={styles.empty}>
            {t('universis.grades.none')}
          </Text>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <Screen edges={['top', 'bottom']} testID="grades-screen">
      <NavBar title={t('universis.grades.title')} onBack={goBack} backLabel={t('common.back')} />
      {body}
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
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    gap: theme.spacing[0.5],
  },
  chips: {
    gap: theme.spacing[2],
  },
  group: {
    gap: theme.spacing[1],
  },
  // The screen already sets the side margins.
  groupHeader: {
    paddingHorizontal: 0,
  },
  empty: {
    paddingVertical: theme.spacing[6],
    textAlign: 'center',
  },
}));
