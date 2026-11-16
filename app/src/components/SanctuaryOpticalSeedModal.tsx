/**
 * Sanctuary Optical Seed & Colmena Co-Care Modal — Treegoh
 *
 * Hub interactivo para vinculación óptica entre convivientes ("Semilla Óptica" QR Bioluminiscente),
 * gestión de miembros del hogar en Modo Colmena Abierta y bitácora con escudo Anti-Sobre-Riego.
 *
 * Cumplimiento estricto:
 * - Cero emojis en código, comentarios e interfaz.
 * - Tipografía Fonts.light (300) y Fonts.regular (400).
 * - Animaciones en hilo nativo (useNativeDriver: true).
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Rect, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
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

  // Animación bioluminiscente en GPU (useNativeDriver: true)
  const haloBreathAnim = useRef(new Animated.Value(0)).current;

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
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(haloBreathAnim, {
          toValue: 0,
          duration: 2800,
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
  }, [visible, userName, sanctuaryName, haloBreathAnim]);

  // Si venimos de escanear una Semilla Óptica desde la cámara, vincular automáticamente
  useEffect(() => {
    if (visible && recentlyScannedSeed) {
      (async () => {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_e) {}
        const updated = await joinColmenaByOpticalSeed(
          recentlyScannedSeed,
          userName || 'Cuidador'
        );
        setColmenaState(updated);
        setActiveTab('convivientes');
        setStatusBanner(
          `Resonancia completada: Vinculado a «${recentlyScannedSeed.sanctuaryName}» (${recentlyScannedSeed.seedCode}) junto a ${recentlyScannedSeed.hostName}.`
        );
        onClearScannedSeed?.();
      })();
    }
  }, [visible, recentlyScannedSeed, userName, onClearScannedSeed]);

  const triggerHaptic = (success = false) => {
    try {
      if (Platform.OS !== 'web') {
        if (success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (_e) {}
  };

  // URI codificada en la Semilla Óptica
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

  // Matriz QR ISO/IEC 18004 real para escaneo óptico instantáneo
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
    outputRange: [0.98, 1.045],
  });
  const haloOpacity = haloBreathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.42, 0.88],
  });

  // Geometría de renderizado del QR Bioluminiscente
  const qrSizePx = 216;
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
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 72 : 100}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.modalSheet,
            {
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Cabecera */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerPill}>
                <TreegohIcon name="espacios_microclimas" size={12} color="#86EFAC" glow={false} />
                <Text style={styles.headerPillText}>Modo Colmena · Co-Cuidado</Text>
              </View>
              <Text style={styles.modalTitle}>Santuario Compartido</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.75}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <TreegohIcon name="cierre" size={16} color="#FFFFFF" glow={false} />
            </TouchableOpacity>
          </View>

          {/* Selector de pestañas */}
          <View style={styles.tabsBar}>
            {(
              [
                { id: 'semilla' as const, label: 'Semilla Óptica' },
                {
                  id: 'convivientes' as const,
                  label: `Colmena (${colmenaState?.members.length || 1})`,
                },
                {
                  id: 'bitacora' as const,
                  label: `Escudo (${protectedPlants.length})`,
                },
              ] as const
            ).map(tab => {
              const isSel = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabPill, isSel && styles.tabPillActive]}
                  onPress={() => {
                    triggerHaptic(false);
                    setActiveTab(tab.id);
                  }}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.tabPillText, isSel && styles.tabPillTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Banner de confirmación si hubo un evento reciente */}
          {statusBanner && (
            <View style={styles.statusBannerCard}>
              <TreegohIcon name="check_verificado" size={15} color="#86EFAC" glow={false} />
              <Text style={styles.statusBannerText}>{statusBanner}</Text>
              <TouchableOpacity
                onPress={() => setStatusBanner(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <TreegohIcon name="cierre" size={12} color="rgba(255,255,255,0.6)" glow={false} />
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ============================================================
                PESTAÑA 1: SEMILLA ÓPTICA (QR BIOLUMINISCENTE Y ESCÁNER)
               ============================================================ */}
            {activeTab === 'semilla' && (
              <View style={styles.sectionBlock}>
                <View style={styles.opticalSeedStageCard}>
                  <Text style={styles.stageCardEyebrow}>RESONANCIA ÓPTICA DE SANTUARIO</Text>
                  <Text style={styles.stageCardTitle}>
                    {colmenaState?.sanctuaryName || sanctuaryName}
                  </Text>
                  <Text style={styles.stageCardMeta}>
                    {allPlants.length} {allPlants.length === 1 ? 'planta' : 'plantas'} ·{' '}
                    {Math.max(1, spacesCount)} {spacesCount === 1 ? 'espacio' : 'espacios'} en
                    sincronía
                  </Text>

                  {/* Halo Bioluminiscente + QR Orgánico */}
                  <View style={styles.qrOrbContainer}>
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

                        {/* Fondo clorofila profundo para alto contraste óptico */}
                        <Rect
                          x={0}
                          y={0}
                          width={qrSizePx}
                          height={qrSizePx}
                          rx={24}
                          fill="url(#bioGlow)"
                        />

                        {/* Anillo sutil perimetral */}
                        <Rect
                          x={3}
                          y={3}
                          width={qrSizePx - 6}
                          height={qrSizePx - 6}
                          rx={21}
                          fill="none"
                          stroke="rgba(134, 239, 172, 0.28)"
                          strokeWidth={1}
                        />

                        {/* 3 Patrones de búsqueda (Finder Patterns) orgánicos */}
                        {renderBioFinderPattern(0, 0, 'finder_tl')}
                        {renderBioFinderPattern(0, matrixLen - 7, 'finder_tr')}
                        {renderBioFinderPattern(matrixLen - 7, 0, 'finder_bl')}

                        {/* Módulos de datos como esporas bioluminiscentes */}
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

                  {/* Código de Semilla Legible */}
                  <View style={styles.seedCodeBadge}>
                    <Text style={styles.seedCodeLabel}>CÓDIGO SEMILLA</Text>
                    <Text style={styles.seedCodeValue}>
                      {colmenaState?.seedCode || 'SALVIA-742'}
                    </Text>
                  </View>

                  <Text style={styles.seedInstructionText}>
                    Tu conviviente solo tiene que abrir la Burbuja Óptica de la cámara en su
                    Treegoh y enfocar esta Semilla Óptica para vincular vuestras plantas.
                  </Text>

                  {/* Botones de Acción Principal */}
                  <View style={styles.seedButtonsRow}>
                    <TouchableOpacity
                      style={styles.scanSeedPrimaryBtn}
                      onPress={() => {
                        triggerHaptic(false);
                        onClose();
                        setTimeout(() => {
                          onOpenCameraScanner();
                        }, 180);
                      }}
                      activeOpacity={0.85}
                    >
                      <TreegohIcon name="camara_diagnostica" size={16} color="#08120C" glow={false} />
                      <Text style={styles.scanSeedPrimaryBtnText}>
                        Escanear Semilla con Cámara
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.shareSeedSecondaryBtn}
                      onPress={handleShareSeedLink}
                      activeOpacity={0.8}
                    >
                      <TreegohIcon name="compartir_exportar" size={15} color="#E6E8C4" glow={false} />
                      <Text style={styles.shareSeedSecondaryBtnText}>
                        Enviar invitación a distancia
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Entrada manual de Código de Semilla */}
                <View style={styles.manualCodeCard}>
                  <Text style={styles.manualCodeTitle}>
                    ¿Tu conviviente te envió un código de semilla?
                  </Text>
                  <Text style={styles.manualCodeSub}>
                    Introdúcelo aquí para sincronizar vuestros espacios si no estáis juntos en este
                    momento:
                  </Text>
                  <View style={styles.manualInputRow}>
                    <TextInput
                      style={styles.manualTextInput}
                      placeholder="Ej: SALVIA-742"
                      placeholderTextColor="rgba(255, 255, 255, 0.35)"
                      value={manualSeedInput}
                      onChangeText={setManualSeedInput}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.manualJoinBtn}
                      onPress={handleJoinManualCode}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.manualJoinBtnText}>Vincular</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ============================================================
                PESTAÑA 2: CONVIVIENTES EN MODO COLMENA
               ============================================================ */}
            {activeTab === 'convivientes' && (
              <View style={styles.sectionBlock}>
                <View style={styles.colmenaPhilosophyCard}>
                  <View style={styles.philosophyHeaderRow}>
                    <TreegohIcon name="escudo_fitosanitario" size={16} color="#86EFAC" glow={false} />
                    <Text style={styles.philosophyTitle}>Filosofía de Colmena Abierta</Text>
                  </View>
                  <Text style={styles.philosophyBody}>
                    Todas las plantas pendientes son visibles para los miembros del hogar. El
                    primero que riega una especie suma +1 día a la racha común de la casa y activa
                    automáticamente el bloqueo protector de 18 horas para evitar que otro
                    conviviente vuelva a regarla por error.
                  </Text>
                </View>

                <Text style={styles.subSectionHeader}>
                  Cuidadores vinculados ({colmenaState?.members.length || 1})
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

                    <View style={styles.memberInfoCol}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberNameText}>{member.displayName}</Text>
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleBadgeText}>
                            {member.role === 'propietario' ? 'Anfitrión' : 'Co-cuidador'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.memberStatsText}>
                        {member.ritualsCompletedCount}{' '}
                        {member.ritualsCompletedCount === 1
                          ? 'ritual completado'
                          : 'rituales completados'}{' '}
                        en la Colmena
                      </Text>
                    </View>

                    {member.role !== 'propietario' && (
                      <TouchableOpacity
                        style={styles.removeMemberBtn}
                        onPress={() => handleRemoveMember(member.userId, member.displayName)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <TreegohIcon
                          name="cierre"
                          size={13}
                          color="rgba(255,255,255,0.45)"
                          glow={false}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {/* Añadir un conviviente manualmente */}
                <View style={styles.manualCodeCard}>
                  <Text style={styles.manualCodeTitle}>Añadir conviviente del hogar</Text>
                  <Text style={styles.manualCodeSub}>
                    Registra el nombre de tu pareja, familiar o compañero de piso para asignarle
                    perfil en la bitácora:
                  </Text>
                  <View style={styles.manualInputRow}>
                    <TextInput
                      style={styles.manualTextInput}
                      placeholder="Nombre (ej: Lucía, Carlos...)"
                      placeholderTextColor="rgba(255, 255, 255, 0.35)"
                      value={newMemberName}
                      onChangeText={setNewMemberName}
                    />
                    <TouchableOpacity
                      style={styles.manualJoinBtn}
                      onPress={handleAddRoommate}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.manualJoinBtnText}>Añadir</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Simulador instantáneo para probar la experiencia multi-usuario */}
                <TouchableOpacity
                  style={styles.simulateColmenaBtn}
                  onPress={handleSimulateRoommateCare}
                  activeOpacity={0.85}
                >
                  <TreegohIcon name="riego_hidratacion" size={16} color="#86EFAC" glow={false} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.simulateColmenaBtnTitle}>
                      Probar riego de conviviente en vivo
                    </Text>
                    <Text style={styles.simulateColmenaBtnSub}>
                      Simula que tu compañero riega ahora mismo una planta y activa el escudo
                      Anti-Sobre-Riego de 18 horas.
                    </Text>
                  </View>
                  <TreegohIcon name="flecha_adelante" size={14} color="#86EFAC" glow={false} />
                </TouchableOpacity>
              </View>
            )}

            {/* ============================================================
                PESTAÑA 3: ESCUDO ANTI-SOBRE-RIEGO Y BITÁCORA EN VIVO
               ============================================================ */}
            {activeTab === 'bitacora' && (
              <View style={styles.sectionBlock}>
                <Text style={styles.subSectionHeader}>
                  Escudo Biológico Anti-Sobre-Riego (18 h)
                </Text>

                {protectedPlants.length === 0 ? (
                  <View style={styles.emptyShieldCard}>
                    <TreegohIcon name="escudo_fitosanitario" size={20} color="#93C5FD" glow={false} />
                    <Text style={styles.emptyShieldTitle}>
                      Ninguna planta en bloqueo temporal ahora mismo
                    </Text>
                    <Text style={styles.emptyShieldSub}>
                      Cuando cualquier miembro de la Colmena riegue una planta, aparecerá aquí
                      protegida durante 18 horas para evitar que otro conviviente vuelva a regarla.
                    </Text>
                  </View>
                ) : (
                  protectedPlants.map(({ plant, cooldown }) => (
                    <View key={`prot_${plant.id}`} style={styles.protectedPlantCard}>
                      <View style={styles.protectedTopRow}>
                        <View style={styles.protectedBadge}>
                          <TreegohIcon
                            name="escudo_fitosanitario"
                            size={12}
                            color="#08120C"
                            glow={false}
                          />
                          <Text style={styles.protectedBadgeText}>
                            Protegida ({cooldown.hoursRemaining} h restantes)
                          </Text>
                        </View>
                        <Text style={styles.protectedSpaceText}>{plant.spaceName}</Text>
                      </View>
                      <Text style={styles.protectedPlantName}>
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

                <Text style={[styles.subSectionHeader, { marginTop: 12 }]}>
                  Bitácora de Cuidados de la Colmena
                </Text>

                {!colmenaState?.careLogs || colmenaState.careLogs.length === 0 ? (
                  <View style={styles.emptyShieldCard}>
                    <TreegohIcon name="historial_clinico" size={20} color="#E6E8C4" glow={false} />
                    <Text style={styles.emptyShieldTitle}>Bitácora lista para estrenar</Text>
                    <Text style={styles.emptyShieldSub}>
                      Cada vez que tú o tus convivientes completéis un riego, abono o limpieza
                      foliar, quedará registrado aquí con hora y autor.
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
                            size={14}
                            color="#86EFAC"
                            glow={false}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.logTitleText}>
                            {log.performedByUserName} · {log.actionLabel}
                          </Text>
                          <Text style={styles.logSubText}>
                            {log.plantName} ({log.spaceName}) · {timeStr} h
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            <View style={{ height: 36 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export const SanctuaryOpticalSeedModal = React.memo(SanctuaryOpticalSeedModalComponent);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    flex: 1,
    backgroundColor: '#09120D',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flex: 1,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(134, 239, 172, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.28)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  headerPillText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: '#86EFAC',
    letterSpacing: 0.4,
  },
  modalTitle: {
    fontFamily: Fonts.light,
    fontSize: 22,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsBar: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingVertical: 12,
    gap: 8,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  tabPillActive: {
    backgroundColor: '#86EFAC',
    borderColor: '#86EFAC',
  },
  tabPillText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.78)',
  },
  tabPillTextActive: {
    fontFamily: Fonts.regular,
    color: '#08120C',
  },
  statusBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 22,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(134, 239, 172, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.35)',
  },
  statusBannerText: {
    flex: 1,
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: '#E6E8C4',
    lineHeight: 17,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 6,
  },
  sectionBlock: {
    gap: 16,
  },
  opticalSeedStageCard: {
    backgroundColor: 'rgba(16, 29, 21, 0.88)',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.24)',
    alignItems: 'center',
  },
  stageCardEyebrow: {
    fontFamily: Fonts.regular,
    fontSize: 10.5,
    color: '#86EFAC',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  stageCardTitle: {
    fontFamily: Fonts.light,
    fontSize: 21,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  stageCardMeta: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: 'rgba(230, 232, 196, 0.72)',
    marginTop: 2,
    marginBottom: 18,
  },
  qrOrbContainer: {
    width: 244,
    height: 244,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  qrBioluminescentHalo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 42,
    backgroundColor: 'rgba(134, 239, 172, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(134, 239, 172, 0.42)',
  },
  qrInnerFrame: {
    padding: 8,
    borderRadius: 30,
    backgroundColor: '#07120C',
    borderWidth: 1,
    borderColor: 'rgba(230, 232, 196, 0.25)',
  },
  seedCodeBadge: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(230, 232, 196, 0.24)',
    alignItems: 'center',
  },
  seedCodeLabel: {
    fontFamily: Fonts.light,
    fontSize: 9.5,
    color: 'rgba(230, 232, 196, 0.65)',
    letterSpacing: 1.2,
  },
  seedCodeValue: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    color: '#E6E8C4',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  seedInstructionText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.68)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 14,
    marginBottom: 18,
  },
  seedButtonsRow: {
    width: '100%',
    gap: 10,
  },
  scanSeedPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#86EFAC',
    paddingVertical: 14,
    borderRadius: 20,
  },
  scanSeedPrimaryBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#08120C',
  },
  shareSeedSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(230, 232, 196, 0.24)',
    paddingVertical: 12,
    borderRadius: 20,
  },
  shareSeedSecondaryBtnText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    color: '#E6E8C4',
  },
  manualCodeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 8,
  },
  manualCodeTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  manualCodeSub: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.62)',
    lineHeight: 17,
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  manualTextInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#FFFFFF',
  },
  manualJoinBtn: {
    backgroundColor: '#E6E8C4',
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualJoinBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    color: '#08120C',
  },
  colmenaPhilosophyCard: {
    backgroundColor: 'rgba(134, 239, 172, 0.08)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.26)',
    gap: 8,
  },
  philosophyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  philosophyTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    color: '#86EFAC',
  },
  philosophyBody: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.78)',
    lineHeight: 18,
  },
  subSectionHeader: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#E6E8C4',
    letterSpacing: 0.2,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  memberAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarInitials: {
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  memberInfoCol: {
    flex: 1,
    gap: 3,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberNameText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: '#FFFFFF',
  },
  roleBadge: {
    backgroundColor: 'rgba(230, 232, 196, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    color: '#E6E8C4',
  },
  memberStatsText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.62)',
  },
  removeMemberBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulateColmenaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(134, 239, 172, 0.11)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.34)',
  },
  simulateColmenaBtnTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#86EFAC',
  },
  simulateColmenaBtnSub: {
    fontFamily: Fonts.light,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.68)',
    marginTop: 2,
    lineHeight: 16,
  },
  emptyShieldCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    gap: 8,
  },
  emptyShieldTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptyShieldSub: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.62)',
    textAlign: 'center',
    lineHeight: 18,
  },
  protectedPlantCard: {
    backgroundColor: 'rgba(134, 239, 172, 0.09)',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.32)',
    gap: 5,
  },
  protectedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#86EFAC',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  protectedBadgeText: {
    fontFamily: Fonts.regular,
    fontSize: 10.5,
    color: '#08120C',
  },
  protectedSpaceText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    color: 'rgba(230, 232, 196, 0.78)',
  },
  protectedPlantName: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 2,
  },
  protectedMetaText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  protectedAuthorHighlight: {
    fontFamily: Fonts.regular,
    color: '#86EFAC',
  },
  logItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  logIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(134, 239, 172, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTitleText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  logSubText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.60)',
    marginTop: 2,
  },
});
