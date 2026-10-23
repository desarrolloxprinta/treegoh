/**
 * Treegoh • Servicio de Voz Botánica (ElevenLabs)
 * Voz oficial: "U9tZtg3uJtVgXPkvosWR"
 * Modelo: eleven_multilingual_v2
 * 
 * Regla de Diseño: El Character de Treegoh cambia dinámicamente a 'listening' / 'speaking'
 * y su Status Orb pulsa en Púrpura Resonancia (#9C8EB9) durante la interacción de audio.
 */

export interface VoiceStreamOptions {
  stability?: number;       // Canónico: 0.50 para cadencia botánica serena
  similarityBoost?: number; // Canónico: 0.85
  style?: number;           // Canónico: 0.05 (natural, no exagerado)
  useSpeakerBoost?: boolean;
}

export class BotanicaVoiceService {
  private static readonly API_BASE = 'https://api.elevenlabs.io/v1';
  private static readonly VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'U9tZtg3uJtVgXPkvosWR';
  private static readonly API_KEY = process.env.ELEVENLABS_API_KEY || '';

  /**
   * Genera audio streaming para consejos botánicos clínicos y respuestas del Character
   */
  static async synthesizePlantAdvice(
    text: string,
    options: VoiceStreamOptions = {}
  ): Promise<ArrayBuffer> {
    if (!this.API_KEY) {
      throw new Error('ELEVENLABS_API_KEY no está configurada.');
    }

    const endpoint = `${this.API_BASE}/text-to-speech/${this.VOICE_ID}/stream`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: options.stability ?? 0.50,
          similarity_boost: options.similarityBoost ?? 0.85,
          style: options.style ?? 0.05,
          use_speaker_boost: options.useSpeakerBoost ?? true
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error en ElevenLabs (${response.status}): ${errText}`);
    }

    return await response.arrayBuffer();
  }
}
