import { ListRow } from '@/components/list-row';
import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { type Cita, citas, formatoFecha, formatoHora } from '@/data/mock';
import { CalendarDays, ChevronRight, HeartPulse, Plus, Smile, Stethoscope } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ICONO: Record<Cita['tipo'], typeof Smile> = {
  odontologia: Smile,
  general: Stethoscope,
  especialista: HeartPulse,
};

export default function Citas() {
  const [proxima, ...resto] = citas;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Mis Citas" actionIcon={Plus} />
      <ScrollView contentContainerClassName="gap-4 p-4">
        <Card className="flex-row gap-4 rounded-3xl bg-secondary p-5">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-card">
            <Icon as={CalendarDays} size={28} className="text-primary" />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-sm text-secondary-foreground">Próxima cita</Text>
            <Text className="font-semibold">{formatoFecha(proxima.fecha)}</Text>
            <Text className="text-2xl font-bold">{formatoHora(proxima.fecha)}</Text>
            {proxima.doctor && <Text className="font-semibold">{proxima.doctor}</Text>}
            {proxima.lugar && <Text variant="muted">{proxima.lugar}</Text>}
          </View>
          <Icon as={ChevronRight} size={22} className="self-center text-primary" />
        </Card>

        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold">Próximas citas</Text>
          <Button variant="link" size="sm"><Text>Ver todas</Text></Button>
        </View>

        {resto.map((c) => (
          <ListRow
            key={c.id}
            icon={ICONO[c.tipo]}
            iconBgClassName="bg-citas"
            iconClassName="text-citas-foreground"
            title={formatoFecha(c.fecha)}
            subtitle={formatoHora(c.fecha)}
            meta={c.especialidad}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
