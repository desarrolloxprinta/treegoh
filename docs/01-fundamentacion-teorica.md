# Treegoh · Fundamentación teórica

**Versión:** 0.1 (borrador de planteamiento) · **Fecha:** 2026-10-20
**Estado:** propuesta para discusión. Los apartados marcados `[VERIFICAR]` tienen una sola fuente o fuente débil y deben completarse antes de pasar a la base de conocimiento.

---

## 0. Principio rector

> **Primum non nocere: primero, no matar la planta.**

Toda la teoría de la app se subordina a una idea: en cuidado doméstico de plantas, el daño casi siempre lo causa una acción humana bien intencionada pero equivocada (regar de más, trasplantar en reposo, mover a sol directo, aplicar un producto inadecuado). La fuente más citada por los servicios de extensión universitaria (UC IPM) sitúa el **riego incorrecto como la causa más común de deterioro**, siendo el exceso más frecuente que el defecto, y el exceso de humedad el camino habitual hacia la pudrición de raíces.

De aquí se derivan tres consecuencias de diseño:

1. **La abstención es una respuesta válida.** Si el agente no alcanza confianza suficiente, pide otra foto o un dato, no inventa.
2. **Ante la duda, la acción menos irreversible.** Esperar un día para regar rara vez mata; regar de más sí.
3. **Toda recomendación lleva cita.** Si no se puede citar, no se recomienda.

---

## 1. Mapa de dominios de conocimiento

La app toca siete disciplinas. Cada una tiene sus propias fuentes de autoridad y su propio modo de "doble verificación".

| # | Dominio | Pregunta que responde en la app | Disciplina base |
|---|---------|--------------------------------|-----------------|
| 1 | Taxonomía e identificación | ¿Qué planta es? | Botánica sistemática, visión por computador |
| 2 | Fisiología y requisitos de cultivo | ¿Qué necesita (luz, agua, sustrato, nutrientes, temperatura, humedad)? | Fisiología vegetal, horticultura ornamental |
| 3 | Fitopatología y diagnóstico | ¿Qué le pasa? | Fitopatología, entomología, nutrición vegetal |
| 4 | Microclima doméstico | ¿Dónde la pongo? | Física de la luz, climatología de interiores |
| 5 | Fenología y calendarios | ¿Cuándo hago cada cosa? | Fenología, ciclos de crecimiento/reposo |
| 6 | Seguridad | ¿Es tóxica? ¿Qué producto puedo usar legalmente? | Toxicología veterinaria, regulación fitosanitaria |
| 7 | Fotografía como instrumento | ¿Está mejor o peor que hace dos semanas? | Fenotipado por imagen, colorimetría |

### 1.1 Taxonomía e identificación

- **Columna vertebral de nombres:** el nombre aceptado de cada especie debe anclarse a un *backbone* taxonómico, no a nombres comerciales. Candidatos: **POWO / WCVP (Kew)**, que es la autoridad principal que usa iNaturalist para plantas, y **World Flora Online**, que publica *snapshots* periódicos con estado aceptado/sinónimo. Se guarda el identificador estable (WFO-ID o IPNI-ID) y se mantienen los sinónimos y nombres comunes por idioma como alias.
- **Cultivares e híbridos ornamentales:** gran parte de las plantas de interior son cultivares (*Monstera deliciosa* 'Thai Constellation', *Philodendron* 'Birkin'). El backbone botánico no los cubre bien. Hay que modelar `Cultivar` como entidad hija de `Especie`, con fuente horticultural (RHS, Missouri Botanical Garden). `[VERIFICAR]` cobertura de cultivares en RHS Plant Finder vía acceso programático.
- **Identificación por imagen:** ningún modelo es suficiente solo. Estado del arte accesible:
  - **Pl@ntNet API:** 500 identificaciones/día gratis, >35 000 especies, hospedaje europeo, pago por volumen por encima. Requiere atribución en uso gratuito.
  - **Kindwise plant.id:** identificación + módulo de salud (plant.health, 548 clases según su blog, 90 según documentación antigua, `[VERIFICAR]` cifra actual). Comercial, de pago.
  - **iNaturalist:** su modelo de visión **no tiene API pública**; acceso solo por acuerdo. Descartado como dependencia, útil como dataset de entrenamiento (iNat Open Dataset en AWS).
  - **Modelo de lenguaje con visión (Claude):** segunda opinión razonada, especialmente para distinguir cultivares y leer contexto (maceta, sustrato, entorno).

