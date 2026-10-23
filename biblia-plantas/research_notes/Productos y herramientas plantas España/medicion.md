# Instrumentos de medición para el cuidado de plantas de interior (humedad del sustrato, luz, HR y temperatura)

Fecha de referencia: octubre de 2026. Mercado España/UE. Unidades SI; foot-candles (fc) solo como conversión (1 fc = 10,76 lx; en las notas se redondea a ×10,8).

Convenciones de confianza: **Alta** = 2 o más fuentes prioritarias coinciden; **Media** = 1 prioritaria o 2 complementarias coherentes; **Baja** = solo complementarias. Tipo de fuente: [P] prioritaria (universidad/extensión, RHS/jardín botánico, organismo oficial, revista revisada por pares); [C] complementaria (fabricante, laboratorio privado, blog especializado, preprint no revisado, vendedor).

Nota metodológica: todas las URL citadas se abrieron con WebFetch. Varias fuentes prioritarias relevantes (MSU/Runkle sobre DLI, Purdue HO-238-W, UMN, Oklahoma State, Penn State, póster de Toronto Met, capítulo DAAAM 2022, Greenspan 1977, Thimijan & Heins 1982, Buildings 2022) no pudieron leerse (PDF binario, 403/404/410 o página vacía) y se relegan a "Lagunas"; nada de lo que dicen se atribuye aquí. El presupuesto de búsquedas web de la sesión se agotó antes de poder cerrar esas lagunas.

---

## Pregunta 1. ¿Qué dicen las fuentes de extensión universitaria sobre la fiabilidad de los medidores de humedad resistivos ("de aguja", 2 o 3 en 1) y de las apps de luz del móvil?

### Takeaway
La extensión universitaria consultada no respalda los medidores de aguja baratos como herramienta fiable: Illinois Extension dice literalmente que la sonda "puede ser útil, pero puede no ser siempre fiable", y la única prueba empírica detallada (complementaria) muestra que miden conductancia eléctrica, con rango útil estrecho y sesgo "húmedo" por sales/fertilizante. Sobre apps de luz, UF/IFAS las acepta solo para "aproximaciones" y detectar cambios, y un laboratorio fotométrico acreditado midió desviaciones de hasta +113 % y −89 % frente a un luxómetro clase A.

### Cited Findings

