// Rasterizador simple con z-buffer que lee el .bin (mismo formato que la app). Salida PPM.
import { readFileSync, writeFileSync } from 'node:fs';
const [bin, salida] = process.argv.slice(2);
const b = readFileSync(bin); const meta = JSON.parse(readFileSync(bin + '.json'));
const P = new Int16Array(b.buffer, b.byteOffset, meta.vertices * 3);
const N = new Int8Array(b.buffer, b.byteOffset + meta.offsetNormales, meta.vertices * 3);
const I = meta.indices32 ? new Uint32Array(b.buffer.slice(b.byteOffset + meta.offsetIndices, b.byteOffset + meta.offsetIndices + meta.indices * 4))
  : new Uint16Array(b.buffer.slice(b.byteOffset + meta.offsetIndices, b.byteOffset + meta.offsetIndices + meta.indices * 2));
const W = 500, vistas = [0, 0.6, Math.PI / 2]; // ángulos de giro en Y
const img = Buffer.alloc(W * vistas.length * W * 3, 0);
for (let p = 0; p < img.length; p += 3) { img[p] = 247; img[p + 1] = 245; img[p + 2] = 254; }
vistas.forEach((ang, vi) => {
  const zb = new Float32Array(W * W).fill(-Infinity);
  const c = Math.cos(ang), s = Math.sin(ang);
  const tr = (i) => { const x = P[i * 3] / 32767, y = P[i * 3 + 1] / 32767, z = P[i * 3 + 2] / 32767;
    return [x * c + z * s, y, -x * s + z * c]; };
  const nrm = (i) => { const x = N[i * 3] / 127, y = N[i * 3 + 1] / 127, z = N[i * 3 + 2] / 127; return [x * c + z * s, y, -x * s + z * c]; };
  const L = [0.4, 0.5, 0.77];
  for (let t = 0; t < I.length; t += 3) {
    const v = [I[t], I[t + 1], I[t + 2]].map((i) => { const [x, y, z] = tr(i); const n = nrm(i);
      return { x: (x * 0.95 + 1) / 2 * W, y: (1 - (y * 0.95 + 1) / 2) * W, z, l: Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) }; });
    const area = (v[1].x - v[0].x) * (v[2].y - v[0].y) - (v[2].x - v[0].x) * (v[1].y - v[0].y);
    if (area === 0) continue;
    const minx = Math.max(0, Math.floor(Math.min(v[0].x, v[1].x, v[2].x))), maxx = Math.min(W - 1, Math.ceil(Math.max(v[0].x, v[1].x, v[2].x)));
    const miny = Math.max(0, Math.floor(Math.min(v[0].y, v[1].y, v[2].y))), maxy = Math.min(W - 1, Math.ceil(Math.max(v[0].y, v[1].y, v[2].y)));
    for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((v[1].x - px) * (v[2].y - py) - (v[2].x - px) * (v[1].y - py)) / area;
      const w1 = ((v[2].x - px) * (v[0].y - py) - (v[0].x - px) * (v[2].y - py)) / area;
      const w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const z = w0 * v[0].z + w1 * v[1].z + w2 * v[2].z;
      if (z <= zb[y * W + x]) continue;
      zb[y * W + x] = z;
      const l = 0.35 + 0.65 * (w0 * v[0].l + w1 * v[1].l + w2 * v[2].l);
      const o = (y * W * vistas.length + vi * W + x) * 3;
      img[o] = Math.min(255, 124 + 131 * l * 0.9); img[o + 1] = Math.min(255, 58 + 197 * l * 0.9); img[o + 2] = Math.min(255, 237 * (0.6 + 0.4 * l));
    }
  }
});
writeFileSync(salida, Buffer.concat([Buffer.from(`P6 ${W * vistas.length} ${W} 255\n`), img]));
