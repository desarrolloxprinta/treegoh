# Mitos y consejos que el agente nunca debe dar

**Documento de la Fase 1 — Biblia de plantas de interior (mercado España / Madrid).** Fecha de consulta de todas las fuentes: 2026-10-20.

## Por qué existen estos mitos y cómo debe actuar el agente

Los consejos populares sobre plantas de interior sobreviven porque parecen lógicos ("la grava deja pasar el agua"), porque proceden de cultivos agrícolas y se extrapolan sin más a una maceta ("la leche cura el oídio"), porque un fabricante o un vídeo viral los repite ("tres cubitos de hielo a la semana"), o porque la planta sobrevive *a pesar* del consejo y el usuario atribuye la supervivencia al remedio. Casi todos comparten un patrón: confunden correlación con causa, ignoran que una maceta no es un suelo (volumen pequeño, sin lavado natural de sales, sin drenaje lateral) y tratan el síntoma sin diagnosticar la causa.

**Criterio operativo del agente:**

1. El agente **no afirma nada que no pueda respaldar con una fuente citada** en este documento o en el resto de la base de conocimiento. Si no hay fuente, dice que no hay evidencia y ofrece la alternativa segura.
2. Si el usuario pregunta por uno de estos consejos, el agente **no se limita a decir "es un mito"**: explica en una frase por qué, indica el riesgo real para la planta y propone la alternativa correcta y verificada.
3. Cuando un mito tiene respaldo científico **parcial** (hielo en *Phalaenopsis*, leche contra oídio, canela, agua oxigenada), el agente lo dice con sus matices y límites, y adopta por defecto la opción más conservadora para la planta.
4. Ante cualquier tratamiento (insecticida, fungicida, "remedio casero"), el agente antepone siempre la corrección cultural (riego, luz, sustrato, drenaje) y, si hace falta un producto, remite a productos autorizados para uso no profesional en España.

**Niveles de confianza usados:** *Alta* = dos o más fuentes prioritarias independientes coinciden; *Media* = una prioritaria, o dos complementarias coherentes; *Baja* = solo complementarias o anecdótico (la app no lo afirma como hecho). *LAGUNA* = no se ha localizado evidencia prioritaria que lo desmonte.

---

## 1. Tabla resumen

| # | Consejo popular | Veredicto (Falso / Peligroso / Inútil / Matizado) | Riesgo para la planta | Qué decir en su lugar | Confianza | Fuentes |
|---|---|---|---|---|---|---|
| 1 | Regar orquídeas con cubitos de hielo | Matizado | Bajo en *Phalaenopsis* en corteza; frío en raíces aéreas/hojas; riego insuficiente si se aplica mecánicamente | Agua a temperatura ambiente hasta que drene; si se usa hielo, solo *Phalaenopsis* en corteza, sin tocar hojas ni raíces aéreas | Alta (estudio) / Media (riesgo) | [F1][F2][F3] |
| 2 | Cáscaras de huevo como abono de calcio | Inútil | Ninguno directo; falsa sensación de haber abonado | Al compost; en maceta, abono completo equilibrado | Alta | [F7][F8][F9][F10] |
| 3 | Posos de café para acidificar o abonar | Falso (pH) / Peligroso (capa) | Costra que repele agua, compactación, fitotoxicidad en algunas especies | Nada de posos en maceta; al compost (≤20 % del volumen) | Alta | [F8][F10][F11][F12] |
| 4 | Pulverizar las hojas "para dar humedad" | Inútil / Peligroso | Efecto de minutos; hoja mojada favorece hongos | Humidificador, agrupar plantas, bandeja con grava sin que la maceta toque el agua | Alta | [F13][F14][F15]; véase también productos.md fila 5 [P174][P175][P159][P158][C34] |
| 5 | Grava, piedras o cascotes en el fondo "para drenar" | Falso / Peligroso | Capa freática colgada: la zona saturada sube y las raíces se asfixian | Maceta con agujero, sustrato poroso de arriba abajo, malla sobre el agujero | Alta | [F17][F18][F19][F20][F22]; véase también plagas-enfermedades.md §16 [E26]; productos.md fila 1 [P6][P185][P186][P187][P192][P195] |
| 6 | Regar por calendario fijo ("cada 7 días") | Peligroso | Exceso de riego (causa nº 1 de muerte) o sequía según estación | Regar cuando el sustrato lo pida (dedo, peso de la maceta) | Alta | [F16][F21][F23] |
| 7 | Leche en las hojas contra el oídio | Matizado | Olor, hongos saprofitos visibles; sin evidencia en ornamentales | Mejorar ventilación y luz; fungicida autorizado si hace falta | Alta (evidencia limitada a cucurbitáceas) | [F24]; véase también plagas-enfermedades.md §16 [E10][E50][R53][R37] |
| 8 | Abrillantar hojas con aceite, mayonesa, cerveza o leche | Peligroso | Película que atrapa polvo y puede obstruir estomas | Paño húmedo con agua; ducha tibia | Baja / LAGUNA | — |
| 9 | Sales de Epsom "para todo" | Matizado / Peligroso | Acumulación de sales en maceta, quemadura foliar, bloqueo de Ca | Solo con deficiencia de Mg confirmada; abono completo con Mg | Alta | [F25][F26][F10] |
| 10 | Agua con azúcar / Coca-Cola "porque las plantas comen azúcar" | Falso / Peligroso | Deshidratación osmótica, proliferación microbiana, pudrición | Agua limpia; luz adecuada; abono equilibrado | Baja (solo complementarias) | [C4][C5] |
| 11 | Canela como fungicida | Matizado / LAGUNA | Puede quemar tejido; retrasa la corrección real (sustrato encharcado) | Quitar sustrato encharcado, cortar raíz podrida, sustrato nuevo y ventilación | Media | [F29][C6][C8]; véase también plagas-enfermedades.md §16 [E36][R52] |
| 12 | Agua oxigenada para "oxigenar raíces" o curar pudrición | Matizado / Peligroso | Fitotoxicidad (menos raíces, menos crecimiento) a dosis caseras; no resuelve la causa | Sacar la planta, eliminar raíces podridas, sustrato nuevo, regar menos | Media | [F27][F28]; véase también plagas-enfermedades.md §16 [E40][E26][E18][R37][R50][C03][C07][C11] |
| 13 | Lavavajillas o jabón de fregar como insecticida | Peligroso | Disuelve la cutícula cerosa, quema foliar; eficacia imprevisible | Jabón potásico (sales potásicas de ácidos grasos) autorizado, al 1–2 %, probado en una hoja | Alta | [F30][F31][F32][F33][F34][F35]; véase también plagas-enfermedades.md §16 [R41][R43][R42][P31][M02]; productos.md fila 10 [P114][P110][P78] |
| 14 | Hoja amarilla = falta de agua, regar más | Falso / Peligroso | Si la causa es exceso, regar más remata la planta | Comprobar sustrato y raíces antes de regar | Alta | [F16][F21][F23] |
| 15 | Maceta más grande = crece más | Falso / Peligroso | Sustrato que no seca, pudrición radicular | Subir solo 2–5 cm de diámetro (una talla) | Alta | [F22][F40][F43]; véase también productos.md fila 29 [P186][P194][P199][P185] |
| 16 | Las plantas purifican el aire de casa de forma relevante | Falso (exagerado) | Ninguno para la planta; expectativa falsa del usuario | Ventilar; las plantas aportan bienestar y humedad, no depuran el aire doméstico | Alta | [F4][F5][F6] |
| 17 | Arena para mejorar el drenaje | Falso / Peligroso | Mezcla más densa, menos aire | Perlita, pómez o corteza; sustrato comercial para interior | Media / Alta (alternativa) | [F58][F18][F16] |
| 18 | El agua del grifo mata las plantas / hay que dejarla reposar 24 h | Matizado | Cloro se va, cloramina no; flúor y sodio (descalcificador) sí dañan especies sensibles | Agua del grifo vale para la mayoría; agua de lluvia/osmosis para *Dracaena*, *Chlorophytum*, *Calathea*, *Maranta*; nunca agua descalcificada | Alta | [F16][F21][F37][F38][F39][F23]; véase también productos.md fila 3 [P209][P214][P215][P216] y fila 23 [P48][P226][P224]; dracaena-sanderiana.json, lagunas[6] [F9] |
| 19 | Cortar las puntas marrones cura la planta | Falso (cosmético) | Ninguno si se corta bien; oculta la causa | Diagnosticar (sales, sequía, flúor, humedad); recortar solo por estética | Alta | [F37][F38] |
| 20 | Poner la planta débil al sol directo "para que se recupere" | Peligroso | Quemaduras y blanqueado foliar irreversibles | Cambios de luz graduales (1–2 semanas); sombra luminosa primero | Alta | [F16][F49][F53] |
| 21 | Trasplantar nada más comprar / trasplantar en invierno | Peligroso | Doble estrés; sustrato frío y húmedo que no seca | Esperar a que se adapte; trasplantar en primavera-inicio de verano; no trasplantar plantas enfermas | Alta | [F16][F22][F42] |
| 22 | Abonar una planta enferma para fortalecerla | Peligroso | Quemadura de raíces, sales; agrava el problema | Diagnosticar y corregir luz/riego; abonar solo con crecimiento activo | Alta | [F16][F44][F45][F46][F36] |
| 23 | Regar siempre por inmersión y nunca por arriba | Matizado | Sales que no se lavan y se acumulan en superficie | Alternar; regar por arriba hasta drenar; lixiviar cada 4–6 meses | Alta | [F16][F23][F44] |
| 24 | Agua de plátano / té de cáscara como potasio | Inútil | Plagas (mosquitos del sustrato), olor, bloqueo de N; sin dosis conocida | Abono completo; cáscaras al compost | Media | [F10][C9] |
| 25 | Hablar o poner música a las plantas | Inútil (inocuo) | Ninguno | No hay evidencia; es inocuo; lo que ayuda es mirarlas a menudo | Baja / LAGUNA | [C11] |
| 26 | Vinagre para acidificar el sustrato | Inútil / Peligroso | Quemadura; efecto efímero | Sustrato ácido (turba/fibra), azufre elemental en jardín, abono para acidófilas | Media | [F8][F10][F32] |
| 27 | Ceniza de chimenea como abono | Peligroso | Sube el pH, aporta sales y posibles metales; clorosis en acidófilas | Nunca en macetas ni en acidófilas; solo en jardín con análisis previo | Alta | [F56][F57] |
| 28 | Tierra de jardín en macetas | Peligroso | Compactación, mal drenaje, patógenos y plagas | Sustrato comercial para interior (turba/fibra + perlita) | Alta | [F54][F16][F41] |
| 29 | Dejar el plato siempre con agua "como reserva" | Peligroso | Raíces asfixiadas, pudrición | Vaciar el plato a los 15–60 min | Alta | [F16][F15][F21] |
| 30 | "Las suculentas no necesitan agua" | Matizado | Deshidratación crónica o, al contrario, pudrición por regar como al resto | Empapar y dejar secar del todo; mucho menos en invierno; nunca dejar que se arruguen | Alta | [F55][F16][F21] |
| 31 | "Las plantas de sombra viven sin luz" | Falso | Etiolación, caída de hojas, muerte lenta | Mínimo ≈50–100 fc (lux ≈ 540–1.080); lámpara si no hay ventana | Alta | [F49][F50][F51][F52][F16] |
| 32 | Piedras decorativas cubriendo el sustrato | Peligroso (leve) | Impide comprobar la humedad y ver el sustrato | Sustrato a la vista o cubierta que se retire para comprobar | Media (derivada) | [F21][F23] |
| 33 | Cubrir la planta con plástico "para que no se seque" | Matizado | Hoja permanentemente mojada: enfermedades | Solo temporal y ventilado (aclimatación, esquejes), nunca permanente | Media | [F55][F15][C3] |
| 34 | Infusión de tabaco / nicotina como insecticida | Peligroso (y no autorizado) | Tóxico para personas y mascotas; sin dosis; virus del mosaico | Jabón potásico autorizado; nunca remedios con tabaco | Media | [F59][F32] |
| 35 | Ajo, guindilla y otros "sprays caseros" | Matizado / LAGUNA | Quemadura foliar con aceites; eficacia no demostrada en interior | Revisión cultural; producto autorizado si hay plaga confirmada | Media | [F32][F33] |
| 36 | Bicarbonato contra el oídio | Matizado | Sal que quema hojas y se acumula; solo funciona con aceite y preventivamente | Ventilar, no mojar hojas; fungicida autorizado | Media | [F10]; véase también plagas-enfermedades.md §16 [E50][E10][R37][R32] y [E10][E50][E02][M07] |

---

## 2. Detalle por mito

### 2.1 Regar orquídeas con cubitos de hielo

**Qué dice el mito.** "Pon tres cubitos de hielo a la semana sobre el sustrato y la orquídea estará perfectamente regada." Procede de una marca comercial estadounidense y se ha extendido a todas las orquídeas.

**Qué dice la evidencia.** Un ensayo de la Ohio State University y la University of Georgia publicado en *HortScience* (2017) comparó 48 *Phalaenopsis* (24 por tratamiento y localidad, 4 cultivares) regadas con tres cubitos semanales frente al mismo volumen de agua a temperatura ambiente durante 4–6 meses. No hubo diferencias en longevidad floral, vida de exposición, clorofila, eficiencia del fotosistema II ni peso seco de hojas y raíces; el sustrato de corteza bajó a 11–13 °C y volvió a 21 °C en unas cinco horas; las raíces en contacto directo con el hielo bajaron a ≈4 °C, y segmentos de raíz aislados no se dañaron hasta ≈−7 °C (Alta) [F1][F2]. Los propios autores limitan la conclusión a *Phalaenopsis* en corteza, recomiendan que el hielo no toque las hojas y advierten de que la cantidad debe ajustarse a cultivar, luz, temperatura y humedad (Alta) [F1]. En cambio, el servicio de extensión (Ask Extension) recomienda agua templada (>10 °C) y advierte de que colocar hielo sobre raíces expuestas de epífitas "puede acabar causando daño" (Media) [F3].

