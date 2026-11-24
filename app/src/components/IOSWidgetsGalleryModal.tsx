/**
 * iOS Widgets Gallery & Customizer Modal — Treegoh (Estilo Duolingo y Spotify)
 *
 * Estudio interactivo para previsualizar en escala real, personalizar el tema visual
 * y sincronizar los 3 formatos de widgets nativos de iOS:
 * 1. Widget Pequeño (2x2 — Racha Botánica estilo Duolingo)
 * 2. Widget Mediano (4x2 — Radar de Plantas estilo Spotify)
 * 3. Widgets de Pantalla de Bloqueo iOS (Circular y Rectangular bajo el reloj)
 *
 * Cumplimiento estricto:
 * - Cero emojis en código, comentarios e interfaz.
 * - Tipografía institucional Fonts.light (300) y Fonts.regular (400).
 * - Diagramación amplia, limpia y respirada con cierre deslizando hacia abajo.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Fonts } from '../constants/theme';
import { TreegohIcon } from './TreegohIcon';
import { UserPlant } from '../types/plant';
import { CareStreakData, getCareStreak } from '../services/reminderService';
import {
  IOSWidgetThemeId,
  IOSWidgetFocusMode,
  SanctuaryWidgetPayload,
  buildWidgetPayload,
  syncSanctuaryWidgetData,
  getIOSWidgetPreferences,
  saveIOSWidgetPreferences,
} from '../services/widgetBridgeService';

interface IOSWidgetsGalleryModalProps {
  visible: boolean;
  onClose: () => void;
  plantsBySpace: Record<string, UserPlant[]>;
  sanctuaryName: string;
  activeSpaceLux?: number;
  weather?: { temperature: number; condition: string };
}

type WidgetGalleryTab = 'galeria' | 'personalizar' | 'instalar';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const IOSWidgetsGalleryModalComponent: React.FC<IOSWidgetsGalleryModalProps> = ({
  visible,
  onClose,
  plantsBySpace,
  sanctuaryName,
  activeSpaceLux = 3200,
  weather,
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<WidgetGalleryTab>('galeria');
  const [selectedTheme, setSelectedTheme] = useState<IOSWidgetThemeId>('clorofila_nocturna');
  const [selectedFocus, setSelectedFocus] = useState<IOSWidgetFocusMode>('racha_duolingo');
  const [streakData, setStreakData] = useState<CareStreakData | null>(null);
  const [syncConfirmation, setSyncConfirmation] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(0)).current;

  const triggerHaptic = useCallback((success = false) => {
    try {
      if (Platform.OS !== 'web') {
        if (success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (_e) {}
  }, []);

  const handleDismiss = useCallback(() => {
    triggerHaptic(false);
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
      onClose();
    });
  }, [onClose, translateY, triggerHaptic]);

  const resetPosition = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 16,
    }).start();
  }, [translateY]);

  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gs) =>
        gs.dy > 4 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_evt, gs) => {
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_evt, gs) => {
        if (gs.dy > 75 || (gs.dy > 24 && gs.vy > 0.5)) {
          handleDismiss();
        } else if (Math.abs(gs.dy) < 5 && Math.abs(gs.dx) < 5) {
          handleDismiss();
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        resetPosition();
      },
    })
  ).current;

  const allPlants: UserPlant[] = useMemo(() => {
    return Object.values(plantsBySpace || {}).flat();
  }, [plantsBySpace]);

  const sortedPlants = useMemo(() => {
    return [...allPlants].sort((a, b) => a.daysUntilNextWatering - b.daysUntilNextWatering);
  }, [allPlants]);

  const livePayload: SanctuaryWidgetPayload = useMemo(() => {
    return buildWidgetPayload(
      allPlants,
      streakData || {
        currentStreak: 1,
        bestStreak: 1,
        lastActiveDate: '',
        totalRitualsCompleted: 1,
        levelTitle: 'Sembrador Constante',
        streakShieldAvailable: true,
      },
      sanctuaryName,
      weather
    );
  }, [allPlants, streakData, sanctuaryName, weather]);

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(0);
    setSyncConfirmation(null);
    let mounted = true;

    (async () => {
      const [streak, prefs] = await Promise.all([
        getCareStreak(),
        getIOSWidgetPreferences(),
      ]);
      if (mounted) {
        setStreakData(streak);
        setSelectedTheme(prefs.theme);
        setSelectedFocus(prefs.focusMode);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [visible, translateY]);

  const handleApplyAndSyncWidget = async (
    nextTheme = selectedTheme,
    nextFocus = selectedFocus
  ) => {
    triggerHaptic(true);
    await saveIOSWidgetPreferences({
      theme: nextTheme,
      focusMode: nextFocus,
      featuredSpaceName: sanctuaryName,
    });
    await syncSanctuaryWidgetData(
      allPlants,
      streakData || {
        currentStreak: 1,
        bestStreak: 1,
        lastActiveDate: '',
        totalRitualsCompleted: 1,
        levelTitle: 'Sembrador Constante',
        streakShieldAvailable: true,
      },
      sanctuaryName,
      weather
    );
    setSyncConfirmation(
      'Widgets de iOS sincronizados con los datos actuales de tu santuario.'
    );
  };

  if (!visible) return null;

  const isSalvia = selectedTheme === 'salvia_duolingo';
  const isCircadian = selectedTheme === 'cristal_circadiano';

  const widgetBgColor = isSalvia
    ? '#E6E8C4'
    : isCircadian
    ? '#0D1C2B'
    : '#0A1710';
  const widgetBorderColor = isSalvia
    ? 'rgba(10, 20, 14, 0.18)'
    : isCircadian
    ? 'rgba(147, 197, 253, 0.32)'
    : 'rgba(134, 239, 172, 0.28)';
  const widgetPrimaryText = isSalvia ? '#0A140E' : '#FFFFFF';
  const widgetSecondaryText = isSalvia
    ? 'rgba(10, 20, 14, 0.72)'
    : 'rgba(255, 255, 255, 0.72)';
  const widgetAccentColor = isSalvia
    ? '#166534'
    : isCircadian
    ? '#93C5FD'
    : '#86EFAC';

  const topTwoPlants = sortedPlants.slice(0, 2);

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, 340],
    outputRange: [1, 0.15],
    extrapolate: 'clamp',
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(5, 10, 7, 0.84)', opacity: backdropOpacity },
          ]}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 68 : 95}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleDismiss}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalSheet,
            {
              marginTop: Math.max(insets.top + 8, 28),
              paddingBottom: Math.max(insets.bottom + 12, 24),
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Barra superior de arrastre interactiva */}
          <View style={styles.dragHandleArea} {...dragPanResponder.panHandlers}>
            <View style={styles.dragHandleBar} />
          </View>

          {/* Cabecera limpia y espaciada */}
          <View style={styles.modalHeader} {...dragPanResponder.panHandlers}>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerEyebrow} numberOfLines={1}>
                IOS WIDGETKIT · PANTALLA DE INICIO Y BLOQUEO
              </Text>
              <Text style={styles.modalTitle} numberOfLines={1}>
                Widgets del Santuario
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleDismiss}
              activeOpacity={0.75}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
              <TreegohIcon name="cierre" size={16} color="#FFFFFF" glow={false} />
            </TouchableOpacity>
          </View>

          {/* Barra segmentada en una sola línea */}
          <View style={styles.segmentedBarWrap}>
            <View style={styles.segmentedTrack}>
              {(
                [
                  { id: 'galeria' as const, label: 'Vista Previa' },
                  { id: 'personalizar' as const, label: 'Estilo' },
                  { id: 'instalar' as const, label: 'Cómo Ubicar' },
                ] as const
              ).map(tab => {
                const isSel = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.segmentItem, isSel && styles.segmentItemActive]}
                    onPress={() => {
                      triggerHaptic(false);
                      setActiveTab(tab.id);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[styles.segmentLabel, isSel && styles.segmentLabelActive]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {syncConfirmation && (
            <View style={styles.statusBannerCard}>
              <TreegohIcon name="check_verificado" size={16} color="#86EFAC" glow={false} />
              <Text style={styles.statusBannerText}>{syncConfirmation}</Text>
            </View>
          )}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScrollEndDrag={e => {
              const offsetY = e.nativeEvent.contentOffset.y;
              const velY = e.nativeEvent.velocity?.y ?? 0;
              if (offsetY < -45 || (offsetY <= 0 && velY < -0.6)) {
                handleDismiss();
              }
            }}
          >
            {/* ============================================================
                PESTAÑA 1: GALERÍA DE WIDGETS EN TIEMPO REAL
               ============================================================ */}
            {activeTab === 'galeria' && (
              <View style={styles.sectionStack}>
                {/* 1. WIDGET MEDIANO (4x2 — ESTILO SPOTIFY / DUOLINGO DASHBOARD) */}
                <View style={styles.previewSectionBlock}>
                  <View style={styles.previewLabelRow}>
                    <Text style={styles.previewFormatTitle}>
                      Widget Mediano (4×2 · Estilo Spotify)
                    </Text>
                    <Text style={styles.previewFormatTag}>Pantalla de Inicio</Text>
                  </View>

                  <View
                    style={[
                      styles.mediumWidgetFrame,
                      {
                        backgroundColor: widgetBgColor,
                        borderColor: widgetBorderColor,
                      },
                    ]}
                  >
                    {/* Columna Izquierda: Racha y Estado */}
                    <View style={styles.mediumLeftCol}>
                      <View style={styles.widgetBrandRow}>
                        <Text
                          style={[
                            styles.widgetBrandWord,
                            { color: isSalvia ? '#0A140E' : '#E6E8C4' },
                          ]}
                        >
                          treegöh
                        </Text>
                        <View
                          style={[
                            styles.widgetStreakPill,
                            {
                              backgroundColor: isSalvia
                                ? 'rgba(10, 20, 14, 0.10)'
                                : 'rgba(134, 239, 172, 0.16)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.widgetStreakPillText,
                              { color: widgetAccentColor },
                            ]}
                          >
                            {livePayload.streakDays}{' '}
                            {livePayload.streakDays === 1 ? 'día' : 'días'}
                          </Text>
                        </View>
                      </View>

                      <View style={{ gap: 4 }}>
                        <Text
                          style={[styles.mediumMainStatus, { color: widgetPrimaryText }]}
                          numberOfLines={1}
                        >
                          {selectedFocus === 'radar_spotify'
                            ? livePayload.sanctuaryName
                            : livePayload.duoMessageTitle}
                        </Text>
                        <Text
                          style={[styles.mediumBodyText, { color: widgetSecondaryText }]}
                          numberOfLines={2}
                        >
                          {selectedFocus === 'radar_spotify'
                            ? `Microclima ~${activeSpaceLux.toLocaleString()} lx · ${
                                livePayload.temperatureCelsius ?? 22
                              }°C`
                            : livePayload.duoMessageBody}
                        </Text>
                      </View>

                      <Text
                        style={[styles.mediumFooterMeta, { color: widgetAccentColor }]}
                        numberOfLines={1}
                      >
                        {livePayload.sanctuaryName} · {livePayload.temperatureCelsius ?? 22}°C
                      </Text>
                    </View>

                    {/* Columna Derecha: Tarjetas de Plantas estilo Spotify */}
                    <View style={styles.mediumRightCol}>
                      {topTwoPlants.length > 0 ? (
                        topTwoPlants.map(plant => {
                          const needsNow =
                            plant.wateringStatus === 'necesita_riego' ||
                            plant.daysUntilNextWatering <= 0;
                          return (
                            <View
                              key={`w_med_${plant.id}`}
                              style={[
                                styles.spotifyPlantRowCard,
                                {
                                  backgroundColor: isSalvia
                                    ? 'rgba(10, 20, 14, 0.07)'
                                    : 'rgba(255, 255, 255, 0.07)',
                                },
                              ]}
                            >
                              {plant.imageUrl ? (
                                <Image
                                  source={{ uri: plant.imageUrl }}
                                  style={styles.spotifyPlantThumb}
                                />
                              ) : (
                                <View style={styles.spotifyPlantThumbFallback}>
                                  <TreegohIcon
                                    name="riego_hidratacion"
                                    size={12}
                                    color={widgetAccentColor}
                                    glow={false}
                                  />
                                </View>
                              )}
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.spotifyPlantName,
                                    { color: widgetPrimaryText },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {plant.nickname || plant.commonName}
                                </Text>
                                <Text
                                  style={[
                                    styles.spotifyPlantState,
                                    {
                                      color: needsNow
                                        ? isSalvia
                                          ? '#B91C1C'
                                          : '#F87171'
                                        : widgetAccentColor,
                                    },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {needsNow
                                    ? 'Riego hoy'
                                    : plant.wateringStatus === 'hidratada'
                                    ? 'Hidratada'
                                    : `En ${plant.daysUntilNextWatering}d`}
                                </Text>
                              </View>
                            </View>
                          );
                        })
                      ) : (
                        <View style={styles.spotifyPlantRowCard}>
                          <Text style={{ color: widgetSecondaryText, fontSize: 12 }}>
                            Santuario listo
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* 2. WIDGET PEQUEÑO (2x2 — ESTILO DUOLINGO RACHA BOTÁNICA) */}
                <View style={styles.previewSectionBlock}>
                  <View style={styles.previewLabelRow}>
                    <Text style={styles.previewFormatTitle}>
                      Widget Pequeño (2×2 · Estilo Duolingo)
                    </Text>
                    <Text style={styles.previewFormatTag}>Cuadrado iOS</Text>
                  </View>

                  <View style={styles.smallWidgetCenterWrap}>
                    <View
                      style={[
                        styles.smallWidgetFrame,
                        {
                          backgroundColor: widgetBgColor,
                          borderColor: widgetBorderColor,
                        },
                      ]}
                    >
                      <View style={styles.widgetBrandRow}>
                        <Text
                          style={[
                            styles.widgetBrandWord,
                            { color: isSalvia ? '#0A140E' : '#E6E8C4' },
                          ]}
                        >
                          treegöh
                        </Text>
                        <View
                          style={[
                            styles.widgetStreakPill,
                            {
                              backgroundColor: isSalvia
                                ? 'rgba(10, 20, 14, 0.10)'
                                : 'rgba(134, 239, 172, 0.16)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.widgetStreakPillText,
                              { color: widgetAccentColor },
                            ]}
                          >
                            {livePayload.streakDays} d
                          </Text>
                        </View>
                      </View>

                      <View style={{ gap: 4 }}>
                        <Text
                          style={[styles.smallWidgetMainTitle, { color: widgetPrimaryText }]}
                          numberOfLines={1}
                        >
                          {livePayload.duoMessageTitle}
                        </Text>
                        <Text
                          style={[styles.smallWidgetSubText, { color: widgetSecondaryText }]}
                          numberOfLines={2}
                        >
                          {livePayload.pendingWateringsCount > 0
                            ? `${livePayload.nextWateringPlantName} pide agua hoy`
                            : `Próximo: ${livePayload.nextWateringPlantName} (${livePayload.nextWateringDays}d)`}
                        </Text>
                      </View>

                      <View style={styles.smallWidgetBottomRow}>
                        <View
                          style={[
                            styles.smallStatusDot,
                            {
                              backgroundColor:
                                livePayload.pendingWateringsCount > 0
                                  ? '#F87171'
                                  : widgetAccentColor,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.smallWidgetFooterText,
                            { color: widgetSecondaryText },
                          ]}
                          numberOfLines={1}
                        >
                          {livePayload.totalPlantsCount} plantas · {livePayload.sanctuaryName}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 3. WIDGETS DE PANTALLA DE BLOQUEO (LOCK SCREEN BAJO EL RELOJ) */}
                <View style={styles.previewSectionBlock}>
                  <View style={styles.previewLabelRow}>
                    <Text style={styles.previewFormatTitle}>
                      Pantalla de Bloqueo iOS (Lock Screen)
                    </Text>
                    <Text style={styles.previewFormatTag}>Bajo el reloj</Text>
                  </View>

                  <View style={styles.lockScreenStageCard}>
                    <Text style={styles.lockScreenClockText}>09:41</Text>

                    <View style={styles.lockScreenWidgetsRow}>
                      {/* Circular Lock Widget */}
                      <View style={styles.lockCircularWidget}>
                        <Text style={styles.lockCircularNumber}>{livePayload.streakDays}</Text>
                        <Text style={styles.lockCircularLabel}>DÍAS</Text>
                      </View>

                      {/* Rectangular Lock Widget */}
                      <View style={styles.lockRectangularWidget}>
                        <Text style={styles.lockRectHeader} numberOfLines={1}>
                          treegöh · Racha {livePayload.streakDays}d
                        </Text>
                        <Text style={styles.lockRectBody} numberOfLines={1}>
                          {livePayload.pendingWateringsCount > 0
                            ? `Riego hoy: ${livePayload.nextWateringPlantName}`
                            : `Próximo: ${livePayload.nextWateringPlantName} (${livePayload.nextWateringDays}d)`}
                        </Text>
                        <Text style={styles.lockRectFooter} numberOfLines={1}>
                          {livePayload.sanctuaryName} · {livePayload.totalPlantsCount} plantas
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Botón de sincronización inmediata */}
                <TouchableOpacity
                  style={styles.primarySyncButton}
                  onPress={() => handleApplyAndSyncWidget(selectedTheme, selectedFocus)}
                  activeOpacity={0.85}
                >
                  <TreegohIcon name="check_verificado" size={17} color="#08120C" glow={false} />
                  <Text style={styles.primarySyncButtonText}>
                    Sincronizar datos con Widgets de iOS
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ============================================================
                PESTAÑA 2: PERSONALIZAR TEMA Y ENFOQUE DEL WIDGET
               ============================================================ */}
            {activeTab === 'personalizar' && (
              <View style={styles.sectionStack}>
                <View style={styles.relaxedCard}>
                  <Text style={styles.relaxedCardTitle}>Paleta visual del Widget</Text>
                  <Text style={styles.relaxedCardBody}>
                    Elige el acabado estético con el que se mostrará Treegoh en la pantalla de
                    inicio de tu iPhone:
                  </Text>

                  {(
                    [
                      {
                        id: 'clorofila_nocturna' as const,
                        title: 'Clorofila Nocturna (Estilo Spotify)',
                        desc: 'Fondo verde bosque profundo #0A1710 con acentos menta bioluminiscentes.',
                      },
                      {
                        id: 'salvia_duolingo' as const,
                        title: 'Salvia Luminosa (Estilo Duolingo)',
                        desc: 'Superficie editorial verde salvia #E6E8C4 de alto contraste diurno.',
                      },
                      {
                        id: 'cristal_circadiano' as const,
                        title: 'Cristal Circadiano Solar',
                        desc: 'Tonalidad azul cielo nocturno #0D1C2B sincronizada con el clima.',
                      },
                    ] as const
                  ).map(themeOpt => {
                    const isSel = selectedTheme === themeOpt.id;
                    return (
                      <TouchableOpacity
                        key={themeOpt.id}
                        style={[styles.optionSelectCard, isSel && styles.optionSelectCardActive]}
                        onPress={() => {
                          setSelectedTheme(themeOpt.id);
                          handleApplyAndSyncWidget(themeOpt.id, selectedFocus);
                        }}
                        activeOpacity={0.82}
                      >
                        <View style={styles.optionTextCol}>
                          <Text style={styles.optionTitleText}>{themeOpt.title}</Text>
                          <Text style={styles.optionDescText}>{themeOpt.desc}</Text>
                        </View>
                        {isSel && (
                          <TreegohIcon
                            name="check_verificado"
                            size={18}
                            color="#86EFAC"
                            glow={false}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.relaxedCard}>
                  <Text style={styles.relaxedCardTitle}>Prioridad de información</Text>
                  <Text style={styles.relaxedCardBody}>
                    Selecciona qué dato quieres destacar como protagonista en el bloque principal:
                  </Text>

                  {(
                    [
                      {
                        id: 'racha_duolingo' as const,
                        title: 'Racha Diaria y Riegos Urgentes',
                        desc: 'Prioriza mantener viva tu racha de cuidados y avisa qué planta tiene sed hoy.',
                      },
                      {
                        id: 'radar_spotify' as const,
                        title: 'Radar Microclimático de Estancia',
                        desc: 'Muestra la luminosidad en Lux, temperatura en vivo y las plantas principales.',
                      },
                    ] as const
                  ).map(focusOpt => {
                    const isSel = selectedFocus === focusOpt.id;
                    return (
                      <TouchableOpacity
                        key={focusOpt.id}
                        style={[styles.optionSelectCard, isSel && styles.optionSelectCardActive]}
                        onPress={() => {
                          setSelectedFocus(focusOpt.id);
                          handleApplyAndSyncWidget(selectedTheme, focusOpt.id);
                        }}
                        activeOpacity={0.82}
                      >
                        <View style={styles.optionTextCol}>
                          <Text style={styles.optionTitleText}>{focusOpt.title}</Text>
                          <Text style={styles.optionDescText}>{focusOpt.desc}</Text>
                        </View>
                        {isSel && (
                          <TreegohIcon
                            name="check_verificado"
                            size={18}
                            color="#86EFAC"
                            glow={false}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ============================================================
                PESTAÑA 3: CÓMO UBICAR EL WIDGET EN TU IPHONE
               ============================================================ */}
            {activeTab === 'instalar' && (
              <View style={styles.sectionStack}>
                <View style={styles.relaxedCard}>
                  <Text style={styles.relaxedCardTitle}>
                    Ubicar en la Pantalla de Inicio (Home Screen)
                  </Text>
                  <Text style={styles.relaxedCardBody}>
                    Sigue estos 3 pasos en tu iPhone, igual que cuando añades el widget de Duolingo
                    o Spotify:
                  </Text>

                  {[
                    {
                      step: '1',
                      title: 'Mantén pulsado el fondo de tu iPhone',
                      desc: 'Ve a la pantalla de inicio de iOS y mantén presionada cualquier zona libre hasta que los iconos empiecen a moverse.',
                    },
                    {
                      step: '2',
                      title: 'Pulsa Editar (+) arriba a la izquierda',
                      desc: 'Toca el botón Editar en la esquina superior izquierda y selecciona Añadir widget en el menú.',
                    },
                    {
                      step: '3',
                      title: 'Busca Treegoh y elige el tamaño',
                      desc: 'Desliza entre el Widget Pequeño (2×2 Racha Duolingo) o el Widget Mediano (4×2 Radar Spotify) y pulsa Añadir widget.',
                    },
                  ].map(item => (
                    <View key={item.step} style={styles.stepRowCard}>
                      <View style={styles.stepNumberCircle}>
                        <Text style={styles.stepNumberText}>{item.step}</Text>
                      </View>
                      <View style={styles.stepTextCol}>
                        <Text style={styles.stepTitleText}>{item.title}</Text>
                        <Text style={styles.stepDescText}>{item.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.relaxedCard}>
                  <Text style={styles.relaxedCardTitle}>
                    Ubicar en la Pantalla de Bloqueo (Lock Screen)
                  </Text>
                  <Text style={styles.relaxedCardBody}>
                    También puedes colocar tu racha botánica justo debajo del reloj de bloqueo de
                    iOS:
                  </Text>

                  <View style={styles.stepRowCard}>
                    <View style={styles.stepNumberCircle}>
                      <TreegohIcon name="luz_natural" size={15} color="#86EFAC" glow={false} />
                    </View>
                    <View style={styles.stepTextCol}>
                      <Text style={styles.stepTitleText}>Personalizar Pantalla Bloqueada</Text>
                      <Text style={styles.stepDescText}>
                        Mantén pulsada la pantalla de bloqueo de tu iPhone, toca Personalizar,
                        selecciona el recuadro debajo de la hora y añade el anillo de racha o el
                        panel de próximo riego de Treegoh.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.bottomDismissButton}
              onPress={handleDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.bottomDismissButtonText}>Cerrar galería de Widgets</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export const IOSWidgetsGalleryModal = React.memo(IOSWidgetsGalleryModalComponent);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    flex: 1,
    backgroundColor: '#09120D',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  dragHandleArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },
  dragHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 6,
    paddingBottom: 20,
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 16,
    gap: 4,
  },
  headerEyebrow: {
    fontFamily: Fonts.regular,
    fontSize: 10.5,
    color: '#86EFAC',
    letterSpacing: 1.4,
  },
  modalTitle: {
    fontFamily: Fonts.light,
    fontSize: 25,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedBarWrap: {
    paddingHorizontal: 28,
    marginBottom: 22,
  },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentItemActive: {
    backgroundColor: '#86EFAC',
  },
  segmentLabel: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.78)',
  },
  segmentLabelActive: {
    fontFamily: Fonts.regular,
    color: '#08120C',
  },
  statusBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 28,
    marginBottom: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(134, 239, 172, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.32)',
  },
  statusBannerText: {
    flex: 1,
    fontFamily: Fonts.light,
    fontSize: 13,
    color: '#E6E8C4',
    lineHeight: 19,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 4,
    paddingBottom: 56,
  },
  sectionStack: {
    gap: 28,
  },
  previewSectionBlock: {
    gap: 14,
  },
  previewLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewFormatTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: '#FFFFFF',
  },
  previewFormatTag: {
    fontFamily: Fonts.light,
    fontSize: 12,
    color: '#E6E8C4',
  },
  // Widget Mediano 4x2 (Spotify / Duolingo Dashboard)
  mediumWidgetFrame: {
    width: '100%',
    minHeight: 172,
    borderRadius: 30,
    borderWidth: 1.5,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
  },
  mediumLeftCol: {
    flex: 1.15,
    justifyContent: 'space-between',
    gap: 10,
  },
  mediumRightCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  widgetBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  widgetBrandWord: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  widgetStreakPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  widgetStreakPillText: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
  },
  mediumMainStatus: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  mediumBodyText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    lineHeight: 17,
  },
  mediumFooterMeta: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
  },
  spotifyPlantRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 9,
    borderRadius: 16,
  },
  spotifyPlantThumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  spotifyPlantThumbFallback: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(134, 239, 172, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotifyPlantName: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
  },
  spotifyPlantState: {
    fontFamily: Fonts.light,
    fontSize: 11,
    marginTop: 2,
  },
  // Widget Pequeño 2x2 (Duolingo Racha)
  smallWidgetCenterWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  smallWidgetFrame: {
    width: 176,
    height: 176,
    borderRadius: 30,
    borderWidth: 1.5,
    padding: 18,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  smallWidgetMainTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    letterSpacing: -0.2,
  },
  smallWidgetSubText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    lineHeight: 16,
  },
  smallWidgetBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  smallWidgetFooterText: {
    flex: 1,
    fontFamily: Fonts.light,
    fontSize: 10.5,
  },
  // Lock Screen Stage
  lockScreenStageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 30,
    paddingVertical: 24,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    gap: 18,
  },
  lockScreenClockText: {
    fontFamily: Fonts.light,
    fontSize: 44,
    color: 'rgba(255, 255, 255, 0.88)',
    letterSpacing: -1,
  },
  lockScreenWidgetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  lockCircularWidget: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: 'rgba(134, 239, 172, 0.75)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCircularNumber: {
    fontFamily: Fonts.regular,
    fontSize: 18,
    color: '#FFFFFF',
  },
  lockCircularLabel: {
    fontFamily: Fonts.light,
    fontSize: 8.5,
    color: 'rgba(255, 255, 255, 0.72)',
    letterSpacing: 0.6,
  },
  lockRectangularWidget: {
    flex: 1,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 14,
    justifyContent: 'center',
    gap: 2,
  },
  lockRectHeader: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    color: '#86EFAC',
  },
  lockRectBody: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  lockRectFooter: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  primarySyncButton: {
    width: '100%',
    height: 54,
    borderRadius: 22,
    backgroundColor: '#86EFAC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primarySyncButtonText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    color: '#08120C',
  },
  relaxedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 16,
  },
  relaxedCardTitle: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    color: '#FFFFFF',
  },
  relaxedCardBody: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.68)',
    lineHeight: 21,
  },
  optionSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  optionSelectCardActive: {
    backgroundColor: 'rgba(134, 239, 172, 0.10)',
    borderColor: '#86EFAC',
  },
  optionTextCol: {
    flex: 1,
    gap: 4,
  },
  optionTitleText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  optionDescText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
  },
  stepRowCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  stepNumberCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(134, 239, 172, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#86EFAC',
  },
  stepTextCol: {
    flex: 1,
    gap: 4,
  },
  stepTitleText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  stepDescText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.68)',
    lineHeight: 19,
  },
  bottomDismissButton: {
    marginTop: 32,
    width: '100%',
    height: 50,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomDismissButtonText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.76)',
  },
});
