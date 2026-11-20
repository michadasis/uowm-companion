import { describe, expect, it } from 'vitest';

import {
  cities,
  departments,
  findDepartment,
  getCity,
  getSchool,
  schools,
  university,
} from '../src/registry/index.js';
import type { AnnouncementsSource, Department, ScheduleSource } from '../src/registry/index.js';

const greek = /[Ͱ-Ͽ]/;

function sourceUrls(department: Department): string[] {
  const { announcements, exams, timetable, staff, secretariat } = department.sources;
  const schedule = (source: ScheduleSource | undefined) =>
    source
      ? [
          'apiRoot' in source
            ? source.apiRoot
            : 'listingUrl' in source
              ? source.listingUrl
              : source.pageUrl,
        ]
      : [];
  return [
    announcements.adapter === 'wordpress-rest' ? announcements.apiRoot : announcements.listingUrl,
    ...schedule(exams),
    ...schedule(timetable),
    ...(staff ?? []).map((source) => source.url),
    ...(secretariat ? [secretariat.url] : []),
  ];
}

function expectValidAnnouncements(source: AnnouncementsSource) {
  if (source.adapter === 'wordpress-rest') {
    expect(source.apiRoot).toMatch(/\/wp-json\/$/);
    expect(source.categories.length).toBeGreaterThan(0);
    for (const category of source.categories) {
      expect(Number.isInteger(category) && category > 0).toBe(true);
    }
  } else {
    expect(() => new URL(source.listingUrl)).not.toThrow();
    // The archive gives the post links; the post pages live under this prefix.
    expect(source.postPathPrefix.startsWith('/')).toBe(true);
    expect(source.postPathPrefix.endsWith('/')).toBe(true);
  }
}

describe('places', () => {
  it('lists the five cities and seven schools', () => {
    expect(cities.map((city) => city.id).sort()).toEqual([
      'florina',
      'grevena',
      'kastoria',
      'kozani',
      'ptolemaida',
    ]);
    expect(schools).toHaveLength(7);
  });

  it('seats every school in a known city', () => {
    for (const school of schools) {
      expect(() => getCity(school.seat)).not.toThrow();
    }
  });

  it('has at least one department in every school and every city', () => {
    for (const school of schools) {
      expect(departments.some((department) => department.school === school.id)).toBe(true);
    }
    for (const city of cities) {
      expect(departments.some((department) => department.city === city.id)).toBe(true);
    }
  });
});

describe('departments', () => {
  it('covers all 22 departments of the university', () => {
    expect(departments).toHaveLength(22);
  });

  it('gives every department a unique id', () => {
    const ids = departments.map((department) => department.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(departments.map((department) => [department.id, department] as const))(
    '%s is well formed',
    (id, department) => {
      expect(id).toMatch(/^[a-z]+$/);
      expect(department.website).toBe(`https://${id}.uowm.gr`);
      expect(() => getSchool(department.school)).not.toThrow();
      expect(() => getCity(department.city)).not.toThrow();

      expect(department.name.el).toMatch(greek);
      expect(department.name.en).toBe(`Department of ${department.shortName.en}`);
      expect(department.name.en).not.toMatch(greek);
      expect(department.name.el).toContain('Τμήμα');
      // "Τμήμα Πληροφορικής" shortens to "Πληροφορικής"; the two education
      // departments keep "Παιδαγωγικό" in front.
      const withoutPrefix = department.shortName.el.replace(/^Παιδαγωγικό /, '');
      expect(department.name.el.endsWith(withoutPrefix)).toBe(true);

      for (const alias of department.aliases) {
        expect(alias.trim()).toBe(alias);
        expect(alias).not.toBe('');
      }
    },
  );

  it.each(departments.map((department) => [department.id, department] as const))(
    '%s only reads from its own site over HTTPS',
    (id, department) => {
      for (const url of sourceUrls(department)) {
        const parsed = new URL(url);
        expect(parsed.protocol).toBe('https:');
        expect(parsed.hostname).toBe(`${id}.uowm.gr`);
      }
    },
  );

  it('has an announcements source for every department', () => {
    for (const department of departments) {
      expectValidAnnouncements(department.sources.announcements);
    }
  });

  it('labels every menu link it has to find again', () => {
    for (const department of departments) {
      for (const source of [department.sources.exams, department.sources.timetable]) {
        if (source?.adapter === 'menu-link') {
          expect(source.label.trim()).not.toBe('');
        }
      }
    }
  });

  it('has every source for Informatics', () => {
    const informatics = findDepartment('cs');
    expect(informatics).toBeDefined();
    expect(Object.keys(informatics?.sources ?? {}).sort()).toEqual([
      'announcements',
      'exams',
      'secretariat',
      'staff',
      'timetable',
    ]);
  });

  it('returns nothing for an unknown id', () => {
    expect(findDepartment('nope')).toBeUndefined();
  });
});

describe('university', () => {
  it('reads announcements from uowm.gr', () => {
    expectValidAnnouncements(university.announcements);
  });
});
