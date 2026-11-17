import type { Medicamento, Toma } from '@/lib/database.types';
import { aFechaISO, horaEnFecha, inicioDelDia, sumarDias } from '@/lib/fechas';

export type Dosis = {
  /** clave estable: medicamentoId + fecha/hora programada */
  clave: string;
  medicamento: Medicamento;
  programada: Date;
  toma: Toma | null;
  estado: 'tomada' | 'pendiente' | 'atrasada' | 'omitida';
};

/** ¿El medicamento aplica ese día? (activo, dentro del rango y del día de la semana) */
export function aplicaEnDia(m: Medicamento, dia: Date) {
  if (!m.activo) return false;
  const iso = aFechaISO(dia);
  if (iso < m.fecha_inicio) return false;
  if (m.fecha_fin && iso > m.fecha_fin) return false;
  if (m.dias_semana && m.dias_semana.length > 0 && !m.dias_semana.includes(dia.getDay())) return false;
  return true;
}

const claveToma = (medicamentoId: string, fecha: Date) => `${medicamentoId}@${fecha.getTime()}`;

/** Margen tras la hora programada antes de considerar una dosis "atrasada" */
const MARGEN_MS = 30 * 60 * 1000;

/** Dosis programadas de un día, cruzadas con las tomas registradas */
export function dosisDelDia(meds: Medicamento[], tomas: Toma[], dia: Date = new Date(), ahora = new Date()): Dosis[] {
  const porClave = new Map(tomas.map((t) => [claveToma(t.medicamento_id, new Date(t.programada_para)), t]));
  const resultado: Dosis[] = [];
  for (const m of meds) {
    if (!aplicaEnDia(m, dia)) continue;
    for (const hora of m.horarios) {
      const programada = horaEnFecha(hora, dia);
      const clave = claveToma(m.id, programada);
      const toma = porClave.get(clave) ?? null;
      const estado: Dosis['estado'] = toma?.tomada_en
        ? 'tomada'
        : toma?.omitida
          ? 'omitida'
          : ahora.getTime() > programada.getTime() + MARGEN_MS
            ? 'atrasada'
            : 'pendiente';
      resultado.push({ clave, medicamento: m, programada, toma, estado });
    }
  }
  return resultado.sort((a, b) => a.programada.getTime() - b.programada.getTime());
}

/**
 * Próxima dosis por tomar: primero las de hoy aún sin tomar (incluye atrasadas),
 * si no hay, la primera de los próximos días.
 */
export function proximaDosis(meds: Medicamento[], tomas: Toma[], ahora = new Date()): Dosis | null {
  const hoy = dosisDelDia(meds, tomas, ahora, ahora).find((d) => d.estado === 'pendiente' || d.estado === 'atrasada');
  if (hoy) return hoy;
  for (let i = 1; i <= 7; i++) {
    const d = dosisDelDia(meds, [], sumarDias(ahora, i), ahora)[0];
    if (d) return d;
  }
  return null;
}

/** Cumplimiento por medicamento en los últimos `dias` días (solo dosis ya vencidas) */
export function adherencia(meds: Medicamento[], tomas: Toma[], dias = 30, ahora = new Date()) {
  const desde = sumarDias(inicioDelDia(ahora), -(dias - 1));
  const tomadas = new Set(tomas.filter((t) => t.tomada_en).map((t) => claveToma(t.medicamento_id, new Date(t.programada_para))));
  return meds
    .map((m) => {
      let programadas = 0;
      let cumplidas = 0;
      for (let dia = desde; dia <= ahora; dia = sumarDias(dia, 1)) {
        if (!aplicaEnDiaHistorico(m, dia)) continue;
        for (const hora of m.horarios) {
          const p = horaEnFecha(hora, dia);
          if (p > ahora) continue;
          programadas++;
          if (tomadas.has(claveToma(m.id, p))) cumplidas++;
        }
      }
      return { medicamento: m, programadas, cumplidas, porcentaje: programadas ? Math.round((cumplidas / programadas) * 100) : null };
    })
    .filter((a) => a.programadas > 0);
}

// Para el histórico no importa si hoy está inactivo: cuenta lo que estuvo programado
function aplicaEnDiaHistorico(m: Medicamento, dia: Date) {
  return aplicaEnDia({ ...m, activo: true }, dia);
}
