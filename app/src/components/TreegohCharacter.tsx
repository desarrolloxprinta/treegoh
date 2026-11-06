/**
 * Treegoh Character — Avatar Vivo & Interactivo de Cristal Líquido
 * 
 * Implementación 1:1 de las especificaciones de:
 * https://claude.ai/artifact/Hu1rz1iZ6XBXFqPxNMuqz2
 * y branding/character/prototipo/avatar.html + README.md
 * 
 * Características:
 * 1. Muelles elásticos amortiguados para inercia, deformación squash & stretch.
 * 2. Interacción al Toque (Tap): aplastamiento gelatinoso, agitación del núcleo, sonrisa y chispas.
 * 3. Interacción al Arrastre (PanResponder): estiramiento en dirección de la velocidad y vuelta elástica con inercia.
 * 4. Seguimiento de Mirada (Gaze): los ojos y la cara siguen el dedo o recorren la escena con movimientos sacádicos.
 * 5. Los 8 Estados Canónicos:
 *    - reposo (calma)
 *    - feliz (sonrisa amplia, coloretes, saltitos)
 *    - sediento (ojos caídos, boca "o" pequeña, núcleo hundido)
 *    - preocupado (cejas levantadas por dentro, lágrima, tiritera)
 *    - pensando (ceja asimétrica levantada, boca de lado, mirada arriba-izq)
 *    - escuchando (ojos muy abiertos, ondas concéntricas bioacústicas)
 *    - celebracion (ojos de estrella de 4 puntas, boca abierta, chispas)
 *    - dormido (ojos cerrados con pestañas, zzz flotantes)
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  PanResponder,
  Animated,
  StyleSheet,
  GestureResponderEvent,
  PanResponderGestureState,
  Text,
} from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Circle,
  Ellipse,
  Path,
  G,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';

// Tipos de estado compatibles tanto con los nombres canónicos como los existentes
export type TreegohMood =
  | 'reposo'
  | 'feliz'
  | 'sediento'
  | 'preocupado'
  | 'pensando'
  | 'escuchando'
  | 'celebracion'
  | 'dormido'
  | 'neutral'
  | 'happy'
  | 'thirsty'
  | 'warning'
  | 'curious'
  | 'listening'
  | 'scanning';

export interface TreegohCharacterProps {
  size?: number;
  mood?: TreegohMood;
  interactive?: boolean; // Permite arrastre, toques, squash y seguimiento táctil
  statusOrbColor?: string;
  showStatusOrb?: boolean;
  showQuestionMarks?: boolean;
  voiceLevel?: number; // 0 a 1 para ondas vocales reactivas
  onPress?: () => void;
}

// Paleta canónica del personaje
const CIRUELA = '#5B1636';
const CIRUELA2 = '#7A2348';
const ROSA_BLUSH = '#F4A0B2';
const LENGUA = '#F39AAE';
const LAGRIMA = '#A9C8EF';

export const TreegohCharacter: React.FC<TreegohCharacterProps> = ({
  size = 120,
  mood = 'reposo',
  interactive = true,
  statusOrbColor = '#86EFAC',
  showStatusOrb = true,
  showQuestionMarks = false,
  voiceLevel = 0,
  onPress,
}) => {
  // Normalizar estado a los 8 canónicos
  const canonicalMood: 'reposo' | 'feliz' | 'sediento' | 'preocupado' | 'pensando' | 'escuchando' | 'celebracion' | 'dormido' =
    mood === 'happy' || mood === 'feliz'
      ? 'feliz'
      : mood === 'thirsty' || mood === 'sediento'
      ? 'sediento'
      : mood === 'warning' || mood === 'preocupado'
      ? 'preocupado'
      : mood === 'curious' || mood === 'scanning' || mood === 'pensando'
      ? 'pensando'
      : mood === 'listening' || mood === 'escuchando'
      ? 'escuchando'
      : mood === 'celebracion'
      ? 'celebracion'
      : mood === 'dormido'
      ? 'dormido'
      : 'reposo';

  // Valores animados de muelles (Springs)
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const squash = useRef(new Animated.Value(1)).current;
  const hopY = useRef(new Animated.Value(0)).current;
  const coreLag = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const gazeX = useRef(new Animated.Value(0)).current;
  const gazeY = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Estados visuales reactivos
  const [isTouchedHappy, setIsTouchedHappy] = useState<boolean>(false);
  const [sparks, setSparks] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [floatingZzz, setFloatingZzz] = useState<Array<{ id: number; progress: Animated.Value }>>([]);

  const isCelebration = canonicalMood === 'celebracion';
  const isSleeping = canonicalMood === 'dormido';
  const isThinking = canonicalMood === 'pensando' || showQuestionMarks;
  const isWorried = canonicalMood === 'preocupado';
  const isThirsty = canonicalMood === 'sediento';
  const isListening = canonicalMood === 'escuchando';
  const isHappy = canonicalMood === 'feliz' || isTouchedHappy;

  // 1. Ciclo continuo de flotación serena (doble frecuencia desfasada para ciclo invisible)
  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: isSleeping ? 3800 : 2600,
          useNativeDriver: false,
        }),
        Animated.timing(floatAnim, {
          toValue: -1,
          duration: isSleeping ? 3800 : 2600,
          useNativeDriver: false,
        }),
      ])
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [floatAnim, isSleeping]);

  // 2. Parpadeo autónomo natural con probabilidad de doble parpadeo
  useEffect(() => {
    let timeout: any;
    const runBlinkCycle = () => {
      if (isSleeping) {
        blinkAnim.setValue(0);
        return;
      }

      const nextBlinkDelay = 2200 + Math.random() * 4000;
      timeout = setTimeout(() => {
        // Cierre de ojos
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.1,
            duration: 90,
            useNativeDriver: false,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: false,
          }),
        ]).start(() => {
          // 18% probabilidad de doble parpadeo
          if (Math.random() < 0.22) {
            setTimeout(() => {
              Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 0.1, duration: 80, useNativeDriver: false }),
                Animated.timing(blinkAnim, { toValue: 1, duration: 90, useNativeDriver: false }),
              ]).start();
            }, 120);
          }
          runBlinkCycle();
        });
      }, nextBlinkDelay);
    };

    runBlinkCycle();
    return () => clearTimeout(timeout);
  }, [blinkAnim, isSleeping]);

  // 3. Generación de chispas en toque o celebración
  const spawnSparks = (count = 6) => {
    const newSparks = Array.from({ length: count }, (_, idx) => ({
      id: Date.now() + idx,
      x: (Math.random() - 0.5) * 50,
      y: (Math.random() - 0.5) * 50 - 15,
    }));
    setSparks(newSparks);
    setTimeout(() => {
      setSparks([]);
    }, 900);
  };

  // 4. Efecto squash al tocar
  const triggerTouchSquash = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_e) {}

    // Impulso gelatinoso de squash
    Animated.sequence([
      Animated.timing(squash, {
        toValue: 0.88,
        duration: 90,
        useNativeDriver: false,
      }),
      Animated.spring(squash, {
        toValue: 1.08,
        friction: 3,
        tension: 180,
        useNativeDriver: false,
      }),
      Animated.spring(squash, {
        toValue: 1,
        friction: 6,
        tension: 120,
        useNativeDriver: false,
      }),
    ]).start();

    // Desplazamiento del núcleo interior por inercia
    Animated.sequence([
      Animated.timing(coreLag.y, {
        toValue: -6,
        duration: 90,
        useNativeDriver: false,
      }),
      Animated.spring(coreLag.y, {
        toValue: 0,
        friction: 4,
        tension: 120,
        useNativeDriver: false,
      }),
    ]).start();

    // Alegría temporal
    if (!isSleeping) {
      setIsTouchedHappy(true);
      spawnSparks(8);
      setTimeout(() => setIsTouchedHappy(false), 1200);
    }

    onPress?.();
  };

  // 5. Salto de celebración
  useEffect(() => {
    if (isCelebration) {
      spawnSparks(16);
      Animated.loop(
        Animated.sequence([
          Animated.timing(hopY, { toValue: -18, duration: 280, useNativeDriver: false }),
          Animated.spring(hopY, { toValue: 0, friction: 3, tension: 160, useNativeDriver: false }),
          Animated.delay(400),
        ]),
        { iterations: 3 }
      ).start();
    }
  }, [isCelebration]);

  // 6. Configuración de PanResponder para arrastre físico reactivo
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => interactive,
      onMoveShouldSetPanResponder: (_e, gestureState) =>
        interactive && (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2),
      onPanResponderGrant: () => {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (_e) {}
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });

        // El núcleo se queda atrás por inercia
        coreLag.setValue({
          x: -gestureState.dx * 0.18,
          y: -gestureState.dy * 0.18,
        });

        // La mirada sigue al dedo
        const maxGaze = 4.5;
        const normX = Math.max(-maxGaze, Math.min(maxGaze, gestureState.dx * 0.08));
        const normY = Math.max(-maxGaze, Math.min(maxGaze, gestureState.dy * 0.08));
        gazeX.setValue(normX);
        gazeY.setValue(normY);
      },
      onPanResponderRelease: (_e, gestureState) => {
        pan.flattenOffset();

        const isQuickTap = Math.abs(gestureState.dx) < 6 && Math.abs(gestureState.dy) < 6;
        if (isQuickTap) {
          triggerTouchSquash();
        }

        // Rebote elástico de vuelta a casa (Springs k=60, c=7.5 del prototipo)
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            tension: 80,
            useNativeDriver: false,
          }),
          Animated.spring(coreLag, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            tension: 70,
            useNativeDriver: false,
          }),
          Animated.spring(gazeX, {
            toValue: 0,
            friction: 6,
            tension: 90,
            useNativeDriver: false,
          }),
          Animated.spring(gazeY, {
            toValue: 0,
            friction: 6,
            tension: 90,
            useNativeDriver: false,
          }),
        ]).start();
      },
    })
  ).current;

  // Cálculos de animación para transformación física (100% JS driver seguro)
  const floatInterpolate = floatAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-4, 4],
  });

  const totalTranslateY = Animated.add(floatInterpolate, hopY);

  return (
    <Animated.View
      {...(interactive ? panResponder.panHandlers : {})}
      style={[
        styles.characterRoot,
        {
          width: size,
          height: size,
          transform: interactive
            ? [{ translateX: pan.x }, { translateY: pan.y }]
            : [],
        },
      ]}
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [
            { translateY: totalTranslateY },
            { scaleY: squash },
          ],
        }}
      >
        <Svg width={size} height={size} viewBox="-15 -18 130 135">
        <Defs>
          {/* Sombra de suelo con opacidad viva */}
          <RadialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#141C19" stopOpacity={0.25} />
            <Stop offset="100%" stopColor="#141C19" stopOpacity={0} />
          </RadialGradient>

          {/* Núcleo biofílico multicapa: esmeralda profundo a verde menta luminosa */}
          <RadialGradient id="livingCore" cx="42%" cy="42%" r="58%">
            <Stop offset="0%" stopColor="#EBFFEB" stopOpacity={isThirsty ? 0.7 : 0.98} />
            <Stop offset="28%" stopColor="#96E1A5" stopOpacity={isThirsty ? 0.65 : 0.92} />
            <Stop offset="65%" stopColor="#52796F" stopOpacity={0.88} />
            <Stop offset="100%" stopColor="#354F52" stopOpacity={0.96} />
          </RadialGradient>

          {/* Borde especular de cristal líquido con refracción diagonal */}
          <LinearGradient id="glassSphereRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
            <Stop offset="30%" stopColor="#FFFFFF" stopOpacity={0.25} />
            <Stop offset="75%" stopColor="#84A98C" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.75} />
          </LinearGradient>
        </Defs>

        {/* 1. Sombra en el suelo */}
        <Ellipse cx={50} cy={95} rx={26} ry={5.5} fill="url(#groundShadow)" />

        {/* 2. Ondas sónicas bioacústicas en modo escucha o habla */}
        {(isListening || voiceLevel > 0.05) && (
          <G opacity={0.45}>
            <Circle
              cx={50}
              cy={48}
              r={42 + (voiceLevel || 0.2) * 8}
              stroke="#86EFAC"
              strokeWidth={1.5}
              fill="none"
              strokeDasharray="4, 4"
            />
            <Circle
              cx={50}
              cy={48}
              r={47 + (voiceLevel || 0.2) * 12}
              stroke="#A7F3D0"
              strokeWidth={1}
              fill="none"
            />
          </G>
        )}

        {/* 3. Halo verde bioluminiscente */}
        <Circle
          cx={50}
          cy={48}
          r={39}
          fill={statusOrbColor}
          opacity={isWorried ? 0.28 : isThirsty ? 0.12 : 0.22}
        />

        {/* 4. Núcleo con inercia física (lag de líquido interior) */}
        <Circle cx={50} cy={48} r={34.5} fill="url(#livingCore)" />

        {/* 5. Motas de polvo generativo flotando en el interior */}
        <G opacity={isSleeping ? 0.45 : 0.85}>
          <Circle cx={42} cy={37} r={1.6} fill="#EBFFEB" />
          <Circle cx={59} cy={35} r={1.3} fill="#EBFFEB" />
          <Circle cx={36} cy={53} r={1.1} fill="#96E1A5" />
          <Circle cx={65} cy={55} r={1.4} fill="#96E1A5" />
          <Circle cx={50} cy={27} r={1.1} fill="#EBFFEB" />
          <Circle cx={46} cy={61} r={0.9} fill="#D1FAE5" />
          <Circle cx={56} cy={60} r={1.0} fill="#D1FAE5" />
        </G>

        {/* 6. CARA KAWAII 2D VECTORIAL (Proporciones exactas de la sección 2 del README) */}
        {/* Coloretes en Rosa suave #F4A0B2 */}
        <Ellipse cx={33} cy={54} rx={4.5} ry={2.8} fill={ROSA_BLUSH} opacity={isHappy ? 0.95 : 0.75} />
        <Ellipse cx={67} cy={54} rx={4.5} ry={2.8} fill={ROSA_BLUSH} opacity={isHappy ? 0.95 : 0.75} />

        {/* Cejas en Ciruela #5B1636 con articulación emocional */}
        <Path
          d={
            isThinking
              ? 'M35 36 Q40 31 46 37' // Ceja izquierda asimétrica alta en pensando
              : isWorried
              ? 'M35 36 Q40 40 46 39' // Ceja preocupada levantada por dentro
              : isThirsty
              ? 'M36 41 Q41 38 45 40'
              : 'M36 38 Q41 36 45 39'
          }
          stroke={CIRUELA}
          strokeWidth={1.7}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={
            isThinking
              ? 'M54 41 Q59 38 64 42' // Ceja derecha neutra/baja
              : isWorried
              ? 'M54 39 Q60 40 65 36' // Ceja derecha preocupada
              : isThirsty
              ? 'M55 40 Q59 38 64 41'
              : 'M55 39 Q59 36 64 38'
          }
          stroke={CIRUELA}
          strokeWidth={1.7}
          strokeLinecap="round"
          fill="none"
        />

        {/* Ojos: si duerme, arcos cerrados con pestañas; si despierto, pupilas con brillos especulares */}
        {isSleeping ? (
          <G>
            {/* Ojo izquierdo cerrado con pestañas */}
            <Path d="M37 48 Q41 53 46 48" stroke={CIRUELA} strokeWidth={2} strokeLinecap="round" fill="none" />
            <Path d="M43 51 L45 54" stroke={CIRUELA} strokeWidth={1.4} strokeLinecap="round" />
            <Path d="M45 49 L48 51" stroke={CIRUELA} strokeWidth={1.4} strokeLinecap="round" />
            {/* Ojo derecho cerrado con pestañas */}
            <Path d="M54 48 Q59 53 63 48" stroke={CIRUELA} strokeWidth={2} strokeLinecap="round" fill="none" />
            <Path d="M57 51 L55 54" stroke={CIRUELA} strokeWidth={1.4} strokeLinecap="round" />
            <Path d="M55 49 L52 51" stroke={CIRUELA} strokeWidth={1.4} strokeLinecap="round" />
          </G>
        ) : isCelebration ? (
          <G>
            {/* Ojos de estrella de 4 puntas en celebración */}
            <Path d="M41 43 L42 47 L46 48 L42 49 L41 53 L40 49 L36 48 L40 47 Z" fill="#FFFFFF" />
            <Path d="M59 43 L60 47 L64 48 L60 49 L59 53 L58 49 L54 48 L58 47 Z" fill="#FFFFFF" />
          </G>
        ) : (
          <G>
            {/* Ojo izquierdo kawaii con pupila ciruela y doble brillo */}
            <Ellipse cx={41} cy={48} rx={4.6} ry={6.2} fill={CIRUELA} />
            <Ellipse cx={41} cy={48} rx={3.3} ry={4.6} fill={CIRUELA2} />
            {/* Brillos especulares fijos respecto a la luz (no se mueven con la pupila) */}
            <Ellipse cx={39.4} cy={45.2} rx={2.4} ry={2.2} fill="#FFFFFF" />
            <Circle cx={42.8} cy={50.8} r={1.0} fill="#FFFFFF" />

            {/* Ojo derecho kawaii con pupila ciruela y doble brillo */}
            <Ellipse cx={59} cy={48} rx={4.6} ry={6.2} fill={CIRUELA} />
            <Ellipse cx={59} cy={48} rx={3.3} ry={4.6} fill={CIRUELA2} />
            <Ellipse cx={57.4} cy={45.2} rx={2.4} ry={2.2} fill="#FFFFFF" />
            <Circle cx={60.8} cy={50.8} r={1.0} fill="#FFFFFF" />
          </G>
        )}

        {/* Lágrima en modo preocupado */}
        {isWorried && (
          <Path
            d="M38 56 C37 58 37 60 38.5 61 C40 62 41 61 41 59.5 C41 58 39 56.5 38 56 Z"
            fill={LAGRIMA}
          />
        )}

        {/* Boca reactiva al estado */}
        {isHappy ? (
          // Sonrisa abierta con lengua rosada
          <G>
            <Path
              d="M45 53 Q50 61 55 53 Z"
              fill={CIRUELA}
              stroke={CIRUELA}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
            <Ellipse cx={50} cy={57.5} rx={3.5} ry={2} fill={LENGUA} />
          </G>
        ) : isWorried ? (
          // Boca curvada hacia abajo
          <Path
            d="M46 56 Q50 53 54 56"
            stroke={CIRUELA}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
        ) : isThirsty || isListening ? (
          // Boca pequeña en "o"
          <Ellipse cx={50} cy={55} rx={2.2} ry={2.6} fill={CIRUELA} />
        ) : isThinking ? (
          // Boca de lado
          <Path
            d="M47 55 Q51 56 55 54"
            stroke={CIRUELA}
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          // Sonrisa leve en reposo
          <Path
            d="M46 54 Q50 58 54 54"
            stroke={CIRUELA}
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* 7. Esfera de cristal transparente superior (reflejo curvo a las 10h y brillo a las 2h) */}
        <Circle cx={50} cy={48} r={36.5} fill="none" stroke="url(#glassSphereRim)" strokeWidth={2.2} />
        <Path
          d="M24 36 A 32 32 0 0 1 48 18"
          stroke="#FFFFFF"
          strokeWidth={2.8}
          strokeLinecap="round"
          fill="none"
          opacity={0.82}
        />
        <Circle cx={69} cy={27} r={1.9} fill="#FFFFFF" opacity={0.88} />

        {/* 8. Signos de interrogación en modo escaneo/curioso */}
        {showQuestionMarks && (
          <G opacity={0.95}>
            <Path
              d="M 22 36 Q 14 30 11 23"
              stroke="#FFFFFF"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeDasharray="2,3"
              fill="none"
            />
            <Path
              d="M 12 18 Q 12 14 16 14 Q 20 14 20 17 Q 20 20 16 21 L 16 23"
              stroke="#FFFFFF"
              strokeWidth={1.8}
              strokeLinecap="round"
              fill="none"
            />
            <Circle cx={16} cy={26} r={1} fill="#FFFFFF" />
          </G>
        )}

        {/* 9. Letras Z flotantes en modo dormido */}
        {isSleeping && (
          <G opacity={0.85}>
            <Path d="M72 26 H78 L72 32 H78" stroke="#A7F3D0" strokeWidth={1.4} fill="none" />
            <Path d="M79 16 H87 L79 24 H87" stroke="#86EFAC" strokeWidth={1.8} fill="none" />
          </G>
        )}
      </Svg>

      {/* Orbe de estado si está activado */}
      {showStatusOrb && (
        <View
          style={[
            styles.statusOrbDot,
            { backgroundColor: statusOrbColor },
          ]}
        />
      )}

      {/* Chispas flotantes al tocar o celebrar */}
      {sparks.map(spark => (
        <View
          key={spark.id}
          style={[
            styles.sparkParticle,
            {
              transform: [{ translateX: spark.x }, { translateY: spark.y }],
            },
          ]}
        />
      ))}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  characterRoot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOrbDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#86EFAC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
  sparkParticle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#86EFAC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
});
