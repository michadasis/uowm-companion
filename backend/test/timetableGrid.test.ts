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
        [
          time('09:00 – 10:00'),
          classCell('Ηλεκτρονική', 'Δ. Φωτιάδης', 'Μεγ. Αμφιθέατρο'),
          [],
          [],
          [],
          [],
        ],
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
    const [session] = parseTimetableGrid([
      table([header, [time('13:00 – 14:00'), cell, [], [], [], []]]),
    ]);

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
    const [session] = parseTimetableGrid([
      table([header, [time('17:00 – 18:00'), cell, [], [], [], []]]),
    ]);

    expect(session).toMatchObject({
      course: 'Διακριτά Μαθηματικά',
      teacher: 'Χ. Σαλής',
      room: 'Αμφιθέατρο 2',
    });
  });

  it('marks a tutorial or lab & drops the marker from the course', () => {
    const tutorialCell: Inline = [
      run('Μαθηματική Ανάλυση Ι', { bold: true }),
      run('\n(Φροντιστήριο)\n'),
      run('Γ. Ψαραδάκης', { bold: true, italic: true }),
      run('\n'),
      run('Εργ. Ε6', { bold: true }),
    ];
    const [session] = parseTimetableGrid([
      table([header, [time('13:00 – 14:00'), tutorialCell, [], [], [], []]]),
    ]);

    expect(session).toMatchObject({
      course: 'Μαθηματική Ανάλυση Ι',
      type: 'tutorial',
      teacher: 'Γ. Ψαραδάκης',
    });
  });

  it('tags the teaching-proficiency section & drops the inherited semester', () => {
    const classes = parseTimetableGrid([
      semester('Ζ΄'),
      table([
        header,
        [time('09:00 – 10:00'), classCell('Ασφάλεια Δικτύων', 'Σ. Νικολάου', 'Β1'), [], [], [], []],
      ]),
      {
        type: 'paragraph',
        content: [{ text: 'Προαιρετικό Πρόγραμμα Παιδαγωγικής & Διδακτικής Επάρκειας' }],
      },
      table([
        header,
        [
          time('17:00 – 18:00'),
          [],
          classCell('Διδακτική Μεθοδολογία', 'Α. Αθανασιάδης', 'B2'),
          [],
          [],
          [],
        ],
      ]),
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

describe('parseTimetableGrid on a spreadsheet layout', () => {
  const plain = (text: string): Inline => (text ? [{ text }] : []);
  const row = (...cells: string[]): Inline[] => cells.map(plain);

  it('reads a teacher & room put under the course, a day spanning two columns, & a two-hour class', () => {
    const classes = parseTimetableGrid([
      { type: 'heading', level: 3, content: [{ text: '1ο ΕΞΑΜΗΝΟ' }] },
      table([
        row('1ο ΕΞΑΜΗΝΟ', '', '', '', '', ''),
        row('ΩΡΕΣ', 'ΔΕΥΤΕΡΑ', 'ΤΡΙΤΗ', 'ΤΕΤΑΡΤΗ', 'ΠΕΜΠΤΗ', '', 'ΠΑΡΑΣΚΕΥΗ'),
        row('09:00 - 10:00', 'ΔΗΜΟΣΙΟΓΡΑΦΙΑ', '', '', 'ΕΙΚΟΝΑ - ΕΤ1', 'ΕΙΚΟΝΑ - ΕΤ2', ''),
        row('', 'ΜΩΡΑΪΤΗΣ', '', '', 'ΚΑΛΤΣΙΑΔΟΥ', 'ΜΑΡΚΟΥ', ''),
        row('10:00 - 11:00', 'ΑΙΘΟΥΣΑ Β9', '', '', '', '', ''),
        row('11:00 - 12:00', 'ΔΗΜΟΣΙΟΓΡΑΦΙΑ', '', '', '', '', ''),
      ]),
    ]);

    expect(classes).toEqual([
      expect.objectContaining({
        course: 'ΔΗΜΟΣΙΟΓΡΑΦΙΑ',
        day: 1,
        startTime: '09:00',
        endTime: '10:00',
        teacher: 'ΜΩΡΑΪΤΗΣ',
        room: 'ΑΙΘΟΥΣΑ Β9',
        semester: 'Α΄',
      }),
      expect.objectContaining({ course: 'ΕΙΚΟΝΑ - ΕΤ1', day: 4, teacher: 'ΚΑΛΤΣΙΑΔΟΥ' }),
      expect.objectContaining({ course: 'ΕΙΚΟΝΑ - ΕΤ2', day: 4, teacher: 'ΜΑΡΚΟΥ' }),
      expect.objectContaining({ course: 'ΔΗΜΟΣΙΟΓΡΑΦΙΑ', day: 1, startTime: '11:00' }),
    ]);
  });

  it('joins a class that runs over consecutive slots into one', () => {
    const classes = parseTimetableGrid([
      semester('Γ΄'),
      table([
        header,
        [time('09:00 – 10:00'), classCell('Φυσική', 'Θ. Π', 'Β1'), [], [], [], []],
        [time('10:00 – 11:00'), classCell('Φυσική', 'Θ. Π', 'Β1'), [], [], [], []],
      ]),
    ]);
    expect(classes).toEqual([
      expect.objectContaining({ course: 'Φυσική', startTime: '09:00', endTime: '11:00' }),
    ]);
  });
});

// One class in a Monday 09:00 slot, its cell plain text with no italic teacher.
function plainCell(text: string): ReturnType<typeof parseTimetableGrid> {
  return parseTimetableGrid([
    table([header, [time('09:00 – 10:00'), [run(text)], [], [], [], []]]),
  ]);
}

const details = (text: string) =>
  plainCell(text).map(({ course, teacher, room }) => ({ course, teacher, room }));

describe('parseTimetableGrid, cells with no italic teacher', () => {
  it('reads "Course (Θ) Teacher - Room" wrapped at any word', () => {
    expect(details('Σχέδιο (Ε) Στημονιάρης -\nΑΠ1_11')).toEqual([
      { course: 'Σχέδιο (Ε)', teacher: 'Στημονιάρης', room: 'ΑΠ1_11' },
    ]);
    expect(details('Δομ. Προγραμματισμός (Ε)\nΚυριακίδης - ΑΠ1_8, ΕΥ1, ΕΥ2,\nΕΥ5')).toEqual([
      { course: 'Δομ. Προγραμματισμός (Ε)', teacher: 'Κυριακίδης', room: 'ΑΠ1_8, ΕΥ1, ΕΥ2, ΕΥ5' },
    ]);
  });

  it('reads two classes set side by side in one cell', () => {
    expect(
      details(
        'Ηλεκ. Κυκλώματα ΙΙ (Ε)\nΗλεκ. Μετρήσεις (Ε)\nΠασχόπουλος - ΑΠ1_1\nΒανδίκας - ΑΠ1_10',
      ),
    ).toEqual([
      { course: 'Ηλεκ. Κυκλώματα ΙΙ (Ε)', teacher: 'Πασχόπουλος', room: 'ΑΠ1_1' },
      { course: 'Ηλεκ. Μετρήσεις (Ε)', teacher: 'Βανδίκας', room: 'ΑΠ1_10' },
    ]);
  });

  it('keeps a title whole round a room printed beside it, the teacher last', () => {
    expect(details('ΕΙΣΑΓΩΓΗ ΣΤΗ\nΔΙΟΙΚΗΣΗ\nΒ7\nΕΠΙΧΕΙΡΗΣΕΩΝ\nΗΛΙΟΠΟΥΛΟΥ')).toEqual([
      { course: 'ΕΙΣΑΓΩΓΗ ΣΤΗ ΔΙΟΙΚΗΣΗ ΕΠΙΧΕΙΡΗΣΕΩΝ', teacher: 'ΗΛΙΟΠΟΥΛΟΥ', room: 'Β7' },
    ]);
  });

  it('gives no teacher where the last line only closes the title', () => {
    expect(details('ΚΑΙΝΟΤΟΜΙΑ ΚΑΙ\nΕΠΙΧΕΙΡΗΜΑΤΙΚΟΤΗΤΑ\nΒ6\n(Κ-ΟΕ)')).toEqual([
      { course: 'ΚΑΙΝΟΤΟΜΙΑ ΚΑΙ ΕΠΙΧΕΙΡΗΜΑΤΙΚΟΤΗΤΑ (Κ-ΟΕ)', teacher: undefined, room: 'Β6' },
    ]);
  });

  it('reads a teacher after the room, or a short name with an initial', () => {
    expect(details('Χημεία\nΑΠ3_8\nΤόλης')).toEqual([
      { course: 'Χημεία', teacher: 'Τόλης', room: 'ΑΠ3_8' },
    ]);
    expect(details('Λογιστική Ι\n1307\nΚυριακόγκωνας Παν.')).toEqual([
      { course: 'Λογιστική Ι', teacher: 'Κυριακόγκωνας Παν.', room: '1307' },
    ]);
  });

  it('reads a teacher in brackets, on a line of its own or closing the title', () => {
    expect(details('0518Υ - ΕΚΠΑΙΔΕΥΤΙΚΗ\nΠΟΛΙΤΙΚΗ\n(ΣΚΛΑΒΟΣ ΑΝΑΣΤΑΣΙΟΣ)\nΜικρ. Αμφ.')).toEqual([
      {
        course: '0518Υ - ΕΚΠΑΙΔΕΥΤΙΚΗ ΠΟΛΙΤΙΚΗ',
        teacher: 'ΣΚΛΑΒΟΣ ΑΝΑΣΤΑΣΙΟΣ',
        room: 'Μικρ. Αμφ.',
      },
    ]);
    expect(details('ΜΠ108 Εισαγωγή στη Χημική\nΑΠ3_8\nΜηχανική (ΑΝΤΩΝΙΑΔΟΥ)')).toEqual([
      { course: 'Εισαγωγή στη Χημική Μηχανική', teacher: 'ΑΝΤΩΝΙΑΔΟΥ', room: 'ΑΠ3_8' },
    ]);
  });

  it('reads the teacher after a course code, leaving a note on the post out', () => {
    expect(
      details(
        'ΨΥΧΟΛΟΓΙΑ ΤΗΣ ΑΝΑΠΤΥΞΗΣ\n(Υ105)\nΣΤΑΥΡΟΥ ΚΥΡΙΑΚΗ\n(ΑΚΑΔΗΜΑΪΚΟΣ ΥΠΟΤΡΟΦΟΣ)\nΑΙΘΟΥΣΑ ΝΚ1',
      ),
    ).toEqual([
      {
        course: 'ΨΥΧΟΛΟΓΙΑ ΤΗΣ ΑΝΑΠΤΥΞΗΣ (Υ105)',
        teacher: 'ΣΤΑΥΡΟΥ ΚΥΡΙΑΚΗ',
        room: 'ΑΙΘΟΥΣΑ ΝΚ1',
      },
    ]);
  });

  it("reads a teacher's short code set above the room as the title runs on", () => {
    expect(details('ΕΙΣΑΓΩΓΗ ΣΤΟΝ\nΚΟΡ\n4204\nΠΡΟΓΡΑΜΜΑΤΙΣΜΟ (Θ)')).toEqual([
      { course: 'ΕΙΣΑΓΩΓΗ ΣΤΟΝ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟ (Θ)', teacher: 'ΚΟΡ', room: '4204' },
    ]);
  });

  it('keeps a title over two lines whole, with no teacher in it', () => {
    expect(details('Θεμελιώδεις Έννοιες\nΜαθηματικών\nΑίθουσα Β2')).toEqual([
      { course: 'Θεμελιώδεις Έννοιες Μαθηματικών', teacher: undefined, room: 'Αίθουσα Β2' },
    ]);
  });

  it('splits a one-line cell at the comma or gap before its teachers', () => {
    expect(details('DET103 ΧΡΗΜΑΤΟΟΙΚΟΝΟΜΙΚΗ ΛΟΓΙΣΤΙΚΗ Ι, ΣΠΙΝΘΗΡΟΠΟΥΛΟΣ - ΒΕΖΟΥ Μ.')).toEqual([
      {
        course: 'ΧΡΗΜΑΤΟΟΙΚΟΝΟΜΙΚΗ ΛΟΓΙΣΤΙΚΗ Ι',
        teacher: 'ΣΠΙΝΘΗΡΟΠΟΥΛΟΣ - ΒΕΖΟΥ Μ.',
        room: undefined,
      },
    ]);
    expect(details('DET503 ΒΑΣΕΙΣ ΔΕΔΟΜΕΝΩΝ        ΠΑΝΥΤΣΙΔΗΣ')).toEqual([
      { course: 'ΒΑΣΕΙΣ ΔΕΔΟΜΕΝΩΝ', teacher: 'ΠΑΝΥΤΣΙΔΗΣ', room: undefined },
    ]);
  });

  it('pairs classes ruled apart down a cell with the rooms ruled apart beside them', () => {
    expect(
      details(
        'ΧΜΝ09 Βιοϋλικά (Ε) (ΚΑΡΑΓΙΑΝΝΗΣ)\n— — —\nΧΜΤ06 Χημεία Τροφίμων\n(ΠΑΠΑΜΩΚΟΣ)\n\n' +
          'ΑΙΘ/ΕΡΓ (ΚΟΙΛΑ,\nΕΡΓ 4301)\n— — —\nΑΠ2_2',
      ),
    ).toEqual([
      { course: 'Βιοϋλικά (Ε)', teacher: 'ΚΑΡΑΓΙΑΝΝΗΣ', room: 'ΑΙΘ/ΕΡΓ (ΚΟΙΛΑ, ΕΡΓ 4301)' },
      { course: 'Χημεία Τροφίμων', teacher: 'ΠΑΠΑΜΩΚΟΣ', room: 'ΑΠ2_2' },
    ]);
  });

  it('gives a column of teachers beside a class to that class', () => {
    expect(
      details('ΑΝΑΤΟΜΙΑ ΚΑΙ\nΜΟΡΦΟΛΟΓΙΑ ΦΥΤΩΝ (Ε1)\n\nΠΑΠΑΘΑΝΑΣΙΟΥ /\nΠΑΣΧΟΥΔΗ / ΣΙΣΤΑΝΗΣ ΕΡ ΒΟΤ'),
    ).toEqual([
      {
        course: 'ΑΝΑΤΟΜΙΑ ΚΑΙ ΜΟΡΦΟΛΟΓΙΑ ΦΥΤΩΝ (Ε1)',
        teacher: 'ΠΑΠΑΘΑΝΑΣΙΟΥ/ΠΑΣΧΟΥΔΗ/ΣΙΣΤΑΝΗΣ',
        room: 'ΕΡ ΒΟΤ',
      },
    ]);
  });

  it('reads a list of teachers with its last name wrapped under the room', () => {
    expect(details('ΑΝΘΟΚΟΜΙΑ (Ε)\nΜΠΑΝΤΗΣ / ΧΑΤΖΗ / 15 / ΘΕΡΜ\nΒΑΘΙΣΤΑΣ')).toEqual([
      { course: 'ΑΝΘΟΚΟΜΙΑ (Ε)', teacher: 'ΜΠΑΝΤΗΣ/ΧΑΤΖΗ/ΒΑΘΙΣΤΑΣ', room: '15 / ΘΕΡΜ' },
    ]);
  });

  it('takes the room on its own line over a code set before a title line', () => {
    expect(details('ΔΙΕΘΝΗΣ ΔΙΟΙΚΗΣΗ\nΒ4 ΕΠΙΧΕΙΡΗΣΕΩΝ (Κ-ΟΕ)\nΒ6\nΗΛΙΟΠΟΥΛΟΥ')).toEqual([
      { course: 'ΔΙΕΘΝΗΣ ΔΙΟΙΚΗΣΗ ΕΠΙΧΕΙΡΗΣΕΩΝ (Κ-ΟΕ)', teacher: 'ΗΛΙΟΠΟΥΛΟΥ', room: 'Β6' },
    ]);
  });

  it('takes a room from the column beside a class', () => {
    const classes = parseTimetableGrid([
      table([
        [run('ΩΡΕΣ'), run('ΔΕΥΤΕΡΑ'), [], run('ΤΡΙΤΗ'), [], run('ΤΕΤΑΡΤΗ'), []].map((c) =>
          Array.isArray(c) ? c : [c],
        ),
        [
          time('9.00-10.00'),
          [run('DET306 ΔΙΚΑΙΟ ΚΑΙ ΟΙΚΟΝΟΜΙΑ,   ΚΑΓΙΟΓΛΟΥ')],
          [run('1202')],
          [],
          [],
          [],
          [],
        ],
      ]),
    ]);
    expect(classes).toEqual([
      expect.objectContaining({
        course: 'ΔΙΚΑΙΟ ΚΑΙ ΟΙΚΟΝΟΜΙΑ',
        teacher: 'ΚΑΓΙΟΓΛΟΥ',
        room: '1202',
      }),
    ]);
  });
});
