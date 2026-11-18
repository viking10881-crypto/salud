import { esEnlaceAuth, leerEnlace, procesarEnlace } from '@/lib/enlaces-auth';
import { useAuth } from '@/providers/auth-provider';
import { useLinkingURL } from 'expo-linking';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

/**
 * Atiende los enlaces de los correos de Supabase (confirmar cuenta, recuperar contraseña)
 * cuando abren la app. No dibuja nada.
 */
export function ManejadorEnlaces() {
  const url = useLinkingURL();
  const { iniciarRecuperacion } = useAuth();
  const procesados = useRef(new Set<string>());

  useEffect(() => {
    if (!url || procesados.current.has(url)) return;
    const datos = leerEnlace(url);
    if (!esEnlaceAuth(datos)) return;
    procesados.current.add(url);

    // Antes de crear la sesión, para que la navegación vaya directo a "Nueva contraseña"
    if (datos.type === 'recovery' && !datos.error) iniciarRecuperacion();

    procesarEnlace(datos).then((r) => {
      if (r.tipo === 'error') Alert.alert('Enlace no válido', r.mensaje);
      else if (r.tipo === 'confirmacion') Alert.alert('¡Correo confirmado!', 'Tu cuenta ya está activa. Bienvenido.');
    });
  }, [url, iniciarRecuperacion]);

  return null;
}
