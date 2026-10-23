# Principios universales de cuidado de plantas de interior

Fase 1 · Redactado el 2026-10-20 (reconstruido en el mismo día tras una sobrescritura accidental; ver registro de turnos en `ESTADO.md`). Cada afirmación lleva nivel de confianza y referencias `[Fn]` que se listan al final del archivo con URL, institución y fecha de consulta. Todas las URL se abrieron y el dato citado se leyó en la página. Los identificadores `[Fn]` son propios de este archivo (cada documento de la Fase 1 lleva su propia lista, como en `meteo.md`, `ubicacion.md`, `calendario.md` y `mitos.md`).

Niveles (según `CLAUDE.md`): **Alta** = dos o más fuentes prioritarias coinciden; **Media** = una prioritaria, o dos complementarias coherentes; **Baja** = solo complementarias o anecdótico. Cuando dos prioritarias discrepan, se adopta la opción más conservadora para la planta y se registra en `output/contradicciones.md` (referencias C1-C30 citadas aquí por su número).

Qué cubre este documento: (1) los principios universales por factor, (2) los diez errores que más plantas matan en casa, (3) cómo se riega, (4) cómo se lee la luz. El detalle por zona de la vivienda está en `ubicacion.md`; los ajustes meteorológicos en `reglas-meteo.json` y `meteo.md`; las tareas por estación en `calendario.md`; lo que el agente nunca debe decir, en `mitos.md`.

---

## 1. Principios universales por factor

### 1.1 Resumen operativo

| Factor | Principio que la app aplica siempre | Confianza | Fuentes |
|---|---|---|---|
| Luz | Es el factor que decide dónde puede vivir una planta y "probablemente el más esencial" (Maryland). Sin luz suficiente no se fabrican carbohidratos, las reservas se agotan y la planta muere; ni el abono, ni más agua, ni un trasplante lo compensan (Missouri: "los efectos de la luz insuficiente no se curan con abono, agua o trasplante"). | Alta | [F2] [F6] [F15] [F20] |
| Agua | Se riega cuando el sustrato lo pide, nunca por calendario. El exceso de agua mata más plantas que cualquier otro factor porque las raíces necesitan oxígeno además de agua. | Alta | [F11] [F12] [F13] [F15] [F19] [F36] |
| Sustrato | Mezclas ligeras y porosas (turba o fibra de coco con perlita y vermiculita; corteza para orquídeas epífitas; mezcla con arena para cactus). La tierra de jardín en maceta "es demasiado pesada para drenar" y provoca exceso de riego y enfermedades de raíz. | Alta | [F15] [F19] [F8] |
| Drenaje | Toda maceta necesita agujero. Regar hasta que salga agua por abajo y vaciar el plato: la planta nunca queda en agua estancada. Una capa de grava o cascotes en el fondo no mejora el drenaje: lo empeora (C27). | Alta (agujero y plato) / Alta (grava, C27) | [F11] [F12] [F13] [F15] [F30] [F34] |
| Humedad | La mayoría prefiere 40-60 % de humedad relativa; casi todas sufren por debajo del 20 % (Nebraska) y las casas con calefacción bajan de 30 % (en EE. UU. se miden 10-30 %). Cactus y suculentas son la excepción. Pulverizar no sube la humedad (C12); agrupar plantas, humidificador y estancia húmeda, sí. | Alta (rango y métodos) / Media (umbral 20 %, C14) | [F8] [F14] [F21] [F22] [F23] [F4] [F15] |
| Temperatura | Día 18-24 °C, noche 3-6 °C más fresca para la mayoría (C4). Daño por frío en tropicales por debajo de 10 °C aunque no hiele (C5); daño por cambios bruscos, corrientes, cristal frío de noche y aire caliente de radiadores. | Alta | [F14] [F4] [F8] [F10] [F15] [F16] [F20] |
| Nutrición | Abonar solo con crecimiento activo (hojas o flores nuevas), a un cuarto o la mitad de la dosis de etiqueta y como mucho una vez al mes (C20); nada en invierno sin brotes; nunca a una planta marchita, enferma, recién trasplantada o en malas condiciones de luz. El exceso quema raíces y deja costra blanca de sales. | Alta | [F14] [F15] [F27] [F28] [F31] [F13] |
| Reposo | Con días cortos y menos luz la mayoría reduce o detiene el crecimiento aunque la casa esté caldeada: menos agua, sin abono, sin trasplantes ni podas fuertes. Cactus del desierto: reposo seco y fresco (8-10 °C de noche como objetivo, nunca por debajo de 5-7 °C; C8). | Alta | [F11] [F24] [F25] [F27] [F32] [F14] |

**Regla de oro del agente:** las condiciones se evalúan juntas, no por separado. Una planta en poca luz consume menos agua ("en ambientes con menos luz las plantas crecen más despacio y usan menos agua", Minnesota); una planta en luz alta y calefacción se seca en días ("las zonas de luz alta pueden ser cálidas y las plantas se secan antes"). Riego, abono y calendario se derivan de luz × temperatura × humedad × maceta × fase, no de la especie sola. **Alta** [F2] [F11] [F12] [F15]

### 1.2 Luz: por qué manda sobre todo lo demás
- Todas las plantas necesitan luz para la fotosíntesis; sin luz suficiente "no se fabrican carbohidratos, las reservas de energía se agotan y las plantas mueren" (Minnesota). **Alta** [F2] [F6]
- La luz determina el consumo de agua y la capacidad de usar el abono: "una planta con luz adecuada soporta mejor la temperatura alta y la humedad baja de muchas casas" (Missouri). **Alta** [F15] [F2]
- Tres dimensiones: intensidad (lux o pie-candela), duración (horas al día) y calidad (espectro). Para luz natural importa sobre todo la intensidad y, en plantas de día corto, la duración. **Alta** [F6] [F1]
- El detalle (categorías, orientación, distancia, estación, señales) está en la sección 4.

### 1.3 Agua: la causa número uno de muerte
- "El asesino número uno de las plantas de interior es el exceso de riego" (Maryland Grows); "la causa principal de muerte de plantas en maceta" (Clemson); "la causa número uno" (Mississippi State); "la causa más común de pérdida de plantas en contenedor" (RHS); "probablemente mueren o se dañan más por riego inadecuado que por cualquier otro factor" (Missouri); el declive "se asocia más comúnmente con un riego inadecuado" (UC IPM). Maryland matiza que "un gran porcentaje se pierde por exceso y por defecto" y que el problema real es regar por calendario (C15). **Alta** [F19] [F11] [F4] [F36] [F15] [F16] [F13]
- Mecanismo: con el sustrato saturado el aire sale de los poros, las raíces se asfixian y mueren ("el exceso de humedad mata las raíces; al morir las raíces, el follaje se decolora y muere", UC IPM). Una vez muertas las raíces, la planta se marchita aunque haya agua, y regar más empeora. **Alta** [F17] [F11]
- El detalle (cuándo, cómo, agua, sales, síntomas) está en la sección 3.

