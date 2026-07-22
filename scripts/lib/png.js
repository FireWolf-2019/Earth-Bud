/**
 * Minimal dependency-free PNG read/write for the icon tooling.
 *
 * Supports 8-bit non-interlaced truecolor (color type 2) and truecolor+alpha
 * (color type 6), which covers everything under assets/images.
 */

const zlib = require('zlib');

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

/** Decodes a PNG file into { width, height, data } where data is RGBA. */
function decode(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');

  let width;
  let height;
  let colorType;
  const idat = [];

  let i = 8;
  while (i < buffer.length) {
    const len = buffer.readUInt32BE(i);
    const type = buffer.toString('ascii', i + 4, i + 8);
    const data = buffer.subarray(i + 8, i + 8 + len);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      colorType = data[9];
      const interlace = data[12];
      if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth} (need 8)`);
      if (colorType !== 2 && colorType !== 6) {
        throw new Error(`unsupported color type ${colorType} (need 2 or 6)`);
      }
      if (interlace !== 0) throw new Error('interlaced PNGs are not supported');
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    i += 12 + len;
  }

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(idat));

  const out = new Uint8Array(width * height * 4);
  let prev = Buffer.alloc(stride);
  let offset = 0;

  for (let y = 0; y < height; y++) {
    const filter = raw[offset];
    const line = Buffer.from(raw.subarray(offset + 1, offset + 1 + stride));
    offset += 1 + stride;

    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? line[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      if (filter === 1) line[x] = (line[x] + a) & 0xff;
      else if (filter === 2) line[x] = (line[x] + b) & 0xff;
      else if (filter === 3) line[x] = (line[x] + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) line[x] = (line[x] + paeth(a, b, c)) & 0xff;
    }

    for (let x = 0; x < width; x++) {
      const src = x * channels;
      const dst = (y * width + x) * 4;
      out[dst] = line[src];
      out[dst + 1] = line[src + 1];
      out[dst + 2] = line[src + 2];
      out[dst + 3] = channels === 4 ? line[src + 3] : 255;
    }
    prev = line;
  }

  return { width, height, data: out };
}

/**
 * Encodes RGBA pixels. `opaque` writes color type 2, dropping alpha entirely --
 * required for App Store icons, which are rejected if they carry an alpha
 * channel (ITMS-90717).
 */
function encode({ width, height, data }, opaque = false) {
  const channels = opaque ? 3 : 4;
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);

  // Adaptive filtering: try all five per row and keep whichever minimizes the
  // sum of absolute signed deltas, the heuristic from the PNG spec. Worth it
  // for smooth gradients, where Paeth/Up predict well -- filter 0 throughout
  // roughly doubles those files.
  //
  // The heuristic is not universally better though: on flat synthetic art it
  // can pick filters that defeat deflate's cross-row matching and come out
  // ~60% larger than no filtering at all. So build both and keep whichever
  // actually compresses smaller.
  const flat = Buffer.alloc((stride + 1) * height);
  const line = Buffer.alloc(stride);
  let prev = Buffer.alloc(stride);
  const candidate = Buffer.alloc(stride);
  let best = null;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = x * channels;
      line[dst] = data[src];
      line[dst + 1] = data[src + 1];
      line[dst + 2] = data[src + 2];
      if (!opaque) line[dst + 3] = data[src + 3];
    }

    line.copy(flat, y * (stride + 1) + 1); // filter byte already 0

    let bestScore = Infinity;
    let bestFilter = 0;
    for (let f = 0; f <= 4; f++) {
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const a = x >= channels ? line[x - channels] : 0;
        const b = prev[x];
        const c = x >= channels ? prev[x - channels] : 0;
        let v;
        if (f === 0) v = line[x];
        else if (f === 1) v = line[x] - a;
        else if (f === 2) v = line[x] - b;
        else if (f === 3) v = line[x] - ((a + b) >> 1);
        else v = line[x] - paeth(a, b, c);
        v &= 0xff;
        candidate[x] = v;
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) {
        bestScore = score;
        bestFilter = f;
        best = Buffer.from(candidate);
      }
    }

    const rowStart = y * (stride + 1);
    raw[rowStart] = bestFilter;
    best.copy(raw, rowStart + 1);
    prev = Buffer.from(line);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = opaque ? 2 : 6;

  const adaptive = zlib.deflateSync(raw, { level: 9 });
  const unfiltered = zlib.deflateSync(flat, { level: 9 });
  const idat = adaptive.length <= unfiltered.length ? adaptive : unfiltered;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Box-filter resample. Good quality for the downscales the icons need. */
function resize(img, size) {
  const { width: sw, height: sh, data: src } = img;
  const out = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    const y0 = (y * sh) / size;
    const y1 = ((y + 1) * sh) / size;
    const yStart = Math.floor(y0);
    const yEnd = Math.min(sh, Math.ceil(y1));

    for (let x = 0; x < size; x++) {
      const x0 = (x * sw) / size;
      const x1 = ((x + 1) * sw) / size;
      const xStart = Math.floor(x0);
      const xEnd = Math.min(sw, Math.ceil(x1));

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let weight = 0;

      for (let sy = yStart; sy < yEnd; sy++) {
        const wy = Math.min(y1, sy + 1) - Math.max(y0, sy);
        for (let sx = xStart; sx < xEnd; sx++) {
          const wx = Math.min(x1, sx + 1) - Math.max(x0, sx);
          const w = wx * wy;
          const i = (sy * sw + sx) * 4;
          const al = src[i + 3] / 255;
          r += src[i] * al * w;
          g += src[i + 1] * al * w;
          b += src[i + 2] * al * w;
          a += al * w;
          weight += w;
        }
      }

      const i = (y * size + x) * 4;
      out[i] = a > 0 ? Math.round(r / a) : 0;
      out[i + 1] = a > 0 ? Math.round(g / a) : 0;
      out[i + 2] = a > 0 ? Math.round(b / a) : 0;
      out[i + 3] = weight > 0 ? Math.round((a / weight) * 255) : 0;
    }
  }

  return { width: size, height: size, data: out };
}

module.exports = { decode, encode, resize };
