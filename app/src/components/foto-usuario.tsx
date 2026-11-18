import { Aviso } from '@/components/aviso';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { mensajeError } from '@/lib/auth-errors';
import { urlsFirmadas } from '@/lib/examenes-api';
import { type Origen, seleccionarArchivo } from '@/lib/seleccionar-archivo';
import { useAuth } from '@/providers/auth-provider';
import { Image } from 'expo-image';
import { Camera, Images, type LucideIcon, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, View } from 'react-native';

type Opcion = { valor: Origen | 'quitar'; texto: string; icono: LucideIcon };

/** Foto de perfil del usuario (o sus iniciales). Al tocarla se puede cambiar o quitar. */
export function FotoUsuario({ size = 130 }: { size?: number }) {
  const { perfil, cambiarFoto } = useAuth();
  const ruta = perfil?.avatar_url ?? null;
  const [url, setUrl] = useState<{ ruta: string; url: string } | null>(null);
  const [eligiendo, setEligiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El bucket es privado: se pide una URL temporal para la ruta guardada
  useEffect(() => {
    if (!ruta) return;
    let vigente = true;
    urlsFirmadas([ruta])
      .then((m) => vigente && m[ruta] && setUrl({ ruta, url: m[ruta] }))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [ruta]);

  const urlActual = url && url.ruta === ruta ? url.url : null;
  const iniciales =
    [perfil?.nombre, perfil?.apellido]
      .map((p) => p?.trim().charAt(0) ?? '')
      .join('')
      .toUpperCase() || '?';

  const opciones: Opcion[] = [
    ...(Platform.OS === 'web' ? [] : [{ valor: 'camara' as const, texto: 'Tomar foto', icono: Camera }]),
    { valor: 'galeria', texto: 'Elegir de la galería', icono: Images },
    ...(ruta ? [{ valor: 'quitar' as const, texto: 'Quitar foto', icono: Trash2 }] : []),
  ];

  const elegir = async (valor: Opcion['valor']) => {
    setEligiendo(false);
    setError(null);
    try {
      if (valor === 'quitar') {
        setGuardando(true);
        await cambiarFoto(null);
        return;
      }
      const r = await seleccionarArchivo(valor, { cuadrada: true });
      if ('sinPermiso' in r) return setError(r.sinPermiso);
      if ('cancelado' in r) return;
      setGuardando(true);
      await cambiarFoto(r.archivo);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View className="items-center gap-2">
      <Pressable
        onPress={() => setEligiendo(true)}
        disabled={guardando}
        accessibilityRole="button"
        accessibilityLabel={ruta ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
        style={{ width: size, height: size }}
        className="active:opacity-80">
        <View className="flex-1 items-center justify-center overflow-hidden rounded-full bg-primary">
          {urlActual ? (
            <Image source={{ uri: urlActual }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
          ) : (
            <Text className="font-bold text-primary-foreground" style={{ fontSize: size * 0.36, lineHeight: size * 0.44 }}>
              {iniciales}
            </Text>
          )}
          {guardando && (
            <View className="absolute inset-0 items-center justify-center bg-black/40">
              <ActivityIndicator color="white" />
            </View>
          )}
        </View>
        <View
          className="absolute items-center justify-center rounded-full border-4 border-background bg-heart"
          style={{ width: size * 0.3, height: size * 0.3, right: 0, bottom: size * 0.02 }}>
          <Icon as={Camera} size={size * 0.13} className="text-white" />
        </View>
      </Pressable>
      {error && <Aviso>{error}</Aviso>}

      <Modal visible={eligiendo} transparent animationType="slide" onRequestClose={() => setEligiendo(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setEligiendo(false)} accessibilityLabel="Cerrar" />
        <View className="gap-2 rounded-t-3xl bg-card px-4 pb-10 pt-5">
          <Text className="mb-2 text-center text-lg font-bold">Foto de perfil</Text>
          {opciones.map((o) => (
            <Pressable
              key={o.valor}
              onPress={() => elegir(o.valor)}
              className="flex-row items-center gap-4 rounded-2xl p-3 active:bg-accent">
              <View className={o.valor === 'quitar' ? 'h-12 w-12 items-center justify-center rounded-xl bg-destructive/10' : 'h-12 w-12 items-center justify-center rounded-xl bg-secondary'}>
                <Icon as={o.icono} size={24} className={o.valor === 'quitar' ? 'text-destructive' : 'text-primary'} />
              </View>
              <Text className={o.valor === 'quitar' ? 'font-semibold text-destructive' : 'font-semibold'}>{o.texto}</Text>
            </Pressable>
          ))}
          <Button variant="ghost" className="mt-2" onPress={() => setEligiendo(false)}>
            <Text>Cancelar</Text>
          </Button>
        </View>
      </Modal>
    </View>
  );
}
