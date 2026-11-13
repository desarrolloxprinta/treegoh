/**
 * BotanicalMessageView.tsx — Conversación Fluida Editorial sin Burbujas (Cash App / Spotify AI 2026)
 *
 * - Cero burbujas de chat: la conversación fluye libremente sobre el lienzo oscuro de partículas.
 * - Mensajes del usuario maquetados como prompt editorial tenue (estilo Cash App "Round Ups waiting").
 * - Respuestas del asistente con jerarquía tipográfica editorial:
 *   H1 (#), H2 (##), H3 (###), Negritas (**bold**), Cursivas (*italic*), Citas (> ) y Viñetas (•).
 * - Botones de acción tipo píldora blanca sólida de alto contraste (estilo Cash App "Round Ups").
 * - Cero emojis, tipografía ligera (Fonts.light / Fonts.regular).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Fonts } from '../constants/theme';
import { TreegohIcon } from './TreegohIcon';
import { AssistantMessage } from '../services/botanicalAssistantService';

interface BotanicalMessageViewProps {
  message: AssistantMessage;
  isLatestAssistant?: boolean;
  isSpeakingThis?: boolean;
  onPlayVoice?: (text: string, messageId?: string) => void;
}

interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'quote' | 'bullet' | 'paragraph';
  rawText: string;
}

function formatDurationBadge(seconds?: number, fallbackText?: string): string {
  const sec =
    seconds && seconds > 0
      ? Math.round(seconds)
      : Math.max(4, Math.round((fallbackText?.length || 60) / 13));
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
}

export const BotanicalMessageView: React.FC<BotanicalMessageViewProps> = React.memo(({
  message,
  isLatestAssistant = false,
  isSpeakingThis = false,
  onPlayVoice,
}) => {
  const isUser = message.sender === 'user';
  const isVoiceNote = Boolean(message.isVoiceNote);
  // Si es nota de voz, por defecto NO se muestra el texto transcrito hasta que el usuario pulse "Transcribir mensaje"
  const [isTranscriptRevealed, setIsTranscriptRevealed] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(isLatestAssistant && !isUser ? 0.25 : 1)).current;

  useEffect(() => {
    if (isLatestAssistant && !isUser) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }).start();
    }
  }, [isLatestAssistant, isUser]);

  // Onda acústica determinista tipo montaña para las notas de voz reproducibles
  const waveformBars = useMemo(() => {
    const count = isUser ? 22 : 28;
    const seedStr = message.id || message.text || 'voice';
    return Array.from({ length: count }, (_, idx) => {
      const nx = (idx / (count - 1)) * 2 - 1;
      const mountainBell = Math.exp(-nx * nx * 2.8);
      const charCode = seedStr.charCodeAt(idx % seedStr.length) || 68;
      const harmonic = 0.55 + 0.45 * Math.sin(idx * 1.15 + (charCode % 7));
      return Math.max(4, Math.round((5 + 19 * mountainBell) * harmonic));
    });
  }, [message.id, message.text, isUser]);

  // Parsear texto en bloques estructurales (H1, H2, H3, Cita, Viñetas, Párrafos)
  const blocks: ParsedBlock[] = useMemo(() => {
    if (!message.text) return [];
    const lines = message.text.split('\n');
    const result: ParsedBlock[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('### ')) {
        result.push({ type: 'h3', rawText: trimmed.replace(/^###\s+/, '') });
      } else if (trimmed.startsWith('## ')) {
        result.push({ type: 'h2', rawText: trimmed.replace(/^##\s+/, '') });
      } else if (trimmed.startsWith('# ')) {
        result.push({ type: 'h1', rawText: trimmed.replace(/^#\s+/, '') });
      } else if (trimmed.startsWith('> ')) {
        result.push({ type: 'quote', rawText: trimmed.replace(/^>\s+/, '') });
      } else if (
        trimmed.startsWith('• ') ||
        trimmed.startsWith('- ') ||
        trimmed.startsWith('* ')
      ) {
        result.push({
          type: 'bullet',
          rawText: trimmed.replace(/^[•\-*]\s+/, ''),
        });
      } else {
        result.push({ type: 'paragraph', rawText: trimmed });
      }
    });

    return result;
  }, [message.text]);

  // Renderizado inline con soporte de **negrita** y *cursiva*
  const renderRichInlineText = (
    rawText: string,
    baseStyle: any,
    boldStyle: any,
    italicStyle: any
  ) => {
    const tokens = rawText.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g);

    return (
      <Text style={baseStyle}>
        {tokens.map((token, idx) => {
          if (!token) return null;

          if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
            return (
              <Text key={`b_${idx}`} style={boldStyle}>
                {token.slice(2, -2)}
              </Text>
            );
          }

          if (
            ((token.startsWith('*') && token.endsWith('*')) ||
              (token.startsWith('_') && token.endsWith('_'))) &&
            token.length > 2
          ) {
            return (
              <Text key={`i_${idx}`} style={italicStyle}>
                {token.slice(1, -1)}
              </Text>
            );
          }

          return <Text key={`t_${idx}`}>{token}</Text>;
        })}
      </Text>
    );
  };

  // 1. MENSAJE DEL USUARIO: Si fue por voz -> Nota de voz reproducible; si fue por texto -> Prompt fluido
  if (isUser) {
    if (isVoiceNote) {
      return (
        <View style={styles.userEditorialBlock}>
          <View style={styles.userVoiceNoteCard}>
            <TouchableOpacity
              style={[
                styles.voiceNotePlayCircleUser,
                isSpeakingThis && styles.voiceNotePlayCircleActive,
              ]}
              onPress={() => onPlayVoice?.(message.text, message.id)}
              activeOpacity={0.82}
            >
              <TreegohIcon
                name="voz_botanica"
                size={15}
                color={isSpeakingThis ? '#090B0E' : '#86EFAC'}
                glow={isSpeakingThis}
              />
            </TouchableOpacity>

            <View style={styles.voiceNoteMainCol}>
              <View style={styles.voiceNoteTopMetaRow}>
                <Text style={styles.voiceNoteSenderLabel}>Tu nota de voz</Text>
                <Text style={styles.voiceNoteDurationText}>
                  {formatDurationBadge(message.audioDurationSec, message.text)}
                </Text>
              </View>

              <View style={styles.voiceNoteWaveformRow}>
                {waveformBars.map((barH, bIdx) => (
                  <View
                    key={`u_bar_${bIdx}`}
                    style={[
                      styles.voiceNoteBar,
                      {
                        height: barH,
                        backgroundColor: isSpeakingThis
                          ? '#86EFAC'
                          : 'rgba(255, 255, 255, 0.42)',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.voiceNoteTranscribeMiniBtn}
              onPress={() => setIsTranscriptRevealed(prev => !prev)}
              activeOpacity={0.78}
            >
              <Text style={styles.voiceNoteTranscribeMiniText}>
                {isTranscriptRevealed ? 'Ocultar' : 'Transcribir'}
              </Text>
            </TouchableOpacity>
          </View>

          {isTranscriptRevealed && (
            <Text style={styles.userEditorialPromptText}>{message.text}</Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.userEditorialBlock}>
        {message.imageUri && (
          <Image source={{ uri: message.imageUri }} style={styles.attachedThumb} />
        )}
        <Text style={styles.userEditorialPromptText}>{message.text}</Text>
      </View>
    );
  }

  // 2. RESPUESTA DEL ASISTENTE:
  // Si la interacción fue iniciada por voz (isVoiceNote = true), queda como NOTA DE VOZ REPRODUCIBLE
  // sin mostrar el texto transcrito salvo que el usuario pulse "Transcribir mensaje".
  return (
    <Animated.View style={[styles.assistantEditorialSection, { opacity: fadeAnim }]}>
      {isVoiceNote && (
        <View style={styles.assistantVoiceNoteCard}>
          <View style={styles.assistantVoiceNotePlayerRow}>
            <TouchableOpacity
              style={[
                styles.voiceNotePlayCircleAssistant,
                isSpeakingThis && styles.voiceNotePlayCircleActive,
              ]}
              onPress={() => onPlayVoice?.(message.text, message.id)}
              activeOpacity={0.82}
            >
              <TreegohIcon
                name="voz_botanica"
                size={18}
                color={isSpeakingThis ? '#090B0E' : '#FFFFFF'}
                glow={isSpeakingThis}
              />
            </TouchableOpacity>

            <View style={styles.voiceNoteMainCol}>
              <View style={styles.voiceNoteTopMetaRow}>
                <Text style={styles.assistantVoiceNoteLabel}>
                  {isSpeakingThis ? 'Reproduciendo nota de voz...' : 'Nota de voz · Asistente'}
                </Text>
                <Text style={styles.voiceNoteDurationText}>
                  {formatDurationBadge(message.audioDurationSec, message.text)}
                </Text>
              </View>

              <View style={styles.voiceNoteWaveformRow}>
                {waveformBars.map((barH, bIdx) => (
                  <View
                    key={`a_bar_${bIdx}`}
                    style={[
                      styles.voiceNoteBar,
                      {
                        height: barH,
                        backgroundColor: isSpeakingThis
                          ? bIdx % 3 === 0
                            ? '#86EFAC'
                            : '#2DD4BF'
                          : 'rgba(134, 239, 172, 0.55)',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.assistantVoiceNoteActionsRow}>
            <TouchableOpacity
              style={[
                styles.voiceEditorialPill,
                isSpeakingThis && styles.voiceEditorialPillActive,
              ]}
              onPress={() => onPlayVoice?.(message.text, message.id)}
              activeOpacity={0.8}
            >
              <TreegohIcon
                name="voz_botanica"
                size={13}
                color={isSpeakingThis ? '#090B0E' : '#FFFFFF'}
                glow={isSpeakingThis}
              />
              <Text
                style={[
                  styles.voiceEditorialPillText,
                  isSpeakingThis && styles.voiceEditorialPillTextActive,
                ]}
              >
                {isSpeakingThis ? 'Detener audio' : 'Reproducir nota de voz'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.transcribeTogglePill}
              onPress={() => setIsTranscriptRevealed(prev => !prev)}
              activeOpacity={0.8}
            >
              <Text style={styles.transcribeTogglePillText}>
                {isTranscriptRevealed ? 'Ocultar transcripción' : 'Transcribir mensaje'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {(!isVoiceNote || isTranscriptRevealed) && (
        <View style={styles.blocksContainer}>
          {blocks.map((block, bIdx) => {
            if (block.type === 'h1') {
              return (
                <View key={`blk_${bIdx}`} style={styles.h1Wrapper}>
                  {renderRichInlineText(
                    block.rawText,
                    styles.h1Text,
                    styles.h1BoldText,
                    styles.h1ItalicText
                  )}
                </View>
              );
            }

            if (block.type === 'h2') {
              return (
                <View key={`blk_${bIdx}`} style={styles.h2Wrapper}>
                  {renderRichInlineText(
                    block.rawText,
                    styles.h2Text,
                    styles.h2BoldText,
                    styles.h2ItalicText
                  )}
                </View>
              );
            }

            if (block.type === 'h3') {
              return (
                <View key={`blk_${bIdx}`} style={styles.h3Wrapper}>
                  {renderRichInlineText(
                    block.rawText,
                    styles.h3Text,
                    styles.h3BoldText,
                    styles.h3ItalicText
                  )}
                </View>
              );
            }

            if (block.type === 'quote') {
              return (
                <View key={`blk_${bIdx}`} style={styles.quoteWrapper}>
                  {renderRichInlineText(
                    block.rawText,
                    styles.quoteText,
                    styles.paragraphBoldText,
                    styles.paragraphItalicText
                  )}
                </View>
              );
            }

            if (block.type === 'bullet') {
              return (
                <View key={`blk_${bIdx}`} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <View style={styles.bulletTextContainer}>
                    {renderRichInlineText(
                      block.rawText,
                      styles.paragraphText,
                      styles.paragraphBoldText,
                      styles.paragraphItalicText
                    )}
                  </View>
                </View>
              );
            }

            return (
              <View key={`blk_${bIdx}`} style={styles.paragraphWrapper}>
                {renderRichInlineText(
                  block.rawText,
                  styles.paragraphText,
                  styles.paragraphBoldText,
                  styles.paragraphItalicText
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Pie de acciones fluido: Píldora de acción sincronizada + botón opcional "Escuchar respuesta" en modo texto */}
      {(message.action || (!isVoiceNote && onPlayVoice)) && (
        <View style={styles.editorialFooterRow}>
          {message.action && (
            <View style={styles.cashAppWhitePill}>
              <TreegohIcon name="check_verificado" size={14} color="#090B0E" glow={false} />
              <Text style={styles.cashAppWhitePillText}>
                {message.action.type === 'water_all_in_space'
                  ? `Riego aplicado · ${message.action.spaceName || 'Santuario'}`
                  : 'Acción sincronizada'}
              </Text>
            </View>
          )}

          {!isVoiceNote && onPlayVoice && (
            <TouchableOpacity
              style={[
                styles.voiceEditorialPill,
                isSpeakingThis && styles.voiceEditorialPillActive,
              ]}
              onPress={() => onPlayVoice(message.text, message.id)}
              activeOpacity={0.8}
            >
              <TreegohIcon
                name="voz_botanica"
                size={14}
                color={isSpeakingThis ? '#090B0E' : '#FFFFFF'}
                glow={isSpeakingThis}
              />
              <Text
                style={[
                  styles.voiceEditorialPillText,
                  isSpeakingThis && styles.voiceEditorialPillTextActive,
                ]}
              >
                {isSpeakingThis ? 'Detener voz' : 'Escuchar respuesta'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  // Prompt del usuario fluido sin burbuja (inspiración Cash App "Round Ups waiting")
  userEditorialBlock: {
    width: '100%',
    paddingTop: 18,
    paddingBottom: 2,
    gap: 10,
  },
  attachedThumb: {
    width: 140,
    height: 104,
    borderRadius: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  userEditorialPromptText: {
    fontFamily: Fonts.light,
    fontSize: 21,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.46)',
    lineHeight: 28,
    letterSpacing: -0.3,
  },

  // Respuesta del asistente fluida sin burbuja ni contenedor cerrado
  assistantEditorialSection: {
    width: '100%',
    paddingTop: 4,
    paddingBottom: 26,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 16,
  },
  blocksContainer: {
    gap: 12,
  },

  // H1 — Titular heroico blanco estilo Cash App / Spotify ("What do you want to hear today?")
  h1Wrapper: {
    marginTop: 2,
    marginBottom: 4,
  },
  h1Text: {
    fontFamily: Fonts.regular,
    fontSize: 27,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  h1BoldText: {
    fontFamily: Fonts.regular,
    fontSize: 27,
    fontWeight: '400',
    color: '#86EFAC',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  h1ItalicText: {
    fontFamily: Fonts.light,
    fontSize: 27,
    fontWeight: '300',
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.90)',
    letterSpacing: -0.4,
    lineHeight: 34,
  },

  // H2 — Subtítulo editorial de sección
  h2Wrapper: {
    marginTop: 6,
    marginBottom: 2,
  },
  h2Text: {
    fontFamily: Fonts.regular,
    fontSize: 19.5,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.94)',
    letterSpacing: -0.25,
    lineHeight: 26,
  },
  h2BoldText: {
    fontFamily: Fonts.regular,
    fontSize: 19.5,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: -0.25,
    lineHeight: 26,
  },
  h2ItalicText: {
    fontFamily: Fonts.light,
    fontSize: 19.5,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#86EFAC',
    lineHeight: 26,
  },

  // H3 — Etiqueta técnica / taxonómica
  h3Wrapper: {
    marginTop: 4,
  },
  h3Text: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: '#38BDF8',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    lineHeight: 19,
  },
  h3BoldText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    lineHeight: 19,
  },
  h3ItalicText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#86EFAC',
    lineHeight: 19,
  },

  // Cita botánica (> )
  quoteWrapper: {
    borderLeftWidth: 2,
    borderLeftColor: '#86EFAC',
    paddingLeft: 14,
    paddingVertical: 2,
    marginVertical: 2,
  },
  quoteText: {
    fontFamily: Fonts.light,
    fontSize: 16,
    fontWeight: '300',
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 24,
  },

  // Párrafos y viñetas fluidas
  paragraphWrapper: {
    marginVertical: 1,
  },
  paragraphText: {
    fontFamily: Fonts.light,
    fontSize: 16.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.84)',
    lineHeight: 25,
    letterSpacing: -0.1,
  },
  paragraphBoldText: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 25,
  },
  paragraphItalicText: {
    fontFamily: Fonts.light,
    fontSize: 16.5,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#86EFAC',
    lineHeight: 25,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingLeft: 2,
    marginVertical: 2,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#86EFAC',
    marginTop: 10,
  },
  bulletTextContainer: {
    flex: 1,
  },

  // Botones inferiores estilo Cash App ("Round Ups" white pill)
  editorialFooterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  cashAppWhitePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 24,
  },
  cashAppWhitePillText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#090B0E',
    letterSpacing: -0.1,
  },
  voiceEditorialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  voiceEditorialPillActive: {
    backgroundColor: '#86EFAC',
    borderColor: '#86EFAC',
  },
  voiceEditorialPillText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  voiceEditorialPillTextActive: {
    color: '#090B0E',
  },

  // Estilos de Notas de Voz Reproducibles en la Sesión
  userVoiceNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  assistantVoiceNoteCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 34, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.28)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  assistantVoiceNotePlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  voiceNotePlayCircleUser: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(134, 239, 172, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceNotePlayCircleAssistant: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(45, 212, 191, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.50)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceNotePlayCircleActive: {
    backgroundColor: '#86EFAC',
    borderColor: '#86EFAC',
  },
  voiceNoteMainCol: {
    flex: 1,
    gap: 6,
  },
  voiceNoteTopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceNoteSenderLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.70)',
    letterSpacing: 0.2,
  },
  assistantVoiceNoteLabel: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#86EFAC',
    letterSpacing: 0.1,
  },
  voiceNoteDurationText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
  },
  voiceNoteWaveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 26,
  },
  voiceNoteBar: {
    width: 2.5,
    borderRadius: 1.5,
  },
  voiceNoteTranscribeMiniBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  voiceNoteTranscribeMiniText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.78)',
  },
  assistantVoiceNoteActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    paddingTop: 2,
  },
  transcribeTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
  },
  transcribeTogglePillText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
