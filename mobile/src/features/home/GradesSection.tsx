import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Card, createStyles, SectionHeader, Text } from '@/design';
import type { Language } from '@/features/settings/store';
import { formatGrade, latestGrades, summarise } from '@/features/universis/grades';
import { GradeSummaryCard } from '@/features/universis/GradeSummaryCard';
import { useStudentCourses } from '@/features/universis/useStudentCourses';

/**
 * The student's grades at a glance: the average as a ring with their ECTS &
 * passes, & the courses graded last — a fail in red. Only once Universis has
 * been linked; until then there is nothing of theirs to show.
 */
export function GradesSection() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const router = useRouter();
  const styles = useStyles();
  const { courses } = useStudentCourses();
  if (!courses || courses.length === 0) return null;

  const openGrades = () => router.push('/grades' as Href);
  const latest = latestGrades(courses);

  return (
    <View testID="home-grades">
      <SectionHeader title={t('universis.grades.title')} />
      <View style={styles.inset}>
        <GradeSummaryCard summary={summarise(courses)} onPress={openGrades} />
      </View>

      {latest.length > 0 ? (
        <>
          <SectionHeader
            title={t('universis.grades.latest')}
            action={{ label: t('universis.grades.all'), onPress: openGrades }}
          />
          <Card padded={false} style={styles.inset}>
            {latest.map((course, index) => (
              <View
                key={`${course.code ?? ''}:${course.name}`}
                style={[styles.row, index > 0 ? styles.rule : null]}
              >
                <View style={styles.course}>
                  {course.code ? (
                    <Text variant="caption" color="textSubtle">
                      {course.code}
                    </Text>
                  ) : null}
                  <Text
                    variant="subheading"
                    color={course.passed ? 'text' : 'danger'}
                    numberOfLines={2}
                  >
                    {course.name}
                  </Text>
                  {course.gradedIn ? (
                    <Text variant="caption" color="textMuted">
                      {course.gradedIn}
                    </Text>
                  ) : null}
                </View>
                <Text variant="title" color={course.passed ? 'success' : 'danger'}>
                  {course.grade !== undefined ? formatGrade(course.grade, language) : '—'}
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  inset: {
    marginHorizontal: theme.spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  rule: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  course: {
    flex: 1,
    gap: 2,
  },
}));
