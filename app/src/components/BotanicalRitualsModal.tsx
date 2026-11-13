/**
 * Botanical Rituals & Alarms Modal — Treegoh Sanctuary Engine
 * 
 * Hub interactivo de recordatorios dinámicos estilo Duolingo, racha botánica,
 * gestión de tareas fenológicas (riego, fertilización, trasplante, limpieza foliar)
 * y configuración de alarmas circadianas de iOS.
 * 
 * Cumplimiento estricto:
 * - Cero emojis en todos los textos e interfaces.
 * - Tipografía institucional Fonts.light (300) y Fonts.regular (400).
 * - Feedback háptico refinado en cada acción.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Fonts, Colors } from '../constants/theme';
import { TreegohIcon, IconName } from './TreegohIcon';
import { UserPlant } from '../types/plant';
import {
  BotanicalTask,
  BotanicalRitualType,
  CareStreakData,
  generateBotanicalTasks,
  getCareStreak,
  recordRitualCompletion,
  getDuolingoSanctuaryMessage,
  applyWateringRitual,
  applyFertilizationRitual,
  applyRepottingRitual,
  applyFoliarCleaningRitual,
} from '../services/reminderService';
import {
  getIOSAlarms,
  updateIOSAlarm,
  testTriggerImmediateAlarm,
  IOSAlarmConfig,
} from '../services/iosNotificationAlarmService';
import {
  getCurrentAppIcon,
  setAppIcon,
  syncAppIconWithSanctuary,
  AppIconState,
} from '../services/appIconService';
import { syncSanctuaryWidgetData } from '../services/widgetBridgeService';

interface BotanicalRitualsModalProps {
  visible: boolean;
  onClose: () => void;
  plantsBySpace: Record<string, UserPlant[]>;
  onUpdatePlantsBySpace: (updated: Record<string, UserPlant[]>) => void;
  sanctuaryName?: string;
  weather?: { temperature: number; condition: string };
}

type TabType = 'todos' | 'riego' | 'fertilizacion' | 'trasplante' | 'limpieza_foliar';

export const BotanicalRitualsModal: React.FC<BotanicalRitualsModalProps> = ({
  visible,
  onClose,
  plantsBySpace,
  onUpdatePlantsBySpace,
  sanctuaryName = 'Mi Santuario',
  weather,
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('todos');
  const [streakData, setStreakData] = useState<CareStreakData | null>(null);
  const [iosAlarms, setIosAlarms] = useState<IOSAlarmConfig[]>([]);
  const [currentIcon, setCurrentIcon] = useState<AppIconState>('default');
  const [autoIconEnabled, setAutoIconEnabled] = useState(true);


  // Lista plana de todas las plantas
  const allPlants: UserPlant[] = useMemo(() => {
    return Object.values(plantsBySpace || {}).flat();
  }, [plantsBySpace]);

  // Tareas botánicas calculadas
  const tasks: BotanicalTask[] = useMemo(() => {
    return generateBotanicalTasks(allPlants);
  }, [allPlants]);

  // Mensaje Duolingo dinámico
  const duoMessage = useMemo(() => {
    return getDuolingoSanctuaryMessage(
      allPlants,
      streakData || {
        currentStreak: 1,
        bestStreak: 1,
        lastActiveDate: '',
        totalRitualsCompleted: 0,
        levelTitle: 'Brote Primerizo',
        streakShieldAvailable: true,
      }
    );
  }, [allPlants, streakData]);

  // Carga inicial de datos
  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    (async () => {
      const streak = await getCareStreak();
      const alarms = await getIOSAlarms();
      const icon = await getCurrentAppIcon();

      if (isMounted) {
        setStreakData(streak);
        setIosAlarms(alarms);
        setCurrentIcon(icon);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Filtrado por categoría
  const filteredTasks = useMemo(() => {
    if (activeTab === 'todos') return tasks;
    return tasks.filter(t => t.type === activeTab);
  }, [tasks, activeTab]);

  const triggerHaptic = (heavy = false) => {
    try {
      if (Platform.OS !== 'web') {
        if (heavy) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (_e) {}
  };

  // Completar un ritual
  const handleCompleteTask = async (task: BotanicalTask) => {
    triggerHaptic(true);

    const updatedPlantsBySpace: Record<string, UserPlant[]> = {};
    Object.keys(plantsBySpace).forEach(spKey => {
      updatedPlantsBySpace[spKey] = (plantsBySpace[spKey] || []).map(p => {
        if (p.id !== task.plantId) return p;

        if (task.type === 'riego') return applyWateringRitual(p);
        if (task.type === 'fertilizacion') return applyFertilizationRitual(p);
        if (task.type === 'trasplante') return applyRepottingRitual(p);
        if (task.type === 'limpieza_foliar') return applyFoliarCleaningRitual(p);
        return p;
      });
    });

    onUpdatePlantsBySpace(updatedPlantsBySpace);

    // Actualizar racha
    const newStreak = await recordRitualCompletion(task.plantId, task.type);
    setStreakData(newStreak);

    // Sincronizar widgets nativos de iOS y almacenamiento
    const updatedFlat = Object.values(updatedPlantsBySpace).flat();
    await syncSanctuaryWidgetData(updatedFlat, newStreak, sanctuaryName, weather);

    // Sincronizar icono dinámico si está activo
    if (autoIconEnabled) {
      const newIcon = await syncAppIconWithSanctuary(updatedFlat, newStreak.currentStreak);
      setCurrentIcon(newIcon);
    }
  };

  // Posponer una tarea 24 horas
  const handlePostponeTask = (task: BotanicalTask) => {
    triggerHaptic(false);

    const updatedPlantsBySpace: Record<string, UserPlant[]> = {};
    Object.keys(plantsBySpace).forEach(spKey => {
      updatedPlantsBySpace[spKey] = (plantsBySpace[spKey] || []).map(p => {
        if (p.id !== task.plantId) return p;
        if (task.type === 'riego') {
          return {
            ...p,
            daysUntilNextWatering: Math.max(1, p.daysUntilNextWatering + 1),
          };
        }
        return p;
      });
    });

    onUpdatePlantsBySpace(updatedPlantsBySpace);
  };

  // Conmutar alarma de iOS
  const handleToggleAlarm = async (alarmId: string, enabled: boolean) => {
    triggerHaptic(false);
    const updated = await updateIOSAlarm(alarmId, { enabled });
    setIosAlarms(updated);
  };

  // Probar alarma inmediata
  const handleTestAlarm = async (alarm: IOSAlarmConfig) => {
    triggerHaptic(true);
    await testTriggerImmediateAlarm(alarm);
  };

  // Cambiar icono manualmente
  const handleSelectIcon = async (icon: AppIconState) => {
    triggerHaptic(false);
    await setAppIcon(icon);
    setCurrentIcon(icon);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={Platform.OS === 'ios' ? 70 : 100} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={[styles.modalSheet, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerPill}>
                <TreegohIcon name="calendario_agenda" size={13} color="#E6E8C4" glow={false} />
                <Text style={styles.headerPillText}>Rituales y Alarmas</Text>
              </View>
              <Text style={styles.modalTitle}>Santuario en Sincronía</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <TreegohIcon name="flecha_volver" size={18} color="#FFFFFF" glow={false} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Tarjeta Racha Duolingo */}
            <View style={styles.streakCard}>
              <View style={styles.streakTopRow}>
                <View style={styles.streakLeft}>
                  <View style={styles.streakBadge}>
                    <TreegohIcon name="check_verificado" size={14} color="#86EFAC" glow={false} />
                    <Text style={styles.streakCountText}>
                      {streakData?.currentStreak || 1} {streakData?.currentStreak === 1 ? 'día' : 'días'}
                    </Text>
                  </View>
                  <Text style={styles.streakLevelText}>{streakData?.levelTitle || 'Brote Primerizo'}</Text>
                </View>

                {streakData?.streakShieldAvailable && (
                  <View style={styles.shieldPill}>
                    <TreegohIcon name="escudo_fitosanitario" size={11} color="#93C5FD" glow={false} />
                    <Text style={styles.shieldText}>Escudo activo</Text>
                  </View>
                )}
              </View>

              {/* Mensaje Duolingo */}
              <View style={styles.duoMessageBlock}>
                <Text style={styles.duoTitleText}>{duoMessage.title}</Text>
                <Text style={styles.duoBodyText}>{duoMessage.message}</Text>
                <Text style={styles.duoEmphasisText}>{duoMessage.streakEmphasis}</Text>
              </View>
            </View>

            {/* 2. Filtros de Rituales */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsScroll}
              contentContainerStyle={styles.tabsTrack}
            >
              {[
                { id: 'todos', label: 'Todos', icon: 'calendario_agenda' as IconName },
                { id: 'riego', label: 'Riego', icon: 'riego_hidratacion' as IconName },
                { id: 'fertilizacion', label: 'Nutrición', icon: 'fertilizante_nutricion' as IconName },
                { id: 'trasplante', label: 'Maceta', icon: 'maceta_trasplante' as IconName },
                { id: 'limpieza_foliar', label: 'Estomas', icon: 'limpieza_foliar' as IconName },
              ].map(tab => {
                const isSel = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tabChip, isSel && styles.tabChipActive]}
                    onPress={() => {
                      triggerHaptic(false);
                      setActiveTab(tab.id as TabType);
                    }}
                    activeOpacity={0.8}
                  >
                    <TreegohIcon
                      name={tab.icon}
                      size={12}
                      color={isSel ? '#0B130E' : '#E6E8C4'}
                      glow={false}
                    />
                    <Text style={[styles.tabChipText, isSel && styles.tabChipTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 3. Lista de Tareas */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Rituales pendientes ({filteredTasks.length})
              </Text>
            </View>

            {filteredTasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <TreegohIcon name="check_verificado" size={24} color="#86EFAC" glow={false} />
                <Text style={styles.emptyTitle}>Santuario al día</Text>
                <Text style={styles.emptySubtitle}>
                  No hay rituales de esta categoría pendientes. Tus especies se encuentran en equilibrio.
                </Text>
              </View>
            ) : (
              filteredTasks.map(task => {
                const isUrgent = task.urgency === 'urgente';
                const isAttention = task.urgency === 'atencion';

                const iconName: IconName =
                  task.type === 'riego'
                    ? 'riego_hidratacion'
                    : task.type === 'fertilizacion'
                    ? 'fertilizante_nutricion'
                    : task.type === 'trasplante'
                    ? 'maceta_trasplante'
                    : 'limpieza_foliar';

                return (
                  <View key={task.id} style={styles.taskCard}>
                    <View style={styles.taskCardHeader}>
                      {task.plantImageUrl ? (
                        <Image source={{ uri: task.plantImageUrl }} style={styles.taskPlantThumb} />
                      ) : (
                        <View style={styles.taskThumbPlaceholder}>
                          <TreegohIcon name={iconName} size={16} color="#E6E8C4" glow={false} />
                        </View>
                      )}

                      <View style={styles.taskMetaCol}>
                        <View style={styles.taskTagRow}>
                          <Text style={styles.taskSpaceTag}>{task.spaceName}</Text>
                          <View
                            style={[
                              styles.urgencyPill,
                              isUrgent
                                ? styles.urgencyPillUrgent
                                : isAttention
                                ? styles.urgencyPillAttention
                                : styles.urgencyPillOptimo,
                            ]}
                          >
                            <Text
                              style={[
                                styles.urgencyPillText,
                                isUrgent
                                  ? styles.urgencyTextUrgent
                                  : isAttention
                                  ? styles.urgencyTextAttention
                                  : styles.urgencyTextOptimo,
                              ]}
                            >
                              {isUrgent
                                ? 'Urgente hoy'
                                : task.daysRemaining === 1
                                ? 'Mañana'
                                : `En ${task.daysRemaining} días`}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.taskPlantName} numberOfLines={1}>
                          {task.plantNickname ? `«${task.plantNickname}» · ${task.plantName}` : task.plantName}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.taskDescription}>{task.description}</Text>

                    <View style={styles.taskActionsRow}>
                      <TouchableOpacity
                        style={styles.postponeBtn}
                        onPress={() => handlePostponeTask(task)}
                        activeOpacity={0.8}
                      >
                        <TreegohIcon name="posponer_snooze" size={13} color="#94A3B8" glow={false} />
                        <Text style={styles.postponeBtnText}>+24h</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.completeBtn}
                        onPress={() => handleCompleteTask(task)}
                        activeOpacity={0.85}
                      >
                        <TreegohIcon name="check_verificado" size={14} color="#0B130E" glow={false} />
                        <Text style={styles.completeBtnText}>{task.actionText}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* 4. Conexión de Alarmas iOS & WidgetKit */}
            <View style={styles.sectionDivider} />

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Alarmas Circadianas (iOS & Notificaciones)</Text>
            </View>

            <View style={styles.alarmsContainer}>
              {iosAlarms.map(alarm => (
                <View key={alarm.id} style={styles.alarmRow}>
                  <View style={styles.alarmInfoCol}>
                    <Text style={styles.alarmTitle}>{alarm.title}</Text>
                    <Text style={styles.alarmTimeText}>
                      Programada a las {String(alarm.timeHour).padStart(2, '0')}:
                      {String(alarm.timeMinute).padStart(2, '0')} h
                    </Text>
                    <Text style={styles.alarmBodyText}>{alarm.body}</Text>
                  </View>

                  <View style={styles.alarmControlCol}>
                    <Switch
                      value={alarm.enabled}
                      onValueChange={val => handleToggleAlarm(alarm.id, val)}
                      trackColor={{ false: '#334155', true: '#86EFAC' }}
                      thumbColor={alarm.enabled ? '#0B130E' : '#94A3B8'}
                    />
                    <TouchableOpacity
                      style={styles.testAlarmBtn}
                      onPress={() => handleTestAlarm(alarm)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.testAlarmBtnText}>Probar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* 5. Icono Dinámico de la App & Favicon */}
            <View style={styles.sectionDivider} />

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Icono Dinámico de la App y Favicon</Text>
            </View>

            <View style={styles.iconCard}>
              <Text style={styles.iconCardSubtitle}>
                Treegoh adapta sutilmente el icono de tu pantalla de inicio y favicon según el estado hídrico de tus plantas:
              </Text>

              <View style={styles.iconOptionsRow}>
                {[
                  { id: 'default', label: 'Equilibrio', desc: 'Verde Salvia #E6E8C4' },
                  { id: 'thirsty', label: 'Sedienta', desc: 'Alerta ámbar/terracota' },
                  { id: 'blooming', label: 'Floreciente', desc: 'Aura esmeralda racha' },
                ].map(opt => {
                  const isCur = currentIcon === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.iconOptionItem, isCur && styles.iconOptionItemActive]}
                      onPress={() => handleSelectIcon(opt.id as AppIconState)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.iconPreviewBox,
                          opt.id === 'thirsty'
                            ? styles.iconPreviewThirsty
                            : opt.id === 'blooming'
                            ? styles.iconPreviewBlooming
                            : styles.iconPreviewDefault,
                        ]}
                      >
                        <Text style={styles.iconPreviewWord}>treegöh</Text>
                      </View>
                      <Text style={[styles.iconOptionLabel, isCur && styles.iconOptionLabelActive]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.iconOptionDesc}>{opt.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Espaciador inferior */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    flex: 1,
    backgroundColor: '#0A120D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    backgroundColor: 'rgba(230, 232, 196, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  headerPillText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: '#E6E8C4',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontFamily: Fonts.regular,
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  // Streak Card
  streakCard: {
    backgroundColor: 'rgba(18, 30, 22, 0.85)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.2)',
    marginBottom: 20,
  },
  streakTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(134, 239, 172, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  streakCountText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '600',
    color: '#86EFAC',
  },
  streakLevelText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  shieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(147, 197, 253, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  shieldText: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: '#93C5FD',
  },
  duoMessageBlock: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  duoTitleText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  duoBodyText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    marginBottom: 6,
  },
  duoEmphasisText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: '#86EFAC',
    letterSpacing: 0.3,
  },
  // Tabs
  tabsScroll: {
    marginBottom: 16,
  },
  tabsTrack: {
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabChipActive: {
    backgroundColor: '#E6E8C4',
    borderColor: '#E6E8C4',
  },
  tabChipText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#E6E8C4',
  },
  tabChipTextActive: {
    color: '#0B130E',
    fontWeight: '600',
  },
  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '600',
    color: '#E6E8C4',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Empty
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: Fonts.light,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 17,
  },
  // Task Card
  taskCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  taskPlantThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  taskThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskMetaCol: {
    flex: 1,
  },
  taskTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  taskSpaceTag: {
    fontFamily: Fonts.light,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  urgencyPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  urgencyPillUrgent: {
    backgroundColor: 'rgba(248, 113, 113, 0.18)',
  },
  urgencyPillAttention: {
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
  },
  urgencyPillOptimo: {
    backgroundColor: 'rgba(134, 239, 172, 0.18)',
  },
  urgencyPillText: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    fontWeight: '600',
  },
  urgencyTextUrgent: {
    color: '#F87171',
  },
  urgencyTextAttention: {
    color: '#FBBF24',
  },
  urgencyTextOptimo: {
    color: '#86EFAC',
  },
  taskPlantName: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  taskDescription: {
    fontFamily: Fonts.light,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 17,
    marginBottom: 12,
  },
  taskActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  postponeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  postponeBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: '#94A3B8',
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#86EFAC',
  },
  completeBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    color: '#0B130E',
  },
  // Section Divider
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 20,
  },
  // Alarms
  alarmsContainer: {
    gap: 12,
  },
  alarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  alarmInfoCol: {
    flex: 1,
    paddingRight: 12,
  },
  alarmTitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  alarmTimeText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: '#86EFAC',
    marginBottom: 4,
  },
  alarmBodyText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 15,
  },
  alarmControlCol: {
    alignItems: 'center',
    gap: 8,
  },
  testAlarmBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  testAlarmBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: '#E6E8C4',
  },
  // Icon Card
  iconCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  iconCardSubtitle: {
    fontFamily: Fonts.light,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 17,
    marginBottom: 14,
  },
  iconOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconOptionItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconOptionItemActive: {
    backgroundColor: 'rgba(230, 232, 196, 0.08)',
    borderColor: '#E6E8C4',
  },
  iconPreviewBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconPreviewDefault: {
    backgroundColor: '#E6E8C4',
  },
  iconPreviewThirsty: {
    backgroundColor: '#E8D3C4',
  },
  iconPreviewBlooming: {
    backgroundColor: '#D8ECD0',
  },
  iconPreviewWord: {
    fontFamily: Fonts.regular,
    fontSize: 9,
    fontWeight: '600',
    color: '#1A2E1A',
  },
  iconOptionLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  iconOptionLabelActive: {
    color: '#E6E8C4',
  },
  iconOptionDesc: {
    fontFamily: Fonts.light,
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});

