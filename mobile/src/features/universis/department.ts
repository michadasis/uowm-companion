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
 * Universis' undergraduate departments, by the id it gives each, as the app's
 * departments. Read off its LocalDepartments list: the current departments, &
 * the older ones — the former TEI programmes ("LG* ΛΟΓΙΣΤΙΚΗ", "HL") — whose
 * students now belong to one of them. Programmes with no department of their
 * own in the app (Balkan studies, creative writing, the test one) are left
 * out, so those students pick theirs.
 */
const byUniversisId: Record<string, string> = {
  // The current departments.
  '1541': 'mre',
  '1542': 'ide',
  // Named for Management Science, but coded as Regional & Cross-Border Development.
  '1543': 'rdcbs',
  '1544': 'mst',
  '1545': 'accfin',
  '1546': 'ba',
  '1547': 'stat',
  '1548': 'econ',
  '1549': 'iees',
  '1550': 'psy',
  '1551': 'cdm',
  '1552': 'agro',
  '1553': 'mw',
  '1554': 'cs',
  '1555': 'math',
  '1558': 'ot',
  '1566': 'econ',
  '600': 'eled',
  '601': 'eetf',
  '602': 'nured',
  '604': 'ece',
  '605': 'mech',
  '606': 'chemeng',
  // Earlier ids of the Kastoria departments.
  '490': 'cs',
  '491': 'cdm',
  '492': 'econ',
  // The former TEI programmes.
  '8001': 'mst',
  '8002': 'mst',
  '8003': 'ba',
  '8004': 'ba',
  '8005': 'ba',
  '8006': 'accfin',
  '8007': 'accfin',
  '8008': 'accfin',
  '8009': 'accfin',
  '8010': 'accfin',
  '8011': 'accfin',
  '8012': 'ide',
  '8013': 'mre',
  '8014': 'ece',
  '8015': 'ece',
  '8016': 'mech',
  '8017': 'mech',
  '8018': 'mre',
  '8019': 'chemeng',
  '8020': 'agro',
  '8021': 'agro',
  '8022': 'agro',
  '8023': 'agro',
  '8024': 'agro',
  '8025': 'agro',
  '8026': 'agro',
  '8027': 'ba',
  '8028': 'mw',
  '8091': 'mst',
  '8092': 'ece',
};

export interface UniversisDepartment {
  /** Universis' own id for the department, as "1554". */
  id?: string;
  /** Its short code, which for the current departments is the app's id: "cs". */
  code?: string;
  /** The department & study programme names, as Universis writes them. */
  names?: readonly string[];
}

/**
 * The student's department in the app, from what Universis says of it: its
 * id first, then its code, then its name. Null when none settles it.
 */
export function departmentOf(directory: Directory, department: UniversisDepartment): string | null {
  const known = new Set(directory.departments.map((entry) => entry.id));
  const byId = department.id ? byUniversisId[department.id] : undefined;
  if (byId && known.has(byId)) return byId;
  const code = department.code?.trim().toLowerCase();
  if (code && known.has(code)) return code;
  return matchDepartment(directory, department.names ?? []);
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
