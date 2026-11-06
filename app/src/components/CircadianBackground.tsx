import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Line } from 'react-native-svg';
import { CircadianPhaseId, CircadianThemeConfig, getCircadianTheme } from '../utils/circadianTheme';
import { WeatherConditionType } from '../services/weatherService';

interface CircadianBackgroundProps {
  children?: React.ReactNode;
  phaseOverride?: CircadianPhaseId;
  coords?: { latitude?: number; longitude?: number };
  theme?: CircadianThemeConfig;
  currentTime?: Date;
  weatherCondition?: WeatherConditionType;
}

export const CircadianBackground: React.FC<CircadianBackgroundProps> = ({
  children,
  phaseOverride,
  coords,
  theme: themeProp,
  currentTime,
  weatherCondition = 'despejado',
}) => {
  const { width, height } = useWindowDimensions();

  // El ciclo se adapta automáticamente a la hora actual del reloj del teléfono o al tema inyectado
  const theme = useMemo(() => {
    if (themeProp && !phaseOverride) return themeProp;
    return getCircadianTheme(phaseOverride, currentTime || new Date(), coords);
  }, [themeProp, phaseOverride, currentTime, coords]);

  // Dimensiones abstractas fluidas no circulares para romper la rigidez geométrica
  const fluidWidth1 = Math.round(width * 1.4);
  const fluidHeight1 = Math.round(height * 0.55);

  const fluidWidth2 = Math.round(width * 1.25);
  const fluidHeight2 = Math.round(height * 0.48);

  const fluidWidth3 = Math.round(width * 1.35);
  const fluidHeight3 = Math.round(height * 0.52);

  // 3 Loops continuos asíncronos con periodos no múltiplos para generar patrones no repetitivos
  const fluidAnim1 = useRef(new Animated.Value(0)).current;
  const fluidAnim2 = useRef(new Animated.Value(0)).current;
  const fluidAnim3 = useRef(new Animated.Value(0)).current;

  // Animación suave de lluvia cuando el clima exterior lo indica
  const rainAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isWindy = weatherCondition === 'viento';
    const mult = isWindy ? 0.65 : 1; // Más veloz si hay viento

    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(fluidAnim1, {
          toValue: 1,
          duration: Math.round(11000 * mult),
          useNativeDriver: true,
        }),
        Animated.timing(fluidAnim1, {
          toValue: 0,
          duration: Math.round(11000 * mult),
          useNativeDriver: true,
        }),
      ])
    );

    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(fluidAnim2, {
          toValue: 1,
          duration: Math.round(14500 * mult),
          useNativeDriver: true,
        }),
        Animated.timing(fluidAnim2, {
          toValue: 0,
          duration: Math.round(14500 * mult),
          useNativeDriver: true,
        }),
      ])
    );

    const loop3 = Animated.loop(
      Animated.sequence([
        Animated.timing(fluidAnim3, {
          toValue: 1,
          duration: Math.round(18000 * mult),
          useNativeDriver: true,
        }),
        Animated.timing(fluidAnim3, {
          toValue: 0,
          duration: Math.round(18000 * mult),
          useNativeDriver: true,
        }),
      ])
    );

    loop1.start();
    loop2.start();
    loop3.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, [fluidAnim1, fluidAnim2, fluidAnim3, weatherCondition]);

  useEffect(() => {
    if (weatherCondition === 'lluvia') {
      const rainLoop = Animated.loop(
        Animated.timing(rainAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      );
      rainLoop.start();
      return () => rainLoop.stop();
    }
  }, [rainAnim, weatherCondition]);

  // Interpolaciones abstractas de fluidos de luz
  const body1TranslateX = fluidAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.1, width * 0.08],
  });
  const body1TranslateY = fluidAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [-height * 0.08, height * 0.04],
  });
  const body1Rotate = fluidAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['-8deg', '12deg'],
  });
  const body1Scale = fluidAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.14],
  });

  const body2TranslateX = fluidAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [width * 0.12, -width * 0.1],
  });
  const body2TranslateY = fluidAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -32],
  });
  const body2Rotate = fluidAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['6deg', '-9deg'],
  });
  const body2Scale = fluidAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1.02, 1.18],
  });

  const body3TranslateY = fluidAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [24, -38],
  });
  const body3Scale = fluidAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.1],
  });

  const rainTranslateY = rainAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, height * 0.4],
  });

  return (
    <View style={styles.root}>
      {/* 1. Degradado Base Circadiano Vivo */}
      <LinearGradient
        colors={theme.gradientColors}
        start={{ x: 0.5, y: 0.0 }}
        end={{ x: 0.5, y: 1.0 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Fluido Abstracto Superior (Luz Cenital / Aurora) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambientFluid,
          {
            width: fluidWidth1,
            height: fluidHeight1,
            borderRadius: fluidHeight1 / 2,
            top: -fluidHeight1 * 0.28,
            left: -fluidWidth1 * 0.18,
            backgroundColor: theme.ambientOrbTop,
            transform: [
              { translateX: body1TranslateX },
              { translateY: body1TranslateY },
              { rotate: body1Rotate },
              { scale: body1Scale },
            ],
          },
        ]}
      />

      {/* 3. Fluido Abstracto Central (Refracción Atmosférica) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambientFluid,
          {
            width: fluidWidth2,
            height: fluidHeight2,
            borderRadius: fluidHeight2 / 2,
            top: height * 0.28,
            right: -fluidWidth2 * 0.2,
            backgroundColor: theme.ambientOrbCenter,
            transform: [
              { translateX: body2TranslateX },
              { translateY: body2TranslateY },
              { rotate: body2Rotate },
              { scale: body2Scale },
            ],
          },
        ]}
      />

      {/* 4. Fluido Abstracto Inferior (Bruma de Tierra / Ocaso) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambientFluid,
          {
            width: fluidWidth3,
            height: fluidHeight3,
            borderRadius: fluidHeight3 / 2,
            bottom: -fluidHeight3 * 0.26,
            left: -fluidWidth3 * 0.15,
            backgroundColor: theme.ambientOrbBottom,
            transform: [{ translateY: body3TranslateY }, { scale: body3Scale }],
          },
        ]}
      />

      {/* 5. Precipitaciones de lluvia en vivo si el clima nativo lo detecta */}
      {weatherCondition === 'lluvia' && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [{ translateY: rainTranslateY }],
              opacity: 0.35,
            },
          ]}
        >
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {[
              { x: width * 0.12, y: height * 0.1, len: 18 },
              { x: width * 0.28, y: height * 0.25, len: 24 },
              { x: width * 0.45, y: height * 0.08, len: 20 },
              { x: width * 0.62, y: height * 0.2, len: 22 },
              { x: width * 0.78, y: height * 0.15, len: 26 },
              { x: width * 0.9, y: height * 0.3, len: 19 },
              { x: width * 0.2, y: height * 0.5, len: 22 },
              { x: width * 0.52, y: height * 0.6, len: 25 },
              { x: width * 0.82, y: height * 0.55, len: 20 },
            ].map((drop, idx) => (
              <Line
                key={`rain_${idx}`}
                x1={drop.x}
                y1={drop.y}
                x2={drop.x - 4}
                y2={drop.y + drop.len}
                stroke="#BAE6FD"
                strokeWidth={1.2}
                strokeLinecap="round"
                opacity={0.65}
              />
            ))}
          </Svg>
        </Animated.View>
      )}

      {/* 6. Desenfoque óptico difuso (+20% de difusión, BlurView a intensidad 58) */}
      <BlurView
        intensity={58}
        tint={theme.id === 'night' ? 'dark' : 'default'}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 7. Velo atmosférico ligero para mantener el fondo luminoso de inicio */}
      <LinearGradient
        colors={
          theme.id === 'night'
            ? ['rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.08)', 'rgba(0, 0, 0, 0.16)']
            : ['rgba(0, 0, 0, 0.0)', 'rgba(0, 0, 0, 0.04)', 'rgba(0, 0, 0, 0.10)']
        }
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 8. Velo sutil satinado para integrar el cristal de las tarjetas */}
      <View pointerEvents="none" style={styles.softSheenVeil} />

      {/* Contenido en flujo */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  ambientFluid: {
    position: 'absolute',
    opacity: 0.9,
  },
  softSheenVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
});
