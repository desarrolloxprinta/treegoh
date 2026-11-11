import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Platform,
  NativeModules,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Fonts } from '../constants/theme';
import { TreegohIcon } from './TreegohIcon';
import { BioLuminescentParticles } from './BioLuminescentParticles';
import { GlassCardSheen } from './BlobAnimatedCard';
import {
  queryBotanicalAssistant,
  AssistantSanctuaryContext,
} from '../services/botanicalAssistantService';
import {
  speakWithElevenLabs,
  stopVoicePlayback,
} from '../services/elevenLabsVoiceService';

interface BotanicalAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  context: AssistantSanctuaryContext;
}

const VOICE_TOPICS = [
  '¿Por qué amarillean las hojas?',
  '¿Cuándo debo regar hoy?',
  '¿Es seguro para mis mascotas?',
  '¿Tiene suficiente luz este rincón?',
  '¿Cómo calculo el riego con VPD?',
];

export const BotanicalAssistantModal: React.FC<BotanicalAssistantModalProps> = ({
  visible,
  onClose,
  context,
}) => {
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const safeTop = Math.max(insets.top, Platform.OS === 'ios' ? 48 : 24);
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 32 : 18);

  const [characterMood, setCharacterMood] = useState<
    'neutral' | 'happy' | 'thirsty' | 'warning' | 'listening' | 'curious'
  >('happy');
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [isSpeakingVoice, setIsSpeakingVoice] = useState<boolean>(false);
  const [isKeyboardMode, setIsKeyboardMode] = useState<boolean>(false);
  const [textInputQuery, setTextInputQuery] = useState<string>('');
  const [currentSpokenWisdom, setCurrentSpokenWisdom] = useState<string>(
    `Hola ${context.userName}. Siento el ritmo de tu santuario en «${context.activeSpaceName}» con ~${context.activeSpaceLux.toLocaleString()} Lux y tus ${context.plantsCount} ${context.plantsCount === 1 ? 'planta' : 'plantas'}. Pulsa mi orbe de voz o elige un tema para consultarme.`
  );
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([
    '¿Cómo calculo el riego con VPD?',
    '¿Qué planta tolera este rincón?',
  ]);

  // Animaciones 3D para el avatar
  const breathAnim = useRef(new Animated.Value(1)).current;
  const rotateTiltX = useRef(new Animated.Value(0)).current;
  const rotateTiltY = useRef(new Animated.Value(0)).current;
  const sonicRingAnim1 = useRef(new Animated.Value(0.8)).current;
  const sonicRingAnim2 = useRef(new Animated.Value(0.8)).current;

  // Barras del ecualizador vocal animado
  const eqBar1 = useRef(new Animated.Value(6)).current;
  const eqBar2 = useRef(new Animated.Value(14)).current;
  const eqBar3 = useRef(new Animated.Value(22)).current;
  const eqBar4 = useRef(new Animated.Value(12)).current;
  const eqBar5 = useRef(new Animated.Value(8)).current;

  // 1. Ciclo orgánico 3D continuo de respiración
  useEffect(() => {
    if (!visible) return;
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(breathAnim, {
            toValue: 1.05,
            duration: 2600,
            useNativeDriver: true,
          }),
          Animated.timing(rotateTiltX, {
            toValue: -3,
            duration: 2600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(breathAnim, {
            toValue: 0.98,
            duration: 2600,
            useNativeDriver: true,
          }),
          Animated.timing(rotateTiltX, {
            toValue: 2,
            duration: 2600,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    breatheLoop.start();
    return () => breatheLoop.stop();
  }, [visible, breathAnim, rotateTiltX]);

  // 2. Ondas sónicas bioluminiscentes cuando escucha o habla
  useEffect(() => {
    if (!isListeningVoice && !isSpeakingVoice) {
      sonicRingAnim1.setValue(0.8);
      sonicRingAnim2.setValue(0.8);
      return;
    }

    const ringLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(sonicRingAnim1, {
            toValue: 1.45,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(sonicRingAnim1, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(sonicRingAnim2, {
            toValue: 1.45,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(sonicRingAnim2, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    ringLoop.start();
    return () => ringLoop.stop();
  }, [isListeningVoice, isSpeakingVoice, sonicRingAnim1, sonicRingAnim2]);

  // 3. Ecualizador bioacústico vocal interactivo
  useEffect(() => {
    if (!isSpeakingVoice && !isListeningVoice) {
      eqBar1.setValue(6);
      eqBar2.setValue(8);
      eqBar3.setValue(12);
      eqBar4.setValue(8);
      eqBar5.setValue(6);
      return;
    }

    const eqLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(eqBar1, { toValue: 18, duration: 200, useNativeDriver: false }),
          Animated.timing(eqBar2, { toValue: 32, duration: 240, useNativeDriver: false }),
          Animated.timing(eqBar3, { toValue: 26, duration: 180, useNativeDriver: false }),
          Animated.timing(eqBar4, { toValue: 36, duration: 220, useNativeDriver: false }),
          Animated.timing(eqBar5, { toValue: 16, duration: 190, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(eqBar1, { toValue: 8, duration: 220, useNativeDriver: false }),
          Animated.timing(eqBar2, { toValue: 14, duration: 190, useNativeDriver: false }),
          Animated.timing(eqBar3, { toValue: 34, duration: 250, useNativeDriver: false }),
          Animated.timing(eqBar4, { toValue: 12, duration: 210, useNativeDriver: false }),
          Animated.timing(eqBar5, { toValue: 6, duration: 230, useNativeDriver: false }),
        ]),
      ])
    );
    eqLoop.start();
    return () => eqLoop.stop();
  }, [isSpeakingVoice, isListeningVoice, eqBar1, eqBar2, eqBar3, eqBar4, eqBar5]);

  const triggerHaptic = (heavy = false) => {
    try {
      Haptics.impactAsync(
        heavy ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
    } catch (_e) {}
  };

  // Motor vocal con ElevenLabs (Voice ID: U9tZtg3uJtVgXPkvosWR)
  const speakVoiceOutput = async (textToSpeak: string) => {
    setIsSpeakingVoice(true);
    await speakWithElevenLabs(textToSpeak, {
      onStart: () => setIsSpeakingVoice(true),
      onEnd: () => setIsSpeakingVoice(false),
      onError: () => setIsSpeakingVoice(false),
    });
  };

  const handleVoiceQuery = async (queryText: string) => {
    triggerHaptic(true);
    setIsListeningVoice(false);
    setCharacterMood('curious');

    try {
      const result = await queryBotanicalAssistant(queryText, [], context);
      setCurrentSpokenWisdom(result.text);
      setCharacterMood(result.mood);
      if (result.suggestedFollowUps && result.suggestedFollowUps.length > 0) {
        setSuggestedFollowUps(result.suggestedFollowUps);
      }
      speakVoiceOutput(result.text);
    } catch (_e) {
      const fallback = `En tu rincón «${context.activeSpaceName}» con ~${context.activeSpaceLux.toLocaleString()} Lux, mantén la consistencia hídrica con el sustrato y vigila la ventilación ambiental.`;
      setCurrentSpokenWisdom(fallback);
      setCharacterMood('happy');
      speakVoiceOutput(fallback);
    }
  };

  const handleToggleMic = () => {
    triggerHaptic(true);
    if (isListeningVoice) {
      setIsListeningVoice(false);
      setCharacterMood('neutral');
    } else {
      setIsListeningVoice(true);
      setCharacterMood('listening');
      // Simular captura de consulta hablada y respuesta tras escucha
      setTimeout(() => {
        handleVoiceQuery('¿Qué cuidados prioritarios recomiendas para este espacio?');
      }, 2400);
    }
  };

  const handleSendText = () => {
    const q = textInputQuery.trim();
    if (!q) return;
    setTextInputQuery('');
    setIsKeyboardMode(false);
    handleVoiceQuery(q);
  };

  const getMoodTitle = () => {
    if (isSpeakingVoice) return 'Treegoh Hablando...';
    if (isListeningVoice) return 'Escuchando tu voz...';
    switch (characterMood) {
      case 'listening':
        return 'Sintonizando biomasa...';
      case 'curious':
        return 'Consultando inteligencia botánica...';
      case 'thirsty':
        return 'Atención: Déficit Hídrico';
      case 'warning':
        return 'Precaución Botánica / Seguridad';
      case 'happy':
        return 'Armonía Circadiana Óptima';
      default:
        return 'Compañero Botánico Activo';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <View style={styles.modalSheet}>
          <BlurView intensity={Platform.OS === 'ios' ? 45 : 75} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.sheetBackdropTint} />
          <View style={styles.specularTopHairline} />

          {/* CABECERA SUPERIOR */}
          <View style={[styles.headerRow, { paddingTop: safeTop }]}>
            <View style={styles.headerTitleCol}>
              <View style={styles.liveIntelligenceBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveIntelligenceText}>Asistente Botánico 3D</Text>
              </View>
              <Text style={styles.headerLocationText}>
                {context.activeSpaceName} · ~{context.activeSpaceLux.toLocaleString()} Lux
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                triggerHaptic();
                stopVoicePlayback();
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ESCENARIO 3D CENTRAL DEL AVATAR VIVO */}
          <View style={styles.avatar3DStage}>
            {/* ONDAS SÓNICAS BIOLUMINISCENTES */}
            <Animated.View
              style={[
                styles.sonicRing,
                {
                  transform: [{ scale: sonicRingAnim1 }],
                  opacity: isListeningVoice || isSpeakingVoice ? 0.35 : 0.08,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.sonicRing,
                {
                  transform: [{ scale: sonicRingAnim2 }],
                  opacity: isListeningVoice || isSpeakingVoice ? 0.25 : 0.04,
                },
              ]}
            />

            {/* AVATAR INTERACTIVO 3D CON PERSPECTIVA Y ROTACIÓN */}
            <Animated.View
              style={[
                styles.characterPerspectiveBox,
                {
                  transform: [
                    { perspective: 900 },
                    { rotateX: rotateTiltX.interpolate({ inputRange: [-5, 5], outputRange: ['-5deg', '5deg'] }) },
                    { scale: breathAnim },
                  ],
                },
              ]}
            >
              <BioLuminescentParticles
                size={140}
                state={
                  isSpeakingVoice
                    ? 'hablando'
                    : isListeningVoice
                    ? 'escuchando'
                    : characterMood === 'curious'
                    ? 'pensando'
                    : 'reposo'
                }
                voiceLevel={isSpeakingVoice ? 0.75 : 0}
                onPress={() => {
                  triggerHaptic(true);
                  handleVoiceQuery('¿Cómo se siente nuestro santuario en este momento?');
                }}
              />
            </Animated.View>

            {/* INDICADOR DE ESTADO BIOLUMINISCENTE */}
            <View style={styles.moodPillWrap}>
              <View
                style={[
                  styles.moodDot,
                  characterMood === 'warning' && styles.dotWarning,
                  characterMood === 'thirsty' && styles.dotThirsty,
                  isListeningVoice && styles.dotListening,
                ]}
              />
              <Text style={styles.moodPillText}>{getMoodTitle()}</Text>
            </View>
          </View>

          {/* ECUALIZADOR BIOACÚSTICO SÓNICO EN VIVO */}
          <View style={styles.equalizerRow}>
            <Animated.View style={[styles.eqBar, { height: eqBar1 }]} />
            <Animated.View style={[styles.eqBar, { height: eqBar2 }]} />
            <Animated.View style={[styles.eqBar, { height: eqBar3, backgroundColor: '#86EFAC' }]} />
            <Animated.View style={[styles.eqBar, { height: eqBar4 }]} />
            <Animated.View style={[styles.eqBar, { height: eqBar5 }]} />
          </View>

          {/* TARJETA DE SABIDURÍA BOTÁNICA HABLADA (SERENA Y LIMPIA) */}
          <ScrollView
            style={styles.wisdomScroll}
            contentContainerStyle={styles.wisdomScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.wisdomGlassCard}>
              <GlassCardSheen />
              <View style={styles.wisdomCardTopRow}>
                <TreegohIcon
                  name={
                    characterMood === 'warning'
                      ? 'toxicidad_mascotas'
                      : characterMood === 'thirsty'
                      ? 'riego_hidratacion'
                      : 'voz_botanica'
                  }
                  size={16}
                  color="#86EFAC"
                  glow={true}
                />
                <Text style={styles.wisdomCardTag}>Sabiduría de tu Santuario</Text>
              </View>

              <Text style={styles.spokenWisdomText}>
                {currentSpokenWisdom}
              </Text>
            </View>

            {/* CHIPS DE PREGUNTAS SUGERIDAS DE VOZ */}
            <View style={styles.voiceTopicsBlock}>
              <Text style={styles.voiceTopicsLabel}>Consultar por voz al asistente:</Text>
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.voiceTopicsScroll}
              >
                {[...suggestedFollowUps, ...VOICE_TOPICS.slice(0, 3)].map((topic, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.voiceTopicChip}
                    onPress={() => handleVoiceQuery(topic)}
                    activeOpacity={0.8}
                  >
                    <TreegohIcon name="voz_botanica" size={12} color="#A7F3D0" glow={false} />
                    <Text style={styles.voiceTopicText}>{topic}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* ENTRADA DE TEXTO OPCIONAL (MODO SILENCIOSO) */}
            {isKeyboardMode ? (
              <View style={styles.keyboardDockWrap}>
                <TextInput
                  style={styles.keyboardInput}
                  placeholder="Escribe tu consulta botánica..."
                  placeholderTextColor="rgba(255, 255, 255, 0.40)"
                  value={textInputQuery}
                  onChangeText={setTextInputQuery}
                  onSubmitEditing={handleSendText}
                  returnKeyType="send"
                  autoFocus={true}
                />
                <TouchableOpacity
                  style={styles.keyboardSendBtn}
                  onPress={handleSendText}
                  activeOpacity={0.8}
                >
                  <TreegohIcon name="flecha_adelante" size={16} color="#2C2A28" glow={false} />
                </TouchableOpacity>
              </View>
            ) : null}
          </ScrollView>

          {/* DOCK INFERIOR: ACCIÓN DE VOZ PRINCIPAL */}
          <View style={[styles.bottomVoiceDock, { paddingBottom: safeBottom }]}>
            <TouchableOpacity
              style={styles.keyboardToggleBtn}
              onPress={() => {
                triggerHaptic();
                setIsKeyboardMode(!isKeyboardMode);
              }}
              activeOpacity={0.8}
            >
              <TreegohIcon name="busqueda_typesense" size={18} color="#FFFFFF" glow={false} />
              <Text style={styles.keyboardToggleText}>
                {isKeyboardMode ? 'Voz' : 'Teclado'}
              </Text>
            </TouchableOpacity>

            {/* BOTÓN CENTRAL DE VOZ PRINCIPAL */}
            <TouchableOpacity
              style={[
                styles.mainVoiceBtn,
                isListeningVoice && styles.mainVoiceBtnListening,
              ]}
              onPress={handleToggleMic}
              activeOpacity={0.85}
            >
              <TreegohIcon
                name="voz_botanica"
                size={28}
                color={isListeningVoice ? '#121A15' : '#2C2A28'}
                glow={isListeningVoice}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.soundscapeShortcutBtn}
              onPress={() => {
                triggerHaptic();
                handleVoiceQuery('¿Qué pauta de riego VPD recomiendas hoy?');
              }}
              activeOpacity={0.8}
            >
              <TreegohIcon name="riego_hidratacion" size={18} color="#FFFFFF" glow={false} />
              <Text style={styles.soundscapeShortcutText}>Riego VPD</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalSheet: {
    width: '100%',
    height: '92%',
    backgroundColor: '#1E1E1C',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    overflow: 'hidden',
  },
  sheetBackdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 30, 29, 0.88)',
  },
  specularTopHairline: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleCol: {
    flex: 1,
    gap: 3,
  },
  liveIntelligenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(134, 239, 172, 0.14)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#86EFAC',
  },
  liveIntelligenceText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: '#86EFAC',
    letterSpacing: 0.2,
  },
  headerLocationText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  avatar3DStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  sonicRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    backgroundColor: 'rgba(134, 239, 172, 0.05)',
  },
  characterPerspectiveBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodPillWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 10,
  },
  moodDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#86EFAC',
  },
  dotWarning: {
    backgroundColor: '#EF4444',
  },
  dotThirsty: {
    backgroundColor: '#F59E0B',
  },
  dotListening: {
    backgroundColor: '#38BDF8',
  },
  moodPillText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.88)',
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 38,
    marginVertical: 4,
  },
  eqBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  wisdomScroll: {
    flex: 1,
    paddingHorizontal: 22,
  },
  wisdomScrollContent: {
    gap: 16,
    paddingBottom: 14,
  },
  wisdomGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    padding: 20,
    gap: 10,
    overflow: 'hidden',
  },
  wisdomCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  wisdomCardTag: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: '#86EFAC',
    letterSpacing: 0.2,
  },
  spokenWisdomText: {
    fontFamily: Fonts.light,
    fontSize: 14.5,
    fontWeight: '300',
    color: '#FFFFFF',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  voiceTopicsBlock: {
    gap: 8,
  },
  voiceTopicsLabel: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
  },
  voiceTopicsScroll: {
    gap: 8,
  },
  voiceTopicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  voiceTopicText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.88)',
  },
  keyboardDockWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  keyboardInput: {
    flex: 1,
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: '#FFFFFF',
    paddingVertical: 10,
  },
  keyboardSendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomVoiceDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.09)',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  keyboardToggleBtn: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  keyboardToggleText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
  },
  mainVoiceBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#86EFAC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  mainVoiceBtnListening: {
    backgroundColor: '#86EFAC',
    transform: [{ scale: 1.08 }],
  },
  soundscapeShortcutBtn: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  soundscapeShortcutText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
  },
});
