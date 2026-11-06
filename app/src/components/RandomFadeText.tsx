/**
 * RandomFadeText — Revelación Etérea Optimizada en Hilo Nativo (TIDE 2026)
 *
 * Anima las palabras en orden aleatorio con useNativeDriver: true y, al completarse,
 * colapsa la jerarquía a un único nodo nativo <Text> para liberar memoria y GPU.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, TextStyle, StyleProp, ViewStyle } from 'react-native';

interface RandomFadeTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  maxDelayMs?: number;
  fadeDurationMs?: number;
  onComplete?: () => void;
}

interface WordAnimItem {
  word: string;
  anim: Animated.Value;
  delay: number;
}

export const RandomFadeText: React.FC<RandomFadeTextProps> = React.memo(({
  text,
  style,
  containerStyle,
  maxDelayMs = 620,
  fadeDurationMs = 380,
  onComplete,
}) => {
  const [isDone, setIsDone] = useState(false);

  const wordItems = useMemo<WordAnimItem[]>(() => {
    if (!text) return [];
    const rawWords = text.split(' ');
    return rawWords.map((w, idx) => {
      const pseudoRand = ((idx * 0.61803398875) % 1 + 1) % 1;
      return {
        word: idx < rawWords.length - 1 ? `${w} ` : w,
        anim: new Animated.Value(0),
        delay: Math.floor(pseudoRand * maxDelayMs),
      };
    });
  }, [text, maxDelayMs]);

  useEffect(() => {
    setIsDone(false);
    if (!wordItems || wordItems.length === 0) return;

    const animations = wordItems.map(item =>
      Animated.sequence([
        Animated.delay(item.delay),
        Animated.timing(item.anim, {
          toValue: 1,
          duration: fadeDurationMs,
          useNativeDriver: true,
        }),
      ])
    );

    const parallelAnim = Animated.parallel(animations);
    parallelAnim.start(({ finished }) => {
      if (finished) {
        setIsDone(true);
        onComplete?.();
      }
    });

    return () => {
      parallelAnim.stop();
    };
  }, [wordItems, fadeDurationMs, onComplete]);

  if (!text) return null;

  if (isDone) {
    return (
      <View style={containerStyle}>
        <Text style={style}>{text}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {wordItems.map((item, idx) => (
        <Animated.Text
          key={`rf_w_${idx}`}
          style={[style, { opacity: item.anim }]}
        >
          {item.word}
        </Animated.Text>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
});
