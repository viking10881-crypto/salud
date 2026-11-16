import { DoctoraAvatar } from '@/components/doctora-avatar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Pantalla de bienvenida
export default function Bienvenida() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-secondary" />
      <View className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-alerta" />

      <View className="flex-1 items-center justify-center gap-10 px-6">
        <DoctoraAvatar size={240} />
        <View className="items-center gap-3">
          <Logo />
          <Text className="text-center text-xl text-secondary-foreground">
            Tu salud siempre{'\n'}en tus manos
          </Text>
        </View>
        <Button size="lg" className="h-14 w-64 rounded-full" onPress={() => router.push('/login')}>
          <Text className="text-lg">Comenzar</Text>
          <Icon as={ChevronRight} size={20} />
        </Button>
      </View>
    </SafeAreaView>
  );
}