### 1.2 Fisiología y requisitos de cultivo

Las cinco variables que gobiernan una planta de interior y sus unidades canónicas:

| Variable | Unidad canónica | Unidad "de usuario" | Nota teórica |
|----------|-----------------|---------------------|--------------|
| Luz | PPFD (µmol·m⁻²·s⁻¹) y DLI (mol·m⁻²·día⁻¹) | lux, pie-candela, "luz indirecta brillante" | La planta responde a fotones en 400–700 nm (PAR), no a lux. Ver §5. |
| Agua | Humedad del sustrato (% vol o tensión), frecuencia relativa | "cuando los 3 cm superiores estén secos" | Depende de sustrato, maceta, luz y temperatura. Nunca un intervalo fijo de días. |
| Sustrato | Composición, drenaje, pH, CE | "mezcla aireada" | Determina la ventana de error en riego. |
| Nutrición | N-P-K, CE/ppm de la solución | "abono cada 15 días en crecimiento" | Deficiencias se confunden con enfermedades. |
| Temperatura y HR | °C, % HR, VPD (kPa) | "ambiente de casa" | HR interior en invierno con calefacción cae a 20–30 %, por debajo de lo tolerable para muchas aráceas y helechos. |

**Fuentes de perfil de cuidado (tier A):** servicios de extensión universitaria de EE. UU. (Minnesota, Illinois, Tennessee, Penn State, Nebraska, Maryland, UF/IFAS, NC State Plant Toolbox), **RHS** (Reino Unido), **Missouri Botanical Garden Plant Finder**. En castellano la oferta de tier A es escasa; se traduce desde las anteriores y se marca el idioma de la fuente.

### 1.3 Fitopatología y diagnóstico diferencial

Principio clave: **la mayoría de los problemas de plantas de interior son abióticos** (cultivo), no patógenos. El orden del diagnóstico diferencial debe ser:

1. **Abiótico primero:** riego (exceso/defecto), luz (quemadura/etiolación), temperatura (frío por corriente, calor por radiador), humedad baja, sales por abono o agua dura, trasplante reciente, cambio de ubicación.
2. **Plagas:** araña roja, cochinilla algodonosa, cochinilla con escudo, pulgón, trips, mosca del sustrato, mosca blanca. Son visibles o dejan signos (melaza, telarañas, punteado).
3. **Hongos y bacterias:** pudrición radicular (*Pythium*, *Phytophthora*, *Rhizoctonia*), manchas foliares, oídio, botritis. Casi siempre secundarias a un problema abiótico (exceso de humedad).
4. **Virus:** raros en interior, sin tratamiento; se diagnostica por exclusión.

**Fuentes tier A:** UC IPM (Pest Notes "Houseplant Problems"), University of Maryland Extension ("Diagnose indoor plant problems"), APS (American Phytopathological Society), CABI Compendium, EPPO Global Database.

**Limitación crítica de los datasets públicos:** PlantVillage (≈54 300 imágenes, 38 clases, 14 cultivos) y similares son **de cultivos agrícolas fotografiados en laboratorio**, no de plantas ornamentales de interior. No sirven para entrenar un diagnóstico de *Monstera* o *Calathea*. Por eso la estrategia realista es **API comercial (Kindwise plant.health) + VLM + motor de reglas de diagnóstico diferencial**, y acumular dataset propio con las fotos de los usuarios (con consentimiento).

### 1.4 Microclima doméstico

