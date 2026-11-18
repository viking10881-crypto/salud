import { base64ABytes } from '@/lib/base64';
import type { Database, Examen } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

export const BUCKET = 'examenes';
/** Debe coincidir con file_size_limit del bucket (20 MB) */
export const TAMANO_MAXIMO = 20 * 1024 * 1024;

export type ExamenInput = Omit<Database['public']['Tables']['examenes']['Insert'], 'id' | 'user_id'>;

export type ArchivoLocal = {
  uri: string;
  nombre: string;
  mimeType: string | null;
  tamano: number | null;
  /** Contenido en base64 si el selector lo entregó (evita leer el archivo del disco) */
  base64?: string | null;
};

const EXTENSION_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  pdf: 'application/pdf',
};
const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
};

/** Tipos que acepta el bucket (ver migración inicial) */
export function tipoArchivo(a: Pick<ArchivoLocal, 'nombre' | 'mimeType'>): string | null {
  const porMime = a.mimeType?.toLowerCase();
  if (porMime && MIME_EXTENSION[porMime]) return porMime;
  const ext = a.nombre.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_MIME[ext] ?? null;
}

export const esImagen = (mime: string | null) => Boolean(mime?.startsWith('image/'));

const idAleatorio = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

/**
 * Lee el contenido del archivo. En Expo Go el módulo de archivos puede no tener permiso
 * de lectura sobre la carpeta del selector ("Missing 'READ' permission"), así que se
 * prueba en orden: base64 del selector → expo-file-system → fetch.
 */
export async function leerBytes(archivo: ArchivoLocal): Promise<ArrayBuffer> {
  if (archivo.base64) return base64ABytes(archivo.base64);
  if (Platform.OS === 'web') return (await fetch(archivo.uri)).arrayBuffer();
  try {
    return await new File(archivo.uri).arrayBuffer();
  } catch (e) {
    try {
      const r = await fetch(archivo.uri);
      return await r.arrayBuffer();
    } catch {
      throw e;
    }
  }
}

export async function listarExamenes(): Promise<Examen[]> {
  const { data, error } = await supabase
    .from('examenes')
    .select('*')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Sube el archivo al bucket privado (<userId>/<id>.<ext>) y crea el registro.
 * Si el registro falla, borra el archivo para no dejar basura.
 */
export async function subirExamen(userId: string, archivo: ArchivoLocal, datos: ExamenInput) {
  const mime = tipoArchivo(archivo);
  if (!mime) throw new Error('Formato no permitido. Usa JPG, PNG, WEBP, HEIC o PDF.');
  if (archivo.tamano && archivo.tamano > TAMANO_MAXIMO) throw new Error('El archivo supera el máximo de 20 MB.');

  const ruta = `${userId}/${idAleatorio()}.${MIME_EXTENSION[mime]}`;
  const bytes = await leerBytes(archivo);
  if (bytes.byteLength > TAMANO_MAXIMO) throw new Error('El archivo supera el máximo de 20 MB.');

  const { error: errorSubida } = await supabase.storage.from(BUCKET).upload(ruta, bytes, { contentType: mime });
  if (errorSubida) throw errorSubida;

  const { data, error } = await supabase
    .from('examenes')
    .insert({ ...datos, archivo_path: ruta, mime_type: mime })
    .select()
    .single();
  if (error) {
    await supabase.storage.from(BUCKET).remove([ruta]);
    throw error;
  }
  return data;
}

export async function actualizarExamen(id: string, cambios: Partial<ExamenInput>) {
  const { data, error } = await supabase.from('examenes').update(cambios).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function eliminarExamen(examen: Examen) {
  if (examen.archivo_path) {
    const { error } = await supabase.storage.from(BUCKET).remove([examen.archivo_path]);
    if (error) throw error;
  }
  const { error } = await supabase.from('examenes').delete().eq('id', examen.id);
  if (error) throw error;
}

/** URLs temporales (el bucket es privado). Devuelve un mapa ruta → url. */
export async function urlsFirmadas(rutas: string[], segundos = 3600): Promise<Record<string, string>> {
  if (rutas.length === 0) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(rutas, segundos);
  if (error) throw error;
  const mapa: Record<string, string> = {};
  for (const d of data) if (d.path && d.signedUrl) mapa[d.path] = d.signedUrl;
  return mapa;
}

