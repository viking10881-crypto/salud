import { Aviso } from '@/components/aviso';
import { ScreenHeader } from '@/components/screen-header';
import { SelectorFechaHora } from '@/components/selector-fecha-hora';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { mensajeError } from '@/lib/auth-errors';
import { CATEGORIAS_EXAMEN } from '@/lib/categorias-examen';
import type { Examen } from '@/lib/database.types';
import { esImagen, TAMANO_MAXIMO, tipoArchivo, urlsFirmadas } from '@/lib/examenes-api';
import { descartarPendiente, obtenerPendiente } from '@/lib/archivo-pendiente';
import { aFechaISO, deFechaISO, formatoFechaCorta } from '@/lib/fechas';
import { cn } from '@/lib/utils';
import { useExamenes } from '@/providers/examenes-provider';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { CalendarDays, ExternalLink, FileText, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Título sugerido a partir del nombre del archivo: "hemograma_2026.pdf" → "hemograma 2026" */
const tituloDesdeNombre = (nombre?: string) => {
  if (!nombre) return '';
  const base = nombre.replace(/\.[^.]+$/, '');
  // Nombres automáticos (UUID, códigos, IMG_1234, foto-1731…) no sirven como título
  if (/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(base)) return '';
  if (/^(foto|imagen|img|pxl|dsc|scan|image|document|screenshot)[\s_-]*[\d_-]*$/i.test(base)) return '';
  if (/^[\d\s_-]+$/.test(base)) return '';
  return base.replace(/[_-]+/g, ' ').trim();
};

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Label>{titulo}</Label>
      {children}
    </View>
  );
}

