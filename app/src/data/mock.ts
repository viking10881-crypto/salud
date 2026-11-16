// Datos de ejemplo: se reemplazarán por consultas a Supabase en cada módulo.

export type Cita = {
  id: string;
  fecha: string; // ISO
  especialidad: string;
  doctor?: string;
  lugar?: string;
  tipo: 'general' | 'odontologia' | 'especialista';
};

export type Dosis = {
  id: string;
  medicamento: string;
  dosis: string;
  cuando: string;
  hora: string;
  color: 'rosa' | 'verde' | 'morado';
};

export type Examen = { id: string; titulo: string; fecha: string; tipo: 'imagen' | 'laboratorio' | 'pdf' };

export const citas: Cita[] = [
  {
    id: 'c1',
    fecha: '2026-11-21T09:00:00',
    especialidad: 'Medicina Interna',
    doctor: 'Dr. García Pérez',
    lugar: 'Clínica Salud Vida',
    tipo: 'especialista',
  },
  { id: 'c2', fecha: '2026-11-25T10:30:00', especialidad: 'Odontología', tipo: 'odontologia' },
  { id: 'c3', fecha: '2026-12-05T16:00:00', especialidad: 'Medicina General', tipo: 'general' },
];

export const dosis: Dosis[] = [
  { id: 'd1', medicamento: 'Metformina 500 mg', dosis: '1 tableta', cuando: 'Hoy', hora: '8:00 p.m.', color: 'rosa' },
  { id: 'd2', medicamento: 'Losartán 50 mg', dosis: '1 tableta', cuando: 'Mañana', hora: '8:00 a.m.', color: 'rosa' },
  { id: 'd3', medicamento: 'Vitamina D 1000 UI', dosis: '1 cápsula', cuando: 'Mañana', hora: '12:00 p.m.', color: 'verde' },
];

export const examenes: Examen[] = [
  { id: 'e1', titulo: 'Rayos X de tórax', fecha: '2026-10-12', tipo: 'imagen' },
  { id: 'e2', titulo: 'Laboratorio', fecha: '2026-09-05', tipo: 'laboratorio' },
];

const fechaFmt = new Intl.DateTimeFormat('es', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
const horaFmt = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit', hour12: true });

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatoFecha = (iso: string) => capital(fechaFmt.format(new Date(iso)).replace(/\./g, ''));
export const formatoHora = (iso: string) => horaFmt.format(new Date(iso));
