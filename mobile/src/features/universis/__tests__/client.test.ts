import {
  fetchStudentCourses,
  fetchStudentDeclarations,
  loadStudentCourses,
  mapCourse,
  UniversisError,
} from '../client';

// The fixtures below follow what the live API returns: lists wrapped in
// { value }, `isPassed` as 1 or 0, grades as a fraction of 1, & linked records
// either expanded into objects or left as bare ids.
const transcriptRow = (name: string, isPassed: number, extra: Record<string, unknown> = {}) => ({
  course: { id: 'c', name, displayCode: 'Π-Α-01' },
  courseTitle: name,
  courseType: { id: 1, name: 'ΥΠΟΧΡΕΩΤΙΚΟ', abbreviation: 'Υ' },
  semester: { id: 1, name: 'Α' },
  grade: isPassed ? 0.72 : null,
  formattedGrade: isPassed ? '7,2' : null,
  isPassed,
  ...extra,
});

const declaration = (year: number, period: number, names: string[], isPassed = 0) => ({
  registrationYear: { id: year, name: `${year}-${year + 1}` },
  registrationPeriod: { id: period, alternateName: period === 1 ? 'winter' : 'summer' },
  semester: 3,
  classes: names.map((name) => ({
    course: { id: 'c', name, displayCode: 'Π-Γ-01' },
    courseType: { abbreviation: 'Υ' },
    semester: 3,
    isPassed,
  })),
});

// Routes a mocked fetch by whether the URL is the transcript or the declarations.
function mockApi(replies: {
  courses?: unknown;
  registrations?: unknown;
  coursesStatus?: number;
  registrationsStatus?: number;
}) {
  return jest.spyOn(globalThis, 'fetch').mockImplementation((input) => {
    const isRegistrations = String(input).includes('/registrations');
    const status = isRegistrations ? replies.registrationsStatus : replies.coursesStatus;
    if (status && status >= 400) return Promise.resolve({ ok: false, status } as Response);
    const body = isRegistrations ? replies.registrations : replies.courses;
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body ?? { value: [] }),
    } as Response);
  });
}

const options = { baseUrl: 'https://api.test' };

afterEach(() => {
  jest.restoreAllMocks();
});

describe('mapCourse', () => {
  it('reads a transcript row as Universis sends it', () => {
    expect(mapCourse(transcriptRow('ΕΙΣΑΓΩΓΗ ΣΤΟΥΣ ΥΠΟΛΟΓΙΣΤΕΣ', 1))).toEqual({
      name: 'ΕΙΣΑΓΩΓΗ ΣΤΟΥΣ ΥΠΟΛΟΓΙΣΤΕΣ',
      passed: true,
      code: 'Π-Α-01',
      type: 'Υ',
      semester: 1,
      grade: 7.2,
    });
  });

  it('takes the 1 or 0 mark for passed, not a boolean', () => {
    expect(mapCourse(transcriptRow('Φυσική', 0))?.passed).toBe(false);
    expect(mapCourse(transcriptRow('Φυσική', 1))?.passed).toBe(true);
  });

  it('falls back to the grade, a fraction of 1, when the mark is missing', () => {
    const row = (grade: number) => ({ course: { name: 'Φυσική' }, grade });
    expect(mapCourse(row(0.5))?.passed).toBe(true);
    expect(mapCourse(row(0.45))?.passed).toBe(false);
  });

  it('reads a semester sent as a bare number or as an expanded record', () => {
    expect(mapCourse({ course: { name: 'Α' }, semester: 3 })?.semester).toBe(3);
    expect(mapCourse({ course: { name: 'Α' }, semester: { id: 3, name: 'Γ' } })?.semester).toBe(3);
  });

  it('uses the row title when the course is not expanded', () => {
    expect(mapCourse({ course: 'c-123', courseTitle: 'Φυσική', isPassed: 0 })?.name).toBe('Φυσική');
  });

  it('turns the grade into one out of 10 & names the period it was given in', () => {
    expect(
      mapCourse(
        transcriptRow('Φυσική', 0, {
          grade: 0.35,
          gradePeriodDescription: 'ΣΕΠΤ',
          gradeYear: { id: 2025, name: '2025-2026' },
          ects: 6,
          coefficient: 1.5,
        }),
      ),
    ).toMatchObject({
      grade: 3.5,
      passed: false,
      gradedIn: 'ΣΕΠΤ 2025-2026',
      ects: 6,
      coefficient: 1.5,
    });
  });

  it('leaves an ungraded course without a grade', () => {
    expect(mapCourse(transcriptRow('Φυσική', 0))).not.toHaveProperty('grade');
  });

  it('skips a row with no course name', () => {
    expect(mapCourse({ isPassed: 1 })).toBeNull();
  });
});

