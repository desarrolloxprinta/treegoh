import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { TreegohIcon, IconName } from './TreegohIcon';
import { Fonts } from '../constants/theme';

export interface NavTabItem {
  id: string;
  icon: IconName;
  label?: string;
}

interface FloatingBlobNavBarProps {
  tabs: NavTabItem[];
  activeIndex: number;
  onTabPress: (index: number) => void;
  scrollX?: Animated.Value;
  pageWidth?: number;
  bottomInset?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const FloatingBlobNavBar: React.FC<FloatingBlobNavBarProps> = React.memo(({
  tabs,
  activeIndex,
  onTabPress,
  scrollX,
  pageWidth = SCREEN_WIDTH,
  bottomInset = 0,
}) => {
  // Dimensiones dinámicas de la barra flotante de 4 iconos (Inicio, Experto, Espacios, Enciclopedia)
  const maxBarWidth = Math.min(SCREEN_WIDTH - 44, 348);
  const horizontalPadding = 8;
  const usableWidth = maxBarWidth - horizontalPadding * 2;
  const tabWidth = usableWidth / tabs.length;
  const blobWidth = Math.min(tabWidth - 8, 64);
  const blobOffset = (tabWidth - blobWidth) / 2;

  // Animaciones de respaldo para transición por toque
  const blobAnimX = useRef(new Animated.Value(0)).current;
  const blobScaleX = useRef(new Animated.Value(1)).current;
  const blobScaleY = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Si no hay scrollX vinculado, movemos el blob con física de resorte orgánico en el hilo de UI
    if (!scrollX) {
      const targetX = horizontalPadding + activeIndex * tabWidth + blobOffset;

      Animated.parallel([
        Animated.spring(blobAnimX, {
          toValue: targetX,
          damping: 20,
          stiffness: 220,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(blobScaleX, {
              toValue: 1.15,
              duration: 90,
              useNativeDriver: true,
            }),
            Animated.timing(blobScaleY, {
              toValue: 0.88,
              duration: 90,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.spring(blobScaleX, {
              toValue: 1,
              damping: 16,
              stiffness: 200,
              useNativeDriver: true,
            }),
            Animated.spring(blobScaleY, {
              toValue: 1,
              damping: 16,
              stiffness: 200,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }
  }, [activeIndex, tabWidth, blobOffset, scrollX]);

  // Si scrollX está conectado al carrusel horizontal de páginas, interpolamos en tiempo real
  let animatedTranslateX: any = blobAnimX;
  let animatedScaleX: any = blobScaleX;
  let animatedScaleY: any = blobScaleY;

  if (scrollX && pageWidth > 0) {
    const inputRange: number[] = [];
    const outputRangeX: number[] = [];
    const scaleInputRange: number[] = [];
    const scaleOutputRangeX: number[] = [];
    const scaleOutputRangeY: number[] = [];

    tabs.forEach((_, idx) => {
      inputRange.push(idx * pageWidth);
      outputRangeX.push(horizontalPadding + idx * tabWidth + blobOffset);

      scaleInputRange.push(idx * pageWidth);
      scaleOutputRangeX.push(1.0);
      scaleOutputRangeY.push(1.0);

      if (idx < tabs.length - 1) {
        scaleInputRange.push((idx + 0.5) * pageWidth);
        scaleOutputRangeX.push(1.18);
        scaleOutputRangeY.push(0.86);
      }
    });

    animatedTranslateX = scrollX.interpolate({
      inputRange,
      outputRange: outputRangeX,
      extrapolate: 'clamp',
    });

    animatedScaleX = scrollX.interpolate({
      inputRange: scaleInputRange,
      outputRange: scaleOutputRangeX,
      extrapolate: 'clamp',
    });

    animatedScaleY = scrollX.interpolate({
      inputRange: scaleInputRange,
      outputRange: scaleOutputRangeY,
      extrapolate: 'clamp',
    });
  }

  const handlePress = (index: number) => {
    try {
      Haptics.selectionAsync();
    } catch (_e) {}
    onTabPress(index);
  };

  const dynamicBottom = Math.max(bottomInset > 0 ? bottomInset + 4 : 18, 16);

  return (
    <View
      style={[
        styles.floatingContainer,
        {
          bottom: dynamicBottom,
          width: maxBarWidth,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.glassBarWrapper}>
        <BlurView intensity={Platform.OS === 'ios' ? 38 : 60} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Capa de tinte mineral translúcido Tide */}
        <View style={styles.mineralOverlay} />

        {/* Línea especular superior de cristal */}
        <View style={styles.specularTopLine} />

        {/* BLOB ANIMADO ORGÁNICO CON DEFORMACIÓN SQUASH & STRETCH */}
        <Animated.View
          style={[
            styles.animatedBlob,
            {
              width: blobWidth,
              transform: [
                { translateX: animatedTranslateX },
                { scaleX: animatedScaleX },
                { scaleY: animatedScaleY },
              ],
            },
          ]}
        >
          <View style={styles.blobInnerGlow} />
        </Animated.View>

        {/* FILA EXCLUSIVA DE ICONOGRAFÍA DE NAVEGACIÓN (+10% DE TAMAÑO, SIN TEXTO) */}
        <View style={styles.iconsRow}>
          {tabs.map((tab, idx) => {
            const isActive = idx === activeIndex;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, { width: tabWidth }]}
                onPress={() => handlePress(idx)}
                activeOpacity={0.78}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              >
                <TreegohIcon
                  name={tab.icon}
                  size={23.5}
                  color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.50)'}
                  glow={isActive}
                  glowColor="#FFFFFF"
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 999,
    alignItems: 'center',
  },
  glassBarWrapper: {
    width: '100%',
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.44,
    shadowRadius: 24,
    elevation: 16,
  },
  mineralOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 23, 21, 0.78)',
  },
  specularTopLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
  },
  animatedBlob: {
    position: 'absolute',
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blobInnerGlow: {
    width: '74%',
    height: '74%',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    width: '100%',
    height: '100%',
  },
  tabButton: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

