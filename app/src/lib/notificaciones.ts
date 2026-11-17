import { aplicaEnDia } from '@/lib/dosis';
import type { Medicamento } from '@/lib/database.types';
import { aFechaISO, horaEnFecha, partesHora, sumarDias } from '@/lib/fechas';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const CANAL_MEDICAMENTOS = 'medicamentos';
const TIPO = 'medicamento';
/** iOS permite máx. 64 notificaciones programadas por app; dejamos margen para citas */
const MAX_PROGRAMADAS = 56;
/** Ventana para tratamientos con fecha de fin o que empiezan en el futuro */
const DIAS_VENTANA = 14;

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

export async function cancelarRecordatoriosMedicamentos() {
  if (!soportado) return;
  const programadas = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    programadas
      .filter((n) => n.content.data?.tipo === TIPO)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

type Programacion = { id: string; m: Medicamento; trigger: Notifications.NotificationTriggerInput; orden: number };

function planificar(meds: Medicamento[], ahora = new Date()): Programacion[] {
  const hoyISO = aFechaISO(ahora);
  const repetitivas: Programacion[] = [];
  const fechadas: Programacion[] = [];

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
          if (fecha <= ahora) continue;
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

  fechadas.sort((a, b) => a.orden - b.orden);
  return [...repetitivas, ...fechadas].slice(0, MAX_PROGRAMADAS);
}

/**
 * Reprograma TODOS los recordatorios de medicamentos según la lista actual.
 * Se llama al abrir la app y después de crear, editar o eliminar un medicamento.
 */
export async function sincronizarRecordatorios(meds: Medicamento[]) {
  if (!soportado) return { programadas: 0 };
  try {
    if ((await estadoPermiso()) !== 'concedido') return { programadas: 0 };
    await crearCanalAndroid();
    await cancelarRecordatoriosMedicamentos();

    const plan = planificar(meds);
    let programadas = 0;
    for (const p of plan) {
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: p.id,
          content: {
            title: '💊 Hora de tu medicamento',
            body: [p.m.nombre, p.m.dosis, p.m.cantidad].filter(Boolean).join(' · '),
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
