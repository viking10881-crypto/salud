import { Aviso } from '@/components/aviso';
import { ScreenHeader } from '@/components/screen-header';
import { SelectorFechaHora } from '@/components/selector-fecha-hora';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { mensajeError } from '@/lib/auth-errors';
import {
  aFechaISO,
  aHora,
  DIAS_CORTOS,
  DIAS_LARGOS,
  deFechaISO,
  formatoFechaCorta,
  formatoHora12,
  horaEnFecha,
} from '@/lib/fechas';
import { asegurarPermiso } from '@/lib/notificaciones';
import { cn } from '@/lib/utils';
import { useMedicamentos } from '@/providers/medicamentos-provider';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Clock, Plus, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TODOS_LOS_DIAS = [0, 1, 2, 3, 4, 5, 6];

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Label>{titulo}</Label>
      {children}
    </View>
  );
}

export default function FormularioMedicamento() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { medicamentos, guardar, eliminar, recargar } = useMedicamentos();
  const existente = id ? medicamentos.find((m) => m.id === id) : undefined;

  const [nombre, setNombre] = useState(existente?.nombre ?? '');
  const [dosis, setDosis] = useState(existente?.dosis ?? '');
  const [cantidad, setCantidad] = useState(existente?.cantidad ?? '');
  const [horarios, setHorarios] = useState<string[]>(existente?.horarios.map((h) => h.slice(0, 5)) ?? ['08:00']);
  const [dias, setDias] = useState<number[]>(existente?.dias_semana?.length ? existente.dias_semana : TODOS_LOS_DIAS);
  const [inicio, setInicio] = useState(existente?.fecha_inicio ?? aFechaISO(new Date()));
  const [fin, setFin] = useState<string | null>(existente?.fecha_fin ?? null);
  const [notas, setNotas] = useState(existente?.notas ?? '');
  const [activo, setActivo] = useState(existente?.activo ?? true);

  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);

  const agregarHora = (fecha: Date) => {
    const h = aHora(fecha);
    setHorarios((prev) => (prev.includes(h) ? prev : [...prev, h].sort()));
  };
  const quitarHora = (h: string) => setHorarios((prev) => prev.filter((x) => x !== h));
  const alternarDia = (d: number) =>
    setDias((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  const validar = () => {
    if (!nombre.trim()) return 'Escribe el nombre del medicamento.';
    if (!dosis.trim()) return 'Escribe la dosis (por ejemplo: 500 mg).';
    if (horarios.length === 0) return 'Agrega al menos un horario.';
    if (dias.length === 0) return 'Elige al menos un día de la semana.';
    if (fin && fin < inicio) return 'La fecha de fin no puede ser anterior a la de inicio.';
    return null;
  };

  const onGuardar = async () => {
    const problema = validar();
    if (problema) return setError(problema);
    setError(null);
    setGuardando(true);
    try {
      // 1) Guardar primero: un fallo de notificaciones nunca debe impedirlo
      await guardar(
        {
          nombre: nombre.trim(),
          dosis: dosis.trim(),
          cantidad: cantidad.trim() || null,
          horarios,
          dias_semana: dias.length === 7 ? null : dias,
          fecha_inicio: inicio,
          fecha_fin: fin,
          notas: notas.trim() || null,
          activo,
        },
        existente?.id
      );
    } catch (e) {
      setError(mensajeError(e));
      setGuardando(false);
      return;
    }

    // 2) Permiso y programación de recordatorios (no bloquea)
    const permiso = await asegurarPermiso();
    if (permiso) {
      await recargar().catch(() => {});
      router.back();
      return;
    }
    setGuardando(false);
    setAviso(
      Platform.OS === 'web'
        ? 'Guardado. Los recordatorios funcionan en la app del celular.'
        : 'Guardado. Activa las notificaciones de Salud+ en los ajustes del teléfono para recibir los recordatorios.'
    );
  };

  const onEliminar = async () => {
    if (!existente) return;
    if (!confirmarBorrar) return setConfirmarBorrar(true);
    setGuardando(true);
    try {
      await eliminar(existente.id);
      router.back();
    } catch (e) {
      setError(mensajeError(e));
      setGuardando(false);
    }
  };

  const resumenDias =
    dias.length === 7 ? 'Todos los días' : dias.map((d) => DIAS_LARGOS[d]).join(', ');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title={existente ? 'Editar medicamento' : 'Nuevo medicamento'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-5 px-4 pb-10 pt-2" keyboardShouldPersistTaps="handled">
          <Seccion titulo="Nombre del medicamento *">
            <Input placeholder="Ej. Metformina" value={nombre} onChangeText={setNombre} className="h-12 rounded-xl" />
          </Seccion>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Seccion titulo="Dosis *">
                <Input placeholder="Ej. 500 mg" value={dosis} onChangeText={setDosis} className="h-12 rounded-xl" />
              </Seccion>
            </View>
            <View className="flex-1">
              <Seccion titulo="Cantidad">
                <Input placeholder="Ej. 1 tableta" value={cantidad} onChangeText={setCantidad} className="h-12 rounded-xl" />
              </Seccion>
            </View>
          </View>

          <Seccion titulo="Horarios *">
            <View className="flex-row flex-wrap gap-2">
              {horarios.map((h) => (
                <View key={h} className="flex-row items-center gap-1 rounded-full bg-secondary py-2 pl-3 pr-2">
                  <Icon as={Clock} size={16} className="text-secondary-foreground" />
                  <Text className="font-semibold text-secondary-foreground">{formatoHora12(h)}</Text>
                  <Pressable onPress={() => quitarHora(h)} hitSlop={8} accessibilityLabel={`Quitar ${formatoHora12(h)}`}>
                    <Icon as={X} size={16} className="text-muted-foreground" />
                  </Pressable>
                </View>
              ))}
              <SelectorFechaHora modo="time" valor={horaEnFecha('08:00')} onSeleccion={agregarHora} titulo="Agregar horario">
                {(abrir) => (
                  <Button variant="outline" className="rounded-full" onPress={abrir}>
                    <Icon as={Plus} size={16} />
                    <Text>Agregar hora</Text>
                  </Button>
                )}
              </SelectorFechaHora>
            </View>
          </Seccion>

          <Seccion titulo="Días de la semana">
            <View className="flex-row justify-between">
              {DIAS_CORTOS.map((letra, d) => {
                const sel = dias.includes(d);
                return (
                  <Pressable
                    key={d}
                    onPress={() => alternarDia(d)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: sel }}
                    accessibilityLabel={DIAS_LARGOS[d]}
                    className={cn(
                      'h-11 w-11 items-center justify-center rounded-full border',
                      sel ? 'border-primary bg-primary' : 'border-input bg-card'
                    )}>
                    <Text className={cn('font-semibold', sel ? 'text-primary-foreground' : 'text-muted-foreground')}>
                      {letra}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text variant="muted">{resumenDias}</Text>
          </Seccion>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Seccion titulo="Inicio">
                <SelectorFechaHora modo="date" valor={deFechaISO(inicio)} onSeleccion={(d) => setInicio(aFechaISO(d))}>
                  {(abrir) => (
                    <Button variant="outline" className="h-12 justify-start rounded-xl" onPress={abrir}>
                      <Icon as={CalendarDays} size={16} />
                      <Text>{formatoFechaCorta(inicio)}</Text>
                    </Button>
                  )}
                </SelectorFechaHora>
              </Seccion>
            </View>
            <View className="flex-1">
              <Seccion titulo="Fin (opcional)">
                <SelectorFechaHora
                  modo="date"
                  valor={deFechaISO(fin ?? inicio)}
                  minimo={deFechaISO(inicio)}
                  onSeleccion={(d) => setFin(aFechaISO(d))}>
                  {(abrir) => (
                    <View className="flex-row items-center gap-1">
                      <Button variant="outline" className="h-12 flex-1 justify-start rounded-xl" onPress={abrir}>
                        <Icon as={CalendarDays} size={16} />
                        <Text>{fin ? formatoFechaCorta(fin) : 'Sin fin'}</Text>
                      </Button>
                      {fin && (
                        <Pressable onPress={() => setFin(null)} hitSlop={8} accessibilityLabel="Quitar fecha de fin">
                          <Icon as={X} size={18} className="text-muted-foreground" />
                        </Pressable>
                      )}
                    </View>
                  )}
                </SelectorFechaHora>
              </Seccion>
            </View>
          </View>

          <Seccion titulo="Notas">
            <Input
              placeholder="Ej. Tomar después de comer"
              value={notas}
              onChangeText={setNotas}
              multiline
              className="min-h-20 rounded-xl py-3"
              textAlignVertical="top"
            />
          </Seccion>

          {existente && (
            <View className="flex-row items-center justify-between rounded-2xl border border-border bg-card p-4">
              <View className="flex-1">
                <Text className="font-semibold">Tratamiento activo</Text>
                <Text variant="muted">Si lo desactivas, dejarás de recibir recordatorios.</Text>
              </View>
              <Switch checked={activo} onCheckedChange={setActivo} />
            </View>
          )}

          {error && <Aviso>{error}</Aviso>}
          {aviso && <Aviso tipo="exito">{aviso}</Aviso>}

          {aviso ? (
            <Button size="lg" className="h-14 rounded-full" onPress={() => router.back()}>
              <Text className="text-lg">Entendido</Text>
            </Button>
          ) : (
            <Button size="lg" className="h-14 rounded-full" onPress={onGuardar} disabled={guardando}>
              {guardando ? <ActivityIndicator color="white" /> : <Text className="text-lg">Guardar</Text>}
            </Button>
          )}

          {existente && !aviso && (
            <Button variant={confirmarBorrar ? 'destructive' : 'ghost'} className="rounded-full" onPress={onEliminar} disabled={guardando}>
              <Icon as={Trash2} size={18} className={confirmarBorrar ? 'text-white' : 'text-destructive'} />
              <Text className={confirmarBorrar ? 'text-white' : 'text-destructive'}>
                {confirmarBorrar ? 'Toca de nuevo para eliminar (también borra su historial)' : 'Eliminar medicamento'}
              </Text>
            </Button>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
