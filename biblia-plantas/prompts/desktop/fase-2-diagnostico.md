Actúa como un equipo de investigación formado por un botánico especializado en plantas de interior y tropicales, un fitopatólogo de plagas y enfermedades domésticas y un ingeniero agrónomo con experiencia en clima mediterráneo continental.

Estoy construyendo la base de conocimiento de una app asistente de cuidado de plantas de interior. La app usa visión por IA para diagnosticar problemas por foto y después hace preguntas al usuario para confirmar. Mercado principal: España, Madrid. Un dato erróneo puede matar una planta real: la fiabilidad manda sobre la amplitud.

REGLAS DE VERIFICACIÓN (obligatorias)
- Cada dato de diagnóstico o tratamiento debe estar respaldado por al menos dos fuentes independientes y fiables.
- Fuentes prioritarias: universidades y servicios de extensión agrícola (UF/IFAS, Clemson, Penn State, Univ. Minnesota, UC ANR, UC IPM), jardines botánicos y sociedades (Real Jardín Botánico de Madrid, Kew, Missouri Botanical Garden, RHS, NYBG), organismos oficiales (MAPA, AEMET, EFSA, EPPO) y revistas revisadas por pares. Blogs, viveros, tiendas y foros solo como fuente complementaria, nunca como única.
- Asigna a cada afirmación un nivel de confianza entre corchetes: [Alta] dos o más fuentes prioritarias coinciden; [Media] una prioritaria o dos complementarias coherentes; [Baja] solo complementarias o evidencia anecdótica.
- Si dos fuentes fiables se contradicen, dilo, expón ambas posturas y recomienda la más conservadora para la planta.
- Si no encuentras información verificable, dilo expresamente. No rellenes huecos con suposiciones.
- Nombres científicos en latín. Español de España.
- Fitosanitarios: solo ingredientes activos de uso doméstico autorizados en España y la UE. Sin marcas.

FORMATO DE SALIDA
- Markdown con los encabezados exactos que se piden abajo, tablas donde haya datos comparables.
- Referencias numeradas [F1], [F2]... en el texto y una sección final "Bibliografía" con URL, institución, tipo (prioritaria o complementaria) y fecha de consulta.
- Dos secciones finales obligatorias: "Contradicciones entre fuentes" y "Lagunas".
- No resumas para ahorrar espacio. Si la respuesta es larga, es correcto.

TAREA: DIAGNÓSTICO VISUAL, PLAGAS Y ENFERMEDADES.

# 1. Árbol de diagnóstico por síntoma
Para CADA uno de estos síntomas observables en foto, con id S01, S02... en este orden: hojas amarillas generalizadas; hojas amarillas solo las viejas; hojas amarillas solo las nuevas; amarilleo entre nervios; puntas marrones; bordes marrones; manchas marrones secas; manchas negras blandas; manchas con halo amarillo; moteado fino plateado; telarañas finas; masas algodonosas blancas; escudos marrones en tallo u hojas; hojas caídas o lacias; hojas enrolladas; hojas blandas; hojas arrugadas; tallo blando o negro en la base; etiolación (tallos largos y débiles); crecimiento detenido; hojas nuevas pequeñas; pérdida de variegación; caída de hojas tras cambio de sitio; sustrato con moho blanco; mosquitos sobre el sustrato; polvo blanco en hojas; agujeros en hojas; hojas pegajosas; residuo negro (fumagina); raíces saliendo por el drenaje.

Para cada síntoma:
- Cómo se ve (descripción para que una IA de visión lo reconozca) y dónde mirar (haz, envés, tallo, sustrato).
- Urgencia (baja, media, alta).
- Causas posibles ordenadas por probabilidad (alta, media, baja), cada una con: tipo (riego, luz, humedad, temperatura, nutrición, sustrato, plaga, enfermedad, fisiológico, ambiental, agua), cómo diferenciarla de las otras, preguntas de confirmación que la app debe hacer al usuario (¿cuándo regaste?, ¿ha cambiado de sitio?, ¿hay calefacción cerca?, ¿has mirado el envés?), tratamiento paso a paso de menor a mayor agresividad, tiempo de recuperación esperable, y cuándo descartar la planta.
- Confianza y fuentes.

# 2. Plagas y enfermedades de interior
Ficha para cada una: araña roja, cochinilla algodonosa, cochinilla de escudo, pulgón, trips, mosca del sustrato (sciáridos), mosca blanca, oídio, botritis, manchas foliares fúngicas, manchas bacterianas, pudrición radicular (Pythium, Phytophthora, Fusarium), roya, nematodos. Para cada una:
- Identificación visual (qué buscar, dónde, con qué aumento), ciclo de vida y condiciones que la favorecen en interior.
- Daño que causa y especies más sensibles.
- Tratamiento escalonado: mecánico → jabón potásico / aceites → biológico → químico de uso doméstico autorizado en España, con ingrediente activo, dosis y frecuencia según fuente.
- Prevención y cuarentena.
- Confianza y fuentes.

# 3. Protocolo fotográfico
- Fotos que la app debe pedir en un diagnóstico: planta entera, hoja afectada por haz y envés, base del tallo, sustrato, maceta y plato, entorno.
- Condiciones: luz natural, sin flash, fondo neutro, distancia, enfoque.
- Seguimiento periódico: frecuencia según dificultad de la planta, mismo ángulo y hora, indicadores a comparar entre fotos (color, turgencia, hojas nuevas, tamaño, plaga, sustrato).
- Señales de deterioro temprano que la app debe vigilar entre fotos.

# Contradicciones entre fuentes
# Lagunas
# Bibliografía
