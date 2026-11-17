import { base64ABytes } from '@/lib/base64';
import { BufferAttribute, BufferGeometry } from 'three';
import { META_DOCTORA as M, MODELO_DOCTORA_B64 } from './modelo-doctora';

let cache: BufferGeometry | null = null;

/**
 * Geometría de la doctora (Y hacia arriba, centrada, alto total = 2 unidades: y ∈ [-1, 1]).
 * Se decodifica una sola vez y se comparte entre todos los avatares.
 * Las posiciones vienen en int16 y las normales en int8; se pasan a float32 para
 * no depender del soporte de atributos normalizados en expo-gl.
 */
export function geometriaDoctora(): BufferGeometry {
  if (cache) return cache;
  const buf = base64ABytes(MODELO_DOCTORA_B64);
  const n = M.vertices * 3;
  const p16 = new Int16Array(buf, 0, n);
  const n8 = new Int8Array(buf, M.offsetNormales, n);
  const pos = new Float32Array(n);
  const nor = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i] = p16[i] / 32767;
    nor[i] = n8[i] / 127;
  }
  const idx = M.indices32
    ? new Uint32Array(buf, M.offsetIndices, M.indices)
    : new Uint16Array(buf, M.offsetIndices, M.indices);

  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('normal', new BufferAttribute(nor, 3));
  g.setIndex(new BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  cache = g;
  return g;
}

/** Cómo se encuadra la figura: medio cuerpo o solo busto (para avatares pequeños). */
export type Encuadre = 'busto' | 'medio';

const FOV = 30;
const ENCUADRES: Record<Encuadre, { centroX: number; centroY: number; alto: number }> = {
  busto: { centroX: -0.08, centroY: 0.55, alto: 1.3 },
  medio: { centroX: 0, centroY: 0.22, alto: 1.8 },
};

/** Posición de la cámara (mirando hacia -Z) para que quepa el encuadre. */
export function camaraPara(encuadre: Encuadre) {
  const { centroX, centroY, alto } = ENCUADRES[encuadre];
  const distancia = alto / (2 * Math.tan(((FOV / 2) * Math.PI) / 180));
  return { fov: FOV, position: [centroX, centroY, distancia] as [number, number, number] };
}
