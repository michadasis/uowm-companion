import type { StudentCourse } from './types';

export interface GradeSummary {
  /** Courses passed, out of every course on the transcript. */
  passed: number;
  total: number;
  /**
   * The average of the passed courses' grades, weighted by each course's
   * coefficient as the University weighs the degree mark; null before any pass.
   */
  average: number | null;
  /** ECTS earned from the passed courses. */
  ects: number;
}

export function summarise(courses: StudentCourse[]): GradeSummary {
  const passed = courses.filter((course) => course.passed);
  let weighted = 0;
  let weights = 0;
  for (const course of passed) {
    if (course.grade === undefined) continue;
    const weight = course.coefficient && course.coefficient > 0 ? course.coefficient : 1;
    weighted += course.grade * weight;
    weights += weight;
  }
  return {
    passed: passed.length,
    total: courses.length,
    average: weights > 0 ? Math.round((weighted / weights) * 100) / 100 : null,
    ects: passed.reduce((sum, course) => sum + (course.ects ?? 0), 0),
  };
}

/**
 * The most recently graded courses, newest first: what a student checks after
 * a sitting. A course graded with no known date comes after the dated ones.
 */
export function latestGrades(courses: StudentCourse[], count = 3): StudentCourse[] {
  return courses
    .filter((course) => course.grade !== undefined)
    .sort((a, b) => (b.gradedOrder ?? -1) - (a.gradedOrder ?? -1))
    .slice(0, count);
}

export interface SemesterGrades {
  /** 1-based; 0 gathers the courses Universis gave no semester. */
  semester: number;
  courses: StudentCourse[];
}

/** The courses grouped by semester, earliest first, each group in title order. */
export function bySemester(courses: StudentCourse[]): SemesterGrades[] {
  const groups = new Map<number, StudentCourse[]>();
  for (const course of courses) {
    const semester = course.semester ?? 0;
    const list = groups.get(semester);
    if (list) list.push(course);
    else groups.set(semester, [course]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === 0 ? 1 : b === 0 ? -1 : a - b))
    .map(([semester, list]) => ({
      semester,
      courses: [...list].sort((a, b) => a.name.localeCompare(b.name, 'el')),
    }));
}

const letters = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ', 'Ζ', 'Η', 'Θ', 'Ι', 'ΙΑ', 'ΙΒ'];

/** The Greek ordinal a semester goes by, e.g. 3 → "Γ΄". */
export function semesterLetter(semester: number): string {
  const letter = letters[semester - 1];
  return letter ? `${letter}΄` : String(semester);
}

/** A grade as the University prints it: "7,2" in Greek, "7.2" in English. */
export function formatGrade(grade: number, language: string): string {
  return new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(grade);
}
