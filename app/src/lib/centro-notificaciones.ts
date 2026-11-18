import type { Cita } from '@/lib/database.types';
import type { Dosis } from '@/lib/dosis';
import { formatoHoraDate, sumarDias, tiempoRelativo } from '@/lib/fechas';

export type Aviso = {
  id: string;
  tipo: 'atrasada' | 'dosis' | 'cita' | 'doctora';
  titulo: string;
  cuerpo: string;
  /** Texto de tiempo a la derecha ("hace 5 min", "en 2 h"…) */
  cuando: string;
  dosis?: Dosis;
  cita?: Cita;
};

export type GrupoAvisos = { titulo: string; avisos: Aviso[] };

const DIAS_CITAS = 7;
const diaCitaFmt = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });

const nombreDosis = (d: Dosis) => `${d.medicamento.nombre} ${d.medicamento.dosis}`.trim();

/** Notificaciones del centro: lo pendiente primero, después lo que viene. */
export function armarAvisos(dosisHoy: Dosis[], citas: Cita[], ahora: Date): GrupoAvisos[] {
  const atrasadas = dosisHoy.filter((d) => d.estado === 'atrasada');
  const pendientes = dosisHoy.filter((d) => d.estado === 'pendiente');
  const limite = sumarDias(ahora, DIAS_CITAS);
  const proximasCitas = citas
    .filter((c) => !c.completada)
    .map((c) => ({ c, f: new Date(c.fecha) }))
    .filter(({ f }) => f >= ahora && f <= limite)
    .sort((a, b) => a.f.getTime() - b.f.getTime());

  const ahoraMismo: Aviso[] = atrasadas.map((d) => ({
    id: `atrasada-${d.clave}`,
    tipo: 'atrasada',
    titulo: 'Dosis pendiente',
    cuerpo: `Programada a las ${formatoHoraDate(d.programada)}: es hora de tomar tu ${nombreDosis(d)}${d.medicamento.cantidad ? ` (${d.medicamento.cantidad})` : ''}.`,
    cuando: tiempoRelativo(d.programada, ahora),
    dosis: d,
  }));

  if (dosisHoy.length > 0 && atrasadas.length === 0 && pendientes.length === 0) {
    ahoraMismo.push({
      id: 'doctora-felicitacion',
      tipo: 'doctora',
      titulo: 'Dra. Salud',
      cuerpo: '¡Excelente! Ya tomaste todas tus dosis de hoy. Sigue así 💜',
      cuando: 'hoy',
    });
  }

  const proximamente: Aviso[] = [
    ...pendientes.map<Aviso>((d) => ({
      id: `dosis-${d.clave}`,
      tipo: 'dosis',
      titulo: 'Próxima dosis',
      cuerpo: `${nombreDosis(d)} a las ${formatoHoraDate(d.programada)}`,
      cuando: tiempoRelativo(d.programada, ahora),
      dosis: d,
    })),
    ...proximasCitas.map<Aviso>(({ c, f }) => ({
      id: `cita-${c.id}`,
      tipo: 'cita',
      titulo: `Cita: ${c.especialidad}`,
      cuerpo: [
        `${diaCitaFmt.format(f)}, ${formatoHoraDate(f)}`,
        c.doctor,
        c.lugar,
      ]
        .filter(Boolean)
        .join(' · '),
      cuando: tiempoRelativo(f, ahora),
      cita: c,
    })),
  ];

  return [
    { titulo: 'Ahora', avisos: ahoraMismo },
    { titulo: 'Próximamente', avisos: proximamente },
  ].filter((g) => g.avisos.length > 0);
}

/** Número para la insignia de la campana: lo que requiere atención. */
export function contarAvisos(grupos: GrupoAvisos[]): number {
  return grupos.reduce((n, g) => n + g.avisos.filter((a) => a.tipo !== 'doctora').length, 0);
}
