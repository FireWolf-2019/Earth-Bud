/**
 * Generates PLACEHOLDER icon assets for the slots that do not yet have real
 * artwork: the Android adaptive layers, the splash mark and the web favicon.
 *
 * It deliberately does NOT write icon.png or the ios-*.png variants. icon.png
 * is now real artwork, and the iOS variants are derived from it by
 * scripts/generate-ios-icons.js -- generating them here too would clobber both.
 *
 * The geometry, sizes and transparency rules match what Google / Expo require,
 * so replacing the artwork is the only step left.
 */

const fs = require('fs');
const path = require('path');
const png = require('./lib/png');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'images');

// ------------------------------------------------------------------ painting

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** Paint `color` with coverage `a` over an existing [r,g,b,a] sample. */
function over(dst, color, a) {
  if (a <= 0) return dst;
  const outA = a + dst[3] * (1 - a);
  if (outA <= 0) return [0, 0, 0, 0];
  return [
    (color[0] * a + dst[0] * dst[3] * (1 - a)) / outA,
    (color[1] * a + dst[1] * dst[3] * (1 - a)) / outA,
    (color[2] * a + dst[2] * dst[3] * (1 - a)) / outA,
    outA,
  ];
}

/**
 * The EarthBud mark, drawn in normalized coordinates where the art is centered
 * on (0,0) and `scale` sets the radius of the surrounding disc.
 *
 * Returns a signed-distance-ish coverage per element so we can antialias by
 * supersampling rather than by blurring.
 */
function mark(x, y, scale) {
  const px = x / scale;
  const py = y / scale;

  const disc = Math.hypot(px, py) <= 1 ? 1 : 0;

  // Leaf: lens formed by intersecting two circles, rotated 45 degrees.
  const ang = -Math.PI / 4;
  const lx = px * Math.cos(ang) - py * Math.sin(ang);
  const ly = px * Math.sin(ang) + py * Math.cos(ang);
  const R = 1.12;
  const d = 0.8;
  const inLeaf = Math.hypot(lx, ly + d) <= R && Math.hypot(lx, ly - d) <= R ? 1 : 0;

  // Midrib running tip to tip, plus symmetric pairs of side veins.
  const onRib = inLeaf && Math.abs(ly) <= 0.035 ? 1 : 0;
  let onVein = 0;
  for (const sign of [-1, 1]) {
    for (const base of [-0.34, -0.1, 0.14]) {
      // vein grows outward and forward from the rib at ~40 degrees
      const vx = lx - base;
      const vy = ly;
      const t = vx * Math.cos(sign * 0.7) + vy * Math.sin(sign * 0.7);
      const perp = -vx * Math.sin(sign * 0.7) + vy * Math.cos(sign * 0.7);
      if (inLeaf && t > 0 && t < 0.34 && Math.abs(perp) <= 0.028) onVein = 1;
    }
  }

  return { disc, leaf: inLeaf, rib: onRib || onVein };
}

/**
 * @param {object} opts
 * @param {number} opts.size            output px
 * @param {[string,string]|null} opts.bg gradient endpoints, or null for transparent
 * @param {string} opts.leaf            leaf fill
 * @param {string} opts.rib             vein / midrib color
 * @param {number} opts.artScale        radius of the mark as a fraction of half the canvas
 * @param {number} [opts.halo]          alpha of the white disc behind the leaf
 * @param {boolean} [opts.drawMark]     set false for a bare background layer
 */
function render(opts) {
  const { size, bg, leaf = '#000000', rib = '#000000', artScale = 1, halo = 0, drawMark = true } = opts;
  const bgA = bg ? hex(bg[0]) : null;
  const bgB = bg ? hex(bg[1]) : null;
  const leafC = hex(leaf);
  const ribC = hex(rib);

  const out = new Uint8Array(size * size * 4);
  const SS = 4; // 4x4 samples per pixel
  const half = size / 2;
  const radius = half * artScale;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;

          let s = [0, 0, 0, 0];
          if (bgA) {
            // diagonal gradient: green corner -> blue corner
            const t = Math.min(1, Math.max(0, (px / size) * 0.45 + (py / size) * 0.55));
            s = [...mix(bgA, bgB, t), 1];
          }

          if (drawMark) {
            const m = mark(px - half, py - half, radius);
            if (halo > 0 && m.disc) s = over(s, [255, 255, 255], halo);
            if (m.leaf) s = over(s, leafC, 1);
            if (m.rib) s = over(s, ribC, 1);
          }

          r += s[0] * s[3];
          g += s[1] * s[3];
          b += s[2] * s[3];
          a += s[3];
        }
      }

      const n = SS * SS;
      const i = (y * size + x) * 4;
      out[i] = a > 0 ? Math.round(r / a) : 0;
      out[i + 1] = a > 0 ? Math.round(g / a) : 0;
      out[i + 2] = a > 0 ? Math.round(b / a) : 0;
      out[i + 3] = Math.round((a / n) * 255);
    }
  }
  return out;
}

function write(name, opts) {
  // Anything with a gradient background is fully opaque, so write it without
  // an alpha channel; the transparent layers (adaptive foreground, monochrome,
  // splash) keep theirs.
  const opaque = Boolean(opts.bg);
  const buf = png.encode(
    { width: opts.size, height: opts.size, data: render(opts) },
    opaque
  );
  fs.writeFileSync(path.join(OUT_DIR, name), buf);
  console.log(
    `  ${name.padEnd(30)} ${opts.size}x${opts.size}` +
      `  ${opaque ? 'opaque' : 'alpha '}  ${(buf.length / 1024).toFixed(1)} KB`
  );
}

// ------------------------------------------------------------------- palette

const GREEN_DEEP = '#0E7A43';
const BLUE_DEEP = '#0B5F72';
const MINT = '#E8FAEF';

console.log('Generating EarthBud placeholder icons (Android, splash, favicon)…');

// Android adaptive. Foreground art stays inside the centered 66/108 safe zone,
// because launchers crop to circles, squircles, teardrops, etc.
write('android-icon-foreground.png', {
  size: 512,
  bg: null,
  leaf: MINT,
  rib: GREEN_DEEP,
  artScale: 0.58,
});

write('android-icon-background.png', {
  size: 512,
  bg: [GREEN_DEEP, BLUE_DEEP],
  drawMark: false,
});

// Themed icon (Android 13+): silhouette only, the system recolors it.
write('android-icon-monochrome.png', {
  size: 432,
  bg: null,
  leaf: '#FFFFFF',
  rib: '#FFFFFF',
  artScale: 0.58,
});

// Splash: transparent so it reads on both the light and dark splash colors.
write('splash-icon.png', {
  size: 1024,
  bg: null,
  leaf: '#13A55C',
  rib: '#0B6E3C',
  artScale: 0.6,
});

write('favicon.png', {
  size: 48,
  bg: [GREEN_DEEP, BLUE_DEEP],
  leaf: MINT,
  rib: GREEN_DEEP,
  artScale: 0.62,
  halo: 0.1,
});

console.log('Done. Replace the PNGs in assets/images/ with final artwork when ready.');
