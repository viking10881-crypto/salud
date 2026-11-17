import type { ArchivoLocal } from '@/lib/examenes-api';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export type Origen = 'camara' | 'galeria' | 'documento';

/** Resultado: el archivo elegido, null si el usuario canceló, o un error de permiso. */
export type Seleccion = { archivo: ArchivoLocal } | { cancelado: true } | { sinPermiso: string };

function deImagen(a: ImagePicker.ImagePickerAsset, prefijo: string): ArchivoLocal {
  // Con base64, el selector entrega los datos en JPEG
  const nombreBase = (a.fileName ?? `${prefijo}-${Date.now()}`).replace(/\.[^.]+$/, '');
  return {
    uri: a.uri,
    nombre: a.base64 ? `${nombreBase}.jpg` : (a.fileName ?? `${nombreBase}.jpg`),
    mimeType: a.base64 ? 'image/jpeg' : (a.mimeType ?? 'image/jpeg'),
    tamano: a.base64 ? Math.floor((a.base64.length * 3) / 4) : (a.fileSize ?? null),
    base64: a.base64 ?? null,
  };
}

export async function seleccionarArchivo(origen: Origen): Promise<Seleccion> {
  if (origen === 'camara') {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) return { sinPermiso: 'Permite el acceso a la cámara en los ajustes del teléfono.' };
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (r.canceled || !r.assets[0]) return { cancelado: true };
    return { archivo: deImagen(r.assets[0], 'foto') };
  }

  if (origen === 'galeria') {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: true });
    if (r.canceled || !r.assets[0]) return { cancelado: true };
    return { archivo: deImagen(r.assets[0], 'imagen') };
  }

  const r = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
  });
  if (r.canceled || !r.assets[0]) return { cancelado: true };
  const a = r.assets[0];
  return { archivo: { uri: a.uri, nombre: a.name, mimeType: a.mimeType ?? null, tamano: a.size ?? null } };
}
