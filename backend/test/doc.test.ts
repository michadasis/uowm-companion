import { describe, expect, it, vi } from 'vitest';

const body = vi.hoisted(() => ({ text: '' }));
vi.mock('word-extractor', () => ({
  default: class {
    extract() {
      return Promise.resolve({ getBody: () => body.text });
    }
  },
}));

const { docToBlocks } = await import('../src/documents/doc.js');

describe('docToBlocks', () => {
  it('rebuilds a table whose rows keep the heading row’s width', async () => {
    // As the extractor gives rdcbs's exam schedule: cells by tabs, rows by lines.
    body.text = [
      'ΠΡΟΓΡΑΜΜΑ Εξεταστικής ΣΕΠΤΕΜΒΡΙΟΣ',
      '(Αναμορφωμένο)\tΗμερομηνία\tΏρα\tΑίθουσα\tΚαθηγητής\t\t',
      'Α΄ ΕΞΑΜΗΝΟ\t\t\t',
      'Μικροοικονομία\t8/9\t9-11\t1204\tΛοίζου\t\t',
      'Πληροφορική\t9/9\t13-15\t1204\tΣαπρίκης',
      'Στατιστική\t31/8\t17-19\t3402\tΤσακιρίδου\t\t',
      'Περιφερειακή Επιστήμη\t8/9\t11-13\t3402\tΧατζηθεοδωρίδης\t\t',
    ].join('\n');

    const blocks = await docToBlocks(new Uint8Array());
    expect(blocks[0]).toEqual({
      type: 'paragraph',
      content: [{ text: 'ΠΡΟΓΡΑΜΜΑ Εξεταστικής ΣΕΠΤΕΜΒΡΙΟΣ' }],
    });
    expect(blocks[1]).toMatchObject({ type: 'table' });
    const table = blocks[1] as Extract<(typeof blocks)[number], { type: 'table' }>;
    expect(table.rows[2]!.map((cell) => cell.map((run) => run.text).join(''))).toEqual([
      'Μικροοικονομία',
      '8/9',
      '9-11',
      '1204',
      'Λοίζου',
      '',
      '',
    ]);
  });

  it('keeps text whose cells break over lines as lines, cells divided by a bar', async () => {
    body.text = [
      'ΩΡΕΣ\tΔευτέρα\tΑιθ\tΤρίτη\tΑιθ',
      '9:00- 12:00\t\t\tΔΕΟΣ0103',
      'Παγκόσμια Οικονομία',
      'ΣΙΣΚΟΣ\tΜΕΓΑΛΟ ΑΜΦΙΘΕΑΤΡΟ\t\t12:00-15:00\tΔΕΟΣ0105',
    ].join('\n');

    const blocks = await docToBlocks(new Uint8Array());
    expect(blocks.every((block) => block.type === 'paragraph')).toBe(true);
    expect(blocks[1]).toEqual({
      type: 'paragraph',
      content: [{ text: '9:00- 12:00  |  ΔΕΟΣ0103' }],
    });
  });

  it('rebuilds a week timetable from its cell marks, rooms & merged hours included', async () => {
    // As the extractor gives iees's timetable: a tab ends each cell & one
    // more each row; a cell's own lines are only text in it.
    body.text =
      'ΕΞΑΜΗΝΟ: 7ο  \t \t\t\nΩΡΕΣ\tΔευτέρα\tAιθ\tΤρίτη\tΑιθ\t\t' +
      // 9:00: Tuesday, with its room.
      '9:00- 12:00\t\t\tΔΕΟΣ0702\nΕνωσιακή Νομοθεσία / ΚΑΝΑΒΑΣ\t3204\t' +
      // The row's mark, then the same hour, merged & so blank: Monday.
      '\t\tΔΕΟΣ 0708\nΔιεθνές Εμπόριο\nΣΚΑΛΙΔΗ\t1307\t\t\t\t' +
      '15:00 - \n18:00\tΔΕΟΣ0710 Ιστορία Οικονομικών\nΑΝΤΑΠΟΔΟΤΙΚΗ\nΜπρώνη/Κυριακούλης\t3204\t\t\t\n' +
      'ΕΞΑΜΗΝΟ: 9ο';

    const blocks = await docToBlocks(new Uint8Array());
    const text = (cell: { text: string; italic?: boolean }[]) =>
      cell.map((run) => (run.italic ? `<${run.text.trim()}>` : run.text)).join('');
    expect(blocks[0]).toEqual({ type: 'paragraph', content: [{ text: 'ΕΞΑΜΗΝΟ: 7ο' }] });
    const table = blocks[1] as Extract<(typeof blocks)[number], { type: 'table' }>;
    expect(table.header!.map(text)).toEqual(['ΩΡΕΣ', 'Δευτέρα', 'Τρίτη']);
    expect(table.rows.map((row) => row.map(text))).toEqual([
      ['9:00- 12:00', '', 'Ενωσιακή Νομοθεσία<ΚΑΝΑΒΑΣ>\n3204'],
      ['9:00- 12:00', 'Διεθνές Εμπόριο<ΣΚΑΛΙΔΗ>\n1307', ''],
      ['15:00 - 18:00', 'Ιστορία Οικονομικών<Μπρώνη/Κυριακούλης>\n3204', ''],
    ]);
    expect(blocks[2]).toEqual({ type: 'paragraph', content: [{ text: 'ΕΞΑΜΗΝΟ: 9ο' }] });
  });
});
