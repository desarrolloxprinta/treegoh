/**
 * ==============================================================================
 * Treegoh Botanical Sanctuary - Animated Splash & Loading Screen
 * ==============================================================================
 * Pantalla de inicio con animación cinematográfica inspirada en el patrón de
 * carga de Lemonade (Mobbin) y el diseño lumínico sensorial de TIDE y Apple.
 *
 * Características:
 *  - Fondo obsidiana puro (#090E15) coordinado con el Splash nativo de iOS.
 *  - Aura botánica respiratoria y anillos solares circadianos en rotación armónica.
 *  - Emersión primaveral del emblema foliar y logotipo oficial vectorizado.
 *  - Patrón de microcopy conversacional dinámico estilo Lemonade:
 *      1. "Sincronizando coordenadas y brújula solar..."
 *      2. "Calculando fotoperiodo estacional y bioclima VPD..."
 *      3. "Abriendo tu santuario botánico..."
 *  - Barra de progreso hairline lumínica en verde menta (#86EFAC).
 *  - Pulsos hápticos sincronizados con cada transición de fase.
 *  - Transición fluida (fade + micro zoom) hacia el santuario botánico.
 *  - Descarte táctil instantáneo si el usuario toca la pantalla.
 * ==============================================================================
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Line, Path, G } from 'react-native-svg';
import { TreegohLogo } from './TreegohLogo';
import { Fonts, Colors } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LOADING_PHRASES = [
  'Sincronizando coordenadas y brújula solar',
  'Calculando fotoperiodo estacional y VPD',
  'Abriendo tu santuario botánico',
];

interface TreegohAnimatedSplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export const TreegohAnimatedSplashScreen: React.FC<TreegohAnimatedSplashScreenProps> = ({
  onFinish,
  durationMs = 2600,
}) => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Shared Values para la coreografía cinética
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);

  // Aura respiratoria de fondo
  const auraScale = useSharedValue(0.85);
  const auraOpacity = useSharedValue(0.12);

  // Anillos circadianos solares
  const ringsRotation = useSharedValue(0);
  const ringsScale = useSharedValue(0.8);
  const ringsOpacity = useSharedValue(0);

  // Emblema botánico central
  const emblemScale = useSharedValue(0.5);
  const emblemOpacity = useSharedValue(0);

  // Logotipo y tipografía oficial
  const logoTranslateY = useSharedValue(16);
  const logoOpacity = useSharedValue(0);

  // Barra de progreso hairline (patrón Lemonade)
  const progressBarWidth = useSharedValue(0);

  // Textos y estados
  const phraseOpacity = useSharedValue(1);
  const subtitleOpacity = useSharedValue(0);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style);
    } catch (_e) {}
  };

  const finishSplash = () => {
    containerOpacity.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.quad) }, () => {
      runOnJS(onFinish)();
    });
    containerScale.value = withTiming(1.04, { duration: 380, easing: Easing.out(Easing.quad) });
  };

  useEffect(() => {
    // 1. Aura lumínica respiratoria continua (in-out orgánico)
    auraScale.value = withRepeat(
      withSequence(
        withTiming(1.22, { duration: 2600, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withTiming(0.85, { duration: 2400, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      ),
      -1,
      true
    );

    auraOpacity.value = withRepeat(
      withSequence(
        withTiming(0.24, { duration: 2600, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withTiming(0.12, { duration: 2400, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      ),
      -1,
      true
    );

    // 2. Rotación continua de los anillos solares (celestial coordinate dial)
    ringsRotation.value = withRepeat(
      withTiming(360, { duration: 28000, easing: Easing.linear }),
      -1,
      false
    );

    // 3. Entrada de los anillos solares (0 a 600ms)
    ringsOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    ringsScale.value = withSpring(1, { damping: 16, stiffness: 85 });

    // 4. Emersión del brote botánico central (280ms)
    const t1 = setTimeout(() => {
      emblemOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
      emblemScale.value = withSpring(1, { damping: 13, stiffness: 100 });
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    }, 280);

    // 5. Revelación del logotipo oficial tipográfico (600ms)
    const t2 = setTimeout(() => {
      logoOpacity.value = withTiming(1, { duration: 750, easing: Easing.bezier(0.16, 1, 0.3, 1) });
      logoTranslateY.value = withSpring(0, { damping: 15, stiffness: 90 });
    }, 600);

    // 6. Subtítulo y primera frase (900ms)
    const t3 = setTimeout(() => {
      subtitleOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
      progressBarWidth.value = withTiming(0.35, { duration: 600, easing: Easing.out(Easing.quad) });
    }, 900);

    // 7. Transición dinámica a frase 2 (estilo Lemonade: 1500ms)
    const t4 = setTimeout(() => {
      phraseOpacity.value = withSequence(
        withTiming(0, { duration: 180 }),
        withTiming(1, { duration: 280 })
      );
      setPhraseIndex(1);
      progressBarWidth.value = withTiming(0.72, { duration: 650, easing: Easing.out(Easing.quad) });
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    }, 1500);

    // 8. Transición a frase final 3 (2100ms)
    const t5 = setTimeout(() => {
      phraseOpacity.value = withSequence(
        withTiming(0, { duration: 180 }),
        withTiming(1, { duration: 280 })
      );
      setPhraseIndex(2);
      progressBarWidth.value = withTiming(1.0, { duration: 400, easing: Easing.out(Easing.quad) });
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    }, 2100);

    // 9. Cierre automático y transición fluida hacia el Santuario
    const autoExitTimer = setTimeout(() => {
      finishSplash();
    }, durationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(autoExitTimer);
    };
  }, []);

  // Estilos animados de Reanimated
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const auraAnimatedStyle = useAnimatedStyle(() => ({
    opacity: auraOpacity.value,
    transform: [{ scale: auraScale.value }],
  }));

  const ringsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ringsOpacity.value,
    transform: [
      { scale: ringsScale.value },
      { rotate: `${ringsRotation.value}deg` },
    ],
  }));

  const emblemAnimatedStyle = useAnimatedStyle(() => ({
    opacity: emblemOpacity.value,
    transform: [{ scale: emblemScale.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const phraseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: phraseOpacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressBarWidth.value * 100}%`,
  }));

  return (
    <Animated.View style={[styles.rootContainer, containerAnimatedStyle]}>
      {/* Permite tocar la pantalla para entrar al Santuario de inmediato */}
      <Pressable style={styles.interactiveArea} onPress={finishSplash}>
        {/* Fondo atmosférico en gradiente obsidiana */}
        <LinearGradient
          colors={['#070B10', '#090E15', '#0D161F']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Halo radial de respiración vegetal */}
        <Animated.View style={[styles.auraCircle, auraAnimatedStyle]} />

        {/* Núcleo visual central: Diales solares + Emblema */}
        <View style={styles.centralHeroWrapper}>
          {/* Anillos solares circadianos */}
          <Animated.View style={[styles.ringsContainer, ringsAnimatedStyle]}>
            <Svg width={240} height={240} viewBox="0 0 240 240">
              <G>
                {/* Anillo exterior con marcas de solsticio */}
                <Circle
                  cx="120"
                  cy="120"
                  r="98"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                  strokeDasharray="2, 6"
                  fill="none"
                />
                {/* Cuadrantes cardinales */}
                <Line x1="120" y1="14" x2="120" y2="24" stroke="rgba(134, 239, 172, 0.5)" strokeWidth="1.5" />
                <Line x1="120" y1="216" x2="120" y2="226" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
                <Line x1="14" y1="120" x2="24" y2="120" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
                <Line x1="216" y1="120" x2="226" y2="120" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />

                {/* Anillo intermedio bioclimático */}
                <Circle
                  cx="120"
                  cy="120"
                  r="78"
                  stroke="rgba(134, 239, 172, 0.22)"
                  strokeWidth="1.2"
                  strokeDasharray="1, 8"
                  fill="none"
                />

                {/* Anillo orbital interno con 4 esferas de tránsito */}
                <Circle
                  cx="120"
                  cy="120"
                  r="56"
                  stroke="rgba(255, 255, 255, 0.18)"
                  strokeWidth="0.8"
                  fill="none"
                />
                <Circle cx="120" cy="64" r="2.5" fill="#86EFAC" />
                <Circle cx="176" cy="120" r="2" fill="rgba(255, 255, 255, 0.6)" />
                <Circle cx="120" cy="176" r="2" fill="rgba(255, 255, 255, 0.6)" />
                <Circle cx="64" cy="120" r="2" fill="rgba(255, 255, 255, 0.6)" />
              </G>
            </Svg>
          </Animated.View>

          {/* Emblema botánico central (Brote / Escultura foliar) */}
          <Animated.View style={[styles.emblemContainer, emblemAnimatedStyle]}>
            <Svg width={68} height={68} viewBox="0 0 68 68">
              <G>
                {/* Hoja izquierda */}
                <Path
                  d="M34 50 C26 42 20 32 24 22 C28 20 34 26 34 36 Z"
                  fill="rgba(134, 239, 172, 0.35)"
                  stroke="#86EFAC"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Hoja derecha */}
                <Path
                  d="M34 50 C42 42 48 32 44 22 C40 20 34 26 34 36 Z"
                  fill="rgba(255, 255, 255, 0.28)"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Brote central ascendente */}
                <Path
                  d="M34 46 C32 36 32 26 34 16 C36 26 36 36 34 46 Z"
                  fill="rgba(255, 255, 255, 0.65)"
                  stroke="#86EFAC"
                  strokeWidth="1"
                />
                {/* Vértice de rocío */}
                <Circle cx="34" cy="14" r="2" fill="#86EFAC" />
              </G>
            </Svg>
          </Animated.View>
        </View>

        {/* Bloque tipográfico inferior con el Logotipo Oficial */}
        <View style={styles.brandingBlock}>
          <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
            <TreegohLogo width={180} height={48} color="#FFFFFF" />
          </Animated.View>

          <Animated.View style={[styles.subtitleWrapper, subtitleAnimatedStyle]}>
            <Text style={styles.subtitleTag}>SANTUARIO BOTÁNICO</Text>

            {/* Barra de progreso hairline (Patrón Lemonade) */}
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressBar, progressAnimatedStyle]} />
            </View>

            {/* Microcopy conversacional dinámico (Patrón Lemonade) */}
            <Animated.View style={[styles.statusRow, phraseAnimatedStyle]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{LOADING_PHRASES[phraseIndex]}</Text>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Pie de pantalla discreto */}
        <Animated.View style={[styles.footerBlock, subtitleAnimatedStyle]}>
          <Text style={styles.footerText}>Treegoh · Versión 1.0</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    backgroundColor: '#090E15',
  },
  interactiveArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraCircle: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#86EFAC',
  },
  centralHeroWrapper: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  ringsContainer: {
    position: 'absolute',
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemContainer: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandingBlock: {
    alignItems: 'center',
    marginTop: 28,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleWrapper: {
    alignItems: 'center',
    marginTop: 14,
  },
  subtitleTag: {
    fontFamily: Fonts.light,
    fontSize: 10,
    letterSpacing: 4.5,
    color: 'rgba(255, 255, 255, 0.52)',
    textTransform: 'uppercase',
  },
  progressTrack: {
    width: 140,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 1,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#86EFAC',
    borderRadius: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(134, 239, 172, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.16)',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#86EFAC',
    marginRight: 8,
  },
  statusText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.82)',
    letterSpacing: 0.3,
  },
  footerBlock: {
    position: 'absolute',
    bottom: 36,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.28)',
    letterSpacing: 1.2,
  },
});
