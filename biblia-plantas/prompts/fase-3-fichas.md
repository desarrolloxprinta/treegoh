# Fase 3 — Fichas de especie (por lotes, con subagentes en paralelo)

Tú actúas como orquestador. No investigas especies tú mismo: delegas cada una a un subagente y te quedas con la coordinación, la validación y el estado.

## 1. Qué lote hacer
Lee `ESTADO.md` → tabla "Fase 3 — lotes de fichas" → primer lote con estado `pendiente`. Toma sus especies de `output/lista-maestra.csv` por el campo `orden`. Haz SOLO ese lote en este turno.

## 2. Lanzar subagentes
- Lanza un subagente (tipo `general-purpose`) por especie, en **grupos de 5 en paralelo** (una sola llamada con 5 Agent a la vez). Cuando termine un grupo, lanza el siguiente hasta cubrir las 15 del lote.
- Cada subagente recibe el encargo de `prompts/subagente-ficha.md` con los marcadores sustituidos: `{{NOMBRE_CIENTIFICO}}`, `{{NOMBRES_COMUNES}}`, `{{CATEGORIA}}`, `{{PRIORIDAD}}`, `{{RAREZA}}`, `{{ARCHIVO_FICHA}}`, `{{FECHA}}`. Pásale el texto completo del encargo: el subagente no ve esta conversación.
- Si existe `output/diagnostico/arbol.json`, añade al encargo la lista de ids y nombres de síntoma (solo `id` y `nombre`, no el árbol entero) para que rellene `problemas_frecuentes` con ids reales.
- Exige al subagente que termine con un informe de 5 líneas: archivo escrito, nº de fuentes prioritarias, nº de bloques con confianza Alta, lagunas, dudas.

## 3. Validar y reintentar
1. Cuando el lote completo haya terminado, ejecuta `python scripts/validar.py`.
2. Para cada ficha con errores, relanza UN subagente con el mismo encargo más esta cabecera:
   `CORRECCIÓN: la ficha ya existe en {{ARCHIVO_FICHA}}. Léela, corrige SOLO estos errores del validador y vuelve a guardarla:` seguida de las líneas de error de esa ficha. Varias correcciones pueden ir en paralelo.
3. Máximo 2 rondas de corrección. Si una ficha sigue fallando, corrígela tú directamente leyendo el archivo; si el fallo es por falta de fuentes, baja la confianza del bloque a Media o Baja y anota la laguna en la ficha y en `output/lagunas.md`. No marques el lote con el validador en rojo.

## 4. Cerrar el lote
- Actualiza la fila del lote en `ESTADO.md`: estado `hecho`, fecha, nº de fuentes prioritarias distintas usadas en el lote, nº de lagunas.
- Vuelca las contradicciones que reporten los subagentes en `output/contradicciones.md`.
- Registra el turno. Si quedan lotes, NO empieces el siguiente en este turno.
- Cuando todos los lotes estén `hecho`, marca Fase 3.

## Reglas del orquestador
- Nunca aceptes una ficha solo porque el subagente dice que está bien: la fuente de verdad es el validador.
- Si un subagente no escribe el archivo o devuelve un informe incoherente, relánzalo una vez; a la segunda, haz tú esa especie.
- Si el contexto se agota a mitad de lote, deja en `ESTADO.md` qué fichas del lote están validadas y cuáles no, con estado `parcial`, para que el siguiente turno retome solo las que faltan.
