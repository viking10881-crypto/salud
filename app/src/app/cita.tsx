import { AvatarMedico } from '@/components/avatar-medico';
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
import type { Cita } from '@/lib/database.types';
import { formatoHoraDate } from '@/lib/fechas';
import { conPrefijo, tipoMedico } from '@/lib/medico';
import { asegurarPermiso, describirAntelacion } from '@/lib/notificaciones';
import { cn } from '@/lib/utils';
import { TIPOS_CITA } from '@/lib/tipos-cita';
import { useCitas } from '@/providers/citas-provider';
import { router, useLocalSearchParams } from 'expo-router';
import { Bell, CalendarDays, Clock, type LucideIcon, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ANTELACIONES: (number | null)[] = [null, 30, 60, 120, 1440];

const fechaLargaFmt = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

function Chip({
  activo,
  texto,
  icono,
  onPress,
}: {
  activo: boolean;
  texto: string;
  icono?: LucideIcon;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: activo }}
      className={cn(
        'flex-row items-center gap-1.5 rounded-full border px-4 py-2',
        activo ? 'border-primary bg-primary' : 'border-input bg-card'
      )}>
      {icono && <Icon as={icono} size={16} className={activo ? 'text-primary-foreground' : 'text-primary'} />}
      <Text className={cn('text-sm font-medium', activo ? 'text-primary-foreground' : 'text-foreground')}>{texto}</Text>
    </Pressable>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Label>{titulo}</Label>
      {children}
    </View>
  );
}

/** Mañana a las 9:00 */
function fechaPorDefecto() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 9, 0);
}

