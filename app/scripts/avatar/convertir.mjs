// Convierte un STL binario en una malla reducida y cuantizada para la app.
// Uso: node convertir.mjs <entrada.stl> <salida.bin> <triangulos_objetivo> [<preview.stl>]
import { readFileSync, writeFileSync } from 'node:fs';
import { MeshoptSimplifier } from 'meshoptimizer';

const [entrada, salida, objetivoTxt, preview] = process.argv.slice(2);
const objetivo = Number(objetivoTxt);

const buf = readFileSync(entrada);
const n = buf.readUInt32LE(80);
console.log('triángulos originales', n);

// 1) Soldar vértices (el STL repite cada vértice en cada triángulo)
const mapa = new Map();
const pos = [];
const idx = new Uint32Array(n * 3);
const Q = 1e4;
for (let t = 0; t < n; t++) {
  const o = 84 + t * 50 + 12;
  for (let k = 0; k < 3; k++) {
    const x = buf.readFloatLE(o + k * 12);
    const y = buf.readFloatLE(o + k * 12 + 4);
    const z = buf.readFloatLE(o + k * 12 + 8);
    const clave = `${Math.round(x * Q)},${Math.round(y * Q)},${Math.round(z * Q)}`;
    let i = mapa.get(clave);
    if (i === undefined) {
      i = pos.length / 3;
      mapa.set(clave, i);
      pos.push(x, y, z);
    }
    idx[t * 3 + k] = i;
  }
}
mapa.clear();
// Quitar triángulos degenerados
let m = 0;
for (let t = 0; t < n; t++) {
  const a = idx[t * 3], b = idx[t * 3 + 1], c = idx[t * 3 + 2];
  if (a !== b && b !== c && a !== c) {
    idx[m++] = a; idx[m++] = b; idx[m++] = c;
  }
}
const indices = idx.slice(0, m);
const posiciones = new Float32Array(pos);
console.log('vértices únicos', posiciones.length / 3, 'triángulos válidos', m / 3);

// 2) Simplificar
await MeshoptSimplifier.ready;
const [simpl, err] = MeshoptSimplifier.simplify(indices, posiciones, 3, objetivo * 3, 0.01, []);
console.log('triángulos reducidos', simpl.length / 3, 'error relativo', err.toFixed(5));

// 3) Compactar vértices usados
const remap = new Int32Array(posiciones.length / 3).fill(-1);
const nuevasPos = [];
const nuevosIdx = new Uint32Array(simpl.length);
for (let i = 0; i < simpl.length; i++) {
  const v = simpl[i];
  if (remap[v] < 0) {
    remap[v] = nuevasPos.length / 3;
    nuevasPos.push(posiciones[v * 3], posiciones[v * 3 + 1], posiciones[v * 3 + 2]);
  }
  nuevosIdx[i] = remap[v];
}
const nv = nuevasPos.length / 3;
console.log('vértices finales', nv);

// 4) Normales suaves (ponderadas por área)
const nor = new Float32Array(nv * 3);
for (let i = 0; i < nuevosIdx.length; i += 3) {
  const [a, b, c] = [nuevosIdx[i], nuevosIdx[i + 1], nuevosIdx[i + 2]];
  const ax = nuevasPos[a * 3], ay = nuevasPos[a * 3 + 1], az = nuevasPos[a * 3 + 2];
  const ux = nuevasPos[b * 3] - ax, uy = nuevasPos[b * 3 + 1] - ay, uz = nuevasPos[b * 3 + 2] - az;
  const vx = nuevasPos[c * 3] - ax, vy = nuevasPos[c * 3 + 1] - ay, vz = nuevasPos[c * 3 + 2] - az;
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  for (const v of [a, b, c]) { nor[v * 3] += nx; nor[v * 3 + 1] += ny; nor[v * 3 + 2] += nz; }
}

// 5) Cuantizar: posiciones int16 (escala uniforme), normales int8. Se pasa de Z-arriba a Y-arriba.
let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
for (let v = 0; v < nv; v++) for (let k = 0; k < 3; k++) {
  mn[k] = Math.min(mn[k], nuevasPos[v * 3 + k]); mx[k] = Math.max(mx[k], nuevasPos[v * 3 + k]);
}
const centro = mn.map((a, k) => (a + mx[k]) / 2);
const mitad = Math.max(...mx.map((a, k) => (a - mn[k]) / 2));
const usar32 = nv > 65535;
const bytesPos = nv * 6, bytesNor = nv * 3;
const relleno = (4 - ((bytesPos + bytesNor) % 4)) % 4;
const bytesIdx = nuevosIdx.length * (usar32 ? 4 : 2);
const out = Buffer.alloc(bytesPos + bytesNor + relleno + bytesIdx);
for (let v = 0; v < nv; v++) {
  // (x, y, z) del STL -> (x, z, -y) en three.js: Z-arriba a Y-arriba
  const x = (nuevasPos[v * 3] - centro[0]) / mitad;
  const y = (nuevasPos[v * 3 + 2] - centro[2]) / mitad;
  const z = -(nuevasPos[v * 3 + 1] - centro[1]) / mitad;
  out.writeInt16LE(Math.round(x * 32767), v * 6);
  out.writeInt16LE(Math.round(y * 32767), v * 6 + 2);
  out.writeInt16LE(Math.round(z * 32767), v * 6 + 4);
  let nx = nor[v * 3], ny = nor[v * 3 + 2], nz = -nor[v * 3 + 1];
  const l = Math.hypot(nx, ny, nz) || 1;
  out.writeInt8(Math.round((nx / l) * 127), bytesPos + v * 3);
  out.writeInt8(Math.round((ny / l) * 127), bytesPos + v * 3 + 1);
  out.writeInt8(Math.round((nz / l) * 127), bytesPos + v * 3 + 2);
}
const baseIdx = bytesPos + bytesNor + relleno;
for (let i = 0; i < nuevosIdx.length; i++) {
  if (usar32) out.writeUInt32LE(nuevosIdx[i], baseIdx + i * 4);
  else out.writeUInt16LE(nuevosIdx[i], baseIdx + i * 2);
}
writeFileSync(salida, out);
const meta = {
  vertices: nv,
  indices: nuevosIdx.length,
  indices32: usar32,
  offsetNormales: bytesPos,
  offsetIndices: baseIdx,
  alto: (mx[2] - mn[2]) / 2 / mitad, // media altura normalizada (eje Y en three.js)
};
writeFileSync(salida + '.json', JSON.stringify(meta));
console.log('bytes', out.length, meta);

// Vista previa opcional como STL binario
if (preview) {
  const t = nuevosIdx.length / 3;
  const p = Buffer.alloc(84 + t * 50);
  p.writeUInt32LE(t, 80);
  for (let i = 0; i < t; i++) for (let k = 0; k < 3; k++) {
    const v = nuevosIdx[i * 3 + k];
    for (let j = 0; j < 3; j++) p.writeFloatLE(nuevasPos[v * 3 + j], 84 + i * 50 + 12 + k * 12 + j * 4);
  }
  writeFileSync(preview, p);
}
