import { THEME } from '@/lib/theme';
import { Tabs } from 'expo-router';
import { FolderHeart, HeartPulse, House, Settings } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const t = THEME[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.mutedForeground,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border, height: 68, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }} />
      <Tabs.Screen name="mi-salud" options={{ title: 'Mi Salud', tabBarIcon: ({ color, size }) => <HeartPulse color={color} size={size} /> }} />
      <Tabs.Screen name="historial" options={{ title: 'Historial', tabBarIcon: ({ color, size }) => <FolderHeart color={color} size={size} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Configuración', tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
    </Tabs>
  );
}
