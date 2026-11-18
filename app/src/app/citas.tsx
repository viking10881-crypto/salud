import { AvatarMedico } from '@/components/avatar-medico';
import { Aviso } from '@/components/aviso';
import { CalendarioMes } from '@/components/calendario-mes';
import { ScreenHeader } from '@/components/screen-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Cita } from '@/lib/database.types';
import { aFechaISO, formatoHoraDate } from '@/lib/fechas';
import { tipoMedico } from '@/lib/medico';
import { cn } from '@/lib/utils';
import { tipoCita } from '@/lib/tipos-cita';
import { useCitas } from '@/providers/citas-provider';
import { router } from 'expo-router';
import {
  Bell,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronRight,
  MapPin,
  Plus,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const fechaFmt = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });
const fechaCortaFmt = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const editar = (c: Cita) => router.push({ pathname: '/cita', params: { id: c.id } });

function FilaCita({ cita, onCompletar, ocupado }: { cita: Cita; onCompletar?: () => void; ocupado?: boolean }) {
  const f = new Date(cita.fecha);
  const medico = tipoMedico(cita.doctor);
  return (
    <Pressable
      onPress={() => editar(cita)}
      className={cn('flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3 active:opacity-80', cita.completada && 'opacity-70')}>
      {medico ? (
        <AvatarMedico tipo={medico} size={48} />
      ) : (
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-citas">
          <Icon as={tipoCita(cita.tipo).icono} size={24} className="text-citas-foreground" />
        </View>
      )}
      <View className="flex-1">
        <Text className="font-semibold">{capital(fechaCortaFmt.format(f))}</Text>
        <Text className="text-sm text-muted-foreground">
          {formatoHoraDate(f)} · {cita.especialidad || tipoCita(cita.tipo).texto}
        </Text>
        {cita.doctor ? <Text className="text-xs text-muted-foreground">{cita.doctor}</Text> : null}
      </View>
      {cita.completada ? (
        <Badge variant="secondary">
          <Text>Completada</Text>
        </Badge>
      ) : onCompletar ? (
        <Button size="sm" variant="outline" className="rounded-full" onPress={onCompletar} disabled={ocupado}>
          {ocupado ? <ActivityIndicator /> : <Icon as={Check} size={16} />}
          <Text>Asistí</Text>
        </Button>
      ) : (
        <Icon as={ChevronRight} size={20} className="text-muted-foreground" />
      )}
    </Pressable>
  );
}

