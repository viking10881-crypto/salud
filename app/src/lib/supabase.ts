import { authStorage } from '@/lib/secure-storage';
import type { Database } from '@/lib/database.types';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/** false si faltan las variables de entorno (ver app/.env.example). */
export const supabaseConfigurado = Boolean(url && key);

export const supabase = createClient<Database>(
  url ?? 'https://configura-tu-proyecto.supabase.co',
  key ?? 'falta-EXPO_PUBLIC_SUPABASE_KEY',
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Refrescar el token solo mientras la app está en primer plano
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
