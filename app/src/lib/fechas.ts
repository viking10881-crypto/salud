// Utilidades de fecha en HORA LOCAL (no usar toISOString para fechas: convierte a UTC).

const pad = (n: number) => String(n).padStart(2, '0');

/** Date → 'YYYY-MM-DD' en hora local */
export const aFechaISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 'YYYY-MM-DD' → Date a medianoche local */
export const deFechaISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Date → 'HH:MM' */
export const aHora = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** 'HH:MM' o 'HH:MM:SS' → { h, m } */
export const partesHora = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return { h, m };
};

/** 'HH:MM[:SS]' → Date de hoy a esa hora (o del día indicado) */
export const horaEnFecha = (hora: string, dia: Date = new Date()) => {
  const { h, m } = partesHora(hora);
  return new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), h, m, 0, 0);
};

const horaFmt = new Intl.DateTimeFormat('es', { hour: 'numeric', minute: '2-digit', hour12: true });
const fechaCortaFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' });

/** '20:00:00' → '8:00 p. m.' */
export const formatoHora12 = (hora: string) => horaFmt.format(horaEnFecha(hora));
export const formatoHoraDate = (d: Date) => horaFmt.format(d);
export const formatoFechaCorta = (iso: string) => fechaCortaFmt.format(deFechaISO(iso));

export const inicioDelDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const sumarDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const mismoDia = (a: Date, b: Date) => aFechaISO(a) === aFechaISO(b);

export const DIAS_CORTOS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // 0 = domingo (como Date.getDay)
export const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Edad cumplida en años a partir de una fecha 'YYYY-MM-DD'. */
export function edadDesde(fechaNacimiento: string, hoy: Date = new Date()): number {
  const n = deFechaISO(fechaNacimiento);
  let edad = hoy.getFullYear() - n.getFullYear();
  const yaCumplio =
    hoy.getMonth() > n.getMonth() || (hoy.getMonth() === n.getMonth() && hoy.getDate() >= n.getDate());
  if (!yaCumplio) edad -= 1;
  return edad;
}
