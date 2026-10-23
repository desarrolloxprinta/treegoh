# Avatar de Treegoh

Guía completa del personaje: qué es, cómo se construyó, cómo se usa en la app y cómo se edita.
Última actualización: 2026-10-23.

Prototipo publicado (privado, compártelo desde su menú si otra persona debe verlo):
https://claude.ai/artifact/Hu1rz1iZ6XBXFqPxNMuqz2 · copia local en `prototipo/avatar.html`.

---

## 1. El personaje en una página

Una esfera de **cristal líquido** estilizado (3D limpio, no fotorrealista, el mismo nivel que el icono de la regadera `../icon_watering_can_liquid_glass.png`) con un **núcleo de polvo verde** flotando dentro y una **cara kawaii en 2D** sobre el núcleo.

Tres ideas sostienen todo el diseño:

1. **Contraste de lenguajes.** Cristal y partículas en 3D; ojos y boca en 2D plano. El 3D da calidad; el 2D da expresividad y se puede animar con precisión.
2. **El núcleo es el personaje.** La esfera es su casa. El núcleo se mueve dentro con inercia, cambia de forma según el ánimo y lleva la cara.
3. **Todo por capas.** Nada va "horneado" en una sola imagen: cristal, núcleo, halo y cara son capas separadas. Así el avatar funciona sobre cualquier fondo y cada parte se anima por su cuenta.

### Orden de capas (de abajo arriba)

| # | Capa | Modo de mezcla | Solo en |
|---|---|---|---|
| 1 | Sombra en el suelo (gris) o reflejo de luz (verde) | normal | — |
| 2 | Halo verde | aditivo (*lighter*) | fondos oscuros |
| 3 | Núcleo: variantes que se funden | normal (claro) / *screen* (oscuro) | — |
| 4 | Polvo generativo (240 motas) | normal (claro) / aditivo (oscuro) | — |
| 5 | Cara vectorial | normal | — |
| 6 | Cristal transparente | normal (lleva su propia alfa) | — |
| 7 | Chispas, ondas de voz, "z" de sueño | según fondo | según estado |

Las capas 2-5 se recortan al círculo interior de la esfera (96,5 % del radio).

---

## 2. Identidad visual

### Paleta

| Uso | Color |
|---|---|
| Fondo claro de la app (crema) | `#E6E8C4` |
| Salvia | `#84A98C` |
| Eucalipto | `#52796F` |
| Pizarra verde | `#354F52` |
| Pizarra oscuro (fondo oscuro de referencia) | `#2F3E46` |
| Ojos, cejas, boca | ciruela `#5B1636`, interior del ojo `#7A2348` |
| Coloretes | `rgba(244,160,178, 0.85 × intensidad)` |
| Lengua / interior de boca | `#F39AAE` |
| Lágrima | `#A9C8EF` |
| Núcleo emisivo (degradado por luminancia) | negro → `#164634` → `#46966A` → `#96E1A5` → `#EBFFEB` |

Los ojos son ciruela y no negros: el ciruela es complementario del verde y da calidez. Si algún día se quiere todo dentro de la paleta, cámbialo por `#2F3E46` en la constante `CIRUELA` del prototipo.

### Proporciones de la cara

Unidad `u` = radio de la esfera. Origen = centro del núcleo (la cara se mueve con él).

| Rasgo | Posición | Tamaño |
|---|---|---|
| Ojos | x = ±0,27u, y = −0,04u | elipse 0,10u × 0,128u |
| Brillo grande del ojo | (−0,032u, −0,045u) | 0,052u × 0,05u, blanco |
| Brillo pequeño | (0,04u, 0,05u) | radio 0,019u |
| Cejas | x = ±0,27u, y = −0,235u | ancho 0,17u, trazo 0,02u |
| Boca | y = 0,15u | ancho 0,26u × `mw` |
| Coloretes | (±0,37u, 0,10u) | 0,075u × 0,045u |
| Núcleo | centrado | diámetro 0,70 × diámetro de la esfera |

Los brillos del ojo se mueven mucho menos que la pupila al mirar (están "fijos a la luz"): es lo que hace que los ojos parezcan reales.

