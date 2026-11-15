import { sampleBlocks } from '../__fixtures__/blocks';
import { blockSchema, blocksSchema } from '../schema';

describe('block schema', () => {
  it('accepts every block the backend produces', () => {
    expect(blocksSchema.parse(sampleBlocks)).toEqual(sampleBlocks);
  });

  it('keeps the inline marks & links on a paragraph', () => {
    const paragraph = {
      type: 'paragraph',
      content: [
        { text: 'bold', bold: true },
        { text: 'link', href: 'https://x.gr' },
      ],
    };
    expect(blockSchema.parse(paragraph)).toEqual(paragraph);
  });

  it('allows a table with no header', () => {
    const table = { type: 'table', header: null, rows: [[[{ text: 'a' }]]] };
    expect(() => blockSchema.parse(table)).not.toThrow();
  });

  it('rejects an unknown block type', () => {
    expect(() => blockSchema.parse({ type: 'video', src: 'x' })).toThrow();
  });

  it('rejects a heading at a level the app does not render', () => {
    expect(() => blockSchema.parse({ type: 'heading', level: 1, content: [] })).toThrow();
  });

  it('rejects an attachment with an unknown format', () => {
    expect(() =>
      blockSchema.parse({ type: 'attachment', name: 'x', href: 'y', format: 'zip' }),
    ).toThrow();
  });
});
