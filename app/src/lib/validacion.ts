export const correoValido = (c: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.trim());
export const CLAVE_MIN = 8;

/** Teléfono: dígitos con espacios, guiones, paréntesis o "+" inicial; entre 7 y 15 dígitos. */
export const telefonoValido = (t: string) => {
  const limpio = t.trim();
  if (!/^\+?[\d\s()-]+$/.test(limpio)) return false;
  const digitos = limpio.replace(/\D/g, '').length;
  return digitos >= 7 && digitos <= 15;
};
