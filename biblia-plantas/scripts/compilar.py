#!/usr/bin/env python3
"""Compila output/ en biblia.json (para la app) y BIBLIA.md (documento legible).

    python scripts/compilar.py

Además genera output/logica/grupos-meteo.md: la correspondencia entre las fichas
(categoria, familia, género, temperatura mínima) y los grupos que usan las reglas
de output/logica/reglas-meteo.json (`afecta_a.categorias`).
"""
import json
import re
import sys
import unicodedata
from collections import Counter
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
OUT = RAIZ / "output"
ENC = "utf-8-sig"

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def leer(p: Path) -> str:
    return p.read_text(encoding=ENC) if p.exists() else f"_(pendiente: {p.relative_to(RAIZ)})_\n"


def cargar(p: Path):
    return json.loads(p.read_text(encoding=ENC)) if p.exists() else None


def bajar_titulos(md: str, niveles: int = 1) -> str:
    """Baja los encabezados de un archivo incluido para que cuelguen de su sección."""
    def sub(m):
        return "#" * min(6, len(m.group(1)) + niveles) + m.group(2)
    fuera, dentro = [], False
    for linea in md.splitlines():
        if linea.startswith("```"):
            dentro = not dentro
        fuera.append(linea if dentro else re.sub(r"^(#{1,6})(\s)", sub, linea))
    return "\n".join(fuera)


def ancla(texto: str) -> str:
    t = unicodedata.normalize("NFKD", texto.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9 -]", "", t).strip().replace(" ", "-")


def v(x, defecto="—"):
    if x is None or x == "" or x == []:
        return defecto
    if isinstance(x, list):
        return ", ".join(str(i) for i in x)
    return str(x).replace("\n", " ").replace("|", "/")


# ---------- grupos de las reglas meteorológicas ----------
CRITERIOS_GRUPOS = [
    ("suculentas_cactus", "categoría suculenta o cactus"),
    ("palmeras", "categoría palmera"),
    ("orquideas_epifitas", "categoría orquídea"),
    ("calatheas_helechos", "categoría helecho o familia Marantaceae"),
    ("ficus", "género Ficus"),
    ("tropicales_araceas", "familia Araceae, o cualquier ficha no suculenta con temperatura mínima ≥ 10 °C"),
    ("plantas_flor", "categoría flor"),
    ("balcon_exterior", "no depende de la especie: lo activa la ubicación declarada por el usuario (balcón, terraza, alféizar exterior)"),
]


def grupos_meteo(f: dict) -> list[str]:
    cat, fam = f["categoria"], f.get("familia", "")
    gen = f["nombre_cientifico"].split()[0]
    tmin = f["cuidados"]["temperatura"].get("min_c")
    g = []
    if cat in ("suculenta", "cactus"):
        g.append("suculentas_cactus")
    if cat == "palmera":
        g.append("palmeras")
    if cat == "orquidea":
        g.append("orquideas_epifitas")
    if cat == "helecho" or fam == "Marantaceae":
        g.append("calatheas_helechos")
    if gen == "Ficus":
        g.append("ficus")
    if fam == "Araceae" or ("suculentas_cactus" not in g and tmin is not None and tmin >= 10):
        g.append("tropicales_araceas")
    if cat == "flor":
        g.append("plantas_flor")
    return g


# ---------- carga ----------
fichas = [cargar(p) for p in sorted((OUT / "fichas").glob("*.json"))]
arbol = cargar(OUT / "diagnostico" / "arbol.json")
meteo = cargar(OUT / "logica" / "reglas-meteo.json")
nomen = cargar(OUT / "nomenclatura.json") or {"especies": {}}

for f in fichas:
    f["grupos_meteo"] = grupos_meteo(f)
    if f["nombre_cientifico"] in nomen["especies"]:
        f["nomenclatura"] = nomen["especies"][f["nombre_cientifico"]]

biblia = {
    "version": date.today().isoformat(),
    "ubicacion_referencia": "Madrid, España",
    "nota_grupos_meteo": "Cada especie lleva `grupos_meteo`, que la app cruza con `reglas_meteo[].afecta_a.categorias`. "
                         "'todas' se aplica a todas las especies; 'balcon_exterior' depende de la ubicación declarada, no de la especie. "
                         "Las excepciones de cada regla prevalecen. Criterios en output/logica/grupos-meteo.md.",
    "criterios_grupos_meteo": dict(CRITERIOS_GRUPOS),
    "nomenclatura_criterio": nomen.get("criterio"),
    "especies": fichas,
    "diagnostico": arbol,
    "reglas_meteo": meteo,
}
(OUT / "biblia.json").write_text(json.dumps(biblia, ensure_ascii=False, indent=2), encoding="utf-8")