export default function FormularioExamen() {
  const params = useLocalSearchParams<{ id?: string; pendiente?: string }>();
  const { examenes, miniaturas, subir, actualizar, eliminar } = useExamenes();
  const existente = params.id ? examenes.find((e) => e.id === params.id) : undefined;

  // Archivo nuevo (viene del selector) o archivo ya guardado
  const archivoNuevo = obtenerPendiente(params.pendiente) ?? null;
  const mime = archivoNuevo ? tipoArchivo(archivoNuevo) : (existente?.mime_type ?? null);
  const vistaPrevia = archivoNuevo
    ? archivoNuevo.base64
      ? `data:image/jpeg;base64,${archivoNuevo.base64}`
      : archivoNuevo.uri
    : existente?.archivo_path
      ? miniaturas[existente.archivo_path]
      : undefined;

  const [titulo, setTitulo] = useState(existente?.titulo ?? tituloDesdeNombre(archivoNuevo?.nombre));
  const [categoria, setCategoria] = useState<Examen['categoria']>(
    existente?.categoria ?? (mime === 'application/pdf' ? 'laboratorio' : 'formula')
  );
  const [fecha, setFecha] = useState(existente?.fecha ?? aFechaISO(new Date()));
  const [notas, setNotas] = useState(existente?.notas ?? '');

  const [error, setError] = useState<string | null>(
    archivoNuevo && !mime
      ? 'Formato no permitido. Usa JPG, PNG, WEBP, HEIC o PDF.'
      : archivoNuevo?.tamano && archivoNuevo.tamano > TAMANO_MAXIMO
        ? 'El archivo supera el máximo de 20 MB.'
        : null
  );
  const [guardando, setGuardando] = useState(false);
  const [abriendo, setAbriendo] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);

  if (!archivoNuevo && !existente) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenHeader title="Examen" />
        <Text variant="muted" className="p-6 text-center">
          No encontramos este examen.
        </Text>
      </SafeAreaView>
    );
  }

  const abrirArchivo = async () => {
    if (!existente?.archivo_path) return;
    setAbriendo(true);
    try {
      const urls = await urlsFirmadas([existente.archivo_path], 600);
      const url = urls[existente.archivo_path];
      if (url) await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setAbriendo(false);
    }
  };

  const onGuardar = async () => {
    if (!titulo.trim()) return setError('Escribe un título para el examen.');
    setError(null);
    setGuardando(true);
    const datos = { titulo: titulo.trim(), categoria, fecha, notas: notas.trim() || null };
    try {
      if (existente) await actualizar(existente.id, datos);
      else if (archivoNuevo) {
        await subir(archivoNuevo, datos);
        descartarPendiente(params.pendiente);
      }
      router.back();
    } catch (e) {
      setError(mensajeError(e));
      setGuardando(false);
    }
  };

  const onEliminar = async () => {
    if (!existente) return;
    if (!confirmarBorrar) return setConfirmarBorrar(true);
    setGuardando(true);
    try {
      await eliminar(existente);
      router.back();
    } catch (e) {
      setError(mensajeError(e));
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title={existente ? 'Examen' : 'Subir examen'} />
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView contentContainerClassName="gap-5 px-4 pb-10 pt-2" keyboardShouldPersistTaps="handled">
          {/* Vista previa */}
          <Pressable
            onPress={existente ? abrirArchivo : undefined}
            disabled={!existente || abriendo}
            className="h-64 items-center justify-center overflow-hidden rounded-3xl border border-border bg-muted">
            {vistaPrevia && esImagen(mime) ? (
              <Image source={{ uri: vistaPrevia }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
            ) : (
              <View className="items-center gap-2">
                <Icon as={FileText} size={56} className="text-examenes-foreground" />
                <Text className="font-semibold">{mime === 'application/pdf' ? 'Documento PDF' : 'Archivo'}</Text>
                {archivoNuevo && <Text variant="muted">{archivoNuevo.nombre}</Text>}
              </View>
            )}
            {existente && (
              <View className="absolute bottom-3 right-3 flex-row items-center gap-1 rounded-full bg-card/90 px-3 py-1.5">
                {abriendo ? <ActivityIndicator /> : <Icon as={ExternalLink} size={14} className="text-primary" />}
                <Text className="text-xs font-semibold text-primary">Abrir</Text>
              </View>
            )}
          </Pressable>

          <Seccion titulo="Título *">
            <Input placeholder="Ej. Hemograma completo" value={titulo} onChangeText={setTitulo} className="h-12 rounded-xl" />
          </Seccion>

          <Seccion titulo="Categoría">
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIAS_EXAMEN.map((c) => {
                const activo = categoria === c.valor;
                return (
                  <Pressable
                    key={c.valor}
                    onPress={() => setCategoria(c.valor)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: activo }}
                    className={cn(
                      'flex-row items-center gap-1.5 rounded-full border px-4 py-2',
                      activo ? 'border-primary bg-primary' : 'border-input bg-card'
                    )}>
                    <Icon as={c.icono} size={16} className={activo ? 'text-primary-foreground' : 'text-primary'} />
                    <Text className={cn('text-sm font-medium', activo && 'text-primary-foreground')}>{c.texto}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Seccion>

          <Seccion titulo="Fecha del examen">
            <SelectorFechaHora modo="date" valor={deFechaISO(fecha)} onSeleccion={(d) => setFecha(aFechaISO(d))}>
              {(abrir) => (
                <Button variant="outline" className="h-12 justify-start rounded-xl" onPress={abrir}>
                  <Icon as={CalendarDays} size={16} />
                  <Text>{formatoFechaCorta(fecha)}</Text>
                </Button>
              )}
            </SelectorFechaHora>
          </Seccion>

          <Seccion titulo="Notas">
            <Input
              placeholder="Ej. Resultados normales, revisar con el médico"
              value={notas}
              onChangeText={setNotas}
              multiline
              className="min-h-20 rounded-xl py-3"
              textAlignVertical="top"
            />
          </Seccion>

          {error && <Aviso>{error}</Aviso>}

          <Button
            size="lg"
            className="h-14 rounded-full"
            onPress={onGuardar}
            disabled={guardando || Boolean(archivoNuevo && !mime)}>
            {guardando ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color="white" />
                {!existente && <Text className="text-primary-foreground">Subiendo…</Text>}
              </View>
            ) : (
              <Text className="text-lg">{existente ? 'Guardar cambios' : 'Subir examen'}</Text>
            )}
          </Button>

          {existente && (
            <Button variant={confirmarBorrar ? 'destructive' : 'ghost'} className="rounded-full" onPress={onEliminar} disabled={guardando}>
              <Icon as={Trash2} size={18} className={confirmarBorrar ? 'text-white' : 'text-destructive'} />
              <Text className={confirmarBorrar ? 'text-white' : 'text-destructive'}>
                {confirmarBorrar ? 'Toca de nuevo para eliminar (no se puede deshacer)' : 'Eliminar examen'}
              </Text>
            </Button>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
