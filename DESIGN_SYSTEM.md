# Treegoh Design System (TDS) • Sistema de Diseño Definitivo

> **Nota:** Este documento establece la especificación visual, arquitectónica e interactiva definitiva para Treegoh. Cualquier nueva pantalla, componente o módulo debe adherirse estrictamente a estas directrices.

---

## 1. Filosofía de Diseño y Principios Rectores

El sistema de diseño de Treegoh fusiona la **serenidad contemplativa de la botánica moderna** con la precisión de la **biométrica lumínica**. Inspirado en la atmósfera mineral y brumosa de **TIDE** y en la experiencia de reconocimiento óptico de **BitePal**, prioriza la calma, la legibilidad aérea y la pureza estética.

### Principios Fundamentales:
1. **Cero Emojis Clásicos**: Toda la comunicación gráfica se realiza mediante iconografía SVG vectorial lineal botánica propia (`TreegohIcon`).
2. **Cero Fuentes Bold**: La jerarquía se construye mediante escala, tracking delicado y opacidades, empleando exclusivamente pesos **Light (`300`)**, **ExtraLight (`200`)** y puntualmente **Regular (`400`)**.
3. **Glow Blanco Puro Exclusivo en Cards**: Los halos de luz son blancos difusos y habitan **únicamente dentro de las tarjetas** para resaltar sensores y virtudes botánicas. Los botones nunca llevan glow.
4. **Layout 100% Fluido en Flujo Natural**: Cero barras o cabeceras con `position: fixed` que colisionen con cámaras frontales (Dynamic Island) o tapen información al final del scroll.
5. **Alineación Inferior Derecha en Botones de Avance**: Las flechas circulares de avance se ubican en la esquina inferior derecha (`alignItems: 'flex-end'`), permitiendo una ergonomía de navegación con el pulgar ágil y natural.
6. **Movimiento Orgánico Sin Gelatina**: Transiciones de deformación sutil (tipo *blob* de ~1%) sin rotación y con resortes amortiguados sin rebote exagerado.

---

## 2. Tipografía (`Montserrat Light Hierarchy`)

La tipografía oficial y definitiva de Treegoh es **`Montserrat`**. Se cargan de forma asíncrona sus variantes de peso liviano mediante `loadMontserratFonts`.

### Tabla de Estilos Tipográficos:

| Rol de Texto | Familia | Peso (`fontWeight`) | Tamaño (`fontSize`) | Interlineado (`lineHeight`) | Color Recomendado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Título Pantalla Principal** | `Montserrat-Light` | `'300'` | `30px – 32px` | `41px – 43px` | `rgba(255, 255, 255, 0.96)` |
| **Subtítulo de Sección** | `Montserrat-Light` | `'300'` | `14.5px – 15.5px` | `23px – 25px` | `rgba(255, 255, 255, 0.64)` |
| **Métrica Numérica Display** | `Montserrat-ExtraLight` | `'200'` | `38px` | `44px` | `#FFFFFF` |
| **Título de Tarjeta** | `Montserrat-Regular` | `'400'` | `16px – 16.5px` | `22px` | `rgba(255, 255, 255, 0.96)` |
| **Subtítulo de Tarjeta** | `Montserrat-Light` | `'300'` | `13.5px` | `19.5px` | `rgba(255, 255, 255, 0.58)` |
| **Píldoras y Chips** | `Montserrat-Light` | `'300'` | `13px – 13.5px` | `18px` | `rgba(255, 255, 255, 0.88)` |
| **Botón Primario CTA** | `Montserrat-Regular` | `'400'` | `15px – 15.5px` | `20px` | `#2C2A28` (sobre blanco) |
| **Nombre Científico / Rasgo** | `Montserrat-LightItalic` | `'300'` | `14.5px – 15px` | `21px – 24px` | `rgba(255, 255, 255, 0.68)` |

> **Prohibición estricta:** Queda terminantemente desaconsejado el uso de `fontWeight: '600'`, `'700'`, `'800'`, `'900'` o `'bold'` en cualquier elemento de la interfaz.

---

## 3. Paleta Cromática Atmosférica (Estilo TIDE)

La paleta abandona los verdes brillantes y saturados para adoptar una atmósfera **mineral, carbón ahumado, pizarra y bruma arena**.

### Tokens de Color Oficiales (`src/constants/theme.ts`):
- `pureWhite`: `#FFFFFF`
- `tideBaseDark`: `#353330`
- `tideMidStone`: `#4B4742`
- `tideWarmTaupe`: `#5E5851`
- `tideSlateMist`: `#6F767A`
- `darkObsidian`: `#1E1D1B`
- `buttonTextDark`: `#2C2A28`
- `textMuted`: `rgba(255, 255, 255, 0.58)`
- `cardBorderSubtle`: `rgba(255, 255, 255, 0.26)`
- `cardBorderActive`: `rgba(255, 255, 255, 0.78)`
- `scanBeamAmber`: `#F7CE46` (Láser de reconocimiento óptico)
- `scanBeamActive`: `#FACC15` (Láser calibrando con IA)

