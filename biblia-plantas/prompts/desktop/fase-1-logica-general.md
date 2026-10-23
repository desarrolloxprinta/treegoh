Actúa como un equipo de investigación formado por un botánico especializado en plantas de interior y tropicales, un fitopatólogo de plagas y enfermedades domésticas y un ingeniero agrónomo con experiencia en clima mediterráneo continental.

Estoy construyendo la base de conocimiento de una app asistente de cuidado de plantas de interior. La app geolocaliza al usuario, consulta la meteorología local y ajusta riegos y cuidados; usa visión por IA para identificar especies y diagnosticar problemas por foto. Mercado principal: España, Madrid. La lógica debe funcionar para cualquier ubicación. Un dato erróneo puede matar una planta real: la fiabilidad manda sobre la amplitud.

REGLAS DE VERIFICACIÓN (obligatorias)
- Cada dato de cuidado, diagnóstico o tratamiento debe estar respaldado por al menos dos fuentes independientes y fiables.
- Fuentes prioritarias: universidades y servicios de extensión agrícola (UF/IFAS, Clemson, Penn State, Univ. Minnesota, UC ANR, UC IPM), jardines botánicos y sociedades (Real Jardín Botánico de Madrid, Kew, Missouri Botanical Garden, RHS, NYBG), organismos oficiales (MAPA, AEMET, EFSA, ASPCA, EPPO) y revistas revisadas por pares. Blogs, viveros, tiendas y foros solo como fuente complementaria, nunca como única.
- Asigna a cada afirmación un nivel de confianza entre corchetes: [Alta] dos o más fuentes prioritarias coinciden; [Media] una prioritaria o dos complementarias coherentes; [Baja] solo complementarias o evidencia anecdótica.
- Si dos fuentes fiables se contradicen, dilo, expón ambas posturas y recomienda la más conservadora para la planta.
- Si no encuentras información verificable, dilo expresamente. No rellenes huecos con suposiciones.
- Nombres científicos en latín. Español de España.
- Datos accionables: rangos concretos, frecuencias con sus condiciones, pasos ordenados. Nada vago.

FORMATO DE SALIDA
- Markdown con los encabezados exactos que se piden abajo, tablas donde haya datos comparables.
- Referencias numeradas [F1], [F2]... en el texto y una sección final "Bibliografía" con URL, institución, tipo (prioritaria o complementaria) y fecha de consulta de cada una.
- Dos secciones finales obligatorias: "Contradicciones entre fuentes" y "Lagunas".
- No resumas para ahorrar espacio. Si la respuesta es larga, es correcto.

TAREA: LÓGICA GENERAL DE CUIDADO. Investiga y redacta estas cinco secciones.

# 1. Principios
- Principios universales de cuidado de plantas de interior: luz, agua, sustrato, drenaje, humedad, temperatura, nutrición, reposo.
- Los 10 errores que más plantas matan en casa, ordenados por frecuencia, con la evidencia.
- Cómo se debe regar: criterio por humedad del sustrato y peso de la maceta, prueba del dedo a 2-3 cm, drenaje completo, no dejar agua en el plato.
- Cómo se lee la luz: tipos (directa, brillante indirecta, media, baja), rangos orientativos en lux y foot-candles, orientación de ventanas en hemisferio norte y sur, efecto de la distancia a la ventana, cortinas y estación.

# 2. Ubicación en el hogar
- Método para evaluar cada zona de una vivienda: orientación, distancia a ventana, obstáculos, humedad, temperatura, corrientes.
- Riesgos típicos de la vivienda española: radiadores en invierno, aire acondicionado en verano, ventanas a sur con sol directo en verano, balcones y terrazas, cocinas y baños.
- Tabla: escenario de ubicación → luz estimada (lux) → humedad típica → categorías de plantas que encajan → categorías que no.
- Cómo estimar la luz desde una foto (sombras, contraste, hora, orientación declarada) y desde el sensor de luz del móvil, con sus límites.

# 3. Meteorología y ajustes de cuidado
- Reglas que traducen datos meteorológicos y de interior en ajustes concretos. Preséntalas en una tabla con estas columnas exactas: id | variable (temp_exterior, temp_interior, humedad_relativa_exterior, humedad_relativa_interior, horas_sol, ola_calor, ola_frio, calefaccion_activa, aire_acondicionado_activo, lluvia, viento, radiacion_uv) | condición (operador y valor con unidad) | duración mínima en días | acción (multiplicar_frecuencia_riego, pulverizar, sombrear, mover, proteger_frio, aumentar_humedad, suspender_abonado, revisar_plagas, aviso) | factor o valor | categorías de planta afectadas | excepciones | estaciones | explicación para el usuario | confianza | fuentes. Mínimo 15 reglas.
- Resuelve Madrid como caso: clima mediterráneo continental (veranos secos a 35-40 °C, inviernos a 0-5 °C, humedad interior con calefacción por debajo del 30 %). Usa valores climatológicos normales de AEMET para Madrid.
- Explica la lógica general y cómo se adapta a otra ubicación o al hemisferio sur.

# 4. Calendario estacional
- Tabla por estación, para hemisferio norte y sur: trasplante, poda, inicio y fin de abonado, reposo, cambio de ubicación, protección frente a calor y frío, revisión de plagas.
- Variables que ajustan la frecuencia de cada tarea: especie, estación, tamaño y material de maceta, tipo de sustrato, clima local, meteorología del momento.
- Errores de los recordatorios fijos y cómo debería calcular la app la próxima fecha (modelo: fecha base por especie × factor estacional × factor meteorológico × factor de maceta).

# 5. Mitos y errores frecuentes
- Consejos populares erróneos o peligrosos que la app nunca debe dar, con la evidencia que los desmonta (regar con hielo, cáscaras de huevo como abono, pulverizar siempre para dar humedad, grava en el fondo para drenaje, regar por calendario fijo, café para acidificar, leche en hojas, etc.). Mínimo 20.

# Contradicciones entre fuentes
# Lagunas
# Bibliografía