La ubicación idónea es función de: orientación de la ventana, hemisferio, estación, distancia a la ventana, obstáculos exteriores, cortinas, y fuentes de calor/frío (radiador, aire acondicionado, puerta). Las categorías tradicionales (baja / media / alta) **no están estandarizadas**: Tennessee da 50–250 / 250–1 000 / >1 000 pie-candela; Illinois da puntos de referencia de 75 / 150 / 300 / 1 500. Conclusión teórica: la app debe **medir**, no clasificar por etiqueta, y convertir la medición a PPFD/DLI (§5).

### 1.5 Fenología y calendarios

Los recordatorios no pueden ser cron fijos. El calendario de cada planta depende de:

- **Fase fenológica:** crecimiento activo vs reposo (muchas plantas de interior reducen actividad con días cortos aunque la temperatura sea estable).
- **Hemisferio y latitud** del usuario (del dispositivo o perfil).
- **Estación meteorológica real** (API de tiempo: temperatura exterior, radiación, HR) para ajustar riego y fertilización.
- **Eventos del historial:** último riego, último abono, último trasplante.

Modelo propuesto: recordatorio = regla + estado, recalculado cada día, nunca "cada 7 días".

### 1.6 Seguridad

- **Toxicidad para mascotas:** ASPCA Toxic and Non-Toxic Plants (perros, gatos, caballos). La propia ASPCA advierte que la lista no es exhaustiva y que debe cotejarse el nombre, no la foto. Segunda fuente: Pet Poison Helpline. Para humanos: bases de centros de toxicología (`[VERIFICAR]` fuente europea en castellano, p. ej. Servicio de Información Toxicológica).
- **Productos fitosanitarios:** solo se recomiendan productos **autorizados para usuario no profesional** en la jurisdicción del usuario. En España, el Registro Oficial de Productos y Material Fitosanitario (MAPA) indica en la autorización si el producto es de uso profesional o no, y la categoría "jardinería doméstica de interior" está contemplada en la norma (RD 1311/2012). Ver §8.

### 1.7 Fotografía como instrumento

Una foto bien tomada es un sensor. Permite seguimiento de: color foliar (clorosis, necrosis), número y tamaño de hojas, hábito (etiolación), progresión de manchas. Requiere protocolo (§6) para ser comparable en el tiempo.

---

## 2. Fuentes de autoridad por dominio y nivel de evidencia

### Jerarquía de evidencia

| Tier | Qué es | Ejemplos | Uso en la KB |
|------|--------|----------|--------------|
| **A** | Instituciones científicas, botánicas, universitarias o regulatorias | Kew/POWO, WFO, extensión universitaria (UC IPM, UMN, UMD…), RHS, MOBOT, ASPCA, MAPA, EPPO, CABI, APS, artículos revisados por pares | Puede ser fuente única **solo** si otra fuente A o B no la contradice |
| **B** | Sociedades horticulturales, viveros de referencia, manuales editoriales reconocidos | Sociedades de aráceas/orquídeas, manuales tipo "RHS Encyclopedia", monografías | Confirma o complementa a A |
| **C** | Blogs, foros, apps comerciales, fichas de tiendas, redes sociales, salida de un LLM sin cita | Planta, Greg, PictureThis, Reddit, YouTube | **Nunca** fuente de un hecho. Solo para detectar lagunas y vocabulario de usuario |

### Tabla de fuentes por dominio

| Dominio | Fuente primaria | Fuente de contraste | Acceso |
|---------|-----------------|---------------------|--------|
| Nombres aceptados | POWO/WCVP (Kew) | World Flora Online | Web + datos descargables; `[VERIFICAR]` API |
| Identificación visual | Pl@ntNet API | Kindwise plant.id + VLM | API REST |
| Perfil de cuidado | Extensión universitaria (UMN, Illinois, UT, Penn State, UMD) | RHS, Missouri Botanical Garden | Web (scraping con permiso o curación manual) |
| Diagnóstico | UC IPM Pest Notes, UMD Extension | Kindwise plant.health, APS, CABI | Web + API |
| Luz | Thimijan & Heins 1983 (HortScience 18:818–822) para conversiones; UMN para rangos | UT Extension, Illinois | Bibliografía |
| Toxicidad | ASPCA | Pet Poison Helpline | Web |
| Productos (ES) | Registro MAPA | Listas ICEA en datos.gob.es | Web + CSV abierto |
| Meteorología | API meteorológica (p. ej. Open-Meteo, AEMET OpenData) | Segunda API | API REST |

