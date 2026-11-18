import { AvatarMedico } from '@/components/avatar-medico';
import { ListRow } from '@/components/list-row';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { categoriaExamen } from '@/lib/categorias-examen';
import { formatoFechaCorta, formatoHoraDate } from '@/lib/fechas';
import { tipoMedico } from '@/lib/medico';
import { useCitas } from '@/providers/citas-provider';
import { useExamenes } from '@/providers/examenes-provider';
import { useMedicamentos } from '@/providers/medicamentos-provider';
import { router } from 'expo-router';
import { CalendarCheck, Pill } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const fechaCitaFmt = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export default function Historial() {
  const { pasadas } = useCitas();
  const { examenes } = useExamenes();
  const { terminados } = useMedicamentos();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-3 p-4">
        <Text variant="h3">Historial médico</Text>

        <Text className="mt-2 text-lg font-bold">Citas anteriores</Text>
        {pasadas.length === 0 ? (
          <Text variant="muted">Aquí aparecerán tus citas cuando pasen o las marques como completadas.</Text>
        ) : (
          pasadas.map((c) => (
            <ListRow
              key={c.id}
              icon={CalendarCheck}
              avatar={tipoMedico(c.doctor) ? <AvatarMedico tipo={tipoMedico(c.doctor)!} size={48} /> : undefined}
              iconBgClassName="bg-citas"
              iconClassName="text-citas-foreground"
              title={c.especialidad}
              subtitle={`${fechaCitaFmt.format(new Date(c.fecha))} · ${formatoHoraDate(new Date(c.fecha))}`}
              meta={c.doctor ?? undefined}
              onPress={() => router.push({ pathname: '/cita', params: { id: c.id } })}
              right={
                <Badge variant={c.completada ? 'secondary' : 'outline'}>
                  <Text>{c.completada ? 'Asistida' : 'Sin marcar'}</Text>
                </Badge>
              }
            />
          ))
        )}

        <Text className="mt-4 text-lg font-bold">Exámenes</Text>
        {examenes.length === 0 ? (
          <Text variant="muted">Aún no has subido exámenes.</Text>
        ) : (
          examenes.map((e) => {
            const cat = categoriaExamen(e.categoria);
            return (
              <ListRow
                key={e.id}
                icon={cat.icono}
                iconBgClassName="bg-examenes"
                iconClassName="text-examenes-foreground"
                title={e.titulo}
                subtitle={formatoFechaCorta(e.fecha)}
                onPress={() => router.push({ pathname: '/examen', params: { id: e.id } })}
                right={
                  <Badge variant="secondary">
                    <Text>{cat.texto}</Text>
                  </Badge>
                }
              />
            );
          })
        )}

        <Text className="mt-4 text-lg font-bold">Tratamientos terminados</Text>
        {terminados.length === 0 ? (
          <Text variant="muted">Los medicamentos aparecerán aquí cuando pase su fecha de fin.</Text>
        ) : (
          terminados.map((m) => (
            <ListRow
              key={m.id}
              icon={Pill}
              iconBgClassName="bg-meds"
              iconClassName="text-meds-foreground"
              title={`${m.nombre} ${m.dosis}`}
              subtitle={`${formatoFechaCorta(m.fecha_inicio)} – ${formatoFechaCorta(m.fecha_fin!)}`}
              meta={m.notas ?? undefined}
              onPress={() => router.push({ pathname: '/medicamento', params: { id: m.id } })}
              right={
                <Badge variant="secondary">
                  <Text>Terminado</Text>
                </Badge>
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
