# Avatar 3D de la doctora

La app no usa el STL directamente: pesa 71 MB y tiene 1,4 millones de triángulos.
Se convierte a una malla reducida (~40 000 triángulos, 417 KB) que va incrustada en
`src/lib/avatar/modelo-doctora.ts`, así funciona en Expo Go sin descargar archivos.

El STL original (`avatar/enfermera-app.stl`) no se sube a git; guárdalo aparte.

## Regenerar el modelo

```bash
# 1) Herramienta de reducción, en una carpeta aparte (no es dependencia de la app)
mkdir -p /tmp/avatar && cd /tmp/avatar && npm init -y && npm i meshoptimizer@0.22.0
cp <repo>/app/scripts/avatar/*.mjs .

# 2) Reducir y cuantizar (el número es la cantidad de triángulos)
node --max-old-space-size=6000 convertir.mjs <repo>/avatar/enfermera-app.stl doctora.bin 40000

# 3) (Opcional) vista previa en PPM
node render.mjs doctora.bin vista.ppm

# 4) Generar el módulo de la app
python3 <repo>/app/scripts/avatar/generar_modulo.py doctora.bin <repo>/app/src/lib/avatar/modelo-doctora.ts
```

## Formato de `doctora.bin`

- Posiciones `int16 × 3` por vértice, normalizadas a [-1, 1] (Y hacia arriba, alto total 2).
- Normales `int8 × 3` por vértice.
- Relleno hasta múltiplo de 4 y después índices `uint16` (o `uint32` si hay más de 65 535 vértices).
- Los desplazamientos van en `META_DOCTORA`; la decodificación está en `src/lib/avatar/geometria.ts`.