**Riesgo real.** Bajo si se hace exactamente como en el estudio (*Phalaenopsis*, corteza, hielo sobre el sustrato). El riesgo aparece al generalizar: otras orquídeas y tropicales sensibles al frío, hielo tocando hojas o raíces aéreas, y sobre todo riego insuficiente cuando "tres cubitos" se aplica mecánicamente a macetas grandes o ambientes secos.

**Alternativa correcta.** Regar con agua a temperatura ambiente hasta que drene, vaciar el cubremacetas, y leer las raíces: verdes = hidratadas, plateadas = secas, marrones = muertas; hojas arrugadas = falta de agua [F1]. Si el usuario insiste en el hielo: solo *Phalaenopsis* en corteza, sin contacto con hojas ni raíces aéreas, ajustando la cantidad.

**Confianza y fuentes.** El dato "no daña a *Phalaenopsis* en corteza": Alta [F1][F2]. La advertencia de frío en raíces expuestas: Media [F3]. CONTRADICCIÓN registrada; se adopta la opción conservadora (agua a temperatura ambiente por defecto).

### 2.2 Cáscaras de huevo como abono de calcio

**Mito.** "Tritura cáscaras de huevo y mézclalas con la tierra: aportan calcio."

**Evidencia.** La cáscara es carbonato cálcico, pero se descompone muy lentamente: Illinois Extension cita de uno a cinco años para que se degraden y señala que el calcio no queda disponible en un plazo útil (Alta) [F8][F9]; los Master Gardeners de UC (Sonoma) indican hasta cinco años y que haría falta una gran cantidad para notar algo (Alta) [F10]; NC State recuerda que la podredumbre apical del tomate, para la que suele recomendarse, se debe casi siempre a riego irregular y no a falta de calcio en el suelo (Alta) [F7].

**Riesgo real.** Ninguno directo para la planta, salvo que el usuario crea que ya ha abonado y no aporte un fertilizante completo; en maceta, fragmentos grandes solo decoran.

**Alternativa.** Cáscaras al compost [F8][F10]; en interior, abono completo equilibrado a media dosis durante el crecimiento activo.

**Confianza:** Alta [F7][F8][F9][F10].

### 2.3 Posos de café para acidificar o abonar

**Mito.** "Los posos acidifican la tierra y aportan nitrógeno; son ideales para plantas ácidas."

**Evidencia.** Los posos usados tienen pH casi neutro (6,5–6,8 según Oregon State) y cualquier cambio de pH es temporal; contienen 1–2 % de N pero su descomposición inmoviliza nitrógeno de forma transitoria y los residuos de cafeína pueden inhibir germinación y crecimiento (Alta) [F11]. Chalker-Scott (WSU) revisó la literatura: el pH de posos en descomposición oscila entre 4,6 y 8,4 según el estudio; los posos inhibieron el crecimiento de ornamentales como *Tradescantia albiflora*, geranio y esparraguera; son finos, se compactan y forman una barrera al agua y al aire, por lo que desaconseja usarlos puros como acolchado (capa ≤1,3 cm y cubierta por mulch grueso) y limita su proporción en compost al 20 % (Alta) [F12]. Illinois Extension (2025) y UC Sonoma coinciden: no bajan el pH de forma útil y una capa gruesa forma una costra hidrófoba; para acidificar, el azufre elemental es la opción eficaz y barata (Alta) [F8][F10].

**Riesgo real.** En maceta, donde el volumen es pequeño, la costra de posos repele el agua (riego que escurre por los bordes), compacta la superficie, puede enmohecerse y liberar compuestos fitotóxicos sobre raíces superficiales.

**Alternativa.** Nada de posos en macetas de interior. Para acidófilas (gardenia, azalea), sustrato ácido a base de turba/fibra y abono específico; los posos, al compost y en proporción ≤20 % del volumen [F11][F12].

**Confianza:** Alta [F8][F10][F11][F12].

### 2.4 Pulverizar las hojas "para dar humedad"

**Mito.** "Vaporiza las hojas a diario: la planta tropical necesita humedad."

**Evidencia.** Iowa State: pulverizar "no es una forma eficaz de elevar la humedad relativa"; el follaje se seca en minutos y habría que hacerlo varias veces al día (Alta) [F13]. Penn State: la subida de humedad dura hasta que el agua se evapora, cuestión de minutos, "de modo que incluso pulverizar a diario no hace nada por elevar la humedad" alrededor de la planta (Alta) [F14]. Nebraska: para subir la humedad habría que pulverizar cada pocos minutos; además, la hoja permanentemente mojada favorece manchas foliares y "las superficies frías y húmedas durante la noche son un entorno ideal para la infección" (Alta) [F15]. CONTRADICCIÓN: la guía general de Missouri (G6510) afirma que pulverizar a diario "puede ayudar a la planta a superar el estrés de baja humedad" [F16]; se adopta la posición conservadora de Iowa/Penn State/Nebraska porque el beneficio es efímero y el riesgo fúngico está documentado.

**Riesgo real.** Hongos foliares y pudriciones en hojas aterciopeladas (begonia rex, violeta africana, calatea), y falsa sensación de haber "regado".

**Alternativa.** Humidificador (lo más eficaz) [F13][F14]; agrupar plantas; bandeja con grava y agua **sin que la maceta toque el agua** [F13][F15]; para plantas exigentes, cocina o baño luminosos [F16]. Si se pulveriza para limpiar polvo, hacerlo por la mañana y con ventilación [F15].

**Confianza:** Alta [F13][F14][F15]. Nota: el efecto de la bandeja con grava es discutido (Iowa y Nebraska lo consideran útil localmente; Penn State dice que el impacto en la habitación es casi nulo) [F13][F14][F15]: el agente la presenta como ayuda modesta y local, no como solución.

### 2.5 Grava, piedras o cascotes en el fondo "para drenar"

**Mito.** "Pon una capa de grava o trozos de maceta en el fondo para que el agua drene mejor."

**Evidencia.** Chalker-Scott (WSU): hace casi cien años la edafología demostró que el agua no pasa fácilmente de un material fino a otro más grueso; el agua gravitacional no cruza la interfaz hasta que el sustrato fino está saturado, de modo que la capa de drenaje "induce precisamente el estado que pretende evitar" (Alta) [F17]. UC Master Gardeners (Santa Clara): toda maceta regada tiene una zona saturada en la base; la grava no la elimina, la sube y reduce la profundidad útil para las raíces (Alta) [F18]. Penn State: los estudios muestran que el material grueso dificulta el movimiento del agua y además resta volumen (Alta) [F19]. Illinois y Clemson lo clasifican como mito y recomiendan solo una malla, filtro de café o un fragmento sobre el agujero (Alta) [F20][F22][F40]. Un blog complementario cita un estudio de 2025 que midió menos agua retenida con capas de arena de 60 mm en mezclas muy porosas, sin medir crecimiento ni capa freática [C7]; es una fuente complementaria y no altera la recomendación.

**Riesgo real.** Zona encharcada justo donde están las raíces, asfixia y pudrición; en macetas pequeñas, la grava resta hasta un tercio del volumen.

**Alternativa.** Maceta con agujero de drenaje (obligatorio), sustrato poroso homogéneo de arriba abajo, malla o filtro sobre el agujero; si se quiere más drenaje, mezclar perlita, pómez o corteza en **todo** el sustrato, no en capas [F18][F22].

**Confianza:** Alta [F17][F18][F19][F20][F22].

### 2.6 Regar por calendario fijo

**Mito.** "Riega cada 7 días" (o cada 3, o cada 15).

**Evidencia.** Clemson: el exceso de riego es la primera causa de pérdida de plantas en maceta; no existe un calendario fijo porque la frecuencia depende de especie, fase de crecimiento, ubicación, tipo y tamaño de maceta, sustrato y clima (Alta) [F21]. Missouri: "ningún calendario general sirve para todas las plantas de interior"; nunca regar una planta que no lo necesita (Alta) [F16]. Maryland: no regar según calendario sino según necesidad, comprobando con el dedo unos 5 cm y por el peso de la maceta (Alta) [F23].

**Riesgo real.** En invierno (menos luz, menos consumo) un calendario de verano encharca; en verano o con calefacción, puede quedarse corto.

**Alternativa.** Regar cuando la capa superior del sustrato esté seca (dedo hasta la primera falange, peso de la maceta, color del sustrato), a fondo hasta que drene, y vaciar el plato [F16][F21][F23]. Los medidores de humedad varían en precisión y los afectan las sales [F21].

**Confianza:** Alta [F16][F21][F23].

### 2.7 Leche en las hojas contra el oídio

**Mito.** "Pulveriza leche diluida: cura el oídio y da brillo."

**Evidencia.** Chalker-Scott (WSU) revisó los ensayos: la leche al 10–50 % redujo el oídio en calabacín en invernadero (Brasil, 1999) y en otras cucurbitáceas, pumpkin y trigo, con resultados mejores en invernadero que en campo y mayor eficacia aplicada **antes** de la infección; "no hay estudios científicos publicados en rosas ni en ninguna otra ornamental"; inconvenientes documentados: olor al degradarse la grasa, crecimiento de hongos saprofitos antiestéticos sobre la hoja, y la leche en polvo desnatada indujo podredumbres y *Alternaria* en crucíferas (Alta por el documento de revisión; la evidencia subyacente es de cultivos hortícolas) [F24].

**Riesgo real.** En interior, con poca ventilación, la película láctea se descompone, huele y alimenta hongos; no sustituye a eliminar la causa (aire estancado, hojas mojadas).

**Alternativa.** Separar la planta, mejorar ventilación y luz, no mojar el follaje, retirar hojas muy afectadas; si hace falta un fungicida, producto autorizado para uso no profesional. Para abrillantar, véase 2.8.

**Confianza:** Alta en cuanto a "sin evidencia en ornamentales y con inconvenientes" [F24]; el agente no lo recomienda para plantas de interior.

### 2.8 Abrillantar hojas con aceite, mayonesa, cerveza o leche

**Mito.** "Un poco de aceite o mayonesa en un paño deja las hojas brillantes y protegidas."

**Evidencia.** No se ha localizado ninguna fuente prioritaria que haya evaluado estos productos (LAGUNA). Tampoco existe evidencia de beneficio alguno. Las fuentes complementarias coinciden en que las películas grasas atrapan polvo y pueden bloquear estomas, pero es razonamiento, no ensayo.

**Riesgo real.** Película que retiene polvo y suciedad, que puede dificultar el intercambio gaseoso y que, en hojas aterciopeladas, provoca manchas y pudriciones; además enmascara el estado real de la planta.

**Alternativa.** Limpiar el polvo con un paño suave humedecido en agua (sin aditivos), sosteniendo la hoja por debajo, o ducha tibia en plantas robustas; brocha suave en cactus y hojas pilosas. Una hoja sana y limpia ya brilla.

**Confianza:** Baja / LAGUNA. El agente **no recomienda** estos productos porque no hay evidencia de beneficio y sí riesgo plausible; lo formula como "no está demostrado y puede ensuciar/dañar".

### 2.9 Sales de Epsom "para todo"

**Mito.** "Una cucharada de sales de Epsom en el riego hace la planta más frondosa, más verde y florece más."

**Evidencia.** Chalker-Scott (WSU) revisó decenas de estudios: el sulfato de magnesio solo mejora plantas con **deficiencia de Mg** en cultivos intensivos; no hay evidencia de que haga plantas "más frondosas", ni de que induzca floración (un estudio en orquídeas no encontró efecto), ni de efecto insecticida o repelente; las pulverizaciones foliares causan quemaduras; y, específicamente para plantas de interior, "los nutrientes en exceso se acumulan en la maceta (no pueden lixiviarse) y pueden causar daños salinos en las hojas" (Alta) [F25]. NC State (2025): en macetas pequeñas y sin suelo, el exceso de magnesio produce toxicidad; muchos abonos de interior ya llevan Mg y S; es más fácil corregir una carencia que una toxicidad (Alta) [F26]. UC Sonoma: añadir Epsom a un suelo con Mg suficiente perjudica al inhibir la absorción de calcio (Alta) [F10].

**Riesgo real.** Sales acumuladas, puntas quemadas, bloqueo de calcio, y tiempo perdido sin diagnosticar la causa real (luz, riego).

**Alternativa.** Solo si hay clorosis internerval en hojas viejas **y** el abono habitual no aporta Mg; dosis mínima (NC State sugiere ≈1 cucharadita en una maceta de ~11 L) y lixiviar después [F26]. Por defecto, abono completo con micronutrientes.

**Confianza:** Alta [F10][F25][F26]. Nota: una guía de Nebraska sugiere lavar las macetas con 1 cucharadita de Epsom por galón [F55]; se registra como CONTRADICCIÓN menor y el agente recomienda lixiviar con agua limpia [F23][F44].

### 2.10 Agua con azúcar / Coca-Cola

**Mito.** "Las plantas comen azúcar: un poco de azúcar o refresco en el riego las revive."

**Evidencia.** Solo fuentes complementarias: Larry Hodgson explica que los azúcares del refresco son demasiado complejos para absorberse por raíz, que el azúcar en el sustrato extrae agua de las raíces por ósmosis y alimenta microbios, muchos de ellos causantes de pudrición [C4]; Robert Pavlis cita ensayos universitarios en maíz, soja y rábano sin ningún beneficio y describe el mismo efecto osmótico; el único uso con respaldo es el conservante de flores cortadas (~2 % de azúcar, con biocida) [C5]. No se ha localizado una fuente prioritaria que lo evalúe directamente (Baja).

**Riesgo real.** Deshidratación osmótica, explosión de bacterias y hongos en el sustrato, mosquitos del sustrato, pudrición.

**Alternativa.** Agua limpia; si la planta "no tira", revisar luz y riego antes que nutrición; abono equilibrado solo en crecimiento.

