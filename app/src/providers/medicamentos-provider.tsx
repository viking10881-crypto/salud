import { mensajeError } from '@/lib/auth-errors';
import type { Medicamento, Toma } from '@/lib/database.types';
import { type Dosis, dosisDelDia, proximaDosis } from '@/lib/dosis';
import { aFechaISO, inicioDelDia, sumarDias } from '@/lib/fechas';
import * as api from '@/lib/medicamentos-api';
import { cancelarRecordatoriosMedicamentos, sincronizarRecordatorios } from '@/lib/notificaciones';
import { useAuth } from '@/providers/auth-provider';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

/** Días de historial de tomas que se cargan (para el cumplimiento en Mi Salud) */
export const DIAS_HISTORIAL = 30;

type Datos = { userId: string; meds: Medicamento[]; tomas: Toma[] };

type Ctx = {
  medicamentos: Medicamento[];
  tomas: Toma[];
  dosisHoy: Dosis[];
  /** Tratamientos con fecha de fin ya pasada (los más recientes primero) */
  terminados: Medicamento[];
  proxima: Dosis | null;
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  guardar: (input: api.MedicamentoInput, id?: string) => Promise<void>;
  eliminar: (id: string) => Promise<void>;
  tomar: (dosis: Dosis) => Promise<void>;
  deshacer: (dosis: Dosis) => Promise<void>;
};

const MedicamentosContext = createContext<Ctx | null>(null);

async function obtenerDatos(uid: string): Promise<Datos> {
  const [meds, tomas] = await Promise.all([
    api.listarMedicamentos(),
    api.listarTomas(sumarDias(inicioDelDia(new Date()), -(DIAS_HISTORIAL - 1))),
  ]);
  return { userId: uid, meds, tomas };
}

export function MedicamentosProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<{ userId: string; mensaje: string } | null>(null);
  const [ahora, setAhora] = useState(() => new Date());
  /** Se incrementa para forzar una recarga (p. ej. al volver a primer plano) */
  const [version, setVersion] = useState(0);

  const aplicar = useCallback((d: Datos) => {
    setDatos(d);
    setError(null);
    setAhora(new Date());
    sincronizarRecordatorios(d.meds, d.tomas).catch(() => {});
  }, []);

  // Cargar al iniciar sesión (y en cada recarga); al cerrar sesión, quitar los avisos del teléfono
  useEffect(() => {
    if (!userId) {
      cancelarRecordatoriosMedicamentos().catch(() => {});
      return;
    }
    let vigente = true;
    obtenerDatos(userId)
      .then((d) => vigente && aplicar(d))
      .catch((e) => vigente && setError({ userId, mensaje: mensajeError(e) }));
    return () => {
      vigente = false;
    };
  }, [userId, version, aplicar]);

  // Al volver a primer plano: refrescar (cambio de día, nuevas tomas, ventana de avisos)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') setVersion((v) => v + 1);
    });
    return () => sub.remove();
  }, []);

  // Solo usar datos de la sesión actual
  const actuales = datos && datos.userId === userId ? datos : null;
  const medicamentos = useMemo(() => actuales?.meds ?? [], [actuales]);
  const tomas = useMemo(() => actuales?.tomas ?? [], [actuales]);
  const errorActual = error && error.userId === userId ? error.mensaje : null;

  const value = useMemo<Ctx>(() => {
    const recargar = async () => {
      if (userId) aplicar(await obtenerDatos(userId));
    };
    return {
      medicamentos,
      tomas,
      dosisHoy: dosisDelDia(medicamentos, tomas, ahora, ahora),
      terminados: medicamentos
        .filter((m) => m.fecha_fin !== null && m.fecha_fin < aFechaISO(ahora))
        .sort((a, b) => (b.fecha_fin ?? '').localeCompare(a.fecha_fin ?? '')),
      proxima: proximaDosis(medicamentos, tomas, ahora),
      cargando: Boolean(userId) && !actuales && !errorActual,
      error: errorActual,
      recargar,
      async guardar(input, id) {
        if (id) await api.actualizarMedicamento(id, input);
        else await api.crearMedicamento(input);
        await recargar();
      },
      async eliminar(id) {
        await api.eliminarMedicamento(id);
        await recargar();
      },
      async tomar(d) {
        await api.marcarTomada(d.medicamento.id, d.programada);
        await recargar();
      },
      async deshacer(d) {
        if (d.toma) await api.desmarcarToma(d.toma.id);
        await recargar();
      },
    };
  }, [medicamentos, tomas, ahora, userId, actuales, errorActual, aplicar]);

  return <MedicamentosContext.Provider value={value}>{children}</MedicamentosContext.Provider>;
}

export function useMedicamentos() {
  const ctx = useContext(MedicamentosContext);
  if (!ctx) throw new Error('useMedicamentos debe usarse dentro de <MedicamentosProvider>');
  return ctx;
}
