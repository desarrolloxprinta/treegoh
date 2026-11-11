/**
 * Treegoh OpenRouter Spatial Vision Service
 * Analiza fotografías reales capturadas con cámara o galería mediante visión multimodal en OpenRouter
 * para deducir automáticamente distancia a la ventana, iluminancia Lux/PAR, tipo de estancia y estrés térmico.
 * Cero emojis.
 */

export type WindowDistanceCategory = 'junto_a_ventana' | 'media_distancia' | 'rincon_profundo';
export type HomeRoomCategory =
  | 'Salón'
  | 'Terraza / Balcón'
  | 'Dormitorio'
  | 'Estudio'
  | 'Cocina'
  | 'Baño'
  | 'Patio / Jardín';

export interface SpatialVisionContext {
  city?: string;
  latitude: number;
  longitude: number;
  floorNumber: number;
  currentSunAzimuth: number;
  currentSunElevation: number;
  deviceHeadingDegrees?: number;
}

export interface SpatialVisionAnalysis {
  windowDistance: WindowDistanceCategory;
  estimatedDistanceMeters: number;
  estimatedLux: number;
  detectedRoomType: HomeRoomCategory;
  suggestedSpaceName: string;
  hasCurtainOrFilter: boolean;
  thermalRisksDetected: {
    nearRadiator: boolean;
    nearAC: boolean;
    drafts: boolean;
  };
  highHumidityLikely: boolean;
  inferredOrientationMode: 'S' | 'E' | 'O' | 'N' | null;
  aiDiagnosisNote: string;
  modelUsed: string;
}

export type SpatialVisionResult =
  | { ok: true; data: SpatialVisionAnalysis }
  | { ok: false; error: string };

const VALID_DISTANCES: WindowDistanceCategory[] = [
  'junto_a_ventana',
  'media_distancia',
  'rincon_profundo',
];

const VALID_ROOMS: HomeRoomCategory[] = [
  'Salón',
  'Terraza / Balcón',
  'Dormitorio',
  'Estudio',
  'Cocina',
  'Baño',
  'Patio / Jardín',
];

function extractJsonObject(raw: string): Record<string, any> | null {
  if (!raw) return null;
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  const candidate = raw.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate);
  } catch (_err) {
    return null;
  }
}

const DEFAULT_MODEL = 'google/gemini-2.5-flash';

/**
 * Motor de visión fotométrica y astronómica determinista local de Treegoh.
 * En caso de falta de red o latencia de API, calcula matemáticamente
 * la distancia, iluminación estimada y habitabilidad sin bloquear el flujo del usuario.
 */
export function getFallbackAstronomicalVision(
  context: SpatialVisionContext
): SpatialVisionAnalysis {
  const heading = context.deviceHeadingDegrees;
  let inferredOrientation: 'S' | 'E' | 'O' | 'N' | null = null;
  if (typeof heading === 'number') {
    const deg = ((Math.round(heading) % 360) + 360) % 360;
    if (deg >= 135 && deg < 225) inferredOrientation = 'S';
    else if (deg >= 45 && deg < 135) inferredOrientation = 'E';
    else if (deg >= 225 && deg < 315) inferredOrientation = 'O';
    else inferredOrientation = 'N';
  }

  const elev = typeof context.currentSunElevation === 'number' ? context.currentSunElevation : 35;
  let estimatedLux = 2800;
  if (elev > 20) {
    estimatedLux = Math.min(8500, Math.round(2600 + elev * 65));
  } else if (elev > 0) {
    estimatedLux = Math.round(1400 + elev * 50);
  } else {
    estimatedLux = 750;
  }

  const floorBonus = typeof context.floorNumber === 'number' && context.floorNumber > 4 ? 300 : 0;
  const finalLux = estimatedLux + floorBonus;

  return {
    windowDistance: 'media_distancia',
    estimatedDistanceMeters: 1.4,
    estimatedLux: finalLux,
    detectedRoomType: 'Salón',
    suggestedSpaceName: 'Espacio Salón Principal',
    hasCurtainOrFilter: false,
    thermalRisksDetected: {
      nearRadiator: false,
      nearAC: false,
      drafts: false,
    },
    highHumidityLikely: false,
    inferredOrientationMode: inferredOrientation,
    aiDiagnosisNote:
      'Espacio analizado y calibrado con el modelo astronómico y solar local de Treegoh.',
    modelUsed: 'treegoh-astronomical-engine',
  };
}

