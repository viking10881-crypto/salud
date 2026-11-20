import { Aviso } from '@/components/aviso';
import { ScreenHeader } from '@/components/screen-header';
import { SelectorFechaHora } from '@/components/selector-fecha-hora';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { mensajeError } from '@/lib/auth-errors';
import type { Perfil } from '@/lib/database.types';
import { aFechaISO, deFechaISO, edadDesde } from '@/lib/fechas';
import { cn } from '@/lib/utils';
import { telefonoValido } from '@/lib/validacion';
import { useAuth } from '@/providers/auth-provider';
import { router } from 'expo-router';
import { CalendarDays, Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TipoSangre = NonNullable<Perfil['tipo_sangre']>;
const TIPOS_SANGRE: TipoSangre[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const fechaLargaFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' });

function Seccion({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Label>{titulo}</Label>
      {children}
      {ayuda && <Text className="text-xs text-muted-foreground">{ayuda}</Text>}
    </View>
  );
}

function Chip({ activo, texto, onPress }: { activo: boolean; texto: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: activo }}
      className={cn(
        'min-w-16 flex-row items-center justify-center gap-1 rounded-full border px-4 py-2',
        activo ? 'border-primary bg-primary' : 'border-input bg-card'
      )}>
      <Text className={cn('text-sm font-semibold', activo ? 'text-primary-foreground' : 'text-foreground')}>{texto}</Text>
    </Pressable>
  );
}

export default function MisDatos() {
  const { perfil, session, actualizarPerfil } = useAuth();

  const [hoy] = useState(() => new Date());
  const [nombre, setNombre] = useState(perfil?.nombre ?? '');
  const [apellido, setApellido] = useState(perfil?.apellido ?? '');
  const [nacimiento, setNacimiento] = useState<string | null>(perfil?.fecha_nacimiento ?? null);
  const [telefono, setTelefono] = useState(perfil?.telefono ?? '');
  const [tipoSangre, setTipoSangre] = useState<Perfil['tipo_sangre']>(perfil?.tipo_sangre ?? null);
  const [alergias, setAlergias] = useState(perfil?.alergias ?? '');

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const edad = nacimiento ? edadDesde(nacimiento, hoy) : null;
  const minimoNacimiento = new Date(hoy.getFullYear() - 120, 0, 1);

  const onGuardar = async () => {
    if (!nombre.trim()) return setError('Escribe tu nombre.');
    if (telefono.trim() && !telefonoValido(telefono)) {
      return setError('Revisa el teléfono: usa solo números (7 a 15 dígitos), puede empezar con +.');
    }
    setError(null);
    setGuardando(true);
    try {
      await actualizarPerfil({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        fecha_nacimiento: nacimiento,
        telefono: telefono.trim() || null,
        tipo_sangre: tipoSangre,
        alergias: alergias.trim() || null,
      });
      router.back();
    } catch (e) {
      setError(mensajeError(e));
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Mis Datos" />
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView contentContainerClassName="gap-5 px-4 pb-10 pt-2" keyboardShouldPersistTaps="handled">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Seccion titulo="Nombre *">
                <Input value={nombre} onChangeText={setNombre} placeholder="Tu nombre" autoComplete="given-name" className="h-12 rounded-xl" />
              </Seccion>
            </View>
            <View className="flex-1">
              <Seccion titulo="Apellido">
                <Input value={apellido} onChangeText={setApellido} placeholder="Tu apellido" autoComplete="family-name" className="h-12 rounded-xl" />
              </Seccion>
            </View>
          </View>

          <Seccion titulo="Correo">
            <Input value={session?.user.email ?? ''} editable={false} className="h-12 rounded-xl opacity-60" />
          </Seccion>

          <Seccion titulo="Fecha de nacimiento" ayuda={edad !== null ? `Tienes ${edad} años.` : undefined}>
            <View className="flex-row items-center gap-2">
              <SelectorFechaHora
                modo="date"
                titulo="Fecha de nacimiento"
                valor={nacimiento ? deFechaISO(nacimiento) : new Date(hoy.getFullYear() - 30, 0, 1)}
                minimo={minimoNacimiento}
                maximo={hoy}
                onSeleccion={(d) => setNacimiento(aFechaISO(d))}>
                {(abrir) => (
                  <Button variant="outline" className="h-12 flex-1 justify-start rounded-xl" onPress={abrir}>
                    <Icon as={CalendarDays} size={16} />
                    <Text className={cn(!nacimiento && 'text-muted-foreground')}>
                      {nacimiento ? fechaLargaFmt.format(deFechaISO(nacimiento)) : 'Elegir fecha'}
                    </Text>
                  </Button>
                )}
              </SelectorFechaHora>
              {nacimiento && (
                <Button variant="ghost" size="icon" onPress={() => setNacimiento(null)} accessibilityLabel="Quitar fecha de nacimiento">
                  <Icon as={X} size={18} className="text-muted-foreground" />
                </Button>
              )}
            </View>
          </Seccion>

          <Seccion titulo="Teléfono">
            <Input
              value={telefono}
              onChangeText={setTelefono}
              placeholder="Ej. +57 300 123 4567"
              keyboardType="phone-pad"
              autoComplete="tel"
              className="h-12 rounded-xl"
            />
          </Seccion>

          <Seccion titulo="Tipo de sangre">
            <View className="flex-row flex-wrap gap-2">
              {TIPOS_SANGRE.map((t) => (
                <Chip key={t} activo={tipoSangre === t} texto={t} onPress={() => setTipoSangre(t)} />
              ))}
              <Chip activo={tipoSangre === null} texto="No sé" onPress={() => setTipoSangre(null)} />
            </View>
          </Seccion>

          <Seccion titulo="Alergias" ayuda="Medicamentos, alimentos u otras. Es útil tenerlo a mano en una emergencia.">
            <Input
              value={alergias}
              onChangeText={setAlergias}
              placeholder="Ej. Penicilina, maní"
              multiline
              className="min-h-20 rounded-xl py-3"
              textAlignVertical="top"
            />
          </Seccion>

          {error && <Aviso>{error}</Aviso>}

          <Button size="lg" className="h-14 rounded-full" onPress={onGuardar} disabled={guardando}>
            {guardando ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Icon as={Check} size={18} />
                <Text className="text-lg">Guardar</Text>
              </>
            )}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
