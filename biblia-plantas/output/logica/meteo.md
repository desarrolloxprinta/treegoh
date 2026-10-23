# Lógica meteorológica de ajuste de cuidado

Este documento explica la lógica que hay detrás de `reglas-meteo.json`: qué datos entran, cómo se combinan las reglas, cómo se resuelve el caso de Madrid y cómo se traslada a cualquier otra ubicación. Cada afirmación lleva su nivel de confianza (Alta / Media / Baja) y las fuentes entre corchetes `[Fn]`, con los mismos identificadores que el JSON. Las URL de todas las fuentes se abrieron y se comprobaron el 20 de octubre de 2026.

Principio rector: **ninguna regla riega por sí sola**. Las reglas recalculan el intervalo de riego, mueven la planta, suspenden el abono o avisan; la decisión final de regar siempre pasa por comprobar el sustrato. Un error de riego mata más plantas de interior que cualquier otra causa, y las fuentes de extensión universitaria insisten en comprobar la tierra antes de regar en lugar de seguir un calendario (Alta) [F19] [F14] [F16].

## 1. Qué datos entran y de dónde

### 1.1 Los cuatro orígenes de datos

El JSON distingue cuatro orígenes (`origen`) para cada condición:

| Origen | Qué aporta | Variables típicas | Fiabilidad |
|---|---|---|---|
| `api_meteo` | Predicción y observación exterior para el municipio | `temp_exterior`, `lluvia`, `viento`, `radiacion_uv`, `ola_calor`, `ola_frio`, `humedad_relativa_exterior` | Alta para temperatura y precipitación; el índice UV se predice para cielo despejado y hay que corregirlo si hay nubes (Alta) [F9] |
| `sensor_movil` | Medida directa en la habitación (termómetro/higrómetro Bluetooth, sensor del teléfono o lectura manual) | `temp_interior`, `humedad_relativa_interior` | La mejor fuente para el interior; sin sensor se sustituye por `calculado` |
| `usuario` | Estado declarado por la persona | `calefaccion_activa`, `aire_acondicionado_activo`, orientación de la ventana, si la planta está en balcón | Fiable si se pregunta en el momento oportuno (inicio de temporada) |
| `calculado` | Valores derivados por la app | `horas_sol` (de las normales climatológicas o de la predicción), HR interior estimada cuando no hay sensor | Media: es un modelo, se explica en 1.3 |

### 1.2 Fuente exterior para España: AEMET OpenData y alternativas

Para España la fuente de referencia es **AEMET OpenData**, el sistema de difusión y reutilización de la información de AEMET. Requiere una clave API gratuita que se solicita con un correo electrónico y ofrece dos vías: un acceso general (interfaz gráfica) y una API para peticiones programadas desde cualquier lenguaje (Alta) [F11] [F12]. Los grupos de datos que interesan a la app son, según la descripción oficial de los conjuntos de datos de alto valor (Alta) [F12]:

- **Observación convencional**: variables horarias de las estaciones, actualizadas dos veces por hora. Sirve para `temp_exterior`, `humedad_relativa_exterior`, `viento` y `lluvia` observados.
- **Predicción específica por municipio**: máximas, mínimas, probabilidad de precipitación, viento e índice UV previstos. Es la entrada principal de `api_meteo`.
- **Valores climatológicos**: climatologías diarias, mensuales/anuales, **valores normales** y extremos registrados. Las normales alimentan `horas_sol` calculado y el calendario del apartado 3.
- **Avisos** (Meteoalerta): niveles amarillo, naranja y rojo por zona, con umbrales publicados por AEMET (Alta) [F6] [F7].

Las olas de calor y de frío, tal y como las define AEMET, se determinan **a posteriori** con un criterio climatológico (ver 3.2), no se emiten como aviso en tiempo real (Alta) [F50] [F2]. Por eso la variable `ola_calor` de la app se activa con un proxy a priori: AEMET emite un aviso especial cuando prevé que se superen los umbrales naranja o rojo de Meteoalerta en al menos el 10 % de las zonas durante al menos tres días de un periodo de cuatro (Alta) [F50]. La app marca `ola_calor = true` cuando (a) existe aviso especial de AEMET, o (b) la predicción municipal da tres o más días consecutivos con máxima igual o superior al umbral amarillo de la zona (36 °C en Madrid Metropolitana) (Alta para los umbrales) [F6]. Lo mismo para `ola_frio` con el umbral amarillo de mínimas (-4 °C en Madrid Metropolitana) (Alta) [F6].

Fuera de España, cualquier API meteorológica que entregue máximas y mínimas diarias, precipitación, racha de viento e índice UV por coordenadas es válida; lo único que cambia son los umbrales locales (apartado 4). Las normales climatológicas las publica el servicio meteorológico nacional de cada país (en Argentina el SMN, por ejemplo) (Media) [F57].

### 1.3 Qué datos de interior se infieren y cómo

Cuando no hay sensor en casa, la app estima la temperatura y la humedad interiores con un modelo simple y deliberadamente conservador. Es una **aproximación de orden de magnitud**, no una medida, y por eso toda regla disparada con un valor `calculado` se presenta al usuario como pregunta ("¿tienes la calefacción puesta? ¿cuánto marca el termómetro?") y no como hecho.

**Temperatura interior estimada**

- Sin climatización: `temp_interior ≈ media de (máxima + mínima exteriores) / 2 + 2 °C`, acotada entre 12 °C y 32 °C. La inercia térmica de un piso amortigua los extremos; el +2 °C recoge las ganancias internas.
- Con `calefaccion_activa = true`: 19-22 °C en las horas de funcionamiento. La referencia oficial de consigna en viviendas es 21 °C (IDAE, citado por una fuente complementaria) (Baja) [F55]. Fuera del horario de calefacción la temperatura cae hacia el valor "sin climatización".
- Con `aire_acondicionado_activo = true`: 24-26 °C en la habitación climatizada.
- Habitaciones sin calefacción, galerías y balcones acristalados: se usa la mínima exterior + 4 °C, porque son los espacios donde se produce el daño por frío en interior (regla M07).

**Humedad relativa interior estimada**