describe('fetchStudentCourses', () => {
  it('sends the Bearer token, asks for every row & unwraps the list', async () => {
    const fetchMock = mockApi({
      courses: { value: [transcriptRow('Φυσική', 1), transcriptRow('Χημεία', 0)] },
    });

    const courses = await fetchStudentCourses('tok', options);

    expect(courses.map((c) => [c.name, c.passed])).toEqual([
      ['Φυσική', true],
      ['Χημεία', false],
    ]);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    // Universis pages at 25 rows unless told otherwise.
    expect(decodeURIComponent(String(url))).toContain('$top=-1');
    expect(decodeURIComponent(String(url))).toContain('$expand=course,courseType');
  });

  it('accepts a bare array too', async () => {
    mockApi({ courses: [transcriptRow('Φυσική', 1)] });
    expect(await fetchStudentCourses('tok', options)).toHaveLength(1);
  });

  it('raises a typed error with the status on a failure', async () => {
    mockApi({ coursesStatus: 401 });
    await expect(fetchStudentCourses('tok', options)).rejects.toMatchObject({
      name: 'UniversisError',
      status: 401,
    });
  });

  it('wraps a network failure', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await expect(fetchStudentCourses('tok', options)).rejects.toBeInstanceOf(UniversisError);
  });

  it('rejects a reply that is not a list', async () => {
    mockApi({ courses: { message: 'nope' } });
    await expect(fetchStudentCourses('tok', options)).rejects.toBeInstanceOf(UniversisError);
  });
});

describe('fetchStudentDeclarations', () => {
  it('orders the declarations newest first, whatever order they arrive in', async () => {
    mockApi({
      registrations: {
        value: [
          declaration(2025, 1, ['Πρώτο']),
          declaration(2026, 1, ['Τρέχον Α', 'Τρέχον Β']),
          declaration(2025, 2, ['Δεύτερο']),
        ],
      },
    });

    const declarations = await fetchStudentDeclarations('tok', options);

    expect(declarations.map((d) => d.map((c) => c.name))).toEqual([
      ['Τρέχον Α', 'Τρέχον Β'],
      ['Δεύτερο'],
      ['Πρώτο'],
    ]);
  });

  it('leaves out a declaration with no classes', async () => {
    mockApi({
      registrations: { value: [declaration(2026, 2, []), declaration(2026, 1, ['Μάθημα'])] },
    });

    const declarations = await fetchStudentDeclarations('tok', options);
    expect(declarations).toHaveLength(1);
    expect(declarations[0]![0]!.name).toBe('Μάθημα');
  });

  it('returns nothing when there are no declarations', async () => {
    mockApi({ registrations: { value: [] } });
    expect(await fetchStudentDeclarations('tok', options)).toEqual([]);
  });
});

describe('loadStudentCourses', () => {
  it('flags the transcript courses that are on the current declaration', async () => {
    mockApi({
      courses: { value: [transcriptRow('Φυσική', 0), transcriptRow('Αλγόριθμοι', 1)] },
      registrations: {
        value: [declaration(2026, 1, ['Φυσική']), declaration(2025, 1, ['Αλγόριθμοι'])],
      },
    });

    const merged = await loadStudentCourses('tok', options);

    expect(merged.find((c) => c.name === 'Φυσική')?.registered).toBe(true);
    // On an older declaration, so not on the current one.
    expect(merged.find((c) => c.name === 'Αλγόριθμοι')?.registered).toBeUndefined();
  });

  it('adds a declared course that is not on the transcript yet', async () => {
    mockApi({
      courses: { value: [transcriptRow('Φυσική', 1)] },
      registrations: { value: [declaration(2026, 1, ['Νέο Μάθημα'])] },
    });

    const merged = await loadStudentCourses('tok', options);
    expect(merged.find((c) => c.name === 'Νέο Μάθημα')).toMatchObject({
      registered: true,
      passed: false,
    });
  });

  it('still returns the transcript when the declarations fail', async () => {
    mockApi({ courses: { value: [transcriptRow('Φυσική', 0)] }, registrationsStatus: 500 });

    const merged = await loadStudentCourses('tok', options);
    expect(merged.map((c) => c.name)).toEqual(['Φυσική']);
  });

  it('reads passed off the declarations when the transcript fails', async () => {
    mockApi({
      coursesStatus: 500,
      registrations: {
        value: [
          declaration(2026, 1, ['Μεταγλωττιστές']),
          declaration(2025, 2, ['Φυσική'], 1),
          declaration(2025, 1, ['Φυσική']),
        ],
      },
    });

    const merged = await loadStudentCourses('tok', options);

    // Failed on the first sitting & passed on a later one counts as passed.
    expect(merged.find((c) => c.name === 'Φυσική')?.passed).toBe(true);
    expect(merged.find((c) => c.name === 'Μεταγλωττιστές')).toMatchObject({
      passed: false,
      registered: true,
    });
  });

  it('fails with the expired-token error when both requests are refused', async () => {
    mockApi({ coursesStatus: 401, registrationsStatus: 401 });
    await expect(loadStudentCourses('tok', options)).rejects.toMatchObject({ status: 401 });
  });
});
