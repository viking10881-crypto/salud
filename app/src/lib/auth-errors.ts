import { AuthError } from '@supabase/supabase-js';

const MENSAJES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Debes confirmar tu correo. Revisa tu bandeja de entrada.',
  user_already_exists: 'Ya existe una cuenta con este correo.',
  email_exists: 'Ya existe una cuenta con este correo.',
  weak_password: 'La contraseña es muy débil. Usa al menos 8 caracteres.',
  over_email_send_rate_limit: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  over_request_rate_limit: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  validation_failed: 'Revisa los datos ingresados.',
  email_address_invalid: 'El correo no es válido.',
  signup_disabled: 'El registro está deshabilitado temporalmente.',
};

export function mensajeError(error: unknown): string {
  if (error instanceof AuthError) {
    if (error.code && MENSAJES[error.code]) return MENSAJES[error.code];
    if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
      return 'No hay conexión con el servidor. Revisa tu internet.';
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}
