import { aplicaEnDia } from '@/lib/dosis';
import type { Cita, Medicamento, Toma } from '@/lib/database.types';
import { aFechaISO, horaEnFecha, partesHora, sumarDias } from '@/lib/fechas';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const CANAL_MEDICAMENTOS = 'medicamentos';
const TIPO = 'medicamento';
const TIPO_CITA = 'cita';
/** iOS permite máx. 64 notificaciones programadas por app: 52 medicamentos + 10 citas */
const MAX_PROGRAMADAS = 52;
const MAX_CITAS = 10;
/** Ventana para tratamientos con fecha de fin o que empiezan en el futuro */
const DIAS_VENTANA = 14;
/** Avisos repetidos si la dosis no se marca: cada 10 min, hasta 3 veces */
export const REPETICIONES = 3;
const INTERVALO_REPETICION_MIN = 10;
/** Ventana de los avisos repetidos (se recalculan al abrir la app o al marcar una dosis) */
const HORAS_VENTANA_REPETICION = 48;

const soportado = Platform.OS !== 'web';

// Mostrar la notificación aunque la app esté abierta.
// shouldPlaySound debe ser true: en Android, false oculta el aviso emergente.
if (soportado) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Canal de Android para los recordatorios. En algunas versiones de Expo Go
 * setNotificationChannelAsync falla (NullPointerException nativo): se reintenta con la
 * configuración mínima y, si aun así falla, se usa el canal por defecto de Expo.
 */
let canalDisponible: boolean | null = null;

async function crearCanalAndroid(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (canalDisponible !== null) return canalDisponible;
  const configuraciones: Notifications.NotificationChannelInput[] = [
    {
      name: 'Recordatorios de medicamentos',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500, 250, 500],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    },
    { name: 'Recordatorios de medicamentos', importance: Notifications.AndroidImportance.HIGH },
  ];
  for (const config of configuraciones) {
    try {
      await Notifications.setNotificationChannelAsync(CANAL_MEDICAMENTOS, config);
      canalDisponible = true;
      return true;
    } catch (e) {
      console.warn('[notificaciones] No se pudo crear el canal:', e);
    }
  }
  canalDisponible = false;
  return false;
}

/** channelId para los triggers solo si el canal propio existe */
const canal = () => (canalDisponible ? { channelId: CANAL_MEDICAMENTOS } : {});

export type EstadoPermiso = 'concedido' | 'denegado' | 'sin-preguntar' | 'no-soportado';

export async function estadoPermiso(): Promise<EstadoPermiso> {
  if (!soportado) return 'no-soportado';
  const p = await Notifications.getPermissionsAsync();
  if (p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'concedido';
  return p.status === 'undetermined' || p.canAskAgain ? 'sin-preguntar' : 'denegado';
}

/** Pide permiso si aún no se ha dado. En Android 13+ el canal debe existir antes de pedirlo. */
export async function asegurarPermiso(): Promise<boolean> {
  if (!soportado) return false;
  try {
    await crearCanalAndroid();
    const actual = await estadoPermiso();
    if (actual === 'concedido') return true;
    if (actual === 'denegado') return false;
    const r = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return r.granted || r.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  } catch (e) {
    console.warn('[notificaciones] Error al pedir permiso:', e);
    return false;
  }
}

async function cancelarPorTipo(tipo: string) {
  if (!soportado) return;
  const programadas = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    programadas
      .filter((n) => n.content.data?.tipo === tipo)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

export const cancelarRecordatoriosMedicamentos = () => cancelarPorTipo(TIPO);
export const cancelarRecordatoriosCitas = () => cancelarPorTipo(TIPO_CITA);

type Programacion = {
  id: string;
  m: Medicamento;
  trigger: Notifications.NotificationTriggerInput;
  orden: number;
  /** 1…REPETICIONES si es un aviso repetido; undefined si es el aviso principal */
  repeticion?: number;
};

const claveDosis = (medicamentoId: string, fecha: Date) => `${medicamentoId}@${fecha.getTime()}`;

function planificar(meds: Medicamento[], tomas: Toma[], ahora = new Date()): Programacion[] {
  const hoyISO = aFechaISO(ahora);
  const repetitivas: Programacion[] = [];
  const fechadas: Programacion[] = [];
  const seguimientos: Programacion[] = [];
  // Dosis ya registradas (tomadas u omitidas): no se vuelven a avisar
  const registradas = new Set(
    tomas.filter((t) => t.tomada_en || t.omitida).map((t) => claveDosis(t.medicamento_id, new Date(t.programada_para)))
  );
  const limiteRepeticion = ahora.getTime() + HORAS_VENTANA_REPETICION * 3_600_000;

  for (const m of meds) {
    if (!m.activo || m.horarios.length === 0) continue;
    if (m.fecha_fin && m.fecha_fin < hoyISO) continue;

    const indefinido = !m.fecha_fin && m.fecha_inicio <= hoyISO;
    const dias = m.dias_semana && m.dias_semana.length > 0 && m.dias_semana.length < 7 ? m.dias_semana : null;

    if (indefinido) {
      // Recordatorios que se repiten solos, sin necesidad de abrir la app
      for (const hora of m.horarios) {
        const { h, m: min } = partesHora(hora);
        if (!dias) {
          repetitivas.push({
            id: `med-${m.id}-d-${hora}`,
            m,
            orden: 0,
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: min, ...canal() },
          });
        } else {
          for (const dia of dias) {
            repetitivas.push({
              id: `med-${m.id}-w${dia}-${hora}`,
              m,
              orden: 0,
              // expo-notifications: 1 = domingo … 7 = sábado; en la BD 0 = domingo
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                weekday: dia + 1,
                hour: h,
                minute: min,
                ...canal(),
              },
            });
          }
        }
      }
    } else {
      // Tratamiento con fecha de fin o que empieza después: fechas concretas en la ventana
      for (let i = 0; i < DIAS_VENTANA; i++) {
        const dia = sumarDias(ahora, i);
        if (!aplicaEnDia(m, dia)) continue;
        for (const hora of m.horarios) {
          const fecha = horaEnFecha(hora, dia);
          if (fecha <= ahora || registradas.has(claveDosis(m.id, fecha))) continue;
          fechadas.push({
            id: `med-${m.id}-f-${fecha.getTime()}`,
            m,
            orden: fecha.getTime(),
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fecha, ...canal() },
          });
        }
      }
    }
  }

  // Avisos repetidos para las dosis de ayer (por si cruzan la medianoche), hoy y los próximos 2 días
  for (const m of meds) {
    if (!m.activo) continue;
    for (let i = -1; i <= 2; i++) {
      const dia = sumarDias(ahora, i);
      if (!aplicaEnDia(m, dia)) continue;
      for (const hora of m.horarios) {
        const programada = horaEnFecha(hora, dia);
        if (registradas.has(claveDosis(m.id, programada))) continue;
        for (let k = 1; k <= REPETICIONES; k++) {
          const cuando = programada.getTime() + k * INTERVALO_REPETICION_MIN * 60_000;
          if (cuando <= ahora.getTime() || cuando > limiteRepeticion) continue;
          seguimientos.push({
            id: `med-${m.id}-r${k}-${programada.getTime()}`,
            m,
            orden: cuando,
            repeticion: k,
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(cuando), ...canal() },
          });
        }
      }
    }
  }

  // Prioridad: los repetitivos (no dependen de abrir la app) y luego lo más cercano en el tiempo
  const porFecha = [...fechadas, ...seguimientos].sort((a, b) => a.orden - b.orden);
  return [...repetitivas, ...porFecha].slice(0, MAX_PROGRAMADAS);
}