### 1.4 Sustrato y drenaje
- La mezcla debe retener agua y a la vez dejar aire. Missouri recomienda, para la mayoría, 3 partes de turba de sphagnum, 1 de vermiculita y 1 de perlita, o una mezcla comercial "peat-lite"; orquídeas epífitas en corteza; cactus en mitad mezcla y mitad arena estéril; "en la mayoría de los casos evita añadir tierra al sustrato, porque suele llevar a mal drenaje, exceso de riego y enfermedades de raíz". Maryland Grows: "la tierra de jardín es un no: demasiado pesada para drenar bien". Nebraska: usar sustrato comercial pasteurizado. **Alta** [F15] [F19] [F8]
- El agujero de drenaje es obligatorio ("es necesario para que el exceso de agua salga", Penn State; Clemson: "las macetas deben tener agujeros"). Si la maceta decorativa no lo tiene, usarla solo como cubremacetas y vaciarla tras cada riego; Missouri avisa de que las macetas forradas de papel de aluminio o metidas en jardineras profundas acumulan agua sin que se vea. **Alta** [F30] [F9] [F15]
- Grava, cascotes o arena en el fondo "para drenar" es un mito: el agua no pasa de un material fino a otro más grueso hasta que el fino está saturado, de modo que la capa "induce precisamente el estado que pretende evitar" (WSU, Chalker-Scott). Sustrato homogéneo de arriba abajo y malla sobre el agujero (Penn State). Resolución C27. **Alta** [F34] [F30]
- Sustrato de turba que se seca del todo repele el agua y después retiene menos (Clemson): regar dos veces con media hora de intervalo o sumergir la maceta hasta que la superficie se humedezca. **Alta** [F11] [F24]

### 1.5 Humedad relativa
- Objetivo general 40-60 % (Nebraska G2205 "preferido"; Missouri "40-60 % es lo mejor para la mayoría pero difícil de alcanzar en interior"; Iowa State y NDSU "40-50 %"; Missouri Botanical Garden "alrededor del 50 %, algunas 70-80 %"). Resolución C5 de humedad: 40-60 % como objetivo general, más de 60 % para helechos, calateas y orquídeas a nivel de ficha. **Alta** [F8] [F15] [F22] [F24] [F20]
- Umbral de daño: "la mayoría de plantas de interior se dañan con humedad por debajo del 20 %, con la excepción de las suculentas" (Nebraska G2205). Solo una prioritaria cuantifica el umbral (C14). **Media** [F8]
- Realidad de la vivienda con calefacción: Penn State cita la recomendación ASHRAE de 30-60 % y añade que "durante la temporada de calefacción la HR interior puede bajar fácilmente de 30 %"; Iowa State y NDSU miden 10-20 % en invierno; Mississippi State, 10-30 % en edificios climatizados; Illinois, "a menudo por debajo del 30 %". Para España, el RITE fija como condición de diseño 40-50 % en invierno y 45-60 % en verano (ver `ubicacion.md` y `meteo.md`); no existe medición española publicada (laguna L-humedad en `lagunas.md`). **Alta** [F21] [F22] [F24] [F4] [F14]
- Síntomas de aire seco: "sequedad y rizado de hojas" (Nebraska G2205), puntas y bordes marrones (UC IPM, Nebraska), caída de hojas y botones, más araña roja. **Alta** [F8] [F16] [F23]
- Qué funciona y qué no (C12, C13): humidificador (lo más eficaz, Penn State, Iowa State, Illinois); agrupar plantas (todas las fuentes); baño o cocina si tienen luz (Nebraska, Missouri, NDSU; Penn State pide medir con higrómetro); terrario o campana para las muy exigentes (Penn State, Nebraska, Missouri Botanical Garden). Bandeja de guijarros con agua sin que la maceta toque el agua: ayuda modesta y local (Penn State: "casi ningún impacto en la HR de la habitación"; Iowa State, Nebraska, NDSU, Illinois la recomiendan). Pulverizar: "la subida de humedad solo dura hasta que el agua se evapora, cuestión de minutos; ni siquiera pulverizar a diario eleva la humedad" (Penn State); "habría que hacerlo varias veces al día" (Iowa State); "cada pocos minutos" (Nebraska); además "la hoja continuamente mojada favorece manchas foliares" (Nebraska) y UGA desaconseja mojar hojas pubescentes. Missouri G6510 dice que "pulverizar a diario puede ayudar": contradicción resuelta a favor de la mayoría (C12). **Alta** [F21] [F22] [F23] [F24] [F14] [F7] [F15]
- Excepciones: cactus y suculentas toleran el aire seco (Nebraska, Penn State, Mississippi State); *Tillandsia* se riega precisamente pulverizando (Penn State). **Alta** [F8] [F21] [F4]

### 1.6 Temperatura
- Rango de confort: 18-24 °C de día para la mayoría del follaje (Illinois "65-75 °F", Mississippi State, Nebraska G2205, NDSU); 18-21 °C en Missouri y Wisconsin; UGA da 21-27 °C de día y 18-21 °C de noche; Purdue 15-24 °C. Resolución C4: 18-24 °C de día, noche 3-6 °C más fresca (Illinois "5-10 °F", Nebraska "10-15 °F", Mississippi "unos 10 °F"). Plantas de flor duran más con noches de 13-16 °C (Missouri). **Alta** [F14] [F4] [F8] [F24] [F15] [F25] [F7] [F10]
- Calor: "por encima de 24 °C las flores duran menos y las plantas se vuelven estiradas y menos resistentes a plagas y enfermedades" (Purdue); UC IPM: temperatura alta → follaje amarillo-verdoso, y el aire caliente de un radiador bajo la ventana "a menudo hace que las hojas se doren por los bordes y a veces caigan o mueran" (Missouri). **Alta** [F10] [F16] [F15]
- Frío: daño por enfriamiento ("chilling") por debajo de 10 °C en tropicales (UC IPM "below 50 °F"; Purdue "sensibles a menos de 13 °C"; Missouri "algunas tropicales se dañan por debajo de 4 °C"; Minnesota: no sacar al exterior hasta noches por encima de 10 °C). Resolución C5: alerta general a 10 °C; umbrales de salida al balcón 13-15 °C según categoría (C6, C7, en `calendario.md`). **Alta** [F16] [F38] [F15] [F31]
- Cambios bruscos: "las fluctuaciones súbitas de temperatura pueden causar amarilleo y caída rápida de hojas" (Missouri Botanical Garden); "los cambios rápidos de temperatura dañan a las plantas" (NDSU); corrientes de puertas y ventanas, rejillas de calefacción y aire acondicionado (Illinois, Nebraska, Wisconsin, Maryland Grows "cómo odian las plantas una ráfaga de aire frío o una bocanada de calor"). Hojas que tocan el cristal frío se dañan (NDSU, Illinois "el cristal frío puede dañar el follaje"); cortinas cerradas de noche dejan la planta en una bolsa fría junto a la ventana (Missouri). **Alta** [F20] [F24] [F14] [F23] [F25] [F19] [F15]
- Reposo fresco: cactus del desierto, noches de 4-10 °C sin helar durante la latencia (Nebraska cacti-care, con riego casi nulo de finales de noviembre a marzo); RHS da 8-10 °C: resolución C8, 8-10 °C y nunca por debajo de 5-7 °C. **Alta** (práctica) / Media (cifra exacta) [F32]

