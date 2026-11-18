import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';

/**
 * Dirección a la que Supabase devuelve al usuario desde los correos
 * (confirmación de cuenta y recuperación de contraseña).
 * - App instalada: saludplus://bienvenida
 * - Expo Go: exp://<ip>:8081/--/bienvenida
 * Debe estar en Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export const urlRetorno = () => Linking.createURL('/bienvenida');

export type DatosEnlace = {
  access_token?: string;
  refresh_token?: string;
  code?: string;
  type?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
};

/** Lee los parámetros que Supabase agrega al enlace, tanto en `?…` como en `#…`. */
export function leerEnlace(url: string): DatosEnlace {
  const datos: Record<string, string> = {};
  const partes = [url.split('#')[0].split('?')[1], url.split('#')[1]];
  for (const parte of partes) {
    if (!parte) continue;
    for (const par of parte.split('&')) {
      const i = par.indexOf('=');
      if (i <= 0) continue;
      const clave = decodeURIComponent(par.slice(0, i));
      const valor = decodeURIComponent(par.slice(i + 1).replace(/\+/g, ' '));
      datos[clave] = valor;
    }
  }
  return datos;
}

/** ¿Es un enlace de Supabase (y no otro deep link de la app)? */
export const esEnlaceAuth = (d: DatosEnlace) => Boolean(d.access_token || d.code || d.error || d.error_code);

export type ResultadoEnlace =
  | { tipo: 'recuperacion' }
  | { tipo: 'confirmacion' }
  | { tipo: 'error'; mensaje: string };

function mensajeDeError(d: DatosEnlace): string {
  if (d.error_code === 'otp_expired') return 'El enlace ya venció o ya se usó. Pide uno nuevo.';
  if (d.error_description) return d.error_description;
  return 'No se pudo validar el enlace. Pide uno nuevo.';
}

/** Crea la sesión a partir del enlace del correo. */
export async function procesarEnlace(d: DatosEnlace): Promise<ResultadoEnlace> {
  if (d.error || d.error_code) return { tipo: 'error', mensaje: mensajeDeError(d) };

  if (d.access_token && d.refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token: d.access_token, refresh_token: d.refresh_token });
    if (error) return { tipo: 'error', mensaje: mensajeDeError({ error_description: error.message }) };
  } else if (d.code) {
    // Por si el proyecto usa el flujo PKCE
    const { error } = await supabase.auth.exchangeCodeForSession(d.code);
    if (error) return { tipo: 'error', mensaje: mensajeDeError({ error_description: error.message }) };
  } else {
    return { tipo: 'error', mensaje: mensajeDeError({}) };
  }
  return d.type === 'recovery' ? { tipo: 'recuperacion' } : { tipo: 'confirmacion' };
}
