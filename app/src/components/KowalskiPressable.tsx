/**
 * KowalskiPressable.tsx — Micro-interacción Táctil según Emil Kowalski (animations.dev)
 * 
 * Cumple los 3 principios de "Why it feels better":
 * 1. scale(0.97) inmediato al presionar (press-in feedback).
 * 2. Transición sub-150ms con Easing.bezier(0.23, 1, 0.32, 1) fuerte ease-out (nunca ease-in).
 * 3. Difuminado/glow suave especular que engaña al ojo para fusionar ambos estados.
 * 4. Haptic causal en el mismo fotograma con Haptics.selectionAsync().
 */

import React, { useRef } from 'react';
import {
  Pressable,
  Animated,
  StyleProp,
  ViewStyle,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface KowalskiPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  activeScale?: number; // 0.97 por defecto
  hapticFeedback?: boolean;
  disabled?: boolean;
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
}

const STRONG_EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export const KowalskiPressable: React.FC<KowalskiPressableProps> = ({
  children,
  onPress,
  style,
  activeScale = 0.97,
  hapticFeedback = true,
  disabled = false,
  hitSlop = { top: 8, bottom: 8, left: 8, right: 8 },
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: activeScale,
        duration: 120, // 0.12s snappier
        easing: STRONG_EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 120,
        easing: STRONG_EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 18,
        stiffness: 240,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 150,
        easing: STRONG_EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled) return;
    if (hapticFeedback) {
      try {
        Haptics.selectionAsync();
      } catch (_e) {}
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {children}

        {/* Resplandor óptico especular sutil en press (blending de estados) */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.pressSheen,
            { opacity: glowAnim },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressSheen: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 28,
  },
});

