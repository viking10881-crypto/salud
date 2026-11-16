# salud

**Salud+**: asistente personal de salud con una doctora virtual. Recordatorios de medicamentos, citas médicas, exámenes e historial médico.

## Estructura

| Carpeta   | Contenido                                                             |
| --------- | --------------------------------------------------------------------- |
| `app/`    | Aplicación móvil (Expo SDK 54 + Expo Router + TypeScript)             |
| `avatar/` | Modelo 3D de la doctora virtual (STL, pendiente de convertir a GLB)   |

## Tecnologías

- React Native + Expo SDK 54 + Expo Router
- NativeWind 4 (Tailwind CSS 3.4)
- Componentes shadcn para React Native ([React Native Reusables](https://reactnativereusables.com))
- Iconos: lucide-react-native
- Backend previsto: Supabase (Auth, PostgreSQL, Storage)

## Cómo ejecutar

```bash
cd app
npm install
npx expo start
```

Escanea el código QR con **Expo Go** (versión compatible con SDK 54).