**Medidores de humedad resistivos (sonda de aguja, galvánica/conductancia)**
- Illinois Extension: una sonda "water meter" "can be useful, but may not always be reliable"; el método recomendado es el dedo a 2 pulgadas (≈5 cm) de profundidad. [P] — [Illinois Extension, Watering houseplants](https://extension.illinois.edu/houseplants/watering)
- Mississippi State Extension (P1012) describe el "soil moisture indicator" como un indicador de "cuán húmedo o seco está el suelo" y pide leer las instrucciones antes de usarlo; no lo valida ni da umbrales numéricos. Recomienda también el dedo hasta la articulación media y un palillo/dowel de madera sin pintar (si se adhiere sustrato, no regar). [P] — [MSU Extension P1012, Care and Selection of Indoor Plants](https://extension.msstate.edu/publications/care-selection-indoor-plants)
- Ninguna de las páginas de extensión leídas (Illinois, UMD ×3, Nebraska, UF/IFAS, Mississippi State, RHS) recomienda un medidor de sonda como método principal; todas ponen el dedo, el peso de la maceta o el palillo primero. [P] — [UMD, Watering indoor plants](https://extension.umd.edu/resource/watering-indoor-plants); [UMD, Drought stress to indoor plants](https://extension.umd.edu/node/1176); [Nebraska Extension G2205](https://extensionpubs.unl.edu/publication/g2205/html/view); [RHS, How to grow houseplants](https://www.rhs.org.uk/plants/types/houseplants/growing-guide)
- Prueba empírica (complementaria, Robert Pavlis, Garden Myths): los medidores baratos "no miden humedad directamente", miden conductancia entre dos electrodos; repetibilidad buena (seco 7,7,7,7,6,5; mojado 4×5); un sustrato seco con perlita lee 2,5 (igual que el aparato apagado o al aire) y uno saturado 9 → rango útil ≈6,5 unidades de 10; suelo suelto 4 vs compactado 5,5 con la misma humedad real; variación de hasta 2 unidades entre superficie y fondo; macetas regadas con agua destilada vs agua dura/fertilizada difieren 1 unidad (las sales suben la conductividad y leen "más húmedo"); en sustrato de orquídea (corteza) el medidor es inútil; conclusión: lectura solo relativa, no calibrable, no sirve para decidir cuándo regar; usar dedo o peso. [C] — [Garden Myths, Soil moisture meters – do they work](https://gardenmyths.com/soil-moisture-meters-do-they-work)
- La misma fuente recomienda: clavar ≈5 cm para que ambos electrodos contacten con sustrato, medir siempre a la misma profundidad, evitar el agua acumulada en el fondo justo tras regar, y señala que la corrosión de la sonda y la acumulación de sales cambian las lecturas con el tiempo. [C] — [Garden Myths](https://gardenmyths.com/soil-moisture-meters-do-they-work)
- Sales solubles como factor de confusión: UMD indica que las sales quedan en el sustrato al evaporarse el agua, que el agua descalcificada (softened) "contiene más que otras y debe evitarse", y recomienda lixiviar cada 4-6 meses con al menos el doble del volumen de la maceta; Mississippi State: "la acumulación de sales solubles daña las raíces y reduce la absorción de agua". [P] — [UMD, Watering indoor plants](https://extension.umd.edu/resource/watering-indoor-plants); [MSU Extension P1012](https://extension.msstate.edu/publications/care-selection-indoor-plants)

**Apps de luz del móvil (lux)**
- UF/IFAS: la precisión de las apps "varía según el dispositivo y el método de cálculo"; son "normalmente lo bastante precisas para detectar un cambio de nivel de luz, pero solo deben usarse para aproximaciones". Un luxómetro de mano "es a menudo la mejor herramienta"; no hace falta uno caro: si lee en fc o lux "y es preciso a 1 foot-candle, sirve para plantas de interior". [P] — [UF/IFAS Gardening Solutions, Light for houseplants](https://gardeningsolutions.ifas.ufl.edu/plants/houseplants/light-for-houseplants/)
- Illinois Extension: la intensidad "puede evaluarse con un luxómetro o un fotómetro fotográfico"; no menciona apps. [P] — [Illinois Extension, Lighting](https://extension.illinois.edu/houseplants/lighting)
- Prueba de laboratorio fotométrico acreditado (DIAL, Alemania; complementaria): 7 móviles (iPhone 5/5S/6, Sony Xperia Z1/Z2, Samsung Galaxy S5, Nokia Lumia 925) y 7 apps frente a fotómetro clase A PRC Krochmann 106e con calibración trazable, a 100/500/1000 lx bajo halógena, fluorescente compacta 2700 K y LED 3000 K. Desviación máxima +113 % (Galaxy S5: 1.063 lx a 500 lx reales); mínima 3 % (iPhone 5 + LightMeter: 484 lx a 500), pero la misma combinación dio 11 lx a 100 lx reales (−89 %). Mediana: Android/Windows ≈+60 %, iPhone ≈−60 %. Cuatro iPhone 5 idénticos con la misma app dieron resultados muy distintos. Diferencias entre apps de hasta 358 % (55 lx vs 12 lx a 100 lx reales). La cámara trasera da valores muy distintos de la frontal. Conclusión del laboratorio: sin sensor corregido V(λ) ni corrección coseno, la calibración solo ayuda cerca del punto calibrado; las apps "no son de gran ayuda para medir iluminancia", ni siquiera como estimación grosera. [C] — [DIAL, Luxmeter app vs measuring device](https://dial.de/en-GB/news/luxmeter-app-vs-measuring-device)

**Apps PAR/PPFD (p. ej. Photone)**
- No se pudo abrir ninguna evaluación independiente legible de Photone ni de apps PPFD (la prueba del vendedor Migro devolvió 404 en ambas URL). No hay evidencia prioritaria de su precisión → no citar precisión concreta en la app. Ver Lagunas.

### Inferences
- Para una app de cuidado de plantas, el medidor de aguja debe presentarse como "indicador relativo de tendencia" (comparar la misma maceta a la misma profundidad a lo largo de los días), nunca como valor absoluto ni como sustituto del dedo/peso; y con aviso de que fertilizante, agua dura, agua descalcificada, compactación y sustratos de corteza/perlita distorsionan la lectura (inferido de Garden Myths [C] + UMD/MSU sobre sales [P]).
- Las apps de lux del móvil sirven para comparar dos puntos de la casa en el mismo momento y con el mismo teléfono (UF/IFAS: "detectar un cambio"), pero no para asignar una categoría absoluta de luz ni para convertir a PPFD con fiabilidad (DIAL: errores de ±60 % típicos y no lineales).
- Un luxómetro barato dedicado (con sensor fotométrico) es la opción de bajo coste con respaldo de extensión (UF/IFAS); Illinois acepta también un fotómetro fotográfico.

### Gaps
- No se encontró ninguna publicación de extensión que explique explícitamente que los medidores de aguja miden conductividad eléctrica; la afirmación procede solo de fuente complementaria (Garden Myths) → confianza Baja-Media para el mecanismo, aunque la consecuencia (sales alteran la lectura) es coherente con las advertencias prioritarias sobre sales.
- Póster Toronto Met 2018 (Messalam & Abdoli-Eramaki) y capítulo DAAAM 2022 sobre apps de lux: PDF ilegibles; no se atribuye nada.
- Evidencia de precisión de Photone u otras apps PAR: ninguna fuente abierta y legible.

---

## Pregunta 2. ¿Qué rangos de luz (fc, lux, PPFD, DLI) recomiendan para plantas de interior de baja, media y alta luz?

### Takeaway
Las fuentes de extensión coinciden en el esquema de cuatro bandas de UF/IFAS y UMD (baja 25-100 fc, media 100-500, alta 500-1000, sol directo >1000 fc), aunque Mississippi State e Illinois usan umbrales distintos; UF/IFAS advierte que "baja/media/alta" son generalizaciones, no términos científicos. No se pudo verificar ninguna fuente prioritaria con rangos PPFD/DLI para plantas de interior domésticas.

### Cited Findings
- UF/IFAS (mediodía): baja 25-100 fc ("muy poca luz natural"); media 100-500 fc (cerca de ventanas sin sol directo, p. ej. norte sin sombra); alta 500-1000 fc (cerca de ventanas, algo de sol directo filtrado); sol directo >1000 fc (frente a la ventana, solo cristal entre planta y sol). Referencias: exterior invierno mediodía >4.000 fc; ventana norte puede no llegar nunca a 400 fc; oficina solo con fluorescentes ≤40 fc. "Los términos 'baja', 'media' y 'alta', como 'luz brillante indirecta', son generalizaciones, no términos científicos". Plantas de sol directo: ≥4 h de sol. La mayoría de plantas necesitan ≥8 h de luz artificial si dependen de ella. [P] — [UF/IFAS, Light for houseplants](https://gardeningsolutions.ifas.ufl.edu/plants/houseplants/light-for-houseplants/)
- UMD Extension: baja 25-100 fc (ventanas norte o salas con luz artificial; ZZ, sansevieria); media-brillante 100-500 fc (este u oeste; aglaonema, violeta africana); alta 500-1000 fc (sur o algunas oeste; crotón, hibisco, jade); sol directo interior >1000 fc con "4-6 h de sol directo". Pico exterior ≈10.000 fc. Máximo 16 h de luz/día; plantas de día corto (poinsettia, kalanchoe, cactus de Navidad) necesitan ≤11 h. Cortinas, mosquiteras, suciedad del cristal, estación y superficies claras alteran la lectura. [P] — [UMD, Natural lighting for indoor plants](https://extension.umd.edu/resource/natural-lighting-indoor-plants)
- Mississippi State P1012: alta ≥1.000 fc; media 500-1.000; baja 50-500; "<50 fc no mantiene la vida de la planta mucho tiempo". Pero su lista de plantas usa baja 25-75, media 75-150, alta 150-1.000 fc (incoherencia interna). Humedad de hogares con climatización "típicamente 10-30 %". [P] — [MSU Extension P1012](https://extension.msstate.edu/publications/care-selection-indoor-plants)
- Illinois Extension (valores guía puntuales): baja ≈75 fc; media ≈150; alta/brillante ≈300; directa ≈1.500; sol exterior 10.000-12.000 fc. Distancias: norte → media justo delante, baja a pocos pies; este/oeste → alta delante, media a pocos pies, baja a 3-10 pies (0,9-3 m); sur → directa delante, alta hasta 5 pies (1,5 m), media 3-10 pies, baja 15-20 pies (4,5-6 m). Con poca luz, 14-16 h/día de luz artificial; nunca >16 h (descanso). [P] — [Illinois Extension, Lighting](https://extension.illinois.edu/houseplants/lighting)
- Nebraska G2205: espacios con <75 fc (nivel necesario para leer) cuentan como baja luz; plantas de tabla I (baja luz) a >8 pies (2,4 m) de la ventana; tablas II-III necesitan ~4 h de sol directo o luz brillante indirecta, típicamente a 4-8 pies (1,2-2,4 m); 12-16 h de fluorescente suplementaria. [P] — [Nebraska Extension G2205](https://extensionpubs.unl.edu/publication/g2205/html/view)
- RHS: la "sombra brillante", es decir, "luz brillante que no proyecta una sombra nítidamente definida", es "generalmente adecuada en verano"; en invierno las plantas se benefician de pleno sol; en verano el sol fuerte a través del cristal puede quemar; las plantas de flor suelen necesitar más luz que las de hoja. [P] — [RHS, How to grow houseplants](https://www.rhs.org.uk/plants/types/houseplants/growing-guide)
- DLI (contexto profesional, complementaria): el DLI "es la suma de toda la luz a lo largo del día" (intensidad × duración), en mol·m⁻²·d⁻¹; rango típico mundial 5-60; plantas de temporada y vivaces ≈3-12; tomate 22-30; un acristalamiento de invernadero reduce el DLI "entre 40 % y 70 %". [C] — [HortiDaily/Heliospectra, Do you have enough light](https://www.hortidaily.com/article/6031123/do-you-have-enough-light-inside-your-greenhouse-or-indoor-grow/)

**Tabla de rangos de referencia de luz para la app** (fc → lux por ×10,76; PPFD y DLI son inferencias, ver abajo)

| Categoría | fc (UF/IFAS + UMD) | lux (conversión) | PPFD estimado luz diurna (×0,0185) | Ejemplos (UMD) | Confianza |
|---|---|---|---|---|---|
| Baja | 25-100 | ≈270-1.080 | ≈5-20 µmol·m⁻²·s⁻¹ | ZZ, sansevieria | Alta (fc: UF/IFAS + UMD); PPFD: inferencia |
| Media | 100-500 | ≈1.080-5.400 | ≈20-100 | aglaonema, violeta africana | Alta (fc); PPFD: inferencia |
| Alta | 500-1.000 | ≈5.400-10.800 | ≈100-200 | crotón, hibisco, jade | Alta (fc); PPFD: inferencia |
| Sol directo | >1.000 (4-6 h de sol) | >10.800 | >200 | cactus, suculentas de sol | Alta (fc) |
| Umbral de supervivencia | <50 fc "no sostiene la vida mucho tiempo" | <540 | <10 | — | Media (solo Mississippi State) |

### Inferences
- Conversión lux a partir de fc: 1 fc = 10,764 lx (definición de unidades; UF/IFAS indica "difiere de fc en un factor ≈10").
- PPFD estimado: aplicando el factor de luz solar de Apogee (0,0185 µmol·m⁻²·s⁻¹ por lux; ver P3) a luz diurna que entra por ventana. Límite: el cristal y la reflexión interior alteran el espectro, y el factor solo es válido para espectro solar; usar como orden de magnitud.
- DLI aproximado (aritmética: DLI = PPFD × segundos de luz / 10⁶): una posición "media" a 50 µmol durante 12 h ≈ 2,2 mol·m⁻²·d⁻¹; "alta" a 150 µmol × 12 h ≈ 6,5 mol; "baja" a 10 µmol × 12 h ≈ 0,4 mol. Esto sugiere que las plantas de interior viven con DLI muy por debajo de los 3-12 mol de cultivo profesional (HortiDaily [C]); no hay fuente prioritaria que fije DLI por categoría de planta de interior doméstica.
- Para la app conviene usar las cuatro bandas de UF/IFAS/UMD (coinciden exactamente) y mostrar los lux como rango orientativo, con el aviso textual de UF/IFAS de que las categorías son generalizaciones.

### Gaps
- MSU (Runkle): DLI objetivo para plantas de hoja (los resúmenes de búsqueda hablaban de 6-10 mol·m⁻²·d⁻¹) — todas las páginas y PDF de canr.msu.edu devolvieron contenido vacío o binario; NO verificado, no usar sin comprobar.
- UMN "Light requirements for houseplants" (resumen de búsqueda: media 150-250 µmol = 250-1.000 fc; alta 250-450 µmol >1.000 fc) — 403; NO verificado.
- Purdue HO-238-W, Oklahoma State HLA-6411, Penn State "Caring for houseplants": ilegibles o 403/404.

---

## Pregunta 3. ¿Qué factor de conversión lux→µmol·m⁻²·s⁻¹ se acepta para sol y para LED blanco, y con qué incertidumbre?

### Takeaway
Para luz solar el factor de referencia es 0,0185 µmol·m⁻²·s⁻¹ por lux (54 lx por µmol), publicado por Apogee a partir de Thimijan & Heins (1982); para LED blanco la única fuente abierta (preprint) propone ≈0,015 por lux (1.000 lx ≈ 15 µmol), con variación ≤7 % según CCT/CRI pero con error adicional de 10-20 % del propio luxómetro. Ninguna fuente prioritaria legible confirma estos valores.

### Cited Findings
- Apogee Instruments (tabla de conversión, cita Thimijan & Heins 1982, HortScience 18:818-822): lux = PPFD × factor; luz solar 54; fluorescente blanco frío 74; HPS 82; DE-HPS 77; haluro metálico 71; CMH 4200 K 65; CMH 3100 K 59. Inversa (PPFD = lux × factor): sol 0,0185; fluorescente 0,0135; HPS 0,0122; MH 0,0141; CMH 4200 K 0,0154; CMH 3100 K 0,0170. "La conversión de PPFD a lux varía bajo diferentes fuentes de luz". La página no da incertidumbre ni incluye LED. Ejemplo tabla: 100 µmol sol = 5.400 lx; 1.000 µmol = 54.000 lx; 2.000 µmol = 108.000 lx. [C] — [Apogee, Conversion PPFD to lux](https://www.apogeeinstruments.com/conversion-ppfd-to-lux/)
- Preprint (no revisado) Sharakshane 2018, bioRxiv: "1000 lx = 15 μmol/s/m²" para LED blancos; fórmula de regresión PPF (µmol·s⁻¹ por klm) = −48 + 0,0005·CCT + 12.000/CCT + 0,4·Ra + 2.000/Ra "a δ=2,1 %"; los valores de la tabla "difieren del valor redondo de 15 en no más del 7 %"; las lecturas del luxómetro "pueden diferir de los valores reales un 10-20 %" y la falta de uniformidad de la iluminación alcanza ≈30 %. Aplicando la fórmula (cálculo propio, no tabla del autor): 2700 K/CRI 80 ≈14,8; 4000 K/CRI 80 ≈14,0; 5000 K/CRI 80 ≈13,9; CRI 90 ≈15,1-16,0 µmol por 1.000 lx → rango ≈0,0139-0,0160 por lux. [C] — [Sharakshane, bioRxiv 10.1101/289280](https://www.biorxiv.org/content/10.1101/289280v1.full)
- UF/IFAS define lux como lumen/m² y señala que difiere de fc "en un factor de aproximadamente 10" (sin tratar PPFD). [P] — [UF/IFAS, Light for houseplants](https://gardeningsolutions.ifas.ufl.edu/plants/houseplants/light-for-houseplants/)
- Apogee: el lux se basa en la curva fotópica con pico en 555 nm (683 lm/W a esa longitud de onda), razón por la que la conversión depende del espectro. [C] — [Apogee](https://www.apogeeinstruments.com/conversion-ppfd-to-lux/)

### Inferences
- Para la app: sol/luz diurna por ventana → PPFD ≈ lux × 0,0185 (±? — sin incertidumbre publicada; el cristal y las reflexiones interiores cambian el espectro, así que tratarlo como ±20-30 % de orden de magnitud, inferencia propia). LED blanco de interior (bombillas/pantallas 2700-6500 K) → PPFD ≈ lux × 0,015 (±7 % por espectro + 10-20 % del luxómetro según el preprint). LED hortícolas con rojo 660 nm añadido o rojo/azul: NO convertir desde lux (el lux casi no pesa el rojo profundo ni el azul; Apogee: la conversión varía con la fuente).
- Confianza del factor solar 0,0185: Media (fabricante técnico que cita artículo revisado por pares no abierto + coherencia con fórmula del preprint para espectros amplios). Confianza LED blanco 0,015: Baja (un preprint).

### Gaps
- Thimijan & Heins (1982) texto completo: 403 en journals.ashs.org; no se verifican sus factores directamente.
- No se encontró ninguna fuente prioritaria (extensión o revista) con factor lux→PPFD para LED blanco de uso doméstico.

---

## Pregunta 4. ¿Qué precisión tienen los higrómetros/termómetros digitales baratos y cómo se calibran (método de la sal)?

### Takeaway
Los sensores de HR de bajo coste suelen especificarse en ±3-3,5 % HR; un estudio metrológico de 7 meses halló una varianza de calibración de 0,4 ± 0,2 % HR (mejor que la especificación) pero deriva significativa en ambientes húmedos, recomendando recalibrar cada 6 meses (3 en húmedo). El punto de control casero es NaCl saturado: ≈75,3 % HR a 25 °C (75,7 % a 20 °C), con equilibrado de 20 min (sensores pequeños) a 1 h (instrumentos grandes) según fuente complementaria.

### Cited Findings
- Nair, McCarthy, Heusch & Patz (2015, 17.º Congreso Internacional de Metrología, EDP Sciences): sensores de HR seguidos 7 meses en 5 emplazamientos con calibración mensual trazable en cámara climática a 9 niveles de humedad; la varianza de calibración dentro de cada sensor fue 0,4 ± 0,2 % HR, menor que la especificación del fabricante de ±3,5 % HR; los sensores alimentados en humedad baja no cambiaron significativamente (p > 0,05), los de humedad alta sí (p < 0,05); recomiendan recalibrar cada 6 meses y cada ≈3 meses en ambientes húmedos. [P] — [Nair et al. 2015, University of South Wales repository](https://pure.southwales.ac.uk/en/publications/testing-the-reliability-of-humidity-sensors-through-prolonged-mea/)
- Nebraska Extension: "Use un monitor portátil de humedad para determinar el nivel de humedad y vigilar las fluctuaciones a lo largo del tiempo"; la humedad interior en invierno puede caer por debajo del 20 %. [P] — [Nebraska Extension G2205](https://extensionpubs.unl.edu/publication/g2205/html/view)
- Sal saturada (NaCl) como punto fijo de HR: 75,7 % a 20,0 °C y 75,3 % a 25,0 °C (tabla 5-25 °C). Procedimiento: ≈3 mm de sal seca en bandeja plana dentro de caja hermética, añadir solo agua suficiente para que parezca húmeda, instrumento sobre rejilla encima; equilibrado ≈20 min para sensores pequeños y ≈1 h para instrumentos voluminosos; los sensores electrónicos pueden pasar por un orificio sellado con tapón de goma partido. [C] — [Conservation Physics, Saturated salt solutions](https://www.conservationphysics.org/satslt/satsalt.html)
- RHS: mantener las plantas lejos de corrientes frías, de los radiadores (secan y pardean márgenes) y del espacio tras cortinas corridas en invierno (muy frío). [P] — [RHS, How to grow houseplants](https://www.rhs.org.uk/plants/types/houseplants/growing-guide)

### Inferences
- Procedimiento de calibración para la app (síntesis): bolsa/caja hermética + sal de mesa humedecida (pasta, no disolución) + higrómetro sin tocar la sal; esperar al menos 1 h (conservación) — las fuentes de aficionado no verificadas hablan de 6-24 h, por lo que recomendar "mínimo 1 h, ideal varias horas, sin abrir"; a 20-25 °C debe leer 75-76 % HR; la diferencia es el offset a aplicar (muchos digitales permiten ajustarlo). Solo verifica un punto (75 %); no garantiza exactitud a 40-50 %.
- Dónde colocar el higrómetro/termómetro: a la altura de la planta, lejos de radiadores, ventanas frías, corrientes y cortinas (inferido de RHS sobre microclimas); los registradores (data loggers) responden a la recomendación de Nebraska de "vigilar fluctuaciones a lo largo del tiempo".
- Precisión esperable de un termohigrómetro digital barato: ±3-3,5 % HR según especificación habitual (Nair et al. citan ±3,5 %); temperatura: sin fuente verificada (laguna).

### Gaps
- Greenspan (1977, J. Res. NBS 81A:89-96), fuente primaria del 75,3 %: PMC devolvió CAPTCHA y el PDF de NIST no se abrió; el valor se sostiene solo en fuente complementaria → confianza Media-Baja para el número exacto (aunque es un dato metrológico muy establecido).
- Salamone et al. 2022 (Buildings, 7 termohigrómetros baratos en cámara climática, ISO 7726): 403; no se atribuye.
- No se encontró fuente verificada sobre la precisión de temperatura de termómetros digitales baratos ni sobre el error de los higrómetros analógicos (de cabello/metálicos).

---

## Pregunta 5. ¿Qué sensores capacitivos o sondas tienen evidencia de fiabilidad frente a las resistivas de aguja? ¿Y los tensiómetros?

### Takeaway
Un estudio revisado por pares (Sensors, 2025) muestra que los sensores capacitivos comerciales pueden medir contenido volumétrico de agua con desviaciones medias de ≈3-5 % VWC cuando se calibran para el sustrato, pero las ecuaciones de fábrica fallan en sustratos de maceta (hasta 13-18 % VWC de error) y el sensor capacitivo de 14 € (DFRobot) solo sirve como indicador grueso. No se encontró evidencia prioritaria legible sobre tensiómetros en macetas de interior.

### Cited Findings
- Gümüser, Pichlhöfer & Korjenic (Sensors 2025; en PMC): 4 sensores capacitivos — TEROS 10 (METER, 160 €), Scanntronik (189 €), SMT50 (Truebner, 69 €), DFRobot (14 €) — en 3 sustratos (mineral lava/pumita/zeolita; mezcla orgánica de cubierta; la misma tamizada a 2 mm), 380 mediciones en laboratorio, cada punto media de 4 lecturas. Repetibilidad (desviación relativa media): TEROS 10 1,3-1,7 %; DFRobot 3,3-8,2 %; SMT50 6,6-12,6 %; Scanntronik 6,4-14,4 %. Exactitud con ecuaciones del fabricante (desviación absoluta media, % VWC): SMT50 4,8 / 3,6 / 13,2; TEROS 10 3,9 / 9,8 / 3,4; Scanntronik 3,7 / 3,2 / 18,5; DFRobot no cuantificable (sin ecuación, solo categorías seco/húmedo/muy húmedo; en S2 "húmedo" ≈23-29 % VWC, "muy húmedo" ≈32-44 %). Ajustes cúbicos R² 0,94-0,99 salvo DFRobot en S3 (0,745). Los errores fueron de pendiente, no solo de offset → "es necesaria una calibración específica del sustrato"; tamizar el sustrato redujo la variabilidad ≈40 % en SMT50 y Scanntronik; el DFRobot "rindió de forma comparable a SMT50 y Scanntronik en ciertas condiciones" pero es poco apto para control preciso. [P] — [Gümüser et al. 2025, Sensors, PMC11902863](https://pmc.ncbi.nlm.nih.gov/articles/PMC11902863/)
- Resistivas de aguja: ver P1 (Illinois "puede no ser siempre fiable" [P]; Garden Myths: rango útil 6,5/10, sesgo por sales y compactación [C]).
- Métodos sin instrumento con respaldo de extensión: dedo a ≈5 cm (Illinois; UMD; Nebraska 1-2 pulgadas; Mississippi State hasta la articulación media del dedo corazón) [P]; levantar la maceta ("la planta con sustrato seco pesa mucho menos", UMD; "las macetas secas se sienten más ligeras", RHS; "el suelo seco es más ligero", Mississippi State) [P]; palillo/dowel de madera sin pintar hasta el fondo (Mississippi State; UMD: el sustrato húmedo se adhiere o lo oscurece) [P]. Excepciones: el dedo es menos fiable "para suculentas y cactus que necesitan mucha menos agua"; el spathiphyllum se marchita tanto por sed como por exceso (UMD). Si el dedo no entra 5 cm, el sustrato es poco poroso o la planta está enraizada en exceso (UMD). Sustrato muy seco puede encoger separándose de la pared y requerir varios riegos para rehidratar (UMD). — [Illinois](https://extension.illinois.edu/houseplants/watering); [UMD Watering](https://extension.umd.edu/resource/watering-indoor-plants); [UMD Drought](https://extension.umd.edu/node/1176); [Nebraska G2205](https://extensionpubs.unl.edu/publication/g2205/html/view); [MSU Extension P1012](https://extension.msstate.edu/publications/care-selection-indoor-plants); [RHS](https://www.rhs.org.uk/plants/types/houseplants/growing-guide)

**Tabla por instrumento (humedad del sustrato)**

| Instrumento | Para qué | Cuándo sí | Cuándo no | Precauciones / limitaciones | Confianza | Fuentes |
|---|---|---|---|---|---|---|
| Sonda resistiva de aguja (1-3 en 1) | Indicador relativo "más/menos húmedo" | Misma maceta, misma profundidad, seguimiento de tendencia; macetas grandes donde el dedo no llega | Decidir riego absoluto; sustratos de corteza/orquídea, muy perlíticos; tras fertilizar o con agua dura/descalcificada; medir luz o pH con el mismo aparato | Mide conductancia, no agua; rango útil ≈6,5/10; sales y compactación leen "más húmedo"; clavar ≈5 cm, no medir en el borde ni justo tras regar; limpiar y secar la sonda, no dejarla clavada (corrosión altera lecturas); no calibrable | Media (Illinois [P] + Garden Myths [C]); mecanismo: Baja | Illinois; Mississippi State; UMD (sales); Garden Myths |
| Sensor capacitivo (DFRobot y similares, 10-20 €) | Indicador grueso seco/húmedo/muy húmedo; registro continuo | Registro de tendencia en la misma maceta; avisos "muy seco" | Valores absolutos de % VWC sin calibrar en ese sustrato | Sin ecuación de fábrica; R² bajo en sustrato fino; requiere calibración por sustrato | Media (1 estudio revisado por pares) | Gümüser 2025 |
| Sensor capacitivo profesional (TEROS 10, SMT50) | % VWC con calibración | Investigación, riego automático | Uso doméstico sin calibrar (errores de 3-18 % VWC con ecuaciones de fábrica) | Calibración específica del sustrato; coste 70-160 € | Media | Gümüser 2025 |
| Tensiómetro | Tensión matricial (kPa/cb) | — (sin evidencia verificada para macetas de interior) | — | Ver Lagunas | Sin datos | — |
| Dedo (≈5 cm) | Decidir riego | Mayoría de plantas de hoja | Cactus/suculentas (menos fiable); macetas muy grandes | Sustrato frío puede parecer húmedo (solo fuente no verificada); si no entra 5 cm, sustrato compacto o cepellón saturado | Alta | Illinois; UMD; Nebraska; Mississippi State |
| Peso de la maceta | Decidir riego, gratis | Macetas de plástico y tamaño manejable; comparar con el peso recién regada | Macetas pesadas (cerámica/barro grandes) sin referencia | Requiere memoria del peso "regada" vs "seca" | Alta | UMD ×2; RHS; Mississippi State |
| Palillo/dowel de madera | Humedad en profundidad, gratis | Macetas grandes | Sustratos muy gruesos | Dejar unos minutos; si se adhiere sustrato o se oscurece, no regar | Alta | Mississippi State; UMD |

### Inferences
- Para la app, la jerarquía de fiabilidad respaldada por evidencia es: peso/dedo/palillo (Alta) > capacitivo calibrado (Media) > capacitivo barato como alarma gruesa (Media) > sonda de aguja como tendencia (Media-Baja). Ninguna fuente prioritaria sitúa la sonda de aguja por encima del dedo.
- Si la app integra sensores capacitivos conectados, debe ofrecer una calibración de dos puntos por maceta (seco tras varios días / recién regada y drenada), coherente con la conclusión de "calibración específica del sustrato" del estudio.

### Gaps
- Tensiómetros: UF/IFAS AE146 (Circular 487) y TR015 devolvieron 410 Gone; no hay fuente verificada sobre rango operativo, mantenimiento ni uso en macetas → no incluir afirmaciones concretas en la app.
- No se encontró estudio comparativo directo "aguja resistiva vs capacitivo" en sustrato de maceta (la afirmación de que los capacitivos tienen la mitad de error procedía de un vendedor no abierto).

---

## Pregunta 6. Rangos de HR y temperatura de interior, instrumentos de luz, y ¿cuál es el valor real de "medir" frente a observar la planta y el sustrato?

### Takeaway
Las fuentes de extensión convergen en 40-60 % HR preferida (daño <20 % salvo suculentas), 18-24 °C de día y noches ≈5-8 °C más frescas; y en que la observación (dedo, peso, sombra de la mano, síntomas) es el método de primera línea, con instrumentos reservados a luxómetro dedicado y monitor de humedad para ver tendencias.

### Cited Findings

**Humedad relativa y temperatura**
- Nebraska G2205: la mayoría de plantas de interior se dañan por debajo del 20 % HR (excepto suculentas); rango preferido 40-60 %; las que necesitan "muy alta humedad" requieren >50 %; interior invernal puede bajar de 20 %. Temperatura: la mayoría de plantas de hoja toleran 65-75 °F (18-24 °C) de día; noches 10-15 °F (≈5,5-8 °C) más frescas; "los 70 bajos (≈21-23 °C) son más sanos que los 80 (≈27-32 °C)"; días soleados suben ≈10 °F la temperatura junto a la ventana; violeta africana, crotón y maranta prefieren noches cálidas; plantas a temperatura demasiado baja muestran hojas translúcidas que amarillean y caen de golpe. [P] — [Nebraska Extension G2205](https://extensionpubs.unl.edu/publication/g2205/html/view)
- Mississippi State P1012: día ideal "65-75 °F (18-24 °C)", noche "unos 10 grados (°F) más fría" (≈5,5 °C); hogares climatizados 10-30 % HR frente a 70-90 % en el trópico de origen; sin objetivo numérico de HR. [P] — [MSU Extension P1012](https://extension.msstate.edu/publications/care-selection-indoor-plants)
- RHS: 15 °C (60 °F) mientras están en flor para alargar la floración; evitar corrientes frías, radiadores, tras cortinas en invierno; para humedad: platos con grava/arcilla expandida húmeda, agrupar plantas, pulverizar con frecuencia; la calefacción central reduce la humedad y seca antes las macetas; sin porcentaje objetivo. [P] — [RHS, How to grow houseplants](https://www.rhs.org.uk/plants/types/houseplants/growing-guide)

**Tabla de rangos de referencia (HR y temperatura)**

| Parámetro | Valor | Confianza | Fuentes |
|---|---|---|---|
| HR preferida (plantas de hoja tropicales) | 40-60 % | Media (1 prioritaria con cifra exacta; otras solo cualitativas) | Nebraska |
| HR de daño | <20 % (excepto suculentas) | Media | Nebraska |
| HR "alta humedad" (helechos, calatheas, etc.) | >50 % | Media | Nebraska |
| HR típica de vivienda climatizada | 10-30 % (invierno <20 %) | Alta | Mississippi State; Nebraska |
| Temperatura diurna | 18-24 °C (65-75 °F); mejor 21-23 °C que >27 °C | Alta | Nebraska; Mississippi State |
| Temperatura nocturna | ≈5-8 °C más fresca que el día (≈13-18 °C) | Alta | Nebraska (10-15 °F); Mississippi State (≈10 °F) |
| Plantas en flor | ≈15 °C alarga la floración | Media | RHS |
| Evitar | corrientes frías, radiadores, tras cortinas en invierno, sol fuerte tras cristal en verano | Media | RHS |

**Instrumentos y métodos de luz — tabla por instrumento**

| Instrumento | Para qué | Cuándo sí | Cuándo no | Precauciones / limitaciones | Confianza | Fuentes |
|---|---|---|---|---|---|---|
| Luxómetro de mano (sensor fotométrico) | Clasificar la posición en baja/media/alta/directa (fc o lux) | Comparar ubicaciones; comprobar cuánto cae la luz al alejarse de la ventana | Medir PPFD de LED de cultivo rojo/azul (conversión inválida) | Basta uno barato "preciso a 1 fc"; medir a mediodía (UF/IFAS da rangos "de mediodía") y a la altura de la hoja; repetir por estación (luz cambia con estación, cortinas, mosquiteras, suciedad del cristal); convertir fc→lux ×10,76 | Alta (UF/IFAS + Illinois) | UF/IFAS; Illinois; UMD |
| Fotómetro fotográfico / cámara | Estimación | Alternativa aceptada por Illinois | — | Sin detalles de procedimiento en fuente | Media | Illinois |
| App de lux del móvil (sensor ambiental/cámara) | Detectar cambios relativos | Comparar dos puntos con el mismo móvil el mismo día | Valor absoluto; asignar categoría; convertir a PPFD; comparar entre móviles | Errores de −89 % a +113 %, medianas ±60 %, no lineales con el nivel de luz; difieren entre unidades idénticas; cámara trasera ≠ frontal; calibración solo válida cerca del punto calibrado | Alta para "solo aproximación" (UF/IFAS [P] + DIAL [C] coherentes) | UF/IFAS; DIAL |
| App PAR/PPFD (Photone y similares) | — | — | — | Sin evidencia independiente verificada | Sin datos | — |
| Medidor de luz integrado en sonda "3 en 1" | — | — | No usar | Sin sensor fotométrico documentado ni validación en ninguna fuente abierta (laguna); ninguna fuente de extensión lo menciona | Sin datos | — |
| Sensor cuántico PAR (p. ej. Apogee) | PPFD real, DLI con registro | Cultivo con LED, comprobación de lámparas | Coste alto para uso doméstico | Es la referencia frente a la que se evalúan apps; conversiones lux↔PPFD dependen del espectro | Media | Apogee [C]; DIAL (sobre sensor adecuado) |
| Prueba de la sombra de la mano (gratis) | Clasificar luz brillante/media/baja | Rápida, repetir por estación; RHS usa "sombra no nítida" como definición de "sombra brillante" | Precisión numérica | Mano a ≈30 cm sobre papel blanco, día soleado: sombra nítida = brillante; borrosa pero reconocible = media; apenas visible sin dedos = baja; sin sombra = sombra profunda; el ojo humano es mal juez de la luz; repetir en invierno | Media (RHS [P] respalda el principio; procedimiento detallado solo [C]) | RHS; Laidback Gardener |
| Termohigrómetro digital / data logger | HR y temperatura; fluctuaciones | Invierno con calefacción; comprobar HR 40-60 %; detectar noches frías junto a ventanas | Confiar en ±1 % | Especificación típica ±3,5 % HR; recalibrar cada 6 meses (3 en ambientes húmedos); comprobar con sal saturada (≈75 % HR); colocar a la altura de la planta, lejos de radiadores/corrientes | Media | Nebraska [P]; Nair 2015 [P]; Conservation Physics [C]; RHS [P] |

**Valor de medir frente a observar**
- UF/IFAS: el luxómetro "es a menudo la mejor herramienta" para la luz, porque las categorías verbales son generalizaciones. [P] — [UF/IFAS](https://gardeningsolutions.ifas.ufl.edu/plants/houseplants/light-for-houseplants/)
- Laidback Gardener (complementaria): "los ojos son malos jueces de la luz" porque se adaptan a la penumbra. [C] — [Laidback Gardener, Shadow test](https://laidbackgardener.blog/2016/11/25/a-shadow-test-for-houseplants/)
- Para el riego, todas las fuentes prioritarias ponen primero la observación directa: RHS "no riegues por rutina, comprueba antes que la maceta lo necesita" y "riega cuando la superficie del compost esté seca"; Illinois: el marchitamiento "a menudo indica falta de agua, pero a veces es síntoma de exceso" → comprobar el sustrato; UMD: síntomas de sales = crecimiento reducido y puntas pardas; Nebraska: puntas y bordes pardos por sales, hojas translúcidas por frío. [P] — [RHS](https://www.rhs.org.uk/plants/types/houseplants/growing-guide); [Illinois](https://extension.illinois.edu/houseplants/watering); [UMD](https://extension.umd.edu/resource/watering-indoor-plants); [Nebraska](https://extensionpubs.unl.edu/publication/g2205/html/view)
- Garden Myths: depender del medidor "puede impedir que los principiantes aprendan a regar bien". [C] — [Garden Myths](https://gardenmyths.com/soil-moisture-meters-do-they-work)

### Inferences
- Dónde sí aporta medir: (1) luz, porque el ojo no la estima bien y las categorías son vagas — un luxómetro barato a mediodía a la altura de la hoja, repetido en invierno, es la única medición con respaldo claro de extensión; (2) HR/temperatura en invierno con calefacción, donde los valores caen por debajo de los umbrales de daño (<20 %) sin que se note — un monitor/registrador permite ver fluctuaciones (Nebraska). Dónde no aporta: humedad del sustrato con sonda de aguja, donde el dedo/peso es más fiable y gratis.
- Regla práctica para la app: "observa primero, mide para confirmar": síntomas + dedo/peso para riego; sombra de la mano + luxómetro para luz; termohigrómetro para HR/temperatura.

### Gaps
- Oklahoma State HLA-6411 (resumen de búsqueda: HR 50-60 %) no verificado.
- No se verificó ninguna fuente sobre precisión de termómetros digitales baratos.
- Sin fuente sobre altura/colocación exacta del higrómetro (la recomendación "a la altura de la planta, lejos de paredes/radiadores" es inferencia a partir de RHS sobre microclimas).

---

## Fuentes (todas abiertas con WebFetch)

| Fuente | URL | Tipo |
|---|---|---|
| UF/IFAS Gardening Solutions — Light for houseplants | https://gardeningsolutions.ifas.ufl.edu/plants/houseplants/light-for-houseplants/ | Prioritaria (extensión) |
| University of Illinois Extension — Lighting (houseplants) | https://extension.illinois.edu/houseplants/lighting | Prioritaria |
| University of Illinois Extension — Watering (houseplants) | https://extension.illinois.edu/houseplants/watering | Prioritaria |
| University of Maryland Extension — Natural lighting for indoor plants | https://extension.umd.edu/resource/natural-lighting-indoor-plants | Prioritaria |
| University of Maryland Extension — Watering indoor plants | https://extension.umd.edu/resource/watering-indoor-plants | Prioritaria |
| University of Maryland Extension — Drought stress to indoor plants | https://extension.umd.edu/node/1176 | Prioritaria |
| Nebraska Extension G2205 (houseplants: light, temperature, humidity, watering) | https://extensionpubs.unl.edu/publication/g2205/html/view | Prioritaria |
| Mississippi State Extension P1012 — Care and selection of indoor plants | https://extension.msstate.edu/publications/care-selection-indoor-plants | Prioritaria |
| RHS — How to grow houseplants | https://www.rhs.org.uk/plants/types/houseplants/growing-guide | Prioritaria (RHS) |
| Gümüser, Pichlhöfer, Korjenic (2025) Sensors — capacitive sensors in substrates | https://pmc.ncbi.nlm.nih.gov/articles/PMC11902863/ | Prioritaria (revisada por pares) |
| Nair, McCarthy, Heusch, Patz (2015) CIM 2015 — reliability of humidity sensors | https://pure.southwales.ac.uk/en/publications/testing-the-reliability-of-humidity-sensors-through-prolonged-mea/ | Prioritaria (congreso revisado, EDP Sciences; solo resumen leído) |
| Apogee Instruments — Conversion PPFD to lux | https://www.apogeeinstruments.com/conversion-ppfd-to-lux/ | Complementaria (fabricante, técnica) |
| Sharakshane (2018) bioRxiv — 1000 lx = 15 µmol for white LEDs | https://www.biorxiv.org/content/10.1101/289280v1.full | Complementaria (preprint) |
| DIAL GmbH — Luxmeter app vs measuring device | https://dial.de/en-GB/news/luxmeter-app-vs-measuring-device | Complementaria (laboratorio acreditado privado) |
| Conservation Physics — Saturated salt solutions | https://www.conservationphysics.org/satslt/satsalt.html | Complementaria |
| Garden Myths (R. Pavlis) — Soil moisture meters, do they work | https://gardenmyths.com/soil-moisture-meters-do-they-work | Complementaria (blog con pruebas propias) |
| Laidback Gardener (L. Hodgson) — A shadow test for houseplants | https://laidbackgardener.blog/2016/11/25/a-shadow-test-for-houseplants/ | Complementaria |
| HortiDaily / Heliospectra — Do you have enough light (DLI) | https://www.hortidaily.com/article/6031123/do-you-have-enough-light-inside-your-greenhouse-or-indoor-grow/ | Complementaria (vendedor) |

## Contradicciones

1. **Umbrales de categorías de luz entre fuentes prioritarias.** UF/IFAS y UMD: baja 25-100 fc, media 100-500, alta 500-1000, directa >1000. Mississippi State (cuerpo del texto): baja 50-500, media 500-1000, alta ≥1000; y su propia lista de plantas usa baja 25-75, media 75-150, alta 150-1000 (incoherencia interna). Illinois: valores puntuales 75/150/300/1500 fc. Nebraska: <75 fc = baja. Resolución propuesta: usar UF/IFAS+UMD (idénticas) y declarar las categorías como orientativas, como hace UF/IFAS.
2. **Duración de luz diaria.** Illinois: en baja luz 14-16 h de luz artificial, nunca >16 h; UMD: no más de 16 h en total y ≤11 h para plantas de día corto; Nebraska: 12-16 h suplementaria; UF/IFAS: "ocho o más horas" para la mayoría. No es contradicción estricta pero los mínimos difieren (8 vs 12-14 h).
3. **Noche más fresca.** Nebraska 10-15 °F (5,5-8 °C) vs Mississippi State ≈10 °F (5,5 °C): coherentes en dirección, distinta amplitud.
4. **Fiabilidad de apps de luz.** UF/IFAS [P]: útiles para "detectar un cambio" y "aproximaciones"; DIAL [C]: "no son de gran ayuda... ni siquiera como estimación grosera". Ambas rechazan el valor absoluto; difieren en si vale para comparación relativa. Se adopta la posición prioritaria (UF/IFAS) con la salvedad de DIAL (no linealidad con el nivel de luz).
5. **Sombra de la mano = ¿"brillante" o "directa"?** Laidback Gardener [C]: sombra nítida = luz brillante; RHS [P] define "sombra brillante" como luz que NO proyecta sombra nítida; las fuentes no abiertas (resúmenes de búsqueda) sitúan la sombra nítida en "sol directo" y la ligeramente borrosa en "brillante indirecta". Para la app: sombra nítida = brillante/directa; borrosa reconocible = media/"sombra brillante"; apenas visible = baja.

## Lagunas

- **MSU/Erik Runkle (DLI):** todas las URL de canr.msu.edu (daily_light_integral_defined, saturating-dlis, dli requirements.pdf, Lighting plants indoors.pdf, lightitup.pdf, dailylightintegraldefined.pdf) devolvieron contenido vacío o PDF binario; el PDF alojado en UKY también fue binario. La cifra "6-10 mol·m⁻²·d⁻¹ para plantas de hoja" y la afirmación "ninguna unidad instantánea se convierte a DLI" aparecían en resúmenes de búsqueda pero NO se verificaron. Sin DLI por categoría con fuente prioritaria.
- **UMN Light requirements for houseplants** (PPF 150-250 µmol = 250-1.000 fc media; 250-450 µmol = alta): 403 Forbidden. No verificado.
- **Purdue HO-238-W:** PDF ilegible (sin pdftoppm en el entorno).
- **Oklahoma State HLA-6411:** HTML 403; PDF no intentado por ser binario.
- **Penn State "Caring for houseplants":** la URL devolvió una página sobre frutales; no se localizó la correcta.
- **Toronto Met 2018 (Messalam & Abdoli-Eramaki) y DAAAM 2022 (Vujica Herzog)** sobre apps de lux: PDF binarios. Habrían sido fuentes prioritarias/cuasi-prioritarias para P1.
- **Greenspan 1977 (NBS)** y **Thimijan & Heins 1982 (HortScience)**: CAPTCHA/403; los valores (75,3 % HR; factor 54 lx/µmol) solo se sostienen en fuentes complementarias que los citan.
- **Salamone et al. 2022 (Buildings)** sobre 7 termohigrómetros baratos: 403.
- **Tensiómetros en macetas:** UF/IFAS AE146 y TR015 devolvieron 410 Gone; sin fuente verificada.
- **Photone / apps PPFD:** prueba del vendedor Migro 404 en dos URL; sin evidencia independiente. No citar precisión.
- **Medidor de luz integrado en sondas "3 en 1":** ninguna fuente abierta (ni prioritaria ni complementaria) evalúa ese sensor; la afirmación de que carece de sensor fotométrico calibrado no pudo verificarse, aunque ninguna fuente de extensión lo recomienda.
- **Precisión de temperatura de termómetros digitales baratos, higrómetros analógicos, y tiempo de equilibrado en el test de la sal** (las fuentes de aficionados hablan de 6-24 h, Conservation Physics de 20 min-1 h): sin fuente prioritaria.
- **Colocación del higrómetro (lejos de paredes):** sin fuente específica; solo inferencia a partir de RHS sobre radiadores/corrientes/cortinas.
- El presupuesto de WebSearch de la sesión se agotó; cualquier continuación requiere nueva sesión o ampliar CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION.