**Confianza:** Baja (la app no lo afirma como hecho, pero sí aplica la regla "nunca recomendar azúcar": no hay evidencia de beneficio y el riesgo es plausible).

### 2.11 Canela como fungicida

**Mito.** "Espolvorea canela en el corte o en el sustrato: es un fungicida natural que cura la pudrición."

**Evidencia.** Un estudio revisado por pares (El-Mougy y Abdel-Kader, *Journal of Plant Protection Research*, 2007) encontró que el polvo de *Cinnamomum burmannii* al 8 % en medio de cultivo inhibía por completo *Fusarium solani*, *Rhizoctonia solani*, *Alternaria solani* y *Macrophomina phaseolina*, y que como recubrimiento de semilla (5 g/kg) redujo el damping-off de haba en suelo infestado del 20–26 % al 8–12 %, igual que un fungicida comercial (Media: una fuente prioritaria, en condiciones muy distintas de una maceta de interior) [F29]. Las fuentes complementarias señalan que la especie de canela vendida al público es desconocida, que la mayoría de ensayos usan extractos o aceites esenciales y no polvo espolvoreado, y que no hay ningún ensayo que demuestre que la canela cure una raíz ya podrida [C6]; una educadora de extensión jubilada (UNR) advierte de que puede quemar tejido y de que no debe inhalarse [C8].

**Riesgo real.** El riesgo no es la canela en sí: es que el usuario la espolvoree y **no** haga lo único que funciona (sacar la planta del sustrato encharcado y cortar lo podrido). Sobre hojas puede quemar.

**Alternativa.** Pudrición = problema de agua y oxígeno: desenmacetar, eliminar raíces blandas y marrones con herramienta limpia, dejar secar, sustrato nuevo y poroso, maceta con agujero, regar menos. La canela, si acaso, como secante en el corte de un esqueje, nunca como "tratamiento".

**Confianza:** Media; se marca LAGUNA para su uso en plantas de interior.

### 2.12 Agua oxigenada en el riego

**Mito.** "Riega con agua oxigenada para oxigenar las raíces y curar la pudrición."

**Evidencia.** En un ensayo revisado por pares (2022) con brotes de ginseng, 300 mg/L de H₂O₂ redujeron la incidencia de pudrición radicular del 87,2 % al 72,1 % pero redujeron la biomasa aérea un 35 % y retrasaron la emergencia; los autores concluyen que aumentar dosis o tiempo no es viable por la fitotoxicidad (Media) [F27]. Wageningen (2024) probó dosis continua de 30 mg/L de peróxido estabilizado en *Phalaenopsis* comercial: sin efecto significativo en el cultivo, no evitó pérdidas por enfermedad, ligeramente menos puntas de raíz y cutícula foliar algo más fina (Media) [F28]. El agua oxigenada de farmacia (3 % = 30.000 mg/L) diluida "a ojo" supera con facilidad esas concentraciones. Existe además un ensayo específico de inmersión de raíces de *Phalaenopsis* en H₂O₂ (HortTechnology, 2021) que no pudo abrirse durante esta revisión y no se incorpora como fuente.

**Riesgo real.** Daño a raíces finas y a la microbiota del sustrato; no aporta oxígeno útil de forma sostenida; no sustituye a retirar las raíces podridas y corregir el riego.

**Alternativa.** La de 2.11: desenmacetar, cortar, sustrato nuevo, menos riego, más luz y aire. No se recomiendan baños de H₂O₂.

**Confianza:** Media [F27][F28]; el agente lo desaconseja por precaución.

### 2.13 Lavavajillas o jabón de fregar como insecticida

**Mito.** "Unas gotas de lavavajillas en agua matan pulgón, cochinilla y araña roja."

**Evidencia.** Iowa State: el lavavajillas es un **detergente** derivado de petroquímicos, no un jabón; su efecto sobre insectos es limitado e inconsistente y es mucho más probable que cause fitotoxicidad; el jabón insecticida verdadero son sales potásicas de ácidos grasos (Alta) [F30]. Kansas State: los productos domésticos no están registrados como insecticidas, se desconoce tipo y longitud de cadena de los ácidos grasos, llevan colorantes y perfumes, precipitan en agua dura, disuelven la cutícula cerosa (más en hojas pilosas) y no hay recurso si dañan la planta; los jabones insecticidas registrados se usan al 1–2 % (Alta) [F31]. UF/IFAS: los detergentes arrancan la cutícula que protege de la pérdida de agua y de patógenos; los jabones con hidróxido sódico dañan tejidos (los insecticidas usan hidróxido potásico); vinagre y alcohol son fitotóxicos; "evitar recetas caseras" (Alta) [F32]. NC State y LSU: 1–2 % (2,5–5 cucharadas por galón ≈ 10–20 ml/L), probar en una zona 24 h antes, no aplicar con calor >29–32 °C ni a plantas con estrés hídrico, plantas sensibles (hojas pilosas, gardenia, capuchina), sin efecto residual, repetir si hace falta (Alta) [F33][F34].

**Situación en España.** La ficha técnica de la Junta de Andalucía confirma que el jabón potásico (sales potásicas de ácidos grasos, CAS 67701-09-1) es sustancia activa aprobada en la UE, autorizada en producción ecológica como insecticida/acaricida, y que en el Registro de productos fitosanitarios del MAPA existen productos comerciales a base de sales potásicas de ácidos grasos; los productos deben estar autorizados conforme al Reglamento (CE) 1107/2009 y usarse según las condiciones de su autorización (Alta como fuente oficial) [F35]. El agente debe indicar al usuario que compre un producto con número de registro y autorización para uso no profesional (jardinería doméstica) y siga la etiqueta.

**Riesgo real.** Quemadura foliar (bordes secos y crujientes), pérdida de cera, hojas "lavadas" más vulnerables; eficacia nula o parcial que deja crecer la plaga.

**Alternativa.** Retirar mecánicamente (agua a presión, bastoncillo con alcohol en cochinilla puntual), aislar la planta, y jabón potásico registrado al 1–2 %, mojando bien el insecto, por la tarde, probando antes en una hoja [F31][F33].

**Confianza:** Alta [F30][F31][F32][F33][F34][F35].

### 2.14 Hoja amarilla = falta de agua, regar más

**Mito.** "Si amarillea, tiene sed."

**Evidencia.** Clemson: el exceso de riego es la primera causa de muerte; exceso y defecto producen síntomas parecidos; una planta con raíces podridas se marchita porque no puede absorber agua, y regarla "puede empeorar el problema" (Alta) [F21]. Missouri: "las hojas inferiores amarillean y caen al tocarlas" se debe normalmente a exceso de riego; amarilleo a distintos niveles: exceso de riego, mal drenaje, sustrato compacto, frío (Alta) [F16]. Maryland: las plantas sobrerregadas pierden hojas o amarillean; exceso y defecto causan la mayoría de las pérdidas (Alta) [F23].

**Riesgo real.** Regar "por si acaso" una planta encharcada es la vía más rápida a la pudrición radicular.

**Alternativa.** Antes de regar: meter el dedo, levantar la maceta, mirar si el sustrato está oscuro y pegajoso, comprobar el agujero y el plato; si hay duda, sacar el cepellón y mirar las raíces (blancas = sanas; marrones y blandas = podridas) [F16][F21]. Amarilleo con sustrato seco y ligero sí es sed.

**Confianza:** Alta [F16][F21][F23].

### 2.15 Maceta más grande = crece más

**Mito.** "Ponla en una maceta grande y así no hay que trasplantar en años."

**Evidencia.** Clemson: elegir una maceta 2,5–5 cm más ancha que la actual (Alta) [F22]. Illinois: unos 5 cm más de diámetro; "un volumen de sustrato excesivamente grande puede provocar pudrición radicular porque la planta no puede usar el agua disponible" (Alta) [F40]. Montana State: regla práctica, un tercio más ancha y profunda, y no "demasiado grande" (Alta) [F43].

**Riesgo real.** El sustrato que las raíces no ocupan permanece húmedo semanas, se vuelve anaerobio y pudre las raíces mientras la parte aérea aún parece sana.

**Alternativa.** Una talla (2–5 cm de diámetro), maceta con agujero, sustrato nuevo; trasplantar cuando haya señales de cepellón lleno (raíces por el agujero, se seca muy rápido) [F22][F40].

**Confianza:** Alta [F22][F40][F43].

### 2.16 Las plantas purifican el aire de casa

**Mito.** "Un potus o una sansevieria limpian el aire de formaldehído y benceno; la NASA lo demostró."

**Evidencia.** El informe de la NASA (Wolverton et al., 1989) evaluó hojas, raíces, sustrato y microbios para reducir contaminantes y proponía un filtro híbrido plantas + carbón activo (Alta como fuente del origen del mito) [F6]; según Drexel, esos ensayos se hicieron en cámaras selladas de laboratorio que no se parecen a una vivienda [F4]. Cummings y Waring (*J. Exposure Science & Environmental Epidemiology*, 2019/2020) reanalizaron 196 resultados de 12 estudios de cámara: la tasa de aire limpio (CADR) mediana por planta fue de 0,023 m³/h, y para igualar la renovación normal de aire de un edificio (≈1 h⁻¹) harían falta entre 10 y 1.000 plantas por m² de suelo (Alta) [F4][F5].

**Riesgo real.** Ninguno para la planta; el riesgo es para el usuario (falsa seguridad) y para la credibilidad del agente.

**Alternativa.** Ventilar; las plantas aportan bienestar, humedad y decoración; algunas incluso emiten COV propios [F5].

**Confianza:** Alta [F4][F5][F6].

### 2.17 Arena para mejorar el drenaje

**Mito.** "Mezcla arena con la tierra para que drene."

**Evidencia.** Arkansas Extension: haría falta que la arena fuese ≈50 % o más del volumen; con menos, la arcilla rellena los huecos entre granos y actúa como "pegamento", produciendo un suelo más denso (comparación con el hormigón) (Media: una prioritaria sobre suelo de jardín) [F58]. Missouri: evitar añadir tierra a un sustrato de maceta porque lleva a mal drenaje, exceso de riego y enfermedades radiculares (Alta) [F16]. UC Santa Clara: para drenar mejor, mezclar perlita, lava triturada o pómez en todo el sustrato (Alta) [F18].

**Riesgo real.** Mezcla más pesada y menos aireada; con turba, se compacta y seca en bloque.

**Alternativa.** Sustrato comercial de interior (turba o fibra de coco + perlita); para suculentas, mezclas específicas o perlita/pómez al 30–50 %; arena solo gruesa, lavada y en pequeña proporción en mezclas de cactus (Missouri sugiere partes iguales de sustrato y arena estéril para cactus) [F16][F18].

**Confianza:** Media para "la arena empeora"; Alta para la alternativa.

### 2.18 El agua del grifo mata las plantas / reposar 24 h por el cloro

**Mito.** "Nunca riegues con agua del grifo" o, al contrario, "déjala reposar 24 h y ya no tiene nada malo".

**Evidencia.** Missouri (G6510): el agua corriente es normalmente satisfactoria y "el cloro y el flúor añadidos al agua urbana no dañan a las plantas"; el agua descalcificada no debe usarse de forma continuada [F16]. Sin embargo, el servicio IPM de la misma universidad documenta la toxicidad por flúor con necrosis apical en liliáceas sensibles y *Dracaena*, advierte de que la perlita contiene fluoruros y recomienda para especies sensibles sustrato sin perlita y agua de lluvia o destilada; también prohíbe el agua de descalcificador (añade sodio/potasio y cloruro) (Alta) [F37]. Iowa State: cloro y flúor pueden causar puntas marrones en *Chlorophytum*, *Dracaena* y *Calathea* a largo plazo (Alta) [F38]. EPA: las cloraminas son más estables que el cloro, "no se disipan rápidamente al reposar" y la ebullición no las elimina (Alta) [F39]. Maryland: dejar reposar el agua un día ayuda con el cloro; evitar agua descalcificada; el agua de lluvia o del deshumidificador es buena opción (Alta) [F23]. Clemson: evitar agua descalcificada (sodio y cloruro) (Alta) [F21]. CONTRADICCIÓN registrada (Missouri G6510 vs Missouri IPM/Iowa); se adopta la opción conservadora para la planta: el flúor sí importa en especies sensibles.

**Riesgo real.** Para la mayoría de plantas, ninguno. Para *Dracaena*, *Cordyline*, *Chlorophytum*, *Calathea*, *Maranta*, *Spathiphyllum* y carnívoras: puntas y bordes necróticos acumulativos. El agua de descalcificador doméstico es el verdadero peligro (sodio).

**Alternativa.** Agua del grifo a temperatura ambiente para la generalidad; agua de lluvia, osmosis o del deshumidificador para sensibles; nunca agua descalcificada; dejar reposar solo sirve para el cloro libre, no para cloramina, flúor ni sales [F23][F37][F39]. Consultar el informe de calidad del suministrador local para saber qué desinfectante usa.

**Confianza:** Alta [F16][F21][F23][F37][F38][F39].

### 2.19 Cortar las puntas marrones cura la planta

**Mito.** "Corta lo marrón y la planta se recupera."

**Evidencia.** Iowa State: recortar las partes marrones "puede mejorar el aspecto", pero "volverá a aparecer si no se corrige la causa": baja humedad, dejar secar demasiado entre riegos, exceso de abono, cloro/flúor (Alta) [F38]. Missouri IPM: una vez muerta la punta no se recupera; se puede recortar, pero lo práctico es prevenir (sales, sequía del sustrato, agua descalcificada, flúor) (Alta) [F37].

**Riesgo real.** Ninguno si se corta con tijera limpia dejando un milímetro de tejido seco (cortar en verde abre una nueva herida que vuelve a secarse); el riesgo es no diagnosticar.

**Alternativa.** Diagnóstico por descarte: costra blanca o anillo en la maceta → sales (lixiviar con 2× el volumen de la maceta) [F23][F44]; sustrato que se seca del todo → riego irregular; especie sensible + agua de grifo → flúor; ambiente seco → humidificador. Recorte solo estético.

