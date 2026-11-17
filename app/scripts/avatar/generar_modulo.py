"""Genera src/lib/avatar/modelo-doctora.ts a partir del .bin de convertir.mjs.

Uso: python3 generar_modulo.py <doctora.bin> <salida.ts>
"""
import base64
import json
import sys

ruta_bin, salida = sys.argv[1], sys.argv[2]
datos = open(ruta_bin, 'rb').read()
meta = json.load(open(ruta_bin + '.json'))
b64 = base64.b64encode(datos).decode()
lineas = [b64[i:i + 2000] for i in range(0, len(b64), 2000)]
with open(salida, 'w') as f:
    f.write('// Archivo GENERADO por scripts/avatar/generar_modulo.py — no editar a mano.\n')
    f.write('// Malla reducida de avatar/enfermera-app.stl (ver scripts/avatar/README.md).\n')
    f.write(f'export const META_DOCTORA = {json.dumps(meta)} as const;\n\n')
    f.write('export const MODELO_DOCTORA_B64 =\n')
    f.write(' +\n'.join(f"  '{l}'" for l in lineas))
    f.write(';\n')
print('bytes', len(datos), 'base64', len(b64))