---

## 3. Metodología de doble verificación

Esto es lo que convierte "información de calidad" en un proceso auditable y no en una intención.

### 3.1 Regla de las dos fuentes

Un hecho entra en la base de conocimiento si y solo si:

- Lo afirman **dos fuentes independientes** de tier A o B (independientes = no se citan entre sí ni derivan del mismo documento), **o**
- Lo afirma una fuente A y ninguna fuente A/B lo contradice tras búsqueda activa, y queda marcado `confianza: media` hasta encontrar la segunda.

Cada hecho almacena: `valor`, `fuente_1`, `fuente_2`, `fecha_consulta`, `tier`, `confianza (alta|media|baja)`, `revisor`, `fecha_revisión`.

### 3.2 Resolución de conflictos

Cuando dos fuentes A discrepan (ocurre, p. ej., en rangos de luz):

1. Se guarda el **rango unión** y se marca `discrepancia`.
2. En la recomendación se usa el extremo **más conservador para la planta** (menos agua, menos sol directo, menos producto).
3. Se registra la discrepancia como tarea de revisión humana.

### 3.3 Doble verificación en inferencias de IA

Aplica a identificación de especie y a diagnóstico:

- **Consenso de dos motores independientes** (p. ej. Pl@ntNet + Kindwise, o Kindwise + VLM). Si coinciden a nivel de especie con confianza ≥ umbral → se acepta con etiqueta "verificado por dos modelos". Si coinciden solo a nivel de género → se informa género y se pide foto adicional (hoja, tallo, flor, envés).
- **Umbral de abstención explícito.** Por debajo, el agente dice "no estoy seguro" y propone 2–3 candidatos con lo que los distingue.
- **El diagnóstico nunca es solo visual.** El motor de reglas cruza la hipótesis visual con el historial (¿se regó hace 2 días? ¿se movió de sitio? ¿hay calefacción?) antes de emitir una causa.
- **Feedback loop:** el usuario confirma o corrige; las correcciones alimentan la cola de revisión, no la KB directamente.

### 3.4 Invariantes de seguridad (reglas duras del agente)

1. Nunca recomendar un producto fitosanitario sin comprobar autorización para uso no profesional en el país del usuario.
2. Nunca recomendar trasplante, poda drástica o cambio brusco de luz sin verificar fase fenológica y estado de salud.
3. Si la planta está marcada como tóxica y el perfil declara mascotas o niños, el aviso aparece **antes** de cualquier otra información.
4. Si hay síntomas compatibles con pudrición radicular, la primera recomendación es siempre **suspender riego e inspeccionar raíces**, nunca abonar ni tratar foliarmente.
5. Toda recomendación muestra su cita y su nivel de confianza en la interfaz, no solo en la base de datos.

### 3.5 Ciclo de revisión

- Revisión completa de la KB cada 12 meses; fuentes regulatorias (MAPA, toxicidad) cada 6.
- Cualquier fuente con URL rota o contenido cambiado pasa a `confianza: baja` automáticamente hasta re-verificación.

---

## 4. Modelo de conocimiento (ontología mínima)