**Confianza:** Alta [F37][F38].

### 2.20 Poner la planta débil al sol directo "para que se recupere"

**Mito.** "Está mustia, ponla al sol para que coja fuerza."

**Evidencia.** Missouri: "mover bruscamente una planta a una luz más intensa —sobre todo sol directo— produce blanqueado o quemadura del follaje; cualquier cambio de iluminación debe hacerse gradualmente"; al sacarlas en verano, una semana en sitio resguardado y nublado antes de exponerlas más (Alta) [F16]. Missouri (G6515): las plantas que no necesitan luz intensa pueden quemarse en ventanas al sur de finales de primavera a principios de otoño (Alta) [F49]. Purdue: incluso las plantas de pleno sol en interior no deben recibir fuera más de media mañana de sol; la sobreexposición vuelve las hojas amarillas o blancas y luego marrones (Alta) [F53].

**Riesgo real.** Quemaduras irreversibles en hojas ya estresadas; en una planta con raíces dañadas, el sol directo acelera la deshidratación.

**Alternativa.** Primero diagnosticar (raíces, riego, plaga). Después, si falta luz, acercarla a una ventana luminosa sin sol directo y aumentar la exposición en 1–2 semanas; en Madrid, sol directo de tarde tras un cristal en verano quema a la mayoría de tropicales [F16][F49][F53].

**Confianza:** Alta [F16][F49][F53].

### 2.21 Trasplantar nada más comprar / trasplantar en invierno

**Mito.** "Lo primero al llegar a casa es cambiarle la tierra" o "da igual cuándo trasplantar".

**Evidencia.** Missouri: las plantas recién traídas del invernadero "rara vez necesitan trasplante inmediato"; deben adaptarse al nuevo ambiente y trasplantar de inmediato "añade tensión"; además, vienen bien abonadas y no necesitan fertilizante durante semanas (Alta) [F16]. Clemson: trasplantar en primavera o verano con crecimiento activo; "no trasplantar plantas enfermas, en reposo o que empiezan a florecer" (Alta) [F22]. Illinois: trasplantar durante el crecimiento activo, normalmente primavera o principios de verano (Alta) [F42]. Penn State: primavera, con un sustrato sin suelo (Alta) [F41]. Montana State propone finales de invierno/inicio de primavera y "en cualquier momento si hay señales de estrés" [F43]: CONTRADICCIÓN menor; se adopta la pauta conservadora (crecimiento activo, no plantas enfermas). Complementaria: cuarentena de ~40 días y trasplantar solo si no hay agujero de drenaje, se seca en dos días o hay varias plantas compitiendo [C3].

**Riesgo real.** Doble estrés (transporte + trasplante), raíces rotas sin capacidad de regenerar en invierno, sustrato nuevo frío y húmedo que no seca.

**Alternativa.** Al comprar: aislar 3–6 semanas, revisar plagas, comprobar que la maceta tiene agujero y sacar el cepellón solo para mirar raíces; trasplantar en primavera-principios de verano a una talla más. Excepciones justificadas: maceta sin drenaje, sustrato podrido o raíces negras (entonces el "trasplante" es un rescate, no una mejora).

**Confianza:** Alta [F16][F22][F41][F42].

### 2.22 Abonar una planta enferma para fortalecerla

**Mito.** "Está débil: dale abono."

**Evidencia.** Missouri: "no use fertilizante para estimular el crecimiento de una planta en malas condiciones; la falta de crecimiento se debe más a menudo a luz o riego inadecuados; en esos casos, añadir fertilizante puede causar daño adicional"; nunca abono líquido a una planta marchita; las raíces de maceta se queman fácilmente (Alta) [F16]. Nebraska: no abonar plantas recién trasplantadas, en reposo o marchitas; el exceso de sales daña raíces y favorece la pudrición (Alta) [F44]. UNH: "menos suele ser más"; el abono solo puede no revivir una planta que decae (Alta) [F45]. WSU: no abonar plantas estresadas por calor o sequía; quemadura por fertilizante = puntas marrones, marchitez, costra blanca (Alta) [F46]. Missouri IPM: abonar en invierno para "forzar" crecimiento es contraproducente (Alta) [F36].

**Riesgo real.** Sales en un sustrato que la planta no puede procesar: quemadura radicular, más marchitez, y el usuario "abona más".

**Alternativa.** Diagnosticar (luz, riego, raíces, plagas) y corregir; abonar solo con hojas nuevas, a media dosis, cada 2–4 semanas en primavera-verano, nada en otoño-invierno; lixiviar cada 4–6 meses [F44][F45].

**Confianza:** Alta [F16][F36][F44][F45][F46].

### 2.23 Regar siempre por inmersión y nunca por arriba

**Mito.** "El riego por abajo es el único correcto; por arriba se pudre."

**Evidencia.** Missouri: ambos métodos son válidos; "si se riega regularmente por abajo pueden formarse sales blancas en la superficie; un riego ocasional por arriba ayuda a lavarlas"; no dejar que el sustrato reabsorba el agua de lavado (Alta) [F16]. Maryland: regar por arriba hasta que salga por el agujero lava las sales; lixiviar cada 4–6 meses con al menos 2× el volumen de la maceta, antes de abonar; vaciar el plato (Alta) [F23]. Nebraska: lixiviar cada 4–6 meses con el doble del volumen (≈10 tazas para una maceta de 15 cm), tras retirar la costra (Alta) [F44]. NMSU sostiene que empapar por inmersión y luego drenar lava más sales que el riego por arriba [F48]: CONTRADICCIÓN; se adopta la posición mayoritaria (alternar y lixiviar por arriba).

**Riesgo real.** Acumulación de sales (costra blanca, puntas marrones, raíces dañadas) y, si la planta se deja en el agua, asfixia.

**Alternativa.** Inmersión 15–30 min cuando el sustrato está muy seco o es hidrófobo [F21], riego por arriba habitual hasta drenar, lixiviado periódico y plato vacío.

**Confianza:** Alta [F16][F23][F44].

### 2.24 Agua de plátano / té de cáscara de plátano como potasio

**Mito.** "Deja cáscaras en agua unos días y riega: es un abono rico en potasio."

**Evidencia.** UC Sonoma: las cáscaras contienen potasio, pero tardan mucho en descomponerse y liberarlo, su descomposición consume nitrógeno (menos disponible para la planta) y atraen plagas; mejor al compost (Media: una prioritaria, sobre cáscaras en el suelo) [F10]. Complementaria: la mayor parte del potasio permanece en la cáscara tras semanas de remojo, no hay estudios que midan lo que recibe la planta, los restos atraen mosquitos del sustrato y pueden arrastrar residuos de pesticida [C9].

**Riesgo real.** Mosquitos del sustrato, olor, fermentación, dosis desconocida; en maceta, materia orgánica en descomposición sobre un sustrato que ya está húmedo.

**Alternativa.** Abono completo soluble a media dosis; cáscaras al compost o a la basura orgánica.

**Confianza:** Media [F10][C9].

### 2.25 Hablar o poner música a las plantas

**Mito.** "Si les hablas crecen mejor."

**Evidencia.** No se ha localizado ninguna fuente prioritaria. La única referencia abierta (complementaria) describe experimentos sin resultados publicados y lo cataloga como anécdota [C11]. El conocido "experimento de la RHS" con tomates y voces fue un evento divulgativo, no un ensayo replicado (no se ha podido abrir la fuente original: LAGUNA).

**Riesgo real.** Ninguno.

**Alternativa.** Decirlo con honestidad: no hay evidencia, pero es inocuo; el beneficio real es que quien habla a sus plantas las observa a diario y detecta antes sed, plagas y falta de luz.

**Confianza:** Baja / LAGUNA (la app lo trata como "sin evidencia, inocuo").

### 2.26 Vinagre para acidificar

**Mito.** "Unas gotas de vinagre en el riego para las plantas ácidas."

**Evidencia.** Illinois: el vinagre doméstico es ≈5 % de ácido acético; el herbicida es 10–20 % y por encima del 11 % causa lesiones oculares y quemaduras; para bajar el pH, el azufre elemental es más seguro y barato (Media) [F8]. UC Sonoma: el vinagre es cáustico, mata el follaje de malas hierbas jóvenes y no las raíces (Media) [F10]. UF/IFAS: "el vinagre y el alcohol son fitotóxicos y causan quemadura foliar" (Media) [F32]. No se ha localizado una fuente prioritaria que mida la duración del efecto acidificante en sustrato (razonablemente breve, por el poder tampón del sustrato).

**Riesgo real.** Quemadura de raíces finas y hojas si salpica; sin control de dosis ni de pH.

**Alternativa.** Para acidófilas en maceta: sustrato ácido (turba/fibra, ≥50 % orgánico según Missouri [F16]), abono para acidófilas y agua de lluvia; en jardín, azufre elemental con análisis previo [F8].

**Confianza:** Media.

### 2.27 Ceniza de chimenea como abono

**Mito.** "La ceniza es potasio gratis: échala a las macetas."

**Evidencia.** Wisconsin: la ceniza de madera es un agente de encalado (≈la mitad de la capacidad neutralizante de la cal agrícola), con ≥20 % de calcio y hasta 5 % de potasio; puede contener cadmio y plomo; evitar en acidófilas (arándano, azalea, rododendro) y en plantas que prefieren suelo algo ácido (Alta) [F56]. Purdue: "la ceniza de madera nunca debe usarse en plantas acidófilas"; a pH alto el potasio y otros nutrientes se vuelven menos disponibles; aplicaciones repetidas sin análisis pueden inutilizar un huerto (Alta) [F57]. Ninguna de las dos trata macetas de interior: en un volumen pequeño y sin lavado, el efecto alcalinizante y salino es necesariamente mayor (inferencia del redactor).

**Riesgo real.** pH disparado, clorosis férrica, sales, metales; irreversible en maceta sin cambiar el sustrato.

**Alternativa.** Nunca en macetas; en jardín, solo con análisis de pH y a dosis bajas [F56][F57].

**Confianza:** Alta para el efecto; la extrapolación a macetas es inferencia prudente.

### 2.28 Tierra de jardín en macetas

**Mito.** "La tierra del jardín o del parque sirve para la maceta."

**Evidencia.** Iowa State: "la tierra de jardín por sí sola no es un buen medio de cultivo; se compacta en el contenedor, con mal drenaje y aireación", y se separa de las paredes al secarse (Alta) [F54]. Missouri: evitar añadir suelo al sustrato porque "a menudo lleva a mal drenaje, exceso de riego y enfermedades radiculares"; si se usa, esterilizarlo (Alta) [F16]. Penn State: usar sustrato sin suelo; la tierra de jardín puede introducir enfermedades y plagas en casa (Alta) [F41].

**Riesgo real.** Compactación, encharcamiento, larvas, hongos de suelo, malas hierbas.

**Alternativa.** Sustrato comercial para interior; mezcla tipo 3 partes de turba/fibra + 1 de vermiculita + 1 de perlita [F16].

**Confianza:** Alta [F16][F41][F54].

### 2.29 Dejar el plato siempre con agua

**Mito.** "Le dejo el plato lleno para que beba cuando quiera."

**Evidencia.** Missouri: "nunca permitir que permanezcan en agua durante largos periodos"; desechar el agua del plato una hora después de regar; "pies mojados" = hojas amarillas, flores que colapsan, raíces marrones (Alta) [F16]. Nebraska: "la planta nunca debe estar en agua", lleva a sustrato empapado y pudrición (Alta) [F15]. Clemson y Maryland: vaciar el plato tras regar (Alta) [F21][F23].

**Riesgo real.** Zona radicular permanentemente anóxica: pudrición segura en semanas.

**Alternativa.** Plato vacío a los 15–60 min; si se quiere reserva, mecha o maceta autorriego con cámara separada; bandeja de grava solo con la maceta por encima del agua [F13][F15].

**Confianza:** Alta [F15][F16][F21][F23].

### 2.30 "Las suculentas no necesitan agua"

**Mito.** "Un cactus se riega una vez al mes como mucho, llueva o truene."

**Evidencia.** Clemson: las suculentas necesitan menos agua que las plantas de hoja fina, pero la frecuencia depende de luz, temperatura y maceta (Alta) [F21]. Missouri: cactus y crasas, régimen "empapar y dejar secar bastante antes de volver a regar", pero "no permitir que la planta se marchite" (Alta) [F16]. Nebraska: en invierno, mucha menos agua (menos luz y temperatura), comprobar los 2–3 cm superiores, regar a fondo hasta drenar, mantener cactus a 13–16 °C y nunca por debajo de 7 °C (Alta) [F55].

**Riesgo real.** Doble: regarlas como a una tropical (pudrición, la causa más frecuente) o no regarlas nunca (arrugas, pérdida de raíces finas, planta que no absorbe cuando por fin se riega).

**Alternativa.** Sustrato muy drenante, maceta con agujero, luz intensa; regar a fondo cuando el sustrato esté totalmente seco (en Madrid, semanal-quincenal en verano con luz alta; cada 3–6 semanas en invierno, según temperatura), y no regar con frío y poca luz [F16][F55].

**Confianza:** Alta [F16][F21][F55].

### 2.31 "Las plantas de sombra viven sin luz"

**Mito.** "El potus/la zamioculca vive en el pasillo sin ventana."

**Evidencia.** Missouri (G6515): las plantas de "poca luz" necesitan en general 50–250 foot-candles (≈540–2.700 lux); unas pocas pueden *mantenerse* bajo luz artificial a 10 fc; la falta de luz es el factor limitante más frecuente en casa; síntomas: entrenudos largos, hojas pequeñas y pálidas, hojas inferiores amarillas; incluso las de poca luz no reciben suficiente a más de 3 m de una ventana media (Alta) [F49]. Penn State: línea base de poca luz ≈100 fc; una sansevieria a 25 fc empezó a arrugar hojas (Alta) [F50]. Illinois: ejemplo de poca luz ≈75 fc, a unos pasos de una ventana norte (Alta) [F51]. UF/IFAS: categoría baja 25–100 fc; la mayoría de plantas toleran un rango estrecho (Alta) [F52]. Missouri (G6510): "solo unas pocas plantas toleran interiores poco iluminados"; "los efectos de la luz insuficiente no se curan con más abono, agua ni trasplante" (Alta) [F16].