- Sin climatización, la HR interior sigue a la exterior con un retraso de horas y una reducción de 5-10 puntos cuando se calienta el aire. En Madrid eso da 55-65 % en invierno sin calefacción y 30-40 % en verano (normales de HR exterior: 71-74 % de noviembre a enero, 38-41 % en julio-agosto) (Alta para las normales) [F1].
- Con calefacción, la HR interior **cae al 10-30 %**. Varias fuentes de extensión coinciden: la Universidad de Kentucky da 10-20 % en casas calefactadas en invierno frente al 40-50 % ideal (Alta) [F16]; Iowa State da los mismos 10-20 % [F25]; Purdue dice que no es raro bajar al 15 % en la temporada de calefacción [F27]; Illinois sitúa el aire invernal "por debajo del 30 %" [F17]; Penn State recuerda que la ASHRAE recomienda 30-60 % para personas y que la calefacción lo baja fácilmente de 30 % [F24]. La app asume **25 %** como valor central cuando la calefacción está activa y no hay higrómetro (regla M18).
- Con aire acondicionado, el aire es frío y seco: se asume 35-45 % y, sobre todo, un flujo directo que deshidrata (Alta) [F17] [F42] [F41].

**Límites del modelo**. (1) No conoce la orientación ni el aislamiento de la vivienda; un ático al sur en julio puede superar 32 °C. (2) No distingue habitaciones. (3) La HR depende de la ocupación, la cocina y la ducha. Por eso la app pide un higrómetro de 10 € a quien tenga calateas, helechos o aráceas: es el dato que más cambia el cuidado y el más barato de medir. Toda regla basada en valores `calculado` tiene prioridad ≥ 2 y se confirma con el usuario.

**Horas de sol** (`horas_sol`) se calcula como horas de insolación normales del mes dividido entre los días del mes, a partir de las normales de la estación de referencia (Alta) [F1]. Para Madrid-Retiro: 4,8 h/día en enero, 5,6 en febrero, 6,8 en marzo, 7,7 en abril, 8,6 en mayo, 10,5 en junio, 11,5 en julio, 10,7 en agosto, 8,6 en septiembre, 4,8 en noviembre y 4,0 en diciembre (octubre no tiene valor publicado en la ficha de AEMET; se interpola 6,5). Si la API diaria aporta insolación observada, prevalece sobre la normal.

## 2. Cómo se combinan las reglas

### 2.1 Evaluación diaria y prioridad

Cada día, con la predicción del municipio y el estado declarado, la app evalúa las 28 reglas para cada planta según su categoría (`afecta_a.categorias`) y sus excepciones. Las reglas tienen `prioridad` de 1 (más importante) a 5. La prioridad decide (a) qué aviso se muestra primero, (b) qué acción gana cuando dos reglas piden ubicaciones distintas para la misma planta. Las prioridades 1 son las que evitan daños irreversibles: frío por debajo de 10 °C para tropicales (M05), helada (M06), interior por debajo de 12 °C (M07), ola de frío (M08), calor extremo en balcón (M02) y ola de calor (M03).

### 2.2 Acumulación de factores de riego

Las reglas de tipo `multiplicar_frecuencia_riego` no se aplican una a una, sino que se **multiplican** sobre la frecuencia base de la ficha de la especie:

`frecuencia_ajustada = frecuencia_base × Π(factores activos)`

donde un factor 1,3 significa un 30 % más de frecuencia (intervalo entre riegos más corto) y 0,7 un 30 % menos. El producto se acota con un **tope mínimo de 0,5** (nunca menos de la mitad de la frecuencia base) y un **tope máximo de 2,0** (nunca más del doble).

**Nota de compatibilidad con `calendario.md`**: el modelo de recordatorios de `calendario.md` §4 expresa sus factores sobre el **intervalo en días** (1,5 = esperar un 50 % más), mientras que las reglas de este archivo los expresan sobre la frecuencia. La equivalencia es `factor_intervalo = 1 / factor_frecuencia`. La app debe elegir un único convenio (se recomienda el de intervalo, que es lo que ve el usuario) y convertir las reglas al cargarlas (ver `contradicciones.md`, C30). Ejemplos:

- Enero en Madrid, piso con calefacción, calatea: M17 (0,85) × M22 (0,7) = 0,595. Si la ficha dice "cada 7 días", el intervalo pasa a unos 12 días. La app muestra "comprueba el sustrato hacia el día 10-12".
- Julio, balcón, 36 °C y viento: M01 (1,3) × M02 (sombrear, sin factor) × M09 no aplica (es interior). Factor 1,3: "cada 2 días" pasa a "cada 1,5 días", es decir, comprobar a diario y regar si está seco.
- Interior en julio a 29 °C sin aire acondicionado: M09 (1,2). Intervalo de 7 días pasa a unos 6.

El intervalo resultante es siempre una **fecha de comprobación**, no una orden de riego: "toca comprobar el sustrato" (Alta) [F19] [F14] [F16]. El riego solo se marca como hecho cuando el usuario confirma que la tierra estaba seca a 2-3 cm y ha regado. Si la tierra estaba húmeda, la app retrasa la siguiente comprobación 2 días y aprende.

### 2.3 Cuando dos reglas se contradicen

La norma es **la opción menos irreversible gana**:

1. Entre "regar más" y "regar menos", gana "regar menos" y se añade una comprobación del sustrato. Una planta seca se recupera casi siempre; una con podredumbre radicular rara vez (Alta) [F36] [F19]. Ejemplo: calor interior (M09, 1,2) con calefacción activa en una vivienda en marzo (M17, 0,85): el producto es 1,02, es decir, neutro, y la app pide comprobar el sustrato.
2. Entre dos ubicaciones, gana la de mayor prioridad; a igual prioridad, gana el interior (ni sol directo, ni viento, ni frío). Ejemplo: M25 (UV alto: sombra) y M24 (viento: pegar a la pared): se cumplen ambas en un rincón sombreado y resguardado.
3. Entre abonar (M26) y suspender abonado (M04, M10, M21), siempre gana suspender. No abonar nunca ha matado una planta de interior en un mes; abonar en estrés sí quema raíces (Alta) [F31] [F32] [F33].
4. Entre aumentar humedad (M12, M18) y ventilar por humedad alta (M14, M15), gana ventilar: el higrómetro manda, y la estimación por calefacción se descarta si el sensor mide más de 60 %.
5. Si una regla depende de un valor `calculado` y otra de un `sensor_movil`, gana la del sensor.

### 2.4 Lo que la app nunca hace sola

- No riega ni programa riegos automáticos: recalcula el intervalo y pide comprobar el sustrato.
- No da por buena una estimación de interior sin confirmarla con el usuario al menos una vez por temporada.
- No aplica una regla de balcón a plantas que el usuario tiene dentro de casa, ni al revés: la ubicación de cada planta es un dato del usuario y se pregunta al cambiar de estación (mayo y octubre en Madrid).
- No presenta como afirmación nada con confianza Baja.

