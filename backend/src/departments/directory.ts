import { cities, departments, schools } from '../registry/index.js';
import type {
  City,
  CityId,
  Department,
  LocalisedText,
  School,
  SchoolId,
  SourceKind,
} from '../registry/index.js';

/** A department as the app sees it: identity only, no scraping details. */
export interface DirectoryDepartment {
  id: string;
  name: LocalisedText;
  shortName: LocalisedText;
  aliases: string[];
  school: SchoolId;
  city: CityId;
  website: string;
  /** The features this department has a source for. */
  features: SourceKind[];
}

export interface Directory {
  cities: City[];
  schools: School[];
  departments: DirectoryDepartment[];
}

const featureOrder: readonly SourceKind[] = [
  'announcements',
  'exams',
  'timetable',
  'staff',
  'secretariat',
];

function toDirectoryDepartment(department: Department): DirectoryDepartment {
  return {
    id: department.id,
    name: department.name,
    shortName: department.shortName,
    aliases: department.aliases,
    school: department.school,
    city: department.city,
    website: department.website,
    features: featureOrder.filter((kind) => department.sources[kind] !== undefined),
  };
}

export function buildDirectory(): Directory {
  return {
    cities: [...cities],
    schools: [...schools],
    departments: departments.map(toDirectoryDepartment),
  };
}