```
Taxon (WFO-ID / IPNI-ID)
 ├─ nombre_aceptado, sinónimos[], nombres_comunes{idioma: []}
 └─ Cultivar[] (nombre, fuente_hortícola)

PerfilCuidado (por Taxon o Cultivar)
 ├─ luz: {ppfd_min, ppfd_opt, ppfd_max, dli_min, dli_opt, tolera_sol_directo}
 ├─ agua: {estrategia, indicador_sustrato, sensibilidad_exceso, sensibilidad_defecto}
 ├─ sustrato: {drenaje, componentes_sugeridos, ph}
 ├─ nutricion: {npk_orientativo, frecuencia_en_crecimiento, pausa_en_reposo}
 ├─ clima: {temp_min, temp_opt, temp_max, hr_min, hr_opt}
 ├─ fenologia: {meses_crecimiento, meses_reposo, hemisferio_ref}
 ├─ toxicidad: {perros, gatos, humanos, fuente}
 ├─ propagacion[], plagas_frecuentes[], trastornos_frecuentes[]
 └─ cada campo → Evidencia[] (fuente_1, fuente_2, tier, confianza, fecha)

Trastorno (abiótico | plaga | hongo | bacteria | virus)
 ├─ sintomas[] (localización, patrón, color, textura)
 ├─ confusores[] (otros trastornos con síntomas parecidos)
 ├─ factores_predisponentes[] (exceso riego, HR baja…)
 ├─ tratamiento_cultural[], tratamiento_producto[] (→ Producto)
 └─ Evidencia[]

Producto
 ├─ sustancia_activa, tipo, pais, nº_registro, uso_no_profesional: bool
 ├─ ambito_autorizado (jardinería doméstica interior/exterior)
 └─ fecha_verificacion_registro

Ubicacion (del usuario)
 ├─ orientacion_ventana, distancia_m, obstaculos, cortina
 ├─ medidas_luz[] (lux, hora, método: sensor|cámara|manual)
 ├─ fuentes_calor_frio[]
 └─ hr_estimada, temp_estimada

Planta (instancia del usuario)
 ├─ taxon/cultivar, confianza_identificacion, ubicacion
 ├─ Observacion[] (foto, fecha, métricas derivadas, notas)
 ├─ EventoCuidado[] (riego, abono, trasplante, poda, tratamiento)
 └─ Diagnostico[] (hipótesis, confianza, evidencia, resultado confirmado)

Recomendacion
 ├─ accion, urgencia, justificacion
 ├─ citas[] (→ Evidencia)
 └─ confianza, invariantes_comprobadas[]
```

---

## 5. Métricas físicas: qué medir y con qué limitaciones

### Luz

- **Unidad correcta:** PPFD y DLI. `DLI = PPFD × horas_de_luz × 3600 / 1 000 000`.
- **Conversión lux → PPFD:** depende del espectro. Para luz solar, factor ≈ **0,0185** (equivalente a 1 µmol·m⁻²·s⁻¹ ≈ 54 lux). Referencia bibliográfica de interconversión: Thimijan & Heins (HortScience 18:818–822). **Solo válido para luz solar**; con LED o fluorescente el factor cambia y una conversión única es inexacta por definición.
- **Equivalencias con categorías de extensión universitaria** (1 pie-candela = 10,764 lux):

| Categoría (UT Extension) | pie-candela | lux aprox. | PPFD aprox. (sol) |
|---|---|---|---|
| Baja | 50–250 | 540–2 700 | 10–50 |
| Media | 250–1 000 | 2 700–10 800 | 50–200 |
| Alta | > 1 000 | > 10 800 | > 200 |

- **Sensores del móvil:**
  - **Android:** sensor `TYPE_LIGHT` accesible y devuelve lux, pero está diseñado para ajustar brillo de pantalla, no para fotometría; la precisión varía con la fuente (≈99 % con LED, ≈63 % con incandescente en un estudio) y los fabricantes no publican especificaciones. Útil como **orden de magnitud**, no como medida.
  - **iOS:** **no existe API pública** para el sensor de luz ambiente. SensorKit solo para estudios de investigación aprobados y con retención de 24 h. Única vía: estimación por cámara (fotometría reflectiva, ISO 2720), claramente etiquetada como aproximada.
  - **Consecuencia de diseño:** la medición de luz en la app es **estimación asistida**, combinando sensor/cámara + orientación + hora + estación + posición respecto a ventana, y debe ofrecer integración opcional con un luxómetro o sensor BLE para quien quiera precisión.

### Humedad relativa y temperatura

- Los móviles actuales **no incorporan sensor de humedad** ni de temperatura ambiente fiable `[VERIFICAR: confirmar en documentación oficial Android que TYPE_RELATIVE_HUMIDITY no está presente en dispositivos actuales]`.
- Estrategia: HR exterior desde API meteorológica + modelo de corrección interior (calefacción/aire) + opción de sensor BLE barato (termohigrómetro). El **VPD** (déficit de presión de vapor) es la métrica fisiológicamente relevante y se deriva de T y HR.