### Tipografía de la marca

Funnel Sans (texto) y Funnel Display (titulares), en `../Cantarell,Funnel_Sans.zip` y en Google Fonts.

---

## 3. Inventario de archivos

```
branding/character/
├── README.md                     ← este documento
├── referencias/                  ← moodboard: esferas de cristal y hojas de caras kawaii
├── 1.png, 2.png, 3.png           ← generaciones de concepto en Magnific
├── esfera.png                    ← esfera vacía sobre crema (fuente del cristal)
├── esfera-sinfondo.png           ← la misma con fondo quitado (solo se usa como máscara)
├── particulas.png                ← núcleo original sobre negro (fuente del núcleo y de las variantes)
├── particulas-sin fondo.png      ← núcleo con fondo quitado (versión opaca)
├── caracter-sinfondo.png         ← concepto completo con cara (referencia; su interior es opaco)
├── expresiones-sinfondo.png      ← hoja de 16 expresiones (referencia de la cara)
├── capas-app/
│   ├── generar_capas.py          ← extrae la transparencia del cristal y crea núcleo emisivo y halo
│   ├── esfera-cristal.png        ← CRISTAL CON TRANSPARENCIA REAL (1536 px)
│   ├── nucleo-claro.png          ← núcleo opaco original
│   ├── nucleo-emisivo.png        ← núcleo luminoso para fondos oscuros (RGB sobre negro)
│   ├── nucleo-glow.png           ← halo verde
│   └── preview-lamina.png        ← composición sobre crema, blanco, pizarra y noche
├── variantes-nucleo/
│   ├── normalizar_variantes.py   ← iguala centro y escala y crea versiones claro/emisivo
│   ├── nucleo-<variante>-claro.webp / -emisivo.webp   (7 variantes × 2)
│   └── originales-magnific/      ← cuadrícula y casillas tal como salieron de Magnific
└── prototipo/
    ├── avatar.html               ← prototipo interactivo (fuente de verdad del movimiento)
    └── assets/                   ← cristal.webp (760 px) + las 14 variantes del núcleo (560 px)
```

Los nombres con espacios (`particulas-sin fondo.png`) son los que espera `generar_capas.py`; si los renombras, cambia el script.

---

## 4. Cómo se construyó

### 4.1 Generación en Magnific

Se generó por piezas, nunca la imagen final completa, para poder animar cada parte. Prompts definitivos (en inglés porque los modelos responden mejor):

**Concepto**
```
A cute floating 3D character in a stylized premium 3D style, like Apple liquid glass icons, not photorealistic. A perfectly round sphere made of soft satin liquid glass: smooth translucent body, gentle frosted inner glow, clean simplified highlights (one soft curved highlight on the upper left, one small sparkle on the upper right), a thin luminous silver-white rim, very subtle prismatic rainbow dispersion only along the edge. Inside the sphere floats a living core: a soft round cloud of tiny glowing dust particles in muted sage green, eucalyptus green and deep slate green, with a few brighter fresh-green sparkles, denser and glowing in the center, fading into sparse specks at the edges, like pollen in light. On the front of the core, a kawaii cartoon face drawn in flat 2D: large glossy deep plum eyes with big white highlight circles and a small secondary highlight, short curved eyelashes, thin arched eyebrows, a small happy curved mouth, soft pink oval blush cheeks. Calm, friendly, curious expression. Soft diffused lighting, clean minimal render, gentle soft shadow far below the sphere, centered, front view, on a flat solid cream background color #E6E8C4, nothing else in the scene.
```

**Esfera vacía**
```
A single perfectly round empty sphere in stylized premium 3D liquid glass style, like Apple liquid glass icons, not photorealistic: smooth satin translucent glass, gentle frosted inner glow, clean simplified highlights upper left, small sparkle upper right, thin luminous silver-white rim, very subtle prismatic dispersion along the edge, completely empty inside. Soft diffused lighting, centered, front view, no shadow, on a flat solid cream background color #E6E8C4.
```