### 1.7 Nutrición
- Cuándo: solo con crecimiento activo, "busca hojas nuevas, botones o flores" (Nebraska); "las plantas deben abonarse solo cuando están creciendo activamente" (Illinois); en invierno "poco o ningún abono" (Illinois, NDSU, Wisconsin, Purdue, Mississippi State). Una planta bajo luz muy alta o lámpara de cultivo puede seguir creciendo en invierno y se trata como activa (Nebraska). **Alta** [F27] [F14] [F24] [F25] [F10] [F4]
- Cuánto: las frecuencias de las fuentes van de "mensual" (Missouri, Purdue, UGA a un cuarto de dosis) a "cada 2-3 meses" (Clemson, Mississippi, Nebraska) pasando por "cada 1-3 meses de marzo a septiembre" (Illinois) y "media dosis cada 2-4 semanas" (Minnesota). Resolución C20: un cuarto o la mitad de la dosis de etiqueta, una vez al mes, solo con crecimiento activo; "nunca exceder la concentración recomendada" (Illinois). UGA da una regla de ajuste útil: si la planta clarea, abonar cada dos semanas; si las hojas nuevas son oscuras pero pequeñas y con entrenudos largos, bajar la dosis. **Alta** [F15] [F10] [F7] [F9] [F4] [F27] [F14] [F31]
- Cuándo no: "las plantas recién trasplantadas, sin enraizar, latentes y marchitas no deben abonarse" (Nebraska); "nunca aplicar abono líquido a una planta marchita: regar primero" (Missouri); "no usar abono para estimular crecimiento en una planta en malas condiciones de cultivo: la falta de crecimiento se debe más a luz o riego que a nutrición, y el abono puede causar daño adicional" (Missouri); recién compradas "rara vez necesitan abono en unas semanas" (Missouri). **Alta** [F27] [F15]
- Exceso y sales: síntomas "crecimiento reducido, puntas marrones, puntas de raíz muertas y marchitez" y "costra amarilla a blanca" en la superficie o el borde de la maceta (Nebraska, Maryland, Maryland diagnóstico, UC ANR); el crecimiento estirado puede deberse a poca luz "o a exceso de abono" (Maryland). Solución: lavado de sales (sección 3.3). **Alta** [F27] [F13] [F18] [F28]
- Tipo: abono completo equilibrado (Illinois sugiere 1:2:1 o equilibrado; Clemson 20-20-20 para follaje y 15-30-15 para flor); los solubles diluidos reducen el riesgo de quemadura (Clemson); los de liberación lenta duran 3-4 meses (Illinois) y no se añade más hasta agotar el plazo del envase (Nebraska). Orgánico o mineral: ambos sirven (Missouri). **Alta** [F14] [F9] [F27] [F15]

### 1.8 Reposo y fase de crecimiento
- Las plantas necesitan menos agua "tras una brotación o floración fuerte y mientras están latentes" (Clemson); en invierno "las plantas crecen poco o descansan" y el abono "no es necesario o debe reducirse" (Wisconsin); "las plantas de interior no necesitan abono en invierno porque la luz y la temperatura reducidas frenan el crecimiento" (NDSU). **Alta** [F11] [F25] [F24]
- El reposo lo marca la luz y el fotoperiodo, no solo la temperatura: con 124 h de sol en diciembre frente a 355 h en julio en Madrid (AEMET Retiro), la demanda de agua y nutrientes cae aunque la calefacción mantenga 21 °C. **Alta** (tendencia) [F41] [F24] [F25]
- Tareas que se posponen en reposo: trasplante (Penn State, Illinois, Minnesota: en primavera, al reiniciar el crecimiento), poda de formación (Minnesota: principios de primavera), abonado. Detalle en `calendario.md`. **Alta** [F30] [F29] [F31]

---

## 2. Los diez errores que más plantas matan en casa

Ninguna fuente prioritaria publica frecuencias medidas por tipo de error (laguna L26). El orden siguiente combina (a) afirmaciones explícitas de "causa más frecuente", (b) el ranking de Maryland Grows "Top 10 ways to kill a houseplant" (Universidad de Maryland), que es la única lista ordenada de una fuente prioritaria, y (c) el número de prioritarias independientes que citan cada error. Los puestos 1 y 2 tienen respaldo explícito (Alta); del 3 al 10 el orden es por convergencia de fuentes (Media) y debe revisarse con los diagnósticos confirmados por la propia app.

| # | Error | Evidencia | Confianza del orden |
|---|---|---|---|
| 1 | **Exceso de riego**: regar por rutina, dejar agua en el plato, sustrato que nunca seca. Maryland Grows lo pone el primero ("el asesino número uno"); Clemson, Mississippi State, RHS, Missouri y UC IPM coinciden (sección 1.3). Síntomas: hojas inferiores amarillas que caen al tocarlas (Missouri), base del tallo blanda (UC IPM), raíces marrones, marchitez con sustrato húmedo. | [F19] [F11] [F4] [F36] [F15] [F16] [F17] | Alta |
| 2 | **Luz insuficiente para la especie**: interior de la habitación, pasillos, a más de 2,5-3 m de la ventana, o planta de luz alta en ventana norte. Missouri: "la intensidad de luz inadecuada está casi a la altura del riego inadecuado como causa frecuente de fracaso"; Maryland: "las plantas pueden fracasar tras un buen comienzo por luz inadecuada". Entrenudos largos, hojas pálidas y pequeñas, variegación perdida, sin flor. | [F15] [F6] [F2] [F3] [F4] [F19] | Alta |
| 3 | **Mal drenaje**: maceta sin agujero, cubremacetas o plato con agua, tierra de jardín compactada. Maryland Grows lo pone en segundo lugar ("el mal drenaje también pudre las raíces"); "el exceso de riego es especialmente dañino cuando el drenaje es malo" (UC IPM). | [F19] [F17] [F11] [F15] [F30] | Media |
| 4 | **Aire seco de calefacción y radiadores**: "cuando arranca la calefacción, la humedad se desploma" (Maryland Grows); puntas marrones, rizado, caída de hojas, araña roja. Es el error típico del invierno español con radiadores bajo la ventana. | [F19] [F8] [F14] [F15] [F23] [F24] | Media |
| 5 | **Cambios bruscos y corrientes**: mover una planta feliz ("si tu planta está contenta, no la muevas", Maryland Grows), sacarla al balcón sin aclimatar, ráfagas de aire frío o caliente, cristal frío de noche, salida del aire acondicionado. Quemaduras, amarilleo y caída rápida de hojas (Missouri Botanical Garden, UC IPM "exceso de luz asociado a una mudanza reciente"). | [F19] [F20] [F16] [F15] [F37] [F38] | Media |
| 6 | **Exceso de abono o abono a destiempo**: "en invierno abona a la mitad o nada" (Maryland Grows); quemadura de raíz, puntas marrones, costra de sales, crecimiento débil y estirado. Incluye "abonar para curar" una planta que en realidad tiene poca luz o exceso de agua (Missouri). | [F19] [F15] [F27] [F13] [F18] [F28] | Media |
| 7 | **Frío**: por debajo de 10 °C en tropicales (ventanas frías, balcón en otoño, pasillos sin calefacción), que daña aunque no hiele; hojas que tocan el cristal. | [F16] [F38] [F15] [F24] [F14] | Media |
| 8 | **Plagas no detectadas a tiempo**: "sé vigilante y actúa rápido" (Maryland Grows); araña roja, cochinilla y cochinilla algodonosa son "las tres más comunes y difíciles" (Missouri); plantas nuevas sin cuarentena y plantas que vuelven del balcón (Illinois: cuarentena 2-3 semanas). | [F19] [F15] [F14] [F8] [F16] | Media |
| 9 | **Maceta inadecuada**: planta con raíces estranguladas en maceta pequeña ("las raíces giran como locas, estrangulando la planta", Maryland Grows) o, al revés, maceta demasiado grande que no seca y pudre (sección 3; `mitos.md` 2.15). | [F19] [F29] [F30] [F20] | Media |
| 10 | **Agua inadecuada**: agua de descalcificador (sodio y cloruro, Clemson; "debe evitarse", Maryland), agua muy fría (Clemson, Mississippi State, Missouri: daño por frío en *Saintpaulia*), y flúor del grifo en especies sensibles (*Dracaena*, *Chlorophytum*; C17). | [F11] [F13] [F4] [F15] [F33] | Media (orden) / Alta (hechos) |

