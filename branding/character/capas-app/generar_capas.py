"""Prepara las capas del avatar con transparencia real.

1. esfera-cristal.png: extrae la transparencia del cristal (esfera.png, renderizada sobre crema)
   estimando el fondo y calculando por píxel la mínima opacidad que explica el color.
2. nucleo-oscuro.png: partículas (particulas.png, sobre negro) con alfa recuperado del negro.
3. nucleo-glow.png: halo luminoso verde para fondos oscuros (mezcla aditiva / screen).
4. preview-*.png: composición sobre fondo crema, blanco, pizarra y casi negro.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)


def cargar(nombre, modo="RGB"):
    return np.asarray(Image.open(SRC / nombre).convert(modo)).astype(np.float64)


def guardar(arr, nombre):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(OUT / nombre)


# ---------- 1. cristal ----------
img = cargar("esfera.png") / 255.0
mask_src = cargar("esfera-sinfondo.png", "RGBA")[..., 3] / 255.0
mascara = ndimage.binary_dilation(mask_src > 0.03, iterations=24)

# fondo estimado: convolución normalizada fuera de la esfera, a baja resolución
h, w = mascara.shape
f = 8
peq = img[::f, ::f]
fuera = (~mascara[::f, ::f]).astype(np.float64)
num = np.stack([ndimage.gaussian_filter(peq[..., c] * fuera, 30) for c in range(3)], -1)
den = ndimage.gaussian_filter(fuera, 30)[..., None]
fondo_peq = num / np.maximum(den, 1e-6)
fondo = np.stack([ndimage.zoom(fondo_peq[..., c], f, order=1)[:h, :w] for c in range(3)], -1)

# mínima alfa tal que el color de primer plano quede en [0,1]
eps = 1e-6
a_claro = (img - fondo) / np.maximum(1 - fondo, eps)
a_oscuro = (fondo - img) / np.maximum(fondo, eps)
alfa = np.clip(np.max(np.maximum(a_claro, a_oscuro), axis=-1), 0, 1)
alfa = np.where(alfa < 0.025, 0, alfa)            # ruido del fondo
# silueta exacta de la esfera (sin la sombra proyectada sobre el crema)
ys0, xs0 = np.nonzero(mask_src > 0.5)
cy0, cx0 = ys0.mean(), xs0.mean()
r0 = (np.ptp(xs0) + np.ptp(ys0)) / 4
yy, xx = np.mgrid[0:h, 0:w]
dist = np.hypot(yy - cy0, xx - cx0)
alfa *= np.clip((r0 + 2 - dist) / 4, 0, 1)
# niebla clara: atenuar el brillo difuso y conservar los brillos nítidos
claro = (np.max(a_claro, axis=-1) >= np.max(a_oscuro, axis=-1))
rodilla = np.clip((alfa - 0.20) / 0.30, 0, 1) ** 1.5
alfa = np.where(claro, alfa * rodilla, alfa)
color = (img - fondo * (1 - alfa[..., None])) / np.maximum(alfa[..., None], eps)
color = np.clip(color, 0, 1)
cristal = np.dstack([color * 255, alfa * 255])
guardar(cristal, "esfera-cristal.png")

# geometría de la esfera
ys, xs = np.nonzero(mask_src > 0.5)
cy, cx = ys.mean(), xs.mean()
radio = (np.ptp(xs) + np.ptp(ys)) / 4

# ---------- 2. núcleo sobre negro con alfa ----------
p = cargar("particulas.png") / 255.0
a_p = p.max(axis=-1)
a_p = np.where(a_p < 0.02, 0, a_p)
c_p = p / np.maximum(a_p[..., None], 1e-6)
nucleo = np.dstack([np.clip(c_p, 0, 1) * 255, a_p * 255])
guardar(nucleo, "nucleo-oscuro.png")

# núcleo emisivo: mapa de degradado de verdes de la paleta, para mezcla screen/add sobre oscuro
lum0 = p @ np.array([0.2126, 0.7152, 0.0722])
lum0 = np.clip(lum0 / max(np.percentile(lum0[lum0 > 0.02], 99), 1e-6), 0, 1)
paradas = np.array([0.0, 0.25, 0.55, 0.85, 1.0])
colores = np.array([[0, 0, 0], [22, 70, 52], [70, 150, 105], [150, 225, 165], [235, 255, 235]], float)
emis = np.stack([np.interp(lum0, paradas, colores[:, c]) for c in range(3)], -1)
chispas = np.clip(lum0 - 0.7, 0, 1) / 0.3
emis += np.stack([ndimage.gaussian_filter(chispas, 3)] * 3, -1) * np.array([120, 200, 140])
guardar(emis, "nucleo-emisivo.png")   # RGB sobre negro: mezclar en modo screen/add

# ---------- 3. glow verde ----------
lum = p @ np.array([0.2126, 0.7152, 0.0722])
halo = np.clip(ndimage.gaussian_filter(lum, 60) * 3.0 + ndimage.gaussian_filter(lum, 18) * 1.4, 0, 1)
verde = np.array([0.45, 0.85, 0.55])                # verde luminoso coherente con #84A98C
glow = np.dstack([np.broadcast_to(verde * 255, p.shape), halo * 235])
guardar(glow, "nucleo-glow.png")


# ---------- 4. previsualizaciones ----------
def capa(nombre_o_arr, escala=1.0, centro=None):
    im = Image.open(SRC / nombre_o_arr).convert("RGBA") if isinstance(nombre_o_arr, str) else nombre_o_arr
    if escala != 1.0:
        im = im.resize((int(im.width * escala), int(im.height * escala)), Image.LANCZOS)
    lienzo = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cxp, cyp = centro or (w / 2, h / 2)
    lienzo.paste(im, (int(cxp - im.width / 2), int(cyp - im.height / 2)), im)
    return lienzo


def sumar(base, glow_img, fuerza=1.0):
    b = np.asarray(base).astype(np.float64)
    g = np.asarray(glow_img).astype(np.float64)
    a = g[..., 3:4] / 255 * fuerza
    rgb = 255 - (255 - b[..., :3]) * (1 - g[..., :3] / 255 * a)   # screen
    return Image.fromarray(np.dstack([rgb, b[..., 3:]]).clip(0, 255).astype(np.uint8))


# cara: celda (fila 0, col 1) de la hoja 4x4
hoja = Image.open(SRC / "expresiones-sinfondo.png").convert("RGBA")
cw = hoja.width // 4
cara = hoja.crop((cw, 0, 2 * cw, cw))
bb = cara.getbbox()
cara = cara.crop(bb)

esc_nucleo = radio * 1.45 / 1100
nucleo_claro = capa("particulas-sin fondo.png", esc_nucleo, (cx, cy))
nucleo_osc = capa(Image.fromarray(nucleo.clip(0, 255).astype(np.uint8)), esc_nucleo, (cx, cy))
glow_l = capa(Image.fromarray(glow.clip(0, 255).astype(np.uint8)), esc_nucleo * 1.05, (cx, cy))
cara_l = capa(cara, radio * 1.05 / cara.width, (cx, cy - radio * 0.02))
vidrio = Image.fromarray(cristal.clip(0, 255).astype(np.uint8))

FONDOS = {"crema": (230, 232, 196), "blanco": (255, 255, 255), "pizarra": (47, 62, 70), "noche": (16, 20, 19)}
tiras = []
for nombre, col in FONDOS.items():
    oscuro = sum(col) < 300
    base = Image.new("RGBA", (w, h), col + (255,))
    if oscuro:
        base = sumar(base, glow_l, 1.0)
        emis_img = Image.fromarray(np.dstack([emis, np.full(emis.shape[:2], 255)]).clip(0, 255).astype(np.uint8))
        base = sumar(base, capa(emis_img, esc_nucleo, (cx, cy)), 1.0)
    else:
        base.alpha_composite(nucleo_claro)
    base.alpha_composite(cara_l)
    base.alpha_composite(vidrio)
    peq = base.convert("RGB").resize((640, 640), Image.LANCZOS)
    peq.save(OUT / f"preview-{nombre}.png")
    tiras.append(peq)
    # cristal solo
    solo = Image.new("RGBA", (w, h), col + (255,))
    solo.alpha_composite(vidrio)
    solo.convert("RGB").resize((320, 320), Image.LANCZOS).save(OUT / f"cristal-{nombre}.png")

lamina = Image.new("RGB", (640 * 4, 640))
for i, t in enumerate(tiras):
    lamina.paste(t, (640 * i, 0))
lamina.save(OUT / "preview-lamina.png")
print(f"esfera: centro=({cx:.0f},{cy:.0f}) radio={radio:.0f}; alfa cristal media dentro={alfa[mask_src>0.5].mean():.3f}")
