#!/usr/bin/env python3
"""Validador de la biblia de plantas.

Comprueba estructura (esquemas JSON), reglas de verificación doble y coherencia
entre archivos. Sin dependencias externas. Uso:

    python scripts/validar.py            # valida lo que exista en output/
    python scripts/validar.py --estricto # además exige referencias cruzadas (Fase 5)

Sale con código 1 si hay errores.
"""
import csv
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
OUT = RAIZ / "output"
SCH = RAIZ / "schemas"
ESTRICTO = "--estricto" in sys.argv
ENC = "utf-8-sig"  # tolera BOM

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

errores: list[str] = []
avisos: list[str] = []


def err(msg: str) -> None:
    errores.append(msg)


def aviso(msg: str) -> None:
    avisos.append(msg)


# ---------- mini validador de JSON Schema (subconjunto usado en schemas/) ----------
class Validador:
    def __init__(self, schema: dict):
        self.raiz = schema
        self.defs = schema.get("$defs", {})

    def _resolver(self, s: dict) -> dict:
        if "$ref" in s:
            nombre = s["$ref"].split("/")[-1]
            base = dict(self.defs[nombre])
            for k, v in s.items():
                if k == "$ref":
                    continue
                if k == "properties" and k in base:
                    base[k] = {**base[k], **v}
                elif k == "required" and k in base:
                    base[k] = list(dict.fromkeys(base[k] + v))
                else:
                    base[k] = v
            return base
        return s

    def validar(self, dato, schema: dict, ruta: str, salida: list[str]) -> None:
        s = self._resolver(schema)
        tipos = s.get("type")
        if tipos:
            if isinstance(tipos, str):
                tipos = [tipos]
            if not any(self._es_tipo(dato, t) for t in tipos):
                salida.append(f"{ruta}: tipo esperado {tipos}, recibido {type(dato).__name__}")
                return
        if "enum" in s and dato not in s["enum"]:
            salida.append(f"{ruta}: valor '{dato}' no está en {s['enum']}")
        if isinstance(dato, str) and "pattern" in s and not re.match(s["pattern"], dato):
            salida.append(f"{ruta}: '{dato}' no cumple el patrón {s['pattern']}")
        if isinstance(dato, (int, float)) and not isinstance(dato, bool):
            if "minimum" in s and dato < s["minimum"]:
                salida.append(f"{ruta}: {dato} < mínimo {s['minimum']}")
            if "maximum" in s and dato > s["maximum"]:
                salida.append(f"{ruta}: {dato} > máximo {s['maximum']}")
        if isinstance(dato, dict):
            for req in s.get("required", []):
                if req not in dato:
                    salida.append(f"{ruta}: falta el campo obligatorio '{req}'")
            for k, sub in s.get("properties", {}).items():
                if k in dato:
                    self.validar(dato[k], sub, f"{ruta}.{k}", salida)
        if isinstance(dato, list):
            if "minItems" in s and len(dato) < s["minItems"]:
                salida.append(f"{ruta}: tiene {len(dato)} elementos, mínimo {s['minItems']}")
            if "items" in s:
                for i, el in enumerate(dato):
                    self.validar(el, s["items"], f"{ruta}[{i}]", salida)

    @staticmethod
    def _es_tipo(d, t: str) -> bool:
        return {
            "object": isinstance(d, dict),
            "array": isinstance(d, list),
            "string": isinstance(d, str),
            "integer": isinstance(d, int) and not isinstance(d, bool),
            "number": isinstance(d, (int, float)) and not isinstance(d, bool),
            "boolean": isinstance(d, bool),
            "null": d is None,
        }.get(t, False)


def cargar_json(p: Path):
    try:
        return json.loads(p.read_text(encoding=ENC))
    except json.JSONDecodeError as e:
        err(f"{p.relative_to(RAIZ)}: JSON inválido ({e})")
        return None


def cargar_schema(nombre: str) -> Validador:
    return Validador(json.loads((SCH / nombre).read_text(encoding=ENC)))