**Núcleo**
```
A soft round cloud of tiny glowing dust particles in muted sage green, eucalyptus green and deep slate green, with a few brighter fresh-green sparkles, dense and luminous in the center, fading into sparse floating specks at the edges, like glowing pollen, soft stylized 3D render, dreamy and clean, not photorealistic. Isolated on a pure black background, centered, no face, no glass.
```

**Hoja de expresiones**
```
Kawaii character expression sheet, 12 faces in a clean 4x3 grid, flat 2D vector style, consistent design: large glossy deep plum eyes with big white highlight circles and a small secondary highlight, short curved eyelashes, thin arched eyebrows, simple mouths in deep plum with pink inner mouth, soft pink oval blush cheeks. Expressions: neutral calm, happy smile, joyful laugh with closed eyes, curious, surprised, worried, sad with a small tear, thirsty and tired with droopy eyes, love with heart eyes, excited with sparkle eyes, sleepy, wink. Faces only, no head outline, on a plain white background, crisp clean shapes.
```

**Negativo (todas)**
```
photorealistic, real photo, studio window reflections, environment reflections, dirty glass, scratches, cracked glass, oval or distorted sphere, rainbow iridescent body, holographic swirl, oversaturated neon green, black eyes, realistic eyes, 3D eyes, teeth, limbs, text, watermark, multiple objects, busy background, plants, leaves
```

Referencias usadas en Magnific: la regadera de cristal líquido como estilo y la hoja kawaii (`referencias/coleccion-caras-kawaii-dibujadas-mano.png`) para los ojos.

### 4.2 Transparencia real del cristal

**El problema.** Ningún generador da transparencia, y "quitar fondo" no la recupera en un cristal: cada píxel lleva mezclado el crema de detrás. Sobre fondo oscuro, la esfera seguía viéndose crema.

**La solución** (`capas-app/generar_capas.py`): se estima el fondo crema píxel a píxel (convolución normalizada fuera de la esfera) y, para cada píxel, se calcula la **mínima opacidad** que explica su color sobre ese fondo:

```
alfa = max por canal de ( (I − F) / (1 − F) , (F − I) / F )
color = (I − F · (1 − alfa)) / alfa
```

Donde el cristal es igual al fondo queda transparente; los brillos quedan como blanco semitransparente; los bordes de refracción, como sombra semitransparente. Ajustes añadidos tras revisarlo sobre negro:

- Se recorta a la silueta exacta de la esfera (fuera quedaba la sombra que proyectaba sobre el crema, que en oscuro era un anillo gris).
- Se atenúa la niebla clara difusa con una "rodilla": `alfa × clip((alfa − 0,20) / 0,30)^1,5` solo en píxeles más claros que el fondo. Si quieres más reflejo inferior, baja 0,20; si quieres menos niebla, súbelo.

### 4.3 Núcleo para fondos oscuros

Sobre oscuro el núcleo opaco se veía lechoso. Se crea una versión **emisiva**: un mapa de degradado por luminancia (tabla de la sección 2) más un destello en las chispas más brillantes, guardada como RGB sobre negro para mezclarla en modo *screen*. Debajo va un **halo** verde (radial, aditivo). Con eso el núcleo "emite luz" en vez de tapar el fondo.

### 4.4 Variantes del núcleo (Magnific)

Para que el interior cambie con el ánimo, se generaron 6 variantes con **Magnific → Variaciones, modo personalizado, cuadrícula 2×3, 2K, 1:1** a partir de `particulas.png` (75 créditos). Prompt (límite de 500 caracteres):

```
Same green dust-particle core, same palette, size and centering, pure black background, no face, no glass. Only the particle distribution changes: 1 calm dense round cloud; 2 airy loose particles, brighter center; 3 soft spiral vortex; 4 heavy, sinking, denser at the bottom; 5 radiant burst with bright sparkles at the edges; 6 dreamy diffuse haze, fewer dimmer particles.
```

Las casillas salen con tamaños distintos, así que `variantes-nucleo/normalizar_variantes.py`:

