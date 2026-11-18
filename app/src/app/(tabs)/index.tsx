import { CentroNotificaciones } from '@/components/centro-notificaciones';
import { AvatarMedico } from '@/components/avatar-medico';
import { DoctoraAvatar } from '@/components/doctora-avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { armarAvisos, contarAvisos } from '@/lib/centro-notificaciones';
import { DIAS_LARGOS, formatoHoraDate, mismoDia } from '@/lib/fechas';
import { tipoMedico } from '@/lib/medico';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useCitas } from '@/providers/citas-provider';
import { useMedicamentos } from '@/providers/medicamentos-provider';
import { BlurTargetView } from 'expo-blur';
import { type Href, router } from 'expo-router';
import {
  Bell,
  CalendarDays,
  ChartColumn,
  ChevronRight,
  FileText,
  type LucideIcon,
  Pill,
} from 'lucide-react-native';
import { type ComponentRef, useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const fechaCortaFmt = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' });
const fechaCitaFmt = (iso: string) => {
  const s = fechaCortaFmt.format(new Date(iso)).replace(/\./g, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const MODULOS: { titulo: string; icon: LucideIcon; href: Href; bg: string; fg: string }[] = [
  { titulo: 'Mis Citas', icon: CalendarDays, href: '/citas', bg: 'bg-citas', fg: 'text-citas-foreground' },
  { titulo: 'Medicamentos', icon: Pill, href: '/medicamentos', bg: 'bg-meds', fg: 'text-meds-foreground' },
  { titulo: 'Mis Exámenes', icon: FileText, href: '/examenes', bg: 'bg-examenes', fg: 'text-examenes-foreground' },
  { titulo: 'Mi Salud', icon: ChartColumn, href: '/(tabs)/mi-salud', bg: 'bg-salud', fg: 'text-salud-foreground' },
];

export default function Inicio() {
  const { perfil } = useAuth();
  const nombre = perfil?.nombre || 'bienvenido';
  const { proxima: proximaCita, proximas } = useCitas();
  const medicoCita = tipoMedico(proximaCita?.doctor);
  const { proxima, dosisHoy } = useMedicamentos();

  // Centro de notificaciones: "ahora" se toma al abrirlo (no durante el render)
  const [centroAbierto, setCentroAbierto] = useState(false);
  const [ahoraCentro, setAhoraCentro] = useState(() => new Date());
  const grupos = useMemo(() => armarAvisos(dosisHoy, proximas, ahoraCentro), [dosisHoy, proximas, ahoraCentro]);
  const totalAvisos = contarAvisos(grupos);
  const alternarCentro = () => {
    if (!centroAbierto) setAhoraCentro(new Date());
    setCentroAbierto(!centroAbierto);
  };
  const cerrarCentro = useCallback(() => setCentroAbierto(false), []);
  /** Contenido de Inicio que el panel desenfoca por detrás */
  const fondoRef = useRef<ComponentRef<typeof View>>(null);
  const cuandoDosis = proxima
    ? mismoDia(proxima.programada, new Date())
      ? formatoHoraDate(proxima.programada)
      : `${DIAS_LARGOS[proxima.programada.getDay()]}, ${formatoHoraDate(proxima.programada)}`
    : null;
  const pendientesHoy = dosisHoy.filter((d) => d.estado === 'pendiente' || d.estado === 'atrasada').length;
  const mensajeDoctora = proxima
    ? proxima.estado === 'atrasada'
      ? `Tienes pendiente tu ${proxima.medicamento.nombre}. ¡Tómalo cuando puedas!`
      : `Recuerda tomar tu ${proxima.medicamento.nombre} ${proxima.medicamento.dosis} (${cuandoDosis}). ¡Tú puedes!`
    : dosisHoy.length > 0 && pendientesHoy === 0
      ? '¡Excelente! Ya tomaste todas tus dosis de hoy.'
      : 'Agrega tus medicamentos y yo te recordaré cada dosis.';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* Encabezado fijo: la campana queda por encima del centro de notificaciones */}
      <View className="z-10 flex-row items-center justify-between bg-background px-4 pb-3 pt-2">
        <View className="flex-1 gap-1">
          <Text className="text-3xl font-bold">Hola, {nombre}</Text>
          <Text className="text-muted-foreground">Cuida tu salud, siempre</Text>
        </View>
        <Button
          variant={centroAbierto ? 'default' : 'secondary'}
          size="icon"
          className="rounded-full"
          onPress={alternarCentro}
          accessibilityLabel={
            centroAbierto
              ? 'Cerrar notificaciones'
              : totalAvisos
                ? `Notificaciones, ${totalAvisos} pendientes`
                : 'Notificaciones'
          }>
          <Icon as={Bell} size={20} className={centroAbierto ? 'text-primary-foreground' : 'text-primary'} />
          {totalAvisos > 0 && !centroAbierto && (
            <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-heart px-1">
              <Text className="text-[10px] font-bold leading-3 text-white">
                {totalAvisos > 9 ? '9+' : totalAvisos}
              </Text>
            </View>
          )}
        </Button>
      </View>

      <View className="flex-1">
        <BlurTargetView ref={fondoRef} style={{ flex: 1 }}>
          <ScrollView contentContainerClassName="gap-4 px-4 pb-8 pt-1">
            <View className="flex-row items-center gap-4 rounded-3xl bg-secondary p-4">
              <DoctoraAvatar size={92} />
              <View className="flex-1">
                <Text className="font-semibold text-secondary-foreground">Dra. Salud</Text>
                <Text className="text-sm text-secondary-foreground">
                  {mensajeDoctora}
                </Text>
              </View>
            </View>

            {/* Próxima cita */}
            <Pressable onPress={() => router.push('/citas')} className="active:opacity-80">
              <Card className="flex-row items-center gap-4 rounded-3xl p-4">
                {medicoCita ? (
                  <AvatarMedico tipo={medicoCita} size={56} />
                ) : (
                  <View className="h-14 w-14 items-center justify-center rounded-2xl bg-citas">
                    <Icon as={CalendarDays} size={28} className="text-citas-foreground" />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-sm text-muted-foreground">Próxima cita médica</Text>
                  {proximaCita ? (
                    <>
                      <Text className="text-lg font-bold">{fechaCitaFmt(proximaCita.fecha)}</Text>
                      <Text>
                        {formatoHoraDate(new Date(proximaCita.fecha))} · {proximaCita.especialidad}
                      </Text>
                    </>
                  ) : (
                    <Text className="text-lg font-bold">Agrega tus citas</Text>
                  )}
                </View>
                <Icon as={ChevronRight} size={22} className="text-muted-foreground" />
              </Card>
            </Pressable>

            {/* Próximo medicamento */}
            <Pressable onPress={() => router.push('/medicamentos')} className="active:opacity-80">
              <View className="flex-row items-center gap-4 rounded-3xl border border-border bg-alerta p-4">
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-card">
                  <Icon as={Pill} size={28} className="text-heart" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-alerta-foreground">
                    {proxima?.estado === 'atrasada' ? 'Dosis atrasada' : 'Próximo medicamento'}
                  </Text>
                  {proxima ? (
                    <>
                      <Text className="text-lg font-bold">
                        {proxima.medicamento.nombre} {proxima.medicamento.dosis}
                      </Text>
                      <Text>{cuandoDosis}</Text>
                    </>
                  ) : (
                    <Text className="text-lg font-bold">Agrega tus medicamentos</Text>
                  )}
                </View>
                <Icon as={ChevronRight} size={22} className="text-muted-foreground" />
              </View>
            </Pressable>

            {/* Módulos */}
            <View className="flex-row flex-wrap justify-between gap-y-4">
              {MODULOS.map((m) => (
                <Pressable
                  key={m.titulo}
                  onPress={() => router.push(m.href)}
                  className={cn('h-28 w-[48%] items-center justify-center gap-2 rounded-3xl active:opacity-80', m.bg)}>
                  <Icon as={m.icon} size={32} className={m.fg} />
                  <Text className="font-semibold">{m.titulo}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </BlurTargetView>
        <CentroNotificaciones abierto={centroAbierto} onCerrar={cerrarCentro} grupos={grupos} fondo={fondoRef} />
      </View>
    </SafeAreaView>
  );
}
