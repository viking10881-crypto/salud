import type { Examen } from '@/lib/database.types';
import { ClipboardList, File, type LucideIcon, ScanLine, Stethoscope, TestTube, Waves } from 'lucide-react-native';

/** Mantener sincronizado con el CHECK de examenes.categoria */
export const CATEGORIAS_EXAMEN: { valor: Examen['categoria']; texto: string; icono: LucideIcon }[] = [
  { valor: 'laboratorio', texto: 'Laboratorio', icono: TestTube },
  { valor: 'radiografia', texto: 'Radiografía', icono: ScanLine },
  { valor: 'ecografia', texto: 'Ecografía', icono: Waves },
  { valor: 'formula', texto: 'Fórmula médica', icono: ClipboardList },
  { valor: 'diagnostico', texto: 'Diagnóstico', icono: Stethoscope },
  { valor: 'otro', texto: 'Otro', icono: File },
];

const POR_VALOR = new Map(CATEGORIAS_EXAMEN.map((c) => [c.valor, c]));
export const categoriaExamen = (v: string) => POR_VALOR.get(v as Examen['categoria']) ?? CATEGORIAS_EXAMEN[5];
