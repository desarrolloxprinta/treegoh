# Fase 0 — Lista maestra de especies

## Objetivo
Construir la lista de especies que tendrán ficha, priorizada por popularidad real en España (Madrid) sin excluir especies raras o de coleccionista que se cultiven en interior.

## Pasos
1. Investiga qué plantas de interior se venden más en España: catálogos de grandes viveros y cadenas (Verdecora, Leroy Merlin, IKEA, Viveros, floristerías de Madrid), informes del sector (AEFI, FEPEX), rankings de jardines botánicos y sociedades hortícolas. Cruza al menos tres fuentes.
2. Añade plantas de coleccionista habituales en interior (aroideas raras, hoyas, begonias, calatheas, cactus y suculentas poco comunes, plantas carnívoras de interior, bonsáis de interior, orquídeas).
3. Añade aromáticas y comestibles que se cultivan en cocina o balcón (albahaca, menta, perejil, cítricos enanos).
4. Objetivo: entre 120 y 180 especies. Mínimo 100.
5. Asigna a cada una: `prioridad` 1 a 5 (5 = más vendida), `categoria` (tropical, suculenta, cactus, aromatica, orquidea, carnivora, bonsai, helecho, palmera, trepadora, flor, otra), `rareza` (comun, media, coleccionista).

## Salida
`output/lista-maestra.csv` con columnas exactas:
```
orden,nombre_cientifico,nombres_comunes,familia,categoria,prioridad,rareza,archivo_ficha
```
- `orden`: entero, 1 = primera ficha a hacer (ordena por prioridad descendente y luego alfabético).
- `nombres_comunes`: separados por `;`.
- `archivo_ficha`: `genero-especie.json` en minúsculas sin acentos.

Además:
- Rellena la tabla "Fase 3 — lotes de fichas" de `ESTADO.md` con lotes de 15 (lote 1 = orden 1 a 15, etc.), estado `pendiente`.
- Anota en `output/fuentes.md` las fuentes usadas para la priorización.
- Ejecuta `python scripts/validar.py` y marca Fase 0 en `ESTADO.md`.
