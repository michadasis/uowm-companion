import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { bundledDirectoryPath, renderBundledDirectory } from './bundled-directory.js';

mkdirSync(dirname(bundledDirectoryPath), { recursive: true });
writeFileSync(bundledDirectoryPath, renderBundledDirectory());
console.log(`Wrote ${bundledDirectoryPath}`);
