import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ADHERENCIA = [
  { nombre: 'Metformina 500 mg', valor: 92 },
  { nombre: 'Losartán 50 mg', valor: 85 },
  { nombre: 'Vitamina D 1000 UI', valor: 70 },
];

export default function MiSalud() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 p-4">
        <Text variant="h3">Mi Salud</Text>
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Cumplimiento del tratamiento</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {ADHERENCIA.map((a) => (
              <View key={a.nombre} className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-sm">{a.nombre}</Text>
                  <Text className="text-sm font-semibold text-primary">{a.valor}%</Text>
                </View>
                <Progress value={a.valor} className="h-2" indicatorClassName="bg-primary" />
              </View>
            ))}
          </CardContent>
        </Card>
        <Text variant="muted" className="text-center">
          Próximamente: presión arterial, glucosa, peso y más indicadores.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
