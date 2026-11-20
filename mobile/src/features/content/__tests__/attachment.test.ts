import { attachmentName } from '../attachment';

describe('attachmentName', () => {
  it('writes a file name as words', () => {
    expect(attachmentName('Erasmus_Final_Poster')).toBe('Erasmus Final Poster');
    expect(attachmentName('Πρόγραμμα--Εξεταστικής__2026')).toBe('Πρόγραμμα Εξεταστικής 2026');
    expect(attachmentName('Ανακοίνωση Ε-Μ')).toBe('Ανακοίνωση Ε-Μ');
  });
});
