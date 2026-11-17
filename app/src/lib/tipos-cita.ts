import {
  Activity,
  Apple,
  Baby,
  Brain,
  CalendarDays,
  ClipboardCheck,
  Eye,
  HeartPulse,
  type LucideIcon,
  ScanLine,
  Siren,
  Smile,
  Stethoscope,
  Syringe,
  TestTube,
  Venus,
} from 'lucide-react-native';

/**
 * Tipos de cita. Mantener sincronizado con el CHECK de la tabla `citas`
 * (supabase/migrations/20261117000000_mas_tipos_cita.sql).
 */
export const TIPOS_CITA = [
  { valor: 'general', texto: 'Medicina general', icono: Stethoscope },
  { valor: 'especialista', texto: 'Especialista', icono: HeartPulse },
  { valor: 'control', texto: 'Control', icono: ClipboardCheck },
  { valor: 'odontologia', texto: 'Odontología', icono: Smile },
  { valor: 'laboratorio', texto: 'Laboratorio', icono: TestTube },
  { valor: 'imagenes', texto: 'Imágenes diagnósticas', icono: ScanLine },
  { valor: 'terapia', texto: 'Terapia', icono: Activity },
  { valor: 'psicologia', texto: 'Psicología', icono: Brain },
  { valor: 'oftalmologia', texto: 'Oftalmología', icono: Eye },
  { valor: 'ginecologia', texto: 'Ginecología', icono: Venus },
  { valor: 'pediatria', texto: 'Pediatría', icono: Baby },
  { valor: 'nutricion', texto: 'Nutrición', icono: Apple },
  { valor: 'vacunacion', texto: 'Vacunación', icono: Syringe },
  { valor: 'urgencias', texto: 'Urgencias', icono: Siren },
  { valor: 'otro', texto: 'Otro', icono: CalendarDays },
] as const satisfies readonly { valor: string; texto: string; icono: LucideIcon }[];

export type TipoCita = (typeof TIPOS_CITA)[number]['valor'];

const POR_VALOR = new Map<string, (typeof TIPOS_CITA)[number]>(TIPOS_CITA.map((t) => [t.valor, t]));

export const tipoCita = (valor: string) => POR_VALOR.get(valor) ?? TIPOS_CITA[TIPOS_CITA.length - 1];