---

## 4. Tarjetas y Layouts (`Cards & Glassmorphism`)

### 4.1 Proporciones de Grilla 2x2 (Referencia TIDE)
- **Margen horizontal de pantalla**: `paddingHorizontal: 24px`.
- **Separación Título → Grilla**: `marginBottom: 36px` (espacio respirable generoso).
- **Gaps entre tarjetas**: `gap: 16px` entre columnas y `gap: 16px` entre filas.
- **Geometría de Tarjeta**:
  - `borderRadius: 20px`
  - `minHeight: 204px` (proporción vertical esbelta)
  - `paddingHorizontal: 20px`, `paddingTop: 24px`, `paddingBottom: 22px`
  - Distribución interna: Icono con glow arriba a la izquierda; títulos agrupados abajo a la izquierda (`gap: 6px`).

### 4.2 Estados de Tarjeta:
1. **Estado No Seleccionado**:
   - `backgroundColor: 'rgba(255, 255, 255, 0.08)'`
   - `borderWidth: 1px`, `borderColor: 'rgba(255, 255, 255, 0.26)'`
   - Superficie reflectiva superior `GlassCardSheen`.
   - **Limpio**: Sin círculos de radio vacíos en la esquina.
2. **Estado Seleccionado**:
   - `backgroundColor: 'rgba(255, 255, 255, 0.20)'`
   - `borderWidth: 1.2px`, `borderColor: 'rgba(255, 255, 255, 0.78)'`
   - `shadowColor: '#FFFFFF'`, `shadowOpacity: 0.14`, `shadowRadius: 12px`
   - Indicador sutil: Círculo translúcido blanco de `22x22px` con `TreegohIcon` de `tarea_completada` (`#FFFFFF`).

---

## 5. Iconografía y Resplandor (`Glow System`)

- Componente canónico: `TreegohIcon`.
- Grosor de línea base: `1.7px` (óptico).
- Color de halo: **Blanco puro (`#FFFFFF`)**, nunca verde.

> **Regla de Glow Estricta**:
> - En **tarjetas**: `glow={true}` permitido y recomendado.
> - En **botones**: `glow={false}` SIEMPRE. Cero resplandores o efectos arcade en botones.

---

## 6. Botones y Posicionamiento Ergonómico

1. **Botones de Bienvenida (Paso 1)**:
   - Botón CTA: Píldora de ancho completo `borderRadius: 28px`, `paddingVertical: 17px`, `backgroundColor: 'rgba(255, 255, 255, 0.92)'`, texto `#2E2C29` `Montserrat-Regular`.
   - Botón Secundario: Fantasma `rgba(255, 255, 255, 0.80)` `Montserrat-Light`.
2. **Botones de Cuenta (Paso 2)**:
   - Píldoras de ancho completo translúcidas `rgba(255, 255, 255, 0.12)`, `borderWidth: 1px`, `borderColor: 'rgba(255, 255, 255, 0.26)'`.
3. **Flecha de Avance en Flujo (Pasos 3, 4, 6, 7)**:
   - Botón circular de `58x58px` (`borderRadius: 29px`), fondo `rgba(255, 255, 255, 0.88)` con flecha `#2C2A28`.
   - **Posición**: Alineado en la **esquina inferior derecha** (`inFlowArrowFooter: { alignItems: 'flex-end', paddingRight: 4 }`).
4. **Navegación del Asistente (Paso 5)**:
   - Barra horizontal integrada en flujo: Retroceso circular a la izquierda, píldoras indicadoras de paso en el centro, botón circular de avance en el extremo derecho.

---

## 7. Animaciones y Cinemática (`Blob Animated Card`)

Implementado en `BlobAnimatedCard`:
- **Sin Rotación**: Se eliminó cualquier rotación angular (`rotate`) para conservar un porte arquitectónico sereno.
- **Deformación Elástica Mínima**: Durante el swipe lateral horizontal, la tarjeta se estira/comprime de forma muy contenida (~`1% – 1.2%`).
- **Resorte Amortiguado**: `damping: 24`, `stiffness: 170`, `mass: 0.95`.
- **Desacople Estricto**: Nunca anidar una `BlobAnimatedCard` dentro de otra.

---

## 8. Arquitectura Multiespacio (Microclimas del Hogar)

Treegoh permite que un usuario registre todos los espacios de su hogar (Salón, Balcón, Dormitorio, etc.) dentro del mismo onboarding:
- `btnAddAnotherSpace`: Botón al final de la pestaña `4. Salud` para encadenar habitaciones.
- `savedSpacesScrollContent`: Carrusel superior en la cabecera del estudio con acceso a los rincones ya registrados.
- `savedSpacesContinuePill`: Píldora para continuar al siguiente paso del onboarding con el conteo exacto de espacios guardados.

---

## 9. Referencias Visuales Canónicas (Benchmarks Oficiales)

