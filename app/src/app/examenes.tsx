import { Aviso } from '@/components/aviso';
import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CATEGORIAS_EXAMEN, categoriaExamen } from '@/lib/categorias-examen';
import type { Examen } from '@/lib/database.types';
import { esImagen } from '@/lib/examenes-api';
import { formatoFechaCorta } from '@/lib/fechas';
import { guardarPendiente } from '@/lib/archivo-pendiente';
import { type Origen, seleccionarArchivo } from '@/lib/seleccionar-archivo';
import { cn } from '@/lib/utils';
import { useExamenes } from '@/providers/examenes-provider';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Camera, CloudUpload, FileText, FolderOpen, Images, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ORIGENES: { valor: Origen; texto: string; detalle: string; icono: LucideIcon; soloMovil?: boolean }[] = [
  { valor: 'camara', texto: 'Tomar foto', detalle: 'Fotografía un examen o una fórmula', icono: Camera, soloMovil: true },
  { valor: 'galeria', texto: 'Elegir de la galería', detalle: 'Una foto que ya tengas', icono: Images },
  { valor: 'documento', texto: 'Elegir archivo', detalle: 'PDF o imagen de tus documentos', icono: FolderOpen },
];

function Miniatura({ examen, url }: { examen: Examen; url?: string }) {
  const cat = categoriaExamen(examen.categoria);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/examen', params: { id: examen.id } })}
      className="w-[48%] active:opacity-80">
      <Card className="gap-0 overflow-hidden rounded-2xl py-0">
        <View className="h-32 items-center justify-center bg-muted">
          {url && esImagen(examen.mime_type) ? (
            <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
          ) : (
            <View className="items-center gap-1">
              <Icon as={examen.mime_type === 'application/pdf' ? FileText : cat.icono} size={44} className="text-examenes-foreground" />
              {examen.mime_type === 'application/pdf' && <Text className="text-xs font-bold text-examenes-foreground">PDF</Text>}
            </View>
          )}
        </View>
        <View className="gap-0.5 p-3">
          <Text className="text-sm font-semibold" numberOfLines={1}>
            {examen.titulo}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {cat.texto} · {formatoFechaCorta(examen.fecha)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export default function Examenes() {
  const { examenes, miniaturas, cargando, error, recargar } = useExamenes();
  const [filtro, setFiltro] = useState<Examen['categoria'] | null>(null);
  const [eligiendo, setEligiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const visibles = filtro ? examenes.filter((e) => e.categoria === filtro) : examenes;
  const categoriasUsadas = CATEGORIAS_EXAMEN.filter((c) => examenes.some((e) => e.categoria === c.valor));

  const elegir = async (origen: Origen) => {
    setEligiendo(false);
    setAviso(null);
    try {
      const r = await seleccionarArchivo(origen);
      if ('sinPermiso' in r) return setAviso(r.sinPermiso);
      if ('cancelado' in r) return;
      router.push({ pathname: '/examen', params: { pendiente: guardarPendiente(r.archivo) } });
    } catch {
      setAviso('No se pudo abrir el selector. Inténtalo de nuevo.');
    }
  };

  const onRefrescar = async () => {
    setRefrescando(true);
    await recargar().catch(() => {});
    setRefrescando(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Mis Exámenes" actionIcon={CloudUpload} onAction={() => setEligiendo(true)} />
      {cargando ? (
        <ActivityIndicator className="mt-10" />
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 p-4 pb-10"
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefrescar} />}>
          {error && <Aviso>{error}</Aviso>}
          {aviso && <Aviso>{aviso}</Aviso>}

          <Pressable
            onPress={() => setEligiendo(true)}
            className="items-center gap-2 rounded-3xl border-2 border-dashed border-ring bg-secondary/60 px-4 py-8 active:opacity-80">
            <Icon as={CloudUpload} size={44} className="text-primary" />
            <Text className="font-semibold text-secondary-foreground">Sube tus exámenes médicos</Text>
            <Text variant="muted">Fotos o PDF · máximo 20 MB · solo tú puedes verlos</Text>
          </Pressable>

          {categoriasUsadas.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {[{ valor: null, texto: 'Todos' }, ...categoriasUsadas].map((c) => (
                <Pressable
                  key={c.valor ?? 'todos'}
                  onPress={() => setFiltro(c.valor)}
                  className={cn(
                    'rounded-full border px-4 py-2',
                    filtro === c.valor ? 'border-primary bg-primary' : 'border-input bg-card'
                  )}>
                  <Text className={cn('text-sm', filtro === c.valor ? 'font-semibold text-primary-foreground' : '')}>{c.texto}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {examenes.length === 0 ? (
            <Text variant="muted" className="text-center">
              Aún no tienes exámenes. Sube resultados de laboratorio, radiografías, ecografías, fórmulas o diagnósticos.
            </Text>
          ) : (
            <View className="flex-row flex-wrap justify-between gap-y-4">
              {visibles.map((e) => (
                <Miniatura key={e.id} examen={e} url={e.archivo_path ? miniaturas[e.archivo_path] : undefined} />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Elegir de dónde subir */}
      <Modal visible={eligiendo} transparent animationType="slide" onRequestClose={() => setEligiendo(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setEligiendo(false)} accessibilityLabel="Cerrar" />
        <View className="gap-2 rounded-t-3xl bg-card px-4 pb-10 pt-5">
          <Text className="mb-2 text-center text-lg font-bold">Subir examen</Text>
          {ORIGENES.filter((o) => !(o.soloMovil && Platform.OS === 'web')).map((o) => (
            <Pressable
              key={o.valor}
              onPress={() => elegir(o.valor)}
              className="flex-row items-center gap-4 rounded-2xl p-3 active:bg-accent">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-examenes">
                <Icon as={o.icono} size={24} className="text-examenes-foreground" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold">{o.texto}</Text>
                <Text variant="muted">{o.detalle}</Text>
              </View>
            </Pressable>
          ))}
          <Button variant="ghost" className="mt-2" onPress={() => setEligiendo(false)}>
            <Text>Cancelar</Text>
          </Button>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
