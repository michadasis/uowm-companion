import { fileURLToPath } from 'node:url';

import { buildDirectory } from '../src/departments/directory.js';

/**
 * The app ships a copy of the directory so that picking a department on
 * first launch never waits for the network. This is where that copy lives
 * and exactly what it must contain.
 */
export const bundledDirectoryPath = fileURLToPath(
  new URL('../../mobile/src/features/departments/directory.json', import.meta.url),
);

export function renderBundledDirectory(): string {
  return `${JSON.stringify(buildDirectory(), null, 2)}\n`;
}