## 3. Madrid como caso resuelto

### 3.1 Normales climatológicas de Madrid-Retiro (3195)

AEMET publica en su web la ficha de valores climatológicos normales de la estación Madrid, Retiro (indicativo 3195, 667 m) para el periodo **1981-2010** (Alta) [F1]. Se intentó obtener la tabla mensual completa 1991-2020 de la estación; la ficha pública sigue mostrando 1981-2010 y los documentos de AEMET con la referencia 1991-2020 solo publican valores anuales (temperatura media normal de Retiro 1991-2020: **15,4 °C**, frente a 15,0 °C en 1981-2010) (Alta) [F13]. Se usa por tanto la tabla 1981-2010 y se anota la laguna. Para la lógica de la app la diferencia (+0,4 °C en la media anual) no cambia ningún umbral.

| Mes | T media (°C) | Media máximas (°C) | Media mínimas (°C) | Precipitación (mm) | Días ≥1 mm | HR media (%) | Días de helada | Horas de sol | Sol h/día |
|---|---|---|---|---|---|---|---|---|---|
| Enero | 6,3 | 9,8 | 2,7 | 33 | 5,7 | 71 | 6,2 | 149 | 4,8 |
| Febrero | 7,9 | 12,0 | 3,7 | 34 | 5,2 | 65 | 3,0 | 158 | 5,6 |
| Marzo | 11,2 | 16,3 | 6,2 | 25 | 4,1 | 55 | 1,0 | 211 | 6,8 |
| Abril | 12,9 | 18,2 | 7,7 | 45 | 6,7 | 56 | 0,1 | 230 | 7,7 |
| Mayo | 16,7 | 22,2 | 11,3 | 50 | 7,3 | 53 | 0,0 | 268 | 8,6 |
| Junio | 22,2 | 28,2 | 16,1 | 21 | 3,4 | 44 | 0,0 | 315 | 10,5 |
| Julio | 25,6 | 32,1 | 19,0 | 12 | 1,7 | 38 | 0,0 | 355 | 11,5 |
| Agosto | 25,1 | 31,3 | 18,8 | 10 | 1,7 | 41 | 0,0 | 332 | 10,7 |
| Septiembre | 20,9 | 26,4 | 15,4 | 22 | 3,3 | 50 | 0,0 | 259 | 8,6 |
| Octubre | 15,1 | 19,4 | 10,7 | 60 | 6,9 | 64 | 0,0 | sin dato | ~6,5 (interpolado) |
| Noviembre | 9,9 | 13,5 | 6,3 | 58 | 6,5 | 71 | 0,9 | 144 | 4,8 |
| Diciembre | 6,9 | 10,0 | 3,6 | 51 | 6,8 | 74 | 4,5 | 124 | 4,0 |
| **Año** | **15,0** | **19,9** | **10,1** | **421** | **59,4** | **57** | **15,7** | — | — |

Fuente: AEMET, valores climatológicos normales 1981-2010, Madrid Retiro (Alta) [F1]. Extremos de referencia: 40,0 °C el 21 de agosto de 2023 y -1,8 °C el 23 de enero de 2023 [F13]; mínima absoluta de la serie (desde 1893) -10,1 °C en enero de 2021 (Filomena) [F5]; mínima nocturna más alta de un mes de julio 26,2 °C el 14 de julio de 2022 [F2].

Lectura para la app: Madrid es un clima **mediterráneo continental**: veranos muy calurosos y secos (HR 38-41 %, 10-12 mm/mes), inviernos fríos con heladas frecuentes (unas 16 noches al año, concentradas de diciembre a febrero) y dos picos de lluvia en abril-mayo y octubre-diciembre.

### 3.2 Umbral de ola de calor y de ola de frío de AEMET para Madrid

**Ola de calor**. AEMET la define como un episodio de al menos tres días consecutivos en que como mínimo el 10 % de las 137 estaciones consideradas (6 en Canarias) registran máximas por encima del percentil 95 de su serie de máximas diarias de julio y agosto de 1971-2000; dos olas separadas por un solo día se consideran una (Alta) [F2] [F3] [F4]. Cada estación tiene su propia temperatura umbral: es la menor de las 93 máximas más altas de los 1.860 días de julio-agosto del periodo de referencia [F2]. Desde la revisión de octubre de 2023 el análisis cubre los 365 días del año y no solo de junio a septiembre [F3].

**LAGUNA documentada**: el estudio de AEMET presenta las temperaturas umbral por estación únicamente como un mapa (Figura 2, "Temperatura umbral (°C) para la determinación de olas de calor"), no como tabla; ni el PDF ni el blog dan la cifra de Madrid-Retiro en texto [F2] [F3] [F50]. No se ha encontrado ninguna fuente prioritaria que publique el valor numérico del umbral de Retiro, así que **no se incluye un número**. Para la lógica de la app no es necesario: `ola_calor` se activa por el aviso especial de AEMET o por el proxy de Meteoalerta descrito en 1.2. Como referencia de orden de magnitud, los umbrales de aviso Meteoalerta para la zona "Metropolitana y Henares" son 36 °C (amarillo), 39 °C (naranja) y 42 °C (rojo) para máximas, y -4 / -8 / -12 °C para mínimas (Alta) [F6]; la zona "Sierra de Madrid" tiene 34 / 37 / 40 °C y -6 / -10 / -14 °C [F6].

**Ola de frío**. Definición simétrica: al menos tres días consecutivos en que al menos el 10 % de las 131 estaciones consideradas (Canarias excluida por lo suave de sus temperaturas) registran mínimas por debajo del percentil 5 de su serie de mínimas diarias de enero y febrero de 1971-2000 (Alta) [F5] [F4] [F52]. El umbral de Retiro tampoco se publica en texto (misma laguna). En el invierno 2024-2025 hubo una sola ola de frío, del 13 al 15 de enero [F4]; en el verano de 2025 hubo tres olas de calor (18 junio-4 julio, 15-17 julio y 3-18 agosto), 36 días en total [F4].

### 3.3 Temporada de calefacción y de aire acondicionado en Madrid

No existe una fecha oficial: en los edificios con calefacción central la decide la junta de propietarios, que fija inicio, fin y horario (Media, dos fuentes complementarias coherentes) [F55] [F54]. El encendido "suele producirse a finales de octubre" [F54]; el Colegio de Administradores de Fincas de Madrid recomienda acortar la temporada "si las condiciones meteorológicas lo permiten" y reducir el horario, lo que confirma que la temporada es larga y ajustable [F56]. Cruzado con las normales (media de mínimas por debajo de 8 °C de noviembre a abril) [F1], la app asume por defecto para Madrid:

- **Calefacción**: del 1 de noviembre al 15 de abril, con pregunta al usuario a finales de octubre y a principios de abril. Durante este periodo se activan M16, M17 y M18.
- **Aire acondicionado**: del 15 de junio al 15 de septiembre en las viviendas que lo tienen (media de máximas ≥ 28 °C de junio a agosto) [F1]. Se pregunta al usuario a mediados de junio. Activa M19.

### 3.4 Humedad relativa interior en invierno con calefacción

Con calefacción encendida, el aire interior de Madrid queda entre el 15 y el 30 % de HR: la HR exterior invernal es alta (71-74 %) [F1], pero al calentar aire de 5 °C a 21 °C su humedad relativa se desploma; las fuentes de extensión miden 10-20 % [F16] [F25], "hasta el 15 %" [F27] y "por debajo del 30 %" [F17] en viviendas calefactadas de climas continentales comparables (Alta). Es el dato que explica por qué calateas, helechos y aráceas pierden puntas en enero aunque se rieguen bien: el objetivo para estas plantas es 40-50 % [F16] [F25] [F14], y Purdue sitúa en 35-45 % el ideal de la mayoría [F27]. Lo que funciona, por orden de eficacia: humidificador (la opción más eficaz según Purdue, Iowa State y Penn State) [F27] [F25] [F24], agrupar plantas [F24] [F25] [F28], bandeja de guijarros con agua sin que la maceta toque el agua (efecto pequeño y local; Penn State lo considera casi despreciable para la habitación) [F25] [F24]. **Pulverizar no sirve**: la subida de humedad dura minutos [F24] [F26] [F27] [F41] y las hojas constantemente mojadas favorecen manchas foliares [F28] (Alta).

### 3.5 Calendario de disparo esperado en Madrid (mes × reglas)

Leyenda: ● se dispara la mayoría de los días o del periodo; ◐ se dispara algunos días o en episodios; ○ posible pero raro; — no aplica.

| Regla | Ene | Feb | Mar | Abr | May | Jun | Jul | Ago | Sep | Oct | Nov | Dic | Base del cálculo |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M01 Calor ≥30 °C balcón | — | — | — | — | ○ | ◐ | ● | ● | ◐ | — | — | — | Media de máximas 28,2 / 32,1 / 31,3 / 26,4 °C (jun-sep) [F1] |
| M02 Calor ≥35 °C balcón | — | — | — | — | — | ○ | ◐ | ◐ | ○ | — | — | — | Aviso amarillo a 36 °C [F6] |
| M03 Ola de calor AEMET | — | — | — | — | — | ◐ | ◐ | ◐ | ○ | — | — | — | 1-3 olas por verano [F4] |
| M04 ≥32 °C: no abonar | — | — | — | — | — | ◐ | ● | ● | ○ | — | — | — | [F1] |
| M05 Noche <10 °C: tropicales dentro | ● | ● | ● | ● | ◐ | — | — | — | — | ◐ | ● | ● | Media de mínimas 10,7 (oct), 11,3 (may) [F1] |
| M06 ≤5 °C / helada | ● | ● | ◐ | ○ | — | — | — | — | — | ○ | ◐ | ● | Días de helada 6,2 / 3,0 / 1,0 / 0,9 / 4,5 [F1] |
| M07 Interior <12 °C | ◐ | ◐ | ○ | — | — | — | — | — | — | — | ○ | ◐ | Habitaciones sin calefacción |
| M08 Ola de frío AEMET | ◐ | ◐ | — | — | — | — | — | — | — | — | — | ○ | 0-2 por invierno [F4] [F5] |
| M09 Interior ≥28 °C | — | — | — | — | — | ◐ | ● | ● | ◐ | — | — | — | Sin aire acondicionado |
| M10 Interior ≥30 °C: no abonar | — | — | — | — | — | ○ | ◐ | ◐ | ○ | — | — | — | Olas de calor |
| M11 Interior <15 °C | ● | ● | ◐ | ○ | — | — | — | — | — | — | ◐ | ● | Sin calefacción |
| M12 HR interior <40 % | ● | ● | ● | ◐ | ○ | ◐ | ● | ● | ◐ | ○ | ● | ● | Calefacción (10-30 %) y verano seco (38-41 % ext.) [F1] [F16] |
| M13 HR interior <30 % | ● | ● | ◐ | ○ | — | ○ | ◐ | ◐ | — | — | ◐ | ● | Calefacción central muchas horas |
| M14 HR interior >70 % | ○ | ○ | — | — | — | — | — | — | — | ○ | ○ | ○ | Baños, pisos sin calefacción |
| M15 HR interior ≥85 % | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | Terrarios, miniinvernaderos |
| M16 Calefacción: alejar radiadores | ● | ● | ● | ◐ | — | — | — | — | — | ○ | ● | ● | Temporada nov-abr [F54] [F55] |
| M17 Calefacción: riego ×0,85 | ● | ● | ● | ◐ | — | — | — | — | — | ○ | ● | ● | Idem |
| M18 Calefacción: HR estimada | ● | ● | ● | ◐ | — | — | — | — | — | ○ | ● | ● | Idem |
| M19 Aire acondicionado | — | — | — | — | — | ◐ | ● | ● | ◐ | — | — | — | Jun-sep |
| M20 Sol tras cristal sur (≥10 h) | — | — | — | — | — | ● | ● | ● | — | — | — | — | 10,5 / 11,5 / 10,7 h/día [F1] |
| M21 Días cortos: no abonar (<5 h) | ● | ○ | — | — | — | — | — | — | — | — | ● | ● | 4,8 / 5,6 / 4,8 / 4,0 h/día [F1] |
| M22 Días cortos: riego ×0,7 | ● | ○ | — | — | — | — | — | — | — | — | ● | ● | Idem |
| M23 Lluvia ≥5 mm balcón | ◐ | ◐ | ◐ | ● | ● | ○ | ○ | ○ | ○ | ● | ● | ● | Días ≥1 mm: 6,7-7,3 (abr-may), 6,5-6,9 (oct-dic) [F1] |
| M24 Viento ≥40 km/h | ○ | ○ | ◐ | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ◐ | ◐ | Sin normal publicada (laguna) |
| M25 UV ≥8: aclimatar | — | — | — | ○ | ◐ | ● | ● | ● | ◐ | — | — | — | Categoría "muy alto" 8-10 [F8] [F9]; sin climatología UVI abierta (laguna) |
| M26 Abonado (≥7 h sol) | — | — | ○ | ● | ● | ● | ●* | ●* | ● | ○ | — | — | *cortado por M04/M10 en picos de calor |
| M27 Calor seco: araña roja | ● | ● | ◐ | ○ | — | ◐ | ● | ● | ◐ | ○ | ◐ | ● | HR interior <50 % [F29] [F30] [F27] |
| M28 Noches 10-13 °C | — | — | ○ | ◐ | ◐ | — | — | — | ○ | ● | ○ | — | Media de mínimas 10,7 (oct), 11,3 (may), 7,7 (abr) [F1] |

