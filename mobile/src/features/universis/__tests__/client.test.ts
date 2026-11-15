import {
  fetchStudentCourses,
  fetchStudentRegistrations,
  loadStudentCourses,
  mapCourse,
  UniversisError,
} from '../client';

// Routes a mocked fetch by whether the URL is the courses or registrations call.
function mockApi(bodies: { courses?: unknown; registrations?: unknown; status?: number }) {
  return jest.spyOn(globalThis, 'fetch').mockImplementation((input) => {
    const url = String(input);
    const isReg = url.includes('/registrations');
    if (bodies.status && bodies.status >= 400) {
      return Promise.resolve({ ok: false, status: bodies.status } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: async () => (isReg ? (bodies.registrations ?? []) : (bodies.courses ?? [])),
    } as Response);
  });
}

describe('mapCourse', () => {
  it('reads a passed course with nested course & type', () => {
    expect(
      mapCourse({
        semester: 1,
        grade: 7.2,
        isPassed: true,
        ects: 5,
        course: { name: 'Εισαγωγή στους Υπολογιστές', displayCode: 'Π-Α-01' },
        courseType: { abbreviation: 'Υ', name: 'Υποχρεωτικό' },
        status: { alternateName: 'passed' },
      }),
    ).toEqual({
      name: 'Εισαγωγή στους Υπολογιστές',
      passed: true,
      code: 'Π-Α-01',
      type: 'Υ',
      ects: 5,
      grade: 7.2,
      semester: 1,
    });
  });

  it('falls back to the grade when there is no passed flag', () => {
    expect(mapCourse({ course: { name: 'Φυσική' }, grade: '4' })).toMatchObject({
      name: 'Φυσική',
      passed: false,
    });
    expect(mapCourse({ course: { name: 'Διακριτά' }, grade: '5' })).toMatchObject({ passed: true });
  });

  it('treats an ungraded course as not passed', () => {
    expect(mapCourse({ course: { name: 'Αλγόριθμοι' } })).toMatchObject({ passed: false });
  });

  it('skips a row with no course name', () => {
    expect(mapCourse({ grade: 8 })).toBeNull();
  });
});

describe('fetchStudentCourses', () => {
  const token = 'test-token';
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends the Bearer token & maps the list', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [
        { course: { name: 'Φυσική' }, grade: 8, isPassed: true },
        { course: { name: 'Χημεία' }, grade: 3, isPassed: false },
      ],
    } as Response);

    const courses = await fetchStudentCourses(token, { baseUrl: 'https://api.test' });

    expect(courses.map((c) => [c.name, c.passed])).toEqual([
      ['Φυσική', true],
      ['Χημεία', false],
    ]);
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
  });

  it('accepts an OData { value: [...] } envelope', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ value: [{ course: { name: 'Φυσική' }, isPassed: true }] }),
    } as Response);

    const courses = await fetchStudentCourses(token, { baseUrl: 'https://api.test' });
    expect(courses).toHaveLength(1);
  });

  it('raises a typed error with the status on a failure', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 401 } as Response);
    await expect(fetchStudentCourses(token, { baseUrl: 'https://api.test' })).rejects.toMatchObject({
      name: 'UniversisError',
      status: 401,
    });
  });

  it('wraps a network failure', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await expect(fetchStudentCourses(token, { baseUrl: 'https://api.test' })).rejects.toBeInstanceOf(
      UniversisError,
    );
  });
});

describe('fetchStudentRegistrations', () => {
  const token = 'tok';
  afterEach(() => jest.restoreAllMocks());

  it('takes the latest declaration & maps its classes', async () => {
    mockApi({
      registrations: [
        { registrationYear: 2024, classes: [{ course: { name: 'Παλιό', displayCode: 'Π-Α-01' } }] },
        {
          registrationYear: 2026,
          semester: 3,
          classes: [
            { course: { name: 'Φυσική', displayCode: 'Π-Β-03' }, semester: 3 },
            { course: { name: 'Μεταγλωττιστές' } },
          ],
        },
      ],
    });

    const reg = await fetchStudentRegistrations(token, { baseUrl: 'https://api.test' });
    expect(reg.map((r) => r.name)).toEqual(['Φυσική', 'Μεταγλωττιστές']);
    expect(reg[0]).toMatchObject({ name: 'Φυσική', code: 'Π-Β-03', semester: 3 });
  });

  it('returns nothing when there are no declarations', async () => {
    mockApi({ registrations: [] });
    expect(await fetchStudentRegistrations(token, { baseUrl: 'https://api.test' })).toEqual([]);
  });
});

describe('loadStudentCourses', () => {
  const token = 'tok';
  afterEach(() => jest.restoreAllMocks());

  it('flags the transcript courses that are on the current declaration', async () => {
    mockApi({
      courses: [
        { course: { name: 'Φυσική' }, isPassed: false },
        { course: { name: 'Αλγόριθμοι' }, isPassed: true },
      ],
      registrations: [{ registrationYear: 2026, classes: [{ course: { name: 'Φυσική' } }] }],
    });

    const merged = await loadStudentCourses(token, { baseUrl: 'https://api.test' });
    expect(merged.find((c) => c.name === 'Φυσική')?.registered).toBe(true);
    expect(merged.find((c) => c.name === 'Αλγόριθμοι')?.registered).toBeUndefined();
  });

  it('adds a declared course that is not yet in the transcript', async () => {
    mockApi({
      courses: [{ course: { name: 'Φυσική' }, isPassed: true }],
      registrations: [{ registrationYear: 2026, classes: [{ course: { name: 'Νέο Μάθημα' } }] }],
    });

    const merged = await loadStudentCourses(token, { baseUrl: 'https://api.test' });
    expect(merged.find((c) => c.name === 'Νέο Μάθημα')).toMatchObject({
      registered: true,
      passed: false,
    });
  });

  it('still returns the transcript when the declaration call fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      if (String(input).includes('/registrations')) return Promise.reject(new Error('down'));
      return Promise.resolve({
        ok: true,
        json: async () => [{ course: { name: 'Φυσική' }, isPassed: false }],
      } as Response);
    });

    const merged = await loadStudentCourses(token, { baseUrl: 'https://api.test' });
    expect(merged.map((c) => c.name)).toEqual(['Φυσική']);
  });

  it('fails when the transcript itself fails', async () => {
    mockApi({ status: 401 });
    await expect(loadStudentCourses(token, { baseUrl: 'https://api.test' })).rejects.toMatchObject({
      status: 401,
    });
  });
});
