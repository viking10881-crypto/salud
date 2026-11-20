import { Aviso } from '@/components/aviso';
import { Campo } from '@/components/campo';
import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { CLAVE_MIN, correoValido } from '@/lib/validacion';
import { useAuth } from '@/providers/auth-provider';
import { router } from 'expo-router';
import { Lock, Mail, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Registro() {
  const { registrarse } = useAuth();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [clave2, setClave2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const validar = () => {
    if (!nombre.trim()) return 'Escribe tu nombre.';
    if (!correoValido(correo)) return 'Escribe un correo válido.';
    if (clave.length < CLAVE_MIN) return `La contraseña debe tener al menos ${CLAVE_MIN} caracteres.`;
    if (clave !== clave2) return 'Las contraseñas no coinciden.';
    return null;
  };

  const enviar = async () => {
    const problema = validar();
    if (problema) return setError(problema);
    setError(null);
    setEnviando(true);
    const r = await registrarse({ nombre, apellido, correo, clave });
    setEnviando(false);
    if (r.error) return setError(r.error);
    if (r.requiereConfirmacion) {
      setExito('¡Cuenta creada! Te enviamos un correo para confirmar tu cuenta. Después inicia sesión.');
    }
    // Si no requiere confirmación, ya hay sesión y la navegación cambia sola.
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Crear cuenta" />
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView contentContainerClassName="gap-4 px-6 pb-8 pt-2" keyboardShouldPersistTaps="handled">
          <Text className="text-muted-foreground">
            Tus datos médicos son privados: solo tú puedes verlos.
          </Text>

          <View className="gap-3">
            <Campo icon={UserRound} placeholder="Nombre" autoComplete="given-name" textContentType="givenName" value={nombre} onChangeText={setNombre} />
            <Campo icon={UserRound} placeholder="Apellido" autoComplete="family-name" textContentType="familyName" value={apellido} onChangeText={setApellido} />
            <Campo
              icon={Mail}
              placeholder="Correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              value={correo}
              onChangeText={setCorreo}
            />
            <Campo icon={Lock} clave placeholder={`Contraseña (mín. ${CLAVE_MIN} caracteres)`} autoComplete="new-password" textContentType="newPassword" value={clave} onChangeText={setClave} />
            <Campo icon={Lock} clave placeholder="Repite la contraseña" autoComplete="new-password" textContentType="newPassword" value={clave2} onChangeText={setClave2} onSubmitEditing={enviar} />
          </View>

          {error && <Aviso>{error}</Aviso>}
          {exito && <Aviso tipo="exito">{exito}</Aviso>}

          {exito ? (
            <Button size="lg" className="h-14 rounded-full" onPress={() => router.replace('/login')}>
              <Text className="text-lg">Ir a iniciar sesión</Text>
            </Button>
          ) : (
            <Button size="lg" className="h-14 rounded-full" onPress={enviar} disabled={enviando}>
              {enviando ? <ActivityIndicator color="white" /> : <Text className="text-lg">Crear cuenta</Text>}
            </Button>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
