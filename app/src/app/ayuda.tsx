import { Aviso } from '@/components/aviso';
import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import Constants from 'expo-constants';
import { ChevronDown, Mail, Phone, ShieldAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const CORREO_SOPORTE = 'appsalud6@gmail.com';
const NUMERO_EMERGENCIAS = '123';

const PREGUNTAS: { pregunta: string; respuesta: string }[] = [
  {
    pregunta: '¿Cómo agrego un medicamento?',
    respuesta:
      'En Inicio toca "Medicamentos" y luego el botón +. Escribe el nombre, la dosis, los horarios y los días. Te avisaremos a cada hora programada.',
  },
  {
    pregunta: 'No me llegan los recordatorios',
    respuesta:
      'Revisa que las notificaciones de la app estén permitidas en los ajustes del teléfono y que el ahorro de batería no la esté cerrando. Si no marcas la dosis como tomada, el aviso se repite cada 10 minutos (hasta 3 veces).',
  },
  {
    pregunta: '¿Cómo marco una dosis como tomada?',
    respuesta:
      'En "Medicamentos" toca "Marcar como tomado" en la dosis del día, o hazlo desde la campana de notificaciones en Inicio.',
  },
  {
    pregunta: '¿Cómo agrego una cita médica?',
    respuesta:
      'En "Mis Citas" toca el botón +. Elige la fecha, la hora, el tipo de cita y con cuánta anticipación quieres el aviso. Si escribes "Dr." o "Dra." antes del nombre, verás el avatar del médico.',
  },
  {
    pregunta: '¿Cómo subo un examen o una fórmula?',
    respuesta:
      'En "Mis Exámenes" toca el botón + y elige tomar una foto, una imagen de la galería o un archivo PDF. Tus archivos se guardan de forma privada: solo tú puedes verlos.',
  },
  {
    pregunta: 'Olvidé mi contraseña',
    respuesta:
      'Cierra sesión y en "Iniciar sesión" toca "¿Olvidaste tu contraseña?". Te enviaremos un enlace al correo para crear una nueva.',
  },
  {
    pregunta: '¿Quién puede ver mis datos?',
    respuesta:
      'Solo tú. Tus datos de salud y tus archivos están protegidos y asociados a tu cuenta. No los compartimos con nadie.',
  },
  {
    pregunta: '¿Cómo elimino mi cuenta?',
    respuesta: `Escríbenos a ${CORREO_SOPORTE} desde el correo de tu cuenta pidiendo la eliminación y borraremos tu cuenta y todos tus datos.`,
  },
];

function Pregunta({ pregunta, respuesta }: { pregunta: string; respuesta: string }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <Pressable
      onPress={() => setAbierta((a) => !a)}
      accessibilityRole="button"
      accessibilityState={{ expanded: abierta }}
      className="gap-2 px-4 py-3.5 active:bg-accent">
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 font-semibold">{pregunta}</Text>
        <Icon
          as={ChevronDown}
          size={18}
          className="text-muted-foreground"
          style={{ transform: [{ rotate: abierta ? '180deg' : '0deg' }] }}
        />
      </View>
      {abierta && <Text className="text-sm leading-5 text-muted-foreground">{respuesta}</Text>}
    </Pressable>
  );
}

export default function Ayuda() {
  const { session } = useAuth();
  const [sinCorreo, setSinCorreo] = useState(false);

  const escribir = async () => {
    const version = Constants.expoConfig?.version ?? '';
    const sistema = Platform.OS === 'android' ? `Android (API ${Platform.Version})` : `${Platform.OS} ${Platform.Version}`;
    const asunto = 'Ayuda - Salud en tus manos';
    const cuerpo = [
      'Hola, necesito ayuda con:',
      '',
      '',
      '',
      '— Datos para el soporte —',
      `Versión de la app: ${version}`,
      `Sistema: ${sistema}`,
      session?.user.email ? `Cuenta: ${session.user.email}` : null,
    ]
      .filter((l) => l !== null)
      .join('\n');
    const url = `mailto:${CORREO_SOPORTE}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    try {
      await Linking.openURL(url);
      setSinCorreo(false);
    } catch {
      setSinCorreo(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Ayuda y Soporte" />
      <ScrollView contentContainerClassName="gap-5 px-4 pb-10 pt-2">
        {/* Contacto */}
        <Card className="gap-3 rounded-3xl bg-secondary p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-card">
              <Icon as={Mail} size={24} className="text-primary" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold">¿Necesitas ayuda?</Text>
              <Text className="text-sm text-secondary-foreground">Escríbenos y te responderemos lo antes posible.</Text>
            </View>
          </View>
          <Text selectable className="text-center font-semibold text-primary">
            {CORREO_SOPORTE}
          </Text>
          <Button size="lg" className="h-12 rounded-full" onPress={escribir}>
            <Icon as={Mail} size={18} />
            <Text>Escribir un correo</Text>
          </Button>
          {sinCorreo && (
            <Aviso>{`No encontramos una app de correo. Escríbenos a ${CORREO_SOPORTE} desde tu correo.`}</Aviso>
          )}
        </Card>

        {/* Preguntas frecuentes */}
        <View className="gap-2">
          <Text className="px-1 text-lg font-bold">Preguntas frecuentes</Text>
          <Card className="gap-0 overflow-hidden rounded-3xl py-0">
            {PREGUNTAS.map((p, i) => (
              <View key={p.pregunta} className={cn(i > 0 && 'border-t border-border')}>
                <Pregunta {...p} />
              </View>
            ))}
          </Card>
        </View>

        {/* Emergencias */}
        <View className="gap-3 rounded-3xl border border-border bg-alerta p-4">
          <View className="flex-row gap-3">
            <Icon as={ShieldAlert} size={22} className="text-heart" />
            <View className="flex-1 gap-1">
              <Text className="font-semibold text-alerta-foreground">Esta app no reemplaza a tu médico</Text>
              <Text className="text-sm leading-5">
                Es una ayuda para organizar tu tratamiento. Ante una emergencia o síntomas graves, busca atención médica
                de inmediato.
              </Text>
            </View>
          </View>
          <Button
            variant="outline"
            className="rounded-full border-heart"
            onPress={() => Linking.openURL(`tel:${NUMERO_EMERGENCIAS}`).catch(() => {})}>
            <Icon as={Phone} size={16} className="text-heart" />
            <Text className="text-heart">Llamar a emergencias ({NUMERO_EMERGENCIAS})</Text>
          </Button>
        </View>

        <Text className="text-center text-xs text-muted-foreground">
          Salud en tus manos · versión {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
