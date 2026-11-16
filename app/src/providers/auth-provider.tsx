import { mensajeError } from '@/lib/auth-errors';
import type { Perfil } from '@/lib/database.types';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Resultado = { error: string | null };

type AuthContextValue = {
  session: Session | null;
  perfil: Perfil | null;
  cargando: boolean;
  iniciarSesion: (correo: string, clave: string) => Promise<Resultado>;
  registrarse: (datos: { nombre: string; apellido: string; correo: string; clave: string }) => Promise<
    Resultado & { requiereConfirmacion: boolean }
  >;
  recuperarClave: (correo: string) => Promise<Resultado>;
  cerrarSesion: () => Promise<void>;
  recargarPerfil: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(supabaseConfigurado);

  const cargarPerfil = useCallback(async (userId: string | undefined) => {
    if (!userId) return setPerfil(null);
    const { data } = await supabase.from('perfiles').select('*').eq('id', userId).maybeSingle();
    setPerfil(data);
  }, []);

  useEffect(() => {
    if (!supabaseConfigurado) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, nueva) => setSession(nueva));
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    cargarPerfil(userId);
  }, [userId, cargarPerfil]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      perfil,
      cargando,
      async iniciarSesion(correo, clave) {
        const { error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: clave });
        return { error: error ? mensajeError(error) : null };
      },
      async registrarse({ nombre, apellido, correo, clave }) {
        const { data, error } = await supabase.auth.signUp({
          email: correo.trim(),
          password: clave,
          options: { data: { nombre: nombre.trim(), apellido: apellido.trim() } },
        });
        return {
          error: error ? mensajeError(error) : null,
          // Si la confirmación por correo está activa, signUp no devuelve sesión
          requiereConfirmacion: !error && !data.session,
        };
      },
      async recuperarClave(correo) {
        const { error } = await supabase.auth.resetPasswordForEmail(correo.trim());
        return { error: error ? mensajeError(error) : null };
      },
      async cerrarSesion() {
        await supabase.auth.signOut();
      },
      recargarPerfil: () => cargarPerfil(userId),
    }),
    [session, perfil, cargando, userId, cargarPerfil]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
