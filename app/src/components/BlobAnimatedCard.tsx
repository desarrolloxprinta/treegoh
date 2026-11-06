import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BlobAnimatedCardProps {
  scrollX?: Animated.Value;
  pageIndex?: number;
  pageWidth?: number;
  cardIndex?: number;
  isActivePage?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Deformación tipo blob muy sutil, orgánica y natural durante el slide horizontal,
 * sin rotación y sin rebote exagerado al asentarse en el centro.
 */
export const BlobAnimatedCard: React.FC<BlobAnimatedCardProps> = ({
  scrollX,
  pageIndex = 0,
  pageWidth = 390,
  cardIndex = 0,
  isActivePage = true,
  style,
  children,
}) => {
  const recoverX = useRef(new Animated.Value(1)).current;
  const recoverY = useRef(new Animated.Value(1)).current;
  const wasActiveRef = useRef<boolean>(false);

  useEffect(() => {
    const becameActive = isActivePage && !wasActiveRef.current;
    wasActiveRef.current = isActivePage;

    if (becameActive) {
      const delay = Math.min(cardIndex * 28, 130);
      const subtleExpandX = 1.007 + (cardIndex % 2) * 0.002;
      const subtleCompressY = 0.994 - (cardIndex % 2) * 0.002;

      const anim = Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(recoverX, {
            toValue: subtleExpandX,
            duration: 95,
            useNativeDriver: true,
          }),
          Animated.timing(recoverY, {
            toValue: subtleCompressY,
            duration: 95,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(recoverX, {
            toValue: 1,
            damping: 24,
            stiffness: 170,
            mass: 0.95,
            useNativeDriver: true,
          }),
          Animated.spring(recoverY, {
            toValue: 1,
            damping: 24,
            stiffness: 170,
            mass: 0.95,
            useNativeDriver: true,
          }),
        ]),
      ]);
      anim.start();
      return () => anim.stop();
    }
  }, [isActivePage, cardIndex, recoverX, recoverY]);

  if (!scrollX || pageWidth <= 0) {
    return (
      <Animated.View
        style={[
          style,
          {
            transform: [{ scaleX: recoverX }, { scaleY: recoverY }],
          },
        ]}
      >
        {children}
      </Animated.View>
    );
  }

  const w = Math.max(pageWidth, 1);
  const center = pageIndex * w;
  const inputRange = [
    center - w,
    center - w * 0.5,
    center - w * 0.2,
    center,
    center + w * 0.2,
    center + w * 0.5,
    center + w,
  ];

  const intensity = 1 + (cardIndex % 3) * 0.08;
  const stretchPeak = 1 + 0.012 * intensity;
  const squashValley = 1 - 0.011 * intensity;

  const slideScaleX = scrollX.interpolate({
    inputRange,
    outputRange: [
      0.985,
      stretchPeak,
      1.005,
      1,
      1.005,
      stretchPeak,
      0.985,
    ],
    extrapolate: 'clamp',
  });

  const slideScaleY = scrollX.interpolate({
    inputRange,
    outputRange: [
      1.010,
      squashValley,
      0.996,
      1,
      0.996,
      squashValley,
      1.010,
    ],
    extrapolate: 'clamp',
  });

  const lagX = 5 + (cardIndex % 3) * 2;
  const translateX = scrollX.interpolate({
    inputRange,
    outputRange: [-lagX * 1.4, -lagX, -lagX * 0.3, 0, lagX * 0.3, lagX, lagX * 1.4],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.82, 0.93, 0.98, 1, 0.98, 0.93, 0.82],
    extrapolate: 'clamp',
  });

  const combinedScaleX = Animated.multiply(slideScaleX, recoverX);
  const combinedScaleY = Animated.multiply(slideScaleY, recoverY);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [
            { translateX },
            { scaleX: combinedScaleX },
            { scaleY: combinedScaleY },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

interface GlassCardSheenProps {
  selected?: boolean;
  mintTint?: boolean;
}

/**
 * Acabado de cristal esmerilado neutro estilo TIDE (glow blanco suave exclusivo en cards, cero verde).
 */
export const GlassCardSheen: React.FC<GlassCardSheenProps> = React.memo(({
  selected = false,
}) => {
  if (selected) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.24)',
            'rgba(255, 255, 255, 0.13)',
            'rgba(255, 255, 255, 0.20)',
          ]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.selectedTopHighlight} />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.13)',
          'rgba(255, 255, 255, 0.04)',
          'rgba(255, 255, 255, 0.02)',
          'rgba(255, 255, 255, 0.09)',
        ]}
        locations={[0, 0.38, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glassTopSpecularLine} />
    </View>
  );
});

const styles = StyleSheet.create({
  glassTopSpecularLine: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
  },
  selectedTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
});
