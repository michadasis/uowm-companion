// Renders the app's icons & splash image from the mark in brand.mjs:
//   npm run icons
// The SVG of each is written beside the PNGs in assets/brand, for reference.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { markSvg, palette } from './brand.mjs';

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(join(assets, 'brand'), { recursive: true });

const outputs = [
  // The launcher icon: the mark on ink, which both themes' home screens suit.
  { file: 'icon.png', size: 1024, svg: markSvg({ background: palette.ink, scale: 1.02 }) },
  // Android's adaptive icon crops to a circle or squircle inside the middle
  // two thirds, so the mark is drawn smaller; the ink is its background colour.
  { file: 'adaptive-icon-foreground.png', size: 1024, svg: markSvg({ scale: 0.74 }) },
  // Themed icons (Android 13+) tint a single-colour shape.
  {
    file: 'adaptive-icon-monochrome.png',
    size: 1024,
    svg: markSvg({ a: '#FFFFFF', b: '#FFFFFF', heart: '#FFFFFF', scale: 0.74 }),
  },
  // The splash shows the mark alone, on paper or night per theme.
  { file: 'splash-icon.png', size: 512, svg: markSvg() },
  { file: 'favicon.png', size: 96, svg: markSvg({ background: palette.ink, scale: 1.1 }) },
];

for (const { file, size, svg } of outputs) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(join(assets, file), png);
  writeFileSync(join(assets, 'brand', file.replace(/\.png$/, '.svg')), svg);
  console.log(`${file} ${size}×${size}`);
}
