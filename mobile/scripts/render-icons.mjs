// Renders the app's icons & splash image from the mark in brand.mjs:
//   npm run icons
// The SVG of each is written beside the PNGs in assets/brand, for reference.
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { markSvg, palette } from './brand.mjs';

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(join(assets, 'brand'), { recursive: true });

const white = { ring: '#FFFFFF', north: '#FFFFFF', south: '#FFFFFF' };

// The launcher shows the middle two thirds of the adaptive icon; at this
// scale the ring spans about 58% of that, the size other apps' marks take,
// so the icon doesn't look zoomed in beside them.
const iconScale = 0.7;

const outputs = [
  // The launcher icon, where nothing crops it: the mark on ink, at the size
  // it takes in the adaptive icon.
  {
    file: 'icon.png',
    size: 1024,
    svg: markSvg({ background: palette.ink, scale: iconScale * 1.15 }),
  },
  // Android's adaptive icon crops to a circle or squircle inside the middle
  // two thirds. Ink is its background colour.
  { file: 'adaptive-icon-foreground.png', size: 1024, svg: markSvg({ scale: iconScale }) },
  // Themed icons (Android 13+) tint a single-colour shape.
  {
    file: 'adaptive-icon-monochrome.png',
    size: 1024,
    svg: markSvg({ ...white, scale: iconScale }),
  },
  // The splash shows the mark alone, on paper or night per theme. Its ring
  // stays inside the image, which is drawn as a square & would clip it.
  { file: 'splash-icon.png', size: 512, svg: markSvg({ scale: 1.75 }) },
  { file: 'favicon.png', size: 96, svg: markSvg({ background: palette.ink, scale: 1.6 }) },
  // The README's icon, its corners rounded in the image itself: GitHub drops
  // the style that would round them.
  {
    file: 'brand/readme-icon.png',
    size: 256,
    svg: markSvg({ background: palette.ink, scale: iconScale * 1.15 }).replace(
      /<rect width="1024" height="1024" fill="([^"]+)"\/>/,
      '<rect width="1024" height="1024" rx="225" fill="$1"/>',
    ),
  },
];

for (const { file, size, svg } of outputs) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(join(assets, file), png);
  writeFileSync(join(assets, 'brand', basename(file).replace(/\.png$/, '.svg')), svg);
  console.log(`${file} ${size}×${size}`);
}
