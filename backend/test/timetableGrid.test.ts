import { describe, expect, it } from 'vitest';

import type { Block, Inline, InlineRun } from '../src/content/blocks.js';
import { parseTimetableGrid } from '../src/schedules/parse/timetableGrid.js';

const run = (text: string, marks?: { bold?: boolean; italic?: boolean }): InlineRun => ({
  text,
  ...(marks?.bold ? { bold: true } : {}),
  ...(marks?.italic ? { italic: true } : {}),
});

// A cell holding a class: a course, its teacher (italic, as the source marks it)
// & its room, each on its own line.
function classCell(course: string, teacher: string, room: string): Inline {
  return [
    run(course, { bold: true }),
    run('\n'),
    run(teacher, { bold: true, italic: true }),
    run('\n'),
    run(room, { bold: true }),
  ];
}

const header: Inline[] = ['ΩΡΑ', 'ΔΕΥΤΕΡΑ', 'ΤΡΙΤΗ', 'ΤΕΤΑΡΤΗ', 'ΠΕΜΠΤΗ', 'ΠΑΡΑΣΚΕΥΗ'].map((t) => [
  run(t, { bold: true }),
]);

const time = (text: string): Inline => [run(text)];

function table(rows: Inline[][]): Block {
  return { type: 'table', header: null, rows };
}

function semester(label: string): Block {
  return { type: 'paragraph', content: [{ text: `${label} εξάμηνο` }] };
}

describe('parseTimetableGrid', () => {
  it('reads a class from a day column under its time & semester', () => {
    const classes = parseTimetableGrid([
      semester('Α΄'),
      table([
        header,
        [time('09:00 – 10:00'), classCell('Ηλεκτρονική', 'Δ. Φωτιάδης', 'Μεγ. Αμφιθέατρο'), [], [], [], []],
      ]),
    ]);

    expect(classes).toEqual([
      {
        course: 'Ηλεκτρονική',
        day: 1,
        startTime: '09:00',
        endTime: '10:00',
        room: 'Μεγ. Αμφιθέατρο',
        semester: 'Α΄',
        teacher: 'Δ. Φωτιάδης',
      },
    ]);
  });

  it('places each day column on the right weekday', () => {
    const classes = parseTimetableGrid([
      table([
        header,
        [
          time('11:00 – 12:00'),
          [],
          [],
          classCell('Μεταγλωττιστές', 'Ν. Δημόκας', 'Β1'),
          [],
          classCell('Φυσική', 'Θ. Παπαβασιλείου', 'Μ.Αμφ.'),
        ],
      ]),
    ]);

    expect(classes.map((c) => [c.day, c.course])).toEqual([
      [3, 'Μεταγλωττιστές'],
      [5, 'Φυσική'],
    ]);
  });

  it('keeps a two-name teacher & a course title that wrapped across lines', () => {
    const cell: Inline = [
      run('Προγραμματισμός', { bold: true }),
      run('\n'),
      run('στο Διαδίκτυο', { bold: true }),
      run('\n'),
      run('Δ. Βέργαδος – Χ. Χυτήρης', { bold: true, italic: true }),
      run('\n'),
      run('Εργ. Α3', { bold: true }),
    ];
    const [session] = parseTimetableGrid([table([header, [time('13:00 – 14:00'), cell, [], [], [], []]])]);

    expect(session).toMatchObject({
      course: 'Προγραμματισμός στο Διαδίκτυο',
      teacher: 'Δ. Βέργαδος – Χ. Χυτήρης',
      room: 'Εργ. Α3',
    });
  });

  it('falls back to the name pattern when the teacher is not marked italic', () => {
    const cell: Inline = [
      run('Διακριτά Μαθηματικά', { bold: true }),
      run('\n'),
      run('Χ. Σαλής', { bold: true }),
      run('\n'),
      run('Αμφιθέατρο 2', { bold: true }),
    ];
    const [session] = parseTimetableGrid([table([header, [time('17:00 – 18:00'), cell, [], [], [], []]])]);

    expect(session).toMatchObject({ course: 'Διακριτά Μαθηματικά', teacher: 'Χ. Σαλής', room: 'Αμφιθέατρο 2' });
  });

  it('marks a tutorial or lab & drops the marker from the course', () => {
    const tutorialCell: Inline = [
      run('Μαθηματική Ανάλυση Ι', { bold: true }),
      run('\n(Φροντιστήριο)\n'),
      run('Γ. Ψαραδάκης', { bold: true, italic: true }),
      run('\n'),
      run('Εργ. Ε6', { bold: true }),
    ];
    const [session] = parseTimetableGrid([table([header, [time('13:00 – 14:00'), tutorialCell, [], [], [], []]])]);

    expect(session).toMatchObject({ course: 'Μαθηματική Ανάλυση Ι', type: 'tutorial', teacher: 'Γ. Ψαραδάκης' });
  });

  it('tags the teaching-proficiency section & drops the inherited semester', () => {
    const classes = parseTimetableGrid([
      semester('Ζ΄'),
      table([header, [time('09:00 – 10:00'), classCell('Ασφάλεια Δικτύων', 'Σ. Νικολάου', 'Β1'), [], [], [], []]]),
      { type: 'paragraph', content: [{ text: 'Προαιρετικό Πρόγραμμα Παιδαγωγικής & Διδακτικής Επάρκειας' }] },
      table([header, [time('17:00 – 18:00'), [], classCell('Διδακτική Μεθοδολογία', 'Α. Αθανασιάδης', 'B2'), [], [], []]]),
    ]);

    expect(classes).toEqual([
      expect.objectContaining({ course: 'Ασφάλεια Δικτύων', semester: 'Ζ΄' }),
      expect.objectContaining({ course: 'Διδακτική Μεθοδολογία', day: 2, track: 'pde' }),
    ]);
    expect(classes[0]!.track).toBeUndefined();
    expect(classes[1]!.semester).toBeUndefined();
  });

  it('ignores a table that is not a weekday grid', () => {
    expect(
      parseTimetableGrid([
        table([
          [[run('Μάθημα')], [run('Διδάσκων')]],
          [[run('Φυσική')], [run('Θ. Παπαβασιλείου')]],
        ]),
      ]),
    ).toEqual([]);
  });
});
