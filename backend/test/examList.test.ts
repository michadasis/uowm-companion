import { describe, expect, it } from 'vitest';

import type { Block } from '../src/content/blocks.js';
import { parseExamList } from '../src/schedules/parse/examList.js';

function paragraphs(...lines: string[]): Block[] {
  return lines.map((text) => ({ type: 'paragraph', content: [{ text }] }));
}

describe('parseExamList', () => {
  it('reads an exam line under its day', () => {
    const exams = parseExamList(
      paragraphs(
        'Πρόγραμμα Εξετάσεων Σεπτεμβρίου 2025-2026',
        '1η εβδομάδα',
        'Δευτέρα 31-08-2026',
        "09:00-11:00 Εκπαιδευτική Ψυχολογία (Δ'), (5+0) Κ. Μόσχου Αμφ.2 Φ.Π.",
      ),
    );

    expect(exams).toEqual([
      {
        course: 'Εκπαιδευτική Ψυχολογία',
        date: '2026-08-31',
        startTime: '09:00',
        endTime: '11:00',
        semester: "Δ'",
        room: 'Αμφ.2 Φ.Π.',
        examiners: ['Κ. Μόσχου'],
      },
    ]);
  });

  it('keeps the whole room when there are several', () => {
    const [exam] = parseExamList(
      paragraphs(
        'Τετάρτη 02-09-2026',
        "11:00-13:00 Βάσεις Δεδομένων (Δ'), (167+14)  Ν. Δημόκας Μ.Αμφ., Αμφ.1, Αμφ.2 Φ.Π.",
      ),
    );

    expect(exam).toMatchObject({
      course: 'Βάσεις Δεδομένων',
      room: 'Μ.Αμφ., Αμφ.1, Αμφ.2 Φ.Π.',
      examiners: ['Ν. Δημόκας'],
    });
  });

  it('reads a line that has no enrollment counts', () => {
    const [exam] = parseExamList(
      paragraphs(
        'Δευτέρα 07-09-2026',
        "11:00-12:00 Υπολογιστικά Νέφη (ΣΤ') Α. Τσαγκαρόπουλος Εργ. Ε6 2ο Τμήμα",
      ),
    );

    expect(exam).toMatchObject({
      course: 'Υπολογιστικά Νέφη',
      startTime: '11:00',
      endTime: '12:00',
      semester: "ΣΤ'",
      room: 'Εργ. Ε6 2ο Τμήμα',
      examiners: ['Α. Τσαγκαρόπουλος'],
    });
  });

  it('keeps a two-initial examiner & both semesters of a shared exam', () => {
    const [panatsa] = parseExamList(
      paragraphs(
        'Τρίτη 01-09-2026',
        "16:00-18:00 Εισαγωγή στην Παιδαγωγική (Γ' ΠΔΕ), (7+0) Β. Μ. Πανάτσα Αμφ.2 Φ.Π.",
      ),
    );
    expect(panatsa).toMatchObject({
      examiners: ['Β. Μ. Πανάτσα'],
      course: 'Εισαγωγή στην Παιδαγωγική',
    });

    const [shared] = parseExamList(
      paragraphs(
        'Δευτέρα 31-08-2026',
        '11:00-13:00 Αλγόριθμοι και Πολυπλοκότητα (Ε’) / Υπολογισιμότητα και Πολυπλοκότητα (Ζ’), (63+18+9) Ν. Δημόκας Μ.Αμφ.',
      ),
    );
    expect(shared).toMatchObject({
      course: 'Αλγόριθμοι και Πολυπλοκότητα / Υπολογισιμότητα και Πολυπλοκότητα',
      semester: 'Ε’, Ζ’',
      room: 'Μ.Αμφ.',
    });
  });

  it('tags a teaching-proficiency exam & keeps its semester clean', () => {
    const [beside] = parseExamList(
      paragraphs(
        'Δευτέρα 31-08-2026',
        "09:00-11:00 Εκπαιδευτική Ψυχολογία (Δ') (ΠΔΕ), (5+0) Κ. Μόσχου Αμφ.2 Φ.Π.",
      ),
    );
    expect(beside).toMatchObject({
      course: 'Εκπαιδευτική Ψυχολογία',
      semester: "Δ'",
      track: 'pde',
    });

    const [inside] = parseExamList(
      paragraphs(
        'Τρίτη 01-09-2026',
        "16:00-18:00 Εισαγωγή στην Παιδαγωγική (Γ' ΠΔΕ), (7+0) Β. Μ. Πανάτσα Αμφ.2 Φ.Π.",
      ),
    );
    expect(inside).toMatchObject({
      course: 'Εισαγωγή στην Παιδαγωγική',
      semester: "Γ'",
      track: 'pde',
    });
  });

  it('leaves a regular exam without a track', () => {
    const [exam] = parseExamList(
      paragraphs('Δευτέρα 31-08-2026', "09:00-11:00 Αλγόριθμοι (Ε'), (5+0) Ν. Δημόκας Μ.Αμφ."),
    );
    expect(exam?.track).toBeUndefined();
  });

  it('carries the day forward across its exam lines & ignores non-exam text', () => {
    const exams = parseExamList(
      paragraphs(
        'Δευτέρα 31-08-2026',
        '09:00-11:00 Α, (5+0) Κ. Μόσχου Μ.Αμφ.',
        '13:00-15:00 Β, (0+5) Ν. Δημόκας Μ.Αμφ.',
        '2η εβδομάδα',
        'Τρίτη 08-09-2026',
        '15:00-17:00 Γ, (141+4) Σ. Νικολάου Μ.Αμφ.',
      ),
    );

    expect(exams.map((e) => [e.date, e.course])).toEqual([
      ['2026-08-31', 'Α'],
      ['2026-08-31', 'Β'],
      ['2026-09-08', 'Γ'],
    ]);
  });

  it('returns nothing for a document that is not this format', () => {
    expect(parseExamList(paragraphs('Κάποιο κείμενο', 'χωρίς ημερομηνίες ή ώρες'))).toEqual([]);
  });
});