### Agua

- No se mide directamente sin sensor de sustrato. Se **infiere**: estimación de evapotranspiración simplificada a partir de luz, temperatura, HR, tamaño de maceta y tipo de sustrato, ajustada con el feedback del usuario ("el sustrato estaba seco / húmedo al revisar"). Opción: sensor capacitivo BLE.

---

## 6. Protocolo fotográfico de control

Para que la serie temporal sea comparable:

1. **Encuadre fijo:** misma distancia y ángulo; la app superpone la silueta de la última foto como guía (*ghost overlay*).
2. **Luz controlada:** misma hora del día o flash desactivado y fondo neutro; opcionalmente **tarjeta de referencia de color/gris** para corregir balance de blancos.
3. **Tres tomas estándar:** planta completa, hoja representativa (haz), envés de la hoja (donde viven araña roja y trips).
4. **Métricas derivadas automáticas:** índices de verdor a partir de RGB (ExG, GLI, VARI) tras corrección de color; conteo aproximado de hojas; proporción de área con decoloración.
5. **Metadatos:** fecha, hora, ubicación en la casa, último riego/abono, medición de luz si existe.

Estas métricas no diagnostican por sí solas; alimentan el motor de diagnóstico como tendencia ("verdor cae 15 % en 3 semanas").

---

## 7. Marco teórico del agente

```
Percepción  →  Estimación de estado  →  Razonamiento  →  Recomendación citada  →  Feedback
(fotos, sensores,  (fase fenológica,     (diagnóstico       (acción + urgencia      (usuario
 calendario, meteo) estrés hídrico,      diferencial +       + cita + confianza      confirma /
                    luz acumulada)       reglas de seguridad) + alternativa)          corrige)
```

- **Diagnóstico diferencial como árbol bayesiano simple:** síntomas observados → lista de hipótesis ponderadas por prevalencia (abiótico > plaga > hongo > virus) y por factores predisponentes del historial → pregunta discriminante al usuario si dos hipótesis siguen empatadas.
- **El modelo de lenguaje no es la fuente de verdad.** Razona sobre la KB verificada y cita; no genera hechos nuevos sin cita. Si la KB no cubre el caso, lo dice.
- **Memoria por planta:** cada planta es un caso clínico con historial; las recomendaciones consideran lo que ya se probó.

---

## 8. Recomendación de productos: marco regulatorio

- En la UE, los fitosanitarios se autorizan por país; en España el **Registro de Productos Fitosanitarios del MAPA** indica en cada autorización si el producto puede usarlo un **usuario no profesional** y en qué ámbito. La norma (RD 1311/2012) incluye explícitamente "jardinería doméstica de interior (plantas de interior, balcones, terrazas)" dentro de los espacios de uso privado. Existen listas abiertas en datos.gob.es (elaboradas por ICEA) separando productos para profesionales y no profesionales.
- **Regla de la app:** priorizar siempre **control cultural y mecánico** (aislar, lavar, retirar manualmente, ajustar riego/luz), después productos de bajo riesgo autorizados para no profesionales (jabón potásico, aceites, azadiractina si autorizada…), y solo mostrar productos registrados para el país del usuario con su número de registro.
- **Fertilizantes y sustratos** tienen otra regulación (abonos, RD de productos fertilizantes); se recomiendan por **tipo y composición**, no por marca, salvo que haya acuerdo comercial declarado como tal.
- Toda recomendación comercial se etiqueta como tal y se separa visualmente del consejo técnico.

---

## 9. Decisiones abiertas (requieren tu criterio)

