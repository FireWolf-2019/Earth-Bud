/**
 * Derives the three iOS appearance variants from assets/images/icon.png.
 *
 *   ios-light.png   default home screen
 *   ios-dark.png    iOS 18 dark appearance
 *   ios-tinted.png  iOS 18 tinted appearance (grayscale; the system recolors it)
 *
 * Run after replacing icon.png with new artwork:  npm run icons:ios
 *
 * Two corrections are applied to the source on the way through:
 *
 *  1. Pre-rounded corners are filled back in. iOS masks icons with its own
 *     superellipse, so artwork that ships its own rounded corners (with black
 *     or any other filler outside them) shows slivers of that filler where the
 *     two curves disagree. Apple's guidance is to supply a full-bleed square.
 *  2. Output is resampled to exactly 1024x1024 and written without an alpha
 *     channel, which is what App Store Connect requires.
 */

const fs = require('fs');
const path = require('path');
const png = require('./lib/png');

const IMAGES = path.join(__dirname, '..', 'assets', 'images');
const SOURCE = path.join(IMAGES, 'icon.png');
const OUT_SIZE = 1024;

// How far a pixel's color may sit from the plate color and still count as
// background, in RGB euclidean distance.
const PLATE_TOLERANCE = 78;

const dist = (d, i, c) =>
  Math.hypot(d[i] - c[0], d[i + 1] - c[1], d[i + 2] - c[2]);

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => a + (b - a) * t;

/**
 * Flood fills inward from the border, collecting every pixel reachable without
 * crossing into the subject. Connectivity matters: the leaf's pale highlight is
 * nearly the same color as the background plate, but it is enclosed by the
 * leaf, so a connected fill leaves it alone where a global color match would
 * wreck it.
 *
 * @param {number} w
 * @param {number} h
 * @param {(p: number) => boolean} matches predicate on pixel index
 * @returns {Uint8Array} 1 for background, 0 for subject
 */
function floodFromBorder(w, h, matches) {
  const mask = new Uint8Array(w * h);
  const stack = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (mask[p]) return;
    if (!matches(p)) return;
    mask[p] = 1;
    stack.push(p);
  };

  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  while (stack.length) {
    const p = stack.pop();
    const x = p % w;
    const y = (p / w) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  return mask;
}

/** Grows a mask by `radius` pixels so antialiased boundaries get swallowed. */
function dilate(mask, w, h, radius) {
  let cur = mask;
  for (let step = 0; step < radius; step++) {
    const next = new Uint8Array(cur);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (cur[p]) continue;
        if (
          (x > 0 && cur[p - 1]) ||
          (x < w - 1 && cur[p + 1]) ||
          (y > 0 && cur[p - w]) ||
          (y < h - 1 && cur[p + w])
        ) {
          next[p] = 1;
        }
      }
    }
    cur = next;
  }
  return cur;
}

/** Shrinks a mask by `radius` pixels. Treats outside-the-image as unset. */
function erode(mask, w, h, radius) {
  let cur = mask;
  for (let step = 0; step < radius; step++) {
    const next = new Uint8Array(cur);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (!cur[p]) continue;
        if (
          x === 0 ||
          y === 0 ||
          x === w - 1 ||
          y === h - 1 ||
          !cur[p - 1] ||
          !cur[p + 1] ||
          !cur[p - w] ||
          !cur[p + w]
        ) {
          next[p] = 0;
        }
      }
    }
    cur = next;
  }
  return cur;
}

/**
 * The background plate, excluding narrow plate-colored channels that run into
 * the subject.
 *
 * A plain flood fill is not enough: the pale highlight tracing the leaf against
 * the globe is the same color as the plate AND opens onto it at the leaf tips,
 * so the fill leaks up the channel and recolors artwork that should stay put.
 * Closing the subject mask (dilate then erode) seals any channel narrower than
 * 2 * SEAL_RADIUS while leaving the subject's true outline where it was.
 */
const SEAL_RADIUS = 52;

