// The app's mark: two rounded squares woven through each other & turned on
// end, so they read as one diamond-shaped knot, with a small square at its
// heart. It takes after the interlaced mark & the coloured squares of the
// university without copying them: the app is unofficial.
//
// Drawn on a 1024 grid. Where one square passes under the other it is cut
// away with a mask rather than painted over, so the gaps are transparent &
// the mark sits on any background — the launcher icon, the splash screen in
// either theme, the monochrome icon. src/design/components/BrandMark.tsx
// draws the same geometry.

const centre = 512;
const size = 420;
const offset = 140;
const stroke = 100;
// Room left either side of the square passing over.
const clearance = stroke / 2 + 18;

const a = centre - offset / 2 - size / 2; // 232: the square drawn first, top left
const b = centre + offset / 2 - size / 2; // 372: the other, bottom right

export const geometry = {
  rotate: 45,
  /** The knot, turned, fits the grid at this scale. */
  scale: 0.82,
  stroke,
  radius: 100,
  a: { x: a, y: a, size },
  b: { x: b, y: b, size },
  // B passes under A where A's right side crosses B's top…
  cutB: {
    x: a + size - clearance,
    y: b - stroke / 2 - 4,
    width: 2 * clearance,
    height: stroke + 8,
  },
  // …& A under B where B's left side crosses A's bottom.
  cutA: {
    x: b - clearance,
    y: a + size - stroke / 2 - 4,
    width: 2 * clearance,
    height: stroke + 8,
  },
  heart: { x: centre - 52, y: centre - 52, size: 104, radius: 22 },
};

export const palette = {
  amber: '#F29A16',
  amberDeep: '#D9730D',
  blue: '#2F6FC0',
  ink: '#1F1B16',
  paper: '#FAF7F2',
  night: '#13110E',
};

/**
 * The mark as SVG markup.
 * @param {{ a?: string, b?: string, heart?: string, background?: string, scale?: number }} options
 */
export function markSvg({
  a: colourA = palette.amber,
  b: colourB = palette.amberDeep,
  heart = palette.blue,
  background,
  scale = 1,
} = {}) {
  const g = geometry;
  const square = (s) =>
    `x="${s.x}" y="${s.y}" width="${s.size}" height="${s.size}" rx="${g.radius}"`;
  const cut = (c) =>
    `<rect x="${c.x}" y="${c.y}" width="${c.width}" height="${c.height}" fill="black"/>`;
  const fit = g.scale * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <mask id="cutA" maskUnits="userSpaceOnUse"><rect width="1024" height="1024" fill="white"/>${cut(g.cutA)}</mask>
    <mask id="cutB" maskUnits="userSpaceOnUse"><rect width="1024" height="1024" fill="white"/>${cut(g.cutB)}</mask>
  </defs>
  ${background ? `<rect width="1024" height="1024" fill="${background}"/>` : ''}
  <g transform="translate(${centre} ${centre}) rotate(${g.rotate}) scale(${fit}) translate(${-centre} ${-centre})">
    <rect ${square(g.b)} fill="none" stroke="${colourB}" stroke-width="${g.stroke}" mask="url(#cutB)"/>
    <rect ${square(g.a)} fill="none" stroke="${colourA}" stroke-width="${g.stroke}" mask="url(#cutA)"/>
    <rect x="${g.heart.x}" y="${g.heart.y}" width="${g.heart.size}" height="${g.heart.size}" rx="${g.heart.radius}" fill="${heart}"/>
  </g>
</svg>`;
}
