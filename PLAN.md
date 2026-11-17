# Plan de desarrollo — Salud+

## ✅ Hecho

- **Paso 0 · Base del proyecto:** Expo SDK 58, Expo Router, NativeWind, componentes shadcn (React Native Reusables) y pantallas iniciales con datos de ejemplo.
- **Paso 1 · Supabase:** registro, inicio de sesión, confirmación por correo, recuperar contraseña y cerrar sesión. Sesión cifrada y rutas protegidas. Base de datos con RLS (`supabase/migrations/`), ya aplicada en el proyecto de Supabase. Probado en el celular el 2026-11-16.

- **Paso 2 · Recordatorios de medicamentos** (implementado el 2026-11-17, falta probarlo en el celular): formulario para agregar y editar, la pantalla Mis Medicamentos con datos reales, el registro de tomas, notificaciones locales y el cumplimiento en Mi Salud.

- **Paso 3 · Citas médicas** (implementado el 2026-11-17, falta probarlo en el celular): crear, editar y eliminar citas, 15 tipos de cita, aviso con anticipación (30 min, 1 h, 2 h o 1 día), marcar como asistida, calendario mensual, y Inicio e Historial con las citas reales.
  - ⚠️ Requiere ejecutar en Supabase `supabase/migrations/20261117000000_mas_tipos_cita.sql`.
- **Avisos repetidos de medicamentos:** cada 10 minutos, hasta 3 veces, mientras la dosis no se marque (se calculan para las próximas 48 h).
- **Paso 4 · Expediente médico** (implementado el 2026-11-17, falta probarlo en el celular): subir con foto, galería o archivo PDF al bucket privado; categorías y filtro; miniaturas con URLs firmadas; abrir, editar y eliminar; Historial con los exámenes reales.

## ⏭️ Pendiente (en orden)

### ~~Paso 2 · Recordatorios de medicamentos~~ (ver Hecho)
1. Formulario para **agregar y editar** medicamentos: nombre, dosis, cantidad, horarios del día, días de la semana, fecha de inicio y de fin, y notas. Se guarda en la tabla `medicamentos`.
2. Pantalla **Mis Medicamentos** con datos reales: la próxima dosis, las dosis del día y el botón "Marcar como tomado", que guarda en la tabla `tomas`.
3. **Notificaciones locales** con `expo-notifications` a la hora de cada dosis, también con la app cerrada. Se reprograman al agregar, editar o desactivar un medicamento.
   - Antes de empezar, revisar la documentación de SDK 58: en Android, Expo Go no permite *push* remotas, pero se espera que las locales sí funcionen.
4. **Inicio** y **Mi Salud** con datos reales: el próximo medicamento y el porcentaje de cumplimiento del tratamiento.

### ~~Paso 3 · Citas médicas~~ (ver Hecho)
- Crear, editar y eliminar citas en la tabla `citas`.
- Recordatorio antes de cada cita (`recordatorio_minutos`).
- Marcar la cita como completada.
- Vista de calendario.

### ~~Paso 4 · Expediente médico (exámenes)~~ (ver Hecho)
- Subir imágenes y PDF con `expo-document-picker` / `expo-image-picker` al bucket privado `examenes` (`<user_id>/archivo`).
- Lista por categoría: laboratorio, radiografía, ecografía, fórmula, diagnóstico.
- Ver y descargar los archivos con URLs firmadas.

### Paso 5 · Historial y perfil
- Historial con datos reales: citas pasadas, exámenes y tratamientos terminados.
- Editar "Mis Datos": fecha de nacimiento, teléfono, tipo de sangre y alergias.

### Paso 6 · Avatar 3D de la doctora virtual
- Convertir `avatar/enfermera-app.stl` (68 MB) a **GLB** comprimido (con Blender y Draco), con colores y materiales.
- Mostrarlo con React Three Fiber en Bienvenida, Inicio y Perfil. Reemplaza a `DoctoraAvatar`.
- Mensajes de la doctora: bienvenida, recordatorios y felicitaciones.
- Sacar el STL del repositorio o pasarlo a Git LFS.
- Usar un personaje original para la doctora, no uno con derechos de autor de terceros.

### Despliegue (cuando el usuario lo indique)
- APK de Android o *development build* con EAS. El usuario ya inició sesión en EAS en esta PC.
- **Decidir antes** el identificador de la app en Android (por ejemplo `com.delasoft.saludplus`), porque no se puede cambiar después de publicar.
- Configurar `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_KEY` como variables de EAS: el `.env` no se sube.
- Con esa versión propia: alarma de verdad (sonido propio, *alarmClock*/alarma exacta) y el botón "Tomado" en la notificación.

## 🔧 Detalles pendientes
- Confirmar en el celular que el error del canal de notificaciones de Android quedó resuelto.
- **Enlace del correo de confirmación:** hoy abre `localhost:3000`. Configurar en Supabase la *Site URL* y las *Redirect URLs*: un deep link `saludplus://` o una página web.
- Inicio de sesión con **Google** y **Apple**: los botones ya están, desactivados.
- Borrar la carpeta local `app-sdk58-respaldo/`, que ya no se usa.