**Cómo debe usar esta lista el agente:** ante cualquier síntoma, el motor de diagnóstico comprueba primero los errores 1-3 (agua y drenaje: sustrato, plato, raíces) antes de proponer plagas, abono o enfermedad (invariante 4 del documento rector: con sospecha de pudrición, suspender riego e inspeccionar raíces, nunca abonar ni tratar por vía foliar). **Alta** [F16] [F17] [F15]

---

## 3. Cómo se riega

### 3.1 Cuándo regar: criterios en orden de fiabilidad

1. **Dedo en el sustrato.** Las profundidades de las fuentes difieren (C16): Purdue "0,6 cm"; Clemson "hasta la primera falange"; Missouri Botanical Garden y UGA "2,5 cm"; Wisconsin "los 2-3 cm superiores"; Illinois, Maryland y Nebraska "5 cm" (Nebraska: "2,5-5 cm"). Resolución: **2-3 cm para plantas de follaje en macetas normales; 5 cm o más para suculentas, cactus y macetas grandes**; apenas la superficie para plantas de "siempre húmedo, nunca encharcado" (helechos, calateas, *Spathiphyllum*). Si está seco a esa profundidad, se riega; si se pega sustrato húmedo al dedo, se espera. Maryland añade un diagnóstico de paso: si el dedo no entra 5 cm, el sustrato es demasiado compacto o la planta está sin sitio en la maceta. **Alta** [F10] [F11] [F20] [F7] [F25] [F12] [F13] [F8]
2. **Peso de la maceta.** "Levanta la planta, maceta incluida: con el sustrato seco pesa mucho menos" (Maryland); "las macetas se notan claramente más ligeras al secarse" (Clemson); Oregon State lo recomienda en olas de calor. Con práctica es el criterio más rápido y el que mejor funciona en macetas grandes. **Alta** [F13] [F11] [F35]
3. **Color y aspecto del sustrato.** Oscuro húmedo, claro seco (Clemson, Missouri); si se agrieta y se separa de la pared de la maceta "ya se ha producido daño en las raíces" (Missouri). **Alta** [F11] [F15]
4. **Golpe en maceta de barro.** Sonido apagado = húmedo; hueco = seco (Clemson, Purdue). **Alta** [F11] [F10]
5. **Medidores de humedad.** "Varían en precisión; el abono y el tipo de sustrato distorsionan la lectura" (Clemson); "pueden ayudar pero no siempre son fiables" (Illinois). Útiles como segunda opinión, nunca como único criterio. **Alta** [F11] [F12]
6. **La planta misma.** "Cuando está demasiado seca se marchita y se pone gris-verdosa; cuando está demasiado mojada deja caer hojas o amarillea" (Maryland). Pero la marchitez engaña: "puede ser síntoma de exceso de riego" (Illinois, Clemson, Maryland): comprobar siempre el sustrato antes de actuar. **Alta** [F13] [F12] [F11]

**Lo que no sirve:** regar "cada X días". "Las plantas no deben regarse según un horario, sino cuando lo necesitan" (Maryland); "riega cuando lo necesiten y no según el calendario" (Illinois); "ningún calendario general sirve para todas las plantas de interior" (Missouri); "evita un horario rígido e inspecciona cada planta" (Mississippi State). El recordatorio de la app es siempre "comprueba el sustrato", no "riega" (modelo en `calendario.md` §4). **Alta** [F13] [F12] [F15] [F4]

### 3.2 Cómo regar

- **A fondo, hasta que salga agua por el agujero de drenaje.** Así se mojan "los dos tercios inferiores de la maceta, donde están la mayoría de las raíces" y se lavan sales (Clemson); "moja toda la masa de sustrato, no solo los 2-3 cm superiores" (Missouri). NDSU: regar, y volver a regar una vez más para asegurar que todo el sustrato queda húmedo. **Alta** [F11] [F15] [F24] [F20] [F10]
- **Vaciar el plato.** Esperar 10-30 minutos y tirar el agua (Wisconsin 15-30 min; Missouri Botanical Garden 20 min; Missouri "una hora"); "nunca dejes que tus plantas queden en agua" (Maryland); "no permitas que la parte inferior de la maceta quede en agua" (Purdue). **Alta** [F25] [F20] [F15] [F13] [F10] [F12]
- **Riego por arriba o por inmersión (C18).** Los dos valen (Maryland, Missouri, Illinois). La inmersión asegura mojar toda la masa pero concentra sales en la superficie ("las sales pueden formar una acumulación blanca si se riega regularmente desde abajo", Missouri); regar desde arriba de vez en cuando (Purdue: "una vez al mes") para lavarlas. Para violetas africanas y plantas de hoja aterciopelada, inmersión 20-30 minutos y retirar el exceso (Wisconsin). **Alta** [F13] [F15] [F12] [F10] [F26]
- **Sustrato muy seco.** Si la turba se ha secado del todo, el agua resbala por los bordes: regar dos veces con media hora de intervalo o sumergir la maceta en un cubo hasta que la superficie se humedezca y dejar drenar (Clemson, NDSU). **Alta** [F11] [F24]
- **Hora y temperatura del agua.** Agua a temperatura ambiente (Clemson: entre 17 y 22 °C; Mississippi State: "tibia, nunca fría"; Illinois, Missouri). En calor extremo, regar a primera hora de la mañana (Oregon State). **Alta** [F11] [F4] [F12] [F35]
- **Evitar mojar hojas pubescentes** (violeta africana, *Begonia*, *Kalanchoe tomentosa*): "no pulverices plantas de hoja peluda, el agua permite germinar esporas" (UGA). **Alta** [F7] [F14]

### 3.3 Sales, agua del grifo y lavado del sustrato

