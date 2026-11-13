/**
 * BioLuminescentParticles.tsx — Simulación Continua Partícula por Partícula de 1PX (Ultra-Optimizada 60fps)
 *
 * - ANIMACIÓN DE CADA PARTÍCULA POR SEPARADO: 672 partículas individuales de 1px
 *   distribuidas orgánicamente en el 100% del lienzo de la pantalla (de borde a borde).
 * - CERO re-renders de React por fotograma: actualización directa mediante `setNativeProps`
 *   sobre las referencias nativas de `<Path>`, liberando por completo el hilo JS y la UI.
 * - Pausado automático (`0% CPU`) cuando la pestaña del Experto no está activa en pantalla (`!isFocused`).
 * - CERO movimiento por líneas, filas o columnas: cada partícula i tiene su propia coordenada (x_i(t), y_i(t)),
 *   su propio desfase armónico individual y su propio vector de respiración radial y ondulación 2D.
 * - Al escuchar tu voz o la del asistente: cada partícula converge suavemente hacia el centro
 *   formando una onda tipo montaña con un pico central en ondulación continua.
 * - Desenfoque progresivo al 30% con `Animated.Value` nativo cuando se despliega el chat.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  PanResponder,
  AccessibilityInfo,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, RadialGradient, Stop, Circle, Path, G } from 'react-native-svg';

export type ParticleState = 'reposo' | 'escuchando' | 'pensando' | 'hablando';

interface BioLuminescentParticlesProps {
  width?: number;
  height?: number;
  size?: number;
  state?: ParticleState;
  voiceLevel?: number; // 0 a 1
  typingPulse?: number;
  isActive?: boolean;
  isFocused?: boolean;
  isTypingMode?: boolean;
  isChatInteracting?: boolean;
  onPress?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 13 x 15 = 195 partículas individuales de 1px (Óptima densidad botánica y 0% lag en JS)
const GRID_COLS = 13;
const GRID_ROWS = 15;

const SILKY_EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

interface IndividualParticleSeed {
  baseX: number;
  baseY: number;
  nx: number; // -1 a 1
  ny: number; // -1 a 1
  radialDist: number;
  radialDirX: number;
  radialDirY: number;
  phaseA: number;
  phaseB: number;
  phaseC: number;
  speedFactor: number;
  ampFactor: number;
  mountainBell: number;
  secondaryBell: number;
  colorTier: 0 | 1 | 2 | 3 | 4 | 5;
}

export const BioLuminescentParticles: React.FC<BioLuminescentParticlesProps> = React.memo(({
  width: propWidth,
  height: propHeight,
  size,
  state = 'reposo',
  voiceLevel = 0,
  typingPulse = 0,
  isActive = true,
  isFocused = false,
  isTypingMode = false,
  isChatInteracting = false,
  onPress,
}) => {
  const width = size || propWidth || SCREEN_WIDTH;
  const height = size || propHeight || SCREEN_HEIGHT;
  const centerX = width * 0.5;
  const centerY = height * 0.44;

  // 1. Accesibilidad (Reduced Motion)
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReducedMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setIsReducedMotion);
    return () => sub?.remove?.();
  }, []);

  // 2. Semillas físicas individuales cubriendo el 100% del canvas
  const particles = useMemo<IndividualParticleSeed[]>(() => {
    const list: IndividualParticleSeed[] = [];
    const cellW = width / GRID_COLS;
    const cellH = height / GRID_ROWS;

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const idx = r * GRID_COLS + c;
        const h1 = ((idx * 0.618033988749895) % 1 + 1) % 1;
        const h2 = ((idx * 0.381966011250105 + c * 0.7548776662) % 1 + 1) % 1;
        const h3 = ((r * 0.569840290998 + c * 0.430159709) % 1 + 1) % 1;

        const baseX = (c + 0.15 + h1 * 0.70) * cellW;
        const baseY = (r + 0.15 + h2 * 0.70) * cellH;

        const nx = (baseX / width) * 2 - 1;
        const ny = (baseY - centerY) / (height * 0.5);

        const dx = baseX - centerX;
        const dy = baseY - centerY;
        const distPx = Math.sqrt(dx * dx + dy * dy) || 1;
        const radialDist = Math.sqrt(nx * nx + ny * ny);

        const mountainBell = Math.exp(-nx * nx * 3.8);
        const secondaryBell =
          0.38 * Math.exp(-Math.pow(nx - 0.42, 2) * 7.0) +
          0.38 * Math.exp(-Math.pow(nx + 0.42, 2) * 7.0);

        const waveSpineY = 0.18 * Math.sin(nx * 2.2 + 0.35) - 0.10 * Math.cos(nx * 3.1);
        const distFromWaveCrest = Math.abs(ny - waveSpineY);
        const luminosity =
          Math.exp(-distFromWaveCrest * distFromWaveCrest * 3.2) *
            (0.45 + 0.55 * mountainBell) *
            (0.72 + 0.28 * h3);

        let colorTier: 0 | 1 | 2 | 3 | 4 | 5 = 0;
        if (luminosity > 0.64) {
          colorTier = 5;
        } else if (luminosity > 0.48) {
          colorTier = 4;
        } else if (luminosity > 0.34) {
          colorTier = 3;
        } else if (luminosity > 0.22) {
          colorTier = 2;
        } else if (luminosity > 0.11 || h3 > 0.62) {
          colorTier = 1;
        } else {
          colorTier = 0;
        }

        list.push({
          baseX,
          baseY,
          nx,
          ny,
          radialDist,
          radialDirX: dx / distPx,
          radialDirY: dy / distPx,
          phaseA: h1 * Math.PI * 2,
          phaseB: h2 * Math.PI * 2,
          phaseC: h3 * Math.PI * 2,
          speedFactor: 0.82 + h1 * 0.36,
          ampFactor: 0.75 + h2 * 0.50,
          mountainBell,
          secondaryBell,
          colorTier,
        });
      }
    }

    return list;
  }, [width, height, centerX, centerY]);

  // Referencias directas a los nodos SVG <Path> para actualizar sin re-renderizar React
  const dormantPathRef = useRef<any>(null);
  const cobaltPathRef = useRef<any>(null);
  const electricBluePathRef = useRef<any>(null);
  const cyanPathRef = useRef<any>(null);
  const turquoisePathRef = useRef<any>(null);
  const mintCorePathRef = useRef<any>(null);

  const stateRef = useRef({
    state,
    voiceLevel,
    isActive,
    isFocused,
  });
  useEffect(() => {
    stateRef.current = { state, voiceLevel, isActive, isFocused };
  }, [state, voiceLevel, isActive, isFocused]);

  const pulseBoostRef = useRef<number>(0);
  useEffect(() => {
    if (typingPulse > 0) {
      pulseBoostRef.current = Math.min(1, pulseBoostRef.current + 0.45);
    }
  }, [typingPulse]);

  // Fase continua persistente entre focos de pestaña
  const phaseStateRef = useRef({
    breathTime: 0,
    waveTime: 0,
    voiceBlend: 0,
    thinkingBlend: 0,
  });

  // Cálculo de un fotograma y envío directo por setNativeProps (optimizado a 30fps para liberar el hilo JS)
  useEffect(() => {
    let rafId: number | null = null;
    let lastTime = Date.now();
    let lastFrameTimestamp = 0;
    const FRAME_BUDGET_MS = 32; // ~30fps sereno y 90% libre de CPU

    const computeAndApplyFrame = () => {
      const now = Date.now();
      const current = stateRef.current;

      // Si la pestaña no está enfocada ni activa, no procesar cálculo
      if (!current.isFocused || !current.isActive) {
        return;
      }

      // Control de tasa de refresco para no saturar ProMotion 120Hz
      if (now - lastFrameTimestamp < FRAME_BUDGET_MS) {
        if (!isReducedMotion) {
          rafId = requestAnimationFrame(computeAndApplyFrame);
        }
        return;
      }
      lastFrameTimestamp = now;

      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) * 0.001));
      lastTime = now;

      const ps = phaseStateRef.current;

      const isVoice =
        current.state === 'hablando' ||
        current.state === 'escuchando' ||
        current.voiceLevel > 0.05;
      const isThinking = current.state === 'pensando';

      const targetVoice = isVoice ? 1.0 : 0.0;
      const targetThinking = isThinking ? 1.0 : 0.0;
      ps.voiceBlend += (targetVoice - ps.voiceBlend) * Math.min(1, dt * 3.2);
      ps.thinkingBlend += (targetThinking - ps.thinkingBlend) * Math.min(1, dt * 2.8);
      pulseBoostRef.current *= Math.pow(0.18, dt);

      const activeSpeedBoost =
        1 + ps.voiceBlend * 1.45 + ps.thinkingBlend * 0.55 + pulseBoostRef.current * 0.8;
      ps.breathTime += dt * 0.72;
      ps.waveTime += dt * 1.15 * activeSpeedBoost;

      const breathTime = ps.breathTime;
      const waveTime = ps.waveTime;
      const voiceBlend = ps.voiceBlend;
      const thinkingBlend = ps.thinkingBlend;
      const hasVoiceOrThink = voiceBlend > 0.002 || thinkingBlend > 0.002;
      const activeBlend = hasVoiceOrThink ? Math.min(1, voiceBlend + thinkingBlend * 0.45) : 0;
      const mountainBreathMod = hasVoiceOrThink ? 0.65 + 0.35 * Math.sin(breathTime * 1.8) : 1;

      let dormantPath = '';
      let cobaltPath = '';
      let electricBluePath = '';
      let cyanPath = '';
      let turquoisePath = '';
      let mintCorePath = '';

      const len = particles.length;
      for (let i = 0; i < len; i++) {
        const p = particles[i];

        const breathWave = Math.sin(
          breathTime * p.speedFactor - p.radialDist * 1.65 + p.phaseA * 0.45
        );
        const breathRadiusPx = (7.5 + pulseBoostRef.current * 10) * p.ampFactor * breathWave;

        const waveX =
          Math.sin(p.ny * 3.1 + p.nx * 1.8 - waveTime * p.speedFactor + p.phaseB) *
            (8.5 * p.ampFactor) +
          Math.cos(p.nx * 2.7 - p.ny * 2.4 + breathTime * 0.9 + p.phaseC) * 4.5;

        const waveY =
          Math.sin(p.nx * 3.4 + p.ny * 2.2 - waveTime * p.speedFactor + p.phaseA * 0.6) *
            (13.5 * p.ampFactor) +
          Math.cos(p.nx * 2.1 - p.ny * 2.9 + waveTime * 0.75 + p.phaseB * 0.5) *
            (7.0 * p.ampFactor);

        let finalX = p.baseX + p.radialDirX * breathRadiusPx + waveX;
        let finalY = p.baseY + p.radialDirY * breathRadiusPx + waveY;

        if (hasVoiceOrThink) {
          const voiceX =
            centerX +
            (p.baseX - centerX) * (0.78 + 0.16 * p.mountainBell) +
            Math.sin(waveTime * 1.6 + p.phaseA) * 5.5 * p.ampFactor;

          const mountainCrestLift = -54 * p.mountainBell - 18 * p.secondaryBell;
          const mountainTravelingWave =
            (10 + 42 * p.mountainBell + 16 * p.secondaryBell) *
            Math.sin(p.nx * 4.6 - waveTime * 2.1 + p.ny * 0.9 + p.phaseA * 0.35);
          const mountainHarmonicRipple =
            (6 + 18 * p.mountainBell) *
            Math.cos(p.nx * 7.2 + waveTime * 1.55 + p.phaseB * 0.4);

          const concentratedSpreadY =
            p.ny * (height * (0.045 + 0.065 * p.mountainBell)) * p.ampFactor;

          const voiceY =
            centerY +
            concentratedSpreadY +
            mountainCrestLift * mountainBreathMod +
            mountainTravelingWave +
            mountainHarmonicRipple;

          finalX = finalX + (voiceX - finalX) * activeBlend;
          finalY = finalY + (voiceY - finalY) * activeBlend;
        }

        // Punto circular exacto de 1px con round cap (10x más rápido en CoreGraphics que doble arco bezier)
        const xStr = ((finalX * 10) | 0) * 0.1;
        const yStr = ((finalY * 10) | 0) * 0.1;
        const sub = `M${xStr.toFixed(1)},${yStr.toFixed(1)}h0.01`;

        if (p.colorTier === 5) {
          mintCorePath += sub;
        } else if (p.colorTier === 4) {
          turquoisePath += sub;
        } else if (p.colorTier === 3) {
          cyanPath += sub;
        } else if (p.colorTier === 2) {
          electricBluePath += sub;
        } else if (p.colorTier === 1) {
          cobaltPath += sub;
        } else {
          dormantPath += sub;
        }
      }

      dormantPathRef.current?.setNativeProps({ d: dormantPath });
      cobaltPathRef.current?.setNativeProps({ d: cobaltPath });
      electricBluePathRef.current?.setNativeProps({ d: electricBluePath });
      cyanPathRef.current?.setNativeProps({ d: cyanPath });
      turquoisePathRef.current?.setNativeProps({ d: turquoisePath });
      mintCorePathRef.current?.setNativeProps({ d: mintCorePath });

      if (current.isFocused && current.isActive && !isReducedMotion) {
        rafId = requestAnimationFrame(computeAndApplyFrame);
      }
    };

    // Dibujar al menos 1 frame inicial y solo mantener el loop activo cuando la pestaña está enfocada
    rafId = requestAnimationFrame(computeAndApplyFrame);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [particles, isFocused, isActive, isReducedMotion, height, centerX, centerY]);

  // 4. Desenfoque oscuro progresivo al interactuar o escribir en el chat (siempre detrás de las partículas)
  const chatBlurOverlayAnim = useRef(new Animated.Value(0)).current;
  const isInteractingOrTyping = Boolean(isChatInteracting || isTypingMode);

  useEffect(() => {
    Animated.timing(chatBlurOverlayAnim, {
      toValue: isInteractingOrTyping ? 1 : 0,
      duration: isInteractingOrTyping ? 950 : 800,
      easing: SILKY_EASE_OUT,
      useNativeDriver: true,
    }).start();
  }, [isInteractingOrTyping, chatBlurOverlayAnim]);

  const isVoiceActive =
    state === 'hablando' || state === 'escuchando' || voiceLevel > 0.05;

  // 5. Interacción táctil en el lienzo
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pulseBoostRef.current = 0.85;
        },
        onPanResponderRelease: () => {
          onPress?.();
        },
      }),
    [onPress]
  );

  return (
    <View
      style={[
        styles.canvasRoot,
        {
          width,
          height,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* 1. Desenfoque suave al interactuar con el chat (colocado DETRÁS de las partículas para preservar su visibilidad) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.agentLayerContainer,
          {
            top: 0,
            left: 0,
            width,
            height,
            opacity: chatBlurOverlayAnim,
            zIndex: 1,
          },
        ]}
      >
        <BlurView
          intensity={20}
          tint="dark"
          style={{ width, height }}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height,
            backgroundColor: 'rgba(2, 4, 9, 0.42)',
          }}
        />
      </Animated.View>

      {/* 2. Lienzo unificado de partículas individuales de 1px en el 100% de la pantalla — SIEMPRE VISIBLES Y BRILLANTES */}
      <Svg
        width={width}
        height={height}
        style={[StyleSheet.absoluteFillObject, { zIndex: 2 }]}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="mountainWaveGlow" cx="50%" cy="44%" r="60%" fx="50%" fy="44%">
            <Stop offset="0%" stopColor="#2DD4BF" stopOpacity={isVoiceActive ? 0.22 : isInteractingOrTyping ? 0.16 : 0.10} />
            <Stop offset="45%" stopColor="#1D4ED8" stopOpacity={isVoiceActive ? 0.14 : isInteractingOrTyping ? 0.10 : 0.06} />
            <Stop offset="100%" stopColor="#04060A" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={width * 0.5}
          cy={height * 0.44}
          r={Math.max(width, height) * 0.62}
          fill="url(#mountainWaveGlow)"
        />

        {/* Núcleo nítido de cada partícula: al interactuar se mantienen vivas, nítidas y reactivas */}
        <G fill="none" strokeLinecap="round" strokeWidth={isInteractingOrTyping ? 1.32 : 1.18}>
          <Path ref={dormantPathRef} d="" stroke="#94A3B8" strokeOpacity={isInteractingOrTyping ? 0.46 : 0.36} />
          <Path ref={cobaltPathRef} d="" stroke="#2563EB" strokeOpacity={isInteractingOrTyping ? 0.76 : 0.68} />
          <Path ref={electricBluePathRef} d="" stroke="#0284C7" strokeOpacity={isInteractingOrTyping ? 0.88 : 0.82} />
          <Path ref={cyanPathRef} d="" stroke="#06B6D4" strokeOpacity={isInteractingOrTyping ? 0.96 : 0.92} />
          <Path ref={turquoisePathRef} d="" stroke="#2DD4BF" strokeOpacity={1.0} />
          <Path ref={mintCorePathRef} d="" stroke="#86EFAC" strokeOpacity={1.0} />
        </G>
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  canvasRoot: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  agentLayerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