/**
 * Reprograma TODOS los recordatorios de medicamentos según la lista actual y las tomas
 * registradas. Se llama al abrir la app, al volver a primer plano y después de crear,
 * editar o eliminar un medicamento o de marcar una dosis (así se cancelan sus avisos repetidos).
 */
export async function sincronizarRecordatorios(meds: Medicamento[], tomas: Toma[] = []) {
  if (!soportado) return { programadas: 0 };
  try {
    if ((await estadoPermiso()) !== 'concedido') return { programadas: 0 };
    await crearCanalAndroid();
    await cancelarRecordatoriosMedicamentos();

    const plan = planificar(meds, tomas);
    let programadas = 0;
    for (const p of plan) {
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: p.id,
          content: {
            title: p.repeticion ? '⏰ ¿Ya tomaste tu medicamento?' : '💊 Hora de tu medicamento',
            body:
              [p.m.nombre, p.m.dosis, p.m.cantidad].filter(Boolean).join(' · ') +
              (p.repeticion ? ` — aviso ${p.repeticion} de ${REPETICIONES}. Márcalo en Salud+.` : ''),
            data: { tipo: TIPO, medicamentoId: p.m.id, url: '/medicamentos' },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: p.trigger,
        });
        programadas++;
      } catch (e) {
        console.warn('[notificaciones] No se pudo programar', p.id, e);
      }
    }
    return { programadas };
  } catch (e) {
    console.warn('[notificaciones] Error al sincronizar:', e);
    return { programadas: 0 };
  }
}

const horaCitaFmt = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** '1 hora', '30 minutos', '1 día' */
export function describirAntelacion(minutos: number) {
  if (minutos % 1440 === 0) return minutos === 1440 ? '1 día' : `${minutos / 1440} días`;
  if (minutos % 60 === 0) return minutos === 60 ? '1 hora' : `${minutos / 60} horas`;
  return `${minutos} minutos`;
}

/** Reprograma los avisos de las próximas citas (según recordatorio_minutos de cada una). */
export async function sincronizarRecordatoriosCitas(citas: Cita[]) {
  if (!soportado) return { programadas: 0 };
  try {
    if ((await estadoPermiso()) !== 'concedido') return { programadas: 0 };
    await crearCanalAndroid();
    await cancelarRecordatoriosCitas();

    const ahora = Date.now();
    const plan = citas
      .filter((c) => !c.completada && c.recordatorio_minutos)
      .map((c) => ({ c, cuando: new Date(c.fecha).getTime() - (c.recordatorio_minutos ?? 0) * 60_000 }))
      .filter((p) => p.cuando > ahora)
      .sort((a, b) => a.cuando - b.cuando)
      .slice(0, MAX_CITAS);

    let programadas = 0;
    for (const { c, cuando } of plan) {
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: `cita-${c.id}`,
          content: {
            title: `🩺 Cita en ${describirAntelacion(c.recordatorio_minutos ?? 0)}`,
            body: [c.especialidad, c.doctor, horaCitaFmt.format(new Date(c.fecha)), c.lugar].filter(Boolean).join(' · '),
            data: { tipo: TIPO_CITA, citaId: c.id, url: '/citas' },
            sound: true,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(cuando), ...canal() },
        });
        programadas++;
      } catch (e) {
        console.warn('[notificaciones] No se pudo programar la cita', c.id, e);
      }
    }
    return { programadas };
  } catch (e) {
    console.warn('[notificaciones] Error al sincronizar citas:', e);
    return { programadas: 0 };
  }
}
