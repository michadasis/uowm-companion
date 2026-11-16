import { courseKey } from './match';
import type { StudentCourse } from './types';

/** The University of Western Macedonia's Universis API. */
export const UNIVERSIS_API = 'https://api1.uowm.gr/api';

function query(params: [string, string][]): string {
  return `?${params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}`;
}

// Both requests are cut-down versions of the ones the official student app
// sends, checked against the live API. Universis speaks OData & pages at 25
// rows unless told otherwise, hence `$top=-1` on the transcript.
const coursesPath = `/students/me/courses${query([
  ['$expand', 'course,courseType'],
  ['$top', '-1'],
  ['$count', 'false'],
])}`;

const registrationsPath = `/students/me/registrations${query([
  ['$expand', 'classes($expand=course,courseType)'],
  ['$orderby', 'registrationYear desc,registrationPeriod desc'],
  ['$count', 'false'],
])}`;

export class UniversisError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'UniversisError';
    this.status = status;
  }
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;

// Universis sends a linked record either as its bare id or expanded into an
// object, depending on the field & the request: a semester is `3` in one reply
// & `{ id: 3, name: … }` in another. Both read as the number.
function numberOf(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (isObject(value)) return numberOf(value.id);
  return undefined;
}

/**
 * Whether a course is passed. Universis marks it with 1 or 0, not a boolean;
 * should the mark be missing, the grade decides — stored as a fraction of 1,
 * so 0.5 is the pass mark.
 */
function passedOf(raw: Json): boolean {
  if (raw.isPassed === 1 || raw.isPassed === true) return true;
  if (raw.isPassed === 0 || raw.isPassed === false) return false;
  const grade = raw.grade;
  if (typeof grade !== 'number') return false;
  return grade <= 1 ? grade >= 0.5 : grade >= 5;
}

const plainNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

// Universis keeps a grade as a fraction of 1 whatever scale it is shown on;
// the app shows it out of 10, as the University's own pages do.
function gradeOf(raw: Json): number | undefined {
  const grade = plainNumber(raw.grade);
  if (grade === undefined) return undefined;
  return Math.round((grade <= 1 ? grade * 10 : grade) * 100) / 100;
}

/** The exam period a course was graded in, e.g. "ΦΕΒΡ 2025-2026". */
function gradedInOf(raw: Json): string | undefined {
  const examPeriod = isObject(raw.examPeriod) ? raw.examPeriod : undefined;
  const period =
    text(raw.gradePeriodDescription) ?? text(examPeriod?.alternateName) ?? text(examPeriod?.name);
  const gradeYear = isObject(raw.gradeYear) ? raw.gradeYear : undefined;
  const year = text(gradeYear?.name) ?? text(gradeYear?.alternateName);
  return [period, year].filter(Boolean).join(' ') || undefined;
}

/**
 * Maps a Universis course — a row of the transcript or a class on a
 * declaration, which carry the same fields here — to our shape.
 */
export function mapCourse(raw: Json): StudentCourse | null {
  const course = isObject(raw.course) ? raw.course : undefined;
  const name = text(course?.name) ?? text(raw.courseTitle);
  if (!name) return null;

  const code = text(course?.displayCode);
  const courseType = isObject(raw.courseType) ? raw.courseType : undefined;
  const type = text(courseType?.abbreviation) ?? text(courseType?.name);
  const semester = numberOf(raw.semester);
  const grade = gradeOf(raw);
  const gradedIn = grade !== undefined ? gradedInOf(raw) : undefined;
  const ects = plainNumber(raw.ects);
  const coefficient = plainNumber(raw.coefficient);

  return {
    name,
    passed: passedOf(raw),
    ...(code ? { code } : {}),
    ...(type ? { type } : {}),
    ...(semester !== undefined ? { semester } : {}),
    ...(grade !== undefined ? { grade } : {}),
    ...(gradedIn ? { gradedIn } : {}),
    ...(ects !== undefined ? { ects } : {}),
    ...(coefficient !== undefined ? { coefficient } : {}),
  };
}

interface RequestOptions {
  signal?: AbortSignal;
  baseUrl?: string;
}

