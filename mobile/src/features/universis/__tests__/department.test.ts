import { bundledDirectory } from '@/features/departments/useDirectory';

import { departmentOf, matchDepartment } from '../department';

// Universis' undergraduate departments as its LocalDepartments list gives
// them (id, code, name), with the app's department each belongs to, or null
// for a programme the app has no department for.
const universis: [string, string, string, string | null][] = [
  ['1541', 'mre', 'ΤΜΗΜΑ ΜΗΧΑΝΙΚΩΝ ΟΡΥΚΤΩΝ ΠΟΡΩΝ', 'mre'],
  ['1542', 'ide', 'ΤΜΗΜΑ ΜΗΧΑΝΙΚΩΝ ΣΧΕΔΙΑΣΗΣ ΠΡΟΪΟΝΤΩΝ ΚΑΙ ΣΥΣΤΗΜΑΤΩΝ', 'ide'],
  ['1543', 'rdcbs', 'ΤΜΗΜΑ ΔΙΟΙΚΗΤΙΚΗΣ ΕΠΙΣΤΗΜΗΣ ΚΑΙ ΤΕΧΝΟΛΟΓΙΑΣ ', 'rdcbs'],
  ['1544', 'mst', 'ΤΜΗΜΑ ΔΙΟΙΚΗΤΙΚΗΣ ΕΠΙΣΤΗΜΗΣ ΚΑΙ ΤΕΧΝΟΛΟΓΙΑΣ', 'mst'],
  ['1545', 'accfin', 'ΤΜΗΜΑ  ΛΟΓΙΣΤΙΚΗΣ ΚΑΙ ΧΡΗΜΑΤΟΟΙΚΟΝΟΜΙΚΗΣ', 'accfin'],
  ['1546', 'ba', 'Τμήμα Οργάνωσης και Διοίκησης Επιχειρήσεων', 'ba'],
  ['1547', 'stat', 'ΤΜΗΜΑ ΣΤΑΤΙΣΤΙΚΗΣ ', 'stat'],
  ['1548', 'econ', 'ΤΜΗΜΑ ΟΙΚΟΝΟΜΙΚΩΝ ΕΠΙΣΤΗΜΩΝ', 'econ'],
  ['1549', 'iees', 'ΤΜΗΜΑ ΔΙΕΘΝΩΝ ΚΑΙ ΕΥΡΩΠΑΪΚΩΝ ΟΙΚΟΝΟΜΙΚΩΝ ΣΠΟΥΔΩΝ', 'iees'],
  ['1550', 'psy', 'ΤΜΗΜΑ ΨΥΧΟΛΟΓΙΑΣ', 'psy'],
  ['1551', 'cdm', 'ΤΜΗΜΑ ΕΠΙΚΟΙΝΩΝΙΑΣ ΚΑΙ ΨΗΦΙΑΚΩΝ ΜΕΣΩΝ', 'cdm'],
  ['1552', 'agro', 'ΤΜΗΜΑ ΓΕΩΠΟΝΙΑΣ', 'agro'],
  ['1553', 'mw', 'ΤΜΗΜΑ ΜΑΙΕΥΤΙΚΗΣ', 'mw'],
  ['1554', 'cs', 'ΤΜΗΜΑ ΠΛΗΡΟΦΟΡΙΚΗΣ', 'cs'],
  ['1555', 'math', 'ΤΜΗΜΑ ΜΑΘΗΜΑΤΙΚΩΝ', 'math'],
  ['1558', 'ot', 'ΤΜΗΜΑ ΕΡΓΟΘΕΡΑΠΕΙΑΣ', 'ot'],
  ['1565', 'grafi', 'Δημιουργική Γραφή, Τέχνες και Ανθρωπιστικές Επιστήμες', null],
  ['1566', 'sesd', 'ECONOMICS AND SUSTAINABLE DEVELOPMENT', 'econ'],
  ['16037', 'test', 'Δοκιμαστικό Τμήμα', null],
  ['490', 'K7', 'ΤΜΗΜΑ ΠΛΗΡΟΦΟΡΙΚΗΣ', 'cs'],
  ['491', 'K5', 'ΤΜΗΜΑ ΕΠΙΚΟΙΝΩΝΙΑΣ KAI ΨΗΦΙΑΚΩΝ ΜΕΣΩΝ', 'cdm'],
  ['492', 'K6', 'ΤΜΗΜΑ ΟΙΚΟΝΟΜΙΚΩΝ ΕΠΙΣΤΗΜΩΝ', 'econ'],
  ['600', 'eled', 'ΠΑΙΔΑΓΩΓΙΚΟ ΤΜΗΜΑ ΔΗΜΟΤΙΚΗΣ ΕΚΠΑΙΔΕΥΣΗΣ', 'eled'],
  ['601', 'eetf', 'ΤΜΗΜΑ ΕΙΚΑΣΤΙΚΩΝ ΚΑΙ ΕΦΑΡΜΟΣΜΕΝΩΝ ΤΕΧΝΩΝ', 'eetf'],
  ['602', 'nured', 'ΠΑΙΔΑΓΩΓΙΚΟ ΤΜΗΜΑ ΝΗΠΙΑΓΩΓΩΝ', 'nured'],
  ['603', 'balkan', 'ΤΜΗΜΑ ΒΑΛΚΑΝΙΚΩΝ ΣΠΟΥΔΩΝ', null],
  ['604', 'ece', 'Τμήμα Ηλεκτρολόγων Μηχανικών και Μηχανικών Υπολογιστών', 'ece'],
  ['605', 'mech', 'ΤΜΗΜΑ ΜΗΧΑΝΟΛΟΓΩΝ ΜΗΧΑΝΙΚΩΝ', 'mech'],
  ['606', 'chemeng', 'ΤΜΗΜΑ ΧΗΜΙΚΩΝ ΜΗΧΑΝΙΚΩΝ', 'chemeng'],
  ['8001', 'DE', 'DE* (ΠΠΣ) ΔΙΟΙΚΗΣΗ ΕΠΙΧΕΙΡΗΣΕΩΝ XXXXXXX', 'mst'],
  ['8002', 'DN', 'ΤΜΗΜΑ ΔΙΟΙΚΗΤΙΚΗΣ ΕΠΙΣΤΗΜΗΣ ΚΑΙ ΤΕΧΝΟΛΟΓΙΑΣ', 'mst'],
  ['8003', 'EP', 'Τμήμα Οργάνωσης και Διοίκησης Επιχειρήσεων', 'ba'],
  ['8004', 'GF', 'Τμήμα Οργάνωσης και Διοίκησης Επιχειρήσεων', 'ba'],
  ['8005', 'GP', 'Τμήμα Οργάνωσης και Διοίκησης Επιχειρήσεων', 'ba'],
  ['8006', 'LG', 'LG* ΛΟΓΙΣΤΙΚΗ  XXXXXXX', 'accfin'],
  ['8007', 'LM', 'LM* ΛΟΓΙΣΤΙΚΗ-- XXXXXX', 'accfin'],
  ['8008', 'LN', 'ΤΜΗΜΑ ΛΟΓΙΣΤΙΚΗΣ ΚΑΙ XΡΗΜΑΤΟΟΙΚΟΝΟΜΙΚΗΣ', 'accfin'],
  ['8009', 'LO', 'ΤΜΗΜΑ  ΛΟΓΙΣΤΙΚΗΣ ΚΑΙ ΧΡΗΜΑΤΟΟΙΚΟΝΟΜΙΚΗΣ', 'accfin'],
  ['8010', 'LX', 'ΤΜΗΜΑ ΛΟΓΙΣΤΙΚΗΣ ΚΑΙ ΧΡΗΜΑΤΟΟΙΚΟΝΟΜΙΚΗΣ', 'accfin'],
  ['8011', 'XR', 'ΤΜΗΜΑ  ΛΟΓΙΣΤΙΚΗΣ ΚΑΙ ΧΡΗΜΑΤΟΟΙΚΟΝΟΜΙΚΗΣ', 'accfin'],
  ['8012', 'BS', 'ΤΜΗΜΑ ΜΗΧΑΝΙΚΩΝ ΣΧΕΔΙΑΣΗΣ ΠΡΟΪΟΝΤΩΝ ΚΑΙ ΣΥΣΤΗΜΑΤΩΝ', 'ide'],
  ['8013', 'GE', 'ΤΜΗΜΑ ΜΗΧΑΝΙΚΩΝ ΟΡΥΚΤΩΝ ΠΟΡΩΝ', 'mre'],
  ['8014', 'HL', 'Ηλεκτρολόγων Μηχανικών και Μηχανικών Υπολογιστών', 'ece'],
  ['8015', 'HN', 'ΤΜΗΜΑ ΗΛΕΚΤΡΟΛΟΓΩΝ ΜΗΧΑΝΙΚΩΝ ΚΑΙ ΜΗΧΑΝΙΚΩΝ ΥΠΟΛΟΓΙΣΤΩΝ', 'ece'],
  ['8016', 'MH', 'ΤΜΗΜΑ ΜΗΧΑΝΟΛΟΓΩΝ ΜΗΧΑΝΙΚΩΝ', 'mech'],
  ['8017', 'MX', 'ΤΜΗΜΑ ΜΗΧΑΝΟΛΟΓΩΝ ΜΗΧΑΝΙΚΩΝ', 'mech'],
  ['8018', 'OR', 'OR* ΟΡΥΧΕΙΩΝ  XXXXXXX', 'mre'],
  ['8019', 'TA', 'ΤΜΗΜΑ ΧΗΜΙΚΩΝ ΜΗΧΑΝΙΚΩΝ', 'chemeng'],
  ['8020', 'EF', 'ΤΜΗΜΑ ΓΕΩΠΟΝΙΑΣ', 'agro'],
  ['8021', 'EM', 'ΤΜΗΜΑ ΓΕΩΠΟΝΙΑΣ', 'agro'],
  ['8022', 'FG', 'ΤΜΗΜΑ ΓΕΩΠΟΝΙΑΣ', 'agro'],
  ['8023', 'FP', 'ΤΜΗΜΑ ΓΕΩΠΟΝΙΑΣ', 'agro'],
  ['8024', 'FY', 'ΤΜΗΜΑ ΓΕΩΠΟΝΙΑΣ', 'agro'],
  ['8025', 'ZA', 'ZA* ΔΟΚΙΜΗ-ΖΩΙΚΗΣ ΠΑΡΑΓΩΓΗΣ (7Εξαμ)', 'agro'],
  ['8026', 'ZP', 'ΤΜΗΜΑ ΓΕΩΠΟΝΙΑΣ', 'agro'],
  ['8027', 'GL', 'GL* ΔΙΟΙΚΗΣΗΣ ΣΥΣΤΗΜΑΤΩΝ ΕΦΟΔΙΑΣΜΟΥ (Logistics)', 'ba'],
  ['8028', 'MA', 'ΤΜΗΜΑ ΜΑΙΕΥΤΙΚΗΣ', 'mw'],
  ['8091', 'DT', 'DT* ΠΣΕ - ΔΙΟΙΚΗΤΙΚΗ ΤΕΧΝΟΛΟΓΙΑ', 'mst'],
  ['8092', 'BP', 'BP* ΠΣΕ - ΒΙΟΜΗΧΑΝΙΚΗ ΠΛΗΡΟΦΟΡΙΚΗ  XXXX', 'ece'],
];

