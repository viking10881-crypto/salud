import '../global.css';
// Configura cómo se muestran las notificaciones antes de cualquier render
import '@/lib/notificaciones';

import { ConfigFaltante } from '@/components/config-faltante';
import { ManejadorEnlaces } from '@/components/manejador-enlaces';
import { ManejadorNotificaciones } from '@/components/manejador-notificaciones';
import { supabaseConfigurado } from '@/lib/supabase';
import { NAV_THEME } from '@/lib/theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { CitasProvider } from '@/providers/citas-provider';
import { ExamenesProvider } from '@/providers/examenes-provider';
import { MedicamentosProvider } from '@/providers/medicamentos-provider';
import { PortalHost } from '@rn-primitives/portal';
import { type Href, router, SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef } from 'react';

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
          <ManejadorEnlaces />
          <MedicamentosProvider>
            <CitasProvider>
              <ExamenesProvider>
                <Navegacion />
              </ExamenesProvider>
            </CitasProvider>
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
  const { session, cargando, recuperandoClave } = useAuth();
  const autenticado = Boolean(session);

  // A dónde debe estar el usuario según la sesión. No se usa Stack.Protected: en expo-router 58,
  // al cerrar sesión con las pestañas montadas, la limpieza de rutas protegidas entraba en un
  // ciclo ("Maximum update depth exceeded"). Aquí se hace una sola navegación explícita.
  // Ojo: "/" es Inicio (las pestañas); la bienvenida es "/bienvenida".
  const estado = cargando ? null : !autenticado ? 'sin-sesion' : recuperandoClave ? 'recuperando' : 'con-sesion';
  const estadoAnterior = useRef<string | null>(null);

  useEffect(() => {
    if (estado === null || estadoAnterior.current === estado) return;
    const alAbrir = estadoAnterior.current === null;
    estadoAnterior.current = estado;
    const destino: Href =
      estado === 'con-sesion'
        ? '/(tabs)'
        : estado === 'recuperando'
          ? '/nueva-clave'
          : // Al abrir la app: bienvenida. Al cerrar sesión: directo a iniciar sesión.
            alAbrir
            ? '/bienvenida'
            : '/login';
    if (router.canDismiss()) router.dismissAll();
    router.replace(destino);
    SplashScreen.hideAsync();
  }, [estado]);

  if (cargando) return null;

  return (
    <>
      {autenticado && !recuperandoClave && <ManejadorNotificaciones />}
      <Stack screenOptions={{ headerShown: false }}>
        {/* Sin sesión */}
        <Stack.Screen name="bienvenida" />
        <Stack.Screen name="login" />
        <Stack.Screen name="registro" />
        <Stack.Screen name="recuperar" />

        {/* Con sesión */}
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="medicamentos" />
        <Stack.Screen name="medicamento" />
        <Stack.Screen name="citas" />
        <Stack.Screen name="cita" />
        <Stack.Screen name="examenes" />
        <Stack.Screen name="examen" />
        <Stack.Screen name="mis-datos" />
        <Stack.Screen name="nueva-clave" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}
