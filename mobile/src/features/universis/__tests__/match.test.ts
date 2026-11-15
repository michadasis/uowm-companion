import { courseKey, filterByCourses, selectedCourseKeys } from '../match';
import type { StudentCourse } from '../types';

const course = (name: string, passed: boolean, registered = false): StudentCourse => ({
  name,
  passed,
  registered,
});

describe('courseKey', () => {
  it('matches the same course across spelling, case & a trailing note', () => {
    expect(courseKey('ΕΙΣΑΓΩΓΗ ΣΤΟΥΣ ΥΠΟΛΟΓΙΣΤΕΣ')).toBe(courseKey('Εισαγωγή στους Υπολογιστές'));
    expect(courseKey('Εισαγωγή στον Προγραμματισμό (ΑΠ)')).toBe(
      courseKey('Εισαγωγή στον Προγραμματισμό'),
    );
  });

  it('keeps different courses apart', () => {
    expect(courseKey('Φυσική')).not.toBe(courseKey('Ηλεκτρονική'));
  });
});

describe('selectedCourseKeys', () => {
  const courses = [
    course('Εισαγωγή στους Υπολογιστές', true),
    course('Φυσική', false, true),
    course('Διακριτά Μαθηματικά', false, false),
  ];

  it('returns null for the all filter', () => {
    expect(selectedCourseKeys(courses, 'all')).toBeNull();
  });

  it('keeps the courses not yet passed for owed', () => {
    const keys = selectedCourseKeys(courses, 'owed')!;
    expect(keys.has(courseKey('Φυσική'))).toBe(true);
    expect(keys.has(courseKey('Διακριτά Μαθηματικά'))).toBe(true);
    expect(keys.has(courseKey('Εισαγωγή στους Υπολογιστές'))).toBe(false);
  });

  it('keeps only the registered courses for registered', () => {
    const keys = selectedCourseKeys(courses, 'registered')!;
    expect([...keys]).toEqual([courseKey('Φυσική')]);
  });
});

describe('filterByCourses', () => {
  const classes = [
    { course: 'Φυσική', day: 1 },
    { course: 'Εισαγωγή στους Υπολογιστές', day: 2 },
  ];

  it('keeps everything when the set is null', () => {
    expect(filterByCourses(classes, null)).toHaveLength(2);
  });

  it('keeps only the classes whose course is selected', () => {
    const keys = new Set([courseKey('Φυσική')]);
    expect(filterByCourses(classes, keys).map((c) => c.course)).toEqual(['Φυσική']);
  });

  it('drops a class the information system does not list', () => {
    const keys = new Set([courseKey('Κάτι Άλλο')]);
    expect(filterByCourses(classes, keys)).toEqual([]);
  });
});