describe('departmentOf', () => {
  it.each(universis)('places Universis department %s (%s) in the app', (id, code, name, app) => {
    expect(departmentOf(bundledDirectory, { id, code, names: [name] })).toBe(app);
  });

  it('reaches every one of the app departments', () => {
    const reached = new Set(universis.map(([, , , app]) => app));
    for (const department of bundledDirectory.departments) {
      expect(reached).toContain(department.id);
    }
  });

  it('falls back to the code, then the name, for an id it does not know', () => {
    expect(departmentOf(bundledDirectory, { id: '99999', code: 'math' })).toBe('math');
    expect(departmentOf(bundledDirectory, { id: '99999', names: ['ΤΜΗΜΑ ΨΥΧΟΛΟΓΙΑΣ'] })).toBe(
      'psy',
    );
  });
});

describe('matchDepartment', () => {
  it('finds the department however its name is written', () => {
    expect(matchDepartment(bundledDirectory, ['ΤΜΗΜΑ ΠΛΗΡΟΦΟΡΙΚΗΣ'])).toBe('cs');
    expect(matchDepartment(bundledDirectory, ['Τμήμα Μαθηματικών (Καστοριά)'])).toBe('math');
    expect(matchDepartment(bundledDirectory, ['ΤΗΜΜΥ'])).toBe('ece');
  });

  it('says none rather than guess', () => {
    expect(matchDepartment(bundledDirectory, ['Σχολή Θετικών Επιστημών'])).toBeNull();
    expect(matchDepartment(bundledDirectory, [])).toBeNull();
  });
});
