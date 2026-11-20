import { Aviso } from '@/components/aviso';
import { Campo } from '@/components/campo';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { CLAVE_MIN } from '@/lib/validacion';
import { useAuth } from '@/providers/auth-provider';
import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Se llega aquí desde el enlace del correo "Recuperar contraseña". */
export default function NuevaClave() {
  const { cambiarClave, cerrarSesion, session } = useAuth();
  const [clave, setClave] = useState('');
  const [clave2, setClave2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (clave.length < CLAVE_MIN) return setError(`La contraseña debe tener al menos ${CLAVE_MIN} caracteres.`);
    if (clave !== clave2) return setError('Las contraseñas no coinciden.');
    setError(null);
    setGuardando(true);
    const r = await cambiarClave(clave);
    if (r.error) {
      setError(r.error);
      setGuardando(false);
    }
    // Si sale bien, termina el modo recuperación y el layout lleva a Inicio
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView contentContainerClassName="grow justify-center gap-4 px-6 py-6" keyboardShouldPersistTaps="handled">
          <View className="gap-1">
            <Text className="text-3xl font-bold">Nueva contraseña</Text>
            <Text className="text-muted-foreground">
              Crea una contraseña nueva para {session?.user.email ?? 'tu cuenta'}.
            </Text>
          </View>
          <Campo
            icon={Lock}
            clave
            placeholder={`Nueva contraseña (mín. ${CLAVE_MIN})`}
            autoComplete="new-password"
            value={clave}
            onChangeText={setClave}
          />
          <Campo
            icon={Lock}
            clave
            placeholder="Repite la contraseña"
            autoComplete="new-password"
            value={clave2}
            onChangeText={setClave2}
            onSubmitEditing={guardar}
          />
          {error && <Aviso>{error}</Aviso>}
          <Button size="lg" className="h-14 rounded-full" onPress={guardar} disabled={guardando}>
            {guardando ? <ActivityIndicator color="white" /> : <Text className="text-lg">Guardar contraseña</Text>}
          </Button>
          <Button variant="ghost" onPress={cerrarSesion} disabled={guardando}>
            <Text>Cancelar</Text>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
