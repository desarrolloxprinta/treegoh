# Fase 5 — Consolidación

Solo cuando Fases 0 a 4 estén marcadas en `ESTADO.md`.

## 1. Revisión cruzada
- Ejecuta `python scripts/validar.py --estricto`. Todo en verde.
- Comprueba que cada id de síntoma usado en `problemas_frecuentes` de las fichas existe en `output/diagnostico/arbol.json`.
- Comprueba que cada especie citada en `reglas-meteo.json` tiene ficha.
- Revisa `output/contradicciones.md`: cada entrada debe tener resolución. Revisa `output/lagunas.md`: cada laguna debe decir qué se intentó.

## 2. Bibliografía
`output/bibliografia.md`: todas las fuentes de todos los archivos, deduplicadas, con URL, institución, tipo (prioritaria/complementaria), fecha de consulta y qué archivos respalda.

## 3. Resumen ejecutivo
`output/resumen-ejecutivo.md`: principios universales, los 10 errores que más plantas matan, cómo usa la app cada bloque de conocimiento, estadísticas (nº de especies, nº de síntomas, nº de reglas meteo, nº de fuentes, % de datos con confianza Alta).

## 4. Compilación
- `scripts/compilar.py` genera `output/biblia.json` (todas las fichas + árbol + reglas en un único JSON para la app) y `BIBLIA.md` (documento legible completo: resumen, lógica, diagnóstico, fichas, productos, mitos, bibliografía, anexos).
- Ejecútalo y revisa que BIBLIA.md se abre y tiene índice.

## 5. Cierre
Marca Fase 5 en `ESTADO.md` y escribe en el registro un resumen final con las cifras.
