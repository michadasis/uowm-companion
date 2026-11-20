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
});
