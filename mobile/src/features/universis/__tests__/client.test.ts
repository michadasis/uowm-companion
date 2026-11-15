import { fetchStudentCourses, mapCourse, UniversisError } from '../client';

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
