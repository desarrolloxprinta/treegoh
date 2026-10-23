# Fase 2 — Diagnóstico visual, plagas y enfermedades

## Si existe `output/research/fase-2.md` (informe de Research de Claude desktop)
Úsalo como material de partida en vez de investigar desde cero:
1. Léelo entero. Abre con WebFetch todas las citas que respalden tratamientos y una muestra de al menos 10 del resto. Si una URL no existe o no dice lo que se le atribuye, elimina la cita y baja la confianza.
2. Convierte el árbol de síntomas a `output/diagnostico/arbol.json` según el esquema, conservando los ids S01, S02... del informe. Reparte el resto en los archivos Markdown de abajo. No resumas.
3. Completa con búsqueda propia lo que el informe deje corto.
4. Pasa sus secciones "Contradicciones" y "Lagunas" a `output/contradicciones.md` y `output/lagunas.md`.

## 1. `output/diagnostico/arbol.json` (según `schemas/diagnostico.schema.json`)
Árbol de decisión para el agente con visión. Para cada síntoma observable en foto:
- `sintoma`: hojas amarillas (generalizado, hojas viejas, hojas nuevas, entre nervios), puntas marrones, bordes marrones, manchas marrones secas, manchas negras blandas, manchas con halo amarillo, moteado fino plateado, telarañas, masas algodonosas blancas, escudos marrones en tallo, hojas caídas, hojas enrolladas, hojas blandas, hojas arrugadas, tallos blandos o negros en la base, etiolación, crecimiento detenido, hojas pequeñas, pérdida de variegación, caída de hojas tras cambio de sitio, sustrato con moho, mosquitos sobre el sustrato, polvo blanco en hojas, agujeros, hojas pegajosas, residuo negro (fumagina).
- `como_se_ve`: descripción para que la IA de visión lo reconozca.
- `causas`: lista ordenada por probabilidad, cada una con `probabilidad` (alta, media, baja), `como_diferenciar` y `preguntas_confirmacion` que el agente debe hacer al usuario (¿cuándo regaste?, ¿ha cambiado de sitio?, ¿hay calefacción cerca?, ¿has mirado el envés?).
- `tratamiento`: pasos de menor a mayor agresividad, con `tiempo_recuperacion` orientativo y `cuando_descartar` (señales de que no se salva).
- `confianza` y `fuentes` por síntoma.

## 2. `output/diagnostico/plagas-enfermedades.md`
Ficha para cada una: araña roja, cochinilla algodonosa, cochinilla de escudo, pulgón, trips, mosca del sustrato (sciáridos), mosca blanca, oídio, botritis, manchas foliares fúngicas, manchas bacterianas, pudrición radicular (Pythium, Phytophthora, Fusarium), roya, nematodos. Para cada una:
- Identificación visual (foto: qué buscar, dónde, con qué aumento), ciclo de vida y condiciones que la favorecen en interior.
- Daño que causa y especies más sensibles.
- Tratamiento escalonado: mecánico → jabón potásico / aceite de neem → biológico → químico de uso doméstico autorizado en España (nombra ingrediente activo, no marca). Dosis y frecuencia según fuente.
- Prevención y cuarentena.
- Confianza y fuentes.

## 3. `output/diagnostico/protocolo-fotos.md`
- Fotos que la app debe pedir en un diagnóstico: planta entera a distancia, hoja afectada por haz y envés, base del tallo, sustrato, maceta y plato, entorno (ventana).
- Condiciones: luz natural, sin flash, fondo neutro, distancia, enfoque.
- Seguimiento periódico: frecuencia por nivel de dificultad de la planta, mismo ángulo y hora, indicadores a comparar (color, turgencia, nº de hojas nuevas, tamaño, presencia de plaga, estado del sustrato).
- Señales de deterioro temprano que el agente debe vigilar entre fotos.

## Al terminar
Contradicciones y lagunas a sus archivos. `python scripts/validar.py`. Marca Fase 2 en `ESTADO.md`.
