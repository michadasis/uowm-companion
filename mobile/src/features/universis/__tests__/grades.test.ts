import { bySemester, formatGrade, semesterLetter, summarise } from '../grades';
import type { StudentCourse } from '../types';

const course = (name: string, extra: Partial<StudentCourse> = {}): StudentCourse => ({
  name,
  passed: false,
  ...extra,
});

describe('summarise', () => {
  it('weights the average of the passed courses by coefficient & counts their ECTS', () => {
    const summary = summarise([
      course('Α', { passed: true, grade: 8, coefficient: 2, ects: 6 }),
      course('Β', { passed: true, grade: 5, coefficient: 1, ects: 5 }),
      course('Γ', { passed: false, grade: 3, coefficient: 1, ects: 5 }),
      course('Δ'),
    ]);
    expect(summary).toEqual({ passed: 2, total: 4, average: 7, ects: 11 });
  });

  it('has no average before any course is passed', () => {
    expect(summarise([course('Α', { grade: 2 })]).average).toBeNull();
  });
});

describe('bySemester', () => {
  it('groups by semester, earliest first, with unplaced courses last', () => {
    const groups = bySemester([
      course('Β', { semester: 3 }),
      course('Χωρίς'),
      course('Α', { semester: 1 }),
      course('Γ', { semester: 3 }),
    ]);
    expect(groups.map((g) => [g.semester, g.courses.map((c) => c.name)])).toEqual([
      [1, ['Α']],
      [3, ['Β', 'Γ']],
      [0, ['Χωρίς']],
    ]);
  });
});

describe('formatting', () => {
  it('names a semester by its Greek ordinal', () => {
    expect(semesterLetter(3)).toBe('Γ΄');
    expect(semesterLetter(6)).toBe('ΣΤ΄');
  });

  it('prints a grade with the decimal mark of the language', () => {
    expect(formatGrade(7.2, 'el')).toBe('7,2');
    expect(formatGrade(7.2, 'en')).toBe('7.2');
  });
});
