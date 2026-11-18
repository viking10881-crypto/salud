export type TipoMedico = 'doctor' | 'doctora';

// "Dra", "Dra.", "Doctora" / "Dr", "Dr.", "Doctor" al inicio del nombre (sin importar mayúsculas)
const PREFIJO_DOCTORA = /^\s*(dra\.?|doctora)(\s+|$)/i;
const PREFIJO_DOCTOR = /^\s*(dr\.?|doctor)(\s+|$)/i;

/** Reconoce si el nombre es de un doctor o una doctora por su prefijo. null si no lo indica. */
export function tipoMedico(nombre: string | null | undefined): TipoMedico | null {
  if (!nombre) return null;
  if (PREFIJO_DOCTORA.test(nombre)) return 'doctora';
  if (PREFIJO_DOCTOR.test(nombre)) return 'doctor';
  return null;
}

/** Pone (o cambia) el prefijo "Dr." / "Dra." al nombre. */
export function conPrefijo(nombre: string, tipo: TipoMedico): string {
  const sinPrefijo = nombre.replace(PREFIJO_DOCTORA, '').replace(PREFIJO_DOCTOR, '').trimStart();
  return `${tipo === 'doctora' ? 'Dra.' : 'Dr.'} ${sinPrefijo}`;
}