1. Pone el negro de fondo a cero (mediana del borde).
2. Centra cada una en su **centroide de luz** y la escala para que el radio que contiene el **92 % de la luz** mida el 40 % del lado.
3. Aplica una viñeta radial para que nada toque el borde cuadrado.
4. Genera `-emisivo.webp` (degradado verde) y `-claro.webp` (alfa por luminancia, color desaturado un 30 % hacia el pizarra y oscurecido).

| Variante | Origen | Estado |
|---|---|---|
| base | `particulas.png` (el original) | Reposo, Escuchando |
| densa | casilla 1 | Preocupado |
| aerea | casilla 2 | Feliz |
| espiral | casilla 3 | Pensando |
| sedimento | casilla 4 | Sediento |
| radiante | casilla 5 | Celebración |
| bruma | casilla 6 | Dormido |

### 4.5 Cara vectorial

La hoja de expresiones de Magnific es la **referencia**, no el recurso final: una imagen no se puede deformar. En el prototipo la cara se dibuja por código con las proporciones de la sección 2, y cada rasgo es un número animable (apertura de ojos, curva de boca, inclinación de cejas…). Rive hará lo mismo con formas vectoriales.

---

## 5. Sistema de movimiento

### 5.1 Principio: todo es un muelle

No hay animaciones con duración fija. Cada valor (posición, apertura de ojos, curva de boca, peso de cada variante…) es un **muelle amortiguado** que persigue un objetivo:

```
aceleración = k · (objetivo − valor) − c · velocidad
```

Cuando cambia el objetivo, el valor parte con la velocidad que ya llevaba: nada arranca ni para en seco, y las transiciones entre estados se encadenan solas. La simulación usa subpasos de 1/120 s para que los muelles rígidos sean estables a cualquier tasa de refresco.

| Muelle | k | c | Efecto |
|---|---|---|---|
| Posición de la esfera (reposo) | 60 | 7,5–9 | vuelve a casa con un rebote suave |
| Posición de la esfera (arrastrando) | 520 | 38 | sigue al dedo casi pegada |
| Salto | 70 | 7 | brinco con caída elástica |
| Aplastado (toque) | 220 | 9 | gelatina rápida |
| Núcleo dentro de la esfera | 34 | 5 | se queda atrás y oscila como un líquido |
| Mirada | 140 | 17 | movimiento sacádico rápido, sin rebote |
| Giro de la cara hacia la mirada | 28 | 8 | la cabeza acompaña, más lenta que los ojos |
| Peso de cada variante del núcleo | 14 | 7,5 | fundido de ~0,6 s |
| Apertura de ojos | 160 | 20 | rápido y limpio |
| Curva de boca | 70 | 12 | — |
| Velocidad, giro y brillo del polvo | 5–8 | 4–5 | cambios de ánimo lentos |

**Para hacerlo más "blando"**: baja `c` (más rebote). **Más "pesado"**: baja `k`. **Más nervioso**: sube `k`.

### 5.2 Movimientos continuos

- **Flotación**: dos senos de frecuencias no múltiplos (0,95 Hz y 1,73 Hz en vertical, 0,61 Hz en horizontal), así el ciclo nunca se nota.
- **Inercia del núcleo**: la aceleración de la esfera se aplica al núcleo en sentido contrario; el núcleo está limitado a 0,24 radios del centro.
- **Respiración**: el núcleo escala ±2,2 % (más lento dormido).
- **Rotación interna**: dos copias de la variante dominante giran en sentidos opuestos.
- **Polvo generativo**: 240 motas orbitan el núcleo a distintas velocidades y profundidades (90 con movimiento reducido).
- **Respiración de forma en reposo**: cada 16 s se mezcla hasta un 32 % de otra variante (densa → aérea → espiral).
- **Parpadeo**: cada 2,2–6,2 s, dura 0,17 s, 18 % de las veces es doble.
- **Mirada libre**: sin puntero, cambia de punto cada 1,2–3,8 s; un 35 % de las veces vuelve al centro.

### 5.3 Interacción

