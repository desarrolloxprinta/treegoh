#!/usr/bin/env python3
"""Fusiona las partes sintomas-*.json + fuentes.json en output/diagnostico/arbol.json.

Comprobaciones:
  - 36 síntomas S01..S36, una vez cada uno y en orden.
  - Cada id de fuente citado en el texto de un síntoma (patrón F01, G01, P01, PC01, C01, E01, R01)
    se añade al array `fuentes` del síntoma si falta y existe en fuentes.json (se registra).
  - Toda referencia debe existir en fuentes.json; fuentes.json se filtra a las citadas.
  - Regla de confianza: Alta >= 2 prioritarias; Media >= 1 prioritaria o >= 2 referencias.
  - No sobreescribe output/diagnostico/arbol.json si ya existe (salvo --force).

Uso (PowerShell):  python "<ruta>\\merge_arbol.py" [--force]
"""
import json
import re
import sys
from pathlib import Path

ENC = "utf-8-sig"
AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent.parent  # biblia-plantas
SALIDA = RAIZ / "output" / "diagnostico" / "arbol.json"
VERSION = "1.0 (2026-10-21)"
PARTES = [
    "sintomas-01-12.json",
    "sintomas-13-17.json",
    "sintomas-18-22.json",
    "sintomas-23-28.json",
    "sintomas-29-32.json",
    "sintomas-33-36.json",
]
ID_RE = re.compile(r"(?<![A-Za-z0-9])(PC\d{2}|[FGPCER]\d{2})(?![0-9])")

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def fallo(msg: str) -> None:
    print(f"ERROR  {msg}")
    sys.exit(1)


def textos(obj):
    """Genera todas las cadenas de un objeto JSON (excepto el array `fuentes`)."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "fuentes":
                continue
            yield from textos(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from textos(v)
    elif isinstance(obj, str):
        yield obj


def main() -> None:
    force = "--force" in sys.argv
    fuentes = json.loads((AQUI / "fuentes.json").read_text(encoding=ENC))
    registro = {f["id"]: f for f in fuentes}
    if len(registro) != len(fuentes):
        fallo("ids duplicados en fuentes.json")

    sintomas = []
    for nombre in PARTES:
        parte = json.loads((AQUI / nombre).read_text(encoding=ENC))
        if not isinstance(parte, list):
            fallo(f"{nombre}: no es un array")
        sintomas.extend(parte)

    esperados = [f"S{i:02d}" for i in range(1, 37)]
    ids = [s.get("id") for s in sintomas]
    if ids != esperados:
        fallo(f"ids de síntomas incorrectos: {ids}")

    citadas: set[str] = set()
    for s in sintomas:
        refs = list(s.get("fuentes", []))
        en_texto = {m for t in textos(s) for m in ID_RE.findall(t)}
        for r in sorted(en_texto - set(refs)):
            if r in registro:
                refs.append(r)
                print(f"NOTA   {s['id']}: añadida fuente {r} citada en el texto")
            else:
                fallo(f"{s['id']}: el texto cita '{r}', que no existe en fuentes.json")
        for r in refs:
            if r not in registro:
                fallo(f"{s['id']}: referencia a fuente inexistente '{r}'")
        s["fuentes"] = sorted(dict.fromkeys(refs), key=lambda x: (re.sub(r"\d", "", x), int(re.sub(r"\D", "", x))))
        citadas.update(s["fuentes"])
        prio = [r for r in s["fuentes"] if registro[r]["tipo"] == "prioritaria"]
        conf = s.get("confianza")
        if conf == "Alta" and len(prio) < 2:
            fallo(f"{s['id']}: confianza Alta con {len(prio)} prioritarias")
        if conf == "Media" and len(prio) < 1 and len(s["fuentes"]) < 2:
            fallo(f"{s['id']}: confianza Media sin respaldo suficiente")

    fuentes_final = [f for f in fuentes if f["id"] in citadas]
    sin_citar = [f["id"] for f in fuentes if f["id"] not in citadas]
    print(f"Síntomas: {len(sintomas)}  Fuentes citadas: {len(fuentes_final)}  (no citadas, excluidas: {len(sin_citar)})")
    if sin_citar:
        print("       excluidas: " + ", ".join(sin_citar))
    dist = {}
    for s in sintomas:
        dist[s["confianza"]] = dist.get(s["confianza"], 0) + 1
    print(f"Confianza: {dist}")

    if SALIDA.exists() and not force:
        fallo(f"{SALIDA} ya existe (escrito por otra sesión); revísalo y usa --force para sobreescribir")
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    doc = {"version": VERSION, "sintomas": sintomas, "fuentes": fuentes_final}
    SALIDA.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Escrito {SALIDA} ({SALIDA.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