**Riesgo real.** Declive lento (meses), etiolación, sustrato que no seca → el usuario riega igual → pudrición.

**Alternativa.** Medir (app de luxómetro orientativa): objetivo ≥50–100 fc (≈540–1.080 lux) a mediodía para las más tolerantes; si no, lámpara LED de espectro completo 12–16 h/día a 15–30 cm [F49]. Rotar plantas entre sitio decorativo y sitio luminoso.

**Confianza:** Alta [F16][F49][F50][F51][F52].

### 2.32 Piedras decorativas cubriendo el sustrato

**Mito.** "Cubre la tierra con piedras blancas: queda bonito y evita mosquitos."

**Evidencia.** No se ha localizado una fuente prioritaria que evalúe las cubiertas decorativas en interior (LAGUNA). La objeción se deriva de reglas de confianza Alta: la decisión de regar debe tomarse comprobando el sustrato con el dedo y observando su color y peso [F21][F23][F16], cosa imposible bajo una capa de piedras pegadas o un pie de bolas de arcilla.

**Riesgo real.** Riego a ciegas (exceso o defecto), costra de sales invisible, pudrición no detectada.

**Alternativa.** Sustrato visible, o cubierta suelta que se aparte para comprobar; para mosquitos del sustrato, dejar secar la capa superior y trampas amarillas.

**Confianza:** Media (derivada de fuentes Alta).

### 2.33 Cubrir la planta con plástico "para que no se seque"

**Mito.** "Una bolsa de plástico y ya tiene su invernadero."

**Evidencia.** Nebraska: una campana de cristal mantiene alta la humedad en plantas delicadas (uso puntual) (Media) [F55]; pero la misma extensión advierte de que la hoja constantemente mojada favorece enfermedades foliares (Alta) [F15]. Complementaria: bolsa transparente útil unas semanas para aclimatar ficus o crotones que pierden hojas, y para cuarentena, nunca al sol (Baja) [C3].

**Riesgo real.** Condensación permanente, hongos, sobrecalentamiento al sol.

**Alternativa.** Uso temporal (esquejes, aclimatación, 1–3 semanas), con ventilación diaria y fuera del sol directo; para humedad estable, humidificador.

**Confianza:** Media.

### 2.34 Infusión de tabaco / nicotina como insecticida

**Mito.** "Macera tabaco en agua y pulveriza: mata todo."

**Evidencia.** La base de datos PPDB de la Universidad de Hertfordshire registra la nornicotina (alcaloide del tabaco emparentado con la nicotina) como **no aprobada** en la UE bajo el Reglamento 1107/2009, retirada en 2009, clase Ia de la OMS (extremadamente peligrosa), neurotóxica y catalogada como plaguicida altamente peligroso (Media) [F59]. La propia nicotina tampoco está autorizada como fitosanitario en la UE, pero su ficha no pudo abrirse en esta revisión (LAGUNA parcial). UF/IFAS: evitar recetas caseras, de composición y dosis imprevisibles (Alta) [F32].

**Riesgo real.** Toxicidad aguda para personas, niños y mascotas por contacto e inhalación; dosis incontrolable; preparado no autorizado; posible transmisión de virus del mosaico del tabaco a solanáceas.

**Alternativa.** Jabón potásico registrado para uso no profesional; aceites hortícolas autorizados; aislamiento de la planta.

**Confianza:** Media; el agente lo prohíbe de forma absoluta por riesgo para personas.

### 2.35 Ajo, guindilla y otros "sprays caseros"

**Mito.** "Ajo y guindilla triturados en agua: insecticida natural."

**Evidencia.** No se ha localizado una fuente prioritaria que evalúe estos preparados en plantas de interior (LAGUNA). UF/IFAS desaconseja las recetas caseras por imprevisibles y señala que vinagre y alcohol queman hojas [F32]; NC State advierte de que cualquier spray con aceites o jabón quema con sol y calor y debe probarse 24 h antes (Media) [F33].

**Riesgo real.** Quemadura foliar (aceites + sol), olor, ineficacia que deja prosperar la plaga.

**Alternativa.** Identificar la plaga, retirar mecánicamente, aislar, y producto autorizado si persiste.

**Confianza:** Media (regla general) / LAGUNA (eficacia).

### 2.36 Bicarbonato contra el oídio

**Mito.** "Bicarbonato y agua curan el oídio."

**Evidencia.** UC Sonoma: el bicarbonato sódico se recomienda desde 1924; mezclado con aceite y agua puede ser eficaz si se aplica al primer síntoma, "sin aceite no funciona"; es una sal, las aplicaciones repetidas queman el follaje y añaden sodio al sustrato; "hay tratamientos mucho mejores y más seguros" (Media) [F10].

**Riesgo real.** En maceta, el sodio acumulado no se lava; quemadura foliar.

**Alternativa.** Ventilación, luz, no mojar hojas; fungicida autorizado si hace falta.

**Confianza:** Media.

---

## 3. Reglas derivadas para el agente

Reglas duras ("nunca X sin Y") extraídas de las secciones anteriores. Cada regla cita las fuentes que la sustentan.

1. **Nunca recomendar regar** sin pedir antes al usuario que compruebe el sustrato (dedo, peso, color) y el plato; nunca dar un calendario fijo como norma [F16][F21][F23].
2. **Nunca atribuir una hoja amarilla a "sed"** sin descartar exceso de riego, drenaje y raíces; ante la duda, no regar [F16][F21][F23].
3. **Nunca recomendar capa de grava, cascotes o arcilla en el fondo**; sí agujero de drenaje, sustrato poroso homogéneo y malla sobre el agujero [F17][F18][F19][F20][F22].
4. **Nunca recomendar tierra de jardín, arena fina ni ceniza en macetas**; sí sustrato comercial de interior con perlita/pómez [F16][F18][F54][F56][F57][F58].
5. **Nunca recomendar una maceta más de una talla mayor (2–5 cm de diámetro)** [F22][F40][F43].
6. **Nunca recomendar trasplantar una planta enferma, en reposo invernal o recién comprada**, salvo rescate por pudrición o maceta sin drenaje [F16][F22][F41][F42].
7. **Nunca recomendar abonar una planta enferma, marchita, en reposo o recién trasplantada**; abonar solo con crecimiento activo y a media dosis [F16][F36][F44][F45][F46].
8. **Nunca recomendar sales de Epsom** sin deficiencia de magnesio confirmada y sin comprobar que el abono habitual no la aporta ya [F10][F25][F26].
9. **Nunca presentar la pulverización foliar como método de humedad**; sí humidificador, agrupación y bandeja de grava con la maceta fuera del agua [F13][F14][F15].
10. **Nunca recomendar dejar la maceta en un plato con agua** [F15][F16][F21][F23].
11. **Nunca recomendar lavavajillas, detergentes, tabaco, vinagre, alcohol pulverizado, azúcar o refrescos** sobre o en la planta; sí jabón potásico registrado (1–2 %), probado en una hoja, aplicado sin sol ni calor [F30][F31][F32][F33][F34][F35][F59]. Única excepción (C365): bastoncillo con alcohol ≤70 % aplicado sobre cada cochinilla, como limpieza mecánica puntual y con prueba previa en una hoja (UC IPM y Iowa State: `plagas-enfermedades.md` [R38][R49][C01]).
12. **Nunca recomendar un producto fitosanitario sin indicar que debe estar registrado y autorizado para uso no profesional en España y aplicarse según etiqueta** [F35].
13. **Nunca recomendar canela, agua oxigenada o leche como "tratamiento" de pudrición u oídio**; la única corrección de una pudrición es sacar la planta, cortar raíces podridas, sustrato nuevo y menos riego; la leche solo tiene evidencia en cucurbitáceas y con inconvenientes [F24][F27][F28][F29].
14. **Nunca recomendar hielo como método general de riego**; solo mencionarlo como opción tolerada por *Phalaenopsis* en corteza, sin contacto con hojas ni raíces aéreas, y por defecto agua a temperatura ambiente [F1][F2][F3].
15. **Nunca afirmar que el agua del grifo "mata" ni que "no afecta a nada"**: agua del grifo a temperatura ambiente para la generalidad; agua de lluvia/osmosis para *Dracaena*, *Chlorophytum*, *Calathea*, *Maranta*, *Spathiphyllum*; nunca agua de descalcificador; reposar el agua no elimina cloramina ni flúor [F16][F21][F23][F37][F38][F39].
16. **Nunca presentar el corte de puntas marrones como cura**; siempre con diagnóstico de la causa (sales, sequía, flúor, humedad) [F37][F38].
17. **Nunca recomendar mover una planta a sol directo sin aclimatación gradual** (1–2 semanas, sombra luminosa primero) [F16][F49][F53].
18. **Nunca decir que una planta "vive sin luz"**: mínimo orientativo 50–100 fc (≈540–1.080 lux) y lámpara si no hay ventana [F16][F49][F50][F51][F52].
19. **Nunca afirmar que las plantas purifican el aire de la vivienda**; sí bienestar y humedad [F4][F5][F6].
20. **Nunca recomendar posos de café, cáscaras de huevo, agua de plátano ni bicarbonato en macetas**; redirigir al compost o al abono completo [F7][F8][F9][F10][F11][F12].
21. **Nunca presentar el riego por inmersión como método exclusivo**; alternar con riego por arriba hasta drenar y lixiviar cada 4–6 meses con 2× el volumen de la maceta [F16][F23][F44].
22. **Nunca recomendar abrillantadores, aceites o mayonesa en hojas**; limpieza solo con agua y paño (sin evidencia de beneficio, riesgo plausible).
23. **Nunca recomendar cubrir la planta con plástico de forma permanente**; uso temporal y ventilado [F15][F55].
24. **Nunca presentar un consejo con confianza Baja o LAGUNA como hecho**; el agente debe decir "no hay evidencia" y ofrecer la alternativa segura (hablar a las plantas, sprays de ajo/guindilla, abrillantadores, azúcar).
25. **Cuando dos fuentes prioritarias se contradigan** (hielo, pulverización, flúor, inmersión, época de trasplante), el agente adopta la opción que menos riesgo supone para la planta y lo explica.

---

## Fuentes

Todas las URL fueron abiertas con éxito el 2026-10-20. Los PDF se descargaron y se leyeron íntegros. Tipo: prioritaria (universidades, servicios de extensión, organismos oficiales, revistas revisadas por pares) / complementaria (blogs especializados, prensa, viveros).

