/**
 * ==============================================================================
 * Treegoh Botanical Sanctuary - Magnific AI Service
 * ==============================================================================
 * Integración con el motor de IA Magnific (Upscaling, Restyle y Ultra-HD Texturing)
 * para renderizado botánico cinematográfico y mejora fotorrealista de plantas.
 * ==============================================================================
 */

const MAGNIFIC_API_KEY = process.env.EXPO_PUBLIC_MAGNIFIC_API_KEY || '';

const MAGNIFIC_BASE_URL = 'https://api.magnific.com/v1';

export interface MagnificUpscaleParams {
  imageUrl: string;
  scale?: 2 | 4 | 8;
  creativity?: number; // 0 - 100
  resemblance?: number; // 0 - 100
  fractality?: number; // 0 - 100
  prompt?: string;
}

export interface MagnificRestyleParams {
  imageUrl: string;
  prompt: string;
  strength?: number;
}

export interface MagnificJobResult {
  success: boolean;
  jobId?: string;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  error?: string;
}

/**
 * Comprueba si la API key de Magnific está configurada en el entorno.
 */
export function isMagnificConfigured(): boolean {
  return Boolean(MAGNIFIC_API_KEY && MAGNIFIC_API_KEY.length > 10);
}

/**
 * Solicita una mejora de resolución y textura botánica (Upscale) a Magnific AI.
 */
export async function requestMagnificUpscale(
  params: MagnificUpscaleParams
): Promise<MagnificJobResult> {
  if (!isMagnificConfigured()) {
    return {
      success: false,
      error: 'La clave de API de Magnific no está configurada.',
    };
  }

  try {
    const response = await fetch(`${MAGNIFIC_BASE_URL}/ai/upscale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-magnific-api-key': MAGNIFIC_API_KEY,
      },
      body: JSON.stringify({
        image_url: params.imageUrl,
        scale: params.scale ?? 2,
        creativity: params.creativity ?? 20,
        resemblance: params.resemblance ?? 85,
        fractality: params.fractality ?? 10,
        prompt: params.prompt || 'Atmospheric botanical plant, clean natural light, lush green foliage',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Error de Magnific API (${response.status}): ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      jobId: data.id || data.job_id,
      status: data.status || 'processing',
      resultUrl: data.result_url || data.output_url || data.image_url,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error de red al conectar con Magnific AI.',
    };
  }
}

/**
 * Solicita una reinterpretación o estilo botánico (Restyle / Relight) a Magnific AI.
 */
export async function requestMagnificRestyle(
  params: MagnificRestyleParams
): Promise<MagnificJobResult> {
  if (!isMagnificConfigured()) {
    return {
      success: false,
      error: 'La clave de API de Magnific no está configurada.',
    };
  }

  try {
    const response = await fetch(`${MAGNIFIC_BASE_URL}/ai/restyle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-magnific-api-key': MAGNIFIC_API_KEY,
      },
      body: JSON.stringify({
        image_url: params.imageUrl,
        prompt: params.prompt,
        strength: params.strength ?? 0.6,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Error de Magnific Restyle (${response.status}): ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      jobId: data.id || data.job_id,
      status: data.status || 'processing',
      resultUrl: data.result_url || data.output_url,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error al conectar con el motor de restyle de Magnific.',
    };
  }
}