- **De dónde vienen las sales.** "Todas las aguas contienen minerales disueltos"; el abono disuelto también es una sal soluble; al evaporarse el agua las sales se concentran en el sustrato e "inhiben la absorción de agua" (Maryland, UC ANR). Síntomas: crecimiento reducido, puntas marrones, caída de hojas inferiores, puntas de raíz muertas, marchitez, y anillo blanco en la superficie, el borde o el exterior de macetas de barro (Maryland, Nebraska, Purdue). **Alta** [F13] [F28] [F27] [F10]
- **Lavado (lixiviación).** Técnica Alta, cifras Media (C19): regar por arriba con abundante agua clara hasta que drene mucho, dejar escurrir, tirar el agua. Volumen: "al menos dos veces el volumen de la maceta" (Maryland, Nebraska: una maceta de 15 cm, unos 1,2 l, necesita 2,4 l); Maryland diagnóstico habla de tres volúmenes. Frecuencia: cada 4-6 meses (Maryland, Nebraska, Illinois), cada 2-3 meses (UC ANR), mensual por arriba (Purdue, UGA). Antes de lavar, retirar la costra blanca (como mucho 0,6 cm de sustrato, Nebraska; Illinois "los 2-3 cm superiores" al trasplantar). Lavar antes de abonar, no después (Maryland). Si la maceta está recubierta de sales, trasplantar a maceta limpia (UC ANR). Buena práctica: lavar toda planta recién comprada en su primer riego (Maryland). **Alta** (práctica) / Media (volumen y frecuencia) [F13] [F27] [F14] [F28] [F10] [F7] [F29] [F18]
- **Agua ablandada.** "Añade sodio y cloruro al sustrato y puede dañar la planta" (Clemson); "contiene más minerales y debe evitarse" (Maryland); Illinois y Missouri coinciden. **Alta** [F11] [F13] [F12] [F15]
- **Cloro y flúor (C17).** Illinois y Wisconsin recomiendan dejar reposar el agua del grifo 24 h "para que se disipen cloro y flúor"; Missouri afirma que "el cloro y el flúor de las aguas urbanas no dañan a las plantas", pero su propia figura 2 muestra "puntas marrones, síntoma típico de toxicidad por flúor, fisiopatía común en liliáceas como *Spathiphyllum*". El Pacific Northwest Handbook (OSU/WSU/Univ. Idaho) identifica como sensibles a *Dracaena* ("muy sensible"), *Chlorophytum* y *Gibasis*, describe "necrosis marginal y de puntas que avanza hacia dentro" y recomienda ósmosis, condensación (destilada) o carbón activo, evitar abonos ricos en fosfato y pH bajo, y añadir calcio (dolomita) para fijar el flúor. Resolución: el reposo solo elimina cloro libre, no flúor; para especies sensibles usar agua de lluvia, filtrada u ósmosis. **Alta** (especies sensibles y síntomas) / Media (reposo 24 h) [F12] [F26] [F15] [F33]
- **Agua de lluvia.** "Excelente" para plantas de interior (Missouri); útil también para no acumular sales. **Media** [F15]

### 3.4 Factores que cambian la frecuencia (base del modelo de la app)

| Factor | Efecto | Fuentes |
|---|---|---|
| Especie y tipo de hoja | Hojas grandes o finas y raíces finas superficiales: más agua; suculentas y cactus con tejidos de reserva: "mucha menos" (Clemson); cactus del desierto en reposo invernal, casi nada (Nebraska). Flor necesita más que follaje del mismo tamaño (Missouri). | [F11] [F32] [F15] |
| Fase | Tras brotación o floración fuerte y en reposo: menos (Clemson). | [F11] [F25] |
| Maceta: material | Barro sin esmaltar seca antes que plástico, vidrio o cerámica esmaltada (Clemson, Illinois, Purdue). | [F11] [F12] [F10] |
| Maceta: tamaño relativo | "Una planta grande en maceta pequeña necesita agua más a menudo" (Clemson); maceta sobredimensionada permanece húmeda y pudre (Penn State; `mitos.md` 2.15). | [F11] [F30] |
| Sustrato | Mezclas con turba retienen más; con corteza, arena o perlita, menos (Clemson). | [F11] |
| Luz y temperatura del sitio | "Las zonas cálidas, secas y soleadas necesitan más agua que las frescas y de poca luz" (Clemson); "las zonas de luz alta pueden ser cálidas y las plantas se secan antes" (Minnesota). | [F11] [F2] |
| Humedad del aire | Aire seco de calefacción o aire acondicionado acelera la pérdida de agua de hojas y sustrato (Nebraska). | [F23] [F8] |
| Clima y meteorología | Calor y viento secan las macetas de balcón a diario (RHS: comprobar a diario, dos veces en calor; Oregon State: colgantes y macetas se secan antes que el suelo). Lluvia: no garantiza que la maceta esté húmeda (RHS). Reglas en `reglas-meteo.json`. | [F36] [F35] |
| Estación | Invierno: menos luz y crecimiento, "las necesidades de agua de muchas plantas se reducen" (Wisconsin). En Madrid la diferencia entre julio (32 °C de máxima media, 38 % HR, 355 h de sol) y diciembre (10 °C, 74 %, 124 h) multiplica por 2-4 el intervalo (ver `calendario.md` §4). | [F25] [F41] |

### 3.5 Síntomas: exceso y defecto se parecen

| Observación | Exceso de agua | Falta de agua |
|---|---|---|
| Sustrato | Húmedo, pegajoso, a veces con olor o musgo; "pegajoso y viscoso, invitando a pudriciones" (Missouri). | Seco, claro, agrietado, separado de la pared de la maceta. |
| Hojas | Amarilleo general, hojas inferiores que caen al tocarlas, caída de hojas a distintas alturas, hojas nuevas pequeñas; marchitez con sustrato húmedo. | Marchitez, hojas gris-verdosas, puntas y bordes quemados, hojas nuevas pequeñas si la sequía es prolongada. |
| Tallo y raíces | Base blanda ("los tallos blandos en la base suelen indicar exceso de riego", UC IPM); raíces marrones o podridas en vez de blancas. | Raíces finas secas; la planta se recupera en horas tras regar si el daño no es grave. |
| Primera acción | Suspender riego, sacar la planta, inspeccionar y cortar raíces podridas, sustrato nuevo y maceta con drenaje; no abonar. | Riego a fondo o inmersión; revisar si la maceta es demasiado pequeña o el sustrato repele el agua. |

"Exceso y defecto producen síntomas similares, incluida mala salud radicular y posible muerte" (Clemson). "Marchitez o caída de hojas repentina" también aparece tras cambios bruscos de luz, temperatura o humedad (UC IPM). **Alta** [F11] [F16] [F17] [F15] [F13] [F18]

---

## 4. Cómo se lee la luz

### 4.1 Unidades y conversiones
- Pie-candela (fc): luz que recibe una superficie de un pie cuadrado a un pie de una vela; 1 fc = 10,76 lux ("el lux difiere del pie-candela en un factor de aproximadamente 10", UF/IFAS). Sol directo exterior: unos 10 000 fc de pico (Maryland), 10 000-12 000 fc (Illinois). **Alta** [F5] [F6] [F1] [F3]
- Para la planta cuenta la radiación fotosintéticamente activa (PPFD, µmol·m⁻²·s⁻¹) y la dosis diaria (DLI). Minnesota da la equivalencia aproximada para luz natural: luz baja 50-250 fc ≈ 50-150 µmol; media 250-1 000 fc ≈ 150-250 µmol; alta más de 1 000 fc ≈ 250-450 µmol. El factor lux → PPFD ≈ 0,0185 del documento rector (Thimijan & Heins) solo vale para luz solar; con LED o fluorescente no debe usarse una conversión única (C3, L2). **Media** [F2]
- Medir: "un luxómetro de mano suele ser la mejor herramienta", basta uno que lea fc o lux con precisión de 1 fc; las apps de móvil "varían según el dispositivo y el método", son "normalmente bastante precisas para detectar un cambio de nivel de luz" y solo deben usarse como aproximación (UF/IFAS). Detalle y límites del sensor del móvil en `ubicacion.md` §4. **Alta** (recomendación de luxómetro) / Media (precisión de apps) [F5] [F6]