# ---------- grupos-meteo.md ----------
cuenta = Counter(g for f in fichas for g in f["grupos_meteo"])
sin_grupo = [f["nombre_cientifico"] for f in fichas if not f["grupos_meteo"]]
gm = [
    "# Grupos de las reglas meteorológicas",
    "",
    "Las reglas de `reglas-meteo.json` se dirigen a grupos funcionales (`afecta_a.categorias`) que no coinciden "
    "con la `categoria` de las fichas. La Fase 5 fija esta correspondencia, generada por `scripts/compilar.py` "
    "e incluida en `biblia.json` como `grupos_meteo` de cada especie. Es una regla de ingeniería del producto, "
    "no un dato botánico: se apoya en la temperatura mínima verificada de cada ficha (`min_c`). Un grupo de frío "
    "aplicado de más solo adelanta un aviso de protección (opción conservadora).",
    "",
    "| Grupo | Criterio | Especies |",
    "|---|---|---|",
]
for g, crit in CRITERIOS_GRUPOS:
    gm.append(f"| `{g}` | {crit} | {cuenta.get(g, '—') if g != 'balcon_exterior' else 'según ubicación'} |")
gm += ["", f"Fichas sin grupo propio (solo reciben las reglas `todas`, y las de balcón si están fuera): "
       f"{len(sin_grupo)}: " + ", ".join(f"*{n}*" for n in sin_grupo) + ".", "",
       "| Especie | Categoría | Mín. °C | Grupos |", "|---|---|---|---|"]
for f in fichas:
    gm.append(f"| *{f['nombre_cientifico']}* | {f['categoria']} | {v(f['cuidados']['temperatura'].get('min_c'))} | "
              f"{', '.join(f['grupos_meteo']) or '—'} |")
(OUT / "logica" / "grupos-meteo.md").write_text("\n".join(gm) + "\n", encoding="utf-8")


# ---------- ficha en Markdown ----------
def ficha_md(f: dict) -> str:
    c, tox, mad = f["cuidados"], f["toxicidad"], f.get("ajustes_madrid", {})
    luz, tem, hum = c["luz"], c["temperatura"], c["humedad"]
    fer, tra, pro = c["fertilizacion"], c["trasplante"], c["propagacion"]
    nom = f.get("nomenclatura")
    lineas = [f"### {f['nombre_cientifico']}"]
    if nom and nom["nombre_mostrar"] != f["nombre_cientifico"]:
        lineas.append(f"_Nombre aceptado: {nom['nombre_aceptado']} ({nom['nota']})._")
    elif nom:
        lineas.append(f"_Nomenclatura: {nom['nota']}._")
    lineas += [
        f"**Nombres comunes:** {v(f.get('nombres_comunes'))} · **Familia:** {v(f.get('familia'))} · "
        f"**Categoría:** {f['categoria']} · **Dificultad:** {v(f.get('dificultad'))} · **Rareza:** {v(f.get('rareza'))}",
        f"**Origen:** {v(f.get('origen'))} ({v(f.get('clima_nativo'))})",
        f"**Toxicidad:** perros {tox['perros']}, gatos {tox['gatos']}, niños {tox['ninos']} [{tox['confianza']}]"
        + (f" — {v(tox.get('principio_activo'))}" if tox.get("principio_activo") else ""),
        f"**Grupos meteorológicos:** {', '.join(f['grupos_meteo']) or 'solo reglas generales'}",
        "",
        "| Cuidado | Valor | Confianza |",
        "|---|---|---|",
        f"| Luz | {v(luz.get('tipo'))} ({v(luz.get('lux_min'))}–{v(luz.get('lux_max'))} lux), {v(luz.get('orientacion_hn'))} | {luz['confianza']} |",
        f"| Riego | {v(c['riego'].get('criterio'))} | {c['riego']['confianza']} |",
        f"| Humedad | mín {v(hum.get('min_pct'))} %, ideal {v(hum.get('ideal_pct'))} % | {hum['confianza']} |",
        f"| Temperatura | {v(tem.get('min_c'))}–{v(tem.get('max_c'))} °C (ideal {v(tem.get('ideal_min_c'))}–{v(tem.get('ideal_max_c'))}) | {tem['confianza']} |",
        f"| Sustrato | {v(c['sustrato'].get('mezcla'))} | {c['sustrato']['confianza']} |",
        f"| Abonado | {v(fer.get('tipo'))} {v(fer.get('npk'), '')}; {v(fer.get('primavera_verano'))} | {fer['confianza']} |",
        f"| Trasplante | {v(tra.get('frecuencia'))}, {v(tra.get('epoca'))} | {tra['confianza']} |",
        f"| Propagación | {v(pro.get('metodos'))} | {pro['confianza']} |",
        "",
        f"**Madrid, verano:** {v(mad.get('verano'))}  ",
        f"**Madrid, invierno:** {v(mad.get('invierno'))}  ",
        f"**Ubicación recomendada:** {v(mad.get('ubicacion_recomendada'))}",
    ]
    if f.get("lagunas"):
        lag = f["lagunas"] if isinstance(f["lagunas"], list) else [f["lagunas"]]
        lineas.append(f"**Lagunas:** {'; '.join(map(str, lag))}")
    lineas.append(f"_Fuentes: {len(f.get('fuentes', []))} (detalle en `biblia.json` y en la bibliografía)._")
    lineas.append("")
    return "\n".join(lineas)


