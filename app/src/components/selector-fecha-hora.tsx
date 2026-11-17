import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { aFechaISO, aHora, deFechaISO, horaEnFecha } from '@/lib/fechas';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';

type Props = {
  modo: 'date' | 'time';
  valor: Date;
  onSeleccion: (fecha: Date) => void;
  minimo?: Date;
  maximo?: Date;
  titulo?: string;
  /** El disparador (botón, chip…). Recibe `abrir`. */
  children: (abrir: () => void) => React.ReactNode;
};

/**
 * Selector nativo de fecha u hora:
 * - Android: diálogo del sistema.
 * - iOS: panel inferior con la ruedita y botón "Listo".
 * - Web (desarrollo): campo de texto.
 */
export function SelectorFechaHora({ modo, valor, onSeleccion, minimo, maximo, titulo, children }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [temporal, setTemporal] = useState(valor);
  const [texto, setTexto] = useState('');

  const abrir = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: valor,
        mode: modo,
        is24Hour: false,
        minimumDate: minimo,
        maximumDate: maximo,
        onValueChange: (_e, fecha) => onSeleccion(fecha),
      });
      return;
    }
    setTemporal(valor);
    setTexto(modo === 'time' ? aHora(valor) : aFechaISO(valor));
    setAbierto(true);
  };

  const confirmar = () => {
    if (Platform.OS === 'web') {
      const ok = modo === 'time' ? /^\d{1,2}:\d{2}$/.test(texto) : /^\d{4}-\d{2}-\d{2}$/.test(texto);
      if (!ok) return;
      onSeleccion(modo === 'time' ? horaEnFecha(texto) : deFechaISO(texto));
    } else {
      onSeleccion(temporal);
    }
    setAbierto(false);
  };

  return (
    <>
      {children(abrir)}
      {Platform.OS !== 'android' && (
        <Modal visible={abierto} transparent animationType="slide" onRequestClose={() => setAbierto(false)}>
          <Pressable className="flex-1 bg-black/40" onPress={() => setAbierto(false)} accessibilityLabel="Cerrar" />
          <View className="gap-3 rounded-t-3xl bg-card px-4 pb-10 pt-4">
            <View className="flex-row items-center justify-between">
              <Button variant="ghost" onPress={() => setAbierto(false)}>
                <Text>Cancelar</Text>
              </Button>
              <Text className="font-semibold">{titulo ?? (modo === 'time' ? 'Elegir hora' : 'Elegir fecha')}</Text>
              <Button variant="ghost" onPress={confirmar}>
                <Text className="font-bold text-primary">Listo</Text>
              </Button>
            </View>
            {Platform.OS === 'web' ? (
              <Input
                value={texto}
                onChangeText={setTexto}
                placeholder={modo === 'time' ? 'HH:MM (24 h)' : 'AAAA-MM-DD'}
              />
            ) : (
              <DateTimePicker
                value={temporal}
                mode={modo}
                display={modo === 'time' ? 'spinner' : 'inline'}
                minimumDate={minimo}
                maximumDate={maximo}
                locale="es"
                onValueChange={(_e, fecha) => setTemporal(fecha)}
              />
            )}
          </View>
        </Modal>
      )}
    </>
  );
}
