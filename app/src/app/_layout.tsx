import '../global.css';

import { ConfigFaltante } from '@/components/config-faltante';
import { supabaseConfigurado } from '@/lib/supabase';
import { NAV_THEME } from '@/lib/theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? 'light';

  return (
    <ThemeProvider value={NAV_THEME[scheme]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {supabaseConfigurado ? (
        <AuthProvider>
          <Navegacion />
        </AuthProvider>
      ) : (
        <ConfigFaltante onReady={() => SplashScreen.hideAsync()} />
      )}
      <PortalHost />
    </ThemeProvider>
  );
}

function Navegacion() {
  const { session, cargando } = useAuth();

  useEffect(() => {
    if (!cargando) SplashScreen.hideAsync();
  }, [cargando]);

  if (cargando) return null;

  const autenticado = Boolean(session);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Solo sin sesión */}
      <Stack.Protected guard={!autenticado}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="registro" />
        <Stack.Screen name="recuperar" />
      </Stack.Protected>

      {/* Solo con sesión */}
      <Stack.Protected guard={autenticado}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="medicamentos" />
        <Stack.Screen name="citas" />
        <Stack.Screen name="examenes" />
      </Stack.Protected>
    </Stack>
  );
}
