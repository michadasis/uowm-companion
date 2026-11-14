import { describeDepartment } from '../describe';
import { directorySchema } from '../schema';
import { bundledDirectory, findDepartment } from '../useDirectory';

describe('the bundled directory', () => {
  it('holds every city, school and department', () => {
    expect(bundledDirectory.cities).toHaveLength(5);
    expect(bundledDirectory.schools).toHaveLength(7);
    expect(bundledDirectory.departments).toHaveLength(22);
  });

  it('places every department in a school and a city it knows', () => {
    const schools = new Set(bundledDirectory.schools.map((school) => school.id));
    const cities = new Set(bundledDirectory.cities.map((city) => city.id));

    for (const department of bundledDirectory.departments) {
      expect(schools.has(department.school)).toBe(true);
      expect(cities.has(department.city)).toBe(true);
    }
  });
});

describe('directorySchema', () => {
  it('accepts a city it has never heard of', () => {
    const directory = structuredClone(bundledDirectory);
    directory.cities.push({ id: 'amyntaio', name: { el: 'Αμύνταιο', en: 'Amyntaio' } });

    expect(directorySchema.safeParse(directory).success).toBe(true);
  });

  it('ignores fields added by a newer backend', () => {
    const directory = { ...structuredClone(bundledDirectory), generatedAt: '2026-11-14' };

    expect(directorySchema.parse(directory)).not.toHaveProperty('generatedAt');
  });

  it('rejects a department without its names', () => {
    const directory = structuredClone(bundledDirectory) as unknown as {
      departments: Record<string, unknown>[];
    };
    delete directory.departments[0]!.name;

    expect(directorySchema.safeParse(directory).success).toBe(false);
  });

  it('rejects an empty directory, which could only be a backend fault', () => {
    expect(directorySchema.safeParse({ cities: [], schools: [], departments: [] }).success).toBe(
      false,
    );
  });
});

describe('findDepartment', () => {
  it('finds a department by id', () => {
    expect(findDepartment(bundledDirectory, 'cs')?.name.en).toBe('Department of Informatics');
  });

  it('returns nothing before one is chosen or for an id that no longer exists', () => {
    expect(findDepartment(bundledDirectory, null)).toBeUndefined();
    expect(findDepartment(bundledDirectory, 'gone')).toBeUndefined();
  });
});

describe('describeDepartment', () => {
  it('gives the school and the city in the chosen language', () => {
    const informatics = findDepartment(bundledDirectory, 'cs')!;

    expect(describeDepartment(bundledDirectory, informatics, 'el')).toBe(
      'Σχολή Θετικών Επιστημών · Καστοριά',
    );
    expect(describeDepartment(bundledDirectory, informatics, 'en')).toBe(
      'School of Science · Kastoria',
    );
  });
});
