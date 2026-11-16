import { courseKey, courseKeys, filterByCourses, selectedCourseKeys } from '../match';
import type { StudentCourse } from '../types';

const course = (name: string, passed: boolean, registered = false): StudentCourse => ({
  name,
  passed,
  registered,
});

// Each pair is one course as Universis names it & as a department's schedule
// document does; the titles come from the Informatics timetable & exam list.
describe('courseKey', () => {
  it.each([
    ['ΕΙΣΑΓΩΓΗ ΣΤΟΥΣ ΥΠΟΛΟΓΙΣΤΕΣ', 'Εισαγωγή στους Υπολογιστές'],
    ['ΠΙΘΑΝΟΤΗΤΕΣ - ΣΤΑΤΙΣΤΙΚΗ', 'Πιθανότητες-Στατιστική'],
    ['ΕΙΣΑΓΩΓΗ ΣΤΟΝ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟ ΥΠΟΛΟΓΙΣΤΩΝ', 'Εισαγωγή στον Προγραμματισμό Υπολογιστών (ΑΠ)'],
    ['ΗΛΕΚΤΡΟΝΙΚΗ', 'Ηλεκτρονική-ΑΠ'],
    ['ΕΙΣΑΓΩΓΗ ΣΤΟΥΣ ΥΠΟΛΟΓΙΣΤΕΣ', 'Εισαγωγή σε Υπολογιστές'],
    ['ΤΕΧΝΟΛΟΓΙΕΣ ΔΙΑΔΙΚΤΥΟΥ ΚΑΙ ΚΙΝΗΤΟΣ ΥΠΟΛΟΓΙΣΜΟΣ', 'Τεχνολογίες Διαδικτύου- Κινητός Υπολογισμός'],
    ['ΔΙΔΑΚΤΙΚΗ ΜΕΘΟΔΟΛΟΓΙΑ', 'Διδακτική Μεθοδολογία (Συνδιδασκαλία με Τμήμα Μαθηματικών)'],
  ])('matches %s with %s', (universis, schedule) => {
    expect(courseKey(schedule)).toBe(courseKey(universis));
  });

  it('reads a Latin letter typed for its Greek lookalike as the Greek one', () => {
    // The timetable spells this "IΙ": a Latin I next to a Greek Ι.
    expect(courseKey('Ειδικά Θέματα Δικτύων IΙ')).toBe(courseKey('ΕΙΔΙΚΑ ΘΕΜΑΤΑ ΔΙΚΤΥΩΝ ΙΙ'));
  });

  it('keeps the parts of a numbered series apart', () => {
    expect(courseKey('Μαθηματική Ανάλυση Ι')).not.toBe(courseKey('Μαθηματική Ανάλυση ΙΙ'));
    expect(courseKey('Ειδικά Θέματα Δικτύων Ι')).not.toBe(courseKey('Ειδικά Θέματα Δικτύων ΙΙ'));
  });

  it('keeps different courses apart', () => {
    expect(courseKey('Φυσική')).not.toBe(courseKey('Ηλεκτρονική'));
    expect(courseKey('Εισαγωγή στους Υπολογιστές')).not.toBe(
      courseKey('Εισαγωγή στον Προγραμματισμό Υπολογιστών'),
    );
  });
});

describe('courseKeys', () => {
  it('gives a key for each course on a line that holds two', () => {
    expect(
      courseKeys('Αλγόριθμοι και Πολυπλοκότητα / Υπολογισιμότητα και Πολυπλοκότητα'),
    ).toEqual([courseKey('Αλγόριθμοι και Πολυπλοκότητα'), courseKey('Υπολογισιμότητα και Πολυπλοκότητα')]);
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
    const keys = selectedCourseKeys([course('ΦΥΣΙΚΗ', false)], 'owed');
    expect(filterByCourses(classes, keys).map((c) => c.course)).toEqual(['Φυσική']);
  });

  it('keeps a shared exam when either of its courses is selected', () => {
    const exams = [{ course: 'Αλγόριθμοι και Πολυπλοκότητα / Υπολογισιμότητα και Πολυπλοκότητα' }];
    const keys = selectedCourseKeys([course('ΥΠΟΛΟΓΙΣΙΜΟΤΗΤΑ ΚΑΙ ΠΟΛΥΠΛΟΚΟΤΗΤΑ', false)], 'owed');
    expect(filterByCourses(exams, keys)).toHaveLength(1);
  });

  it('drops a class the information system does not list', () => {
    const keys = selectedCourseKeys([course('Κάτι Άλλο', false)], 'owed');
    expect(filterByCourses(classes, keys)).toEqual([]);
  });
});
