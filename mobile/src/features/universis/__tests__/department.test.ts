import { bundledDirectory } from '@/features/departments/useDirectory';

import { matchDepartment } from '../department';

describe('matchDepartment', () => {
  it('finds the department however Universis writes it', () => {
    expect(matchDepartment(bundledDirectory, ['ΤΜΗΜΑ ΠΛΗΡΟΦΟΡΙΚΗΣ'])).toBe('cs');
    expect(matchDepartment(bundledDirectory, ['Τμήμα Μαθηματικών (Καστοριά)'])).toBe('math');
    expect(
      matchDepartment(bundledDirectory, ['ΤΜΗΜΑ ΗΛΕΚΤΡΟΛΟΓΩΝ ΜΗΧΑΝΙΚΩΝ ΚΑΙ ΜΗΧΑΝΙΚΩΝ ΥΠΟΛΟΓΙΣΤΩΝ']),
    ).toBe('ece');
    expect(matchDepartment(bundledDirectory, ['ΤΗΜΜΥ'])).toBe('ece');
  });

  it('falls back to the study programme, & says none rather than guess', () => {
    expect(matchDepartment(bundledDirectory, ['Άγνωστο', 'Πρόγραμμα Σπουδών Ψυχολογίας'])).toBe(
      'psy',
    );
    expect(matchDepartment(bundledDirectory, ['Σχολή Θετικών Επιστημών'])).toBeNull();
    expect(matchDepartment(bundledDirectory, [])).toBeNull();
  });
});
