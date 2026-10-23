"""Normaliza variantes del núcleo (renders sobre negro) y genera, para cada una:
- nucleo-<n>-emisivo.webp: RGB sobre negro, mapa de degradado de verdes (mezcla screen en fondos oscuros)
- nucleo-<n>-claro.webp: RGBA opaco y algo más oscuro (fondos claros)
Todas comparten centro (centroide de luz) y escala (radio que contiene el 92 % de la luz).
Uso: python variantes.py <salida> nombre=ruta [nombre=ruta ...]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
LADO = 560
R_OBJ = 0.40          # radio del 92 % de la luz, como fracción del lado de salida

paradas = np.array([0.0, 0.25, 0.55, 0.85, 1.0])
colores = np.array([[0, 0, 0], [22, 70, 52], [70, 150, 105], [150, 225, 165], [235, 255, 235]], float)
W_LUM = np.array([0.2126, 0.7152, 0.0722])


def procesar(nombre, ruta):
    img = np.asarray(Image.open(ruta).convert("RGB")).astype(np.float64) / 255
    h, w, _ = img.shape
    borde = np.concatenate([img[:12].reshape(-1, 3), img[-12:].reshape(-1, 3), img[:, :12].reshape(-1, 3), img[:, -12:].reshape(-1, 3)])
    negro = np.percentile(borde, 50, axis=0)
    img = np.clip((img - negro) / (1 - negro), 0, 1)
    lum = img @ W_LUM
    # centroide y radio del 92 % de la luz
    yy, xx = np.mgrid[0:h, 0:w]
    tot = lum.sum()
    cy, cx = (lum * yy).sum() / tot, (lum * xx).sum() / tot
    d = np.hypot(yy - cy, xx - cx).ravel()
    orden = np.argsort(d)
    acum = np.cumsum(lum.ravel()[orden]) / tot
    r92 = d[orden][np.searchsorted(acum, 0.92)]
    # recorte cuadrado centrado y escalado a la escala común
    medio = r92 / R_OBJ / 2
    caja = (cx - medio, cy - medio, cx + medio, cy + medio)
    pil = Image.fromarray((img * 255).astype(np.uint8)).crop(tuple(int(round(v)) for v in caja)).resize((LADO, LADO), Image.LANCZOS)
    img = np.asarray(pil).astype(np.float64) / 255
    # viñeta radial para que nada toque el borde cuadrado
    y2, x2 = np.mgrid[0:LADO, 0:LADO]
    rr = np.hypot(y2 - LADO / 2, x2 - LADO / 2) / LADO
    vin = np.clip((0.5 - rr) / 0.08, 0, 1) ** 1.5
    img = img * vin[..., None]
    lum = img @ W_LUM

    # emisivo
    l0 = np.clip(lum / max(np.percentile(lum[lum > 0.02], 99), 1e-6), 0, 1)
    emis = np.stack([np.interp(l0, paradas, colores[:, c]) for c in range(3)], -1)
    chispas = np.clip(l0 - 0.7, 0, 1) / 0.3
    emis += np.stack([ndimage.gaussian_filter(chispas, 2)] * 3, -1) * np.array([120, 200, 140])
    Image.fromarray(np.clip(emis, 0, 255).astype(np.uint8)).save(OUT / f"nucleo-{nombre}-emisivo.webp", quality=86, method=6)

    # claro: alfa por luminancia, color des-premultiplicado y oscurecido para fondos claros
    a = np.clip((l0 - 0.04) / 0.30, 0, 1) ** 0.85
    col = np.clip(img / np.maximum(img.max(axis=-1, keepdims=True), 1e-6), 0, 1)
    tono = 0.22 + 0.42 * l0[..., None]
    gris = col.mean(axis=-1, keepdims=True)
    col = col * 0.7 + gris * 0.3                      # menos saturado, hacia el pizarra de la paleta
    rgb = col * tono * np.array([0.85, 1.0, 0.95]) * 255
    claro = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8)
    Image.fromarray(claro, "RGBA").save(OUT / f"nucleo-{nombre}-claro.webp", quality=86, method=6)
    print(f"{nombre}: centro=({cx:.0f},{cy:.0f}) r92={r92:.0f}px  negro={np.round(negro * 255).astype(int)}")


for arg in sys.argv[2:]:
    n, r = arg.split("=", 1)
    procesar(n, r)