### 4.2 Categorías de luz y rangos orientativos

Las categorías no están estandarizadas (C1, L1). Illinois da puntos de referencia (75 / 150 / 300 / 1 500 fc); Minnesota y Tennessee usan 50-250 / 250-1 000 / más de 1 000 fc; Mississippi State 50-500 / 500-1 000 / 1 000 o más (e, incoherentemente, 25-75 / 75-150 / 150-1 000 en sus listas); Clemson da mínimo y preferido por categoría (baja 100 mín., 75-200 pref.; media 100-150 mín., 200-500 pref.; alta 150-1 000 mín., 500-1 000 pref.; muy alta 1 000 o más); UGA 25-75 / 75-200 / más de 200 sin sol directo; Maryland y UF/IFAS coinciden en 25-100 / 100-500 / 500-1 000 / más de 1 000. **Se adopta la escala Maryland + UF/IFAS** (dos prioritarias coincidentes y la más conservadora al etiquetar una zona como "baja") y la app muestra siempre el valor numérico, no solo la etiqueta. **Alta** [F6] [F5] [F1] [F2] [F3] [F4] [F9] [F7]

| Categoría | fc (escala adoptada) | lux aprox. | PPFD aprox. (luz solar) | Rango unión de todas las fuentes | Dónde se da en casa (hemisferio norte) | Qué va bien |
|---|---|---|---|---|---|---|
| Insuficiente | < 25 fc | < 270 lx | < 5 | Mississippi: "menos de 50 fc no sostiene la vida vegetal mucho tiempo"; Clemson: "unos 100 fc durante 12 h al día son necesarios simplemente para mantener la calidad un año"; Nebraska: menos de 75 fc, "la luz necesaria para leer" | Pasillos interiores, más de 2,5-3 m de cualquier ventana, baños sin ventana | Nada de forma permanente; rotación o luz artificial |
| Baja | 25-100 fc | 270-1 080 lx | 5-20 | 25-250 fc | Ventana norte sin obstáculos, a 1-3 m de ventana este/oeste, a 4,5-6 m de ventana sur, habitaciones con luz artificial | *Zamioculcas*, *Dracaena trifasciata*, *Aspidistra*, *Spathiphyllum*, *Aglaonema*, *Epipremnum*, *Philodendron* |
| Media (brillante indirecta) | 100-500 fc | 1 080-5 400 lx | 20-100 | 75-1 000 fc | Delante de ventana norte; a 1-2 m de ventana este/oeste; a 1-3 m de ventana sur o tras cortina fina en sur | *Aglaonema*, *Ficus elastica*, *Dracaena*, *Saintpaulia*, *Araucaria*, *Chlorophytum*, *Monstera*, helechos, *Peperomia*, *Begonia* |
| Alta (brillante) | 500-1 000 fc | 5 400-10 800 lx | 100-200 | 200-1 000 fc | Delante de ventana este u oeste sin obstáculos; ventana sur hasta 1,5 m o sombreada por árboles | *Codiaeum*, *Hibiscus*, *Crassula*, *Hoya*, cítricos (sin sol directo prolongado) |
| Sol directo interior | > 1 000 fc; 1 500 fc en el cristal (Illinois) | > 10 800 lx | > 200 | > 1 000 fc; exterior 10 000-12 000 fc | "4-6 horas de sol directo": ventana sur o suroeste sin obstáculos, galería, mirador | Cactus y suculentas, cítricos, *Gardenia*, *Tillandsia*, *Kalanchoe*, *Pelargonium*, hierbas culinarias |

Fuentes de la tabla: [F6] [F5] [F1] [F2] [F3] [F4] [F9] [F8]. Listas de plantas por categoría: Maryland, Minnesota y Nebraska (la asignación por especie se verifica en Fase 3).

**Duración.** Las plantas de luz baja se benefician de alargar el día con luz artificial a 14-16 h; "no exponer a más de 16 h porque también necesitan un periodo de descanso" (Illinois, Maryland); las plantas de día corto (*Euphorbia pulcherrima*, *Kalanchoe*, *Schlumbergera*, crisantemo) solo forman botones con 11 h de luz o menos (Maryland) o "unas 10 h" (Tennessee); el sol directo "es mejor durante cuatro o más horas" para las plantas que lo necesitan (UF/IFAS). **Alta** [F1] [F6] [F3] [F5]

**Calidad.** Para luz natural no es un problema; con lámparas importan rojo, rojo lejano y azul (Maryland). Las incandescentes "crean calor" y su alto rojo lejano estira las plantas; los LED son eficientes y de amplio espectro (Minnesota). **Alta** [F6] [F2]

### 4.3 Orientación de ventanas

**Hemisferio norte** (Madrid, 40° N). **Alta** [F1] [F2] [F3] [F6] [F7] [F15] [F20]
- **Sur**: "las condiciones más luminosas y durante más tiempo" (Tennessee); sol directo. En invierno "cualquier planta de interior se beneficia de la luz de una ventana sur"; de finales de primavera a principios de otoño "las plantas que no necesitan luz intensa pueden quemarse" y deben ir a un lado, al interior de la habitación o tras cortina fina (Tennessee, Maryland: "aumenta la distancia a la ventana o usa una cortina ligera"). Un voladizo, balcón superior o alero ancho convierte una ventana sur en luz indirecta gran parte del día (Minnesota).
- **Este**: sol directo suave por la mañana y buena luz el resto del día; "adecuada para muchas plantas de luz media" (Tennessee); con Missouri, "sur, este u oeste son excelentes para la mayoría de plantas de flor".
- **Oeste**: "en teoría la misma luz que el este, pero por la tarde" (Laidback Gardener), en la práctica más caliente en verano; Maryland la clasifica entre media (100-500 fc) y alta ("algunas ventanas oeste", 500-1 000 fc). Puede exigir sombreado estival.
- **Norte**: solo luz indirecta y baja, "satisfactoria únicamente para las plantas que requieren los niveles más bajos; no deben recibir sol directo" (Tennessee); 25-100 fc (Maryland); en invierno puede ser insuficiente incluso para ellas (Laidback Gardener). Missouri: la mayoría de plantas de follaje "van bien con la luz de una ventana norte, luz de día sin sol directo o sol difuminado por una cortina ligera".
- Plantas en flor: fuera del sol directo "o las flores se calientan en exceso y se marchitan antes" (Missouri).

**Hemisferio sur.** Se invierten norte y sur: "en vuestro hemisferio es la ventana norte la que recibe más luz y la sur la que menos; este y oeste no cambian" (Laidback Gardener); "las habitaciones con ventana norte reciben más horas de sol directo al día... en el hemisferio norte ocurre lo contrario" (Plant with Willow, Australia). Solo fuentes complementarias, coherentes con la geometría solar (L6). La app invierte internamente norte/sur según el hemisferio del usuario. **Media** [F39] [F40]

### 4.4 Distancia, obstáculos, cortinas y estación

