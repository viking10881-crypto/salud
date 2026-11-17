import { DoctoraAvatar } from '@/components/doctora-avatar';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { edadDesde } from '@/lib/fechas';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Droplet,
  LogOut,
  type LucideIcon,
  Moon,
  Phone,
  TriangleAlert,
  UserRound,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Fragment, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function Dato({ icon, texto }: { icon: LucideIcon; texto: string }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
      <Icon as={icon} size={14} className="text-primary" />
      <Text className="text-sm font-medium text-secondary-foreground">{texto}</Text>
    </View>
  );
}

function Fila({
  icon,
  label,
  right,
  onPress,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} className="flex-row items-center gap-3 px-4 py-3 active:bg-accent">
      <Icon as={icon} size={20} className={danger ? 'text-destructive' : 'text-foreground'} />
      <Text className={cn('flex-1', danger && 'text-destructive')}>{label}</Text>
      {right ?? <Icon as={ChevronRight} size={18} className="text-muted-foreground" />}
    </Pressable>
  );
}

export default function Perfil() {
  const { session, perfil, cerrarSesion } = useAuth();
  const { colorScheme, setColorScheme } = useColorScheme();
  const nombreCompleto = [perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ') || 'Mi cuenta';
  const [notificaciones, setNotificaciones] = useState(true);
  const oscuro = colorScheme === 'dark';
  const [hoy] = useState(() => new Date());
  const edad = perfil?.fecha_nacimiento ? edadDesde(perfil.fecha_nacimiento, hoy) : null;
  const sinDatos = perfil && !perfil.fecha_nacimiento && !perfil.tipo_sangre && !perfil.telefono && !perfil.alergias;

  const filas = [
    <Fila key="datos" icon={UserRound} label="Mis Datos" onPress={() => router.push('/mis-datos')} />,
    <Fila
      key="notif"
      icon={Bell}
      label="Notificaciones"
      right={<Switch checked={notificaciones} onCheckedChange={setNotificaciones} />}
    />,
    <Fila
      key="tema"
      icon={Moon}
      label="Tema oscuro"
      right={<Switch checked={oscuro} onCheckedChange={(v) => setColorScheme(v ? 'dark' : 'light')} />}
    />,
    <Fila key="ayuda" icon={CircleHelp} label="Ayuda y Soporte" onPress={() => {}} />,
    <Fila key="salir" icon={LogOut} label="Cerrar Sesión" danger onPress={cerrarSesion} />,
  ];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-6 p-4">
        <Text variant="h3" className="text-center">Mi Perfil</Text>
        <View className="items-center gap-2">
          <DoctoraAvatar size={130} />
          <Text className="text-xl font-bold">{nombreCompleto}</Text>
          <Text variant="muted">{session?.user.email}</Text>
          {(edad !== null || perfil?.tipo_sangre || perfil?.telefono) && (
            <View className="mt-1 flex-row flex-wrap justify-center gap-2">
              {edad !== null && <Dato icon={UserRound} texto={`${edad} años`} />}
              {perfil?.tipo_sangre && <Dato icon={Droplet} texto={perfil.tipo_sangre} />}
              {perfil?.telefono && <Dato icon={Phone} texto={perfil.telefono} />}
            </View>
          )}
        </View>

        {perfil?.alergias && (
          <View className="flex-row gap-3 rounded-3xl border border-border bg-alerta p-4">
            <Icon as={TriangleAlert} size={20} className="text-heart" />
            <View className="flex-1">
              <Text className="font-semibold text-alerta-foreground">Alergias</Text>
              <Text>{perfil.alergias}</Text>
            </View>
          </View>
        )}

        {sinDatos && (
          <Pressable
            onPress={() => router.push('/mis-datos')}
            className="rounded-3xl border border-dashed border-primary bg-secondary p-4 active:opacity-80">
            <Text className="font-semibold text-secondary-foreground">Completa tus datos</Text>
            <Text className="text-sm text-secondary-foreground">
              Agrega tu fecha de nacimiento, tipo de sangre y alergias para tenerlos a mano.
            </Text>
          </Pressable>
        )}
        <Card className="gap-0 overflow-hidden rounded-3xl py-0">
          {filas.map((f, i) => (
            <Fragment key={i}>
              {i > 0 && <Separator />}
              {f}
            </Fragment>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
