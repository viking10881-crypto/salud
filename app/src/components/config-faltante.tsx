import { Logo } from '@/components/logo';
import { Text } from '@/components/ui/text';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Se muestra en desarrollo si faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY. */
export function ConfigFaltante({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-4 px-6">
        <Logo compact />
        <Text variant="h4">Falta configurar Supabase</Text>
        <Text className="text-muted-foreground">
          Crea el archivo <Text className="font-mono">app/.env</Text> a partir de{' '}
          <Text className="font-mono">.env.example</Text> con la URL y la llave publishable de tu
          proyecto, y reinicia con <Text className="font-mono">npx expo start -c</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}
