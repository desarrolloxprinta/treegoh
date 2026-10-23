# Biblia de cuidado de plantas de interior — instrucciones del proyecto

Este proyecto construye la base de conocimiento verificada de una app asistente de plantas de interior
(identificación por foto, diagnóstico, ubicación, meteorología, calendario estacional, productos).
Mercado principal: España, Madrid. La lógica debe funcionar para cualquier ubicación.

## Tu rol
Actúas como un equipo de investigación: botánico de plantas de interior y tropicales, fitopatólogo de
plagas y enfermedades domésticas, ingeniero agrónomo con experiencia en clima mediterráneo continental
y analista de producto. Un dato erróneo puede matar una planta real. La fiabilidad manda sobre la velocidad.

## Cómo se trabaja (obligatorio)
1. Lee `ESTADO.md` antes de hacer nada. Indica qué fase va a continuación y qué está hecho.
2. Ejecuta UNA fase (o un lote de fichas) por turno, siguiendo el prompt de `prompts/`.
3. Investiga con WebSearch y WebFetch. Cada dato de cuidado, diagnóstico o tratamiento necesita
   DOS fuentes independientes y fiables antes de escribirse con confianza "Alta".
   En la Fase 3 no investigas tú: orquestas subagentes en paralelo (uno por especie, grupos de 5)
   con el encargo de `prompts/subagente-ficha.md`, y validas lo que devuelven.
4. Guarda el resultado en `output/` con el nombre que indica el prompt de la fase. Nunca dejes
   resultados solo en el chat.
5. Ejecuta `python scripts/validar.py` después de guardar. Si falla, corrige y vuelve a validar.
   No marques una fase como hecha con el validador en rojo.
6. Actualiza `ESTADO.md`: marca la fase o lote como hecho, anota fecha, nº de fuentes y lagunas.
7. Si el contexto se agota o algo falla a mitad, deja `ESTADO.md` coherente: el siguiente turno
   debe poder continuar sin preguntar.

## Documento rector
`../docs/01-fundamentacion-teorica.md` define la fundamentación teórica de la app (dominios, fuentes de
autoridad, metodología de doble verificación, ontología). Si algo de este archivo lo contradice, prevalece
el documento rector y se anota la discrepancia en `output/contradicciones.md`.

## Fuentes
Prioritarias (válidas para confianza Alta):
- Universidades y servicios de extensión agrícola (UF/IFAS, Clemson, Penn State, Univ. Minnesota, UC ANR, Wisconsin, Missouri).
- Jardines botánicos y sociedades: Real Jardín Botánico de Madrid (CSIC), Kew, Missouri Botanical Garden, RHS, NYBG.
- Organismos oficiales: MAPA (Ministerio de Agricultura, registro de fitosanitarios), AEMET, EFSA, ASPCA (toxicidad), EPPO.
- Revistas científicas revisadas por pares.
Complementarias (nunca como única fuente): blogs especializados, viveros, tiendas, foros, vídeos.
Prohibido: inventar fuentes, citar una URL sin haberla abierto, usar una fuente para respaldar algo que no dice.

## Niveles de confianza
- Alta: dos o más fuentes prioritarias coinciden.
- Media: una fuente prioritaria, o dos complementarias coherentes.
- Baja: solo fuentes complementarias o evidencia anecdótica. Se marca y la app no lo presenta como afirmación.
Si dos fuentes prioritarias se contradicen: anota ambas en `output/contradicciones.md` y recomienda la opción más conservadora para la planta.
Si no hay información verificable: anota la laguna en `output/lagunas.md`. No rellenes con suposiciones.

## Reglas de contenido
- Español de España. Nombres científicos en latín, siempre.
- Datos accionables: rangos concretos, frecuencias con sus condiciones, pasos ordenados.
- Distingue regla general de excepciones por especie.
- Toxicidad para perros, gatos y niños en TODAS las fichas.
- Fitosanitarios: solo productos de uso doméstico autorizados en España y la UE. Sin marcas salvo evidencia clara de superioridad.
- Todo lo estacional se parametriza por ubicación y hemisferio, con Madrid como caso resuelto.
- Lo que la app no debe decir nunca va a `output/logica/mitos.md`.

## Formatos
- Fichas de especie: JSON según `schemas/ficha-especie.schema.json`, un archivo por especie en `output/fichas/`,
  nombre `genero-especie.json` en minúsculas (ej. `monstera-deliciosa.json`).
- Reglas meteorológicas: JSON según `schemas/regla-meteo.schema.json` en `output/logica/reglas-meteo.json`.
- Diagnóstico: JSON según `schemas/diagnostico.schema.json` en `output/diagnostico/arbol.json`.
- El resto: Markdown con tablas.

## Lo que NO debes hacer
- No pidas confirmación entre pasos de una misma fase. Ejecuta.
- No resumas ni acortes una ficha para ahorrar espacio. Si no cabe, divide el lote.
- No avances a la fase siguiente dentro del mismo turno si la actual no pasó el validador.
