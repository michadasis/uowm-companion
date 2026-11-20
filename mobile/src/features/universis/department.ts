import type { Directory } from '@/features/departments/schema';

/** Capitals with no accents, no "Τμήμα" & no punctuation, to compare names written differently. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\b(ΤΜΗΜΑ|ΤΜ|ΠΑΝΕΠΙΣΤΗΜΙΟ ΔΥΤΙΚΗΣ ΜΑΚΕΔΟΝΙΑΣ|DEPARTMENT OF|DEPARTMENT)\b/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Which of the app's departments a name from Universis means: the
 * department, or failing that its study programme, as Universis writes them —
 * "ΤΜΗΜΑ ΠΛΗΡΟΦΟΡΙΚΗΣ", "Πληροφορικής (Καστοριά)". Null when none is a clear
 * match, so the student picks it instead of being placed in the wrong one.
 */
export function matchDepartment(directory: Directory, names: readonly string[]): string | null {
  const departments = directory.departments.map((department) => ({
    id: department.id,
    keys: [department.name.el, department.name.en, department.shortName.el, ...department.aliases]
      .map(fold)
      .filter(Boolean),
  }));

  for (const raw of names) {
    const name = fold(raw);
    if (!name) continue;
    const exact = departments.find((department) => department.keys.includes(name));
    if (exact) return exact.id;
    // A name with more around it, as a city in brackets: the longest
    // department name it holds, so "Μηχανικών Υπολογιστών" isn't taken for
    // a shorter one it happens to contain.
    let best: { id: string; length: number } | null = null;
    for (const department of departments) {
      for (const key of department.keys) {
        if (
          key.length >= 6 &&
          ` ${name} `.includes(` ${key} `) &&
          key.length > (best?.length ?? 0)
        ) {
          best = { id: department.id, length: key.length };
        }
      }
    }
    if (best) return best.id;
  }
  return null;
}