| ID | URL | Institución | Tipo (prioritaria/complementaria) | Fecha de consulta |
|---|---|---|---|---|
| F1 | https://u.osu.edu/greenhouse/category/postharvest | The Ohio State University (K. South, M. Jones) — riego de *Phalaenopsis* con hielo | prioritaria | 2026-10-20 |
| F2 | https://ashs.confex.com/ashs/2017/webprogramarchives/Paper26192.html | American Society for Horticultural Science — resumen del estudio Ohio State/Univ. Georgia (HortScience 2017) | prioritaria | 2026-10-20 |
| F3 | https://ask.extension.org/kb/faq.php?id=923897 | Ask Extension (Cooperative Extension, EE. UU.) — hielo en orquídeas | prioritaria | 2026-10-20 |
| F4 | https://drexel.edu/engineering/news-events/news/archive/2019/november/potted-plants-dont-improve-air-quality | Drexel University — nota sobre Cummings & Waring | prioritaria | 2026-10-20 |
| F5 | https://www.nature.com/articles/s41370-019-0175-9 | *Journal of Exposure Science & Environmental Epidemiology* (Cummings & Waring, 2019/2020) — abierta vía redirección de cookies | prioritaria | 2026-10-20 |
| F6 | https://ntrs.nasa.gov/citations/19930073077 | NASA (Wolverton, Johnson y Bounds, 1989) | prioritaria | 2026-10-20 |
| F7 | https://chowan.ces.ncsu.edu/news/gardening-mythbusters-eggshells-for-calcium/ | NC State Extension — cáscaras de huevo | prioritaria | 2026-10-20 |
| F8 | https://extension.illinois.edu/blogs/over-garden-fence/2025-03-31-garden-mythbusters-dos-and-donts-natural-remedies | University of Illinois Extension — cáscaras, vinagre, posos | prioritaria | 2026-10-20 |
| F9 | https://extension.illinois.edu/blogs/flowers-fruits-and-frass/2020-08-28-landscaping-fiction-part-2-eggshells-railroad-ties-and | University of Illinois Extension — cáscaras | prioritaria | 2026-10-20 |
| F10 | https://ucanr.edu/sites/default/files/2026-06/PD-06-13-26-Debunk-garden-myths.pdf | UC ANR — UC Master Gardeners de Sonoma (posos, cáscaras, vinagre, plátano, bicarbonato, Epsom) | prioritaria | 2026-10-20 |
| F11 | https://extension.oregonstate.edu/gardening/soil-compost/coffee-grounds-composting | Oregon State University Extension — posos de café | prioritaria | 2026-10-20 |
| F12 | https://wpcdn.web.wsu.edu/wp-puyallup/uploads/sites/403/2015/03/coffee-grounds.pdf | Washington State University — L. Chalker-Scott, "Coffee grounds — will they perk up plants?" | prioritaria | 2026-10-20 |
| F13 | https://yardandgarden.extension.iastate.edu/faq/air-our-home-extremely-dry-winter-should-i-mist-houseplants | Iowa State University Extension — pulverización | prioritaria | 2026-10-20 |
| F14 | https://extension.psu.edu/humidity-and-houseplants | Penn State Extension — humedad | prioritaria | 2026-10-20 |
| F15 | https://lancaster.unl.edu/houseplants-humidity | University of Nebraska–Lincoln Extension — humedad | prioritaria | 2026-10-20 |
| F16 | https://uvm.edu/d10-files/documents/2024-10/Caring_for_Houseplants.pdf | University of Missouri Extension, guía G6510 "Caring for Houseplants" (PDF alojado por Univ. of Vermont) | prioritaria | 2026-10-20 |
| F17 | https://wpcdn.web.wsu.edu/wp-puyallup/uploads/sites/403/2015/03/container-drainage.pdf | Washington State University — L. Chalker-Scott, "The Myth of Drainage Material in Container Plantings" | prioritaria | 2026-10-20 |
| F18 | https://ucanr.edu/site/uc-master-gardeners-santa-clara-county/drainage-containers | UC ANR — UC Master Gardeners de Santa Clara — drenaje en macetas | prioritaria | 2026-10-20 |
| F19 | https://extension.psu.edu/debunking-garden-myths | Penn State Extension — mitos (grava, pesticidas "orgánicos") | prioritaria | 2026-10-20 |
| F20 | https://extension.illinois.edu/blogs/good-growing/2017-02-23-busting-more-garden-myths | University of Illinois Extension — grava | prioritaria | 2026-10-20 |
| F21 | https://hgic.clemson.edu/factsheet/indoor-plants-watering/ | Clemson University HGIC — riego de plantas de interior | prioritaria | 2026-10-20 |
| F22 | https://hgic.clemson.edu/factsheet/indoor-plants-transplanting-repotting/ | Clemson University HGIC — trasplante | prioritaria | 2026-10-20 |
| F23 | https://www.extension.umd.edu/resource/watering-indoor-plants | University of Maryland Extension — riego | prioritaria | 2026-10-20 |
| F24 | https://wpcdn.web.wsu.edu/wp-puyallup/uploads/sites/403/2015/03/milk-and-roses.pdf | Washington State University — L. Chalker-Scott, "The Myth of Milk and Roses" | prioritaria | 2026-10-20 |
| F25 | https://wpcdn.web.wsu.edu/wp-puyallup/uploads/sites/403/2015/03/epsom-salts.pdf | Washington State University — L. Chalker-Scott, "Epsom salts: miracle, myth… or marketing" | prioritaria | 2026-10-20 |
| F26 | https://lee.ces.ncsu.edu/2025/01/not-a-silver-or-well-magnesium-bullet-how-to-use-epsom-salts-the-most-effective-way/ | NC State Extension — sales de Epsom | prioritaria | 2026-10-20 |
| F27 | https://koreascience.or.kr/article/JAKO202210872001773.pdf | *Research in Plant Disease* 28(4), 2022 (Song, Ahn, Jung) — H₂O₂ y pudrición radicular | prioritaria | 2026-10-20 |
| F28 | https://research.wur.nl/en/publications/pilot-h2o2-in-phalaenopsis-effect-van-doseren-gestabiliseerde-h2o/ | Wageningen University & Research (WPR-1299, 2024) — H₂O₂ en *Phalaenopsis* | prioritaria | 2026-10-20 |
| F29 | https://czasopisma.pan.pl//Content/118476/PDF/267-278_Antifungal%20effect%20of.pdf | *Journal of Plant Protection Research* 47(3), 2007 (El-Mougy & Abdel-Kader) — especias y damping-off | prioritaria | 2026-10-20 |
| F30 | https://yardandgarden.extension.iastate.edu/faq/can-i-use-dish-soap-instead-insecticidal-soap-treat-insect-pests | Iowa State University Extension — lavavajillas vs jabón insecticida | prioritaria | 2026-10-20 |
| F31 | https://www.k-state.edu/news/kansasbugs/articles/2020/06/fundamentals-of-using-soaps-as-insecticides.html | Kansas State University (R. Cloyd) — jabones insecticidas | prioritaria | 2026-10-20 |
| F32 | https://gardeningsolutions.ifas.ufl.edu/care/pests-and-diseases/pests/soaps-detergents-and-pest-management/ | UF/IFAS Gardening Solutions — jabones y detergentes | prioritaria | 2026-10-20 |
| F33 | https://caswell.ces.ncsu.edu/news/insecticidal-soaps-for-garden-pest-control/ | NC State Extension — jabones insecticidas | prioritaria | 2026-10-20 |
| F34 | https://www.lsuagcenter.com/profiles/aiverson/articles/page1548277100581 | LSU AgCenter — jabón insecticida | prioritaria | 2026-10-20 |
| F35 | https://www.juntadeandalucia.es/export/drupaljda/DECO21_210914_Ficha_T%C3%A9c_sobre_acidos_grasos_PE_ver0.pdf | Junta de Andalucía (Consejería de Agricultura) — ficha técnica ácidos grasos / jabón potásico, registro MAPA | prioritaria | 2026-10-20 |
| F36 | https://ipm.missouri.edu/meg/2019/1/houseplantProblems/index.cfm | University of Missouri IPM — problemas de plantas de interior | prioritaria | 2026-10-20 |
| F37 | https://ipm.missouri.edu/meg/2021/1/leafTipburn-DT | University of Missouri IPM — necrosis apical (sales, flúor, agua descalcificada) | prioritaria | 2026-10-20 |
| F38 | https://yardandgarden.extension.iastate.edu/faq/why-does-my-houseplant-have-brown-leaf-tips-and-edges | Iowa State University Extension — puntas marrones | prioritaria | 2026-10-20 |
| F39 | https://19january2017snapshot.epa.gov/www3/region9/water/chloramine.html | US EPA (Región 9) — cloraminas en agua potable | prioritaria | 2026-10-20 |
| F40 | https://extension.illinois.edu/blogs/good-growing/2018-03-19-tips-repotting-houseplants | University of Illinois Extension — trasplante (tamaño, grava) | prioritaria | 2026-10-20 |
| F41 | https://extension.psu.edu/repotting-houseplants | Penn State Extension — trasplante | prioritaria | 2026-10-20 |
| F42 | https://extension.illinois.edu/houseplants/repotting | University of Illinois Extension — cuándo trasplantar | prioritaria | 2026-10-20 |
| F43 | https://montana.edu/extension/lila_extn/askstewardrepothouseplant.html | Montana State University Extension — trasplante | prioritaria | 2026-10-20 |
| F44 | https://lancaster.unl.edu/success-houseplants-fertilization | University of Nebraska–Lincoln Extension — abonado y sales | prioritaria | 2026-10-20 |
| F45 | https://extension.unh.edu/blog/2018/03/fertilizing-houseplants | University of New Hampshire Extension — abonado | prioritaria | 2026-10-20 |
| F46 | https://hortsense.cahnrs.wsu.edu/?p=4755 | Washington State University Hortsense — quemadura por fertilizante | prioritaria | 2026-10-20 |
| F48 | https://swyg.nmsu.edu/2008/101108.html | New Mexico State University Extension — riego por abajo y sales | prioritaria | 2026-10-20 |
| F49 | https://uthort.tennessee.edu/wp-content/uploads/sites/228/2023/11/g06515%20Lighting%20Indoor%20Houseplants.pdf | University of Missouri Extension, guía G6515 "Lighting Indoor Houseplants" (PDF alojado por Univ. of Tennessee) | prioritaria | 2026-10-20 |
| F50 | https://extension.psu.edu/low-light-houseplants | Penn State Extension — plantas de poca luz | prioritaria | 2026-10-20 |
| F51 | https://extension.illinois.edu/houseplants/lighting | University of Illinois Extension — luz | prioritaria | 2026-10-20 |
| F52 | https://gardeningsolutions.ifas.ufl.edu/plants/houseplants/light-for-houseplants/ | UF/IFAS Gardening Solutions — luz | prioritaria | 2026-10-20 |
| F53 | https://www.purdue.edu/hla/sites/yardandgarden/summer-houseplant-care/ | Purdue University Extension — plantas de interior en verano | prioritaria | 2026-10-20 |
| F54 | https://yardandgarden.extension.iastate.edu/faq/i-would-grow-few-vegetables-containers-can-i-use-garden-soil-or-should-i-purchase-commercial | Iowa State University Extension — tierra de jardín en macetas | prioritaria | 2026-10-20 |
| F55 | https://water.unl.edu/article/lawns-gardens-landscapes/winter-care-indoor-plants | University of Nebraska–Lincoln Extension — cuidado invernal | prioritaria | 2026-10-20 |
| F56 | https://hort.extension.wisc.edu/articles/using-wood-ash-in-the-home-garden | University of Wisconsin–Madison Extension — ceniza | prioritaria | 2026-10-20 |
| F57 | https://extension.purdue.edu/news/county/whitley/2026/02/using-wood-ash-in-the-garden.html | Purdue University Extension — ceniza | prioritaria | 2026-10-20 |
| F58 | https://uaex.uada.edu/farm-ranch/crops-commercial-horticulture/horticulture/ar-fruit-veg-nut-update-blog/posts/adding-sand-to-soil.aspx | University of Arkansas Extension — arena en suelo arcilloso | prioritaria | 2026-10-20 |
| F59 | https://sitem.herts.ac.uk/aeru/ppdb/en/Reports/2560.htm | University of Hertfordshire — Pesticide Properties Database (nornicotina) | prioritaria (base de datos universitaria) | 2026-10-20 |
| C1 | https://laidbackgardener.blog/2018/01/18/no-need-to-let-chlorine-evaporate/ | Laidback Gardener (L. Hodgson) — cloro/cloramina | complementaria | 2026-10-20 |
| C2 | https://laidbackgardener.blog/2019/12/08/garden-myth-dishwashing-liquid-as-an-insecticide/ | Laidback Gardener — lavavajillas | complementaria | 2026-10-20 |
| C3 | https://laidbackgardener.blog/2021/03/20/10-tips-on-caring-for-a-new-houseplant/ | Laidback Gardener — planta nueva, cuarentena, trasplante | complementaria | 2026-10-20 |
| C4 | https://laidbackgardener.blog/2018/07/14/garden-myth-watering-plants-with-coca-cola-is-good-for-them/ | Laidback Gardener — azúcar/refrescos | complementaria | 2026-10-20 |
| C5 | https://www.gardenmyths.com/sugar-water/ | Garden Myths (R. Pavlis) — agua con azúcar | complementaria | 2026-10-20 |
| C6 | https://www.gardenmyths.com/cinnamon-stop-damping-off-seedlings/ | Garden Myths (R. Pavlis) — canela | complementaria | 2026-10-20 |
| C7 | https://www.gardenmyths.com/gravel-pots-containers-drainage/ | Garden Myths (R. Pavlis) — contraargumento grava | complementaria | 2026-10-20 |
| C8 | https://www.carsonnow.org/07/17/2022/northern-nevada-backyards-and-gardens-cinnamon-pest-repellant-fact-or-fiction | Carson Now (columna de J. Skelly, UNR Extension jubilada) — canela | complementaria | 2026-10-20 |
| C9 | https://www.abc15.com/should-you-feed-banana-water-your-plants-what-know | Scripps News / ABC15 — agua de plátano | complementaria | 2026-10-20 |
| C10 | https://help.costafarms.com/en/knowledge/the-myth-of-misting-indoor-plants- | Costa Farms (vivero) — pulverización | complementaria | 2026-10-20 |
| C11 | https://www.botany.one/facing-the-music/ | Botany One — música y plantas | complementaria | 2026-10-20 |

---

## Fase 5 — Mitos fusionados de diagnóstico, productos y fichas

**Fusión de la Fase 5 (2026-10-22).** Recoge las afirmaciones «que la app no debe decir» que estaban fuera de este documento: la sección 16 de `output/diagnostico/plagas-enfermedades.md` (27 filas), la sección «Lo que la app no debe decir» de `output/logica/productos.md` (33 filas) y las notas de `output/fichas/*.json` que dicen expresamente que algo es un mito o que la app no debe afirmarlo (11 notas). El texto, el veredicto y las fuentes se copian del archivo de origen sin añadir nada. Las fuentes se citan con el id del archivo de origen y el nombre del archivo (la URL completa está en la tabla de fuentes de ese archivo). Los orígenes no tienen columna de riesgo y solo `productos.md` tiene «lo que sí puede decir»; las fichas dan una confianza para el dato de toxicidad, no para la afirmación. Donde el origen no da un dato, la celda dice «— (no indicado en origen)».

**Duplicados (20).** No se repiten aquí; a la fila existente de la tabla 1 se le ha añadido, en la columna de fuentes, la referencia cruzada al origen cuando aporta fuente nueva:

- Con mitos ya existentes (15): bicarbonato solo y bicarbonato + aceite (plagas-enfermedades.md) → nº 36; leche → nº 7; ajo o guindilla como insecticida → nº 35 (sin fuente citable en el origen, no se añade referencia); agua oxigenada → nº 12; canela → nº 11; lavavajillas (plagas-enfermedades.md y productos.md fila 10) → nº 13; grava (plagas-enfermedades.md y productos.md fila 1) → nº 5; pulverizar para dar humedad (productos.md fila 5) → nº 4; reposar el agua del grifo (productos.md fila 3 y `dracaena-sanderiana.json`, lagunas[6]) → nº 18; agua de descalcificador (productos.md fila 23) → nº 18; maceta mucho más grande (productos.md fila 29) → nº 15.
- Entre los dos orígenes nuevos (5), fusionados en una sola fila de esta sección: aceite de neem (productos.md fila 6) → nº 38; trampas amarillas (productos.md fila 13) → nº 42; fungicida sistémico para el oídio (productos.md fila 9) → nº 50; Bt para la mosca del sustrato (productos.md fila 7) → nº 52; piretroides contra araña roja o cochinilla (productos.md fila 11) → nº 53.

