import { Aviso } from '@/components/aviso';
import { ScreenHeader } from '@/components/screen-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Dosis } from '@/lib/dosis';
import { DIAS_LARGOS, formatoHora12, formatoHoraDate, mismoDia } from '@/lib/fechas';
import { estadoPermiso, type EstadoPermiso } from '@/lib/notificaciones';
import { cn } from '@/lib/utils';
import { useMedicamentos } from '@/providers/medicamentos-provider';
import { router, useFocusEffect } from 'expo-router';
import { BellOff, BellRing, Check, ChevronRight, Circle, CircleAlert, PartyPopper, Pill, Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ESTADO = {
  tomada: { icon: Check, texto: 'Tomada', clase: 'text-meds-foreground', fondo: 'bg-meds' },
  pendiente: { icon: Circle, texto: 'Pendiente', clase: 'text-muted-foreground', fondo: 'bg-secondary' },
  atrasada: { icon: CircleAlert, texto: 'Atrasada', clase: 'text-alerta-foreground', fondo: 'bg-alerta' },
  omitida: { icon: Circle, texto: 'Omitida', clase: 'text-muted-foreground', fondo: 'bg-muted' },
} as const;

const describirDias = (dias: number[] | null) =>
  !dias || dias.length === 0 || dias.length === 7 ? 'Todos los días' : dias.map((d) => DIAS_LARGOS[d].slice(0, 3)).join(', ');

export default function Medicamentos() {
  const { medicamentos, dosisHoy, proxima, cargando, error, recargar, tomar, deshacer } = useMedicamentos();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [permiso, setPermiso] = useState<EstadoPermiso | null>(null);

  useFocusEffect(
    useCallback(() => {
      estadoPermiso().then(setPermiso);
    }, [])
  );

  const alternar = async (d: Dosis) => {
    setOcupado(d.clave);
    setErrorAccion(null);
    try {
      if (d.estado === 'tomada') await deshacer(d);
      else await tomar(d);
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

  const proximaEsHoy = proxima && mismoDia(proxima.programada, new Date());
  const todoTomado = dosisHoy.length > 0 && dosisHoy.every((d) => d.estado === 'tomada');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Mis Medicamentos" actionIcon={Plus} onAction={() => router.push('/medicamento')} />
      {cargando ? (
        <ActivityIndicator className="mt-10" />
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 p-4 pb-10"
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefrescar} />}>
          {error && <Aviso>{error}</Aviso>}
          {errorAccion && <Aviso>{errorAccion}</Aviso>}

          {permiso === 'denegado' && (
            <Pressable onPress={() => Linking.openSettings()} className="flex-row items-center gap-3 rounded-2xl bg-alerta p-4">
              <Icon as={BellOff} size={22} className="text-alerta-foreground" />
              <Text className="flex-1 text-sm text-alerta-foreground">
                Las notificaciones están desactivadas. Toca aquí para activarlas y recibir tus recordatorios.
              </Text>
            </Pressable>
          )}

          {medicamentos.length === 0 ? (
            <View className="items-center gap-3 rounded-3xl border border-dashed border-ring bg-secondary/50 px-6 py-10">
              <Icon as={Pill} size={44} className="text-primary" />
              <Text className="text-center text-lg font-bold">Aún no tienes medicamentos</Text>
              <Text className="text-center text-muted-foreground">
                Agrégalos y te avisaremos a la hora de cada dosis, incluso con la app cerrada.
              </Text>
              <Button className="mt-2 rounded-full" onPress={() => router.push('/medicamento')}>
                <Icon as={Plus} size={18} />
                <Text>Agregar medicamento</Text>
              </Button>
            </View>
          ) : (
            <>
              {/* Tarjeta principal */}
              {todoTomado ? (
                <View className="flex-row items-center gap-4 rounded-3xl bg-meds p-5">
                  <Icon as={PartyPopper} size={36} className="text-meds-foreground" />
                  <View className="flex-1">
                    <Text className="text-lg font-bold">¡Todo al día!</Text>
                    <Text className="text-muted-foreground">Ya tomaste todas tus dosis de hoy.</Text>
                  </View>
                </View>
              ) : proxima ? (
                <View className="gap-4 rounded-3xl border border-border bg-alerta p-5">
                  <View className="flex-row items-center gap-4">
                    <View className="h-14 w-14 items-center justify-center rounded-full bg-card">
                      <Icon as={BellRing} size={28} className="text-salud-foreground" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold">
                        {proxima.estado === 'atrasada'
                          ? 'Tienes una dosis atrasada'
                          : proximaEsHoy
                            ? `Próxima dosis: ${formatoHoraDate(proxima.programada)}`
                            : 'Próxima dosis'}
                      </Text>
                      <Text className="text-muted-foreground">
                        {proxima.medicamento.nombre} {proxima.medicamento.dosis}
                        {proximaEsHoy ? '' : ` · ${DIAS_LARGOS[proxima.programada.getDay()]} ${formatoHoraDate(proxima.programada)}`}
                      </Text>
                    </View>
                  </View>
                  {proximaEsHoy && (
                    <Button size="lg" className="h-12 rounded-2xl" disabled={ocupado === proxima.clave} onPress={() => alternar(proxima)}>
                      {ocupado === proxima.clave ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <Icon as={Check} size={18} />
                          <Text>Marcar como tomado</Text>
                        </>
                      )}
                    </Button>
                  )}
                </View>
              ) : null}

              {/* Dosis de hoy */}
              <Text className="text-lg font-bold">Hoy</Text>
              {dosisHoy.length === 0 ? (
                <Text variant="muted">No tienes dosis programadas para hoy.</Text>
              ) : (
                dosisHoy.map((d) => {
                  const e = ESTADO[d.estado];
                  return (
                    <Pressable
                      key={d.clave}
                      onPress={() => alternar(d)}
                      disabled={ocupado === d.clave}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: d.estado === 'tomada' }}
                      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3 active:opacity-80">
                      <View className={cn('h-12 w-12 items-center justify-center rounded-xl', e.fondo)}>
                        {ocupado === d.clave ? (
                          <ActivityIndicator />
                        ) : (
                          <Icon as={e.icon} size={24} className={e.clase} />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className={cn('font-semibold', d.estado === 'tomada' && 'text-muted-foreground line-through')}>
                          {d.medicamento.nombre} {d.medicamento.dosis}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                          {formatoHoraDate(d.programada)}
                          {d.medicamento.cantidad ? ` · ${d.medicamento.cantidad}` : ''}
                        </Text>
                      </View>
                      <Badge variant={d.estado === 'atrasada' ? 'destructive' : 'secondary'}>
                        <Text>{e.texto}</Text>
                      </Badge>
                    </Pressable>
                  );
                })
              )}
              {dosisHoy.length > 0 && <Text variant="muted">Toca una dosis para marcarla o desmarcarla.</Text>}

              {/* Tratamientos */}
              <Text className="mt-2 text-lg font-bold">Mis tratamientos</Text>
              {medicamentos.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => router.push({ pathname: '/medicamento', params: { id: m.id } })}
                  className={cn(
                    'flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3 active:opacity-80',
                    !m.activo && 'opacity-60'
                  )}>
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-meds">
                    <Icon as={Pill} size={24} className="text-meds-foreground" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold">
                      {m.nombre} {m.dosis}
                    </Text>
                    <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                      {m.horarios.map(formatoHora12).join(' · ')}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {m.activo ? describirDias(m.dias_semana) : 'Pausado'}
                    </Text>
                  </View>
                  <Icon as={ChevronRight} size={20} className="text-muted-foreground" />
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
