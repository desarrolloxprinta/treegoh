# Fase 5 — Auditoría de fitosanitarios (2026-10-22)

Marco de referencia: `output/logica/productos.md` §3 (RD 1311/2012 arts. 46-48; RegFiWeb BD 16/10/2026, filtro NO PROFESIONAL) y `output/research/fase-2-fitosanitarios.md`.
Criterio: (a) conforme = mecánico/cultural, OCB (RD 951/2014) o ingrediente con uso no profesional acreditado (jabón potásico RTU ES-01302 «Interior»; acetamiprid RTU ES-00785 «Interior»; piretrinas+colza ES-01130 «interiores y balcones», aplicado en balcón; bicarbonato potásico RTU ES-00765, azufre RTU ES-01257 y aceite de naranja ES-01273 al aire libre/balcón; alcohol con bastoncillo como limpieza mecánica). (b) no conforme. (c) dudoso.
Frase estándar aplicada: arbol.json «En interior, solo productos listos para usar autorizados para uso no profesional; los concentrados de jardinería exterior doméstica [autorizados para la planta y la plaga] se aplican con la planta en el balcón (R01, R02)»; fichas «usar solo un [insecticida/acaricida] listo para usar, de uso no profesional e inscrito en el Registro del MAPA para plantas de interior, siguiendo la etiqueta».
Notación de ubicación en arbol.json: «S23 c1 t3» = síntoma S23, causa índice 1 (base 0), paso de tratamiento 3 (numeración del propio texto, base 1). En fichas, «pf[n]» = problemas_frecuentes índice n (base 0).
Nueva fuente añadida a arbol.json: **R02** = MAPA RegFiWeb (https://servicio.mapa.gob.es/regfiweb, prioritaria, 20/10/2026), añadida también a `fuentes` de los síntomas editados. Copias previas: `arbol.backup.json`, `pe.backup.md` en esta carpeta.

## Recuento

| Archivo | Menciones revisadas | (a) | (b) corregidas | (c) dudosas |
|---|---|---|---|---|
| arbol.json | 97 pasos de tratamiento con término químico/biológico + 100 coincidencias en otros campos (causa, preguntas, como_diferenciar: no son recomendaciones; 1 en tiempo_recuperacion) | 49 pasos + 99 otros campos | 45 (44 pasos + 1 tiempo_recuperacion), de ellas 1 por C365 | 4 + 1 transversal |
| plagas-enfermedades.md | 88 líneas de tratamiento escalonado (14 fichas) + escalera §0.3 | 83 (todas con anotación «Legal en España» o exclusión expresa) | 5 | 0 |
| fichas/*.json (173) | 126 menciones en problemas_frecuentes, cuidados, ajustes_madrid y lagunas (de 157 coincidencias fuertes; el resto son «cobre» como micronutriente, nombres de color, etc.) | 116 | 3 | 7 |

## arbol.json — cambios (b)

| Ubicación | Texto original (resumen) | Clasificación | Cambio aplicado | Base legal (productos.md) |
|---|---|---|---|---|
| S01 c6 t2; S02 c7 t1; S04 c4 t1; S09 c3 t2; S09 c4 t2; S11 c6 t1; S12 c6 t1; S18 c3 t3; S18 c4 t1; S18 c5 t1; S20 c3 t1; S22 c3 t1; S25 c1 t1; S28 c1 t1; S29 c2 t1; S29 c3 t1; S33 c2 t1; S35 c2 t1 | «jabón potásico o aceite hortícola (parafina)/aceite registrado listo para usar o aplicado en el balcón» | b (parafina sin uso ornamental no profesional) | Queda solo jabón potásico listo para usar de uso no profesional (R01, R02); en varios se añade «El aceite hortícola (parafina)… no tiene en España uso no profesional verificado en plantas ornamentales: no usarlo (R02)» | Tabla 3.2 «Aceite de parafina»: ficha ES-01352 solo olivo, platanera, vid; «Ornamentales e interior (no autorizado)»; nivel 6 de la escalera |
| S08 c7 t1; S10 c4 t1 | «Bacillus thuringiensis israelensis en riego» | b | Solo secado + trampas; «en España no hay ningún producto con Bti de uso no profesional (R02)» | §3: Bt kurstaki/israelensis «Ningún producto no profesional vigente» |
| S23 c0 t4; S24 c0 t3 | Jabón, parafina o neem al 1–2 % | b | Jabón potásico RTU, sin dosis de dilución, «sin superar el máximo de la etiqueta»; frases de parafina y neem | Neem/azadiractina sin producto no profesional; parafina sin ornamentales |
| S23 c1 t3 | Jabón, aceite hortícola o azadiractina (neem) para trips | b | Jabón RTU + frases parafina/neem | Ídem |
| S23 c1 t6 | Espinosad «estado no verificado» | b | «no hay ningún espinosad pulverizable de uso no profesional (solo granulado para patata)»; acetamiprid RTU señalado como único insecticida registrado con uso Interior para trips | Spinosad: solo ES-01226 granulado; acetamiprid ES-00785 «Interior», trips |
| S24 c0 t5 | «reduciendo antes la plaga con un acaricida selectivo» | b (acaricida genérico) | «…que para el aficionado en España es el jabón potásico listo para usar (R02)» | ES-01302 incluye araña roja |
| S27 c0 t3 | Dosis 1–2 %; neem o parafina 1–2 %; «piretrinas con jabón» | b | «a la dosis de la etiqueta»; piretrinas remitidas al paso 5; frases parafina/neem | Ídem; piretrinas solo en ES-01130 con colza |
| S28 c0 t2 | Jabón o aceite hortícola (parafina o neem); azadiractina | b | Jabón RTU; aceite y azadiractina citados solo como dato de extensión sin uso no profesional | Ídem |
| S28 c0 t3 | «compatibles con jabón insecticida y azadiractina» | b (menor) | «compatibles con jabón insecticida» | Azadiractina sin uso no profesional |
| S29 c0 t2 | Alcohol isopropílico pulverizado al 10–25 % para infestaciones extensas | b (decisión del orquestador **C365**) | Solo bastoncillo con alcohol ≤70 % sobre el insecto, prueba previa 1–2 días; «No pulverizar alcohol… ni usarlo en hojas peludas o tiernas» | Decisión C365 (UC IPM, Iowa State; UF/IFAS fitotoxicidad) |
| S29 c0 t4 | Jabón, aceite hortícola (parafina) o neem | b | Jabón RTU + frases parafina/neem; concentrados «autorizados para la planta y la plaga» en balcón | Ídem |
| S30 c0 t3 | Aceite hortícola (parafina) como opción principal; jabón o neem | b | Reescrito: jabón RTU semanal 4–6 semanas sin superar la etiqueta; parafina «no usarlo (R02)»; frase neem | Ídem |
| S30 c1 t2 | Acorazadas: parafina «la opción documentada»; neem | b | Parafina citada como dato de extensión «no usarlo»; jabón RTU contra crawlers | Ídem |
| S31 c0 t5 | Bti en riego, «verificar que el producto esté registrado» | b | Bti: «no hay ningún producto con BTi de uso no profesional (el único registrado es profesional en invernadero): no recomendarlo» | §3 y fase-2 (GNATROL SC, solo profesional) |
| S31 c0 t7 | Peróxido de hidrógeno 3 % 1:4 en el sustrato (Baja) | b (remedio casero sin fuente prioritaria) | «no recomendado… ninguna fuente prioritaria lo respalda y no consta como uso autorizado de producto para el aficionado (R02). Confianza Baja» | Sustancias básicas solo en condiciones del informe de revisión (no consultado); mosca del sustrato «exclusivamente cultural» |
| S31 c0 t8 | Piretrinas sobre el sustrato contra sciáridos | b | No hay insecticida de uso no profesional contra mosca del sustrato (ES-01130 no incluye dípteros); quedarse en lo cultural | §3.2: «La mosca del sustrato queda… en manos exclusivamente culturales» |
| S31 c0 tiempo_recuperacion | «descenso con BTi en 4–5 semanas (C12)» | b | Eliminado | Ídem Bti |
| S33 c0 t4 | Azufre; aceite hortícola o neem; bicarbonato potásico con dosis de producto al 85 % (1,5–6 g/L) | b (neem/parafina; dosis de un concentrado no registrado para aficionado) | Solo bicarbonato potásico RTU y azufre RTU, al aire libre (tratar en balcón, reentrar seca), azufre a 30 días de un aceite; neem y aceite hortícola «no usarlos» | ES-00765 (oídios, aire libre/invernadero), ES-01257 (oídios, aire libre); intervalo aceite-azufre conservador 30 días |
| S33 c0 t5 | Bacillus amyloliquefaciens/subtilis preventivo | b | «en España solo hay productos de uso profesional» | fase-2: SERENADE ASO solo profesional |
| S33 c0 t6 | Difenoconazol «producto doméstico nº 25202» | b | No hay ningún fungicida azólico de uso no profesional; el escalón químico termina en el paso 4 | §3: difenoconazol, tebuconazol, miclobutanil: **No** |
| S35 c0 t4 | Roya: bicarbonato potásico 85 % o azufre; «cobre solo en productos profesionales» | b (bicarbonato y azufre RTU no autorizan roya) | Bicarbonato y azufre RTU solo oídios; cobre sin uso no profesional en ornamentales; única opción: aceite de naranja al aire libre (balcón, guantes, sin mascotas, H332/H319) | ES-00765, ES-01257, ES-01273 («royas 10 l/ha», aire libre); cobre ES-00989 sin ornamentales |
| S35 c0 t5 | Difenoconazol nº 25202 para roya | b | Sin fungicida azólico de uso no profesional | §3 |
| S36 c0 t6 | Trichoderma / Gliocladium preventivo | b (no acreditado) | «no se ha verificado ningún producto de uso no profesional… no se recomienda al aficionado (R02)» | No figura en productos.md; fase-2 sin producto |
| S36 c0 t7 | Fosetil-Al 80 % ficha nº 15907 con dosis 0,1–0,13 % en balcón | b (ficha caducada 30/04/2023, no vigente) | «no figura entre los productos de uso no profesional vigentes; los vigentes son concentrados solo al aire libre, sin uso en interior ni ornamentales verificado: no recomendarlo» | §3.2: fosetil vigentes 25501, 20032 (fichas no leídas), MIKONOS sin ornamentales |
| S36 c3 t1 | «el cobre solo frena su propagación» | b (menor, aclaración) | «…y no hay producto de cobre de uso no profesional autorizado en ornamentales (R02)» | Cobre ES-00989 sin ornamentales ni interior |

## arbol.json — conformes destacados (a)
Acetamiprid RTU (S23 c1 t6, S27 c0 t5, S28 c0 t4, S28 c1 t2); piretrinas en S27 c0 t5 («solo con producto listo para usar», más restrictivo que productos.md); OCB (Phytoseiulus, Neoseiulus, Amblyseius, Orius, Encarsia, Eretmocerus, Aphidius, Chrysoperla, Steinernema en sciáridos) con advertencias de HR; exclusiones de imidacloprid, abamectina, piretroides, miclobutanil, mancozeb; «no usar fungicidas» (S01, S13, S15, S20, S34); alcohol 70 % para desinfectar tijeras y lejía 10 % para herramientas.

## arbol.json — dudosos (c), requieren decisión humana
| Ubicación | Texto | Duda |
|---|---|---|
| S29 c0 t7 | «No hay escalón químico de aficionado útil» contra cochinilla algodonosa | productos.md acredita acetamiprid RTU (Interior, cochinillas harinosas) y piretrinas+colza ES-01130 (cochinillas harinosas, interior y balcones). Es conservador pero incompleto; decidir si se añaden como último recurso. |
| S30 c0 t6 | «no hay sistémico de aficionado disponible en España» (cochinilla blanda) | Falso según productos.md: acetamiprid RTU ES-00785 es sistémico y autoriza Coccidae en Interior; también flupiradifurona ES-01299 al aire libre. Conservador; decidir. |
| S30 c0 t5 | Steinernema feltiae contra cochinilla de escudo, «sin dosis», «puede infectar animales no objetivo» | Legal como OCB, pero los registros MDF de S. feltiae listan Bradysia, no cochinillas; eficacia en interior sin fuente prioritaria. |
| S14 c0 t5 | «Fungicida registrado solo en plantas de valor…» para manchas foliares fúngicas | No hay fungicida de uso no profesional con ornamentales para manchas foliares (cobre sin ornamentales; aceite de naranja solo antracnosis del rosal). Condicional sin producto real. |
| Transversal | Jabón potásico RTU recomendado contra cochinillas, trips y tarsonémidos | La ficha ES-01302 solo lista pulgones, araña roja y moscas blancas; productos.md lo acepta para cochinilla joven y trips «por extensión» (nivel 4, Alta). Estrictamente es uso fuera de etiqueta (art. 55 Reg. 1107/2009). |

## plagas-enfermedades.md — cambios (b)
(El alcohol pulverizado lo gestiona el orquestador por C365; ya aparecía anotado en §2.4 y §3.4 y no se tocó.)

| Ubicación | Texto original | Clasificación | Cambio aplicado | Base legal |
|---|---|---|---|---|
| §0.3 escalón 3 | Lista Bti, *Bacillus* spp., *Trichoderma* como biológicos sin nota legal | b | Añadido: son sustancias activas fitosanitarias, sin producto de uso no profesional verificado; la app no los recomienda | §3 Bt; fase-2 Bacillus (solo profesional) |
| §1.4 paso 4 (acetamiprid, araña roja) | «Usar solo si jabón y aceite fallan» | b | «si el jabón potásico listo para usar falla (parafina sin uso ornamental, neem sin producto)» | Parafina/neem §3 |
| §3.4 calendario práctico | «retirada manual + aceite o jabón cada 7 días 4–6 semanas» | b | Jabón potásico RTU sin superar el máximo de la etiqueta; parafina excluida [M08] | Parafina §3 |
| §3.4 paso 4 acorazadas | «la opción documentada es el aceite hortícola» | b | Añadido «sin uso ornamental no profesional verificado [M08]: quedan retirada manual y jabón RTU contra crawlers» | Ídem |
| §6.4 paso 2 (peróxido) | «La app puede mencionarlo como opción sin respaldo prioritario» | b | «Decisión de Fase 5: la app no lo recomienda» (coherente con arbol S31) | Sin fuente prioritaria; condiciones de sustancia básica no verificadas |

Resto del archivo (a): cada escalón químico/aceites ya lleva bloque «Legal en España» con número de registro y estado (neem, parafina, Bti, Bacillus, Trichoderma, azólicos, cobre, fosetil 15907 con caducidad 2023 anotada) o exclusión expresa. Las dosis de extensión citadas (neem 1–2 %, aceite hortícola 1–2 %) quedan como cita textual seguida de la anotación legal; no se tocaron.

## fichas — cambios (b)
| Ficha / ubicación | Texto original | Cambio aplicado | Base legal |
|---|---|---|---|
| portulacaria-afra problemas_frecuentes[6] (S07) | «Usar solo productos autorizados por el MAPA para uso no profesional.» | «…listos para usar de uso no profesional inscritos en el Registro del MAPA para plantas de interior, siguiendo la etiqueta.» | Art. 48.1.b: en interior solo envases de aplicación directa |
| phlebodium-aureum problemas_frecuentes[9] (S30) | «productos de uso no profesional inscritos en el MAPA cuya etiqueta autorice helechos» | Añadido «listos para usar… para plantas de interior» | Ídem |
| stephanotis-floribunda problemas_frecuentes[4] (S24) | «un acaricida registrado en el MAPA para uso no profesional» | Frase estándar de las fichas (listo para usar, interior, etiqueta) | Ídem |

Conformes (a), 116: retirada manual, bastoncillo con alcohol, frase estándar RTU/Registro MAPA, exclusiones expresas de neem (allium, asplenium, ocimum, platycerium, begonia-maculata, cymbidium, dracaena-sanderiana, gardenia, streptocarpus), Bti en pinguicula («no recomendarlos»), advertencias de fitotoxicidad (jabón en culantrillo, hiedra, crassula, helechos; cobre en fittonia, nepenthes, dypsis), plazos de seguridad en aromáticas, desinfección de herramientas con lejía o alcohol, «cobre» como micronutriente del abono. No hay alcohol pulverizado en ninguna ficha (C365 no aplica).

## fichas — dudosos (c)
| Ficha / ubicación | Texto | Duda |
|---|---|---|
| begonia-elatior pf[0], cissus-rhombifolia pf[5], gerbera-jamesonii pf[3], streptocarpus-ionanthus pf[4] (S33, oídio) | «fungicida listo para usar autorizado para uso no profesional en plantas [ornamentales] de interior» | Ningún fungicida RTU tiene uso «Interior»; los registrados contra oídio (bicarbonato potásico ES-00765, azufre ES-01257) son de aire libre. Propuesta: «tratar con la planta en el balcón y volver a entrarla seca». |
| platycerium-bifurcatum pf[1] (S13, Rhizoctonia) | «Si hiciera falta un fungicida, solo uno listo para usar… para plantas de interior» | No existe ningún fungicida de uso no profesional contra Rhizoctonia en ornamentales; propuesta: «no hay producto doméstico autorizado». |
| citrus-limon ajustes_madrid.verano | «Los tratamientos con aceite de parafina solo se aplican entre 7 y 29 °C…» | Planta en terraza (aire libre): las 5 fichas de parafina no profesional no leídas podrían incluir cítricos; la leída (ES-01352) no. Verificar en RegFiWeb o sustituir por jabón potásico. |
| citrus-microcarpa ajustes_madrid.verano | «Los aceites y jabones insecticidas solo se aplican entre 7 y 29 °C…» | Misma duda sobre aceites en cítricos de terraza. |

## Decisiones del orquestador sobre los casos dudosos (2026-10-22)

| Caso | Decisión | Aplicado en |
|---|---|---|
| Cochinillas, "no hay escalón químico" (arbol S29 paso 7, S30 paso 6) | Inexacto: `productos.md` §3 acredita acetamiprid listo para usar con uso «Interior» (ES-00785, cochinillas incluidas) y piretrinas + colza (ES-01130) para aplicar en balcón. Se añaden como último recurso con sus condiciones de etiqueta. | arbol.json S29, S30; contradicciones C366 |
| *Steinernema feltiae* contra escudo (arbol S30 paso 5) | Legal pero sin dosis ni eficacia en las fuentes: la app no lo recomienda. | arbol.json S30; C367 |
| "Fungicida registrado" para manchas foliares (arbol S14 paso 5) | No hay producto doméstico autorizado: la app no recomienda fungicida; tratamiento cultural. | arbol.json S14; C368 |
| Fichas de oídio (begonia-elatior, cissus-rhombifolia, gerbera-jamesonii, streptocarpus-ionanthus) y *Platycerium* (Rhizoctonia) | Oídio: alineado con arbol S33 (bicarbonato potásico o azufre listos para usar, en el balcón). *Platycerium*: no hay producto doméstico; cultural o desechar. | 5 fichas; C368 |
| Cítricos y aceite de parafina | No se ha verificado aceite de parafina con uso ornamental no profesional: jabón potásico listo para usar con las mismas condiciones de temperatura y floración. | citrus-limon, citrus-microcarpa; C369 |
| Jabón potásico contra cochinillas, trips y tarsonémidos | ES-01302 solo lista pulgón, araña roja y mosca blanca; las extensiones lo amplían. Se mantiene (bajo riesgo, primer escalón químico de todas las fuentes), pero queda para revisión humana como uso fuera de etiqueta. | lagunas L186 |
