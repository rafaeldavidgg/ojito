// Genera los PNG del favicon de Ojito sin dependencias (rasteriza la marca del ojo
// con supersampling analitico y escribe PNG via zlib). Uso: node scripts/make-icons.js
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const PAPER = [250, 245, 236, 255];
const ACCENT = [179, 39, 74, 255];

// Ojo en espacio 32x32 (misma geometria que el SVG del header e icon.svg).
const SEGS = [
  [[2, 16], [6, 9.5], [11, 6], [16, 6]],
  [[16, 6], [26, 9.5], [26, 9.5], [30, 16]], // s10 3.5 14 10 -> c2 abs (26,9.5)
  [[30, 16], [26, 22.5], [21, 26], [16, 26]],
  [[16, 26], [11, 26], [6, 22.5], [2, 16]],
];
const PUPIL = { x: 16, y: 16, r: 5.2 };
const GLINT = { x: 17.8, y: 14.2, r: 1.6 };
const STROKE_W = 2.4;

function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

function sampleEye(n = 600) {
  const pts = [];
  for (const s of SEGS) {
    for (let i = 0; i < n / SEGS.length; i++) pts.push(cubic(s[0], s[1], s[2], s[3], i / (n / SEGS.length)));
  }
  return pts;
}
const EYE = sampleEye();

function rrDist(x, y, s, r) {
  // Distancia con signo al rounded-rect [0,s]^2 de radio r (negativa dentro).
  const qx = Math.abs(x - s / 2) - (s / 2 - r);
  const qy = Math.abs(y - s / 2) - (s / 2 - r);
  const ax = Math.max(qx, 0), ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

function smooth(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function render(size, { rounded = true, artScale = 1 } = {}) {
  const k = size / 32; // px por unidad
  const feather = 0.9 / k; // AA en unidades 32-espacio
  const buf = Buffer.alloc(size * size * 4);
  const cx = 16, cy = 16;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      // Punto en 32-espacio (centro del pixel), con escala de arte opcional.
      let x = (px + 0.5) / k, y = (py + 0.5) / k;
      x = cx + (x - cx) / artScale;
      y = cy + (y - cy) / artScale;
      // Fondo
      let bgA = 1;
      if (rounded) bgA = 1 - smooth(0, feather, rrDist(x, y, 32, 7));
      let col = [...PAPER];
      col[3] = Math.round(255 * bgA);
      // Pupila
      const dp = Math.hypot(x - PUPIL.x, y - PUPIL.y) - PUPIL.r;
      const pupilA = 1 - smooth(0, feather, dp);
      // Brillo (recorta la pupila)
      const dg = Math.hypot(x - GLINT.x, y - GLINT.y) - GLINT.r;
      const glintA = 1 - smooth(0, feather, dg);
      // Trazo del ojo
      let dmin = Infinity;
      for (let i = 0; i < EYE.length; i++) {
        const dx = x - EYE[i][0], dy = y - EYE[i][1];
        const d2 = dx * dx + dy * dy;
        if (d2 < dmin) dmin = d2;
      }
      const strokeA = 1 - smooth(0, feather, Math.sqrt(dmin) - STROKE_W / 2);
      // Composicion: fondo -> pupila -> brillo -> trazo
      const over = (dst, src, a) => [
        Math.round(src[0] * a + dst[0] * (1 - a)),
        Math.round(src[1] * a + dst[1] * (1 - a)),
        Math.round(src[2] * a + dst[2] * (1 - a)),
        dst[3],
      ];
      if (pupilA > 0) col = over(col, ACCENT, pupilA * bgA);
      if (glintA > 0) col = over(col, PAPER, glintA * bgA);
      if (strokeA > 0) col = over(col, ACCENT, strokeA * bgA);
      const o = (py * size + px) * 4;
      buf[o] = col[0]; buf[o + 1] = col[1]; buf[o + 2] = col[2]; buf[o + 3] = col[3];
    }
  }
  return buf;
}

// ---- escritor PNG minimo (RGBA, sin interlace) ----
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
}

function writePng(file, size, rgba) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log('ok', path.basename(file), size + 'x' + size, (fs.statSync(file).size / 1024).toFixed(1) + 'KB');
}

const dir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(dir, { recursive: true });
writePng(path.join(dir, 'icon-32.png'), 32, render(32));
writePng(path.join(dir, 'icon-192.png'), 192, render(192));
writePng(path.join(dir, 'icon-512.png'), 512, render(512));
// iOS no admite transparencia: fondo papel a sangre.
writePng(path.join(dir, 'apple-touch-icon.png'), 180, render(180, { rounded: false }));
// Maskable: a sangre y arte al 80% dentro de la zona segura.
writePng(path.join(dir, 'maskable-512.png'), 512, render(512, { rounded: false, artScale: 0.8 }));
