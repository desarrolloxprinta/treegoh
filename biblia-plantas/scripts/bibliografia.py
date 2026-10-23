#!/usr/bin/env python3
"""Genera output/bibliografia.md: todas las fuentes de todos los archivos de output/,
deduplicadas por URL normalizada, con institución, tipo, fecha de consulta y archivos que respaldan.

    python scripts/bibliografia.py
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
OUT = RAIZ / "output"
ENC = "utf-8-sig"
URL_RE = re.compile(r"https?://[^\s|<>\"'`\]\)]+")
FECHA_RE = re.compile(r"\b(20\d\d-\d\d-\d\d)\b")

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def norm(url: str) -> str:
    u = url.strip().rstrip(".,;:)»”'\"").replace("http://", "https://", 1)
    u = re.sub(r"^https://www\.", "https://", u)
    u = re.sub(r"#.*$", "", u)
    m = re.match(r"(https://)([^/]+)(.*)", u)
    if m:
        u = m.group(1) + m.group(2).lower() + m.group(3)
    return u.rstrip("/")


def tipo_de(texto: str) -> str | None:
    t = texto.lower()
    if re.search(r"\bcomplementaria\b|\|\s*c\s*\||\bc \(", t):
        return "complementaria"
    if re.search(r"\bprioritaria\b|\|\s*p\s*\||\bp \(", t):
        return "prioritaria"
    return None


registros = defaultdict(lambda: {"urls": set(), "inst": set(), "tipos": defaultdict(set),
                                 "fechas": set(), "archivos": set(), "no_abierta": False})


def anotar(url, inst, tipo, fecha, archivo, linea=""):
    k = norm(url)
    if not k.startswith("https://") or len(k) < 12:
        return
    r = registros[k]
    r["urls"].add(url.rstrip(".,;:)"))
    if inst:
        inst = re.sub(r"\s+", " ", inst).strip(" -—|·")
        if 2 < len(inst) < 220:
            r["inst"].add(inst)
    if tipo:
        r["tipos"][tipo].add(archivo)
    if fecha:
        r["fechas"].add(fecha)
    r["archivos"].add(archivo)
    if re.search(r"no abierta|no se abri|sin abrir", linea, re.I):
        r["no_abierta"] = True


def desde_json_fuentes(lista, archivo):
    for s in lista or []:
        if isinstance(s, dict) and s.get("url"):
            anotar(s["url"], s.get("institucion") or s.get("titulo"), s.get("tipo"),
                   s.get("fecha_consulta"), archivo, json.dumps(s, ensure_ascii=False))


# JSON
for p in sorted((OUT / "fichas").glob("*.json")):
    desde_json_fuentes(json.loads(p.read_text(encoding=ENC)).get("fuentes"), f"fichas/{p.name}")
for rel in ["diagnostico/arbol.json", "logica/reglas-meteo.json"]:
    p = OUT / rel
    if p.exists():
        desde_json_fuentes(json.loads(p.read_text(encoding=ENC)).get("fuentes"), rel)

# Markdown
MD = ["fuentes.md", "logica/principios.md", "logica/ubicacion.md", "logica/meteo.md",
      "logica/calendario.md", "logica/mitos.md", "logica/productos.md",
      "diagnostico/plagas-enfermedades.md", "diagnostico/protocolo-fotos.md",
      "contradicciones.md", "lagunas.md", "resumen-ejecutivo.md", "nomenclatura.md"]
for rel in MD:
    p = OUT / rel
    if not p.exists():
        continue
    for linea in p.read_text(encoding=ENC).splitlines():
        urls = URL_RE.findall(linea)
        if not urls:
            continue
        celdas = [c.strip() for c in linea.strip().strip("|").split("|")] if linea.lstrip().startswith(("|", "-")) else []
        es_lista = bool(re.match(r"^\s*(\|\s*)?[-*]?\s*\[?[A-Z]{1,3}\d?[-\d]*\]?\s*[|:]", linea)) or len(celdas) >= 4
        if rel in ("contradicciones.md", "lagunas.md") and not linea.lstrip().startswith("- "):
            es_lista = False  # filas de discusión, no listas de bibliografía
        tipo = tipo_de(linea) if es_lista else None
        fecha = (FECHA_RE.findall(linea) or [None])[0] if es_lista else None
        for u in urls:
            inst = None
            if celdas:
                for c in celdas:
                    if u in c:
                        resto = c.replace(u, "").strip(" —-;")
                        if resto:
                            inst = resto
                    elif inst is None and not re.match(r"^\[?[A-Z]{1,3}[-\d]+\]?$", c) and not tipo_de("|" + c + "|") \
                            and not FECHA_RE.fullmatch(c) and 3 < len(c) < 200 and "http" not in c:
                        inst = c
            anotar(u, inst if es_lista else None, tipo, fecha, rel, linea)

# Salida
def dominio(u):
    return re.sub(r"^https://", "", u).split("/")[0]


filas, conflictos = [], []
cuenta = defaultdict(int)
for k in sorted(registros, key=lambda x: (dominio(x), x)):
    r = registros[k]
    tipos = r["tipos"]
    if "prioritaria" in tipos and "complementaria" in tipos:
        tipo = "prioritaria / complementaria (conflicto)"
        conflictos.append((k, sorted(tipos["prioritaria"]), sorted(tipos["complementaria"])))
    elif tipos:
        tipo = next(iter(tipos))
    else:
        tipo = "citada en texto (sin clasificar)"
    cuenta[tipo.split(" ")[0] if "conflicto" not in tipo else "conflicto"] += 1
    inst = sorted(r["inst"], key=len)[0] if r["inst"] else dominio(k)
    fechas = sorted(r["fechas"])
    fecha = (fechas[0] if len(fechas) == 1 else f"{fechas[0]} a {fechas[-1]}") if fechas else "s. f."
    arch = sorted(r["archivos"])
    fichas = [a for a in arch if a.startswith("fichas/")]
    otros = [a for a in arch if not a.startswith("fichas/")]
    txt_arch = ", ".join(otros)
    if fichas:
        nombres = ", ".join(a[7:-5] for a in fichas)
        txt_arch = (txt_arch + "; " if txt_arch else "") + f"{len(fichas)} fichas: {nombres}"
    nota = " (marcada no abierta en el origen)" if r["no_abierta"] else ""
    filas.append(f"| {k} | {inst.replace('|', '/')}{nota} | {tipo} | {fecha} | {txt_arch} |")

total = len(filas)
cab = [
    "# Bibliografía consolidada",
    "",
    "Generada por `scripts/bibliografia.py` a partir de todas las fuentes citadas en `output/` "
    "(fichas, árbol de diagnóstico, reglas meteorológicas y archivos Markdown). Las URL se "
    "deduplican normalizadas (https, sin `www.`, sin barra final ni ancla). El tipo es el que "
    "declara el archivo de origen; \"citada en texto\" son URL que aparecen solo dentro de "
    "contradicciones, lagunas o notas, sin fila de bibliografía propia. Las fechas son las de "
    "consulta declaradas (\"s. f.\" si el origen no la da).",
    "",
    f"- URL distintas: **{total}**",
    f"- Prioritarias: {cuenta['prioritaria']} · Complementarias: {cuenta['complementaria']} · "
    f"Conflicto de tipo entre archivos: {cuenta['conflicto']} · Citadas solo en texto: {cuenta['citada']}",
    "",
    "## Fuentes con tipo distinto según el archivo",
    "",
    "Mismo documento clasificado como prioritario en un archivo y complementario en otro. "
    "Para la confianza de cada bloque vale la clasificación del archivo que lo usa; el criterio "
    "general de la Fase 5 está en `output/resumen-ejecutivo.md` (criterios de fuentes).",
    "",
    "| URL | Prioritaria en | Complementaria en |",
    "|---|---|---|",
]
for k, pr, co in conflictos:
    cab.append(f"| {k} | {', '.join(pr)[:300]} | {', '.join(co)[:300]} |")
cab += ["", "## Todas las fuentes", "", "| URL | Institución / título | Tipo | Consulta | Respalda |", "|---|---|---|---|---|"]
(OUT / "bibliografia.md").write_text("\n".join(cab + filas) + "\n", encoding="utf-8")
print(f"bibliografia.md: {total} URL ({dict(cuenta)}), {len(conflictos)} conflictos de tipo")
