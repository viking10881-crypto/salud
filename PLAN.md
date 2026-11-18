# Plan de desarrollo — Salud+

## ✅ Hecho

- **Paso 0 · Base del proyecto:** Expo SDK 58, Expo Router, NativeWind, componentes shadcn (React Native Reusables) y pantallas iniciales con datos de ejemplo.
- **Paso 1 · Supabase:** registro, inicio de sesión, confirmación por correo, recuperar contraseña y cerrar sesión. Sesión cifrada y rutas protegidas. Base de datos con RLS (`supabase/migrations/`), ya aplicada en el proyecto de Supabase. Probado en el celular el 2026-11-16.

- **Paso 2 · Recordatorios de medicamentos** (implementado el 2026-11-17, falta probarlo en el celular): formulario para agregar y editar, la pantalla Mis Medicamentos con datos reales, el registro de tomas, notificaciones locales y el cumplimiento en Mi Salud.

- **Paso 3 · Citas médicas** (implementado el 2026-11-17, falta probarlo en el celular): crear, editar y eliminar citas, 15 tipos de cita, aviso con anticipación (30 min, 1 h, 2 h o 1 día), marcar como asistida, calendario mensual, y Inicio e Historial con las citas reales.
  - ⚠️ Requiere ejecutar en Supabase `supabase/migrations/20261117000000_mas_tipos_cita.sql`.
- **Avisos repetidos de medicamentos:** cada 10 minutos, hasta 3 veces, mientras la dosis no se marque (se calculan para las próximas 48 h).
- **Paso 4 · Expediente médico** (implementado el 2026-11-17, falta probarlo en el celular): subir con foto, galería o archivo PDF al bucket privado; categorías y filtro; miniaturas con URLs firmadas; abrir, editar y eliminar; Historial con los exámenes reales.

- **Paso 5 · Historial y perfil** (implementado el 2026-11-17, falta probarlo en el celular): pantalla "Mis Datos" para editar nombre, apellido, fecha de nacimiento (con la edad), teléfono, tipo de sangre y alergias; el Perfil muestra la edad, el tipo de sangre, el teléfono y las alergias; el Historial muestra los tratamientos terminados. No requiere SQL nuevo.
- **Paso 6 · Avatar de la doctora** (2026-11-17): primero se hizo en 3D (React Three Fiber), pero se cambió por una **ilustración** a pedido del usuario: `avatar/doctora-original.jpg`, recortada a `app/assets/images/doctora.jpg` y centrada en el círculo. Aparece en Bienvenida, Inicio de sesión e Inicio. Se quitaron three, React Three Fiber y expo-gl.
  - **Foto de perfil:** en Perfil va la foto del usuario (o sus iniciales). Al tocarla se puede tomar, elegir de la galería (recortada en cuadrado) o quitar. Se guarda en el bucket privado `examenes`, en `<user_id>/perfil/`, y la ruta en `perfiles.avatar_url`. No requiere SQL nuevo.
  - ⚠️ Antes de publicar la app, confirmar que la ilustración se puede usar (licencia o autoría).
- **Centro de notificaciones estilo iOS** (2026-11-17): la campana de Inicio despliega desde arriba un panel con fondo opaco desenfocado (como el Centro de Control) y tarjetas oscuras translúcidas: dosis atrasadas, próximas dosis de hoy y citas de los próximos 7 días. Las dosis se marcan como tomadas desde la tarjeta. Se cierra con la misma campana, con la flecha o deslizando hacia arriba. La campana muestra la cantidad de avisos. El desenfoque en Android necesita Android 12 o superior.
- **Avatar del médico en las citas** (2026-11-17): si el nombre empieza con "Dr."/"Doctor" se muestra el doctor (`avatar/doctor.png`) y con "Dra."/"Doctora" la doctora, en el formulario, la lista de citas, Inicio e Historial. El formulario tiene botones Doctor/Doctora que ponen el prefijo.
- **Sin fondo amarillo al autocompletar**: plugin `app/plugins/sin-resaltado-autocompletar.js`. Solo aplica en el APK o development build (en Expo Go sigue el amarillo).
- **Ayuda y Soporte** (2026-11-17): pantalla `ayuda` con el correo de contacto appsalud6@gmail.com (abre la app de correo con asunto y datos de versión/sistema), preguntas frecuentes y aviso de emergencias (123).

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

### ~~Paso 5 · Historial y perfil~~ (ver Hecho)
- Historial con datos reales: citas pasadas, exámenes y tratamientos terminados.
- Editar "Mis Datos": fecha de nacimiento, teléfono, tipo de sangre y alergias.

### ~~Paso 6 · Avatar de la doctora virtual~~ (ver Hecho)
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
- ~~Enlace del correo de confirmación~~ (2026-11-17): el registro y "Recuperar contraseña" envían `emailRedirectTo`/`redirectTo` con el deep link de la app (`saludplus://` o `exp://…/--/` en Expo Go). La app crea la sesión con el enlace; si es de recuperación, abre "Nueva contraseña".
  - ⚠️ En Supabase → Authentication → URL Configuration: *Site URL* `saludplus://` y en *Redirect URLs* agregar `saludplus://**` y `exp://**`. Sin eso, Supabase sigue mandando a `localhost:3000`.
- Inicio de sesión con **Google** y **Apple**: los botones ya están, desactivados.
- Borrar la carpeta local `app-sdk58-respaldo/`, que ya no se usa.
- Antes de publicar, confirmar el uso de las ilustraciones del doctor y la doctora (licencia o autoría).
- Los STL de 71 MB ya no se usan; siguen en el **historial** de git (primer commit). Para que el repositorio pese menos habría que reescribir el historial (`git filter-repo`) y hacer *force push*; solo si el usuario lo pide.
