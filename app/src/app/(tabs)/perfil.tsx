import { DoctoraAvatar } from '@/components/doctora-avatar';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { Bell, ChevronRight, CircleHelp, LogOut, type LucideIcon, Moon, UserRound } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Fragment, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const filas = [
    <Fila key="datos" icon={UserRound} label="Mis Datos" onPress={() => {}} />,
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
        </View>
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
