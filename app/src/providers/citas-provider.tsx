import { mensajeError } from '@/lib/auth-errors';
import * as api from '@/lib/citas-api';
import type { Cita } from '@/lib/database.types';
import { cancelarRecordatoriosCitas, sincronizarRecordatoriosCitas } from '@/lib/notificaciones';
import { useAuth } from '@/providers/auth-provider';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

type Datos = { userId: string; citas: Cita[] };

type Ctx = {
  citas: Cita[];
  /** No completadas y con fecha desde hoy (incluye las de más temprano hoy) */
  proximas: Cita[];
  /** Completadas o de días anteriores, de la más reciente a la más antigua */
  pasadas: Cita[];
  proxima: Cita | null;
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  guardar: (input: api.CitaInput, id?: string) => Promise<void>;
  eliminar: (id: string) => Promise<void>;
  completar: (cita: Cita, completada: boolean) => Promise<void>;
};

const CitasContext = createContext<Ctx | null>(null);

export function CitasProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<{ userId: string; mensaje: string } | null>(null);
  const [version, setVersion] = useState(0);
  const [ahora, setAhora] = useState(() => new Date());

  const aplicar = useCallback((d: Datos) => {
    setDatos(d);
    setError(null);
    setAhora(new Date());
    sincronizarRecordatoriosCitas(d.citas).catch(() => {});
  }, []);

  useEffect(() => {
    if (!userId) {
      cancelarRecordatoriosCitas().catch(() => {});
      return;
    }
    let vigente = true;
    api
      .listarCitas()
      .then((citas) => vigente && aplicar({ userId, citas }))
      .catch((e) => vigente && setError({ userId, mensaje: mensajeError(e) }));
    return () => {
      vigente = false;
    };
  }, [userId, version, aplicar]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') setVersion((v) => v + 1);
    });
    return () => sub.remove();
  }, []);

  const actuales = datos && datos.userId === userId ? datos : null;
  const errorActual = error && error.userId === userId ? error.mensaje : null;

  const value = useMemo<Ctx>(() => {
    const citas = actuales?.citas ?? [];
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const proximas = citas.filter((c) => !c.completada && new Date(c.fecha) >= hoy);
    const pasadas = citas.filter((c) => c.completada || new Date(c.fecha) < hoy).reverse();
    const recargar = async () => {
      if (userId) aplicar({ userId, citas: await api.listarCitas() });
    };
    return {
      citas,
      proximas,
      pasadas,
      proxima: proximas.find((c) => new Date(c.fecha) > ahora) ?? proximas[0] ?? null,
      cargando: Boolean(userId) && !actuales && !errorActual,
      error: errorActual,
      recargar,
      async guardar(input, id) {
        if (id) await api.actualizarCita(id, input);
        else await api.crearCita(input);
        await recargar();
      },
      async eliminar(id) {
        await api.eliminarCita(id);
        await recargar();
      },
      async completar(cita, completada) {
        await api.actualizarCita(cita.id, { completada });
        await recargar();
      },
    };
  }, [actuales, errorActual, userId, aplicar, ahora]);

  return <CitasContext.Provider value={value}>{children}</CitasContext.Provider>;
}

export function useCitas() {
  const ctx = useContext(CitasContext);
  if (!ctx) throw new Error('useCitas debe usarse dentro de <CitasProvider>');
  return ctx;
}
