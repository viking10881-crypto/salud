import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { aFechaISO } from '@/lib/fechas';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

const SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']; // la semana empieza el lunes
const mesFmt = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' });

type Props = {
  /** Cualquier fecha del mes a mostrar */
  mes: Date;
  onCambiarMes: (mes: Date) => void;
  /** 'YYYY-MM-DD' seleccionado o null */
  seleccionado: string | null;
  onSeleccionar: (iso: string | null) => void;
  /** Días con eventos ('YYYY-MM-DD') */
  marcados: Set<string>;
  hoy: Date;
};

export function CalendarioMes({ mes, onCambiarMes, seleccionado, onSeleccionar, marcados, hoy }: Props) {
  const primero = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const diasEnMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const offset = (primero.getDay() + 6) % 7; // lunes = 0
  const celdas: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: diasEnMes }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1)),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);
  const hoyISO = aFechaISO(hoy);
  const titulo = mesFmt.format(primero);

  return (
    <View className="gap-2 rounded-3xl border border-border bg-card p-3">
      <View className="flex-row items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Mes anterior"
          onPress={() => onCambiarMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>
          <Icon as={ChevronLeft} size={20} />
        </Button>
        <Text className="font-bold capitalize">{titulo}</Text>
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Mes siguiente"
          onPress={() => onCambiarMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>
          <Icon as={ChevronRight} size={20} />
        </Button>
      </View>

      <View className="flex-row">
        {SEMANA.map((d) => (
          <Text key={d} className="flex-1 text-center text-xs font-semibold text-muted-foreground">
            {d}
          </Text>
        ))}
      </View>

      {Array.from({ length: celdas.length / 7 }, (_, fila) => (
        <View key={fila} className="flex-row">
          {celdas.slice(fila * 7, fila * 7 + 7).map((dia, i) => {
            if (!dia) return <View key={i} className="h-11 flex-1" />;
            const iso = aFechaISO(dia);
            const sel = iso === seleccionado;
            const esHoy = iso === hoyISO;
            const marcado = marcados.has(iso);
            return (
              <Pressable
                key={i}
                onPress={() => onSeleccionar(sel ? null : iso)}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={`${dia.getDate()}${marcado ? ', tiene citas' : ''}`}
                className="h-11 flex-1 items-center justify-center">
                <View
                  className={cn(
                    'h-9 w-9 items-center justify-center rounded-full',
                    sel ? 'bg-primary' : esHoy && 'border border-primary'
                  )}>
                  <Text className={cn('text-sm', sel ? 'font-bold text-primary-foreground' : esHoy && 'font-bold text-primary')}>
                    {dia.getDate()}
                  </Text>
                </View>
                {marcado && (
                  <View className={cn('absolute bottom-0.5 h-1.5 w-1.5 rounded-full', sel ? 'bg-primary' : 'bg-heart')} />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