- **Mirar**: los ojos siguen al dedo o puntero (normalizado a 2,2 radios); la cara gira un poco hacia allí.
- **Tocar** (menos de 0,3 s y menos de 12 px de movimiento): aplastado, sacudida del núcleo, sonrisa de 1,1 s y chispas. Dormido no sonríe.
- **Arrastrar y soltar**: estiramiento en la dirección de la velocidad (máx. 12 %) y vuelta con rebote.

### 5.4 Estados

| # | Estado | Cuándo en la app | Cara | Núcleo | Extra |
|---|---|---|---|---|---|
| 0 | Reposo | Siempre, entre acciones | ojos abiertos, sonrisa leve | base, forma que respira | mirada libre |
| 1 | Feliz | Todas las plantas al día | sonrisa abierta, coloretes plenos | aérea, más rápido | saltitos ocasionales |
| 2 | Sediento | Toca regar alguna planta | ojos caídos, cejas tristes, boca "o" pequeña | sedimento, se hunde y pierde brillo | mira hacia abajo |
| 3 | Preocupado | Diagnóstico o alerta meteorológica | cejas levantadas por dentro, boca hacia abajo | densa | tirita, lágrima |
| 4 | Pensando | Identificando una foto | ceja derecha levantada, boca de lado | espiral, giro rápido | mira arriba a la izquierda |
| 5 | Escuchando | Modo de voz | ojos muy abiertos, boca "o" | base, late con la voz | ondas concéntricas |
| 6 | Celebración | Tarea completada | ojos de estrella, boca muy abierta | radiante, muy brillante | saltos y chispas |
| 7 | Dormido | Noche o reposo invernal | ojos cerrados con pestañas | bruma, tenue | respiración lenta, "z" |

Los valores exactos de cada estado están en el array `ESTADOS` de `prototipo/avatar.html` (parámetros `open`, `brow`, `tilt`, `asym`, `curve`, `mopen`, `mw`, `mx`, `blush`, `tear`, `star`, `closed`, `drop`, `dim`, `speed`, `swirl`, `bob`, `glow`, `shiver`, `hop`, `voice`, `zzz`, `gaze`).

**Prioridad recomendada** cuando coinciden varias señales: Escuchando > Pensando > Preocupado > Sediento > Celebración (momentánea, 3–4 s) > Feliz > Dormido > Reposo.

### 5.5 Fondo claro y oscuro

Se decide por la luminancia del fondo real (< 0,4 = oscuro):

- **Claro**: núcleo opaco, motas verde pizarra, sombra gris en el suelo.
- **Oscuro**: halo + núcleo emisivo en *screen*, motas luminosas aditivas, reflejo verde en el suelo.

El cristal es el mismo en los dos: su transparencia ya funciona sobre cualquier color.

### 5.6 Accesibilidad

- Con `prefers-reduced-motion` (en la app: "Reducir movimiento" del sistema) la flotación baja al 30 %, no hay saltos, el estiramiento se reduce y el polvo pasa de 240 a 90 motas. El parpadeo se mantiene.
- El avatar **acompaña**, no informa: toda alerta (riego, diagnóstico, helada) debe existir también como texto. El avatar lleva etiqueta de accesibilidad con el estado ("Treegoh está preocupado: hay una alerta").

---

## 6. Llevarlo a la app

La app es React Native con Expo. Recomendación: **Rive**. Un solo archivo `.riv` con máquina de estados, runtime nativo para React Native, vectores nítidos a cualquier tamaño y muy ligero.

### 6.1 Montaje en Rive

1. **Importar** `capas-app/esfera-cristal.png` (o `prototipo/assets/cristal.webp`), las 7 variantes `-claro` y las 7 `-emisivo` (`variantes-nucleo/`).
2. **Dibujar la cara en vectores** dentro de Rive siguiendo las proporciones de la sección 2. Grupos con nombre: `ojo_izq`, `ojo_der` (cada uno con `globo`, `interior`, `brillo_grande`, `brillo_peq`, `parpado`, `pestanas`, `estrella`), `ceja_izq`, `ceja_der`, `boca`, `colorete_izq`, `colorete_der`, `lagrima`.
3. **Jerarquía**: `avatar` → `flotacion` → `esfera` (con `nucleo_mask`) → `nucleo` → (`variantes`, `cara`) y `cristal` encima. La cara cuelga del núcleo para heredar su movimiento.
4. **Animaciones**: una de reposo en bucle (flotación, respiración, rotación interna), una pose por estado (expresión + opacidad de la variante), parpadeo, toque y "z"/ondas/lágrima como capas propias.
5. **Máquina de estados** `Avatar` con estas entradas:

