/**
 * Generates the SidCalc app icons (a crimson "=" on black) with zero dependencies.
 * Run once from the project root:   node scripts/generate-icons.js
 * It overwrites the default Expo images in ./assets.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---- minimal PNG encoder (RGBA, 8-bit) ------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- drawing ---------------------------------------------------------------
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Signed distance from point to a rounded rectangle centred at (cx, cy). */
function roundedRectDist(px, py, cx, cy, hw, hh, r) {
  const dx = Math.abs(px - cx) - (hw - r);
  const dy = Math.abs(py - cy) - (hh - r);
  const ox = Math.max(dx, 0);
  const oy = Math.max(dy, 0);
  return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(dx, dy), 0) - r;
}

/**
 * Draw an "=" sign. `scale` shrinks the symbol (used for adaptive icons whose
 * safe zone is the middle ~66%). `bg` null means transparent background.
 */
function render(size, { bg, fg, scale }) {
  const out = Buffer.alloc(size * size * 4);
  const barW = size * 0.5 * scale;
  const barH = size * 0.115 * scale;
  const gap = size * 0.13 * scale;
  const cx = size / 2;
  const ys = [size / 2 - (gap + barH) / 2, size / 2 + (gap + barH) / 2];
  const bgc = bg ? hex(bg) : [0, 0, 0];
  const fgc = hex(fg);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let cover = 0;
      for (const cy of ys) {
        const d = roundedRectDist(x + 0.5, y + 0.5, cx, cy, barW / 2, barH / 2, barH / 2);
        cover = Math.max(cover, Math.min(1, Math.max(0, 0.5 - d)));
      }
      const i = (y * size + x) * 4;
      const bgA = bg ? 1 : 0;
      const a = cover + bgA * (1 - cover);
      for (let c = 0; c < 3; c++) {
        const v = a === 0 ? 0 : (fgc[c] * cover + bgc[c] * bgA * (1 - cover)) / a;
        out[i + c] = Math.round(v);
      }
      out[i + 3] = Math.round(a * 255);
    }
  }
  return out;
}

const GOLD = '#E8123C';
const BLACK = '#0A0A0B';
const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });

const files = {
  'icon.png': [1024, { bg: BLACK, fg: GOLD, scale: 1 }],
  'android-icon-background.png': [1024, { bg: BLACK, fg: BLACK, scale: 0 }],
  'android-icon-foreground.png': [1024, { bg: null, fg: GOLD, scale: 0.72 }],
  'android-icon-monochrome.png': [1024, { bg: null, fg: '#FFFFFF', scale: 0.72 }],
  'splash-icon.png': [1024, { bg: null, fg: GOLD, scale: 0.8 }],
  'favicon.png': [64, { bg: BLACK, fg: GOLD, scale: 1 }],
};

for (const [name, [size, opts]] of Object.entries(files)) {
  fs.writeFileSync(path.join(outDir, name), encodePng(size, render(size, opts)));
  console.log('wrote assets/' + name);
}