export default function Citas() {
  const { citas, proximas, pasadas, proxima, cargando, error, recargar, completar } = useCitas();
  const [hoy] = useState(() => new Date());
  const medicoProxima = tipoMedico(proxima?.doctor);
  const [mes, setMes] = useState(() => new Date());
  const [dia, setDia] = useState<string | null>(null);
  const [verAnteriores, setVerAnteriores] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const marcados = useMemo(() => new Set(citas.map((c) => aFechaISO(new Date(c.fecha)))), [citas]);
  const delDia = dia ? citas.filter((c) => aFechaISO(new Date(c.fecha)) === dia) : [];
  const resto = proximas.filter((c) => c.id !== proxima?.id);
  const pendientesDeMarcar = pasadas.filter((c) => !c.completada);

  const onCompletar = async (c: Cita) => {
    setOcupado(c.id);
    setErrorAccion(null);
    try {
      await completar(c, true);
    } catch {
      setErrorAccion('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setOcupado(null);
    }
  };

  const onRefrescar = async () => {
    setRefrescando(true);
    await recargar().catch(() => {});
    setRefrescando(false);
  };

  const nueva = () => router.push(dia ? { pathname: '/cita', params: { fecha: dia } } : '/cita');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Mis Citas" actionIcon={Plus} onAction={nueva} />
      {cargando ? (
        <ActivityIndicator className="mt-10" />
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 p-4 pb-10"
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefrescar} />}>
          {error && <Aviso>{error}</Aviso>}
          {errorAccion && <Aviso>{errorAccion}</Aviso>}

          <CalendarioMes mes={mes} onCambiarMes={setMes} seleccionado={dia} onSeleccionar={setDia} marcados={marcados} hoy={hoy} />

          {dia ? (
            <>
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold">{capital(fechaFmt.format(new Date(`${dia}T12:00:00`)))}</Text>
                <Button variant="link" size="sm" onPress={() => setDia(null)}>
                  <Text>Ver todas</Text>
                </Button>
              </View>
              {delDia.length === 0 ? (
                <Text variant="muted">No tienes citas este día.</Text>
              ) : (
                delDia.map((c) => <FilaCita key={c.id} cita={c} />)
              )}
              <Button variant="outline" className="rounded-full" onPress={nueva}>
                <Icon as={CalendarPlus} size={18} />
                <Text>Agregar cita este día</Text>
              </Button>
            </>
          ) : citas.length === 0 ? (
            <View className="items-center gap-3 rounded-3xl border border-dashed border-ring bg-secondary/50 px-6 py-10">
              <Icon as={CalendarDays} size={44} className="text-primary" />
              <Text className="text-center text-lg font-bold">Aún no tienes citas</Text>
              <Text className="text-center text-muted-foreground">
                Regístralas y te recordaremos con anticipación para que no se te pase ninguna.
              </Text>
              <Button className="mt-2 rounded-full" onPress={nueva}>
                <Icon as={Plus} size={18} />
                <Text>Agregar cita</Text>
              </Button>
            </View>
          ) : (
            <>
              {proxima && (
                <Pressable onPress={() => editar(proxima)} className="active:opacity-80">
                  <Card className="flex-row gap-4 rounded-3xl bg-secondary p-5">
                    {medicoProxima ? (
                      <AvatarMedico tipo={medicoProxima} size={64} />
                    ) : (
                      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-card">
                        <Icon as={CalendarDays} size={28} className="text-primary" />
                      </View>
                    )}
                    <View className="flex-1 gap-0.5">
                      <Text className="text-sm text-secondary-foreground">Próxima cita</Text>
                      <Text className="font-semibold">{capital(fechaFmt.format(new Date(proxima.fecha)))}</Text>
                      <Text className="text-2xl font-bold">{formatoHoraDate(new Date(proxima.fecha))}</Text>
                      <Text className="font-semibold">{proxima.especialidad}</Text>
                      {proxima.doctor && <Text>{proxima.doctor}</Text>}
                      {proxima.lugar && (
                        <View className="flex-row items-center gap-1">
                          <Icon as={MapPin} size={14} className="text-muted-foreground" />
                          <Text variant="muted">{proxima.lugar}</Text>
                        </View>
                      )}
                      {proxima.recordatorio_minutos ? (
                        <View className="mt-1 flex-row items-center gap-1">
                          <Icon as={Bell} size={14} className="text-primary" />
                          <Text className="text-xs text-primary">Te avisaremos antes</Text>
                        </View>
                      ) : null}
                    </View>
                    <Icon as={ChevronRight} size={22} className="self-center text-primary" />
                  </Card>
                </Pressable>
              )}

              {resto.length > 0 && (
                <>
                  <Text className="text-lg font-bold">Próximas citas</Text>
                  {resto.map((c) => (
                    <FilaCita key={c.id} cita={c} />
                  ))}
                </>
              )}

              {pendientesDeMarcar.length > 0 && (
                <>
                  <Text className="text-lg font-bold">¿Asististe?</Text>
                  {pendientesDeMarcar.slice(0, 5).map((c) => (
                    <FilaCita key={c.id} cita={c} onCompletar={() => onCompletar(c)} ocupado={ocupado === c.id} />
                  ))}
                </>
              )}

              {pasadas.some((c) => c.completada) && (
                <>
                  <Button variant="ghost" onPress={() => setVerAnteriores((v) => !v)}>
                    <Text>{verAnteriores ? 'Ocultar citas anteriores' : 'Ver citas anteriores'}</Text>
                  </Button>
                  {verAnteriores &&
                    pasadas.filter((c) => c.completada).map((c) => <FilaCita key={c.id} cita={c} />)}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