| Entrada | Tipo | Uso |
|---|---|---|
| `estado` | número 0–7 | estado de la tabla 5.4 |
| `mirarX`, `mirarY` | número −1…1 | dedo, cámara o elemento señalado |
| `tocar` | disparador | toque |
| `voz` | número 0–1 | volumen del micrófono |
| `oscuro` | booleano | núcleo emisivo + halo |

   Usa capas de mezcla (*blend states*) 1D/2D: `estado` para la expresión y las variantes, `mirarX`/`mirarY` para ojos y giro. Rive interpola entre poses, que es el equivalente a los muelles del prototipo; ajusta las curvas a "elástico/suave" para conservar la sensación.
6. **Modo de mezcla** de las variantes emisivas: *Screen* (o *Lighten*). Halo: *Add/Lighten*.
7. Exportar `avatar.riv`.

El polvo generativo (240 motas) no tiene equivalente directo en Rive. Opciones: un vídeo/secuencia corta en bucle de polvo sobre negro en modo *screen*, o dibujarlo aparte con `@shopify/react-native-skia` portando la función de motas del prototipo. Empieza sin él; las variantes y la rotación interna ya dan mucha vida.

### 6.2 Uso en React Native (Expo)

`rive-react-native` necesita código nativo: usa un *development build* (`npx expo prebuild` / EAS Build), no Expo Go.

```tsx
import Rive, { RiveRef, Fit } from "rive-react-native";
import { useRef, useEffect } from "react";
import { useColorScheme, AccessibilityInfo } from "react-native";

const ESTADO = { reposo: 0, feliz: 1, sediento: 2, preocupado: 3, pensando: 4, escuchando: 5, celebracion: 6, dormido: 7 } as const;
const SM = "Avatar";

export function AvatarTreegoh({ estado }: { estado: keyof typeof ESTADO }) {
  const rive = useRef<RiveRef>(null);
  const oscuro = useColorScheme() === "dark";

  useEffect(() => { rive.current?.setInputState(SM, "estado", ESTADO[estado]); }, [estado]);
  useEffect(() => { rive.current?.setInputState(SM, "oscuro", oscuro); }, [oscuro]);

  return (
    <Rive
      ref={rive}
      resourceName="avatar"            // avatar.riv en los recursos nativos
      stateMachineName={SM}
      fit={Fit.Contain}
      style={{ width: 160, height: 160 }}
      accessible
      accessibilityLabel={`Treegoh, ${estado}`}
    />
  );
}
// Toque: rive.current?.fireState(SM, "tocar")
// Mirada: rive.current?.setInputState(SM, "mirarX", x)  (x, y en −1…1)
```

El estado lo decide la lógica de la app (no el componente): un selector que mira riegos pendientes, diagnósticos abiertos, alertas meteorológicas, modo voz y hora local, y aplica la prioridad de la sección 5.4. Para "Reducir movimiento" usa `AccessibilityInfo.isReduceMotionEnabled()` y pasa una entrada booleana `calma` si la añades en Rive.

### 6.3 Tamaños

| Uso | Tamaño | Notas |
|---|---|---|
| Héroe (inicio, asistente) | 160–240 pt | todas las capas |
| Tarjetas y avisos | 64–96 pt | sin polvo generativo ni chispas |
| Pestaña o icono | 32–40 pt | solo cristal + núcleo base + ojos; sin parpadeo rápido |

Mantén `R ≈ 31 %` del lado del contenedor y el centro al 47 % de la altura, como en el prototipo, para que quepan sombra, saltos y "z".

---

## 7. Cómo editarlo en el futuro

