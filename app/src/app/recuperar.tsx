import { Aviso } from '@/components/aviso';
import { Campo } from '@/components/campo';
import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { correoValido } from '@/lib/validacion';
import { useAuth } from '@/providers/auth-provider';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Recuperar() {
  const { recuperarClave } = useAuth();
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (!correoValido(correo)) return setError('Escribe un correo válido.');
    setError(null);
    setEnviando(true);
    const r = await recuperarClave(correo);
    setEnviando(false);
    if (r.error) return setError(r.error);
    setEnviado(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Recuperar contraseña" />
      <View className="gap-4 px-6 pt-2">
        <Text className="text-muted-foreground">
          Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
        </Text>
        <Campo
          icon={Mail}
          placeholder="Correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={correo}
          onChangeText={setCorreo}
          onSubmitEditing={enviar}
        />
        {error && <Aviso>{error}</Aviso>}
        {enviado && <Aviso tipo="exito">Si el correo está registrado, recibirás el enlace en unos minutos.</Aviso>}
        <Button size="lg" className="h-14 rounded-full" onPress={enviar} disabled={enviando || enviado}>
          {enviando ? <ActivityIndicator color="white" /> : <Text className="text-lg">Enviar enlace</Text>}
        </Button>
      </View>
    </SafeAreaView>
  );
}
