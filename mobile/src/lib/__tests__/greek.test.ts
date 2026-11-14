import { fold, toUpperCase } from '../greek';

describe('toUpperCase', () => {
  it('drops the accent from Greek capitals', () => {
    expect(toUpperCase('Ανακοινώσεις')).toBe('ΑΝΑΚΟΙΝΩΣΕΙΣ');
    expect(toUpperCase('Πολυτεχνική Σχολή')).toBe('ΠΟΛΥΤΕΧΝΙΚΗ ΣΧΟΛΗ');
  });

  it('keeps the diaeresis', () => {
    expect(toUpperCase('Πτολεμαΐδα')).toBe('ΠΤΟΛΕΜΑΪΔΑ');
    expect(toUpperCase('προϊόν')).toBe('ΠΡΟΪΟΝ');
  });

  it('turns a final sigma into a capital sigma', () => {
    expect(toUpperCase('Γεωπονίας')).toBe('ΓΕΩΠΟΝΙΑΣ');
  });

  it('leaves Latin text alone apart from the case', () => {
    expect(toUpperCase('School of Engineering')).toBe('SCHOOL OF ENGINEERING');
    expect(toUpperCase('café')).toBe('CAFÉ');
  });
});

describe('fold', () => {
  it('ignores case, accents and the final sigma', () => {
    expect(fold('Πληροφορικής')).toBe('πληροφορικησ');
    expect(fold('ΠΛΗΡΟΦΟΡΙΚΗΣ')).toBe('πληροφορικησ');
    expect(fold('πληροφορικης')).toBe('πληροφορικησ');
  });

  it('collapses whitespace', () => {
    expect(fold('  Μηχανολόγων   Μηχανικών ')).toBe('μηχανολογων μηχανικων');
  });

  it('folds Latin text too', () => {
    expect(fold('Informatics')).toBe('informatics');
  });
});
