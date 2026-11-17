"""Genera los íconos de Salud+ (estetoscopio de lucide + corazón) con PIL.

Uso: python3 generar_iconos.py <carpeta_salida> [<carpeta_preview>]
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw

MORADO = (124, 58, 237, 255)       # primary  (#7C3AED)
LAVANDA = (237, 231, 253, 255)     # secondary
BLANCO = (255, 255, 255, 255)
ROSA = (236, 72, 153, 255)         # heart
SS = 4                             # supersampling


def arco(cx, cy, r, a0, a1, n=48):
    """Puntos de un arco (grados, sentido horario en coordenadas de pantalla)."""
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)),
             cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


def construir_trazos():
    trazos = []
    # Auriculares
    trazos.append([(11, 2), (11, 4)])
    trazos.append([(5, 2), (5, 4)])
    # Yugo en U (la mitad inferior del círculo: ángulos 180→0 pasando por 90 = abajo en pantalla)
    u = [(5, 3), (4, 3)]
    u += arco(4, 5, 2, 270, 180)
    u += [(2, 9)]
    u += arco(8, 9, 6, 180, 90, 48) + arco(8, 9, 6, 90, 0, 48)[1:]
    u += [(14, 5)]
    u += arco(12, 5, 2, 0, -90)
    u += [(11, 3)]
    trazos.append(u)
    # Tubo hacia la campana
    t = arco(14, 15, 6, 180, 90, 48) + arco(14, 15, 6, 90, 0, 48)[1:]
    t += [(20, 12)]
    trazos.append(t)
    return trazos


def trazo_suave(d, pts, color, w):
    """Trazo grueso sin artefactos: estampa círculos a lo largo de la polilínea."""
    r = w / 2
    paso = max(0.5, r / 6)
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        dist = math.hypot(x2 - x1, y2 - y1)
        n = max(1, int(dist / paso))
        for i in range(n + 1):
            x = x1 + (x2 - x1) * i / n
            y = y1 + (y2 - y1) * i / n
            d.ellipse([x - r, y - r, x + r, y + r], fill=color)


def dibujar_estetoscopio(d, x0, y0, escala, color, grosor):
    """Dibuja el estetoscopio con la rejilla 24x24 trasladada a (x0,y0) y escalada."""
    w = max(1, round(grosor * escala))
    for t in construir_trazos():
        trazo_suave(d, [(x0 + x * escala, y0 + y * escala) for x, y in t], color, w)
    # Campana: circunferencia en (20,10) r=2
    cx, cy, rr = x0 + 20 * escala, y0 + 10 * escala, 2 * escala
    trazo_suave(d, arco(cx, cy, rr, 0, 360, 96), color, w)


def corazon(d, cx, cy, tam, color):
    """Corazón relleno (curva paramétrica clásica)."""
    pts = []
    for i in range(360):
        t = math.radians(i)
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * tam / 34, cy - y * tam / 34))
    d.polygon(pts, fill=color)


def pulso(d, cx, cy, tam, color, w):
    s = tam / 24
    pts = [(-9, 0), (-3.5, 0), (-2, -3), (0.5, 5), (3, -7), (4.5, 0), (9, 0)]
    trazo_suave(d, [(cx + x * s, cy + y * s) for x, y in pts], color, w)


def lienzo(n):
    return Image.new('RGBA', (n * SS, n * SS), (0, 0, 0, 0))


def reducir(im, n):
    return im.resize((n, n), Image.LANCZOS)


def composicion(n, fondo, circulo=True, insignia=True, escala_contenido=1.0, color_trazo=MORADO, solo_trazo=False):
    """Ícono: fondo + círculo blanco + estetoscopio + insignia de corazón."""
    N = n * SS
    im = lienzo(n)
    d = ImageDraw.Draw(im)
    if fondo:
        d.rectangle([0, 0, N, N], fill=fondo)
    c = N / 2
    radio = N * 0.36 * escala_contenido
    if circulo:
        d.ellipse([c - radio, c - radio, c + radio, c + radio], fill=BLANCO)
    # Estetoscopio centrado: su caja en la rejilla es ~x 1..22, y 1..22
    esc = radio * 2 * 0.62 / 22
    x0 = c - 11.5 * esc
    y0 = c - 11.8 * esc
    dibujar_estetoscopio(d, x0, y0, esc, color_trazo, 2)
    if insignia and not solo_trazo:
        br = radio * 0.36
        bx, by = c + radio * 0.66, c + radio * 0.66
        borde = br * 0.16
        d.ellipse([bx - br - borde, by - br - borde, bx + br + borde, by + br + borde], fill=fondo or LAVANDA)
        d.ellipse([bx - br, by - br, bx + br, by + br], fill=ROSA)
        corazon(d, bx, by + br * 0.05, br * 1.15, BLANCO)
        pulso(d, bx, by + br * 0.02, br * 1.0, ROSA, max(1, round(br * 0.12)))
    return reducir(im, n)


def main():
    salida = Path(sys.argv[1])
    preview = Path(sys.argv[2]) if len(sys.argv) > 2 else None

    # iOS / general: sin transparencia, a sangre
    composicion(1024, LAVANDA).save(salida / 'icon.png')
    # Android adaptativo: fondo sólido + primer plano dentro de la zona segura (~66 % central)
    Image.new('RGBA', (512, 512), LAVANDA).save(salida / 'android-icon-background.png')
    composicion(512, None, escala_contenido=0.9).save(salida / 'android-icon-foreground.png')
    # Monocromático (Android 13+): solo la silueta, Android usa el canal alfa
    composicion(432, None, circulo=False, escala_contenido=0.85, color_trazo=BLANCO, solo_trazo=True).save(
        salida / 'android-icon-monochrome.png')
    # Splash: logo sobre transparente (el fondo lo pone app.json)
    composicion(512, None, escala_contenido=1.25).save(salida / 'splash-icon.png')
    # Favicon web
    composicion(48, LAVANDA, insignia=False).save(salida / 'favicon.png')

    if preview:
        # Hoja de vista previa: ícono normal, redondo (Android), y monocromo sobre oscuro
        hoja = Image.new('RGBA', (1100, 400), (40, 36, 52, 255))
        ico = composicion(1024, LAVANDA).resize((300, 300), Image.LANCZOS)
        hoja.alpha_composite(ico, (40, 50))
        fg = Image.open(salida / 'android-icon-foreground.png').resize((300, 300), Image.LANCZOS)
        bg = Image.new('RGBA', (300, 300), LAVANDA)
        bg.alpha_composite(fg)
        mask = Image.new('L', (300, 300), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, 299, 299], fill=255)
        red = Image.new('RGBA', (300, 300), (0, 0, 0, 0))
        red.paste(bg, (0, 0), mask)
        hoja.alpha_composite(red, (400, 50))
        mono = Image.open(salida / 'android-icon-monochrome.png').resize((300, 300), Image.LANCZOS)
        hoja.alpha_composite(mono, (760, 50))
        hoja.save(preview)


if __name__ == '__main__':
    main()
