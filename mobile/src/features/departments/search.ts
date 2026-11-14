import { fold } from '@/lib/greek';

import type { Department, Directory, School } from './schema';

export interface DirectoryFilter {
  query: string;
  /** Limits the result to one city, or null for all of them. */
  cityId: string | null;
}

export interface SchoolSection {
  school: School;
  departments: Department[];
}

/*
 * Students type Greek names in Latin letters as often as not, and nobody
 * agrees on the spelling: η is "i" or "h", ω is "o" or "w", χ is "x" or
 * "ch". Rather than guess one convention, both the Greek names and the query
 * are reduced to how the word sounds, where those spellings meet. The result
 * is not readable and is never shown; it only has to be the same on both
 * sides.
 */
const greekDigraphs: readonly (readonly [RegExp, string])[] = [
  [/ου/g, 'u'],
  [/αι/g, 'e'],
  [/[εου]ι/g, 'i'],
  [/αυ/g, 'av'],
  [/ευ/g, 'ev'],
  [/μπ/g, 'v'],
  [/ντ/g, 'd'],
  [/γ[γκ]/g, 'g'],
];

const greekLetters: Record<string, string> = {
  α: 'a',
  β: 'v',
  γ: 'g',
  δ: 'd',
  ε: 'e',
  ζ: 'z',
  η: 'i',
  θ: 'th',
  ι: 'i',
  κ: 'k',
  λ: 'l',
  μ: 'm',
  ν: 'n',
  ξ: 'x',
  ο: 'o',
  π: 'p',
  ρ: 'r',
  σ: 's',
  τ: 't',
  υ: 'i',
  φ: 'f',
  χ: 'x',
  ψ: 'ps',
  ω: 'o',
};

// Order matters: pairs are settled before the single letters inside them,
// and "ou" and "th" are parked as digits so the rules for a lone "u" and a
// lone "h" leave them alone.
const latinRules: readonly (readonly [RegExp, string])[] = [
  [/8/g, 'th'],
  [/3/g, 'x'],
  [/ou/g, '0'],
  [/th/g, '1'],
  [/ai/g, 'e'],
  [/[eo]i/g, 'i'],
  [/au/g, 'av'],
  [/eu/g, 'ev'],
  [/ch|ks/g, 'x'],
  [/ph/g, 'f'],
  [/mp/g, 'v'],
  [/nt/g, 'd'],
  [/g[gk]/g, 'g'],
  [/[hyu]/g, 'i'],
  [/w/g, 'o'],
  [/b/g, 'v'],
  [/c/g, 'k'],
  [/0/g, 'u'],
  [/1/g, 'th'],
];

function soundOfGreek(folded: string): string {
  let text = folded;
  for (const [pattern, replacement] of greekDigraphs) text = text.replace(pattern, replacement);
  return text.replace(/[α-ω]/g, (letter) => greekLetters[letter] ?? letter);
}

function soundOfLatin(folded: string): string {
  let text = folded;
  for (const [pattern, replacement] of latinRules) text = text.replace(pattern, replacement);
  return text;
}

interface Entry {
  /** Everything the department can be found by, as typed. */
  written: string;
  /** The Greek names by sound, for queries typed in Latin letters. */
  spoken: string;
}

const indexes = new WeakMap<Directory, Map<string, Entry>>();

function indexOf(directory: Directory): Map<string, Entry> {
  let index = indexes.get(directory);
  if (index) return index;

  index = new Map();
  for (const department of directory.departments) {
    const city = directory.cities.find((entry) => entry.id === department.city);
    const school = directory.schools.find((entry) => entry.id === department.school);
    const greek = [department.name.el, city?.name.el, school?.name.el, ...department.aliases];
    const latin = [department.name.en, city?.name.en, school?.name.en, department.id];

    const foldedGreek = greek.filter((text) => text !== undefined).map(fold);
    index.set(department.id, {
      written: [...foldedGreek, ...latin.filter((text) => text !== undefined).map(fold)].join('\n'),
      spoken: foldedGreek.map(soundOfGreek).join('\n'),
    });
  }
  indexes.set(directory, index);
  return index;
}

function matches(entry: Entry, words: readonly string[]): boolean {
  return words.every(
    (word) => entry.written.includes(word) || entry.spoken.includes(soundOfLatin(word)),
  );
}

/**
 * The departments that match a search and a city, grouped by school in the
 * university's own order. Every word of the query has to be found, in the
 * department's name, its abbreviation, its city or its school.
 */
export function filterDirectory(directory: Directory, filter: DirectoryFilter): SchoolSection[] {
  const index = indexOf(directory);
  const words = fold(filter.query).split(' ').filter(Boolean);

  const found = directory.departments.filter((department) => {
    if (filter.cityId !== null && department.city !== filter.cityId) return false;
    const entry = index.get(department.id);
    return entry !== undefined && matches(entry, words);
  });

  return directory.schools
    .map((school) => ({
      school,
      departments: found.filter((department) => department.school === school.id),
    }))
    .filter((section) => section.departments.length > 0);
}