function backgroundMask(img, plate) {
  const { width: w, height: h, data } = img;

  const subject = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) {
    if (dist(data, p * 4, plate) >= PLATE_TOLERANCE) subject[p] = 1;
  }

  const scale = Math.max(1, Math.round((SEAL_RADIUS * w) / 1024));
  const sealed = erode(dilate(subject, w, h, scale), w, h, scale);

  return floodFromBorder(w, h, (p) => sealed[p] === 0);
}

/**
 * Separable box blur over a 0/1 mask, returning coverage in 0..1.
 *
 * Where the mask boundary follows a real color edge this changes nothing
 * visible, because the plate-likeness term has already fallen to zero on the
 * subject side. Where the boundary is one the segmentation invented -- the leaf
 * highlight bleeds into the plate with no edge between them, so the seal has to
 * cut somewhere -- this turns a hard geometric step into a gradient.
 */
function softenMask(mask, w, h, radius) {
  const pass = (src, dst, stride, count, lines) => {
    for (let l = 0; l < lines; l++) {
      const base = l * (stride === 1 ? count : 1);
      let sum = 0;
      for (let i = 0; i <= radius && i < count; i++) sum += src[base + i * stride];
      for (let i = 0; i < count; i++) {
        dst[base + i * stride] = sum / (Math.min(count - 1, i + radius) - Math.max(0, i - radius) + 1);
        const add = i + radius + 1;
        const drop = i - radius;
        if (add < count) sum += src[base + add * stride];
        if (drop >= 0) sum -= src[base + drop * stride];
      }
    }
  };

  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  pass(mask, tmp, 1, w, h); // horizontal
  pass(tmp, out, w, h, w); // vertical
  return out;
}

/** Median color of the outermost ring that is not part of the rounded corners. */
function samplePlateColor(img) {
  const { width: w, data } = img;
  const rs = [];
  const gs = [];
  const bs = [];
  // Midpoints of each edge sit well clear of the corner radius.
  for (const [x, y] of [
    [w >> 1, 6],
    [w >> 1, w - 7],
    [6, w >> 1],
    [w - 7, w >> 1],
  ]) {
    const i = (y * w + x) * 4;
    rs.push(data[i]);
    gs.push(data[i + 1]);
    bs.push(data[i + 2]);
  }
  const mid = (a) => a.sort((p, q) => p - q)[a.length >> 1];
  return [mid(rs), mid(gs), mid(bs)];
}

/**
 * Replaces the pre-rounded corner filler with the plate color, yielding a
 * full-bleed square for iOS to mask itself.
 */
function squareOffCorners(img, plate) {
  const { width: w, height: h, data } = img;

  // The filler is whatever occupies the extreme corner. If it already matches
  // the plate the artwork is full-bleed and there is nothing to do.
  const cornerIsPlate = dist(data, 0, plate) < PLATE_TOLERANCE;
  if (cornerIsPlate) return { img, filled: 0 };

  const filler = [data[0], data[1], data[2]];
  const fillerMask = floodFromBorder(w, h, (p) => dist(data, p * 4, filler) < 110);
  // Grow past the antialiased seam between filler and plate, or a dark fringe
  // survives along the rounded edge.
  const grown = dilate(fillerMask, w, h, 3);

  const out = new Uint8Array(data);
  let filled = 0;
  for (let p = 0; p < w * h; p++) {
    if (!grown[p]) continue;
    const i = p * 4;
    out[i] = plate[0];
    out[i + 1] = plate[1];
    out[i + 2] = plate[2];
    out[i + 3] = 255;
    filled++;
  }

  return { img: { width: w, height: h, data: out }, filled, filler };
}

/**
 * Recolors the background plate while leaving the subject untouched.
 *
 * `shade(x, y)` returns the replacement color. Pixels are blended by how
 * plate-like they are, so the antialiased rim of the globe fades into the new
 * background instead of leaving a pale halo.
 */
