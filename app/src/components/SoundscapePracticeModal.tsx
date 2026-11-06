import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Fonts } from '../constants/theme';
import { TreegohIcon, IconName } from './TreegohIcon';
import { GlassCardSheen } from './BlobAnimatedCard';

interface SoundscapePracticeModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface SoundScene {
  id: string;
  name: string;
  icon: IconName;
  description: string;
  gradientColors: [string, string];
}

export const SOUND_SCENES: SoundScene[] = [
  {
    id: 'rain_forest',
    name: 'Lluvia en la Selva',
    icon: 'riego_hidratacion',
    description: 'Gotas suaves cayendo sobre hojas carnosas de Monstera.',
    gradientColors: ['#3A506B', '#1C2541'],
  },
  {
    id: 'foggy_canopy',
    name: 'Bosque de Niebla',
    icon: 'humedad_vpd',
    description: 'Brisa húmeda y susurros de helechos en altura.',
    gradientColors: ['#4A6B62', '#243B33'],
  },
  {
    id: 'ocean_calm',
    name: 'Océano Calmo',
    icon: 'sonido_soundscapes',
    description: 'Oleaje lento que acompasa el ritmo biológico.',
    gradientColors: ['#385A74', '#1F3444'],
  },
  {
    id: 'gentle_wind',
    name: 'Viento en Copas',
    icon: 'sustrato_aireacion',
    description: 'Follaje balanceándose con ligereza y sol matinal.',
    gradientColors: ['#6B5B4D', '#362E27'],
  },
  {
    id: 'zen_stream',
    name: 'Manantial de Musgo',
    icon: 'limpieza_foliar',
    description: 'Agua cristalina filtrada entre piedras volcánicas.',
    gradientColors: ['#446A5E', '#203932'],
  },
  {
    id: 'night_crickets',
    name: 'Noche de Reposo',
    icon: 'luz_natural',
    description: 'Silencio profundo y respiración oscura de plantas CAM.',
    gradientColors: ['#282A36', '#121319'],
  },
];

