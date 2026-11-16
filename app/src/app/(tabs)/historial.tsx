import { ListRow } from '@/components/list-row';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { citas, examenes, formatoFecha } from '@/data/mock';
import { CalendarCheck, FileText } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Historial() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-3 p-4">
        <Text variant="h3">Historial médico</Text>
        {examenes.map((e) => (
          <ListRow
            key={e.id}
            icon={FileText}
            iconBgClassName="bg-examenes"
            iconClassName="text-examenes-foreground"
            title={e.titulo}
            subtitle={formatoFecha(e.fecha)}
            right={<Badge variant="secondary"><Text>Examen</Text></Badge>}
          />
        ))}
        {citas.map((c) => (
          <ListRow
            key={c.id}
            icon={CalendarCheck}
            iconBgClassName="bg-citas"
            iconClassName="text-citas-foreground"
            title={c.especialidad}
            subtitle={formatoFecha(c.fecha)}
            right={<Badge variant="outline"><Text>Cita</Text></Badge>}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