Dos consecuencias prácticas del calendario: la **ventana para tener tropicales en el balcón** en Madrid va de mediados de mayo a principios de octubre (M05/M28), con aclimatación progresiva al sacarlas (M25) [F20] [F21] [F22] [F23]; y el **invierno de interior** (noviembre-marzo) combina tres reglas que empujan en la misma dirección: menos riego (M17 × M22 = 0,6), sin abono (M21) y más humedad (M12/M18).

## 4. Cómo se adapta a otra ubicación

Las reglas no cambian; cambian los **parámetros** que las disparan. Para trasladar la lógica a otra ciudad hay que fijar siete cosas:

1. **Hemisferio**. En el hemisferio sur las estaciones se invierten: `verano` = diciembre-febrero, `invierno` = junio-agosto. La app guarda las estaciones por nombre y resuelve los meses por hemisferio, de modo que M21/M22 (días cortos) se disparan en junio-julio en Buenos Aires y M03 (ola de calor) en enero.
2. **Normales climáticas locales** de la estación más cercana: media de máximas y mínimas, precipitación, días de helada, HR y horas de sol. Alimentan `horas_sol` calculado, la ventana de balcón (M05/M28) y el calendario de expectativas.
3. **Umbral local de ola de calor/frío**: en España, la definición de AEMET es por percentiles de cada estación [F2] [F5]; en otros países cada servicio tiene su definición (Italia por ciudades, Francia con un indicador nacional de 25,3 °C, Suecia con 5 días ≥30 °C, etc.) [F50]. La app usa como proxy universal "tres días seguidos con máxima ≥ umbral amarillo local o ≥ percentil 95 local".
4. **Temporada de calefacción y de aire acondicionado**: se deriva de las normales (calefacción cuando la media de mínimas baja de 8-10 °C; aire acondicionado cuando la media de máximas supera 28 °C) y se confirma con el usuario.
5. **Tipo de clima**: oceánico (HR alta todo el año, poca amplitud térmica: las reglas de humedad baja casi no se disparan y las de humedad alta y lluvia sí), continental (grandes amplitudes: se disparan todas), mediterráneo litoral (inviernos suaves, HR alta en verano), tropical (sin invierno: M05-M08, M21, M22 nunca se disparan; M14/M15 y M27 son las dominantes).
6. **Índice UV local**: en latitudes bajas o en altura el UVI "muy alto" (8-10) y "extremo" (≥11) son habituales incluso fuera del verano [F9] [F53].
7. **Umbrales de aviso locales** (equivalentes a Meteoalerta) para M02, M06 y M24.

Ejemplos rápidos con normales AEMET 1981-2010 (Alta para los datos) [F46] [F47] [F48] [F49] y SMN para Buenos Aires (Media) [F57]:

| Ciudad | Ene: T / máx / mín (°C) | Jul: T / máx / mín (°C) | Precipitación anual (mm) | HR anual (%) | Qué cambia respecto a Madrid |
|---|---|---|---|---|---|
| **Barcelona** (aeropuerto, 0076) [F46] | 9,2 / 13,6 / 4,7 | 23,9 / 28,0 / 19,8 | 588 | 69 | Mediterráneo litoral. M05 de noviembre a marzo (mínimas 4,7 °C en enero); M01 pocas veces (máximas 28 °C en julio); M12 casi nunca sin calefacción (HR 67-73 % todo el año); M27 solo con calefacción; calefacción más corta (diciembre-marzo). |
| **Bilbao** (aeropuerto, 1082) [F47] | 9,3 / 13,4 / 5,1 | 20,4 / 25,4 / 15,4 | 1.134 | 70 | Oceánico. M23 (lluvia) domina todo el año (120 mm en enero, 107 en abril); M01/M02 rarísimas; M14 (HR >70 %) frecuente en pisos sin calefacción; M05 diciembre-febrero; M25 (UV ≥8) solo en pleno verano. |
| **Sevilla** (aeropuerto, 5783) [F48] | 10,9 / 16,0 / 5,7 | 28,2 / 36,0 / 20,3 | 539 | 59 | Mediterráneo continental cálido. M02 (≥35 °C) se dispara la **mayoría de los días** de julio-agosto (media de máximas 36,0 °C); M04 todo el verano; M09/M10 muy frecuentes; M05 diciembre-febrero; calefacción corta (diciembre-febrero); M23 concentrada en otoño-invierno (66 mm en enero, 2 mm en julio). Los umbrales de aviso de Sevilla son distintos de los de Madrid y hay que tomarlos de la tabla de Meteoalerta [F6]. |
| **Canarias** (Santa Cruz de Tenerife, C449C) [F49] | 18,2 / 21,0 / 15,4 | 25,0 / 28,7 / 21,2 | 226 | 63 | Subtropical oceánico. M05, M06, M07, M08, M21 y M22 **no se disparan nunca** (mínima de enero 15,4 °C; 32 mm en enero); no hay temporada de calefacción; las tropicales pueden vivir en balcón todo el año; dominan M12 (en verano con HR 58 %), M19, M25 (UV alto gran parte del año) y M27. Canarias queda fuera del estudio de olas de frío de AEMET [F5]. |
| **Buenos Aires** (Observatorio Central, SMN) [F57] | 24,9 / — / — | 11,0 / — / — | 1.236 | — | Hemisferio sur, subtropical húmedo. Estaciones invertidas: M03/M01/M09 en diciembre-febrero, M21/M22 y la calefacción en junio-agosto; M05 posible en junio-agosto en noches frías (media de julio 11,0 °C); M23 y M14/M15 frecuentes todo el año por la lluvia abundante y la humedad; M25 muy relevante en diciembre-enero. Datos de 1981-2010 según el SMN citado por una fuente complementaria: se marcan como Media hasta abrir la ficha del SMN (el acceso directo devolvió error 403). |

## 5. Tabla resumen de reglas