# ---------- reglas de verificación doble ----------
def mapa_fuentes(doc: dict, ruta: str) -> dict:
    """Devuelve {id: fuente} y comprueba URLs."""
    fuentes = {}
    for f in doc.get("fuentes", []) or []:
        if not isinstance(f, dict) or "id" not in f:
            continue
        fuentes[f["id"]] = f
        if not str(f.get("url", "")).startswith("http"):
            err(f"{ruta}: fuente '{f['id']}' sin URL válida")
    return fuentes


def comprobar_bloque(bloque, fuentes: dict, ruta: str) -> None:
    if not isinstance(bloque, dict):
        return
    conf = bloque.get("confianza")
    refs = bloque.get("fuentes", []) or []
    if not isinstance(refs, list):
        return
    for r in refs:
        if r not in fuentes:
            err(f"{ruta}: referencia a fuente inexistente '{r}'")
    prioritarias = [r for r in refs if fuentes.get(r, {}).get("tipo") == "prioritaria"]
    if conf == "Alta" and len(prioritarias) < 2:
        err(f"{ruta}: confianza Alta exige 2 fuentes prioritarias (tiene {len(prioritarias)})")
    if conf == "Media" and len(prioritarias) < 1 and len(refs) < 2:
        err(f"{ruta}: confianza Media exige 1 prioritaria o 2 complementarias")


# ---------- Fase 0: lista maestra ----------
COLS = ["orden", "nombre_cientifico", "nombres_comunes", "familia", "categoria", "prioridad", "rareza", "archivo_ficha"]
lista: dict[str, dict] = {}
p_lista = OUT / "lista-maestra.csv"
if p_lista.exists():
    with p_lista.open(encoding=ENC, newline="") as fh:
        lector = csv.DictReader(fh)
        if lector.fieldnames != COLS:
            err(f"lista-maestra.csv: columnas {lector.fieldnames}, se esperaban {COLS}")
        else:
            for fila in lector:
                lista[fila["archivo_ficha"]] = fila
                if not re.fullmatch(r"[a-z0-9-]+\.json", fila["archivo_ficha"]):
                    err(f"lista-maestra.csv: archivo_ficha inválido '{fila['archivo_ficha']}'")
                if fila["prioridad"] not in {"1", "2", "3", "4", "5"}:
                    err(f"lista-maestra.csv: prioridad inválida en {fila['nombre_cientifico']}")
    if lista and len(lista) < 100:
        err(f"lista-maestra.csv: {len(lista)} especies, mínimo 100")
    print(f"Fase 0  lista maestra: {len(lista)} especies")
else:
    print("Fase 0  lista maestra: (aún no existe)")

# ---------- Fase 1: reglas meteo y documentos de lógica ----------
p_meteo = OUT / "logica" / "reglas-meteo.json"
especies_meteo: set[str] = set()
if p_meteo.exists():
    doc = cargar_json(p_meteo)
    if doc is not None:
        fallos: list[str] = []
        v = cargar_schema("regla-meteo.schema.json")
        v.validar(doc, v.raiz, "reglas-meteo", fallos)
        errores.extend(fallos)
        fuentes = mapa_fuentes(doc, "reglas-meteo")
        for r in doc.get("reglas", []) or []:
            if isinstance(r, dict):
                comprobar_bloque(r, fuentes, f"reglas-meteo.{r.get('id')}")
                especies_meteo.update((r.get("afecta_a") or {}).get("especies", []) or [])
        print(f"Fase 1  reglas meteo: {len(doc.get('reglas', []) or [])} reglas")
for nombre in ["principios.md", "ubicacion.md", "meteo.md", "calendario.md", "mitos.md"]:
    p = OUT / "logica" / nombre
    if p.exists() and p.stat().st_size < 2000:
        err(f"logica/{nombre}: demasiado corto ({p.stat().st_size} bytes), parece incompleto")