async function getList(path: string, token: string, options: RequestOptions): Promise<Json[]> {
  const base = options.baseUrl ?? UNIVERSIS_API;
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: options.signal,
    });
  } catch {
    throw new UniversisError('Could not reach Universis');
  }
  if (!response.ok) throw new UniversisError(`Universis replied ${response.status}`, response.status);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new UniversisError('Universis sent an unreadable reply');
  }
  // OData wraps a list as { value: [...] }; a bare array is accepted too.
  const items = Array.isArray(body) ? body : isObject(body) ? body.value : undefined;
  if (!Array.isArray(items)) throw new UniversisError('Universis sent an unexpected reply');
  return items.filter(isObject);
}

const mapCourses = (rows: unknown[]): StudentCourse[] =>
  rows
    .filter(isObject)
    .map(mapCourse)
    .filter((course): course is StudentCourse => course !== null);

/**
 * The student's transcript: every course they have taken, passed or not. A 401
 * means the token has expired & the student should sign in again.
 */
export async function fetchStudentCourses(
  token: string,
  options: RequestOptions = {},
): Promise<StudentCourse[]> {
  return mapCourses(await getList(coursesPath, token, options));
}

/**
 * The student's submitted declarations, the newest first, each as the courses
 * declared for that period. A declaration with no classes is left out, so the
 * first entry is always the one the student is actually attending.
 */
export async function fetchStudentDeclarations(
  token: string,
  options: RequestOptions = {},
): Promise<StudentCourse[][]> {
  const registrations = await getList(registrationsPath, token, options);
  return registrations
    .map((registration) => ({
      order:
        (numberOf(registration.registrationYear) ?? 0) * 10 +
        (numberOf(registration.registrationPeriod) ?? 0),
      classes: mapCourses(Array.isArray(registration.classes) ? registration.classes : []),
    }))
    .filter((declaration) => declaration.classes.length > 0)
    .sort((a, b) => b.order - a.order)
    .map((declaration) => declaration.classes);
}

// With no transcript to go on, a course counts as passed once any of the
// declarations it appears on says so.
function fromDeclarations(declarations: StudentCourse[][]): StudentCourse[] {
  const byKey = new Map<string, StudentCourse>();
  for (const course of declarations.flat()) {
    const key = courseKey(course.name);
    const known = byKey.get(key);
    if (known) known.passed = known.passed || course.passed;
    else byKey.set(key, { ...course });
  }
  return [...byKey.values()];
}

function worst(first: unknown, second: unknown): unknown {
  const expired = [first, second].find(
    (reason) => reason instanceof UniversisError && reason.status === 401,
  );
  return expired ?? first;
}

/**
 * The student's courses with both facts the filter needs: whether each is
 * passed & whether it is on the current declaration. The transcript and the
 * declarations are separate requests, & either alone is enough to work with:
 * without the transcript, passed is read off the declarations; without the
 * declarations, nothing is marked registered. Only when both fail does this
 * throw.
 */
export async function loadStudentCourses(
  token: string,
  options: RequestOptions = {},
): Promise<StudentCourse[]> {
  const [transcript, declared] = await Promise.allSettled([
    fetchStudentCourses(token, options),
    fetchStudentDeclarations(token, options),
  ]);
  if (transcript.status === 'rejected' && declared.status === 'rejected') {
    throw worst(transcript.reason, declared.reason);
  }

  const declarations = declared.status === 'fulfilled' ? declared.value : [];
  const current = declarations[0] ?? [];
  const courses =
    transcript.status === 'fulfilled' ? transcript.value : fromDeclarations(declarations);

  const registeredKeys = new Set(current.map((course) => courseKey(course.name)));
  const known = new Set(courses.map((course) => courseKey(course.name)));
  const merged = courses.map((course) =>
    registeredKeys.has(courseKey(course.name)) ? { ...course, registered: true } : course,
  );
  // A freshly declared course may not be on the transcript yet; add it so the
  // registered filter still finds it.
  for (const course of current) {
    if (!known.has(courseKey(course.name))) merged.push({ ...course, registered: true });
  }
  return merged;
}
