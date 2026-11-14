import { filterDirectory } from '../search';
import { bundledDirectory } from '../useDirectory';

function search(query: string, cityId: string | null = null): string[] {
  return filterDirectory(bundledDirectory, { query, cityId }).flatMap((section) =>
    section.departments.map((department) => department.id),
  );
}

describe('filterDirectory', () => {
  it('returns every department, grouped by school, when nothing is asked', () => {
    const sections = filterDirectory(bundledDirectory, { query: '', cityId: null });

    expect(sections.map((section) => section.school.id)).toEqual(
      bundledDirectory.schools.map((school) => school.id),
    );
    expect(sections.flatMap((section) => section.departments)).toHaveLength(22);
  });

  it('finds a department by its Greek name, whatever the case and accents', () => {
    expect(search('Πληροφορικής')).toEqual(['cs']);
    expect(search('πληροφορικη')).toEqual(['cs']);
    expect(search('ΠΛΗΡΟΦΟΡ')).toEqual(['cs']);
  });

  it('finds a department by its English name', () => {
    expect(search('informatics')).toEqual(['cs']);
    expect(search('Midwifery')).toEqual(['mw']);
  });

  it.each([
    ['pliroforiki', ['cs']],
    ['plhroforikh', ['cs']],
    ['psixologia', ['psy']],
    ['psychologia', ['psy']],
    ['mhxanologwn', ['mech']],
    ['michanologon', ['mech']],
    ['maieutiki', ['mw']],
    ['ergo8erapeia', ['ot']],
    ['geoponia', ['agro']],
    ['eikastikon', ['eetf']],
    ['nipiagogon', ['nured']],
  ])('finds Greek names typed in Latin letters: %s', (query, expected) => {
    expect(search(query)).toEqual(expected);
  });

  it('finds a department by its abbreviation or its site name', () => {
    expect(search('ΤΗΜΜΥ')).toEqual(['ece']);
    expect(search('τημμυ')).toEqual(['ece']);
    expect(search('ΠΤΔΕ')).toEqual(['eled']);
    expect(search('chemeng')).toEqual(['chemeng']);
  });

  it('finds departments by city and by school', () => {
    expect(search('Γρεβενά')).toEqual(['ba', 'stat']);
    expect(search('ptolemaida')).toEqual(['ot', 'mw']);
    expect(search('πολυτεχνική')).toEqual(['ece', 'mech', 'chemeng', 'mre', 'ide']);
  });

  it('needs every word of the query to match', () => {
    expect(search('μηχανικών κοζάνη')).toEqual(['ece', 'mech', 'chemeng', 'mre', 'ide']);
    expect(search('μηχανικών καστοριά')).toEqual([]);
  });

  it('limits the result to one city', () => {
    expect(search('', 'kastoria')).toEqual(['econ', 'cdm', 'math', 'cs']);
    expect(search('οικονομικών', 'kastoria')).toEqual(['econ']);
  });

  it('leaves out schools with no match', () => {
    const sections = filterDirectory(bundledDirectory, { query: '', cityId: 'ptolemaida' });

    expect(sections).toHaveLength(1);
    expect(sections[0]?.school.id).toBe('health');
  });

  it('returns nothing for a query that matches no department', () => {
    expect(search('αστροφυσική')).toEqual([]);
  });
});
