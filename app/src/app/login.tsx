import { DoctoraAvatar } from '@/components/doctora-avatar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [recordar, setRecordar] = useState(true);

  // TODO(fase 2): reemplazar por Supabase Auth
  const iniciarSesion = () => router.replace('/(tabs)');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="grow justify-center gap-5 px-6 py-8" keyboardShouldPersistTaps="handled">
          <View className="items-center gap-2">
            <DoctoraAvatar size={150} />
            <Logo compact />
            <Text className="text-muted-foreground">Inicia sesión para continuar</Text>
          </View>

          <View className="gap-3">
            <View className="flex-row items-center rounded-2xl border border-input bg-card px-4">
              <Icon as={Mail} size={20} className="text-muted-foreground" />
              <Input
                className="h-14 flex-1 border-0 bg-transparent shadow-none dark:bg-transparent"
                placeholder="Correo electrónico"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={correo}
                onChangeText={setCorreo}
              />
            </View>
            <View className="flex-row items-center rounded-2xl border border-input bg-card px-4">
              <Icon as={Lock} size={20} className="text-muted-foreground" />
              <Input
                className="h-14 flex-1 border-0 bg-transparent shadow-none dark:bg-transparent"
                placeholder="Contraseña"
                secureTextEntry={!verClave}
                autoComplete="password"
                value={clave}
                onChangeText={setClave}
              />
              <Pressable onPress={() => setVerClave((v) => !v)} hitSlop={12} accessibilityLabel="Mostrar contraseña">
                <Icon as={verClave ? Eye : EyeOff} size={20} className="text-muted-foreground" />
              </Pressable>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Checkbox checked={recordar} onCheckedChange={setRecordar} aria-labelledby="recordar" />
              <Label nativeID="recordar" onPress={() => setRecordar((v) => !v)}>
                Recordar mi cuenta
              </Label>
            </View>
            <Button variant="link" size="sm" className="px-0">
              <Text>¿Olvidaste tu contraseña?</Text>
            </Button>
          </View>

          <Button size="lg" className="h-14 rounded-full" onPress={iniciarSesion}>
            <Text className="text-lg">Iniciar sesión</Text>
          </Button>

          <View className="flex-row items-center gap-3">
            <Separator className="flex-1" />
            <Text variant="muted">o</Text>
            <Separator className="flex-1" />
          </View>

          <View className="gap-3">
            <Button variant="outline" size="lg" className="h-12 rounded-full">
              <Text className="font-bold text-[#4285F4]">G</Text>
              <Text>Continuar con Google</Text>
            </Button>
            <Button variant="outline" size="lg" className="h-12 rounded-full">
              <Text>Continuar con Apple</Text>
            </Button>
          </View>

          <View className="flex-row items-center justify-center">
            <Text variant="muted">¿No tienes una cuenta? </Text>
            <Button variant="link" size="sm" className="px-0">
              <Text className="font-semibold">Regístrate</Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