| ID | Nombre | Condición | Ajuste | Categorías | Estaciones | Confianza | Fuentes |
|---|---|---|---|---|---|---|---|
| M01 | Calor exterior fuerte en balcón | temp_exterior ≥ 30 °C (api) | riego ×1,3 | balcon_exterior | prim., ver., oto. | Alta | F33, F35, F32, F1 |
| M02 | Calor extremo en balcón | temp_exterior ≥ 35 °C (api) | sombrear; riego mañana y tarde | balcon_exterior | verano | Alta | F33, F34, F6, F35 |
| M03 | Ola de calor AEMET | ola_calor == true, ≥3 días | sombra/interior; sin abono ni trasplante | todas | verano | Alta | F2, F3, F4, F50, F51 |
| M04 | Estrés por calor | temp_exterior ≥ 32 °C, 2 días | suspender abonado | todas | verano | Alta | F31, F33, F35, F32 |
| M05 | Noches <10 °C | temp_exterior < 10 °C (api) | mover al interior | tropicales, calateas/helechos, palmeras, ficus, orquídeas, balcón; exc. suculentas | oto., inv., prim. | Alta | F20, F21, F22, F23, F1 |
| M06 | Frío intenso o helada | temp_exterior ≤ 5 °C (api) | proteger_frio: entrar todo | balcón, suculentas, flor | oto., inv., prim. | Alta | F22, F21, F1, F6 |
| M07 | Interior demasiado frío | temp_interior < 12 °C (sensor) | mover a habitación cálida | tropicales, calateas/helechos, palmeras, orquídeas, ficus | oto., inv. | Alta | F22, F14, F42, F17 |
| M08 | Ola de frío AEMET | ola_frio == true, ≥3 días | proteger_frio: todo dentro, lejos del cristal | todas | invierno | Alta | F5, F4, F52 |
| M09 | Interior caluroso | temp_interior ≥ 28 °C (sensor) | riego ×1,2 | todas; exc. suculentas | verano | Alta | F33, F44, F42, F41 |
| M10 | Interior muy caluroso | temp_interior ≥ 30 °C, 2 días | suspender abonado | todas | verano | Alta | F31, F33, F44 |
| M11 | Interior frío: reposo | temp_interior < 15 °C, 3 días | riego ×0,7 | todas | oto., inv. | Alta | F14, F16, F42, F41, F15 |
| M12 | Humedad interior baja | HR_interior < 40 %, 2 días | aumentar humedad (humidificador, agrupar) | calateas/helechos, tropicales, orquídeas, palmeras; exc. suculentas | todas | Alta | F16, F25, F27, F24, F26, F14, F28 |
| M13 | Humedad interior muy baja | HR_interior < 30 %, 3 días | aviso: humidificador, revisar araña roja | todas; exc. suculentas | todas | Alta | F17, F27, F24, F29 |
| M14 | Humedad interior alta | HR_interior > 70 %, 2 días | aviso: ventilar, espaciar, regar por la mañana | todas | todas | Media | F38, F39, F40 |
| M15 | Humedad interior muy alta | HR_interior ≥ 85 %, 2 días | revisar hongos; riego ×0,8 | todas | todas | Alta | F38, F39, F40 |
| M16 | Calefacción: alejar radiadores | calefaccion_activa == true | mover >1 m de radiadores | todas | oto., inv., prim. | Alta | F14, F16, F15, F17, F41, F42, F54, F55 |
| M17 | Calefacción: riego de invierno | calefaccion_activa == true | riego ×0,85 con comprobación | todas | oto., inv., prim. | Alta | F14, F16, F15, F41 |
| M18 | Calefacción: HR estimada | calefaccion_activa == true (calculado) | aumentar humedad (asumir 20-30 %) | calateas/helechos, tropicales, orquídeas, palmeras; exc. suculentas | oto., inv., prim. | Alta | F16, F27, F17, F24, F25 |
| M19 | Aire acondicionado | aire_acondicionado_activo == true | mover fuera del chorro | todas | verano | Alta | F17, F42, F41, F16 |
| M20 | Sol tras cristal sur | horas_sol ≥ 10 h/día, 7 días | sombrear: 1-1,5 m del cristal o visillo | calateas/helechos, tropicales, orquídeas; exc. suculentas | verano | Media | F18, F43, F20, F33, F1 |
| M21 | Días cortos: no abonar | horas_sol < 5 h/día, 14 días | suspender abonado | todas | oto., inv. | Alta | F14, F16, F17, F42, F41, F15 |
| M22 | Días cortos: menos riego | horas_sol < 5 h/día, 14 días | riego ×0,7 | todas | oto., inv. | Alta | F16, F14, F15, F41 |
| M23 | Lluvia en balcón | lluvia ≥ 5 mm/día (api) | aviso: saltar riego, vaciar platos | balcon_exterior | todas | Media | F20, F36, F19, F45, F1 |
| M24 | Viento fuerte | viento ≥ 40 km/h (api) | mover a resguardo; comprobar sustrato | balcon_exterior | todas | Media | F37, F21, F20, F33, F6 |
| M25 | UV muy alto: aclimatar | radiacion_uv ≥ 8 (api) | sombrear: aclimatación 7-14 días | balcón, tropicales, calateas/helechos, ficus, palmeras, suculentas | prim., ver. | Alta | F8, F9, F10, F20, F21, F23 |
| M26 | Temporada de crecimiento | horas_sol ≥ 7 h/día, 14 días | aviso: reanudar abono a media dosis | todas | prim., ver. | Alta | F17, F14, F41, F42, F1 |
| M27 | Calor seco: araña roja | HR_interior < 50 %, 7 días | revisar plagas (envés, ducha tibia, aislar) | todas | todas | Alta | F29, F30, F27 |
| M28 | Noches 10-13 °C | temp_exterior entre [10, 13] (api) | aviso: entrar aráceas sensibles y calateas | tropicales, calateas/helechos; exc. suculentas, ficus, palmeras | oto., prim. | Alta | F22, F23, F1 |

Notas sobre la confianza: M14, M20, M23 y M24 se marcan **Media** porque el mecanismo está respaldado por varias fuentes prioritarias pero el **valor numérico del umbral** (70 % de HR, 10 h de sol tras cristal, 5 mm de lluvia, 40 km/h de viento) es un margen conservador fijado por este proyecto, no una cifra publicada por extensión universitaria; se detalla en el informe de lagunas. Hay una contradicción documentada en el abonado invernal: el manual de Kentucky/WSU admite abonar cada 4-6 semanas en los días cortos si la planta no está totalmente en reposo [F41], mientras que Wisconsin, Kentucky (2023), Illinois, Purdue y Vermont recomiendan poco o ningún abono en invierno [F14] [F16] [F17] [F42] [F15]; se adopta la opción conservadora (suspender) en M21.