# ---------- Fase 2: diagnóstico ----------
p_arbol = OUT / "diagnostico" / "arbol.json"
ids_sintomas: set[str] = set()
if p_arbol.exists():
    doc = cargar_json(p_arbol)
    if doc is not None:
        fallos = []
        v = cargar_schema("diagnostico.schema.json")
        v.validar(doc, v.raiz, "arbol", fallos)
        errores.extend(fallos)
        fuentes = mapa_fuentes(doc, "arbol")
        for s in doc.get("sintomas", []) or []:
            if not isinstance(s, dict):
                continue
            sid = s.get("id")
            if sid in ids_sintomas:
                err(f"arbol: id de síntoma duplicado {sid}")
            ids_sintomas.add(sid)
            comprobar_bloque(s, fuentes, f"arbol.{sid}")
        print(f"Fase 2  diagnóstico: {len(ids_sintomas)} síntomas")

# ---------- Fase 3: fichas ----------
fichas = sorted((OUT / "fichas").glob("*.json"))
v_ficha = cargar_schema("ficha-especie.schema.json")
nombres_fichas: set[str] = set()
for p in fichas:
    doc = cargar_json(p)
    if doc is None:
        continue
    ruta = f"fichas/{p.name}"
    fallos = []
    v_ficha.validar(doc, v_ficha.raiz, ruta, fallos)
    errores.extend(fallos)
    if not isinstance(doc, dict):
        continue
    if "nombre_cientifico" in doc:
        nombres_fichas.add(doc["nombre_cientifico"])
    fuentes = mapa_fuentes(doc, ruta)
    prioritarias = [f for f in fuentes.values() if f.get("tipo") == "prioritaria"]
    if len(prioritarias) < 2:
        err(f"{ruta}: la ficha necesita al menos 2 fuentes prioritarias (tiene {len(prioritarias)})")
    tox = doc.get("toxicidad")
    comprobar_bloque(tox, fuentes, f"{ruta}.toxicidad")
    for k, b in (doc.get("cuidados") or {}).items():
        comprobar_bloque(b, fuentes, f"{ruta}.cuidados.{k}")
    if isinstance(tox, dict) and tox.get("perros") == "desconocida" and tox.get("gatos") == "desconocida":
        aviso(f"{ruta}: toxicidad desconocida para perros y gatos; comprueba ASPCA")
    if lista and p.name not in lista:
        aviso(f"{ruta}: no está en lista-maestra.csv")
    if ids_sintomas:
        for pr in doc.get("problemas_frecuentes") or []:
            sid = pr.get("sintoma_id") if isinstance(pr, dict) else None
            if sid not in ids_sintomas:
                (err if ESTRICTO else aviso)(f"{ruta}: sintoma_id '{sid}' no existe en arbol.json")
print(f"Fase 3  fichas: {len(fichas)} archivos")

# ---------- Fase 4 ----------
p_prod = OUT / "logica" / "productos.md"
if p_prod.exists() and p_prod.stat().st_size < 4000:
    err("logica/productos.md: demasiado corto, parece incompleto")

# ---------- Estricto (Fase 5) ----------
if ESTRICTO:
    if lista:
        faltan = [a for a in lista if not (OUT / "fichas" / a).exists()]
        if faltan:
            err(f"faltan {len(faltan)} fichas de la lista maestra: {', '.join(faltan[:10])}...")
    for e in especies_meteo:
        if e not in nombres_fichas:
            err(f"reglas-meteo cita '{e}' pero no tiene ficha")
    for nombre in ["contradicciones.md", "lagunas.md"]:
        if not (OUT / nombre).exists():
            err(f"falta output/{nombre}")

# ---------- resultado ----------
print()
for a in avisos:
    print(f"AVISO  {a}")
for e in errores:
    print(f"ERROR  {e}")
print()
if errores:
    print(f"ROJO: {len(errores)} errores, {len(avisos)} avisos")
    sys.exit(1)
print(f"VERDE: 0 errores, {len(avisos)} avisos")
