/**
 * Sanctuary Optical Seed & Colmena Co-Care Modal — Treegoh
 *
 * Diagramación editorial amplia, limpia y respirada para la vinculación entre convivientes
 * ("Semilla Óptica" QR Bioluminiscente), gestión del hogar en Modo Colmena y bitácora
 * con escudo biológico Anti-Sobre-Riego.
 *
 * Cumplimiento estricto:
 * - Cero emojis en código, comentarios e interfaz.
 * - Tipografía institucional Fonts.light (300) y Fonts.regular (400).
 * - Animaciones en hilo nativo (useNativeDriver: true) y cierre fluido deslizando hacia abajo.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
  Platform,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { Fonts } from '../constants/theme';
import { TreegohIcon } from './TreegohIcon';
import { UserPlant } from '../types/plant';
import { getPlantOverwateringCooldown } from '../services/reminderService';
import {
  ColmenaSanctuaryState,
  OpticalSeedPayload,
  getColmenaSanctuaryState,
  buildOpticalSeedUri,
  generateOpticalSeedQrMatrix,
  parseOpticalSeedData,
  joinColmenaByOpticalSeed,
  addColmenaMember,
  removeColmenaMember,
  simulateRoommateColmenaCare,
} from '../services/sanctuarySyncService';

interface SanctuaryOpticalSeedModalProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  sanctuaryName: string;
  spacesCount: number;
  plantsBySpace: Record<string, UserPlant[]>;
  onUpdatePlantsBySpace: (updated: Record<string, UserPlant[]>) => void;
  onOpenCameraScanner: () => void;
  recentlyScannedSeed?: OpticalSeedPayload | null;
  onClearScannedSeed?: () => void;
}

type ColmenaTab = 'semilla' | 'convivientes' | 'bitacora';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const SanctuaryOpticalSeedModalComponent: React.FC<SanctuaryOpticalSeedModalProps> = ({
  visible,
  onClose,
  userName,
  sanctuaryName,
  spacesCount,
  plantsBySpace,
  onUpdatePlantsBySpace,
  onOpenCameraScanner,
  recentlyScannedSeed,
  onClearScannedSeed,
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ColmenaTab>('semilla');
  const [colmenaState, setColmenaState] = useState<ColmenaSanctuaryState | null>(null);
  const [manualSeedInput, setManualSeedInput] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Animación de arrastre hacia abajo y halo bioluminiscente en GPU
  const translateY = useRef(new Animated.Value(0)).current;
  const haloBreathAnim = useRef(new Animated.Value(0)).current;

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

  const allPlants = useMemo(() => {
    return Object.values(plantsBySpace || {}).flat();
  }, [plantsBySpace]);

  const protectedPlants = useMemo(() => {
    return allPlants
      .map(p => ({
        plant: p,
        cooldown: getPlantOverwateringCooldown(p, colmenaState?.cooldownHours || 18),
      }))
      .filter(item => item.cooldown.isProtected);
  }, [allPlants, colmenaState?.cooldownHours]);

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(0);
    let mounted = true;

    getColmenaSanctuaryState(userName || 'Propietario', sanctuaryName || 'Mi Santuario').then(
      st => {
        if (mounted) {
          setColmenaState(st);
        }
      }
    );

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloBreathAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(haloBreathAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => {
      mounted = false;
      loop.stop();
    };
  }, [visible, userName, sanctuaryName, haloBreathAnim, translateY]);

  useEffect(() => {
    if (visible && recentlyScannedSeed) {
      (async () => {
        triggerHaptic(true);
        const updated = await joinColmenaByOpticalSeed(
          recentlyScannedSeed,
          userName || 'Cuidador'
        );
        setColmenaState(updated);
        setActiveTab('convivientes');
        setStatusBanner(
          `Vinculación completada con «${recentlyScannedSeed.sanctuaryName}» (${recentlyScannedSeed.seedCode}) junto a ${recentlyScannedSeed.hostName}.`
        );
        onClearScannedSeed?.();
      })();
    }
  }, [visible, recentlyScannedSeed, userName, onClearScannedSeed, triggerHaptic]);

  const opticalSeedUri = useMemo(() => {
    const seedCode = colmenaState?.seedCode || 'SALVIA-742';
    return buildOpticalSeedUri({
      seedCode,
      sanctuaryName: colmenaState?.sanctuaryName || sanctuaryName || 'Santuario',
      hostName: userName || 'Anfitrion',
      plantsCount: allPlants.length,
      spacesCount: Math.max(1, spacesCount),
    });
  }, [colmenaState, sanctuaryName, userName, allPlants.length, spacesCount]);

  const qrMatrix = useMemo(() => {
    return generateOpticalSeedQrMatrix(opticalSeedUri);
  }, [opticalSeedUri]);

  const handleShareSeedLink = async () => {
    triggerHaptic(false);
    const code = colmenaState?.seedCode || 'SALVIA-742';
    const message =
      `Únete a mi Santuario Botánico «${sanctuaryName}» en Treegoh (Modo Colmena).\n\n` +
      `Código de Semilla Óptica: ${code}\n` +
      `Enlace directo: ${opticalSeedUri}`;
    try {
      await Share.share({
        title: `Semilla Óptica Treegoh · ${code}`,
        message,
      });
    } catch (_e) {}
  };

  const handleJoinManualCode = async () => {
    const parsed = parseOpticalSeedData(manualSeedInput);
    if (!parsed) {
      Alert.alert(
        'Formato de Semilla no reconocido',
        'Introduce un código botánico válido como SALVIA-742 o escanea directamente la Semilla Óptica desde la cámara.'
      );
      return;
    }

    triggerHaptic(true);
    const updated = await joinColmenaByOpticalSeed(parsed, userName || 'Cuidador');
    setColmenaState(updated);
    setManualSeedInput('');
    setActiveTab('convivientes');
    setStatusBanner(
      `Santuario sincronizado con la semilla ${parsed.seedCode}. Modo Colmena activo.`
    );
  };

  const handleAddRoommate = async () => {
    if (!newMemberName.trim()) return;
    triggerHaptic(true);
    const updated = await addColmenaMember(newMemberName.trim(), 'co_cuidador');
    setColmenaState(updated);
    setNewMemberName('');
    setStatusBanner(
      `${newMemberName.trim()} ahora forma parte de la Colmena del hogar.`
    );
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    triggerHaptic(false);
    const updated = await removeColmenaMember(userId);
    setColmenaState(updated);
    setStatusBanner(`Se ha desvinculado a ${name} de este santuario.`);
  };

  const handleSimulateRoommateCare = async () => {
    triggerHaptic(true);
    const res = await simulateRoommateColmenaCare(plantsBySpace);
    if (!res) {
      Alert.alert(
        'Sin plantas en el santuario',
        'Añade al menos una planta a tu espacio para probar el cuidado colaborativo en Modo Colmena.'
      );
      return;
    }
    onUpdatePlantsBySpace(res.updatedPlantsBySpace);
    setColmenaState(res.colmenaState);
    setActiveTab('bitacora');
    setStatusBanner(
      `${res.actorName} acaba de hidratar «${res.actedPlantName}». Escudo Anti-Sobre-Riego activado por 18 horas.`
    );
  };

  if (!visible) return null;

  const haloScale = haloBreathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.04],
  });
  const haloOpacity = haloBreathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.82],
  });
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, 340],
    outputRange: [1, 0.15],
    extrapolate: 'clamp',
  });

  // Geometría del QR Bioluminiscente con margen generoso
  const qrSizePx = 220;
  const matrixLen = qrMatrix.length;
  const quietZone = 2;
  const totalModules = matrixLen + quietZone * 2;
  const cellPx = qrSizePx / totalModules;

  const isInFinderArea = (r: number, c: number) => {
    const inTopLeft = r < 7 && c < 7;
    const inTopRight = r < 7 && c >= matrixLen - 7;
    const inBottomLeft = r >= matrixLen - 7 && c < 7;
    return inTopLeft || inTopRight || inBottomLeft;
  };

  const renderBioFinderPattern = (topMod: number, leftMod: number, key: string) => {
    const x = (leftMod + quietZone) * cellPx;
    const y = (topMod + quietZone) * cellPx;
    const outerS = 7 * cellPx;
    const midOffset = 1 * cellPx;
    const midS = 5 * cellPx;
    const innerOffset = 2 * cellPx;
    const innerS = 3 * cellPx;

    return (
      <React.Fragment key={key}>
        <Rect
          x={x}
          y={y}
          width={outerS}
          height={outerS}
          rx={cellPx * 1.9}
          fill="#86EFAC"
        />
        <Rect
          x={x + midOffset}
          y={y + midOffset}
          width={midS}
          height={midS}
          rx={cellPx * 1.3}
          fill="#07120C"
        />
        <Rect
          x={x + innerOffset}
          y={y + innerOffset}
          width={innerS}
          height={innerS}
          rx={cellPx * 0.9}
          fill="#E6E8C4"
        />
      </React.Fragment>
    );
  };

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
            { backgroundColor: 'rgba(5, 10, 7, 0.82)', opacity: backdropOpacity },
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
                MODO COLMENA · CO-CUIDADO
              </Text>
              <Text style={styles.modalTitle} numberOfLines={1}>
                Santuario Compartido
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

          {/* Selector de navegación en cápsula de una sola línea (sin saltos de línea) */}
          <View style={styles.segmentedBarWrap}>
            <View style={styles.segmentedTrack}>
              {(
                [
                  { id: 'semilla' as const, label: 'Semilla' },
                  { id: 'convivientes' as const, label: 'Colmena' },
                  { id: 'bitacora' as const, label: 'Bitácora' },
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

          {/* Banner de confirmación si hubo un evento reciente */}
          {statusBanner && (
            <View style={styles.statusBannerCard}>
              <TreegohIcon name="check_verificado" size={16} color="#86EFAC" glow={false} />
              <Text style={styles.statusBannerText}>{statusBanner}</Text>
              <TouchableOpacity
                onPress={() => setStatusBanner(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <TreegohIcon name="cierre" size={13} color="rgba(255,255,255,0.6)" glow={false} />
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScrollEndDrag={e => {
              const offsetY = e.nativeEvent.contentOffset.y;
              const velY = e.nativeEvent.velocity?.y ?? 0;
              if (offsetY < -45 || (offsetY <= 0 && velY < -0.6)) {
                handleDismiss();
              }
            }}
          >
            {/* ============================================================
                SECCIÓN 1: SEMILLA ÓPTICA (QR BIOLUMINISCENTE Y ESCÁNER)
               ============================================================ */}
            {activeTab === 'semilla' && (
              <View style={styles.sectionStack}>
                {/* Tarjeta Principal de la Semilla Óptica */}
                <View style={styles.heroSeedCard}>
                  <Text style={styles.heroCardEyebrow} numberOfLines={1}>
                    SEMILLA ÓPTICA BIOLUMINISCENTE
                  </Text>
                  <Text style={styles.heroCardTitle} numberOfLines={1}>
                    {colmenaState?.sanctuaryName || sanctuaryName}
                  </Text>
                  <Text style={styles.heroCardMeta} numberOfLines={1}>
                    {allPlants.length} {allPlants.length === 1 ? 'planta' : 'plantas'} ·{' '}
                    {Math.max(1, spacesCount)} {spacesCount === 1 ? 'espacio' : 'espacios'} en
                    sincronía
                  </Text>

                  {/* Orbe central con QR Orgánico y Halo de Respiración */}
                  <View style={styles.qrOrbStage}>
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.qrBioluminescentHalo,
                        {
                          opacity: haloOpacity,
                          transform: [{ scale: haloScale }],
                        },
                      ]}
                    />

                    <View style={styles.qrInnerFrame}>
                      <Svg width={qrSizePx} height={qrSizePx}>
                        <Defs>
                          <RadialGradient id="bioGlow" cx="50%" cy="50%" r="55%">
                            <Stop offset="0%" stopColor="#143322" stopOpacity="0.95" />
                            <Stop offset="100%" stopColor="#07120C" stopOpacity="1" />
                          </RadialGradient>
                        </Defs>

                        <Rect
                          x={0}
                          y={0}
                          width={qrSizePx}
                          height={qrSizePx}
                          rx={26}
                          fill="url(#bioGlow)"
                        />

                        <Rect
                          x={3}
                          y={3}
                          width={qrSizePx - 6}
                          height={qrSizePx - 6}
                          rx={23}
                          fill="none"
                          stroke="rgba(134, 239, 172, 0.25)"
                          strokeWidth={1}
                        />

                        {renderBioFinderPattern(0, 0, 'finder_tl')}
                        {renderBioFinderPattern(0, matrixLen - 7, 'finder_tr')}
                        {renderBioFinderPattern(matrixLen - 7, 0, 'finder_bl')}

                        {qrMatrix.map((row, rIdx) =>
                          row.map((isDark, cIdx) => {
                            if (!isDark || isInFinderArea(rIdx, cIdx)) return null;
                            const cx = (cIdx + quietZone + 0.5) * cellPx;
                            const cy = (rIdx + quietZone + 0.5) * cellPx;
                            const isAltTone = (rIdx + cIdx) % 3 === 0;
                            return (
                              <Circle
                                key={`m_${rIdx}_${cIdx}`}
                                cx={cx}
                                cy={cy}
                                r={cellPx * 0.44}
                                fill={isAltTone ? '#E6E8C4' : '#86EFAC'}
                              />
                            );
                          })
                        )}
                      </Svg>
                    </View>
                  </View>

                  {/* Cápsula limpia de una sola línea para el código */}
                  <View style={styles.seedCodeCapsule}>
                    <Text style={styles.seedCodeCapsuleText} numberOfLines={1}>
                      CÓDIGO · {colmenaState?.seedCode || 'SALVIA-742'}
                    </Text>
                  </View>

                  <Text style={styles.heroCardDescription}>
                    Abre la Burbuja Óptica de la cámara en el teléfono de tu conviviente y enfoca
                    esta semilla para compartir el cuidado de vuestras plantas.
                  </Text>

                  {/* Botones amplios y espaciados */}
                  <View style={styles.actionButtonsStack}>
                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={() => {
                        triggerHaptic(false);
                        onClose();
                        setTimeout(() => {
                          onOpenCameraScanner();
                        }, 180);
                      }}
                      activeOpacity={0.85}
                    >
                      <TreegohIcon name="camara_diagnostica" size={17} color="#08120C" glow={false} />
                      <Text style={styles.primaryActionButtonText} numberOfLines={1}>
                        Escanear Semilla con Cámara
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryActionButton}
                      onPress={handleShareSeedLink}
                      activeOpacity={0.8}
                    >
                      <TreegohIcon name="compartir_exportar" size={16} color="#E6E8C4" glow={false} />
                      <Text style={styles.secondaryActionButtonText} numberOfLines={1}>
                        Compartir invitación a distancia
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Tarjeta espaciada para vincular por código manual */}
                <View style={styles.relaxedCard}>
                  <Text style={styles.relaxedCardTitle}>Vincular mediante código</Text>
                  <Text style={styles.relaxedCardBody}>
                    Si tu conviviente no se encuentra contigo ahora mismo, introduce aquí el código
                    de semilla que te haya compartido:
                  </Text>

                  <TextInput
                    style={styles.fullWidthInput}
                    placeholder="Ejemplo: SALVIA-742"
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
                    value={manualSeedInput}
                    onChangeText={setManualSeedInput}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />

                  <TouchableOpacity
                    style={styles.fullWidthConfirmBtn}
                    onPress={handleJoinManualCode}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.fullWidthConfirmBtnText} numberOfLines={1}>
                      Sincronizar con este código
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ============================================================
                SECCIÓN 2: CONVIVIENTES EN MODO COLMENA
               ============================================================ */}
            {activeTab === 'convivientes' && (
              <View style={styles.sectionStack}>
                {/* Tarjeta Editorial de Filosofía Colmena */}
                <View style={styles.philosophyCard}>
                  <View style={styles.philosophyHeader}>
                    <View style={styles.philosophyIconCircle}>
                      <TreegohIcon name="escudo_fitosanitario" size={17} color="#86EFAC" glow={false} />
                    </View>
                    <Text style={styles.philosophyTitle} numberOfLines={1}>
                      Dinámica de Colmena Abierta
                    </Text>
                  </View>
                  <Text style={styles.philosophyBody}>
                    Todas las tareas de cuidado son compartidas. El primer miembro del hogar que
                    hidrata una planta mantiene viva la racha común de toda la casa y activa el
                    escudo protector durante 18 horas para evitar que otro conviviente la riegue de
                    nuevo por error.
                  </Text>
                </View>

                {/* Lista amplia de Cuidadores */}
                <View style={styles.groupBlock}>
                  <Text style={styles.groupSectionTitle}>
                    Miembros del santuario ({colmenaState?.members.length || 1})
                  </Text>

                  {(colmenaState?.members || []).map(member => (
                    <View key={member.userId} style={styles.memberCard}>
                      <View
                        style={[
                          styles.memberAvatarCircle,
                          { borderColor: member.avatarColor || '#86EFAC' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.memberAvatarInitials,
                            { color: member.avatarColor || '#86EFAC' },
                          ]}
                        >
                          {(member.displayName || 'C').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.memberTextCol}>
                        <Text style={styles.memberNameText} numberOfLines={1}>
                          {member.displayName}
                        </Text>
                        <Text style={styles.memberRoleAndStatsText} numberOfLines={1}>
                          {member.role === 'propietario' ? 'Anfitrión' : 'Co-cuidador'} ·{' '}
                          {member.ritualsCompletedCount}{' '}
                          {member.ritualsCompletedCount === 1 ? 'ritual' : 'rituales'}
                        </Text>
                      </View>

                      {member.role !== 'propietario' && (
                        <TouchableOpacity
                          style={styles.removeMemberBtn}
                          onPress={() => handleRemoveMember(member.userId, member.displayName)}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <TreegohIcon
                            name="cierre"
                            size={13}
                            color="rgba(255,255,255,0.48)"
                            glow={false}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                {/* Añadir un conviviente */}
                <View style={styles.relaxedCard}>
                  <Text style={styles.relaxedCardTitle}>Registrar conviviente del hogar</Text>
                  <Text style={styles.relaxedCardBody}>
                    Añade el nombre de tu pareja, familiar o compañero de piso para asignarle su
                    propio perfil dentro de la bitácora compartida:
                  </Text>

                  <TextInput
                    style={styles.fullWidthInput}
                    placeholder="Nombre del conviviente (ej: Lucía)"
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
                    value={newMemberName}
                    onChangeText={setNewMemberName}
                  />

                  <TouchableOpacity
                    style={styles.fullWidthConfirmBtn}
                    onPress={handleAddRoommate}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.fullWidthConfirmBtnText} numberOfLines={1}>
                      Añadir a la Colmena
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ============================================================
                SECCIÓN 3: ESCUDO ANTI-SOBRE-RIEGO Y BITÁCORA EN VIVO
               ============================================================ */}
            {activeTab === 'bitacora' && (
              <View style={styles.sectionStack}>
                {/* Bloque 1: Plantas con Escudo Activo */}
                <View style={styles.groupBlock}>
                  <Text style={styles.groupSectionTitle}>
                    Escudo Anti-Sobre-Riego activo ({protectedPlants.length})
                  </Text>

                  {protectedPlants.length === 0 ? (
                    <View style={styles.emptyStateCard}>
                      <View style={styles.emptyIconCircle}>
                        <TreegohIcon
                          name="escudo_fitosanitario"
                          size={22}
                          color="#93C5FD"
                          glow={false}
                        />
                      </View>
                      <Text style={styles.emptyStateTitle}>
                        Ninguna planta en enfriamiento hídrico
                      </Text>
                      <Text style={styles.emptyStateBody}>
                        Cuando cualquier miembro de la Colmena riegue una planta, aparecerá aquí
                        protegida durante 18 horas para evitar que otro conviviente vuelva a
                        regarla por accidente.
                      </Text>
                    </View>
                  ) : (
                    protectedPlants.map(({ plant, cooldown }) => (
                      <View key={`prot_${plant.id}`} style={styles.protectedPlantCard}>
                        <View style={styles.protectedHeaderRow}>
                          <View style={styles.protectedPill}>
                            <TreegohIcon
                              name="escudo_fitosanitario"
                              size={12}
                              color="#08120C"
                              glow={false}
                            />
                            <Text style={styles.protectedPillText} numberOfLines={1}>
                              Protegida · {cooldown.hoursRemaining} h restantes
                            </Text>
                          </View>
                          <Text style={styles.protectedSpaceLabel} numberOfLines={1}>
                            {plant.spaceName}
                          </Text>
                        </View>

                        <Text style={styles.protectedPlantName} numberOfLines={1}>
                          {plant.nickname
                            ? `«${plant.nickname}» · ${plant.commonName}`
                            : plant.commonName}
                        </Text>

                        <Text style={styles.protectedMetaText}>
                          Hidratada hoy a las {cooldown.formattedTime} h por{' '}
                          <Text style={styles.protectedAuthorHighlight}>{cooldown.wateredBy}</Text>.
                        </Text>
                      </View>
                    ))
                  )}
                </View>

                {/* Bloque 2: Bitácora Cronológica */}
                <View style={styles.groupBlock}>
                  <Text style={styles.groupSectionTitle}>
                    Actividad reciente del hogar
                  </Text>

                  {!colmenaState?.careLogs || colmenaState.careLogs.length === 0 ? (
                    <View style={styles.emptyStateCard}>
                      <View style={styles.emptyIconCircle}>
                        <TreegohIcon
                          name="historial_clinico"
                          size={22}
                          color="#E6E8C4"
                          glow={false}
                        />
                      </View>
                      <Text style={styles.emptyStateTitle}>Bitácora lista para estrenar</Text>
                      <Text style={styles.emptyStateBody}>
                        Cada vez que tú o tus convivientes completéis un riego, abono o limpieza
                        foliar, quedará registrado aquí con fecha, hora y autor.
                      </Text>
                    </View>
                  ) : (
                    colmenaState.careLogs.map(log => {
                      const d = new Date(log.timestampIso);
                      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(
                        d.getMinutes()
                      ).padStart(2, '0')}`;
                      return (
                        <View key={log.id} style={styles.logItemCard}>
                          <View style={styles.logIconCircle}>
                            <TreegohIcon
                              name={
                                log.actionType === 'riego'
                                  ? 'riego_hidratacion'
                                  : log.actionType === 'fertilizacion'
                                  ? 'fertilizante_nutricion'
                                  : log.actionType === 'trasplante'
                                  ? 'maceta_trasplante'
                                  : 'limpieza_foliar'
                              }
                              size={16}
                              color="#86EFAC"
                              glow={false}
                            />
                          </View>
                          <View style={styles.logTextCol}>
                            <Text style={styles.logTitleText} numberOfLines={1}>
                              {log.performedByUserName} · {log.actionLabel}
                            </Text>
                            <Text style={styles.logSubText} numberOfLines={1}>
                              {log.plantName} ({log.spaceName}) · {timeStr} h
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            )}

            {/* Cierre inferior tranquilo */}
            <TouchableOpacity
              style={styles.bottomDismissButton}
              onPress={handleDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.bottomDismissButtonText}>Cerrar ventana de Colmena</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export const SanctuaryOpticalSeedModal = React.memo(SanctuaryOpticalSeedModalComponent);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    flex: 1,
    backgroundColor: '#0A130E',
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
    letterSpacing: 1.5,
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
  groupBlock: {
    gap: 16,
  },
  groupSectionTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    color: '#E6E8C4',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  heroSeedCard: {
    backgroundColor: 'rgba(16, 29, 21, 0.78)',
    borderRadius: 32,
    paddingVertical: 32,
    paddingHorizontal: 26,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.22)',
    alignItems: 'center',
  },
  heroCardEyebrow: {
    fontFamily: Fonts.regular,
    fontSize: 10.5,
    color: '#86EFAC',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroCardTitle: {
    fontFamily: Fonts.light,
    fontSize: 23,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroCardMeta: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    color: 'rgba(230, 232, 196, 0.72)',
    marginTop: 6,
  },
  qrOrbStage: {
    width: 256,
    height: 256,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 28,
  },
  qrBioluminescentHalo: {
    position: 'absolute',
    width: 252,
    height: 252,
    borderRadius: 46,
    backgroundColor: 'rgba(134, 239, 172, 0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(134, 239, 172, 0.38)',
  },
  qrInnerFrame: {
    padding: 12,
    borderRadius: 34,
    backgroundColor: '#07120C',
    borderWidth: 1,
    borderColor: 'rgba(230, 232, 196, 0.24)',
  },
  seedCodeCapsule: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(230, 232, 196, 0.24)',
    marginBottom: 20,
  },
  seedCodeCapsuleText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    color: '#E6E8C4',
    letterSpacing: 1.6,
  },
  heroCardDescription: {
    fontFamily: Fonts.light,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 6,
  },
  actionButtonsStack: {
    width: '100%',
    gap: 14,
  },
  primaryActionButton: {
    width: '100%',
    height: 54,
    borderRadius: 22,
    backgroundColor: '#86EFAC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  primaryActionButtonText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    color: '#08120C',
  },
  secondaryActionButton: {
    width: '100%',
    height: 52,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(230, 232, 196, 0.24)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  secondaryActionButtonText: {
    fontFamily: Fonts.light,
    fontSize: 14,
    color: '#E6E8C4',
  },
  relaxedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 14,
  },
  relaxedCardTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
    color: '#FFFFFF',
  },
  relaxedCardBody: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.68)',
    lineHeight: 21,
  },
  fullWidthInput: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 18,
    paddingHorizontal: 18,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 4,
  },
  fullWidthConfirmBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#E6E8C4',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthConfirmBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#08120C',
  },
  philosophyCard: {
    backgroundColor: 'rgba(134, 239, 172, 0.07)',
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.24)',
    gap: 14,
  },
  philosophyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  philosophyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(134, 239, 172, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  philosophyTitle: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: '#86EFAC',
  },
  philosophyBody: {
    fontFamily: Fonts.light,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.78)',
    lineHeight: 22,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  memberAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarInitials: {
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  memberTextCol: {
    flex: 1,
    gap: 5,
  },
  memberNameText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: '#FFFFFF',
  },
  memberRoleAndStatsText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    color: 'rgba(230, 232, 196, 0.76)',
  },
  removeMemberBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.26)',
    gap: 14,
  },
  simulationTriggerBtn: {
    width: '100%',
    height: 50,
    borderRadius: 18,
    backgroundColor: 'rgba(134, 239, 172, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  simulationTriggerBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#86EFAC',
  },
  emptyStateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 28,
    paddingVertical: 30,
    paddingHorizontal: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    gap: 12,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyStateTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptyStateBody: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.66)',
    textAlign: 'center',
    lineHeight: 21,
  },
  protectedPlantCard: {
    backgroundColor: 'rgba(134, 239, 172, 0.08)',
    borderRadius: 26,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.30)',
    gap: 10,
  },
  protectedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  protectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#86EFAC',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  protectedPillText: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    color: '#08120C',
  },
  protectedSpaceLabel: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: 'rgba(230, 232, 196, 0.78)',
  },
  protectedPlantName: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    color: '#FFFFFF',
    marginTop: 2,
  },
  protectedMetaText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.78)',
    lineHeight: 20,
  },
  protectedAuthorHighlight: {
    fontFamily: Fonts.regular,
    color: '#86EFAC',
  },
  logItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  logIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(134, 239, 172, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTextCol: {
    flex: 1,
    gap: 4,
  },
  logTitleText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  logSubText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.62)',
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