- **Distancia.** "La intensidad depende de la distancia a la fuente y decrece rápidamente al aumentar" (Maryland); "puede caer de 1 000 a 100 fc en la distancia de solo unos pies" y "es difícil cultivar plantas a más de 2,5-3 m de las ventanas" (Mississippi State); "ni siquiera las plantas de luz baja reciben suficiente luz a más de 3 m de una ventana media" (Tennessee); Purdue sitúa la luz baja "a más de 2,4 m de las ventanas, sin luz directa: pasillos apagados", la media a 1,2-2,4 m y la alta "a menos de 1,2 m de ventanas grandes sur, este u oeste". **Alta** [F6] [F4] [F3] [F10]
- **Tabla de distancias de Illinois** (ventana media sin obstáculos; cifras en pies convertidas): luz baja (75 fc) a pocos pies de ventana norte, 1-3 m de este/oeste, 4,5-6 m de sur; media (150 fc) delante de ventana norte, a pocos pies de este/oeste, 1-3 m de sur; alta (300 fc) delante de este/oeste, hasta 1,5 m de sur; directa (1 500 fc) delante de ventana sur. **Alta** [F1] [F3]
- **Obstáculos.** Aleros, voladizos, árboles, edificios vecinos y balcones superiores reducen la luz; "las mejores ventanas son las que no están sombreadas por un gran voladizo, árboles o estructuras" (Tennessee); una ventana sur bajo voladizo da luz indirecta gran parte del día (Minnesota). Los árboles caducos bloquean en verano y dejan pasar luz en invierno (Illinois). **Alta** [F3] [F2] [F1] [F20]
- **Cortinas, mosquiteras y cristales.** "Cortinas, mosquiteras, tiempo, estación, sombra de árboles y edificios, y la limpieza y el tipo de cristal afectan a la intensidad" (Maryland); una cortina fina convierte el sol directo en luz media difusa y es el remedio de verano para ventanas sur (Maryland, Missouri); cortinas cerradas de noche en invierno dejan a la planta en aire frío junto al cristal (Missouri). Las superficies claras y reflectantes de la habitación aumentan la luz ambiente (Maryland). Reducción porcentual por visillos y persianas: sin cifra prioritaria (L3). **Alta** [F6] [F15] [F3]
- **Estación.** En invierno "el sol bajo cruza la habitación la mayor parte de las horas de luz" y "la luz solar penetra más dentro de la habitación" (UGA); por eso "en invierno cualquier planta se beneficia de una ventana sur" (Tennessee) y "una planta en ventana este en verano puede necesitar una ventana sur en invierno" (Nebraska). Pero los días son cortos y la intensidad total baja: en Madrid, 355 h de sol en julio frente a 124 h en diciembre y 149 h en enero (AEMET Retiro, 1981-2010; 2 545 h en los once meses con dato, octubre sin dato). En verano el sol alto entra menos en la habitación pero quema junto al cristal sur y oeste. Illinois escribe que "el sol está más alto en invierno": error de redacción (C2); la conclusión práctica de todas las fuentes coincide. **Alta** [F7] [F3] [F8] [F41] [F1]
- **Giro y cambios graduales.** Girar la maceta una vez por semana para que reciba luz por todos los lados (Purdue, Missouri). "Un traslado brusco de luz baja a luz alta puede ser dañino... las hojas se orientan hacia la luz y moverla desordena esa orientación" y "mover de golpe a luz más intensa, sobre todo sol directo, blanquea o quema el follaje; cualquier cambio de luz debe ser gradual" (Missouri); al revés, volver del exterior o del invernadero a la casa provoca caída de hojas mientras la planta se adapta (Maryland, con *Ficus benjamina* como ejemplo; UGA: aclimatar las recién compradas 3-4 semanas en luz brillante indirecta). **Alta** [F10] [F15] [F6] [F7]

### 4.5 Señales de luz insuficiente o excesiva

| Luz insuficiente | Luz excesiva |
|---|---|
| Entrenudos largos y tallos finos que "buscan" la ventana; inclinación hacia la luz; hojas nuevas pequeñas y pálidas (verde claro, amarillo, blanco); pérdida de variegación (vuelve a verde); caída de hojas viejas; no florece o caen los botones; crecimiento lento. | Hojas decoloradas, pálidas o blanquecinas; manchas quemadas secas y bordes marrones; marchitez a mediodía con sustrato húmedo; sobre todo tras un cambio de sitio reciente o al llegar la primavera a una ventana sur. |

Minnesota: "las plantas sin luz suficiente no producen clorofila y pasan de verde pálido a amarillo o blanco... las plantas expuestas a demasiada luz muestran hojas quemadas y blanqueadas". Maryland: "cuando una planta recibe demasiada luz directa las hojas palidecen, se vuelven marrones y mueren". UC IPM: "el crecimiento estirado se debe normalmente a luz inadecuada"; "exceso de luz (quemadura) asociado a un traslado reciente de la planta". Missouri Botanical Garden: con poca luz "crecimiento lento y estirado, hojas pequeñas y pálidas, sin flor o con botones que caen; las variegadas revierten a verde"; con demasiada, "superficies apagadas, pálidas o blanqueadas y márgenes marrones quemados". **Alta** [F2] [F6] [F16] [F20] [F15]

### 4.6 Qué debe hacer la app con la luz
1. Pedir orientación (brújula del móvil o por dónde entra el sol), distancia a la ventana, obstáculos y cortina, y hemisferio (método paso a paso en `ubicacion.md` §1).
2. Estimar un valor numérico (lux) y una categoría de la escala adoptada; mostrar siempre el número y la incertidumbre.
3. Reevaluar al menos dos veces al año (solsticios) y con cada mudanza de la planta; sugerir mover plantas de luz baja fuera del sol directo de ventanas sur de mayo a septiembre y acercar plantas de luz alta a la ventana sur de noviembre a febrero.
4. Hacer cualquier cambio de luz de forma gradual (unas horas al día durante 1-2 semanas; `calendario.md` §2 "Cambio de ubicación").
5. Nunca "curar" con abono, agua o trasplante un problema que es de luz.

**Alta** (contenido) [F15] [F6] [F7] [F14]

---

## Fuentes citadas en este archivo

