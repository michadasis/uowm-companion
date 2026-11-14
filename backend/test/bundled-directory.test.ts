import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { bundledDirectoryPath, renderBundledDirectory } from '../scripts/bundled-directory.js';

describe('the directory bundled with the app', () => {
  it('matches the registry (run `npm run export:departments` after changing it)', () => {
    const bundled = readFileSync(bundledDirectoryPath, 'utf8').replace(/\r\n/g, '\n');

    expect(bundled).toBe(renderBundledDirectory());
  });
});