Requisitos para los scripts (una vez):

```bash
python3 -m venv .venv && .venv/bin/pip install numpy scipy pillow
```

| Quiero… | Cómo |
|---|---|
| **Cambiar el verde del modo oscuro** | `colores` y `paradas` en `generar_capas.py` (núcleo base) y en `normalizar_variantes.py` (variantes); verde del halo: `verde` en `generar_capas.py`. Vuelve a ejecutar ambos. |
| **Cambiar el tono del núcleo en claro** | `tono`, la mezcla con `gris` y el factor de color en `normalizar_variantes.py`. |
| **Regenerar la esfera** | Genera en Magnific con el prompt de esfera vacía **sobre fondo liso** (cualquier color uniforme vale), guárdala como `esfera.png`, quita el fondo para obtener `esfera-sinfondo.png` (solo se usa como máscara) y ejecuta `.venv/bin/python capas-app/generar_capas.py . capas-app`. Revisa `preview-lamina.png` sobre los cuatro fondos. |
| **Menos o más niebla en el cristal** | Umbral de la `rodilla` en `generar_capas.py` (0,20 actual). |
| **Añadir una variante del núcleo** | Magnific → Variaciones (modo personalizado) desde `particulas.png` sobre negro; descarga la casilla y ejecuta `.venv/bin/python variantes-nucleo/normalizar_variantes.py variantes-nucleo nueva=ruta/casilla.jpg`. Añádela a `VARIANTES` y `NUC_ESTADO` en el prototipo y como capa en Rive. |
| **Añadir un estado** | Nueva entrada en `ESTADOS` (prototipo) con sus parámetros y variante en `NUC_ESTADO`; en Rive, una pose nueva y el siguiente número de `estado`. Documenta cuándo se activa en la tabla 5.4. |
| **Cambiar la fluidez** | Tabla 5.1: valores `k`/`c` en el prototipo (`rigidez` y los `new Muelle(...)`). Prueba primero en el prototipo, luego copia la sensación a las curvas de Rive. |
| **Cambiar ojos o colores de la cara** | Constantes `CIRUELA`, `CIRUELA2`, `ROSA`, `LENGUA` y funciones `ojo`, `ceja`, `boca` del prototipo; en Rive, los rellenos de los grupos de la cara. |
| **Probar sobre otro fondo** | Añade el color a `FONDOS` en el prototipo. |

**Regla de oro**: el prototipo es la fuente de verdad del movimiento. Cualquier cambio de sensación se prueba ahí antes de tocar Rive o la app.

### Lista de comprobación antes de dar un cambio por bueno

- [ ] Se ve bien en crema, blanco, pizarra y noche (sin anillos, niebla ni bordes cuadrados).
- [ ] El núcleo nunca se sale de la esfera, ni arrastrando fuerte.
- [ ] Todas las transiciones entre estados son continuas (prueba "Recorrer estados solo").
- [ ] Con "Reducir movimiento" activado sigue vivo pero tranquilo.
- [ ] 60 fps en un móvil de gama media (el prototipo muestra los fps).

---

## 8. Decisiones y pendientes

**Decisiones tomadas**

- 3D estilizado tipo cristal líquido, no fotorrealista, para coherencia con los iconos de la app.
- Ojos ciruela en lugar de negros (calidez, complementario del verde).
- Cristal con transparencia calculada en lugar de "quitar fondo".
- Núcleo emisivo + halo en fondos oscuros.
- Cara vectorial animable; la hoja de expresiones de Magnific queda como referencia.
- Movimiento por muelles, sin duraciones fijas.
- Una variante del núcleo por familia de estados, fundidas con muelles.

**Pendiente**

1. Montar `avatar.riv` siguiendo la sección 6.1.
2. Decidir cómo llevar el polvo generativo a la app (Skia o secuencia en bucle).
3. Sonidos opcionales para toque y celebración (respetando el modo silencio).
4. Vídeo de presentación para redes o la tienda de apps (Magnific vídeo a partir de las capas).
5. Regenerar la variante "sedimento" si se quiere que se hunda más.