| Id | Institución | Documento y URL | Tipo | Consulta |
|---|---|---|---|---|
| F1 | University of Illinois Extension | Houseplants: Lighting — https://extension.illinois.edu/houseplants/lighting | prioritaria | 2026-10-20 |
| F2 | University of Minnesota Extension | Lighting for indoor plants and starting seeds — https://extension.umn.edu/houseplants/light-requirements-houseplants | prioritaria | 2026-10-20 |
| F3 | University of Tennessee Extension | Lighting Indoor Houseplants, G06515 (PDF, texto extraído con pypdf) — https://uthort.tennessee.edu/wp-content/uploads/sites/228/2023/11/g06515%20Lighting%20Indoor%20Houseplants.pdf | prioritaria | 2026-10-20 |
| F4 | Mississippi State University Extension | Care and Selection of Indoor Plants, P1012 — https://extension.msstate.edu/publications/care-selection-indoor-plants | prioritaria | 2026-10-20 |
| F5 | UF/IFAS Gardening Solutions | Light for Houseplants — https://gardeningsolutions.ifas.ufl.edu/plants/houseplants/light-for-houseplants/ | prioritaria | 2026-10-20 |
| F6 | University of Maryland Extension | Lighting Indoor Plants (act. 2023-03-10) — https://extension.umd.edu/resource/lighting-indoor-plants | prioritaria | 2026-10-20 |
| F7 | University of Georgia Extension | Growing Indoor Plants with Success, B1318 — https://fieldreport.caes.uga.edu/publications/B1318/growing-indoor-plants-with-success | prioritaria | 2026-10-20 |
| F8 | University of Nebraska-Lincoln Extension | Houseplant care, G2205 (versión HTML) — https://extensionpubs.unl.edu/publication/g2205/html/view | prioritaria | 2026-10-20 |
| F9 | Clemson University HGIC | Indoor Plants (light categories, fertilizing, containers) — https://hgic.clemson.edu/factsheet/indoor-plants/ | prioritaria | 2026-10-20 |
| F10 | Purdue University Extension | Indoor Plant Care, HO-39-W — https://ag.purdue.edu/department/hla/extension/extension-publications-library/ext-pubs/ho-39-w.html | prioritaria | 2026-10-20 |
| F11 | Clemson University HGIC | Indoor Plants – Watering — https://hgic.clemson.edu/factsheet/indoor-plants-watering/ | prioritaria | 2026-10-20 |
| F12 | University of Illinois Extension | Houseplants: Watering — https://extension.illinois.edu/houseplants/watering | prioritaria | 2026-10-20 |
| F13 | University of Maryland Extension | Watering Indoor Plants (act. 2023-03-10) — https://www.extension.umd.edu/resource/watering-indoor-plants | prioritaria | 2026-10-20 |
| F14 | University of Illinois Extension | Houseplants: Care — https://extension.illinois.edu/houseplants/care | prioritaria | 2026-10-20 |
| F15 | University of Missouri Extension | G6510 Caring for Houseplants (D. Trinklein; copia alojada por University of Vermont) — https://uvm.edu/d10-files/documents/2024-10/Caring_for_Houseplants.pdf | prioritaria | 2026-10-20 |
| F16 | UC IPM (University of California ANR) | Houseplant Problems — https://ipm.ucanr.edu/home-and-landscape/houseplant-problems/ | prioritaria | 2026-10-20 |
| F17 | UC IPM | Water excess and deficit — https://ipm.ucanr.edu/PMG/GARDEN/FLOWERS/ENVIRON/waterexdef.html | prioritaria | 2026-10-20 |
| F18 | University of Maryland Extension | Diagnose indoor plant problems (act. 2025-02-05) — https://extension.umd.edu/resource/diagnose-indoor-plant-problems | prioritaria | 2026-10-20 |
| F19 | University of Maryland Extension (Maryland Grows) | Top 10 ways to kill a houseplant (2021) — https://marylandgrows.umd.edu/2021/01/22/top-10-ways-to-kill-a-houseplant/ | prioritaria | 2026-10-20 |
| F20 | Missouri Botanical Garden (Kemper Center) | Houseplants fact sheet 2022 (PDF) — https://missouribotanicalgarden.org/Portals/0/Kemper%20Gardens/Fact%20Sheets/Houseplants%202022-pdf.pdf | prioritaria | 2026-10-20 |
| F21 | Penn State Extension | Humidity and Houseplants (act. 2024-12-13) — https://extension.psu.edu/humidity-and-houseplants | prioritaria | 2026-10-20 |
| F22 | Iowa State University Extension | FAQ: Should I mist the houseplants? — https://yardandgarden.extension.iastate.edu/faq/air-our-home-extremely-dry-winter-should-i-mist-houseplants | prioritaria | 2026-10-20 |
| F23 | University of Nebraska-Lincoln Extension (Lancaster) | Success with Houseplants – Humidity — https://lancaster.unl.edu/houseplants-humidity | prioritaria | 2026-10-20 |
| F24 | NDSU Extension | Dakota Gardener: Winter Houseplant Care — https://www.ag.ndsu.edu/news/columns/dakota-gardener/dakota-gardener-winter-houseplant-care | prioritaria | 2026-10-20 |
| F25 | University of Wisconsin-Madison Extension (Chippewa) | Winter Care of Houseplants — https://chippewa.extension.wisc.edu/2025/11/19/winter-care-of-houseplants-2 | prioritaria | 2026-10-20 |
| F26 | University of Wisconsin-Madison Horticulture Extension | Houseplant Care — https://hort.extension.wisc.edu/articles/houseplant-care/ | prioritaria | 2026-10-20 |
| F27 | University of Nebraska-Lincoln Extension (Lancaster) | Success with Houseplants – Fertilization — https://lancaster.unl.edu/success-houseplants-fertilization | prioritaria | 2026-10-20 |
| F28 | UC ANR (Stanislaus County) | Leach your houseplants to avoid salt problems — https://ucanr.edu/blog/stanislaus-sprout/article/leach-your-houseplants-avoid-salt-problems | prioritaria | 2026-10-20 |
| F29 | University of Illinois Extension | Houseplants: Repotting — https://extension.illinois.edu/houseplants/repotting | prioritaria | 2026-10-20 |
| F30 | Penn State Extension | Repotting Houseplants — https://extension.psu.edu/repotting-houseplants | prioritaria | 2026-10-20 |
| F31 | University of Minnesota Extension | Spring houseplant care (rev. 2026) — https://extension.umn.edu/houseplants/spring-houseplant-care | prioritaria | 2026-10-20 |
| F32 | University of Nebraska-Lincoln Extension (Lancaster) | Cacti care — https://lancaster.unl.edu/cacti-care | prioritaria | 2026-10-20 |
| F33 | Pacific Northwest Plant Disease Management Handbook (OSU, WSU, Univ. Idaho) | Fluorine toxicity in plants — https://pnwhandbooks.org/plantdisease/pathogen-articles/nonpathogenic-phenomena/fluorine-toxicity-plants | prioritaria | 2026-10-20 |
| F34 | Washington State University Extension (L. Chalker-Scott) | The Myth of Drainage Material in Container Plantings (PDF) — https://s3.wp.wsu.edu/uploads/sites/403/2015/03/container-drainage.pdf | prioritaria | 2026-10-20 |
| F35 | Oregon State University Extension | How to protect yourself and your plants during extreme heat — https://extension.oregonstate.edu/news/how-protect-yourself-your-plants-during-extreme-heat | prioritaria | 2026-10-20 |
| F36 | Royal Horticultural Society | Container maintenance — https://www.rhs.org.uk/container-gardening/maintenance | prioritaria | 2026-10-20 |
| F37 | University of Georgia Extension (CAES) | Use care when moving houseplants outside — https://fieldreport.caes.uga.edu/use-care-when-moving-houseplants-outside-for-the-spring-summer/ | prioritaria | 2026-10-20 |
| F38 | Purdue University Extension | Yard and Garden: moving houseplants outdoors — https://www.purdue.edu/hla/sites/yardandgarden/?p=3293 | prioritaria | 2026-10-20 |
| F39 | Laidback Gardener (L. Hodgson) | North, South, East or West? — https://laidbackgardener.blog/2017/02/19/north-south-east-or-west/ | complementaria | 2026-10-20 |
| F40 | Plant with Willow (Australia) | Lighting guide (hemisferio sur) — https://api.plantwithwillow.com.au/api/v1/blog-content/10/ | complementaria | 2026-10-20 |
| F41 | AEMET | Valores climatológicos normales, Madrid Retiro (3195), 1981-2010 — https://www.aemet.es/es/serviciosclimaticos/datosclimatologicos/valoresclimatologicos?l=3195&k=mad | prioritaria | 2026-10-20 |
