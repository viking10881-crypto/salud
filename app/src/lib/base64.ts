const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const VALOR_B64 = new Uint8Array(256);
for (let i = 0; i < ALFABETO.length; i++) VALOR_B64[ALFABETO.charCodeAt(i)] = i;

/** Decodifica base64 → ArrayBuffer (sin depender de atob) */
export function base64ABytes(b64: string): ArrayBuffer {
  const limpio = b64.replace(/^data:[^,]+,/, '').replace(/[^A-Za-z0-9+/]/g, '');
  const largo = Math.floor((limpio.length * 3) / 4);
  const bytes = new Uint8Array(largo);
  let j = 0;
  for (let i = 0; i < limpio.length; i += 4) {
    const a = VALOR_B64[limpio.charCodeAt(i)];
    const b = VALOR_B64[limpio.charCodeAt(i + 1)];
    const c = VALOR_B64[limpio.charCodeAt(i + 2)];
    const d = VALOR_B64[limpio.charCodeAt(i + 3)];
    bytes[j++] = (a << 2) | (b >> 4);
    if (i + 2 < limpio.length) bytes[j++] = ((b & 15) << 4) | (c >> 2);
    if (i + 3 < limpio.length) bytes[j++] = ((c & 3) << 6) | d;
  }
  return bytes.buffer.slice(0, j);
}
