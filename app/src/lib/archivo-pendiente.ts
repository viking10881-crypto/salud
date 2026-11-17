import type { ArchivoLocal } from '@/lib/examenes-api';

/**
 * Guarda en memoria el archivo recién elegido mientras el usuario completa el formulario,
 * para no pasar megabytes (base64) por los parámetros de navegación.
 */
const pendientes = new Map<string, ArchivoLocal>();

export function guardarPendiente(archivo: ArchivoLocal) {
  const clave = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  pendientes.clear(); // solo hace falta el último
  pendientes.set(clave, archivo);
  return clave;
}

export const obtenerPendiente = (clave?: string) => (clave ? pendientes.get(clave) : undefined);
export const descartarPendiente = (clave?: string) => clave && pendientes.delete(clave);
