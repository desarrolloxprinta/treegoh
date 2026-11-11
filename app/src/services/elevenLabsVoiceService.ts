/**
 * ElevenLabs Botanical Voice Service — Treegoh
 * 
 * Motor de voz oficial preconfigurado en la hoja de ruta de Treegoh:
 * - API Key: sk_9d156ac997af7be46af35f1afd5d3c07caa902b50bc63cc4
 * - Voice ID: a7NxsR5B1mpwgpVa10g3 (Voz Botánica de Treegoh, serena, cálida y natural)
 * - Model ID: eleven_multilingual_v2 (Español fluido sin acento robótico)
 */

import { Platform } from 'react-native';
import { createVideoPlayer } from 'expo-video';
import { requireOptionalNativeModule } from 'expo-modules-core';

const ELEVENLABS_API_KEY =
  process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY ||
  process.env.ELEVENLABS_API_KEY ||
  'sk_9d156ac997af7be46af35f1afd5d3c07caa902b50bc63cc4';

const ELEVENLABS_VOICE_ID = 'a7NxsR5B1mpwgpVa10g3';

const ELEVENLABS_MODEL_ID =
  process.env.EXPO_PUBLIC_ELEVENLABS_MODEL_ID ||
  process.env.ELEVENLABS_MODEL_ID ||
  'eleven_multilingual_v2';

let currentAudioInstance: any = null;
let currentSafetyTimer: ReturnType<typeof setTimeout> | null = null;
let currentEndCallback: (() => void) | null = null;

// Caché en memoria de notas de voz generadas en la sesión actual para re-escucharlas sin gastar créditos adicionales
const sessionAudioCache = new Map<string, { uri: string; isWebDataUri?: boolean; durationSeconds: number }>();

export interface VoicePlaybackCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Convierte un ArrayBuffer a Base64 en JS puro (RFC 4648) sin depender de btoa ni Buffer en Hermes
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  let result = '';
  let i = 0;

  while (i < len) {
    const b0 = bytes[i++] ?? 0;
    const hasB1 = i < len;
    const b1 = hasB1 ? (bytes[i++] ?? 0) : 0;
    const hasB2 = i < len;
    const b2 = hasB2 ? (bytes[i++] ?? 0) : 0;

    const triplet = (b0 << 16) | (b1 << 8) | b2;

    result += BASE64_CHARS[(triplet >> 18) & 0x3f];
    result += BASE64_CHARS[(triplet >> 12) & 0x3f];
    result += hasB1 ? BASE64_CHARS[(triplet >> 6) & 0x3f] : '=';
    result += hasB2 ? BASE64_CHARS[triplet & 0x3f] : '=';
  }

  return result;
}

/**
 * Extrae el audio de un Response HTTP como cadena Base64 usando el FileReader nativo de iOS/Android
 * o el codificador RFC 4648 en memoria como respaldo
 */
async function readResponseAsBase64(res: Response): Promise<string | null> {
  try {
    if (typeof FileReader !== 'undefined' && typeof res.blob === 'function') {
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Empty FileReader result'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      const commaIdx = dataUrl.indexOf(',');
      const b64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1).trim() : dataUrl.trim();
      if (b64.length > 128) return b64;
    }
  } catch (_e) {}

  try {
    const buf = await res.arrayBuffer();
    if (buf && buf.byteLength > 128) {
      return arrayBufferToBase64(buf);
    }
  } catch (_e) {}

  return null;
}

/**
 * Guarda una cadena Base64 de audio MP3 en el directorio temporal nativo de iOS/Android
 * usando codificación base64 compatible con FileSystemModule.swift de Expo SDK 58
 */
