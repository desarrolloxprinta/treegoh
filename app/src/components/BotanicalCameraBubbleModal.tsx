import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import Svg, {
  Path,
  Circle,
  Line,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Fonts } from '../constants/theme';
import { TreegohIcon } from './TreegohIcon';

export interface CapturedBubbleFrame {
  uri: string;
  base64: string;
  mimeType: string;
}

interface BotanicalCameraBubbleModalProps {
  visible: boolean;
  isAnalyzing: boolean;
  externalFrozenUri?: string | null;
  liveHeadingDegrees: number;
  liveCompassLabel: string;
  estimatedLux: number;
  onClose: () => void;
  onCaptureFrame: (frame: CapturedBubbleFrame) => Promise<void> | void;
  onPickGalleryInsideModal: () => Promise<void> | void;
}

export const BotanicalCameraBubbleModal: React.FC<BotanicalCameraBubbleModalProps> = ({
  visible,
  isAnalyzing,
  externalFrozenUri,
  liveHeadingDegrees,
  liveCompassLabel,
  estimatedLux,
  onClose,
  onCaptureFrame,
  onPickGalleryInsideModal,
}) => {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 20);
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 16);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [frozenUri, setFrozenUri] = useState<string | null>(null);

  // Control de montaje y animación suave de despliegue tipo burbuja integrada
  const [isMounted, setIsMounted] = useState<boolean>(visible);
  const bubbleExpandAnim = useRef(new Animated.Value(0)).current;
  const bracketBreathAnim = useRef(new Animated.Value(0)).current;

  // Estado de enfoque táctil (Tap-to-Focus) y selector óptico delicado
  const [focusMode, setFocusMode] = useState<'on' | 'off'>('off');
  const [zoomLevel, setZoomLevel] = useState<number>(0);
  const [activePresetZoom, setActivePresetZoom] = useState<'macro' | '1x' | '2x'>('1x');
  const [availableLenses, setAvailableLenses] = useState<Array<{ deviceType: string; localizedName: string }>>([]);
  const [selectedLens, setSelectedLens] = useState<string | undefined>(undefined);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number; locked: boolean } | null>(null);
  const focusScaleAnim = useRef(new Animated.Value(1.28)).current;
  const focusOpacityAnim = useRef(new Animated.Value(0)).current;
  const focusResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Geometría de la burbuja flotante integrada (deja ver sutilmente la cabecera de la app detrás)
  const sheetMarginH = 10;
  const sheetTopOffset = safeTop + 10;
  const sheetBottomOffset = Math.max(safeBottom - 6, 10);
  const bubbleCardW = Math.max(300, winW - sheetMarginH * 2);
  const bubbleCardH = Math.max(480, winH - sheetTopOffset - sheetBottomOffset);

  // Dimensiones del marco limpio de esquinas redondeadas (estilo Cal AI / Mobbin)
  const frameWidth = Math.min(bubbleCardW * 0.78, 296);
  const frameHeight = Math.min(bubbleCardH * 0.38, 240);

  // Animación de entrada y salida suave (sin cortes bruscos)
  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      setFrozenUri(null);
      setIsShooting(false);
      setFocusPoint(null);
      if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
        requestCameraPermission();
      }
      Animated.timing(bubbleExpandAnim, {
        toValue: 1,
        duration: 460,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }).start();
    } else if (isMounted) {
      setTorchEnabled(false);
      setFocusPoint(null);
      Animated.timing(bubbleExpandAnim, {
        toValue: 0,
        duration: 320,
        easing: Easing.bezier(0.32, 0, 0.67, 0),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setIsMounted(false);
        }
      });
    }
    return () => {
      if (focusResetTimerRef.current) clearTimeout(focusResetTimerRef.current);
      if (focusHideTimerRef.current) clearTimeout(focusHideTimerRef.current);
    };
  }, [visible, cameraPermission]);

  // Cierre suave animado cuando el usuario pulsa cerrar o toca fuera de la burbuja
  const handleSmoothDismiss = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    Animated.timing(bubbleExpandAnim, {
      toValue: 0,
      duration: 310,
      easing: Easing.bezier(0.32, 0, 0.67, 0),
      useNativeDriver: true,
    }).start(() => {
      setIsMounted(false);
      onClose();
    });
  }, [bubbleExpandAnim, onClose]);

  // Respiración orgánica muy sutil para las 4 esquinas del visor
  useEffect(() => {
    if (!isMounted) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bracketBreathAnim, {
          toValue: 1,
          duration: isAnalyzing ? 950 : 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bracketBreathAnim, {
          toValue: 0,
          duration: isAnalyzing ? 950 : 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isMounted, isAnalyzing, bracketBreathAnim]);

  const triggerHaptic = (heavy = false) => {
    try {
      Haptics.impactAsync(
        heavy ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
    } catch (_e) {}
  };

  const activeFrozenImage = frozenUri || externalFrozenUri || null;

  // Dispara un ciclo real de autoenfoque por hardware en AVFoundation (iOS) y muestra una retícula limpia
  const handleTapToFocus = (tapX: number, tapY: number, showReticle = true) => {
    if (isAnalyzing || isShooting || activeFrozenImage) return;
    if (showReticle) {
      triggerHaptic(false);
    }

    if (focusResetTimerRef.current) clearTimeout(focusResetTimerRef.current);
    if (focusHideTimerRef.current) clearTimeout(focusHideTimerRef.current);

    if (showReticle) {
      const clampedX = Math.max(42, Math.min(bubbleCardW - 42, tapX));
      const clampedY = Math.max(76, Math.min(bubbleCardH - 150, tapY));

      setFocusPoint({ x: clampedX, y: clampedY, locked: false });
      focusScaleAnim.setValue(1.24);
      focusOpacityAnim.setValue(0.92);

      Animated.spring(focusScaleAnim, {
        toValue: 1,
        damping: 18,
        stiffness: 210,
        mass: 0.7,
        useNativeDriver: true,
      }).start();
    }

    setFocusMode('on');
    const baseZoom = activePresetZoom === '2x' ? 0.08 : 0;
    setZoomLevel(baseZoom + 0.0015);

    focusResetTimerRef.current = setTimeout(() => {
      setFocusMode('off');
      setZoomLevel(baseZoom);
      if (showReticle) {
        setFocusPoint(prev => (prev ? { ...prev, locked: true } : null));
      }
    }, 360);

    if (showReticle) {
      focusHideTimerRef.current = setTimeout(() => {
        Animated.timing(focusOpacityAnim, {
          toValue: 0,
          duration: 340,
          useNativeDriver: true,
        }).start(() => {
          setFocusPoint(null);
        });
      }, 1350);
    }
  };

  const handleSelectOpticalPreset = (preset: 'macro' | '1x' | '2x') => {
    triggerHaptic(false);
    setActivePresetZoom(preset);

    const ultraWide = availableLenses.find(l => l.deviceType.includes('UltraWide'));
    const wideAngle = availableLenses.find(l => l.deviceType.includes('WideAngle'));

    if (preset === 'macro') {
      if (ultraWide) {
        setSelectedLens(ultraWide.deviceType);
      }
      setZoomLevel(0);
    } else if (preset === '1x') {
      if (wideAngle) {
        setSelectedLens(wideAngle.deviceType);
      } else {
        setSelectedLens(undefined);
      }
      setZoomLevel(0);
    } else {
      if (wideAngle) {
        setSelectedLens(wideAngle.deviceType);
      }
      setZoomLevel(0.08);
    }

    setTimeout(() => {
      handleTapToFocus(bubbleCardW / 2, bubbleCardH * 0.44, false);
    }, 120);
  };

  const handleShutterPress = async () => {
    if (isShooting || isAnalyzing) return;
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
      return;
    }
    if (!cameraRef.current) return;

    triggerHaptic(true);
    setIsShooting(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.65,
        base64: true,
      });
      setIsShooting(false);
      if (photo?.uri && photo?.base64) {
        setFrozenUri(photo.uri);
        await onCaptureFrame({
          uri: photo.uri,
          base64: photo.base64,
          mimeType: 'image/jpeg',
        });
      }
    } catch (_err) {
      setIsShooting(false);
    }
  };

  if (!isMounted) return null;

  const currentHour = new Date().getHours();
  const isNightScan = currentHour < 7 || currentHour >= 20;

  // Interpolaciones suaves para el despliegue de la burbuja de cámara integrada
  const backdropOpacity = bubbleExpandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const bubbleTranslateY = bubbleExpandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [110, 0],
  });
  const bubbleScale = bubbleExpandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
  });
  const bracketScale = bracketBreathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, isAnalyzing ? 0.96 : 1.022],
  });
  const bracketOpacity = bracketBreathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.68, 0.94],
  });

  // Geometría SVG para las 4 esquinas redondeadas limpias (estilo Cal AI / Mobbin)
  const cornerLen = 34;
  const cornerR = 18;
  const strokePad = 2;
  const w = frameWidth;
  const h = frameHeight;

  const cornersPath = [
    // Top-Left
    `M ${strokePad} ${strokePad + cornerLen} L ${strokePad} ${strokePad + cornerR} Q ${strokePad} ${strokePad} ${strokePad + cornerR} ${strokePad} L ${strokePad + cornerLen} ${strokePad}`,
    // Top-Right
    `M ${w - strokePad - cornerLen} ${strokePad} L ${w - strokePad - cornerR} ${strokePad} Q ${w - strokePad} ${strokePad} ${w - strokePad} ${strokePad + cornerR} L ${w - strokePad} ${strokePad + cornerLen}`,
    // Bottom-Left
    `M ${strokePad} ${h - strokePad - cornerLen} L ${strokePad} ${h - strokePad - cornerR} Q ${strokePad} ${h - strokePad} ${strokePad + cornerR} ${h - strokePad} L ${strokePad + cornerLen} ${h - strokePad}`,
    // Bottom-Right
    `M ${w - strokePad - cornerLen} ${h - strokePad} L ${w - strokePad - cornerR} ${h - strokePad} Q ${w - strokePad} ${h - strokePad} ${w - strokePad} ${h - strokePad - cornerR} L ${w - strokePad} ${h - strokePad - cornerLen}`,
  ].join(' ');

  return (
    <Modal
      visible={isMounted}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleSmoothDismiss}
    >
      <View style={styles.overlayRoot}>
        {/* FONDO DIFUMINADO SUAVE QUE MANTIENE LA APP INTEGRADA DETRÁS */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.backdropDim,
            { opacity: backdropOpacity },
          ]}
        >
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleSmoothDismiss}
          />
        </Animated.View>

        {/* BURBUJA DE CÁMARA INTEGRADA CON ESQUINAS ORGÁNICAS Y ANIMACIÓN FLUIDA */}
        <Animated.View
          style={[
            styles.cameraBubbleSheet,
            {
              width: bubbleCardW,
              height: bubbleCardH,
              marginTop: sheetTopOffset,
              opacity: backdropOpacity,
              transform: [
                { translateY: bubbleTranslateY },
                { scale: bubbleScale },
              ],
            },
          ]}
        >
          {/* 1. SEÑAL DE CÁMARA EN VIVO DENTRO DE LA BURBUJA */}
          {activeFrozenImage ? (
            <Image
              source={{ uri: activeFrozenImage }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : cameraPermission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torchEnabled}
              autofocus={focusMode}
              zoom={zoomLevel}
              selectedLens={selectedLens}
              onAvailableLensesChanged={e => {
                if (e?.lenses && Array.isArray(e.lenses)) {
                  setAvailableLenses(e.lenses);
                  if (!selectedLens) {
                    const wide = e.lenses.find(l => l.deviceType.includes('WideAngle'));
                    if (wide) setSelectedLens(wide.deviceType);
                  }
                }
              }}
              onCameraReady={() => {
                setTimeout(() => {
                  handleTapToFocus(bubbleCardW / 2, bubbleCardH * 0.44, false);
                }, 250);
              }}
            />
          ) : (
            <View style={styles.permissionCenterFallback}>
              <TreegohIcon name="camara_diagnostica" size={32} color="rgba(255,255,255,0.85)" glow={false} />
              <Text style={styles.permissionFallbackTitle}>
                Visor óptico
              </Text>
              <Text style={styles.permissionFallbackSub}>
                Activa el acceso a la cámara para observar tu planta desde esta burbuja.
              </Text>
              <TouchableOpacity
                style={styles.permissionGrantBtn}
                onPress={() => requestCameraPermission()}
                activeOpacity={0.85}
              >
                <Text style={styles.permissionGrantBtnText}>Permitir cámara</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Velo sutil perimetral para legibilidad limpia sin oscurecer la planta */}
          <View style={styles.subtleVignetteOverlay} pointerEvents="none" />

          {/* 2. CAPA TÁCTIL DE ENFOQUE (TAP-TO-FOCUS) + ESQUINAS LIMPIAS DEL VISOR */}
          {!activeFrozenImage && cameraPermission?.granted && (
            <View
              style={styles.tapToFocusTouchLayer}
              onStartShouldSetResponder={() => true}
              onResponderRelease={e => {
                const { locationX, locationY } = e.nativeEvent;
                handleTapToFocus(
                  locationX || bubbleCardW / 2,
                  locationY || bubbleCardH * 0.44,
                  true
                );
              }}
            >
              {/* Marco limpio de 4 esquinas redondeadas (sin láser ni puntos agresivos) */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.cleanCornerFrameWrap,
                  {
                    width: frameWidth,
                    height: frameHeight,
                    opacity: bracketOpacity,
                    transform: [{ scale: bracketScale }],
                  },
                ]}
              >
                <Svg width={frameWidth} height={frameHeight}>
                  <Path
                    d={cornersPath}
                    fill="none"
                    stroke={isAnalyzing ? 'rgba(134, 239, 172, 0.92)' : 'rgba(255, 255, 255, 0.86)'}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Animated.View>

              {/* Retícula minimalista de enfoque donde toca el usuario */}
              {focusPoint && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.focusReticleRing,
                    {
                      left: focusPoint.x - 26,
                      top: focusPoint.y - 26,
                      opacity: focusOpacityAnim,
                      transform: [{ scale: focusScaleAnim }],
                      borderColor: focusPoint.locked
                        ? 'rgba(134, 239, 172, 0.90)'
                        : 'rgba(255, 255, 255, 0.85)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.focusReticleCenterDot,
                      {
                        backgroundColor: focusPoint.locked
                          ? 'rgba(134, 239, 172, 0.95)'
                          : 'rgba(255, 255, 255, 0.90)',
                      },
                    ]}
                  />
                </Animated.View>
              )}
            </View>
          )}

          {/* 3. CABECERA DE LA BURBUJA: GRABBER + CERRAR + INDICATIVO DE LUZ MUY DISCRETO */}
          <View style={styles.bubbleTopHeader}>
            <View style={styles.bubbleHandlePill} />

            <View style={styles.topControlsRow}>
              <TouchableOpacity
                style={styles.minimalCircleBtn}
                onPress={handleSmoothDismiss}
                activeOpacity={0.78}
              >
                <Svg width={14} height={14} viewBox="0 0 16 16">
                  <Line
                    x1="3.5"
                    y1="3.5"
                    x2="12.5"
                    y2="12.5"
                    stroke="rgba(255, 255, 255, 0.88)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <Line
                    x1="12.5"
                    y1="3.5"
                    x2="3.5"
                    y2="12.5"
                    stroke="rgba(255, 255, 255, 0.88)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </Svg>
              </TouchableOpacity>

              {/* Indicativo de luz meramente informativo, muy discreto y en baja opacidad */}
              <View style={styles.discreetLightInfoRow} pointerEvents="none">
                <View
                  style={[
                    styles.discreetLightDot,
                    {
                      backgroundColor: isNightScan
                        ? 'rgba(253, 230, 138, 0.45)'
                        : 'rgba(134, 239, 172, 0.48)',
                    },
                  ]}
                />
                <Text style={styles.discreetLightInfoText} numberOfLines={1}>
                  {isNightScan
                    ? `${liveCompassLabel} · Luz interior nocturna`
                    : `${liveCompassLabel} ${liveHeadingDegrees}° · ~${estimatedLux.toLocaleString()} lx`}
                </Text>
              </View>

              {/* Espaciador simétrico para mantener centrado el indicativo de luz */}
              <View style={styles.headerRightSpacer} />
            </View>
          </View>

          {/* 4. CONTROLES INFERIORES DE LA BURBUJA: LENTES DELICADOS CON ICONOGRAFÍA + DISPARADOR */}
          <View style={styles.bubbleBottomFooter}>
            {/* Selector compacto y delicado de lentes con iconografía fina */}
            {!activeFrozenImage && !isAnalyzing && cameraPermission?.granted && (
              <View style={styles.delicateLensCapsule}>
                {(
                  [
                    { id: 'macro' as const, label: '.5x' },
                    { id: '1x' as const, label: '1x' },
                    { id: '2x' as const, label: '2x' },
                  ] as const
                ).map(lens => {
                  const isSel = activePresetZoom === lens.id;
                  const iconColor = isSel
                    ? '#121417'
                    : 'rgba(255, 255, 255, 0.62)';
                  return (
                    <TouchableOpacity
                      key={lens.id}
                      style={[
                        styles.delicateLensChip,
                        isSel && styles.delicateLensChipActive,
                      ]}
                      onPress={() => handleSelectOpticalPreset(lens.id)}
                      activeOpacity={0.82}
                    >
                      {/* Iconografía delicada según distancia focal */}
                      {lens.id === 'macro' && (
                        <Svg width={11} height={11} viewBox="0 0 14 14">
                          <Path
                            d="M11.5 2.5C7.5 2.5 3.5 5.2 3.2 9.8C3.2 10.4 3.6 10.8 4.2 10.8C8.8 10.5 11.5 6.5 11.5 2.5Z"
                            stroke={iconColor}
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                          <Path
                            d="M3.2 10.8L7.8 6.2"
                            stroke={iconColor}
                            strokeWidth="1.1"
                            strokeLinecap="round"
                          />
                        </Svg>
                      )}
                      {lens.id === '1x' && (
                        <Svg width={11} height={11} viewBox="0 0 14 14">
                          <Circle
                            cx="7"
                            cy="7"
                            r="4.2"
                            stroke={iconColor}
                            strokeWidth="1.2"
                            fill="none"
                          />
                          <Circle
                            cx="7"
                            cy="7"
                            r="1.3"
                            fill={iconColor}
                          />
                        </Svg>
                      )}
                      {lens.id === '2x' && (
                        <Svg width={11} height={11} viewBox="0 0 14 14">
                          <Circle
                            cx="6.3"
                            cy="6.3"
                            r="3.8"
                            stroke={iconColor}
                            strokeWidth="1.2"
                            fill="none"
                          />
                          <Line
                            x1="9.2"
                            y1="9.2"
                            x2="11.8"
                            y2="11.8"
                            stroke={iconColor}
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />
                        </Svg>
                      )}
                      <Text
                        style={[
                          styles.delicateLensText,
                          isSel && styles.delicateLensTextActive,
                        ]}
                      >
                        {lens.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {isAnalyzing ? (
              <View style={styles.analyzingPillBar}>
                <ActivityIndicator size="small" color="rgba(134, 239, 172, 0.9)" />
                <Text style={styles.analyzingPillText}>
                  Observando hojas y luz del espacio...
                </Text>
              </View>
            ) : (
              <View style={styles.bottomDockBar}>
                {/* Botón de Flash / Linterna discreto a la izquierda (como en la referencia) */}
                <TouchableOpacity
                  style={[
                    styles.minimalCircleBtn,
                    torchEnabled && styles.minimalCircleBtnActive,
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setTorchEnabled(prev => !prev);
                  }}
                  activeOpacity={0.8}
                >
                  <Svg width={16} height={16} viewBox="0 0 18 18">
                    <Path
                      d="M10 2L4.5 9.5H9L8 16L13.5 8.5H9L10 2Z"
                      stroke={torchEnabled ? '#121417' : 'rgba(255, 255, 255, 0.82)'}
                      strokeWidth="1.35"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    {!torchEnabled && (
                      <Line
                        x1="3"
                        y1="3"
                        x2="15"
                        y2="15"
                        stroke="rgba(255, 255, 255, 0.75)"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                    )}
                  </Svg>
                </TouchableOpacity>

                {/* Disparador limpio central */}
                <TouchableOpacity
                  style={styles.cleanShutterRing}
                  onPress={handleShutterPress}
                  disabled={isShooting}
                  activeOpacity={0.86}
                >
                  <View style={styles.cleanShutterCore}>
                    {isShooting && (
                      <ActivityIndicator size="small" color="#121417" />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Botón de Galería discreto a la derecha */}
                <TouchableOpacity
                  style={styles.minimalCircleBtn}
                  onPress={() => {
                    triggerHaptic();
                    onPickGalleryInsideModal();
                  }}
                  activeOpacity={0.8}
                >
                  <TreegohIcon
                    name="galeria_evolucion"
                    size={17}
                    color="rgba(255, 255, 255, 0.82)"
                    glow={false}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backdropDim: {
    backgroundColor: 'rgba(4, 6, 9, 0.46)',
  },
  cameraBubbleSheet: {
    backgroundColor: '#0A0C0F',
    borderRadius: 38,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 18,
  },
  subtleVignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 8, 10, 0.12)',
  },
  permissionCenterFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 12,
    backgroundColor: '#0D1014',
  },
  permissionFallbackTitle: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
  },
  permissionFallbackSub: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.56)',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionGrantBtn: {
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 22,
  },
  permissionGrantBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#121417',
  },
  tapToFocusTouchLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cleanCornerFrameWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  focusReticleRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusReticleCenterDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  bubbleTopHeader: {
    paddingTop: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 10,
    zIndex: 20,
  },
  bubbleHandlePill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
  },
  topControlsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  minimalCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(22, 24, 28, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimalCircleBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  headerRightSpacer: {
    width: 38,
    height: 38,
  },
  discreetLightInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 12, 16, 0.28)',
  },
  discreetLightDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  discreetLightInfoText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.44)',
    letterSpacing: 0.2,
  },
  bubbleBottomFooter: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 18,
    zIndex: 20,
  },
  delicateLensCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 20, 24, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.11)',
    borderRadius: 22,
    padding: 3,
    gap: 2,
  },
  delicateLensChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
  },
  delicateLensChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  delicateLensText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.68)',
    letterSpacing: 0.1,
  },
  delicateLensTextActive: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#121417',
  },
  bottomDockBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  cleanShutterRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.8,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cleanShutterCore: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingPillBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(18, 20, 24, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  analyzingPillText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