1. **Alcance geográfico inicial:** ¿España/UE, o global desde el principio? Condiciona la capa de productos y de meteorología.
2. **Dependencia de APIs comerciales:** ¿aceptamos Kindwise (de pago) como motor de salud, o apostamos por VLM + reglas y dataset propio a medio plazo?
3. **Hardware opcional:** ¿contemplamos integración con sensores BLE (luz, humedad de sustrato, termohigrómetro) desde el MVP o en fase 2?
4. **Curación de la KB:** ¿quién revisa? Propuesta: pipeline semiautomático (extracción asistida por LLM desde fuentes tier A) + revisión humana obligatoria antes de publicar cada ficha.
5. **Catálogo inicial:** ¿cuántas especies en v1? Propuesta: las 100–150 plantas de interior más comunes en el mercado español, con ficha completa y doble fuente, antes de ampliar.
6. **Idioma de las fuentes:** casi todo el tier A está en inglés. ¿Se muestra la cita original en inglés o se traduce con nota?

---

## 10. Referencias consultadas (2026-10-20)

**Taxonomía**
- Plants of the World Online (Kew), "About": https://powo.science.kew.org/about
- World Flora Online, snapshots de clasificación: https://list.worldfloraonline.org/

**Identificación y diagnóstico por imagen**
- Pl@ntNet API, precios y condiciones: https://my.plantnet.org/pricing · https://my.plantnet.org/terms_of_use · https://my.plantnet.org/doc/faq
- Kindwise plant.health: https://www.kindwise.com/plant-health · cliente Python: https://pypi.org/project/kindwise-api-client/
- iNaturalist, estado de la API de visión (foro oficial): https://forum.inaturalist.org/t/hidden-computer-vision-api/41775
- Hughes & Salathé, dataset PlantVillage: https://arxiv.org/abs/1511.08060 · Mohanty et al., *Using Deep Learning for Image-Based Plant Disease Detection*: https://arxiv.org/pdf/1604.03169 · TensorFlow Datasets: https://www.tensorflow.org/datasets/catalog/plant_village

**Luz**
- University of Minnesota Extension, *Light requirements for houseplants*: https://extension.umn.edu/houseplants/light-requirements-houseplants
- University of Illinois Extension, *Lighting*: https://extension.illinois.edu/houseplants/lighting
- University of Tennessee Extension, *Lighting Indoor Houseplants*: https://uthort.tennessee.edu/wp-content/uploads/sites/228/2023/11/g06515%20Lighting%20Indoor%20Houseplants.pdf
- Thimijan & Heins, *Photometric, Radiometric, and Quantum Light Units of Measure*, HortScience 18:818–822 (citado vía https://hortamericas.com/grower-resources/conversion-ppfd-to-lux/)
- Conversión lux↔PPFD y sus límites: https://www.cutter.com.au/horticulture-design/what-is-ppfd-and-dli/
- Apple Developer Forums, ausencia de API de luz ambiente: https://developer.apple.com/forums/thread/850773 · https://developer.apple.com/forums/thread/81806

**Diagnóstico y manejo**
- UC IPM, *Houseplant Problems*: https://ipm.ucanr.edu/home-and-landscape/houseplant-problems/ · Pest Note PDF: https://ipm.ucanr.edu/legacy_assets/pdf/pestnotes/pnhouseplantproblems.pdf
- UC IPM, exceso/defecto de agua: https://ipm.ucanr.edu/PMG/GARDEN/FLOWERS/ENVIRON/waterexdef.html
- University of Maryland Extension, *Diagnose indoor plant problems* (act. feb. 2025): https://extension.umd.edu/resource/diagnose-indoor-plant-problems

**Seguridad y regulación**
- ASPCA, *Toxic and Non-Toxic Plants*: https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants
- MAPA, nota informativa sobre usos profesionales y no profesionales: https://www.mapa.es/es/agricultura/temas/sanidad-vegetal/notainformativareferentealosusosprofesionalesyusosnoprofesionalesdeproductosfitosanitarios_3__tcm30-440562.pdf
- MAPA, nota informativa sobre usos no agrarios: https://www.mapa.es/es/agricultura/temas/sanidad-vegetal/notainformativareferentealosusosnoagrariosdeproductosfitosanitarios_3__tcm30-440561.pdf
- datos.gob.es, Registro de Productos Fitosanitarios (listas ICEA): https://datos.gob.es/es/aplicaciones/registro-de-productos-fitosanitarios