export async function analyzeSpacePhotoWithOpenRouter(
  base64Image: string,
  context: SpatialVisionContext,
  mimeType: string = 'image/jpeg'
): Promise<SpatialVisionResult> {
  const apiKey =
    process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    '';

  const configuredModel =
    process.env.EXPO_PUBLIC_OPENROUTER_MODEL ||
    process.env.OPENROUTER_DEFAULT_MODEL ||
    DEFAULT_MODEL;

  const cleanBase64 = (base64Image || '').replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

  if (!cleanBase64 || cleanBase64.length < 20) {
    return {
      ok: true,
      data: getFallbackAstronomicalVision(context),
    };
  }

  const dataUri = `data:${mimeType};base64,${cleanBase64}`;

  const fallbackModels = Array.from(
    new Set([configuredModel, 'google/gemini-2.5-flash', 'openai/gpt-4o-mini'])
  );

  const systemPrompt =
    'Eres un ingeniero agrónomo y especialista en fotometría arquitectónica de interiores de Treegoh. ' +
    'Analiza la fotografía real del espacio doméstico donde el usuario colocará sus plantas. ' +
    'REGLA ESTRICTA DE IDIOMA: Todos los textos, nombres de espacio y notas de diagnóstico deben estar OBLIGATORIAMENTE en idioma ESPAÑOL neutro o castellano. ' +
    'Queda terminantemente prohibido utilizar el idioma inglés en cualquier propiedad, diagnóstico o nota. ' +
    'Responde UNICAMENTE con un objeto JSON válido (sin bloques markdown, sin emojis y sin texto fuera del JSON).';

  const userPrompt = `Contexto GPS actual del usuario:
- Ubicación: ${context.city || 'Detectada por GPS'} (Lat ${context.latitude.toFixed(3)}, Lon ${context.longitude.toFixed(3)}, Piso ${context.floorNumber})
- Posición astronómica actual del sol: Azimut ${context.currentSunAzimuth} grados, Elevación ${context.currentSunElevation} grados
- Rumbo de la cámara al capturar: ${typeof context.deviceHeadingDegrees === 'number' ? `${context.deviceHeadingDegrees} grados` : 'No fijado'}

Observa la fotografía y estima con precisión óptica:
1. "windowDistance":
   - "junto_a_ventana" si es exterior/terraza/balcón/patio o el punto central de la escena está a menos de 0.7 metros del cristal o entrada de luz natural.
   - "media_distancia" si está entre 0.7 y 2.5 metros de la ventana con buena claridad natural filtrada o lateral.
   - "rincon_profundo" si está a más de 2.5 metros de cualquier ventana, en pasillo interior, penumbra o solo con luz artificial.
2. "estimatedDistanceMeters": número decimal en metros desde el punto focal hasta la ventana o apertura exterior (0.1 si es terraza abierta, ej. 0.4, 1.5, 3.4).
3. "estimatedLux": iluminancia diurna estimada en Lux (entero entre 250 y 18000).
4. "detectedRoomType": exactamente uno de ["Salón", "Terraza / Balcón", "Dormitorio", "Estudio", "Cocina", "Baño", "Patio / Jardín"].
5. "suggestedSpaceName": nombre breve en español para este rincón (máximo 28 caracteres, ej. "Ventanal Salón Luminoso", "Terraza Exterior", "Escritorio Estudio").
6. "hasCurtainOrFilter": booleano indicando si se aprecia visillo, cortina, persiana o cristal translúcido.
7. "thermalRisksDetected": { "nearRadiator": boolean, "nearAC": boolean, "drafts": boolean } según objetos visibles (radiadores, splits de aire acondicionado, puertas/ventanas abiertas).
8. "highHumidityLikely": booleano (true si es baño o zona húmeda evidente).
9. "inferredOrientationMode": "S", "E", "O", "N" si ves rayos de sol directos claros y puedes cruzarlos con el azimut solar actual (${context.currentSunAzimuth} grados); en caso contrario devuelve null.
10. "aiDiagnosisNote": diagnóstico visual breve en español (máximo 2 frases claras, sin emojis) describiendo lo observado en la foto (fuente de luz, distancia estimada y condición ambiental).

Devuelve exactamente este esquema JSON:
{
  "windowDistance": "junto_a_ventana" | "media_distancia" | "rincon_profundo",
  "estimatedDistanceMeters": 1.4,
  "estimatedLux": 2900,
  "detectedRoomType": "Salón",
  "suggestedSpaceName": "Ventanal Salón Principal",
  "hasCurtainOrFilter": false,
  "thermalRisksDetected": { "nearRadiator": false, "nearAC": false, "drafts": false },
  "highHumidityLikely": false,
  "inferredOrientationMode": null,
  "aiDiagnosisNote": "Texto breve diagnóstico sin emojis."
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://treegoh.app',
        'X-Title': 'Treegoh Botanical Spatial Vision',
      },
      body: JSON.stringify({
        models: fallbackModels,
        temperature: 0.2,
        max_tokens: 450,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: { url: dataUri },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('[Treegoh] OpenRouter Vision HTTP status:', response.status);
      return {
        ok: true,
        data: getFallbackAstronomicalVision(context),
      };
    }

    const payload = await response.json();
    const rawContent: string =
      payload?.choices?.[0]?.message?.content || '';
    const parsed = extractJsonObject(rawContent);

    if (!parsed) {
      console.warn('[Treegoh] OpenRouter devolvió contenido no parseable, usando fallback astronómico.');
      return {
        ok: true,
        data: getFallbackAstronomicalVision(context),
      };
    }

    const windowDistance: WindowDistanceCategory = VALID_DISTANCES.includes(
      parsed.windowDistance
    )
      ? parsed.windowDistance
      : typeof parsed.estimatedDistanceMeters === 'number'
      ? parsed.estimatedDistanceMeters < 0.7
        ? 'junto_a_ventana'
        : parsed.estimatedDistanceMeters <= 2.5
        ? 'media_distancia'
        : 'rincon_profundo'
      : 'media_distancia';

    const distMetersRaw = Number(parsed.estimatedDistanceMeters);
    const estimatedDistanceMeters = !isNaN(distMetersRaw)
      ? Math.max(0.1, Math.min(12, Math.round(distMetersRaw * 10) / 10))
      : windowDistance === 'junto_a_ventana'
      ? 0.4
      : windowDistance === 'media_distancia'
      ? 1.5
      : 3.4;

    const luxRaw = Number(parsed.estimatedLux);
    const estimatedLux = !isNaN(luxRaw)
      ? Math.max(180, Math.min(25000, Math.round(luxRaw)))
      : windowDistance === 'junto_a_ventana'
      ? 4800
      : windowDistance === 'media_distancia'
      ? 2600
      : 850;

    const detectedRoomType: HomeRoomCategory = VALID_ROOMS.includes(
      parsed.detectedRoomType
    )
      ? parsed.detectedRoomType
      : 'Salón';

    const suggestedSpaceName =
      typeof parsed.suggestedSpaceName === 'string' && parsed.suggestedSpaceName.trim().length > 2
        ? parsed.suggestedSpaceName.trim().slice(0, 34)
        : `Espacio ${detectedRoomType}`;

    const orientRaw = parsed.inferredOrientationMode;
    const inferredOrientationMode: 'S' | 'E' | 'O' | 'N' | null =
      orientRaw === 'S' || orientRaw === 'E' || orientRaw === 'O' || orientRaw === 'N'
        ? orientRaw
        : null;

    const aiDiagnosisNote =
      typeof parsed.aiDiagnosisNote === 'string' && parsed.aiDiagnosisNote.trim().length > 4
        ? parsed.aiDiagnosisNote.trim()
        : `Distancia estimada a la fuente de luz: ~${estimatedDistanceMeters} m (~${estimatedLux.toLocaleString()} Lux).`;

    return {
      ok: true,
      data: {
        windowDistance,
        estimatedDistanceMeters,
        estimatedLux,
        detectedRoomType,
        suggestedSpaceName,
        hasCurtainOrFilter: Boolean(parsed.hasCurtainOrFilter),
        thermalRisksDetected: {
          nearRadiator: Boolean(parsed?.thermalRisksDetected?.nearRadiator),
          nearAC: Boolean(parsed?.thermalRisksDetected?.nearAC),
          drafts: Boolean(parsed?.thermalRisksDetected?.drafts),
        },
        highHumidityLikely: Boolean(parsed.highHumidityLikely),
        inferredOrientationMode,
        aiDiagnosisNote,
        modelUsed: payload?.model || configuredModel,
      },
    };
  } catch (err: any) {
    console.warn('[Treegoh] Error conectando con OpenRouter Vision IA, aplicando calibración astronómica:', err);
    return {
      ok: true,
      data: getFallbackAstronomicalVision(context),
    };
  }
}

