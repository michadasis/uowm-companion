import { departments, university } from './departments.js';
import { cities, schools } from './places.js';
import type { City, CityId, Department, School, SchoolId } from './types.js';

export { cities, departments, schools, university };
export type * from './types.js';

const departmentsById = new Map(departments.map((department) => [department.id, department]));
const schoolsById = new Map(schools.map((school) => [school.id, school]));
const citiesById = new Map(cities.map((city) => [city.id, city]));

export function findDepartment(id: string): Department | undefined {
  return departmentsById.get(id);
}

export function getSchool(id: SchoolId): School {
  const school = schoolsById.get(id);
  if (!school) throw new Error(`Unknown school: ${id}`);
  return school;
}

export function getCity(id: CityId): City {
  const city = citiesById.get(id);
  if (!city) throw new Error(`Unknown city: ${id}`);
  return city;
}