export default function FormularioCita() {
  const { id, fecha: fechaParam } = useLocalSearchParams<{ id?: string; fecha?: string }>();
  const { citas, guardar, eliminar, recargar } = useCitas();
  const existente = id ? citas.find((c) => c.id === id) : undefined;

  const inicial = existente
    ? new Date(existente.fecha)
    : fechaParam
      ? (() => {
          const [y, m, d] = fechaParam.split('-').map(Number);
          return new Date(y, m - 1, d, 9, 0);
        })()
      : fechaPorDefecto();

  const [fecha, setFecha] = useState(inicial);
  const [especialidad, setEspecialidad] = useState(existente?.especialidad ?? '');
  const [tipo, setTipo] = useState<Cita['tipo']>(existente?.tipo ?? 'general');
  const [doctor, setDoctor] = useState(existente?.doctor ?? '');
  const tipoDoc = tipoMedico(doctor);
  const [lugar, setLugar] = useState(existente?.lugar ?? '');
  const [notas, setNotas] = useState(existente?.notas ?? '');
  const [antelacion, setAntelacion] = useState<number | null>(existente ? existente.recordatorio_minutos : 60);
  const [completada, setCompletada] = useState(existente?.completada ?? false);

  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);

  const cambiarDia = (d: Date) =>
    setFecha(new Date(d.getFullYear(), d.getMonth(), d.getDate(), fecha.getHours(), fecha.getMinutes()));
  const cambiarHora = (h: Date) =>
    setFecha(new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), h.getHours(), h.getMinutes()));

  const onGuardar = async () => {
    if (!especialidad.trim()) return setError('Escribe la especialidad o el motivo de la cita.');
    setError(null);
    setGuardando(true);
    try {
      await guardar(
        {
          fecha: fecha.toISOString(),
          especialidad: especialidad.trim(),
          tipo,
          doctor: doctor.trim() || null,
          lugar: lugar.trim() || null,
          notas: notas.trim() || null,
          recordatorio_minutos: antelacion,
          completada,
        },
        existente?.id
      );
    } catch (e) {
      setError(mensajeError(e));
      setGuardando(false);
      return;
    }

    if (antelacion === null || completada) return router.back();
    const permiso = await asegurarPermiso();
    if (permiso) {
      await recargar().catch(() => {});
      router.back();
      return;
    }
    setGuardando(false);
    setAviso(
      Platform.OS === 'web'
        ? 'Guardada. Los recordatorios funcionan en la app del celular.'
        : 'Guardada. Activa las notificaciones de Salud+ en los ajustes del teléfono para recibir el recordatorio.'
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title={existente ? 'Editar cita' : 'Nueva cita'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-5 px-4 pb-10 pt-2" keyboardShouldPersistTaps="handled">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Seccion titulo="Fecha *">
                <SelectorFechaHora modo="date" valor={fecha} onSeleccion={cambiarDia}>
                  {(abrir) => (
                    <Button variant="outline" className="h-12 justify-start rounded-xl" onPress={abrir}>
                      <Icon as={CalendarDays} size={16} />
                      <Text>{fechaLargaFmt.format(fecha)}</Text>
                    </Button>
                  )}
                </SelectorFechaHora>
              </Seccion>
            </View>
            <View className="w-36">
              <Seccion titulo="Hora *">
                <SelectorFechaHora modo="time" valor={fecha} onSeleccion={cambiarHora}>
                  {(abrir) => (
                    <Button variant="outline" className="h-12 justify-start rounded-xl" onPress={abrir}>
                      <Icon as={Clock} size={16} />
                      <Text>{formatoHoraDate(fecha)}</Text>
                    </Button>
                  )}
                </SelectorFechaHora>
              </Seccion>
            </View>
          </View>

          <Seccion titulo="Especialidad o motivo *">
            <Input placeholder="Ej. Cardiología, control de tensión" value={especialidad} onChangeText={setEspecialidad} className="h-12 rounded-xl" />
          </Seccion>

          <Seccion titulo="Tipo">
            <View className="flex-row flex-wrap gap-2">
              {TIPOS_CITA.map((t) => (
                <Chip key={t.valor} activo={tipo === t.valor} texto={t.texto} icono={t.icono} onPress={() => setTipo(t.valor)} />
              ))}
            </View>
          </Seccion>

          <Seccion titulo="Doctor(a)">
            <View className="flex-row items-center gap-3">
              {tipoDoc && <AvatarMedico tipo={tipoDoc} size={48} />}
              <Input
                placeholder="Ej. Dra. García"
                value={doctor}
                onChangeText={setDoctor}
                autoCapitalize="words"
                className="h-12 flex-1 rounded-xl"
              />
            </View>
            <View className="flex-row gap-2">
              {(['doctor', 'doctora'] as const).map((t) => (
                <Chip
                  key={t}
                  activo={tipoDoc === t}
                  texto={t === 'doctor' ? 'Doctor' : 'Doctora'}
                  onPress={() => setDoctor(conPrefijo(doctor, t))}
                />
              ))}
            </View>
          </Seccion>

          <Seccion titulo="Lugar">
            <Input placeholder="Ej. Clínica Salud Vida, consultorio 204" value={lugar} onChangeText={setLugar} className="h-12 rounded-xl" />
          </Seccion>

          <Seccion titulo="Recordarme">
            <View className="flex-row flex-wrap gap-2">
              {ANTELACIONES.map((a) => (
                <Chip
                  key={String(a)}
                  activo={antelacion === a}
                  texto={a === null ? 'Sin aviso' : `${describirAntelacion(a)} antes`}
                  onPress={() => setAntelacion(a)}
                />
              ))}
            </View>
          </Seccion>

          <Seccion titulo="Notas">
            <Input
              placeholder="Ej. Llevar exámenes de sangre, ir en ayunas"
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
                <Text className="font-semibold">Cita completada</Text>
                <Text variant="muted">Pasa al historial y no se envían más recordatorios.</Text>
              </View>
              <Switch checked={completada} onCheckedChange={setCompletada} />
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
              {guardando ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  {antelacion !== null && !completada && <Icon as={Bell} size={18} />}
                  <Text className="text-lg">Guardar</Text>
                </>
              )}
            </Button>
          )}

          {existente && !aviso && (
            <Button variant={confirmarBorrar ? 'destructive' : 'ghost'} className="rounded-full" onPress={onEliminar} disabled={guardando}>
              <Icon as={Trash2} size={18} className={confirmarBorrar ? 'text-white' : 'text-destructive'} />
              <Text className={confirmarBorrar ? 'text-white' : 'text-destructive'}>
                {confirmarBorrar ? 'Toca de nuevo para eliminar' : 'Eliminar cita'}
              </Text>
            </Button>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