### Benchmark 1: Visor Óptico en Burbuja & Escaneo con IA (`BitePal`)
- **Apertura Central**: Corte circular SVG sobre el visor de cámara en vivo a pantalla completa (sin abandonar Treegoh).
- **Láser de Escaneo**: Haz horizontal ámbar dorado cálido (`#F7CE46` / `#FACC15`) animado con estela de matriz de puntos reflectivos.
- **Mascota en Escaneo**: `TreegohCharacter` asomada en la parte inferior con signos de interrogación (`?`) flotantes y expresión curiosa.
- **Hoja Flotante de Estado**: Tarjeta blanca satinada (`#FFFFFF`, radio 32px) con icono de destello `✦`, texto `Analizando espacio con IA...` y botón circular de cierre `✕`.
- **Componente**: `BotanicalCameraBubbleModal`.

### Benchmark 2: Atmósfera & Acabados de Métricas (`TIDE Focus`)
- **Atmósfera Brumosa**: Fondo degradado suave en tonos carbón pizarra y taupe mineral (`['#353330', '#4B4742', '#5E5851']`).
- **Métricas Verticales**: Datos agrupados en columnas limpias separadas por líneas divisorias capilares translúcidas (`rgba(255, 255, 255, 0.20)`).
- **Control Dual Inferior**: Botón circular secundario a la izquierda y píldora principal de acción a la derecha sin sombras arcade.

### Benchmark 3: Grilla de Tarjetas 2x2 & Glow Blanco Puro (`TIDE Goal Selection`)
- **Jerarquía Aérea**: Título principal en `Montserrat-Light` con separación amplia de 36px antes de la grilla.
- **Disposición 2x2**: Tarjetas de `minHeight: 204px`, bordes finos de refracción (`rgba(255, 255, 255, 0.26)`), esquinas redondeadas (`20px`).
- **Iconografía con Resplandor Blanco**: Iconos situados arriba a la izquierda con halo difuso blanco puro (`#FFFFFF`) exclusivo.
- **Textos de Tarjeta**: Título abajo en `Montserrat-Regular` (16px) y subtítulo en `Montserrat-Light` (13.5px) con opacidad suave (`rgba(255, 255, 255, 0.58)`).
- **Botón de Avance Ergonómico**: Integrado en el flujo y posicionado en la esquina inferior derecha.

---

## 10. Ciclo Circadiano & Fondos Vivos (Horas y GPS)

Implementado en `CircadianBackground` y `getCircadianTheme`:
- **Sincronización 100% Automática**: La app toma la hora del reloj del teléfono y el GPS del usuario sin necesidad de selectores manuales en pantalla.
- **Desenfoque Óptico del 30% (`BlurView intensity={30}`)**: Los orbes difusos se suavizan con un velo de cristal esmerilado que maximiza el efecto *glass* de las tarjetas superiores.
- **Cinemática Respiratoria**: Los orbes de luz realizan un suave ciclo de deriva y escala orgánica (~8.5s) que aporta dinamismo y serenidad biológica sin saturar.
- **Mañana Serena (08:30 – 13:00)**: Azul matinal brumoso (`['#243C4D', '#325268', '#456D88', '#638BA5']`). Pico de asimilación de fotones y activación de clorofila.
- **Luz Cenital (13:00 – 17:30)**: Piedra mineral luminosa (`['#2D3233', '#3F4745', '#525C57', '#6B756E']`). Máxima irradiancia solar.
- **Ocaso Cálido (17:30 – 21:00)**: Ocaso rojizo, teja y ámbar crepuscular (`['#2F2936', '#49373D', '#744747', '#A85F4F', '#CB8168']`). Cierre de estomas y desaceleración transpiratoria.
- **Reposo Nocturno (21:00 – 06:00)**: Obsidiana y carbón mineral (`['#141518', '#1A1C22', '#23252E', '#181A20']`). Fase oscura de respiración y absorción radical.

---

## 11. Gestión de Plantas por Espacio (Post-Onboarding)

Implementado en `SanctuaryHomeScreen`, `AddPlantModal`, `PlantDetailModal` y `openRouterPlantIdentification`:
- **Vinculación Espacio ↔ Planta**: Cada espécimen pertenece a un microclima específico (`Salón`, `Dormitorio`, `Terraza`, etc.) y hereda sus Lux y orientación.
- **3 Vías de Registro**:
  1. **Visor Óptico en Burbuja con OpenRouter IA (`BitePal`)**: Cámara en vivo o galería analizada con visión multimodal para identificar la especie binomial, diagnosticar compatibilidad con los Lux del espacio, evaluar seguridad ASPCA de mascotas y sugerir pauta de riego VPD.
  2. **Catálogo de Especies Curadas**: Filtrado por los lúmenes de la estancia y el filtro de mascotas (Calathea, Monstera, Pothos, Pilea, Ficus Lyrata, Sansevieria, Zamioculca, Helecho Boston, etc.).
  3. **Registro Manual / Personalizado**: Nombre común, apodo cariñoso y notas.
- **Ficha Botánica Interactiva (`PlantDetailModal`)**: Muestra biométrica lumínica, certificación ASPCA, evaluación foliar y permite registrar el riego en tiempo real (`Marcar regada hoy`).


