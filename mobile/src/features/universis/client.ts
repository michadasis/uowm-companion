import { z } from 'zod';

import { courseKey } from './match';
import type { StudentCourse } from './types';

/** The University of Western Macedonia's Universis API. */
export const UNIVERSIS_API = 'https://api1.uowm.gr/api';

/**
 * The student's full course list, with the grade, status & type expanded so a
 * course carries what we need to tell passed from owed. Universis speaks OData.
 */
const coursesPath =
  "/students/me/courses?$expand=course,courseType,status&$orderby=semester&$count=false";

// Universis returns far more than we read, and field names vary a little by
// version, so the schema is lenient: every field optional, unknown keys kept.
const rawCourse = z
  .object({
    semester: z.number().optional(),
    grade: z.union([z.number(), z.string()]).optional(),
    isPassed: z.boolean().optional(),
    ects: z.number().optional(),
    courseTitle: z.string().optional(),
    courseCode: z.string().optional(),
    course: z.object({ name: z.string().optional(), displayCode: z.string().optional() }).passthrough().optional(),
    courseType: z.object({ abbreviation: z.string().optional(), name: z.string().optional() }).passthrough().optional(),
    status: z.object({ alternateName: z.string().optional(), name: z.string().optional() }).passthrough().optional(),
  })
  .passthrough();

const coursesResponse = z.union([z.array(rawCourse), z.object({ value: z.array(rawCourse) }).passthrough()]);

type RawCourse = z.infer<typeof rawCourse>;

function toNumber(value: number | string | undefined): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value.replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * Maps one Universis course to our shape. Passed is read from the explicit flag
 * where the API sets it, and otherwise from the grade against the 5/10 pass
 * mark, so a graded course is judged even when the flag is missing.
 */
export function mapCourse(raw: RawCourse): StudentCourse | null {
  const name = raw.courseTitle ?? raw.course?.name;
  if (!name) return null;

  const grade = toNumber(raw.grade);
  const statusName = (raw.status?.alternateName ?? raw.status?.name)?.toLowerCase();
  const passed =
    raw.isPassed === true ||
    statusName === 'passed' ||
    statusName === 'completed' ||
    (raw.isPassed === undefined && grade !== undefined && grade >= 5);

  return {
    name,
    passed,
    ...(raw.courseCode ?? raw.course?.displayCode ? { code: raw.courseCode ?? raw.course!.displayCode } : {}),
    ...(raw.courseType?.abbreviation ?? raw.courseType?.name
      ? { type: raw.courseType.abbreviation ?? raw.courseType.name }
      : {}),
    ...(raw.ects !== undefined ? { ects: raw.ects } : {}),
    ...(grade !== undefined ? { grade } : {}),
    ...(raw.semester !== undefined ? { semester: raw.semester } : {}),
  };
}

export class UniversisError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'UniversisError';
    this.status = status;
  }
}

/**
 * Fetches the signed-in student's courses from Universis with their Bearer
 * token. A 401 means the token has expired & the student should sign in again.
 */
export async function fetchStudentCourses(
  token: string,
  options: { signal?: AbortSignal; baseUrl?: string } = {},
): Promise<StudentCourse[]> {
  const base = options.baseUrl ?? UNIVERSIS_API;
  let response: Response;
  try {
    response = await fetch(`${base}${coursesPath}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: options.signal,
    });
  } catch {
    throw new UniversisError('Could not reach Universis', undefined);
  }
  if (!response.ok) throw new UniversisError(`Universis replied ${response.status}`, response.status);

  const body = coursesResponse.parse(await response.json());
  const list = Array.isArray(body) ? body : body.value;
  return list.map(mapCourse).filter((c): c is StudentCourse => c !== null);
}

// A registration (a submitted declaration) holds the classes the student
// declared for a period. The latest one is the current declaration.
const registrationsPath =
  '/students/me/registrations?$expand=classes($expand=course,courseType)&$count=false';

const registrationClass = z
  .object({
    semester: z.number().optional(),
    courseTitle: z.string().optional(),
    courseCode: z.string().optional(),
    course: z.object({ name: z.string().optional(), displayCode: z.string().optional() }).passthrough().optional(),
  })
  .passthrough();

const registration = z
  .object({
    registrationYear: z.number().optional(),
    academicYear: z.number().optional(),
    semester: z.number().optional(),
    classes: z.array(registrationClass).optional(),
  })
  .passthrough();

const registrationsResponse = z.union([
  z.array(registration),
  z.object({ value: z.array(registration) }).passthrough(),
]);

type Registration = z.infer<typeof registration>;

function registrationOrder(r: Registration): number {
  return (r.registrationYear ?? r.academicYear ?? 0) * 10 + (r.semester ?? 0);
}

/**
 * The courses on the student's latest submitted declaration. Universis returns
 * a declaration per period; the most recent one is what the student is taking
 * now. Returns names (with code & semester) for matching against the schedule.
 */
export async function fetchStudentRegistrations(
  token: string,
  options: { signal?: AbortSignal; baseUrl?: string } = {},
): Promise<{ name: string; code?: string; semester?: number }[]> {
  const base = options.baseUrl ?? UNIVERSIS_API;
  let response: Response;
  try {
    response = await fetch(`${base}${registrationsPath}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: options.signal,
    });
  } catch {
    throw new UniversisError('Could not reach Universis', undefined);
  }
  if (!response.ok) throw new UniversisError(`Universis replied ${response.status}`, response.status);

  const body = registrationsResponse.parse(await response.json());
  const all = Array.isArray(body) ? body : body.value;
  if (all.length === 0) return [];

  const latest = all.reduce((a, b) => (registrationOrder(b) >= registrationOrder(a) ? b : a));
  return (latest.classes ?? []).flatMap((c) => {
    const name = c.courseTitle ?? c.course?.name;
    if (!name) return [];
    const code = c.courseCode ?? c.course?.displayCode;
    return [{ name, ...(code ? { code } : {}), ...(c.semester !== undefined ? { semester: c.semester } : {}) }];
  });
}

/**
 * The student's courses with both facts the filter needs: whether each is
 * passed (from the transcript) & whether it is on the current declaration. The
 * transcript is required; a declaration that fails to load just leaves the
 * registered flag off, so the owed filter still works.
 */
export async function loadStudentCourses(
  token: string,
  options: { signal?: AbortSignal; baseUrl?: string } = {},
): Promise<StudentCourse[]> {
  const [coursesResult, registrationsResult] = await Promise.allSettled([
    fetchStudentCourses(token, options),
    fetchStudentRegistrations(token, options),
  ]);
  if (coursesResult.status === 'rejected') throw coursesResult.reason;

  const courses = coursesResult.value;
  const registered = registrationsResult.status === 'fulfilled' ? registrationsResult.value : [];
  const registeredKeys = new Set(registered.map((r) => courseKey(r.name)));

  const known = new Set(courses.map((c) => courseKey(c.name)));
  const merged = courses.map((c) =>
    registeredKeys.has(courseKey(c.name)) ? { ...c, registered: true } : c,
  );
  // A freshly declared course may not be in the transcript yet; add it so the
  // registered filter still finds it.
  for (const r of registered) {
    const key = courseKey(r.name);
    if (!known.has(key)) {
      merged.push({
        name: r.name,
        passed: false,
        registered: true,
        ...(r.code ? { code: r.code } : {}),
        ...(r.semester !== undefined ? { semester: r.semester } : {}),
      });
    }
  }
  return merged;
}