export const SoundscapePracticeModal: React.FC<SoundscapePracticeModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, Platform.OS === 'ios' ? 52 : StatusBar.currentHeight || 24);
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 32 : 18);

  const [selectedScene, setSelectedScene] = useState<SoundScene>(SOUND_SCENES[0]);
  const [selectedMethod, setSelectedMethod] = useState<'box' | 'calm'>('box');
  const [selectedDuration, setSelectedDuration] = useState<number>(2); // minutos
  const [isScenesSheetOpen, setIsScenesSheetOpen] = useState<boolean>(false);
  const [isActiveSession, setIsActiveSession] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'Inhala' | 'Retén' | 'Exhala' | 'Pausa'>('Inhala');

  // Animación del halo circular luminoso (estilo Tide Box Breathing)
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const haloRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setIsActiveSession(false);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.14,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [visible, pulseAnim]);

  // Ciclo de respiración cuando está activa la sesión
  useEffect(() => {
    if (!isActiveSession) return;
    let timer: any;
    let step = 0;

    const cycle = () => {
      const phases: Array<'Inhala' | 'Retén' | 'Exhala' | 'Pausa'> = ['Inhala', 'Retén', 'Exhala', 'Pausa'];
      setBreathPhase(phases[step % 4]);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_e) {}
      step++;
      timer = setTimeout(cycle, 4000);
    };

    cycle();
    return () => clearTimeout(timer);
  }, [isActiveSession]);

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
  };

  const durationOptions = [1, 2, 5, 10];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* FONDO CIRCADIANO DEGRADADO AMBIENTAL */}
        <LinearGradient
          colors={selectedScene.gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* 1. CABECERA CON BOTÓN VOLVER Y AJUSTES */}
        <View style={[styles.topHeaderBar, { paddingTop: safeTop }]}>
          <TouchableOpacity
            style={styles.circleHeaderBtn}
            onPress={() => {
              triggerHaptic();
              onClose();
            }}
            activeOpacity={0.8}
          >
            <TreegohIcon name="flecha_volver" size={18} color="#FFFFFF" glow={false} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleHeaderBtn}
            onPress={() => {
              triggerHaptic();
              setIsScenesSheetOpen(true);
            }}
            activeOpacity={0.8}
          >
            <TreegohIcon name="filtros_parametros" size={17} color="#FFFFFF" glow={false} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollRoot}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: safeBottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 2. HALO LUMINOSO CENTRAL (ESTILO EXACTO TIDE BOX BREATHING) */}
          <View style={styles.haloCenterWrapper}>
            <Animated.View
              style={[
                styles.glowingHaloRing,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <LinearGradient
                colors={['rgba(255, 235, 180, 0.42)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.0)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0.2 }}
                end={{ x: 0.5, y: 1 }}
              />
              <View style={styles.haloInnerCircle}>
                <TreegohIcon
                  name={selectedScene.icon}
                  size={36}
                  color="#FFFFFF"
                  glow={true}
                />
              </View>
            </Animated.View>

            {isActiveSession && (
              <View style={styles.sessionActiveTextWrap}>
                <Text style={styles.sessionBreathPhaseText}>{breathPhase}</Text>
                <Text style={styles.sessionBreathSub}>4 segundos</Text>
              </View>
            )}
          </View>

          {/* 3. TÍTULO Y DESCRIPCIÓN POÉTICA */}
          <View style={styles.titleBlock}>
            <Text style={styles.mainTitle}>
              {selectedMethod === 'box' ? 'Box Breathing Botánico' : 'Respiración de Follaje'}
            </Text>
            <Text style={styles.subDescription}>
              {selectedScene.description}
            </Text>

            {/* PÍLDORA SELECTORA DE SOUNDSCAPE */}
            <TouchableOpacity
              style={styles.soundscapePillBtn}
              onPress={() => {
                triggerHaptic();
                setIsScenesSheetOpen(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.soundscapeDot} />
              <Text style={styles.soundscapePillText}>
                Soundscape | {selectedScene.name} ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* 4. TARJETAS DE MÉTODO DE RESPIRACIÓN (2 LADO A LADO, ESTILO TIDE) */}
          <View style={styles.methodsSection}>
            <Text style={styles.sectionSmallLabel}>Método de respiración</Text>
            <View style={styles.methodsRow}>
              {/* Opción 1: Box Breathing */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  selectedMethod === 'box' && styles.methodCardSelected,
                ]}
                onPress={() => {
                  triggerHaptic();
                  setSelectedMethod('box');
                }}
                activeOpacity={0.82}
              >
                <GlassCardSheen selected={selectedMethod === 'box'} />
                <TreegohIcon
                  name="sonido_soundscapes"
                  size={20}
                  color="#FFFFFF"
                  glow={selectedMethod === 'box'}
                />
                <Text style={styles.methodCardTitle}>Box 4-4-4-4</Text>
                <Text style={styles.methodCardSub}>Enfoque y calma</Text>
              </TouchableOpacity>

              {/* Opción 2: 4-7-8 Vegetal */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  selectedMethod === 'calm' && styles.methodCardSelected,
                ]}
                onPress={() => {
                  triggerHaptic();
                  setSelectedMethod('calm');
                }}
                activeOpacity={0.82}
              >
                <GlassCardSheen selected={selectedMethod === 'calm'} />
                <TreegohIcon
                  name="humedad_vpd"
                  size={20}
                  color="#FFFFFF"
                  glow={selectedMethod === 'calm'}
                />
                <Text style={styles.methodCardTitle}>Pausa 4-7-8</Text>
                <Text style={styles.methodCardSub}>Reposo profundo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 5. SELECTOR DE DURACIÓN CON TICKS (ESTILO TIDE RULER) */}
          <View style={styles.durationSection}>
            <Text style={styles.durationBigNumber}>{selectedDuration} min</Text>
            <View style={styles.durationTicksRow}>
              {durationOptions.map(mins => {
                const isSelected = selectedDuration === mins;
                return (
                  <TouchableOpacity
                    key={mins}
                    style={styles.tickWrapper}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedDuration(mins);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 14, right: 14 }}
                  >
                    <View
                      style={[
                        styles.tickLine,
                        isSelected && styles.tickLineSelected,
                      ]}
                    />
                    <Text
                      style={[
                        styles.tickText,
                        isSelected && styles.tickTextSelected,
                      ]}
                    >
                      {mins}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 6. BOTÓN INFERIOR: START / PAUSE PILL BUTTON */}
          <TouchableOpacity
            style={styles.startPillBtn}
            onPress={() => {
              triggerHaptic();
              setIsActiveSession(prev => !prev);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.startPillBtnText}>
              {isActiveSession ? 'Pausar sesión' : 'Comenzar práctica'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* MODAL BOTTOM SHEET: SELECTOR DE ESCENAS DE SONIDO (ESTILO TIDE SOUND SCENES) */}
        <Modal
          visible={isScenesSheetOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsScenesSheetOpen(false)}
        >
          <View style={styles.sheetBackdrop}>
            <View style={[styles.scenesSheetCard, { paddingBottom: safeBottom + 20 }]}>
              <View style={styles.scenesSheetHeader}>
                <Text style={styles.scenesSheetTitle}>Atmósferas del Santuario</Text>
                <TouchableOpacity
                  style={styles.scenesSheetClose}
                  onPress={() => setIsScenesSheetOpen(false)}
                >
                  <TreegohIcon name="flecha_volver" size={16} color="#FFFFFF" glow={false} />
                </TouchableOpacity>
              </View>

              <View style={styles.scenesGrid}>
                {SOUND_SCENES.map(scene => {
                  const isSelected = scene.id === selectedScene.id;
                  return (
                    <TouchableOpacity
                      key={scene.id}
                      style={[
                        styles.sceneCircleBtn,
                        isSelected && styles.sceneCircleBtnSelected,
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setSelectedScene(scene);
                        setIsScenesSheetOpen(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.sceneCircleIconWrap}>
                        <TreegohIcon
                          name={scene.icon}
                          size={24}
                          color="#FFFFFF"
                          glow={isSelected}
                        />
                      </View>
                      <Text
                        style={[
                          styles.sceneNameText,
                          isSelected && styles.sceneNameTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {scene.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#27292C',
  },
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    zIndex: 10,
  },
  circleHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollRoot: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 26,
    paddingTop: 16,
    gap: 28,
    alignItems: 'center',
  },
  haloCenterWrapper: {
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  glowingHaloRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  haloInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionActiveTextWrap: {
    marginTop: 14,
    alignItems: 'center',
  },
  sessionBreathPhaseText: {
    fontFamily: Fonts.light,
    fontSize: 22,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sessionBreathSub: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 3,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  mainTitle: {
    fontFamily: Fonts.light,
    fontSize: 27,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subDescription: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.68)',
    textAlign: 'center',
    lineHeight: 20,
  },
  soundscapePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    gap: 8,
    marginTop: 4,
  },
  soundscapeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#86EFAC',
  },
  soundscapePillText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  methodsSection: {
    width: '100%',
    gap: 10,
  },
  sectionSmallLabel: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
    paddingLeft: 4,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  methodCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 16,
    gap: 6,
    overflow: 'hidden',
  },
  methodCardSelected: {
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  methodCardTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop: 6,
  },
  methodCardSub: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
  },
  durationSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  durationBigNumber: {
    fontFamily: Fonts.light,
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  durationTicksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    alignItems: 'flex-start',
  },
  tickWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  tickLine: {
    width: 2,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
    borderRadius: 1,
  },
  tickLineSelected: {
    height: 18,
    backgroundColor: '#FFFFFF',
    width: 2.5,
  },
  tickText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.45)',
  },
  tickTextSelected: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  startPillBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 17,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  startPillBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    fontWeight: '400',
    color: '#2C2A28',
    letterSpacing: -0.2,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  scenesSheetCard: {
    width: '100%',
    backgroundColor: '#27292C',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingTop: 20,
    paddingHorizontal: 22,
    gap: 20,
  },
  scenesSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scenesSheetTitle: {
    fontFamily: Fonts.light,
    fontSize: 18,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scenesSheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  sceneCircleBtn: {
    width: '30%',
    alignItems: 'center',
    gap: 8,
  },
  sceneCircleBtnSelected: {
    opacity: 1,
  },
  sceneCircleIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sceneNameText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
    textAlign: 'center',
  },
  sceneNameTextSelected: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
});