function recolorPlate(img, plate, shade) {
  const { width: w, height: h, data } = img;
  // Dilating before the blur keeps coverage saturated right up to the mask
  // boundary, so the ramp falls off only *into* the subject. Blurring the raw
  // mask instead would pull coverage down on the background side too, ringing
  // the whole silhouette with a pale halo.
  const feather = Math.max(1, Math.round((14 * w) / 1024));
  const coverage = softenMask(
    dilate(backgroundMask(img, plate), w, h, feather),
    w,
    h,
    feather
  );

  const out = new Uint8Array(data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (coverage[p] <= 0) continue;
      const i = p * 4;
      // Full replacement for anything comfortably plate-like, ramping to zero
      // at the tolerance edge. A ramp that starts at zero distance would leave
      // the flat filled-in corners a different shade from the (very slightly
      // textured) original plate, resurfacing the rounded-rect seam.
      const plateness = clamp01((PLATE_TOLERANCE - dist(data, i, plate)) / (PLATE_TOLERANCE * 0.4));
      const strength = plateness * coverage[p];
      if (strength <= 0) continue;
      const c = shade(x / w, y / h);
      out[i] = Math.round(mix(data[i], c[0], strength));
      out[i + 1] = Math.round(mix(data[i + 1], c[1], strength));
      out[i + 2] = Math.round(mix(data[i + 2], c[2], strength));
    }
  }
  return { width: w, height: h, data: out };
}

/**
 * Luminance-only version for the tinted slot. iOS multiplies the user's chosen
 * tint through this, so contrast -- not hue -- is what has to survive.
 */
function toTinted(img) {
  const { width: w, height: h, data } = img;
  const out = new Uint8Array(data);
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Straight luminance would flatten this artwork: the leaf green and the
    // ocean blue sit within ~16/255 of each other, so the globe collapses into
    // a featureless disc. Pushing green-dominant pixels up and blue-dominant
    // ones down restores the land/water and leaf/globe separation that carries
    // the icon at small sizes.
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const greenness = (g - b) / 255;
    const v = clamp01(Math.pow(clamp01(l * 0.82 + greenness * 0.5), 0.9));

    const byte = Math.round(v * 255);
    out[i] = byte;
    out[i + 1] = byte;
    out[i + 2] = byte;
  }
  return { width: w, height: h, data: out };
}

function write(name, img) {
  const sized = img.width === OUT_SIZE ? img : png.resize(img, OUT_SIZE);
  const buf = png.encode(sized, true); // opaque: no alpha channel
  fs.writeFileSync(path.join(IMAGES, name), buf);
  console.log(`  ${name.padEnd(16)} ${OUT_SIZE}x${OUT_SIZE}  opaque  ${(buf.length / 1024).toFixed(1)} KB`);
}

// ---------------------------------------------------------------------- main

const source = png.decode(fs.readFileSync(SOURCE));
console.log(`Source: icon.png ${source.width}x${source.height}`);

const plate = samplePlateColor(source);
const hex = `#${plate.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
console.log(`Background plate: rgb(${plate.join(', ')}) ${hex}`);

const { img: squared, filled, filler } = squareOffCorners(source, plate);
if (filled) {
  const pct = ((filled / (source.width * source.height)) * 100).toFixed(2);
  console.log(
    `Squared off pre-rounded corners: filled ${filled} px (${pct}%) of rgb(${filler.join(', ')})`
  );
} else {
  console.log('Corners already full-bleed, nothing to square off.');
}

console.log('Writing variants…');

write('ios-light.png', squared);

// Dark: deep forest plate, slightly lighter at the top so the globe still sits
// on a readable ground rather than a flat black field.
write(
  'ios-dark.png',
  recolorPlate(squared, plate, (x, y) => {
    const t = clamp01(x * 0.35 + y * 0.65);
    return [Math.round(mix(18, 6, t)), Math.round(mix(48, 24, t)), Math.round(mix(28, 14, t))];
  })
);

// Tinted: same composition as dark, flattened to luminance.
write(
  'ios-tinted.png',
  toTinted(
    recolorPlate(squared, plate, () => [16, 16, 16])
  )
);

console.log('Done.');
