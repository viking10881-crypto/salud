import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { adherencia } from '@/lib/dosis';
import { cn } from '@/lib/utils';
import { DIAS_HISTORIAL, useMedicamentos } from '@/providers/medicamentos-provider';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colorPorcentaje = (p: number) =>
  p >= 80 ? 'text-meds-foreground' : p >= 50 ? 'text-salud-foreground' : 'text-destructive';

export default function MiSalud() {
  const { medicamentos, tomas } = useMedicamentos();
  const datos = useMemo(() => adherencia(medicamentos, tomas, DIAS_HISTORIAL), [medicamentos, tomas]);
  const total = datos.reduce(
    (acc, d) => ({ p: acc.p + d.programadas, c: acc.c + d.cumplidas }),
    { p: 0, c: 0 }
  );
  const general = total.p ? Math.round((total.c / total.p) * 100) : null;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 p-4">
        <Text variant="h3">Mi Salud</Text>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Cumplimiento del tratamiento</CardTitle>
            <CardDescription>Últimos {DIAS_HISTORIAL} días · dosis tomadas vs. programadas</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {general === null ? (
              <Text variant="muted">
                Aún no hay dosis programadas que medir. Cuando agregues medicamentos y pasen sus horarios,
                verás aquí tu cumplimiento.
              </Text>
            ) : (
              <>
                <View className="items-center gap-1 py-2">
                  <Text className={cn('text-5xl font-extrabold', colorPorcentaje(general))}>{general}%</Text>
                  <Text variant="muted">
                    {total.c} de {total.p} dosis tomadas
                  </Text>
                </View>
                {datos.map((a) => (
                  <View key={a.medicamento.id} className="gap-2">
                    <View className="flex-row justify-between gap-2">
                      <Text className="flex-1 text-sm" numberOfLines={1}>
                        {a.medicamento.nombre} {a.medicamento.dosis}
                      </Text>
                      <Text className={cn('text-sm font-semibold', colorPorcentaje(a.porcentaje ?? 0))}>
                        {a.porcentaje}% · {a.cumplidas}/{a.programadas}
                      </Text>
                    </View>
                    <Progress value={a.porcentaje ?? 0} className="h-2" indicatorClassName="bg-primary" />
                  </View>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Text variant="muted" className="text-center">
          Próximamente: presión arterial, glucosa, peso y más indicadores.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