## Fuentes

| ID | URL | Institución | Tipo | Fecha de consulta |
|---|---|---|---|---|
| F1 | https://www.aemet.es/es/serviciosclimaticos/datosclimatologicos/valoresclimatologicos?l=3195 | AEMET - Valores climatológicos normales, Madrid Retiro (3195), 1981-2010 | prioritaria | 2026-10-20 |
| F2 | https://www.aemet.es/documentos/es/conocermas/recursos_en_linea/publicaciones_y_estudios/estudios/Olas_calor/olas_calor_actualizacion_dic24.pdf | AEMET - Olas de calor en España desde 1975 (actualización diciembre 2024) | prioritaria | 2026-10-20 |
| F3 | https://aemetblog.es/2020/06/25/olas-de-calor-en-espana-desde-1975-2/ | AEMET (blog oficial) - Olas de calor en España desde 1975 | prioritaria | 2026-10-20 |
| F4 | https://aemetblog.es/2026/03/14/olas-de-calor-y-de-frio-registradas-en-el-ano-hidrologico-2024-2025/ | AEMET (blog oficial) - Olas de calor y de frío del año hidrológico 2024-2025 | prioritaria | 2026-10-20 |
| F5 | https://www.aemet.es/documentos/es/conocermas/recursos_en_linea/publicaciones_y_estudios/estudios/Olas_frio/olas_frio_actualizacion_dic24.pdf | AEMET - Olas de frío en España desde 1975 (actualización diciembre 2024) | prioritaria | 2026-10-20 |
| F6 | https://www.aemet.es/documentos/es/eltiempo/prediccion/avisos/plan_meteoalerta/METEOALERTA_ANX1_Umbrales_y_niveles_de_aviso.pdf | AEMET - Plan Meteoalerta, Anexo 1: Umbrales y niveles de aviso | prioritaria | 2026-10-20 |
| F7 | https://www.aemet.es/es/eltiempo/prediccion/avisos/ayuda | AEMET - Ayuda sobre avisos Meteoalerta | prioritaria | 2026-10-20 |
| F8 | https://www.aemet.es/es/eltiempo/prediccion/radiacionuv | AEMET - Predicción de índice de radiación UV | prioritaria | 2026-10-20 |
| F9 | https://www.miteco.gob.es/content/dam/miteco/es/calidad-y-evaluacion-ambiental/temas/productos-quimicos/AEMET%20Proteccion%20radiacionultravioleta_tcm30-183323.pdf | AEMET / MITECO - La radiación solar ultravioleta y el índice UVI | prioritaria | 2026-10-20 |
| F10 | https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation | OMS - Ultraviolet radiation (fact sheet) | prioritaria | 2026-10-20 |
| F11 | https://opendata.aemet.es/centrodedescargas/inicio | AEMET OpenData - Centro de descargas | prioritaria | 2026-10-20 |
| F12 | https://datos.gob.es/es/blog/los-conjuntos-de-datos-meteorologicos-de-alto-valor | datos.gob.es (Gobierno de España) - Conjuntos de datos meteorológicos de alto valor de AEMET | prioritaria | 2026-10-20 |
| F13 | https://repositorio.aemet.es/bitstream/20.500.11765/15493/1/ACA_MAD_23.pdf | AEMET - Avance climatológico anual 2023, Comunidad de Madrid | prioritaria | 2026-10-20 |
| F14 | https://chippewa.extension.wisc.edu/2025/11/19/winter-care-of-houseplants-2 | University of Wisconsin-Madison Extension - Winter Care of Houseplants | prioritaria | 2026-10-20 |
| F15 | https://www.uvm.edu/extension/news/houseplant-care-during-winter-months | University of Vermont Extension - Houseplant care during winter months | prioritaria | 2026-10-20 |
| F16 | https://exclusives.mgcafe.uky.edu/2023/hort/keeping-your-houseplants-happy-during-wintertime | University of Kentucky Extension - Keeping your houseplants happy during wintertime | prioritaria | 2026-10-20 |
| F17 | https://extension.illinois.edu/houseplants/care | University of Illinois Extension - Houseplants: Care | prioritaria | 2026-10-20 |
| F18 | https://extension.illinois.edu/houseplants/lighting | University of Illinois Extension - Houseplants: Lighting | prioritaria | 2026-10-20 |
| F19 | https://extension.illinois.edu/houseplants/watering | University of Illinois Extension - Houseplants: Watering | prioritaria | 2026-10-20 |
| F20 | https://extension.illinois.edu/blogs/flowers-fruits-and-frass/2025-05-30-take-your-houseplants-summer-vacationto-patio | University of Illinois Extension - Take your houseplants on a summer vacation to the patio | prioritaria | 2026-10-20 |
| F21 | https://planttalk.colostate.edu/?p=1212 | Colorado State University Extension (PlantTalk) - Houseplants outdoors in summer | prioritaria | 2026-10-20 |
| F22 | https://ask.ifas.ufl.edu/publication/EP429 | UF/IFAS Extension - Cold Protection of Foliage Plants (ENH1168/EP429) | prioritaria | 2026-10-20 |
| F23 | https://hgic.clemson.edu/prepare-houseplants-to-move-back-inside/ | Clemson University HGIC - Prepare houseplants to move back inside | prioritaria | 2026-10-20 |
| F24 | https://extension.psu.edu/humidity-and-houseplants | Penn State Extension - Humidity and Houseplants | prioritaria | 2026-10-20 |
| F25 | https://yardandgarden.extension.iastate.edu/faq/how-can-i-raise-relative-humidity-indoors-my-houseplants | Iowa State University Extension - How can I raise the relative humidity indoors for my houseplants? | prioritaria | 2026-10-20 |
| F26 | https://yardandgarden.extension.iastate.edu/faq/air-our-home-extremely-dry-winter-should-i-mist-houseplants | Iowa State University Extension - Should I mist the houseplants? | prioritaria | 2026-10-20 |
| F27 | https://www.purdue.edu/hla/sites/yardandgarden/thirst-aid-for-houseplants/ | Purdue University Consumer Horticulture - Thirst Aid for Houseplants | prioritaria | 2026-10-20 |
| F28 | https://lancaster.unl.edu/houseplants-humidity | University of Nebraska-Lincoln Extension - Success with Houseplants: Humidity | prioritaria | 2026-10-20 |
| F29 | https://pestsense.cahnrs.wsu.edu/fact-sheet/spider-mites/ | Washington State University Extension (PestSense) - Spider mites | prioritaria | 2026-10-20 |
| F30 | https://ipm.ucanr.edu/PMG/PESTNOTES/pn7405.html | UC IPM (UC ANR) - Pest Notes: Spider Mites (7405) | prioritaria | 2026-10-20 |
| F31 | https://hortsense.cahnrs.wsu.edu/fact-sheet/common-cultural-fertilizer-burn/ | Washington State University Extension (Hortsense) - Fertilizer burn | prioritaria | 2026-10-20 |
| F32 | https://kenosha.extension.wisc.edu/2021/07/07/mitigating-drought-stress-on-landscape-and-garden-plants-during-the-current-local-dry-spell/ | University of Wisconsin-Madison Extension - Mitigating drought stress | prioritaria | 2026-10-20 |
| F33 | https://extension.oregonstate.edu/es/node/167071/printable/print | Oregon State University Extension - Heat wave in the garden (EM 9556) | prioritaria | 2026-10-20 |
| F34 | https://swain.ces.ncsu.edu/2025/02/hot-pots-what | NC State Extension - Hot Pots | prioritaria | 2026-10-20 |
| F35 | https://fieldreport.caes.uga.edu/news/4464/ | University of Georgia Extension (CAES) - Hot weather stress | prioritaria | 2026-10-20 |
| F36 | https://extension.illinois.edu/container-gardens/container-drainage-options | University of Illinois Extension - Container drainage options | prioritaria | 2026-10-20 |
| F37 | https://extension.illinois.edu/container-gardens/containers-0 | University of Illinois Extension - Container gardens: containers | prioritaria | 2026-10-20 |
| F38 | https://publications.mgcafe.uky.edu/sites/publications.ca.uky.edu/files/ppfs-gen-19.pdf | University of Kentucky Plant Pathology - Botrytis blight (PPFS-GEN-19) | prioritaria | 2026-10-20 |
| F39 | https://www.pubs.ext.vt.edu/content/dam/pubs_ext_vt_edu/spes/spes-820/SPES-820.pdf | Virginia Tech Extension - Leaf mold, gray mold and bacterial wilt in greenhouse tomatoes (SPES-820) | prioritaria | 2026-10-20 |
| F40 | https://ipm.cahnr.uconn.edu/wp-content/uploads/sites/3216/2023/12/2023botrytisblightfactsheetfinal.pdf | University of Connecticut IPM - Botrytis blight fact sheet (2023) | prioritaria | 2026-10-20 |
| F41 | https://publications.mgcafe.uky.edu/files/ho103.pdf | University of Kentucky / WSU Extension - Indoor Plants (HO-103) | prioritaria | 2026-10-20 |
| F42 | https://ag.purdue.edu/department/hla/extension/extension-publications-library/ext-pubs/ho-39-w.html | Purdue Extension - Indoor Plant Care (HO-39-W) | prioritaria | 2026-10-20 |
| F43 | https://extension.msstate.edu/blogs/extension-for-real-life/tips-for-growing-indoor-plants | Mississippi State University Extension - Tips for growing indoor plants | prioritaria | 2026-10-20 |
| F44 | https://homegarden.cahnr.uconn.edu/tag/heat-stress | University of Connecticut Home & Garden Education Center - Heat stress | prioritaria | 2026-10-20 |
| F45 | https://chippewa.extension.wisc.edu/2023/11/29/gardening-indoors-with-houseplants/ | University of Wisconsin-Madison Extension - Gardening indoors with houseplants | prioritaria | 2026-10-20 |
| F46 | https://www.aemet.es/es/serviciosclimaticos/datosclimatologicos/valoresclimatologicos?l=0076 | AEMET - Valores climatológicos normales, Barcelona Aeropuerto (0076) | prioritaria | 2026-10-20 |
| F47 | https://www.aemet.es/es/serviciosclimaticos/datosclimatologicos/valoresclimatologicos?l=1082 | AEMET - Valores climatológicos normales, Bilbao Aeropuerto (1082) | prioritaria | 2026-10-20 |
| F48 | https://www.aemet.es/es/serviciosclimaticos/datosclimatologicos/valoresclimatologicos?l=5783 | AEMET - Valores climatológicos normales, Sevilla Aeropuerto (5783) | prioritaria | 2026-10-20 |
| F49 | https://www.aemet.es/es/serviciosclimaticos/datosclimatologicos/valoresclimatologicos?l=C449C | AEMET - Valores climatológicos normales, Santa Cruz de Tenerife (C449C) | prioritaria | 2026-10-20 |
| F50 | https://aemetblog.es/2024/07/24/preguntas-y-respuestas-sobre-las-olas-de-calor/ | AEMET (blog oficial) - Preguntas y respuestas sobre las olas de calor | prioritaria | 2026-10-20 |
| F51 | https://www.aemet.es/es/conocermas/recursos_en_linea/publicaciones_y_estudios/estudios/detalles/olascalor | AEMET - Ficha del estudio Olas de calor en España desde 1975 | prioritaria | 2026-10-20 |
| F52 | https://www.aemet.es/es/conocermas/recursos_en_linea/publicaciones_y_estudios/estudios/detalles/olas_frio | AEMET - Ficha del estudio Olas de frío en España desde 1975 | prioritaria | 2026-10-20 |
| F53 | https://www.cpc.ncep.noaa.gov/products/stratosphere/uv_index/uv_what.shtml | NOAA Climate Prediction Center - What is the UV index | prioritaria | 2026-10-20 |
| F54 | https://www.alimarket.es/construccion/noticia/339874/2021--ultimo-ano-de-derroche-en-calefaccion-en-las-comunidades-de-vecinos | Alimarket - Encendido de calefacción a finales de octubre | complementaria | 2026-10-20 |
| F55 | https://selectra.es/energia/noticias/calefaccion-central-2026-fecha-encendido-junta | Selectra - Calefacción central: quién decide la fecha | complementaria | 2026-10-20 |
| F56 | https://cafmadrid.es/wp-content/uploads/2023/09/NdP_Medidas-de-Ahorro-Energetico.pdf | CAFMadrid - Nota de prensa medidas de ahorro energético | complementaria | 2026-10-20 |
| F57 | https://es.wikipedia.org/wiki/Clima_de_Buenos_Aires | Wikipedia - Clima de Buenos Aires (datos SMN) | complementaria | 2026-10-20 |
| F58 | https://maldita.es/malditaciencia/20240607/aviso-calor-aemet-umbral/ | Maldita.es - Umbrales de aviso por calor de AEMET | complementaria | 2026-10-20 |
