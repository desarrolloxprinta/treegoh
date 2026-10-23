# Fase 4 — Productos y herramientas en España

Salida: `output/logica/productos.md`. Sin marcas salvo evidencia clara de superioridad. Cada afirmación con confianza y fuentes.

## Si existe `output/research/fase-4.md` (informe de Research de Claude desktop)
Úsalo como material de partida en vez de investigar desde cero:
1. Léelo entero. Abre con WebFetch TODAS las citas de la sección de fitosanitarios (el estado legal de cada sustancia es crítico) y una muestra de al menos 10 del resto. Si una URL no existe o no dice lo que se le atribuye, elimina la cita y baja la confianza.
2. Vuélcalo en `output/logica/productos.md` con el formato de tabla de abajo. No resumas.
3. Completa con búsqueda propia lo que el informe deje corto, en especial el Registro de Productos Fitosanitarios del MAPA.
4. Pasa sus secciones "Contradicciones" y "Lagunas" a `output/contradicciones.md` y `output/lagunas.md`.

## Categorías a cubrir
1. Sustratos y enmiendas: turba, fibra de coco, perlita, vermiculita, corteza de pino, carbón activo, arena, akadama, pómice, esfagno. Para cada uno: función, proporciones típicas por categoría de planta (aroideas, suculentas, orquídeas, carnívoras, aromáticas), cuándo evitarlo.
2. Fertilizantes: líquido, granulado de liberación lenta, orgánico, foliar. NPK orientativo por categoría de planta, frecuencia por estación, señales de exceso y de carencia, riesgo de quemado.
3. Fitosanitarios de uso doméstico autorizados en España y la UE: jabón potásico, aceite de neem (situación legal actual en la UE: verifícala), aceites minerales y parafínicos, piretrinas, Bacillus thuringiensis, azufre, cobre, fungicidas sistémicos domésticos. Consulta el Registro de Productos Fitosanitarios del MAPA. Indica ingrediente activo, plaga objetivo, dosis según etiqueta, precauciones, uso en interior con mascotas y niños.
4. Control biológico en interior: ácaros depredadores (Phytoseiulus, Amblyseius), nematodos para sciáridos, trampas cromáticas.
5. Medición: medidores de humedad del sustrato (fiabilidad real), luxómetros y apps de luz, higrómetros, termómetros.
6. Ambiente: humidificadores (tipos, cuál conviene, mantenimiento), bandejas de guijarros (evidencia real de su efecto), lámparas de cultivo (espectro, PPFD, distancia, horas, cuándo compensa).
7. Macetas: material (terracota, plástico, cerámica esmaltada, autorriego), tamaño al trasplantar, drenaje, plato.
8. Agua: calidad del agua de Madrid (dureza, cloro, fluoruros) y su efecto en especies sensibles (Calathea, Dracaena, carnívoras), alternativas (reposo, filtrada, lluvia, osmosis).

## Formato
Tabla por categoría: producto/ingrediente → para qué → cuándo sí → cuándo no → precauciones → confianza → fuentes.

## Al terminar
Contradicciones y lagunas a sus archivos. `python scripts/validar.py`. Marca Fase 4 en `ESTADO.md`.