async function writeBase64Mp3ToTempFile(base64Audio: string): Promise<string | null> {
  try {
    const cleanBase64 = base64Audio.replace(/^data:audio\/\w+;base64,/, '').trim();
    if (!cleanBase64) return null;

    const fsModern = requireOptionalNativeModule<any>('FileSystem');
    const fsLegacy = requireOptionalNativeModule<any>('ExponentFileSystem');
    const rawCacheDir = fsModern?.cacheDirectory || fsLegacy?.cacheDirectory;
    if (!rawCacheDir) return null;

    const cacheDir = String(rawCacheDir).replace(/\/*$/, '') + '/';
    const fileUri = `${cacheDir}treegoh_voice_${Date.now()}.mp3`;

    if (fsModern?.FileSystemFile) {
      try {
        const nativeFile = new fsModern.FileSystemFile(fileUri);
        if (typeof nativeFile.create === 'function') {
          try {
            nativeFile.create({ intermediates: true, overwrite: true });
          } catch (_e) {}
        }
        if (typeof nativeFile.writeSync === 'function') {
          nativeFile.writeSync(cleanBase64, { encoding: 'base64' });
          return nativeFile.uri || fileUri;
        }
        if (typeof nativeFile.write === 'function') {
          await nativeFile.write(cleanBase64, { encoding: 'base64' });
          return nativeFile.uri || fileUri;
        }
      } catch (_e) {}
    }

    if (fsLegacy?.writeAsStringAsync) {
      await fsLegacy.writeAsStringAsync(fileUri, cleanBase64, { encoding: 'base64' });
      return fileUri;
    }
  } catch (_e) {}
  return null;
}

/**
 * Guarda un ArrayBuffer de audio MP3 en el directorio temporal nativo de iOS/Android
 */
async function writeMp3BufferToTempFile(audioBuffer: ArrayBuffer): Promise<string | null> {
  try {
    const base64Audio = arrayBufferToBase64(audioBuffer);
    if (!base64Audio) return null;
    return await writeBase64Mp3ToTempFile(base64Audio);
  } catch (_e) {}
  return null;
}

/**
 * Reproduce un archivo o URI de audio en iOS/Android usando el motor nativo AVPlayer (expo-video)
 */
function playNativeAudioUri(
  uri: string,
  estimatedDurationMs: number,
  callbacks?: VoicePlaybackCallbacks
): boolean {
  try {
    const player = createVideoPlayer({ uri });
    player.audioMixingMode = 'doNotMix';
    player.muted = false;
    player.volume = 1.0;
    currentAudioInstance = player;

    let finished = false;
    const finishPlayback = () => {
      if (finished) return;
      finished = true;
      if (currentSafetyTimer) {
        clearTimeout(currentSafetyTimer);
        currentSafetyTimer = null;
      }
      currentEndCallback = null;
      if (currentAudioInstance === player) {
        currentAudioInstance = null;
      }
      try {
        player.pause();
        (player as any).release?.();
      } catch (_e) {}
      callbacks?.onEnd?.();
    };

    currentEndCallback = finishPlayback;

    try {
      player.addListener('playToEnd', () => {
        finishPlayback();
      });
      player.addListener('statusChange', ({ status }) => {
        if (status === 'readyToPlay' && !finished) {
          try {
            const realDurationSec = Number((player as any).duration || 0);
            if (realDurationSec > 1 && currentSafetyTimer) {
              clearTimeout(currentSafetyTimer);
              currentSafetyTimer = setTimeout(() => {
                finishPlayback();
              }, Math.round(realDurationSec * 1000) + 10000);
            }
            player.play();
          } catch (_e) {}
        } else if (status === 'error') {
          finishPlayback();
        }
      });
    } catch (_e) {}

    player.play();

    // Temporizador de seguridad holgado (nunca corta la locución a la mitad; solo actúa si el evento playToEnd falla)
    currentSafetyTimer = setTimeout(() => {
      finishPlayback();
    }, Math.max(estimatedDurationMs * 2.4 + 25000, 120000));

    return true;
  } catch (_e) {
    return false;
  }
}

/**
 * Transforma el texto con formato Markdown en un guion hablado cálido, fluido y con entonación natural
 * leyendo ÍNTEGRAMENTE toda la respuesta de principio a fin sin omitir encabezados ni cortar párrafos.
 */
function formatTextForExpressiveSpeech(rawText: string): string {
  if (!rawText) return '';

  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const spokenParts: string[] = [];

  for (const line of lines) {
    if (line.startsWith('#')) {
      const headerContent = line.replace(/^#+\s*/, '').replace(/[\*\_`]/g, '').trim();
      if (!headerContent) continue;
      if (/^(hola|bienvenid|buenos|buenas)/i.test(headerContent)) {
        spokenParts.push(/[!?…]$/.test(headerContent) ? headerContent : `¡${headerContent}!`);
      } else {
        spokenParts.push(/[.!?…:]$/.test(headerContent) ? headerContent : `${headerContent}.`);
      }
      continue;
    }

    let cleaned = line
      .replace(/^>\s*/, '')
      .replace(/^[•\-\*]\s*/, '')
      // Si la viñeta empieza con "**Concepto**: explicación", suavizar los dos puntos en pausa natural
      .replace(/^\*\*([^*]+)\*\*\s*:\s*/g, '$1: ')
      .replace(/[\*\_\#\~\`]/g, '')
      .replace(/«|»/g, '')
      .replace(/\bVPD\b/g, 'humedad del ambiente')
      .replace(/\bCO2\b/g, 'dióxido de carbono')
      .replace(/%/g, ' por ciento')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) continue;
    if (!/[.!?…:]$/.test(cleaned)) {
      cleaned += '.';
    }
    spokenParts.push(cleaned);
  }

  const finalSpeech = spokenParts.join(' ');
  return finalSpeech || rawText.replace(/[\*\_\#\~\`•]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Sintetiza y reproduce la voz del Asistente Botánico mediante ElevenLabs
 * con ajustes de expresividad, calidez y entonación natural (Voice ID: a7NxsR5B1mpwgpVa10g3).
 * Incluye caché de sesión para reproducir notas de voz sin coste adicional.
 */
export async function speakWithElevenLabs(
  text: string,
  callbacks?: VoicePlaybackCallbacks
): Promise<{ success: boolean; durationSeconds?: number; audioUri?: string }> {
  stopVoicePlayback();
  callbacks?.onStart?.();

  const cleanText = formatTextForExpressiveSpeech(text);
  if (!cleanText) {
    callbacks?.onEnd?.();
    return { success: false };
  }

  // Duración estimada sin tope artificial de 19s para permitir respuestas completas de cualquier longitud
  const estimatedDurationMs = Math.max(cleanText.length * 92, 5200);

  // 0. Reutilizar audio en caché si esta nota de voz ya fue sintetizada en la sesión (ahorro del 100% en re-escuchas)
  const cached = sessionAudioCache.get(cleanText);
  if (cached?.uri) {
    try {
      if (
        cached.isWebDataUri &&
        Platform.OS === 'web' &&
        typeof window !== 'undefined' &&
        (window as any).Audio
      ) {
        const audio = new (window as any).Audio(cached.uri);
        currentAudioInstance = audio;
        audio.onended = () => {
          currentAudioInstance = null;
          callbacks?.onEnd?.();
        };
        audio.onerror = () => {
          currentAudioInstance = null;
          callbacks?.onEnd?.();
        };
        await audio.play();
        return {
          success: true,
          durationSeconds: cached.durationSeconds,
          audioUri: cached.uri,
        };
      } else if (playNativeAudioUri(cached.uri, estimatedDurationMs, callbacks)) {
        return {
          success: true,
          durationSeconds: cached.durationSeconds,
          audioUri: cached.uri,
        };
      }
    } catch (_e) {
      sessionAudioCache.delete(cleanText);
    }
  }

  // Intentar primero la voz configurada de ElevenLabs (a7NxsR5B1mpwgpVa10g3) con máxima expresividad,
  // probando eleven_multilingual_v2 y eleven_flash_v2_5
  const elevenModels = [ELEVENLABS_MODEL_ID, 'eleven_flash_v2_5', 'eleven_turbo_v2_5'];
  for (const modelId of elevenModels) {
    try {
      const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?optimize_streaming_latency=1`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: modelId,
          voice_settings: {
            stability: 0.25,
            similarity_boost: 0.86,
            style: 0.68,
            use_speaker_boost: true,
          },
        }),
      });

      if (!res.ok) continue;

      const base64Audio = await readResponseAsBase64(res);
      if (!base64Audio || base64Audio.length < 256) continue;

      if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).Audio) {
        const audioDataUri = `data:audio/mp3;base64,${base64Audio}`;
        const audio = new (window as any).Audio(audioDataUri);
        currentAudioInstance = audio;

        audio.onended = () => {
          currentAudioInstance = null;
          callbacks?.onEnd?.();
        };
        audio.onerror = () => {
          currentAudioInstance = null;
          callbacks?.onEnd?.();
        };

        await audio.play();
        const durSec = Math.round(audio.duration || estimatedDurationMs / 1000);
        sessionAudioCache.set(cleanText, {
          uri: audioDataUri,
          isWebDataUri: true,
          durationSeconds: durSec,
        });
        return { success: true, durationSeconds: durSec, audioUri: audioDataUri };
      }

      const localMp3Uri = await writeBase64Mp3ToTempFile(base64Audio);
      if (localMp3Uri && playNativeAudioUri(localMp3Uri, estimatedDurationMs, callbacks)) {
        const durSec = Math.max(4, Math.round(estimatedDurationMs / 1000));
        sessionAudioCache.set(cleanText, {
          uri: localMp3Uri,
          durationSeconds: durSec,
        });
        return { success: true, durationSeconds: durSec, audioUri: localMp3Uri };
      }
    } catch (_err) {
      // probar siguiente modelo
    }
  }

  return await fallbackExpressiveSpeech(cleanText, callbacks);
}

/**
 * Síntesis vocal neural expresiva con entonación humana cálida y viva (gpt-4o-audio 'coral')
 * para garantizar que la respuesta completa se escuche de principio a fin sin cortes ni voz robótica.
 */
async function fallbackExpressiveSpeech(
  text: string,
  callbacks?: VoicePlaybackCallbacks
): Promise<{ success: boolean; durationSeconds: number; audioUri?: string }> {
  const durationMs = Math.max(text.length * 92, 5500);
  const durSec = Math.max(4, Math.round(durationMs / 1000));

  // 1. Motor de voz expresiva neural con entonación emocional y lectura íntegra de principio a fin
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = setTimeout(() => controller?.abort(), 45000);
    const neuralRes = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai-audio',
        modalities: ['text', 'audio'],
        audio: {
          voice: 'coral',
          format: 'mp3',
        },
        messages: [
          {
            role: 'system',
            content:
              'Eres la voz oficial del asistente de Treegoh. Lee ÍNTEGRAMENTE y de principio a fin todo el texto del usuario en español con una entonación cálida, viva, expresiva y cercana. IMPORTANTE: No resumas, no omitas ninguna frase y no cortes el texto antes del final; lee absolutamente todo el mensaje tal cual está escrito.',
          },
          {
            role: 'user',
            content: text,
          },
        ],
      }),
      signal: controller?.signal as any,
    });
    clearTimeout(timeoutId);

    if (neuralRes.ok) {
      const contentType = neuralRes.headers.get('content-type') || '';
      if (contentType.includes('audio/')) {
        const audioBuf = await neuralRes.arrayBuffer();
        const localUri = await writeMp3BufferToTempFile(audioBuf);
        if (localUri && playNativeAudioUri(localUri, durationMs, callbacks)) {
          sessionAudioCache.set(text, { uri: localUri, durationSeconds: durSec });
          return { success: true, durationSeconds: durSec, audioUri: localUri };
        }
      } else {
        const data = await neuralRes.json();
        const base64Audio = data?.choices?.[0]?.message?.audio?.data;
        if (base64Audio && typeof base64Audio === 'string') {
          if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).Audio) {
            const dataUri = `data:audio/mp3;base64,${base64Audio}`;
            const audio = new (window as any).Audio(dataUri);
            currentAudioInstance = audio;
            audio.onended = () => {
              currentAudioInstance = null;
              callbacks?.onEnd?.();
            };
            audio.onerror = () => {
              currentAudioInstance = null;
              callbacks?.onEnd?.();
            };
            await audio.play();
            sessionAudioCache.set(text, {
              uri: dataUri,
              isWebDataUri: true,
              durationSeconds: durSec,
            });
            return { success: true, durationSeconds: durSec, audioUri: dataUri };
          }

          const localUri = await writeBase64Mp3ToTempFile(base64Audio);
          if (localUri && playNativeAudioUri(localUri, durationMs, callbacks)) {
            sessionAudioCache.set(text, { uri: localUri, durationSeconds: durSec });
            return { success: true, durationSeconds: durSec, audioUri: localUri };
          }
        }
      }
    }
  } catch (_e) {}

  // 2. Respaldo secundario si no hay red hacia el motor neural expresivo
  if (Platform.OS !== 'web') {
    try {
      const speechMod = requireOptionalNativeModule<any>('ExpoSpeech');
      if (speechMod && typeof speechMod.speak === 'function') {
        speechMod.speak(String(Date.now()), text, {
          language: 'es-ES',
          pitch: 1.06,
          rate: 0.51,
        });
      }
    } catch (_e) {}
  }

  // 2. En Web: Web Speech API
  try {
    if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
      const synth = (window as any).speechSynthesis;
      synth.cancel();
      const utterance = new (window as any).SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.94;
      utterance.pitch = 1.02;
      utterance.onend = () => callbacks?.onEnd?.();
      utterance.onerror = () => callbacks?.onEnd?.();
      synth.speak(utterance);
      return { success: true, durationSeconds: durationMs / 1000 };
    }
  } catch (_e) {}

  currentSafetyTimer = setTimeout(() => {
    currentSafetyTimer = null;
    callbacks?.onEnd?.();
  }, durationMs);
  return { success: true, durationSeconds: durationMs / 1000 };
}

/**
 * Detiene la reproducción de voz actual
 */
export function stopVoicePlayback() {
  if (currentSafetyTimer) {
    clearTimeout(currentSafetyTimer);
    currentSafetyTimer = null;
  }
  currentEndCallback = null;

  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause?.();
      if ('currentTime' in currentAudioInstance) {
        currentAudioInstance.currentTime = 0;
      }
      currentAudioInstance.release?.();
    } catch (_e) {}
    currentAudioInstance = null;
  }
  try {
    const speechMod = requireOptionalNativeModule<any>('ExpoSpeech');
    speechMod?.stop?.();
  } catch (_e) {}
  if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
    try {
      (window as any).speechSynthesis.cancel();
    } catch (_e) {}
  }
}

