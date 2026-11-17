import { mensajeError } from '@/lib/auth-errors';
import type { Examen } from '@/lib/database.types';
import * as api from '@/lib/examenes-api';
import { useAuth } from '@/providers/auth-provider';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Datos = { userId: string; examenes: Examen[]; miniaturas: Record<string, string> };

type Ctx = {
  examenes: Examen[];
  /** archivo_path → URL firmada (solo imágenes, para miniaturas) */
  miniaturas: Record<string, string>;
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  subir: (archivo: api.ArchivoLocal, datos: api.ExamenInput) => Promise<void>;
  actualizar: (id: string, cambios: Partial<api.ExamenInput>) => Promise<void>;
  eliminar: (examen: Examen) => Promise<void>;
};

const ExamenesContext = createContext<Ctx | null>(null);

async function obtener(userId: string): Promise<Datos> {
  const examenes = await api.listarExamenes();
  const rutas = examenes.filter((e) => e.archivo_path && api.esImagen(e.mime_type)).map((e) => e.archivo_path as string);
  const miniaturas = await api.urlsFirmadas(rutas).catch(() => ({}));
  return { userId, examenes, miniaturas };
}

export function ExamenesProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<{ userId: string; mensaje: string } | null>(null);

  const aplicar = useCallback((d: Datos) => {
    setDatos(d);
    setError(null);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let vigente = true;
    obtener(userId)
      .then((d) => vigente && aplicar(d))
      .catch((e) => vigente && setError({ userId, mensaje: mensajeError(e) }));
    return () => {
      vigente = false;
    };
  }, [userId, aplicar]);

  const actuales = datos && datos.userId === userId ? datos : null;
  const errorActual = error && error.userId === userId ? error.mensaje : null;

  const value = useMemo<Ctx>(() => {
    const recargar = async () => {
      if (userId) aplicar(await obtener(userId));
    };
    return {
      examenes: actuales?.examenes ?? [],
      miniaturas: actuales?.miniaturas ?? {},
      cargando: Boolean(userId) && !actuales && !errorActual,
      error: errorActual,
      recargar,
      async subir(archivo, datosExamen) {
        if (!userId) throw new Error('Inicia sesión para subir exámenes.');
        await api.subirExamen(userId, archivo, datosExamen);
        await recargar();
      },
      async actualizar(id, cambios) {
        await api.actualizarExamen(id, cambios);
        await recargar();
      },
      async eliminar(examen) {
        await api.eliminarExamen(examen);
        await recargar();
      },
    };
  }, [actuales, errorActual, userId, aplicar]);

  return <ExamenesContext.Provider value={value}>{children}</ExamenesContext.Provider>;
}

export function useExamenes() {
  const ctx = useContext(ExamenesContext);
  if (!ctx) throw new Error('useExamenes debe usarse dentro de <ExamenesProvider>');
  return ctx;
}
