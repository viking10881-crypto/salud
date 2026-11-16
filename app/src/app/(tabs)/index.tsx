import { DoctoraAvatar } from '@/components/doctora-avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { citas, dosis, formatoFecha, formatoHora, usuario } from '@/data/mock';
import { cn } from '@/lib/utils';
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
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MODULOS: { titulo: string; icon: LucideIcon; href: Href; bg: string; fg: string }[] = [
  { titulo: 'Mis Citas', icon: CalendarDays, href: '/citas', bg: 'bg-citas', fg: 'text-citas-foreground' },
  { titulo: 'Medicamentos', icon: Pill, href: '/medicamentos', bg: 'bg-meds', fg: 'text-meds-foreground' },
  { titulo: 'Mis Exámenes', icon: FileText, href: '/examenes', bg: 'bg-examenes', fg: 'text-examenes-foreground' },
  { titulo: 'Mi Salud', icon: ChartColumn, href: '/(tabs)/mi-salud', bg: 'bg-salud', fg: 'text-salud-foreground' },
];

export default function Inicio() {
  const proximaCita = citas[0];
  const proximaDosis = dosis[0];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 px-4 pb-8">
        {/* Encabezado con la doctora virtual */}
        <View className="flex-row items-center justify-between pt-2">
          <View className="flex-1 gap-1">
            <Text className="text-3xl font-bold">Hola, {usuario.nombre}</Text>
            <Text className="text-muted-foreground">Cuida tu salud, siempre</Text>
          </View>
          <Button variant="secondary" size="icon" className="rounded-full" accessibilityLabel="Notificaciones">
            <Icon as={Bell} size={20} className="text-primary" />
            <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-heart" />
          </Button>
        </View>

        <View className="flex-row items-center gap-4 rounded-3xl bg-secondary p-4">
          <DoctoraAvatar size={92} />
          <View className="flex-1">
            <Text className="font-semibold text-secondary-foreground">Dra. Salud</Text>
            <Text className="text-sm text-secondary-foreground">
              Recuerda tomar tu {proximaDosis.medicamento} a las {proximaDosis.hora}. ¡Tú puedes!
            </Text>
          </View>
        </View>

        {/* Próxima cita */}
        <Pressable onPress={() => router.push('/citas')} className="active:opacity-80">
          <Card className="flex-row items-center gap-4 rounded-3xl p-4">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-citas">
              <Icon as={CalendarDays} size={28} className="text-citas-foreground" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">Próxima cita médica</Text>
              <Text className="text-lg font-bold">{formatoFecha(proximaCita.fecha)}</Text>
              <Text>{formatoHora(proximaCita.fecha)}</Text>
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
              <Text className="text-sm font-semibold text-alerta-foreground">Próximo medicamento</Text>
              <Text className="text-lg font-bold">{proximaDosis.medicamento}</Text>
              <Text>{proximaDosis.hora}</Text>
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
    </SafeAreaView>
  );
}
