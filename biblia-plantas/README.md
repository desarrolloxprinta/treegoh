# Biblia de plantas de interior — cómo ejecutarla con Claude Code

Proyecto de investigación automatizada para construir la base de conocimiento verificada de una app de cuidado de plantas (Madrid, España, extensible a cualquier ubicación).

## Requisitos
- Claude Code con acceso web (WebSearch y WebFetch).
- Python 3.10 o superior (solo para el validador y el compilador, sin librerías externas).

## Arranque
Abre una terminal en esta carpeta y lanza Claude Code:

```bash
claude
```

Dentro de Claude Code escribe:

```
/biblia
```

Cada `/biblia` ejecuta UNA fase o UN lote de fichas, valida, guarda y actualiza `ESTADO.md`. Repite `/biblia` hasta que diga que todas las fases están hechas. Puedes cerrar y volver otro día: el estado está en el archivo, no en el chat.

Para encadenar varias fases sin intervenir, desde la terminal:

```bash
claude -p "/biblia" --allowedTools "WebSearch,WebFetch,Read,Write,Edit,Agent,Bash(python *)"
```

Lánzalo tantas veces como fases y lotes haya (con 150 especies: 5 fases + 10 lotes = unas 15 ejecuciones).

## Fase 3 en paralelo
La Fase 3 no investiga especie a especie en secuencia. El turno actúa como orquestador: lanza un subagente por especie, en grupos de 5 simultáneos, con el encargo de `prompts/subagente-ficha.md`. Cada subagente busca sus fuentes, escribe su JSON y devuelve un informe de 5 líneas. El orquestador pasa el validador, relanza con los errores concretos a los que fallen (máximo 2 rondas) y solo entonces cierra el lote. Esto consume más tokens por turno, pero un lote de 15 fichas tarda una fracción del tiempo.

## Flujo híbrido con Claude desktop
Las fases 1, 2 y 4 son independientes: se pueden lanzar a la vez en tres chats de Claude desktop con Research activado.

1. Abre tres chats nuevos. En cada uno pega íntegro el contenido de `prompts/desktop/fase-1-logica-general.md`, `fase-2-diagnostico.md` y `fase-4-productos.md` respectivamente. Llevan el contexto y las reglas dentro, porque desktop no lee `CLAUDE.md`.
2. Activa Research antes de enviar. Si la respuesta se corta, pide "continúa exactamente donde lo dejaste" hasta completar.
3. Copia cada informe completo (con bibliografía, contradicciones y lagunas) a `output/research/fase-1.md`, `fase-2.md` y `fase-4.md`.
4. Lanza `/biblia`. Al llegar a cada fase, Claude Code detecta el informe, reabre las citas críticas para comprobarlas, reparte el contenido en los archivos finales, genera los JSON y valida. Lo que no supere la comprobación baja de confianza o pasa a lagunas.

Las fases 0, 3 y 5 se hacen siempre en Claude Code.

## Qué hace cada fase
| Fase | Resultado |
|------|-----------|
| 0 | Lista maestra de 120-180 especies priorizadas por ventas en España |
| 1 | Principios, ubicación, reglas meteorológicas (JSON), calendario estacional, mitos |
| 2 | Árbol de diagnóstico por síntoma (JSON), fichas de plagas y enfermedades, protocolo de fotos |
| 3 | Fichas de especie en JSON, lotes de 15 |
| 4 | Productos y herramientas disponibles en España |
| 5 | Bibliografía, resumen ejecutivo, `biblia.json` y `BIBLIA.md` |

## Control de calidad
- `python scripts/validar.py` comprueba esquemas, que cada dato "Alta" tenga dos fuentes prioritarias, que las fuentes referenciadas existan y que los archivos no estén truncados.
- `python scripts/validar.py --estricto` añade las comprobaciones cruzadas de la Fase 5.
- `output/contradicciones.md` y `output/lagunas.md` recogen lo que las fuentes no resuelven. Léelos antes de dar la biblia por buena.

## Estructura
```
CLAUDE.md            reglas del proyecto (Claude Code las lee solo)
ESTADO.md            progreso y registro de turnos
.claude/commands/    comando /biblia
prompts/             un prompt por fase + encargo del subagente de ficha
schemas/             esquemas JSON de fichas, diagnóstico y reglas meteo
scripts/             validar.py, compilar.py
output/              resultados (se va llenando)
BIBLIA.md            documento final (Fase 5)
```

## Revisión humana recomendada
El validador comprueba forma y trazabilidad, no verdad. Antes de usar la biblia en la app, revisa al menos: las 20 fichas de mayor prioridad, el árbol de diagnóstico completo y la sección de fitosanitarios de `productos.md`.