# ---------- BIBLIA.md ----------
SECCIONES = [
    ("Resumen ejecutivo", OUT / "resumen-ejecutivo.md"),
    ("Principios", OUT / "logica" / "principios.md"),
    ("Ubicación en el hogar", OUT / "logica" / "ubicacion.md"),
    ("Meteorología y ajustes", OUT / "logica" / "meteo.md"),
    ("Grupos de las reglas meteorológicas", OUT / "logica" / "grupos-meteo.md"),
    ("Calendario estacional", OUT / "logica" / "calendario.md"),
    ("Diagnóstico, plagas y enfermedades", OUT / "diagnostico" / "plagas-enfermedades.md"),
    ("Protocolo fotográfico", OUT / "diagnostico" / "protocolo-fotos.md"),
    ("Productos y herramientas", OUT / "logica" / "productos.md"),
    ("Mitos: lo que la app no debe decir", OUT / "logica" / "mitos.md"),
    ("Fichas de especie", None),
    ("Nomenclatura", OUT / "nomenclatura.md"),
    ("Bibliografía", OUT / "bibliografia.md"),
    ("Anexo A. Contradicciones entre fuentes", OUT / "contradicciones.md"),
    ("Anexo B. Lagunas", OUT / "lagunas.md"),
]
titulos = [f"{i}. {t}" for i, (t, _) in enumerate(SECCIONES, 1)]
indice = ["## Índice", ""] + [f"- [{t}](#{ancla(t)})" for t in titulos]
indice_fichas = ["", "**Fichas:** " + " · ".join(
    f"[{f['nombre_cientifico']}](#{ancla(f['nombre_cientifico'])})" for f in fichas), ""]

conf = Counter()
for f in fichas:
    conf[f["toxicidad"]["confianza"]] += 1
    for b in f["cuidados"].values():
        if isinstance(b, dict) and "confianza" in b:
            conf[b["confianza"]] += 1

partes = [
    "# Biblia de cuidado de plantas de interior",
    f"_Compilado el {date.today().isoformat()} · {len(fichas)} especies · "
    f"{len(arbol['sintomas']) if arbol else 0} síntomas · {len(meteo['reglas']) if meteo else 0} reglas meteorológicas · "
    f"bloques de ficha: {conf['Alta']} Alta, {conf['Media']} Media, {conf['Baja']} Baja_",
    "",
    "\n".join(indice),
]
for t, (_, ruta) in zip(titulos, SECCIONES):
    partes.append(f"## {t}")
    if ruta is None:
        partes.append("\n".join(indice_fichas))
        partes.append("\n".join(ficha_md(f) for f in fichas))
    else:
        partes.append(bajar_titulos(leer(ruta), 2))
(RAIZ / "BIBLIA.md").write_text("\n\n".join(partes), encoding="utf-8")
print(f"biblia.json: {len(fichas)} especies. BIBLIA.md generado. grupos-meteo.md: {dict(cuenta)}; sin grupo: {len(sin_grupo)}")
