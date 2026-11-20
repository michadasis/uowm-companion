import { genderOf, greetingName, vocative } from '../greekName';

describe('greetingName', () => {
  it('gives a name Universis keeps in capitals its accents & its vocative', () => {
    expect(greetingName('ΙΩΑΝΝΗΣ')).toBe('Ιωάννη');
    expect(greetingName('ΓΕΩΡΓΙΟΣ')).toBe('Γεώργιε');
    expect(greetingName('ΝΙΚΟΣ')).toBe('Νίκο');
    expect(greetingName('ΑΝΔΡΕΑΣ')).toBe('Ανδρέα');
    expect(greetingName('ΑΙΚΑΤΕΡΙΝΗ')).toBe('Αικατερίνη');
  });

  it('takes the first of two names', () => {
    expect(greetingName('ΜΑΡΙΑ-ΕΛΕΝΗ')).toBe('Μαρία');
  });

  it('keeps a name already written with its accents', () => {
    expect(greetingName('Παναγιώτης')).toBe('Παναγιώτη');
  });

  it('greets a name in Latin letters as written, & leaves out an unknown Greek one', () => {
    expect(greetingName('JOHN')).toBe('John');
    expect(greetingName('ΧΑΡΙΛΑΟΣ')).toBeNull();
    expect(greetingName('')).toBeNull();
    expect(greetingName(null)).toBeNull();
  });
});

describe('vocative', () => {
  it('turns -ος into -ο for two syllables & -ε for more', () => {
    expect(vocative('Πέτρος')).toBe('Πέτρο');
    expect(vocative('Αλέξανδρος')).toBe('Αλέξανδρε');
    expect(vocative('Κωνσταντίνος')).toBe('Κωνσταντίνε');
  });
});

describe('vocative, counting syllables', () => {
  it('counts a diphthong as one syllable & other vowels apart', () => {
    expect(vocative('Παύλος')).toBe('Παύλο');
    expect(vocative('Μάριος')).toBe('Μάριε');
    expect(vocative('Δημήτριος')).toBe('Δημήτριε');
  });
});

describe('genderOf', () => {
  it('tells a man’s name from a woman’s, & says neither for one it does not know', () => {
    expect(genderOf('ΙΩΑΝΝΗΣ')).toBe('male');
    expect(genderOf('ΜΑΡΙΑ-ΕΛΕΝΗ')).toBe('female');
    expect(genderOf('ΧΑΡΙΛΑΟΣ')).toBeNull();
    expect(genderOf(null)).toBeNull();
  });
});
