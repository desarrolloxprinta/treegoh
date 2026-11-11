/**
 * AssistantLoadingPulse.tsx — Animación de Carga Botánica Cinética (TIDE 2026)
 * 
 * - Muestra el progreso de razonamiento del asistente mientras OpenRouter / IA sintetiza la respuesta.
 * - Ciclo de texto fisiológico rotativo con pulso de opacidad y ondas luminosas.
 * - Cero emojis, tipografía ligera y estética mineral de cristal.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Fonts } from '../constants/theme';
import { TreegohIcon } from './TreegohIcon';
import { GlassCardSheen } from './BlobAnimatedCard';

const THINKING_STEPS = [
  'Consultando telemetría del santuario...',
  'Analizando déficit de vapor (VPD) y fotoperiodo...',
  'Evaluando seguridad y toxicología para mascotas...',
  'Sintetizando diagnóstico del jardinero experto...',
];

export const AssistantLoadingPulse: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const dotAnim1 = useRef(new Animated.Value(0.2)).current;
  const dotAnim2 = useRef(new Animated.Value(0.2)).current;
  const dotAnim3 = useRef(new Animated.Value(0.2)).current;

  // Pulso respiratorio del texto
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Rotación periódica de la fase de pensamiento
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(prev => (prev + 1) % THINKING_STEPS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  // Animación secuencial de los tres puntos de luz
  useEffect(() => {
    const animateDots = () => {
      Animated.loop(
        Animated.stagger(220, [
          Animated.sequence([
            Animated.timing(dotAnim1, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dotAnim1, { toValue: 0.2, duration: 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dotAnim2, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dotAnim2, { toValue: 0.2, duration: 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dotAnim3, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dotAnim3, { toValue: 0.2, duration: 400, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    animateDots();
  }, [dotAnim1, dotAnim2, dotAnim3]);

  return (
    <View style={styles.loadingCard}>
      <GlassCardSheen />
      <View style={styles.loadingRow}>
        <View style={styles.iconCircle}>
          <TreegohIcon name="camara_diagnostica" size={15} color="#86EFAC" glow={true} glowColor="#86EFAC" />
        </View>

        <Animated.View style={[styles.textCol, { opacity: pulseAnim }]}>
          <Text style={styles.thinkingTitle}>Razonamiento Botánico Activo</Text>
          <Text style={styles.thinkingStepText}>{THINKING_STEPS[stepIndex]}</Text>
        </Animated.View>

        <View style={styles.dotsRow}>
          <Animated.View style={[styles.glowDot, { opacity: dotAnim1 }]} />
          <Animated.View style={[styles.glowDot, { opacity: dotAnim2 }]} />
          <Animated.View style={[styles.glowDot, { opacity: dotAnim3 }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.35)',
    padding: 16,
    marginVertical: 10,
    overflow: 'hidden',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(134, 239, 172, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  thinkingTitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontWeight: '400',
    color: '#86EFAC',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  thinkingStepText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 4,
  },
  glowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#86EFAC',
  },
});