**Contradicción entre orígenes (resuelta, C365).** La fila nº 43 (plagas-enfermedades.md: alcohol isopropílico ≤70 % con bastoncillo como limpieza mecánica recomendada por extensión contra cochinilla [R38][R49][C01]) chocaba con la regla 11 de la sección 3 y con la nota de la 2.35 («vinagre y alcohol queman hojas» [F32]). Resolución: se admite solo el bastoncillo sobre el insecto, con prueba previa; el alcohol pulverizado no se recomienda; la regla 11 recoge la excepción. Tensiones ya registradas: bandeja de guijarros (nº 57 frente a la alternativa de la 2.4; contradicciones C13 y M8) y puntas marrones por flúor (nº 67, específica de Madrid, frente al nº 18, general para especies sensibles).

| # | Afirmación que la app no debe hacer | Veredicto (origen) | Por qué (texto del origen) | Qué decir en su lugar | Confianza | Fuentes |
|---|---|---|---|---|---|---|
| 37 | Vinagre, ajo, té de compost como fungicidas | No recomendar | «debunk common home remedies, including milk, vinegar, hydrogen peroxide, compost tea, and garlic»; el vinagre es sustancia básica UE (≤10 %) pero no como herbicida y «only mildly effective on young, tender weeds», «does not kill roots». Relacionado con los nº 26 y 35 | — (no indicado en origen) | — (no indicada en origen) | plagas-enfermedades.md [E10][R37][R52] |
| 38 | Aceite de neem «casero» (aceite + jabón), o aceite de neem vendido como abrillantador/abono usado como insecticida; «El aceite de neem es un insecticida natural legal para plantas de interior» | No recomendar | plagas-enfermedades.md: el «aceite de neem» prensado en frío no es sustancia activa aprobada en la UE (solo lo es la azadiractina); en España no existe ningún producto con azadiractina de uso no profesional (0 resultados en RegFiWeb); usar como insecticida un producto no autorizado contradice el art. 47.1 del RD 1311/2012 y el art. 55 del Reg. 1107/2009. productos.md: el aceite de neem no existe como sustancia activa ni básica en la base de la UE; la azadiractina solo tiene productos de uso profesional en España (filtro no profesional: «No existen resultados»); los productos «directamente vinculados con el control de plagas» no pueden ampararse como OMDF; usar un «abrillantador» o «fertilizante» como insecticida es un uso no autorizado (art. 47.1 RD 1311/2012; art. 55 Reg. 1107/2009); además hay toxicidad felina documentada | «En España (oct. 2026) no hay producto de neem autorizado para aficionados; la opción legal con uso interior es el jabón potásico listo al uso registrado» (productos.md) | — (no indicada en origen) | plagas-enfermedades.md [M19][M20][M01][R01]; productos.md fila 6 [P78][P79][P96][P92][P87][P80][P121] |
| 39 | Posos de café contra plagas | No recomendar | «Coffee grounds do contain nitrogen, but using them straight from your coffee pot can lead to compacted soil»; sin evaluación de efecto contra plagas; solo como abono compostado. Relacionado con el nº 3 | — (no indicado en origen) | — (no indicada en origen) | plagas-enfermedades.md [R52] |
| 40 | Tierra de diatomeas «mata las larvas» de sciáridos | No recomendar como control | Solo «can make it harder for adult gnats to lay eggs»: barrera superficial y en seco; lo decisivo es dejar secar los 2–5 cm superiores | — (no indicado en origen) | — (no indicada en origen) | plagas-enfermedades.md [R51] |
| 41 | Trampas de vinagre para sciáridos | No recomendar | «las trampas de vinagre para moscas de la fruta no sirven para monitorizar sciáridos» | — (no indicado en origen) | — (no indicada en origen) | plagas-enfermedades.md [C11] |
| 42 | Trampas amarillas «controlan» o «eliminan» la mosca blanca o la mosca del sustrato | Matizar: solo monitoreo y captura parcial | plagas-enfermedades.md: «most useful for monitoring and detecting whiteflies rather than controlling them»; «do not control insect pests»; capturan auxiliares; supresión documentada solo en invernadero cerrado. productos.md: «Most useful for monitoring and detecting whiteflies rather than controlling them»; «pueden reducir algo los números pero no eliminarán poblaciones dañinas»; solo capturan adultos, nunca larvas; capturan auxiliares | «Monitoreo y captura parcial de adultos; el control real va al sustrato (secado) o a la planta» (productos.md) | — (no indicada en origen) | plagas-enfermedades.md [P04][P22][C07][M45]; productos.md fila 13 [P107][P104][P51] |
| 43 | Peróxido, alcohol, lejía u otros «plaguicidas» caseros como tratamiento fitosanitario | Matizar | El alcohol isopropílico ≤70 % con bastoncillo, con prueba previa y sin pulverizar (C365), es una limpieza mecánica recomendada por extensión contra cochinilla, no un fitosanitario; la app lo presenta así, solo con bastoncillo y sin pulverizar (resuelto en C365; regla 11 de la sección 3) | — (no indicado en origen) | — (no indicada en origen) | plagas-enfermedades.md [R38][R49][C01] |
| 44 | Productos caseros en general | Postura de la app | «homemade products are not recommended as they are unregulated and usually untested» | — (no indicado en origen) | — (no indicada en origen) | plagas-enfermedades.md [E03][E05][E13] |
| 45 | Fungicidas contra manchas bacterianas o virus | No recomendar | «Fungicides are not effective for controlling diseases caused by viruses or bacteria» | — (no indicado en origen) | — (no indicada en origen) | plagas-enfermedades.md [E06] |
| 46 | Pulverizar más a menudo contra bacterias | No recomendar | «Spraying more often will not reduce disease» | — (no indicado en origen) | — (no indicada en origen) | plagas-enfermedades.md [E37] |
| 47 | Fungicidas para pudrición radicular en casa | No recomendar | «We DO NOT recommend use of chemical fungicides»; «probably cost more than a new plant» | — (no indicado en origen) | — (no indicada en origen) | plagas-enfermedades.md [E26][E01] |
| 48 | Nebulizar hojas «para prevenir» plagas o enfermedades | No recomendar como prevención general | Favorece manchas foliares y botritis: «Do not mist leaves»; «wet leaves (usually from misting or watering)»; para araña roja la humedad ayuda «but will not, on its own control this mite» y puede favorecer enfermedades foliares. Relacionado con el nº 4 | — (no indicado en origen) | — (no indicada en origen) | plagas-enfermedades.md [E01][E06][E37][P06][P22] |
| 49 | Imidacloprid, tiametoxam, clotianidina, tiacloprid («clavos» o gránulos sistémicos antiguos) | Nunca | No aprobados en la UE (expiraron 2019–2020) | — (no indicado en origen) | — (no indicada en origen) | plagas-enfermedades.md [R08][R15][R16][M19] |
| 50 | Miclobutanil o mancozeb; «Un fungicida sistémico (tebuconazol, miclobutanil, difenoconazol) para el oídio de tus plantas» | Nunca | plagas-enfermedades.md: no aprobados en la UE (miclobutanil retirado 2021, alterador endocrino; mancozeb 2021, tóxico para la reproducción 1B). productos.md: miclobutanil y propiconazol no están aprobados en la UE; tebuconazol y difenoconazol no tienen producto no profesional en España (ver nº 52) | «Oídio: bicarbonato potásico listo al uso de bajo riesgo (ES-00765) o azufre al aire libre; retirar hojas afectadas; luz y ventilación» (productos.md) | — (no indicada en origen) | plagas-enfermedades.md [E45][E47][R24][M19]; productos.md fila 9 [P79][P96][P109] |
| 51 | Permetrina, clorotalonil, tiofanato-metilo, propiconazol, clorpirifos, dimetoato, fosmet | Nunca | «Not approved» en la base de datos de la UE | — (no indicado en origen) | — (no indicada en origen) | plagas-enfermedades.md [M19] |
| 52 | Abamectina, cipermetrina, lambda-cihalotrina, tebuconazol, difenoconazol, azoxistrobin, propamocarb, azadiractina, *Bacillus thuringiensis*, spinosad pulverizable, lecitinas como producto; «Usa Bt (Bti) para la mosca del sustrato» o «compra un Bt para orugas» | No recomendar en España | plagas-enfermedades.md: aprobadas en la UE pero sin ningún producto de uso no profesional vigente en el Registro MAPA (20/10/2026); abamectina además restringida a usos con intercambio controlado (invernaderos). productos.md: ningún producto con *Bacillus thuringiensis* (kurstaki, aizawai o israelensis) tiene uso no profesional vigente en España | «Mosca del sustrato: dejar secar la superficie, trampas amarillas a ras del sustrato, sustrato menos retentivo, sin orgánicos en descomposición; los insecticidas «are rarely warranted»» (productos.md) | — (no indicada en origen) | plagas-enfermedades.md [M01][M19][Q10]; productos.md fila 7 [P96][P104] |
| 53 | Piretrinas o piretroides contra araña roja; «Los piretroides o un insecticida “total” son la solución rápida para araña roja o cochinilla» | No recomendar | plagas-enfermedades.md: piretrinas «short residual and limited efficacy» contra ácaros; piretroides «not very effective against mites» y provocan brotes al matar depredadores. productos.md: los piretroides «often kill mite predators and can result in spikes of spider mite populations» y «apparently also favor spider mites by increasing the level of nitrogen in leaves»; en cochinilla «may not be much more effective than soaps and oils»; deltametrina: solo aire libre, H410, «guardar bajo llave» | «Retirada manual, agua a presión y jabón potásico primero; sistémico registrado para interior (acetamiprid AL) como último recurso» (productos.md) | — (no indicada en origen) | plagas-enfermedades.md [P22][P01][P13]; productos.md fila 11 [P103][P101][P99][P120] |
| 54 | Imidacloprid/sistémicos contra araña roja o trips | No recomendar (además de ilegal) | «Systemic imidacloprid treatments do not control spider mites»; «commonly fails to provide satisfactory thrips control» | — (no indicado en origen) | — (no indicada en origen) | plagas-enfermedades.md [P22][P02] |
| 55 | «Respirar o soplar sobre la hoja» para ver moverse a los ácaros | No afirmar | No documentado en ninguna fuente abierta (sí «blow into flowers» para trips) | — (no indicado en origen) | — (no indicada en origen) | plagas-enfermedades.md [P27] (laguna) |
| 56 | «El carbón vegetal o activo purifica el sustrato, absorbe toxinas y evita hongos o la pudrición» | — (no indicado en origen) | Ninguna fuente de extensión, botánico o revista revisada por pares abierta le atribuye tal efecto; solo aparece como fracción gruesa en mezclas de orquídeas y *Nepenthes*; las afirmaciones proceden de tiendas y blogs; la cita de MOBOT («neutraliza sales») no se pudo verificar | «Opcional, como componente grueso equivalente a perlita gruesa en mezclas de orquídeas» | — (no indicada en origen) | productos.md fila 2 [P2][P7][P10][P13] |
| 57 | «La bandeja de guijarros sube la humedad de la habitación o de la planta» | — (no indicado en origen) | La única medición: +3 % (invierno) a 4 cm sobre el agua, +2 % a 11 cm y 0 % a 30 cm; «Pebbles added to the water had no measurable effect»; RHS (Barter): «limited effect». Matiza la alternativa de la 2.4 (contradicciones C13 y M8) | «Efecto pequeño y muy local (5–10 cm sobre el agua): sirve para plantas bajas y para que la maceta no toque el agua, no para la habitación ni para una *Monstera*» | — (no indicada en origen) | productos.md fila 4 [C32][C33][C34][P174][P175] |
| 58 | «Cualquier fitosanitario de jardinería exterior doméstica vale para plantas de interior» | — (no indicado en origen) | «Jardinería exterior doméstica» identifica la categoría de usuario, no autoriza otros ámbitos; en interior el art. 48.1.b solo permite aerosoles o envases de aplicación directa, y el uso debe figurar en la ficha («Sistema de cultivo: Interior») | «Buscar en la ficha del Registro el uso Interior; si es “aire libre”, tratar en balcón o terraza y volver a entrar la planta seca» | — (no indicada en origen) | productos.md fila 8 [P94][P95][P87][P93][P99] |
| 59 | «Los ácaros depredadores funcionan en cualquier salón» | — (no indicado en origen) | *P. persimilis* requiere HR >60 % (a 40 % eclosiona el 7,5 % de los huevos); *N. cucumeris* y *A. swirskii* >60–70 %; el RITE fija 40–50 % de diseño en invierno; formatos mínimos de miles de individuos | «Solo con plaga confirmada, HR medida ≥60 % y varias plantas en contacto; *N. californicus* es el más tolerante a la sequedad» | — (no indicada en origen) | productos.md fila 12 [P132][P136][P139][P138][P150][C18] |
| 60 | «El medidor de humedad de aguja te dice cuándo regar» | — (no indicado en origen) | Illinois: «may not always be reliable»; ninguna extensión lo recomienda como método principal; mide conductancia (sales, compactación y agua dura leen «más húmedo»; rango útil ≈6,5/10; inútil en corteza) | «Dedo a 5 cm, peso de la maceta o palillo; la sonda solo como tendencia relativa en la misma maceta» | — (no indicada en origen) | productos.md fila 14 [P155][P159][P37][C29] |
| 61 | «Mide los lux con el móvil para saber si tu planta tiene luz suficiente» | — (no indicado en origen) | UF/IFAS: «solo deben usarse para aproximaciones»; laboratorio acreditado: desviaciones de −89 % a +113 %, no lineales, distintas entre unidades idénticas | «Compara dos puntos con el mismo móvil el mismo día; para un valor usa un luxómetro barato preciso a 1 fc, a mediodía y a la altura de la hoja» | — (no indicada en origen) | productos.md fila 15 [P153][C27] |
| 62 | «Compra la lámpara por vatios equivalentes o por lúmenes» | — (no indicado en origen) | Vatios = energía consumida, «Not a reliable indicator of light output»; lúmenes se basan en el ojo humano; «LED watts» es potencia teórica («500 LED Watt» puede consumir 100 o 300 W reales); fc y lux «not appropriate for indicating plant photosynthesis» | «Elegir por W reales, PPF (µmol/s), eficacia (µmol/J) y mapa PPFD a distancia» | — (no indicada en origen) | productos.md fila 16 [P173][P179][C40] |
| 63 | «La luz morada (rojo + azul) hace crecer más a las plantas de casa» | — (no indicado en origen) | «Broad spectrum lighting is not necessarily beneficial for photosynthesis or plant growth» pero «light quality has a much smaller effect than light quantity»; la ventaja de eficacia es ≈10 % y la luz blanca es necesaria para ver plagas y clorosis | «LED blanco de espectro amplio, 12–14 h con temporizador» | — (no indicada en origen) | productos.md fila 17 [P170][P172][P176] |
| 64 | «Deja la lámpara encendida 24 h: más luz, más crecimiento» | — (no indicado en origen) | «Do not exceed 16 hours of light per day, because plants need a rest period»; «plants really do need a dark period»; clorosis intervenal con fotoperiodos >17 h en especies sensibles | «12–14 h, tope 16; subir PPFD en vez de horas» | — (no indicada en origen) | productos.md fila 18 [P154][P178][P171] |
| 65 | «Un humidificador ultrasónico con agua del grifo es inofensivo porque el agua de Madrid es blanda» | — (no indicado en origen) | Con agua de 42 mg/L CaCO₃ (comparable o inferior a Madrid) un ultrasónico generó 211 µg/m³ de elementos («6 times higher than regulated PM2.5») y partículas «at levels comparable to a polluted city»; brote de legionelosis por máquina ultrasónica; EPA: ultrasónicos e impulsores dispersan más minerales y microorganismos | «Ultrasónico solo con agua destilada y limpieza diaria; evaporativo con agua del grifo; nunca superar 50 % HR» | — (no indicada en origen) | productos.md fila 19 [P167][P168][P164][P162] |
| 66 | «Las plantas de interior necesitan 60–80 % de humedad en la habitación» | — (no indicado en origen) | EPA: HR «below 60 percent» e idealmente 30–50 %; >50 % con humidificador «may encourage the growth of biological organisms»; la mayoría de plantas van bien con 40–50/60 % | «40–50 % en la habitación; humedad alta solo local (terrario, campana) para *Calathea*, *Maranta*, helechos, *Alocasia*» | — (no indicada en origen) | productos.md fila 20 [P163][P162][P174][P158] |
| 67 | «Las puntas marrones de tu *Calathea* o *Dracaena* son por el flúor o la cal del agua de Madrid» | — (no indicado en origen) | Fluoruro <0,10 mg/L, dureza 10–47 mg/L CaCO₃, sodio 5–13 mg/L, EC 76–155 µS/cm: todo por debajo de los umbrales; *Chlorophytum* no sufrió daño a 316 ppm de F con calcio en el sustrato. Específica de Madrid; matiza el nº 18 (general) | «Revisar humedad ambiental, riego irregular, sales de abono, perlita sin lavar y pH del sustrato» | — (no indicada en origen) | productos.md fila 21 [P209][P221][P219][P223][P222] |
| 68 | «El agua filtrada en jarra o la embotellada es “pura” y vale para carnívoras» | — (no indicado en origen) | «No minerals are removed» por jarras y filtros de grifo; «Filtering water will NOT remove the dissolved salts»; ICPS: «reverse osmosis water (NOT bottled drinking water)»; el agua de manantial suele tener «más minerales que el grifo local» | «Lluvia limpia, ósmosis, destilada, condensado, o grifo si TDS <90 ppm (Madrid capital sí; Fuenlabrada no)» | — (no indicada en origen) | productos.md fila 22 [P226][P63][P225][P224] |
| 69 | «Abona en invierno igual que en verano» o «abona la planta nueva al llegar» | — (no indicado en origen) | «If plants go into a winter rest period, do not give them fertilizer»; no abonar de noviembre a febrero salvo síntomas; esperar ≈4 semanas tras comprar; con <200 ft-c no hay beneficio. Relacionado con el nº 22 | «Marzo–octubre a ½ dosis; invierno nada o 1 vez al mes muy diluido si hay luz y crecimiento» | — (no indicada en origen) | productos.md fila 24 [P23][P39][P26][P48] |
| 70 | «Más fosfato = más flores y raíces» | — (no indicado en origen) | «Phosphorus is rarely deficient»; su exceso causa clorosis por competencia con Fe y Mn y daña micorrizas; la harina de huesos «inhibits mycorrhizal fungi» | «Más P y K solo en plantas de flor y con moderación; nunca “por si acaso”» | — (no indicada en origen) | productos.md fila 25 [P46][P47] |
| 71 | «El abono foliar alimenta la planta» | — (no indicado en origen) | «It is pointless to apply [macronutrients] to foliage as leaves cannot take up enough material»; en orquídeas «none of the fertilizer is absorbed directly by the leaves» | «Foliar solo para micronutrientes puntuales (quelato de Fe, Epsom) y carnívoras» | — (no indicada en origen) | productos.md fila 26 [P45][P59][P28] |
| 72 | «Abona el sustrato de tus carnívoras» | — (no indicado en origen) | «DO NOT fertilize your plants unless you don't care if you kill them»; «You will be living dangerously if you fertilize the soil» | «Alimentar con insectos; si acaso foliar o en el cántaro muy diluido» | — (no indicada en origen) | productos.md fila 27 [P63][P62][P64] |
| 73 | «Usa harina de huesos, guano o harina de sangre en casa con perro» | — (no indicado en origen) | Bola «de cemento» en el estómago, pancreatitis, hierro; ingredientes apetecibles para perros | «Abono mineral soluble sin olor; guardar bajo llave» | — (no indicada en origen) | productos.md fila 28 [P75][P74][P69] |
| 74 | «La maceta transparente hace fotosíntesis por las raíces» | — (no indicado en origen) | La fotosíntesis radicular es «minuscule» (artículo de la propia AOS); la ventaja medida es que las raíces se quedan dentro y se ven | «Transparente para ver raíces y humedad y mantenerlas dentro» | — (no indicada en origen) | productos.md fila 30 [P59][P205] |
| 75 | «El sustrato de turba está prohibido en Europa» | — (no indicado en origen) | No hay prohibición en la UE ni en España (RD 865/2010 la reconoce como tipo autorizado); Alemania tiene estrategia voluntaria; Reino Unido anunció pero «has not yet legislated» | «Legal en España; presión regulatoria y de mercado; alternativas sin turba requieren regar más a menudo y menos cantidad» | — (no indicada en origen) | productos.md fila 31 [P22][P12][P21][C8][C9] |
| 76 | «La vermiculita es inocua por ser estéril» | — (no indicado en origen) | «Estéril» (biológicamente) no es sinónimo de inocuo: la EPA documentó amianto en 8 de 54 productos (riesgo mínimo para uso ocasional; manipular húmeda y ventilado) | «Humedecer antes de mezclar, trabajar ventilado, no barrer en seco» | — (no indicada en origen) | productos.md fila 32 [P16][P4] |
| 77 | «Las apps PAR del móvil o el sensor de luz de la sonda 3 en 1 miden la luz» | — (no indicado en origen) | Sin evidencia independiente verificada para apps PPFD; el sensor de la sonda 3 en 1 no está validado ni mencionado por ninguna extensión | «Luxómetro dedicado o sensor cuántico PAR» | — (no indicada en origen) | productos.md fila 33 [P153][C27] |
| 78 | «*Chamaedorea seifrizii* es segura para mascotas» | No afirmar | ASPCA no tiene ficha de C. seifrizii: su nombre común 'bamboo palm' remite a C. elegans. NC State y RHS no dan dato para mascotas. Es probable que la especie sea poco problemática, como su congénere, pero no está verificado. La app no debe afirmar que es segura para mascotas | — (no indicado en origen) | Media (dato de toxicidad de la ficha) | chamaedorea-seifrizii.json, toxicidad.notas [F1][F2][F9] |
| 79 | «*Hibiscus rosa-sinensis* es segura» o «es tóxica» (para perros y gatos) | No afirmar | ASPCA no tiene ficha de Hibiscus rosa-sinensis: sus fichas 'Hibiscus', 'Rose of China' y 'Rose of Sharon' corresponden todas a Hibiscus syriacus. NC State Plant Toolbox no incluye apartado de toxicidad para H. rosa-sinensis y clasifica sus flores como comestibles, pero eso no cubre hojas ni tallos. Sin fuente prioritaria a nivel de especie, se deja 'desconocida'. La app no debe afirmar que es segura ni tóxica | Ante ingestión con síntomas, consultar al veterinario o al Servicio de Información Toxicológica (91 562 04 20) | Baja (dato de toxicidad de la ficha) | hibiscus-rosa-sinensis.json, toxicidad.notas [F8][F3] |
| 80 | «*Hypoestes phyllostachya* es tóxica» | No afirmar | Perros y gatos: ASPCA y NC State ('Non-toxic for cats, dogs and horses') coinciden. Niños: la única fuente prioritaria es la lista del Minnesota Poison Control System. Algunas tiendas la etiquetan como tóxica sin respaldo: la app no debe afirmarlo | — (no indicado en origen) | Alta (dato de toxicidad de la ficha) | hypoestes-phyllostachya.json, toxicidad.notas [F6][F1][F7] |
| 81 | Identificar como *Pachira aquatica* una pachira trenzada a partir de hojas o tronco | No afirmar | Muchas, posiblemente la mayoría, de las 'pachiras' trenzadas vendidas como P. aquatica son en realidad P. glabra, por un error de identificación antiguo en los viveros de Taiwán. De joven y sin flor son casi imposibles de distinguir por la hoja. Una IA de visión no debe afirmar la especie a partir de hojas o tronco trenzado | Responder 'Pachira (P. aquatica o P. glabra)'; los cuidados en interior son prácticamente los mismos | — (no indicada en origen; pistas de fuentes complementarias) | pachira-aquatica.json, identificacion.confusiones[0] (el campo no cita id de fuente) |
| 82 | «*Portulacaria afra* es segura para mascotas» | No afirmar | ASPCA no tiene ficha de Portulacaria afra; ninguna fuente prioritaria veterinaria la evalúa. Un vivero (Mountain Crest Gardens) la pone en su lista de suculentas aptas para mascotas, pero esa misma lista incluye Portulaca, que ASPCA da como tóxica, así que no es fiable. La app no debe decir que es segura para mascotas | Ante ingestión con síntomas, consultar al veterinario o al Servicio de Información Toxicológica (91 562 04 20) | Media (dato de toxicidad de la ficha) | portulacaria-afra.json, toxicidad.sintomas [F1][F3][F6][F9][F8] |
| 83 | «*Radermachera sinica* es segura» (apta para mascotas) | No afirmar | No hay ficha de esta especie en ASPCA ni en Pet Poison Helpline. El informe de riesgo WRA de Hawái revisó dos obras de referencia de plantas venenosas (Wagstaff 2008, International poisonous plants checklist; Quattrocchi 2012, CRC World Dictionary of Medicinal and Poisonous Plants) y no encontró registros de toxicidad para animales ni para personas. La ausencia de registros NO equivale a 'no tóxica': algunos vendedores la anuncian como apta para mascotas sin citar fuente. La app no debe afirmar que es segura | Ante ingestión con síntomas (vómitos, diarrea, babeo), llamar al veterinario o al Servicio de Información Toxicológica (91 562 04 20) | Baja (dato de toxicidad de la ficha) | radermachera-sinica.json, toxicidad.sintomas [F10][F11][F9] |
| 84 | «*Soleirolia soleirolii* pica como una ortiga» | No afirmar | NC State describe los tallos con 'stinging hairs' a la vez que la marca como no tóxica (F1); ninguna otra fuente prioritaria consultada (MBG, RHS, RBG Victoria, UIB) menciona pelos urticantes, y la RHS la presenta como 'tactile' (F4). Se trata como probable error de la ficha de NC State; la app no debe decir que pica como una ortiga | — (no indicado en origen) | Alta (dato de toxicidad de la ficha) | soleirolia-soleirolii.json, toxicidad.notas [F1][F4] |
| 85 | «*Spathiphyllum* tiene en gatos los efectos de los lirios verdaderos (*Lilium*)» | No afirmar | Su toxicidad es la irritación local por oxalato cálcico propia de las aráceas; no se ha verificado en fuentes prioritarias que comparta los efectos de los lirios verdaderos (Lilium) en gatos, y la app no debe afirmarlo | — (no indicado en origen) | Alta (dato de toxicidad de la ficha) | spathiphyllum-wallisii.json, toxicidad.notas [F1][F4][F5][F6] |
| 86 | «*Vanda* es segura para mascotas» (por extrapolación de otras orquídeas) | No afirmar | La ASPCA no tiene ficha de Vanda ni de sus antiguos géneros; sí clasifica como no tóxicas otras orquídeas, pero no se extrapola a Vanda sin fuente. NC State no da dato de toxicidad, y no se encontró otra fuente prioritaria. No hay indicios publicados de toxicidad, pero la app no debe afirmar que es segura | Ante cualquier ingestión: veterinario o Servicio de Información Toxicológica (91 562 04 20) | Baja (dato de toxicidad de la ficha) | vanda-hybrida.json, toxicidad.notas [F9][F10][F3] |
| 87 | «*Vriesea splendens* es segura para mascotas» | No afirmar | Probablemente de bajo riesgo según fuentes complementarias, pero sin respaldo prioritario: la app no debe afirmar que es 'segura para mascotas' | — (no indicado en origen) | Baja (dato de toxicidad de la ficha) | vriesea-splendens.json, toxicidad.notas [F8][F9] |

Rutas de origen: `output/diagnostico/plagas-enfermedades.md` (§16 y fuentes en §17), `output/logica/productos.md` («Lo que la app no debe decir» y «Fuentes»), `output/fichas/<especie>.json` (campo indicado y array `fuentes`).
