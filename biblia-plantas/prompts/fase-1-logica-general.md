# Fase 1 — Lógica general de cuidado

Investiga y redacta los cinco documentos siguientes. Cada afirmación lleva nivel de confianza y referencias `[F1]`, `[F2]`... que se listan al final de cada archivo con URL, institución y fecha de consulta.

## Si existe `output/research/fase-1.md` (informe de Research de Claude desktop)
Úsalo como material de partida en vez de investigar desde cero:
1. Léelo entero. Abre con WebFetch una muestra de al menos 10 citas y todas las que respalden datos de riego, temperatura o tratamiento. Si una URL no existe o no dice lo que se le atribuye, elimina la cita y baja la confianza del dato.
2. Reparte el contenido en los cinco archivos de abajo, respetando sus encabezados. No resumas.
3. Convierte la tabla de reglas meteorológicas a `output/logica/reglas-meteo.json` según el esquema. Cada regla conserva sus fuentes.
4. Completa con búsqueda propia lo que el informe deje corto (lagunas marcadas, secciones sin dos fuentes).
5. Pasa sus secciones "Contradicciones" y "Lagunas" a `output/contradicciones.md` y `output/lagunas.md`.

## 1. `output/logica/principios.md`
- Principios universales de cuidado de plantas de interior: luz, agua, sustrato, drenaje, humedad, temperatura, nutrición, reposo.
- Los 10 errores que más plantas matan en casa, ordenados por frecuencia, con la evidencia.
- Cómo se debe regar (criterio por humedad del sustrato y peso de maceta, dedo a 2-3 cm, drenaje completo, no dejar agua en el plato).
- Cómo se lee la luz: tipos (directa, brillante indirecta, media, baja), rangos orientativos en lux y foot-candles, orientación de ventanas en hemisferio norte y sur, efecto de la distancia a la ventana, cortinas y estación.

## 2. `output/logica/ubicacion.md`
- Método para evaluar cada zona de una vivienda: orientación, distancia a ventana, obstáculos, humedad, temperatura, corrientes.
- Riesgos típicos de la vivienda española: radiadores en invierno, aire acondicionado en verano, ventanas orientadas a sur con sol directo en verano, balcones y terrazas, cocinas y baños.
- Tabla: escenario de ubicación → luz estimada → humedad típica → categorías de plantas que encajan → categorías que no.
- Cómo puede el agente estimar la luz desde una foto (sombras, contraste, hora, orientación declarada) y desde el sensor de luz del móvil, con sus límites.

## 3. `output/logica/reglas-meteo.json` (según `schemas/regla-meteo.schema.json`)
- Reglas que traducen datos meteorológicos y de interior en ajustes de cuidado: temperatura exterior e interior, humedad relativa, horas de sol, ola de calor, ola de frío, calefacción activa, aire acondicionado, lluvia (para plantas en balcón).
- Cada regla: condición medible, ajuste concreto (riego, pulverización, sombreado, proteger, mover), categorías o especies afectadas, estación, confianza, fuentes.
- Resuelve Madrid como caso: clima mediterráneo continental (veranos secos a 35-40 °C, inviernos a 0-5 °C, humedad interior con calefacción por debajo del 30 %). Usa datos climáticos normales de AEMET.
- Acompaña con `output/logica/meteo.md` explicando la lógica y cómo se adapta a otra ubicación.

## 4. `output/logica/calendario.md`
- Tabla por estación (hemisferio norte y sur): trasplante, poda, inicio y fin de abonado, reposo, cambio de ubicación, protección frente a calor y frío, revisión de plagas.
- Variables que ajustan la frecuencia de cada tarea: especie, estación, tamaño y material de maceta, tipo de sustrato, clima local, meteorología del momento.
- Errores de los recordatorios fijos y cómo debe calcular la app la próxima fecha (modelo: fecha base por especie × factor estacional × factor meteorológico × factor de maceta).

## 5. `output/logica/mitos.md`
- Consejos populares erróneos o peligrosos que el agente nunca debe dar, con la evidencia que los desmonta (ejemplos: regar con hielo, cáscaras de huevo como abono, pulverizar siempre para dar humedad, grava en el fondo para drenaje, regar por calendario fijo, café para acidificar, leche en hojas, etc.).

## Al terminar
- Contradicciones entre fuentes → `output/contradicciones.md`. Lagunas → `output/lagunas.md`.
- `python scripts/validar.py`. Marca Fase 1 en `ESTADO.md` y registra el turno.
