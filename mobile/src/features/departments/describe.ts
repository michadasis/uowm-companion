import type { Language } from '@/features/settings/store';

import type { Department, Directory } from './schema';

/** A department's school and city on one line, for subtitles. */
export function describeDepartment(
  directory: Directory,
  department: Department,
  language: Language,
): string {
  const school = directory.schools.find((entry) => entry.id === department.school);
  const city = directory.cities.find((entry) => entry.id === department.city);
  return [school?.name[language], city?.name[language]].filter(Boolean).join(', ');
}
