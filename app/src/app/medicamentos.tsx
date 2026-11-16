import { ListRow } from '@/components/list-row';
import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { dosis } from '@/data/mock';
import { BellRing, Check, Clock, Pill, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Medicamentos() {
  const [tomado, setTomado] = useState(false);
  const actual = dosis[0];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Mis Medicamentos" actionIcon={Plus} />
      <ScrollView contentContainerClassName="gap-4 p-4">
        <View className="gap-4 rounded-3xl border border-border bg-alerta p-5">
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-card">
              <Icon as={BellRing} size={28} className="text-salud-foreground" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold">
                {tomado ? '¡Muy bien! Dosis registrada' : 'Es hora de tomar tu medicamento'}
              </Text>
              <Text className="text-muted-foreground">{actual.medicamento}</Text>
            </View>
          </View>
          <Button size="lg" className="h-12 rounded-2xl" disabled={tomado} onPress={() => setTomado(true)}>
            <Icon as={Check} size={18} />
            <Text>{tomado ? 'Tomado' : 'Marcar como tomado'}</Text>
          </Button>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold">Próximas dosis</Text>
          <Button variant="link" size="sm"><Text>Ver todas</Text></Button>
        </View>

        {dosis.map((d) => (
          <ListRow
            key={d.id}
            icon={Pill}
            iconBgClassName={d.color === 'verde' ? 'bg-meds' : 'bg-alerta'}
            iconClassName={d.color === 'verde' ? 'text-meds-foreground' : 'text-heart'}
            title={d.medicamento}
            subtitle={`${d.cuando} - ${d.hora}`}
            right={<Icon as={Clock} size={20} className="text-muted-foreground" />}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
