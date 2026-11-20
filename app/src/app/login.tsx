import { Aviso } from '@/components/aviso';
import { Campo } from '@/components/campo';
import { DoctoraAvatar } from '@/components/doctora-avatar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { correoValido } from '@/lib/validacion';
import { useAuth } from '@/providers/auth-provider';
import { Link } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (!correoValido(correo)) return setError('Escribe un correo válido.');
    if (!clave) return setError('Escribe tu contraseña.');
    setError(null);
    setEnviando(true);
    const r = await iniciarSesion(correo, clave);
    setEnviando(false);
    // Si no hay error, la navegación cambia sola (Stack.Protected)
    if (r.error) setError(r.error);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView contentContainerClassName="grow justify-center gap-5 px-6 py-8" keyboardShouldPersistTaps="handled">
          <View className="items-center gap-2">
            <DoctoraAvatar size={150} />
            <Logo compact />
            <Text className="text-muted-foreground">Inicia sesión para continuar</Text>
          </View>

          <View className="gap-3">
            <Campo
              icon={Mail}
              placeholder="Correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              value={correo}
              onChangeText={setCorreo}
              editable={!enviando}
            />
            <Campo
              icon={Lock}
              clave
              placeholder="Contraseña"
              autoComplete="current-password"
              textContentType="password"
              value={clave}
              onChangeText={setClave}
              onSubmitEditing={enviar}
              editable={!enviando}
            />
            <Link href="/recuperar" asChild>
              <Button variant="link" size="sm" className="self-end px-0">
                <Text>¿Olvidaste tu contraseña?</Text>
              </Button>
            </Link>
          </View>

          {error && <Aviso>{error}</Aviso>}

          <Button size="lg" className="h-14 rounded-full" onPress={enviar} disabled={enviando}>
            {enviando ? <ActivityIndicator color="white" /> : <Text className="text-lg">Iniciar sesión</Text>}
          </Button>

          <View className="flex-row items-center gap-3">
            <Separator className="flex-1" />
            <Text variant="muted">o</Text>
            <Separator className="flex-1" />
          </View>

          <View className="gap-3">
            <Button variant="outline" size="lg" className="h-12 rounded-full" disabled>
              <Text>Continuar con Google (próximamente)</Text>
            </Button>
            <Button variant="outline" size="lg" className="h-12 rounded-full" disabled>
              <Text>Continuar con Apple (próximamente)</Text>
            </Button>
          </View>

          <View className="flex-row items-center justify-center">
            <Text variant="muted">¿No tienes una cuenta? </Text>
            <Link href="/registro" asChild>
              <Button variant="link" size="sm" className="px-0">
                <Text className="font-semibold">Regístrate</Text>
              </Button>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
