import '../global.css';
// Configura cómo se muestran las notificaciones antes de cualquier render
import '@/lib/notificaciones';

import { ConfigFaltante } from '@/components/config-faltante';
import { ManejadorNotificaciones } from '@/components/manejador-notificaciones';
import { supabaseConfigurado } from '@/lib/supabase';
import { NAV_THEME } from '@/lib/theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { MedicamentosProvider } from '@/providers/medicamentos-provider';
import { PortalHost } from '@rn-primitives/portal';
import { SplashScreen, Stack, ThemeProvider } from 'expo-router';
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
          <MedicamentosProvider>
            <Navegacion />
          </MedicamentosProvider>
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
    <>
      {autenticado && <ManejadorNotificaciones />}
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
          <Stack.Screen name="medicamento" />
          <Stack.Screen name="citas" />
          <Stack.Screen name="examenes" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
