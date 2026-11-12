/**
 * Plant Detail Modal — Centro de Historia Clínica de la Especie — Treegoh
 * 
 * Centro integral de seguimiento botánico e historia clínica de la planta:
 * - Corrección de especie si la IA se equivocó (búsqueda en catálogo oficial de 173+ especies).
 * - Bitácora clínica de fechas clave: Fecha de compra/adopción, último riego,
 *   última fertilización, último trasplante y sustrato, limpieza foliar de estomas.
 * - Gestión fotográfica: Actualizar foto con cámara/galería o seleccionar automáticamente
 *   la fotografía botánica oficial del catálogo.
 * - Registro cronológico de intervenciones (clinical log) y galería evolutiva.
 * 
 * Reglas de diseño:
 * - Cero emojis en todos los textos e interfaz.
 * - Tipografía institucional Fonts.light (300) y Fonts.regular (400).
 * - Feedback háptico en cada acción clínica.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Fonts } from '../constants/theme';
import { TreegohIcon, IconName } from './TreegohIcon';
import { GlassCardSheen } from './BlobAnimatedCard';
import { BotanicalImage } from './BotanicalImage';
import { UserPlant, PlantClinicalEvent, PlantClinicalEventType } from '../types/plant';
import { BOTANICAL_DATABASE, ComprehensiveSpecies } from '../constants/botanicalDatabase';

interface PlantDetailModalProps {
  plant: UserPlant | null;
  spaceLux?: number;
  onClose: () => void;
  onWaterPlant: (plantId: string) => void;
  onDeletePlant: (plantId: string) => void;
  onUpdatePlant?: (updatedPlant: UserPlant) => void;
  onReScanPlantWithCamera?: (plant: UserPlant) => void;
  onOpenScientificMonograph?: (plant: UserPlant) => void;
  onRelocatePlant?: (plant: UserPlant) => void;
}

type ClinicalTab = 'historia' | 'cuidados' | 'bitacora';

export const PlantDetailModal: React.FC<PlantDetailModalProps> = ({
  plant,
  spaceLux = 3200,
  onClose,
  onWaterPlant,
  onDeletePlant,
  onUpdatePlant,
  onReScanPlantWithCamera,
  onOpenScientificMonograph,
  onRelocatePlant,
}) => {
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 28 : 16);
  const isVisible = Boolean(plant);

  // Pestaña activa del centro clínico
  const [activeTab, setActiveTab] = useState<ClinicalTab>('historia');

  // Modales secundarios de interacción clínica
  const [isCorrectSpeciesOpen, setIsCorrectSpeciesOpen] = useState(false);
  const [speciesSearchQuery, setSpeciesSearchQuery] = useState('');
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [isNicknameEditing, setIsNicknameEditing] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [isRepotModalOpen, setIsRepotModalOpen] = useState(false);
  const [isDatePickModalOpen, setIsDatePickModalOpen] = useState(false);
  const [datePickTarget, setDatePickTarget] = useState<'compra' | 'riego' | 'fertilizacion' | null>(null);
  const [newClinicalNote, setNewClinicalNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Inicializar borrador de apodo cuando cambia la planta
  useEffect(() => {
    if (plant) {
      setNicknameDraft(plant.nickname || '');
    }
  }, [plant?.id]);

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

  // Especies filtradas para el modal de corrección de especie
  const matchingSpecies = useMemo(() => {
    const q = speciesSearchQuery.trim().toLowerCase();
    if (!q) return BOTANICAL_DATABASE.slice(0, 30);
    return BOTANICAL_DATABASE.filter(
      sp =>
        sp.commonName.toLowerCase().includes(q) ||
        sp.scientificName.toLowerCase().includes(q) ||
        sp.family.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [speciesSearchQuery]);

  if (!plant) return null;

  // Helper para guardar cambios en la planta
  const savePlantUpdates = (updates: Partial<UserPlant>, logEvent?: { type: PlantClinicalEventType; title: string; notes?: string }) => {
    let nextEvents = [...(plant.clinicalLog || [])];
    if (logEvent) {
      const event: PlantClinicalEvent = {
        id: `event_${Date.now()}`,
        type: logEvent.type,
        date: new Date().toISOString(),
        title: logEvent.title,
        notes: logEvent.notes,
      };
      nextEvents.unshift(event);
    }

    const updated: UserPlant = {
      ...plant,
      ...updates,
      clinicalLog: nextEvents,
    };

    onUpdatePlant?.(updated);
  };

  // 1. CORREGIR ESPECIE SI LA IA SE EQUIVOCÓ
  const handleSelectCorrectSpecies = (species: ComprehensiveSpecies) => {
    triggerHaptic(true);

    const oldName = plant.commonName;
    const newName = species.commonName;

    // Preguntar al usuario si también desea actualizar la foto con la oficial del catálogo
    Alert.alert(
      'Corregir Especie Botánica',
      `¿Deseas cambiar la especie de «${oldName}» a «${newName}» (${species.scientificName})?\n\nPuedes conservar tu foto actual o usar la imagen oficial del catálogo.`,
      [
        {
          text: 'Conservar mi foto',
          onPress: () => {
            applySpeciesCorrection(species, plant.imageUrl);
          },
        },
        {
          text: 'Usar foto oficial',
          onPress: () => {
            applySpeciesCorrection(species, species.imageUrl);
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const applySpeciesCorrection = (species: ComprehensiveSpecies, resolvedImageUrl: string) => {
    savePlantUpdates(
      {
        commonName: species.commonName,
        scientificName: species.scientificName,
        family: species.family,
        estimatedLuxDemand: species.minLux,
        isPetSafe: species.isPetSafe,
        toxicityNote: species.toxicityDetail,
        trait: species.trait,
        imageUrl: resolvedImageUrl,
        lightCompatibility: spaceLux >= species.minLux && spaceLux <= species.maxLux * 1.3 ? 'optima' : 'buena',
      },
      {
        type: 'correccion_especie',
        title: `Especie corregida: ${species.commonName}`,
        notes: `Identificación actualizada a ${species.scientificName} (${species.family}). Requisitos lumínicos: ${species.minLux}–${species.maxLux} lx.`,
      }
    );

    setIsCorrectSpeciesOpen(false);
    setSpeciesSearchQuery('');
  };

  // 2. GESTIÓN FOTOGRÁFICA
  const handlePickFromCamera = async () => {
    setIsPhotoMenuOpen(false);
    try {
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: Platform.OS === 'android',
        aspect: [4, 3],
        quality: 0.75,
      });

      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        triggerHaptic(true);
        const newUri = res.assets[0].uri;
        const currentGallery = plant.photoGallery || [];
        const nextGallery = plant.imageUrl ? [plant.imageUrl, ...currentGallery] : currentGallery;

        savePlantUpdates(
          {
            imageUrl: newUri,
            photoGallery: nextGallery.slice(0, 12),
          },
          {
            type: 'foto',
            title: 'Fotografía actualizada desde cámara',
            notes: 'Nuevo registro fotográfico del estado foliar de la planta.',
          }
        );
      }
    } catch (_e) {}
  };

  const handlePickFromGallery = async () => {
    setIsPhotoMenuOpen(false);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: Platform.OS === 'android',
        aspect: [4, 3],
        quality: 0.75,
      });

      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        triggerHaptic(true);
        const newUri = res.assets[0].uri;
        const currentGallery = plant.photoGallery || [];
        const nextGallery = plant.imageUrl ? [plant.imageUrl, ...currentGallery] : currentGallery;

        savePlantUpdates(
          {
            imageUrl: newUri,
            photoGallery: nextGallery.slice(0, 12),
          },
          {
            type: 'foto',
            title: 'Fotografía actualizada desde galería',
            notes: 'Imagen renovada en el santuario.',
          }
        );
      }
    } catch (_e) {}
  };

  const handleApplyOfficialPhoto = () => {
    setIsPhotoMenuOpen(false);
    triggerHaptic(true);

    const officialMatch = BOTANICAL_DATABASE.find(
      b =>
        b.scientificName.toLowerCase() === plant.scientificName.toLowerCase() ||
        b.commonName.toLowerCase() === plant.commonName.toLowerCase()
    );

    if (officialMatch?.imageUrl) {
      const currentGallery = plant.photoGallery || [];
      const nextGallery = plant.imageUrl ? [plant.imageUrl, ...currentGallery] : currentGallery;

      savePlantUpdates(
        {
          imageUrl: officialMatch.imageUrl,
          photoGallery: nextGallery.slice(0, 12),
        },
        {
          type: 'foto',
          title: 'Fotografía oficial del catálogo aplicada',
          notes: `Imagen de alta resolución oficial de ${officialMatch.scientificName}.`,
        }
      );
    } else {
      Alert.alert('Fotografía de Catálogo', 'Esta especie ya utiliza la fotografía oficial del repositorio botánico.');
    }
  };

  // 3. REGISTROS RÁPIDOS DE FECHAS CLAVE
  const handleLogWateringNow = () => {
    triggerHaptic(true);
    onWaterPlant(plant.id);
    savePlantUpdates(
      {
        wateringStatus: 'hidratada',
        daysUntilNextWatering: 7,
        lastWateredDate: new Date().toISOString(),
      },
      {
        type: 'riego',
        title: 'Riego hidrodinámico completado',
        notes: 'Sustrato humedecido uniformemente. Drenaje capilar verificado.',
      }
    );
  };

  const handleLogFertilizationNow = () => {
    triggerHaptic(true);
    savePlantUpdates(
      {
        needsFertilization: false,
        daysUntilNextFertilization: 21,
        lastFertilizedDate: new Date().toISOString(),
      },
      {
        type: 'fertilizacion',
        title: 'Nutrición mineral aplicada',
        notes: 'Aporte de fertilizante equilibrado con microelementos.',
      }
    );
  };

  const handleLogFoliarCleaningNow = () => {
    triggerHaptic(true);
    savePlantUpdates(
      {
        needsCleaning: false,
        daysUntilNextCleaning: 28,
        lastCleanedDate: new Date().toISOString(),
      },
      {
        type: 'limpieza',
        title: 'Higiene de estomas realizada',
        notes: 'Retirada de polvo del haz foliar con paño húmedo. Fotosíntesis optimizada.',
      }
    );
  };

  // 4. REGISTRAR TRASPLANTE
  const handleApplyRepot = (diameterCm: number, substrate: string) => {
    triggerHaptic(true);
    savePlantUpdates(
      {
        needsRepotting: false,
        lastRepottedDate: new Date().toISOString(),
        potDiameterCm: diameterCm,
        substrateType: substrate,
      },
      {
        type: 'trasplante',
        title: `Trasplante a maceta de ${diameterCm} cm`,
        notes: `Cepellón aireado y renovación con ${substrate}.`,
      }
    );
    setIsRepotModalOpen(false);
  };

  // 5. ASIGNAR FECHA DE COMPRA / ADOPCIÓN
  const handleSetPurchasedRelative = (daysAgo: number, label: string) => {
    triggerHaptic(true);
    const dateObj = new Date(Date.now() - daysAgo * 86400000);
    const isoDate = dateObj.toISOString();

    if (datePickTarget === 'compra') {
      savePlantUpdates(
        { purchasedAt: isoDate },
        {
          type: 'adopcion',
          title: `Fecha de adquisición registrada (${label})`,
          notes: `Planta adoptada formalmente en el santuario.`,
        }
      );
    } else if (datePickTarget === 'riego') {
      savePlantUpdates(
        { lastWateredDate: isoDate, daysUntilNextWatering: Math.max(0, 7 - daysAgo) },
        {
          type: 'riego',
          title: `Riego anterior registrado (${label})`,
        }
      );
    } else if (datePickTarget === 'fertilizacion') {
      savePlantUpdates(
        { lastFertilizedDate: isoDate, daysUntilNextFertilization: Math.max(0, 21 - daysAgo) },
        {
          type: 'fertilizacion',
          title: `Fertilización anterior registrada (${label})`,
        }
      );
    }

    setIsDatePickModalOpen(false);
    setDatePickTarget(null);
  };

  // 6. GUARDAR APODO
  const handleSaveNickname = () => {
    triggerHaptic(false);
    const trimmed = nicknameDraft.trim();
    savePlantUpdates({ nickname: trimmed || undefined });
    setIsNicknameEditing(false);
  };

  // 7. AÑADIR NOTA CLÍNICA
  const handleAddCustomNote = () => {
    if (!newClinicalNote.trim()) return;
    triggerHaptic(true);
    savePlantUpdates(
      {},
      {
        type: 'diagnostico',
        title: 'Anotación clínica botánica',
        notes: newClinicalNote.trim(),
      }
    );
    setNewClinicalNote('');
    setIsAddingNote(false);
  };

  // Helpers de fechas
  const formatRelative = (iso?: string) => {
    if (!iso) return 'Sin registrar';
    const target = new Date(iso);
    if (isNaN(target.getTime())) return 'Sin registrar';
    const diffDays = Math.floor((Date.now() - target.getTime()) / 86400000);
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 30) return `Hace ${diffDays} días`;
    if (diffDays < 365) {
      const m = Math.floor(diffDays / 30);
      return `Hace ${m} ${m === 1 ? 'mes' : 'meses'}`;
    }
    const y = Math.floor(diffDays / 365);
    return `Hace ${y} ${y === 1 ? 'año' : 'años'}`;
  };

  const formatShortDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  if (!plant) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheetContainer, { paddingBottom: safeBottom + 16 }]}>
          {/* Indicador de agarre zen */}
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandleBar} />
          </View>

          {/* BARRA SUPERIOR DE ACCIONES */}
          <View style={styles.sheetTopRow}>
            <View style={styles.sheetSpaceTag}>
              <TreegohIcon name="espacios_microclimas" size={14} color="#E6E8C4" glow={false} />
              <Text style={styles.sheetSpaceTagText}>{plant.spaceName}</Text>
            </View>

            <View style={styles.topRightActionsRow}>
              {/* Botón corregir especie rápido */}
              <TouchableOpacity
                style={styles.correctSpeciesQuickBtn}
                onPress={() => {
                  triggerHaptic();
                  setIsCorrectSpeciesOpen(true);
                }}
                activeOpacity={0.8}
              >
                <TreegohIcon name="biblia_plantas" size={13} color="#E6E8C4" glow={false} />
                <Text style={styles.correctSpeciesQuickText}>Corregir especie</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => {
                  triggerHaptic();
                  onClose();
                }}
                activeOpacity={0.75}
              >
                <TreegohIcon name="flecha_volver" size={16} color="#FFFFFF" glow={false} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* HERO CARD: FOTO + IDENTIDAD + ACCIONES FOTOGRÁFICAS */}
            <View style={styles.photoContainer}>
              <BotanicalImage
                uri={plant.imageUrl}
                style={styles.plantHeroImage}
                commonName={plant.commonName}
              />
              <GlassCardSheen />

              {/* Botón flotante para cambiar foto */}
              <TouchableOpacity
                style={styles.changePhotoFloatingBtn}
                onPress={() => {
                  triggerHaptic();
                  setIsPhotoMenuOpen(true);
                }}
                activeOpacity={0.85}
              >
                <TreegohIcon name="camara_diagnostica" size={14} color="#0B130E" glow={false} />
                <Text style={styles.changePhotoFloatingText}>Cambiar foto</Text>
              </TouchableOpacity>

              <View style={styles.photoBottomOverlay}>
                <View style={styles.nameHeaderRow}>
                  <Text style={styles.heroCommonName}>{plant.commonName}</Text>
                </View>

                <Text style={styles.heroScientificName}>
                  {plant.scientificName} {plant.family ? `· ${plant.family}` : ''}
                </Text>

                {/* Apodo editable */}
                {isNicknameEditing ? (
                  <View style={styles.nicknameEditRow}>
                    <TextInput
                      style={styles.nicknameInput}
                      value={nicknameDraft}
                      onChangeText={setNicknameDraft}
                      placeholder="Apodo cariñoso..."
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      autoFocus
                    />
                    <TouchableOpacity style={styles.nicknameSaveBtn} onPress={handleSaveNickname}>
                      <Text style={styles.nicknameSaveText}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.nicknameDisplayRow}
                    onPress={() => setIsNicknameEditing(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.heroNickname}>
                      {plant.nickname ? `«${plant.nickname}»` : 'Añadir apodo a esta planta...'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* BARRA DE PESTAÑAS CLÍNICAS */}
            <View style={styles.clinicalTabsContainer}>
              {[
                { id: 'historia', label: 'Historia Clínica' },
                { id: 'cuidados', label: 'Biometría & Luz' },
                { id: 'bitacora', label: `Bitácora (${(plant.clinicalLog || []).length})` },
              ].map(t => {
                const isSel = activeTab === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.clinicalTabItem, isSel && styles.clinicalTabItemActive]}
                    onPress={() => {
                      triggerHaptic();
                      setActiveTab(t.id as ClinicalTab);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.clinicalTabText, isSel && styles.clinicalTabTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ======================================================== */}
            {/* PESTAÑA 1: HISTORIA CLÍNICA & PARÁMETROS VITALES */}
            {/* ======================================================== */}
            {activeTab === 'historia' && (
              <View style={styles.tabSection}>
                {/* 1.1 Tarjeta Fecha de Adopción / Compra */}
                <View style={styles.clinicalCard}>
                  <GlassCardSheen />
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.iconCircleSmall}>
                      <TreegohIcon name="calendario_agenda" size={17} color="#E6E8C4" glow={false} />
                    </View>
                    <View style={styles.cardTitleCol}>
                      <Text style={styles.cardTitle}>Fecha de Adopción / Compra</Text>
                      <Text style={styles.cardSubTitle}>
                        {plant.purchasedAt
                          ? `${formatShortDate(plant.purchasedAt)} (${formatRelative(plant.purchasedAt)})`
                          : `Registrada el ${formatShortDate(plant.addedAt)}`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={styles.cardSecondaryActionBtn}
                      onPress={() => {
                        triggerHaptic();
                        setDatePickTarget('compra');
                        setIsDatePickModalOpen(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cardSecondaryActionText}>Modificar fecha de compra</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 1.2 Tarjeta Último Riego & Hidratación */}
                <View style={styles.clinicalCard}>
                  <GlassCardSheen />
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.iconCircleSmall, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                      <TreegohIcon name="riego_hidratacion" size={17} color="#38BDF8" glow={false} />
                    </View>
                    <View style={styles.cardTitleCol}>
                      <Text style={styles.cardTitle}>Riego Hidrodinámico</Text>
                      <Text style={styles.cardSubTitle}>
                        Último aporte: {formatRelative(plant.lastWateredDate)} {plant.lastWateredDate ? `· ${formatShortDate(plant.lastWateredDate)}` : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Próximo riego recomendado:</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        plant.daysUntilNextWatering <= 1 ? styles.metricValueUrgent : styles.metricValueOk,
                      ]}
                    >
                      {plant.daysUntilNextWatering <= 0
                        ? 'Urgente hoy'
                        : plant.daysUntilNextWatering === 1
                        ? 'Mañana'
                        : `En ${plant.daysUntilNextWatering} días`}
                    </Text>
                  </View>

                  <View style={styles.cardButtonsDoubleRow}>
                    <TouchableOpacity
                      style={styles.btnLogPrimary}
                      onPress={handleLogWateringNow}
                      activeOpacity={0.85}
                    >
                      <TreegohIcon name="tarea_completada" size={15} color="#0B130E" glow={false} />
                      <Text style={styles.btnLogPrimaryText}>Marcar regada hoy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnLogSecondary}
                      onPress={() => {
                        triggerHaptic();
                        setDatePickTarget('riego');
                        setIsDatePickModalOpen(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.btnLogSecondaryText}>Otra fecha</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 1.3 Tarjeta Nutrición Mineral (Fertilización) */}
                <View style={styles.clinicalCard}>
                  <GlassCardSheen />
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.iconCircleSmall, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                      <TreegohIcon name="fertilizante_nutricion" size={17} color="#FBBF24" glow={false} />
                    </View>
                    <View style={styles.cardTitleCol}>
                      <Text style={styles.cardTitle}>Nutrición Mineral (Fertilizante)</Text>
                      <Text style={styles.cardSubTitle}>
                        Última aplicación: {formatRelative(plant.lastFertilizedDate)} {plant.lastFertilizedDate ? `· ${formatShortDate(plant.lastFertilizedDate)}` : ''}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardDescriptionText}>
                    {plant.fertilizationNote || 'Aplicación quincenal en primavera/verano con microelementos quelatados.'}
                  </Text>

                  <View style={styles.cardButtonsDoubleRow}>
                    <TouchableOpacity
                      style={styles.btnLogPrimary}
                      onPress={handleLogFertilizationNow}
                      activeOpacity={0.85}
                    >
                      <TreegohIcon name="fertilizante_nutricion" size={15} color="#0B130E" glow={false} />
                      <Text style={styles.btnLogPrimaryText}>Fertilizar hoy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnLogSecondary}
                      onPress={() => {
                        triggerHaptic();
                        setDatePickTarget('fertilizacion');
                        setIsDatePickModalOpen(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.btnLogSecondaryText}>Otra fecha</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 1.4 Tarjeta Trasplante & Maceta */}
                <View style={styles.clinicalCard}>
                  <GlassCardSheen />
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.iconCircleSmall, { backgroundColor: 'rgba(230, 232, 196, 0.15)' }]}>
                      <TreegohIcon name="maceta_trasplante" size={17} color="#E6E8C4" glow={false} />
                    </View>
                    <View style={styles.cardTitleCol}>
                      <Text style={styles.cardTitle}>Maceta y Sustrato</Text>
                      <Text style={styles.cardSubTitle}>
                        {plant.potDiameterCm ? `Diámetro: ${plant.potDiameterCm} cm` : 'Diámetro sin registrar'} · {plant.substrateType || 'Sustrato aireado'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardDescriptionText}>
                    Último trasplante: {formatRelative(plant.lastRepottedDate)} {plant.lastRepottedDate ? `· ${formatShortDate(plant.lastRepottedDate)}` : ''}
                  </Text>

                  <TouchableOpacity
                    style={styles.cardSecondaryActionBtn}
                    onPress={() => {
                      triggerHaptic();
                      setIsRepotModalOpen(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <TreegohIcon name="maceta_trasplante" size={14} color="#E6E8C4" glow={false} />
                    <Text style={styles.cardSecondaryActionText}>Registrar trasplante / maceta</Text>
                  </TouchableOpacity>
                </View>

                {/* 1.5 Higiene Foliar y Estomas */}
                <View style={styles.clinicalCard}>
                  <GlassCardSheen />
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.iconCircleSmall, { backgroundColor: 'rgba(134, 239, 172, 0.15)' }]}>
                      <TreegohIcon name="limpieza_foliar" size={17} color="#86EFAC" glow={false} />
                    </View>
                    <View style={styles.cardTitleCol}>
                      <Text style={styles.cardTitle}>Higiene de Estomas</Text>
                      <Text style={styles.cardSubTitle}>
                        Última limpieza foliar: {formatRelative(plant.lastCleanedDate)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.cardSecondaryActionBtn}
                    onPress={handleLogFoliarCleaningNow}
                    activeOpacity={0.8}
                  >
                    <TreegohIcon name="check_verificado" size={14} color="#86EFAC" glow={false} />
                    <Text style={styles.cardSecondaryActionText}>Marcar estomas limpios hoy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ======================================================== */}
            {/* PESTAÑA 2: BIOMETRÍA Y CUIDADOS DEL ESPACIO */}
            {/* ======================================================== */}
            {activeTab === 'cuidados' && (
              <View style={styles.tabSection}>
                {/* 2.1 Compatibilidad Lumínica */}
                <View style={styles.clinicalCard}>
                  <GlassCardSheen />
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.iconCircleSmall}>
                      <TreegohIcon name="luz_natural" size={17} color="#FDE68A" glow={false} />
                    </View>
                    <View style={styles.cardTitleCol}>
                      <Text style={styles.cardTitle}>Biométrica de Luz Natural</Text>
                      <Text style={styles.cardSubTitle}>
                        ~{spaceLux.toLocaleString()} Lux en {plant.spaceName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.badgeRow}>
                    <View style={styles.lightStatusBadge}>
                      <Text style={styles.lightStatusBadgeText}>
                        {plant.lightCompatibility === 'optima'
                          ? 'Luz Óptima'
                          : plant.lightCompatibility === 'buena'
                          ? 'Buena Adaptación'
                          : 'Luz Límite'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardDescriptionText}>
                    {plant.lightCompatibilityNote ||
                      `Esta especie se desarrolla con vitalidad bajo la radiación filtrada de ${plant.spaceName}.`}
                  </Text>
                </View>

                {/* 2.2 Seguridad Doméstica y Mascotas */}
                <View style={styles.clinicalCard}>
                  <GlassCardSheen />
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.iconCircleSmall}>
                      <TreegohIcon name="escudo_fitosanitario" size={17} color="#FFFFFF" glow={false} />
                    </View>
                    <View style={styles.cardTitleCol}>
                      <Text style={styles.cardTitle}>Seguridad y Toxicidad</Text>
                      <Text style={styles.cardSubTitle}>
                        {plant.isPetSafe ? 'Apta para perros y gatos' : 'Precaución con mascotas'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardDescriptionText}>
                    {plant.toxicityNote ||
                      (plant.isPetSafe
                        ? 'Especie certificada no tóxica según la ASPCA.'
                        : 'Contiene compuestos oxálicos o savia irritante. Colocar en maceta elevada.')}
                  </Text>
                </View>

                {/* 2.3 Diagnóstico y Fisiología Visual */}
                {(plant.trait || plant.healthAssessment) && (
                  <View style={styles.clinicalCard}>
                    <GlassCardSheen />
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.iconCircleSmall}>
                        <TreegohIcon name="camara_diagnostica" size={17} color="#93C5FD" glow={false} />
                      </View>
                      <View style={styles.cardTitleCol}>
                        <Text style={styles.cardTitle}>Fisiología & Diagnóstico Visual</Text>
                        <Text style={styles.cardSubTitle}>Evaluación fenológica</Text>
                      </View>
                    </View>

                    {plant.trait ? <Text style={styles.traitCallout}>«{plant.trait}»</Text> : null}
                    {plant.healthAssessment ? (
                      <Text style={styles.cardDescriptionText}>{plant.healthAssessment}</Text>
                    ) : null}

                    {onReScanPlantWithCamera && (
                      <TouchableOpacity
                        style={styles.cardSecondaryActionBtn}
                        onPress={() => {
                          triggerHaptic();
                          onClose();
                          setTimeout(() => {
                            onReScanPlantWithCamera(plant);
                          }, 240);
                        }}
                        activeOpacity={0.82}
                      >
                        <TreegohIcon name="camara_diagnostica" size={14} color="#E6E8C4" glow={false} />
                        <Text style={styles.cardSecondaryActionText}>Escanear de nuevo con cámara</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* ======================================================== */}
            {/* PESTAÑA 3: BITÁCORA CRONOLÓGICA Y NOTAS CLÍNICAS */}
            {/* ======================================================== */}
            {activeTab === 'bitacora' && (
              <View style={styles.tabSection}>
                <View style={styles.bitacoraHeaderRow}>
                  <Text style={styles.bitacoraSectionTitle}>Bitácora de Intervenciones</Text>
                  <TouchableOpacity
                    style={styles.addNoteBtn}
                    onPress={() => setIsAddingNote(prev => !prev)}
                    activeOpacity={0.75}
                  >
                    <TreegohIcon name="mas" size={12} color="#0B130E" glow={false} />
                    <Text style={styles.addNoteBtnText}>Nueva nota</Text>
                  </TouchableOpacity>
                </View>

                {/* Editor para nueva nota clínica */}
                {isAddingNote && (
                  <View style={styles.newNoteBox}>
                    <TextInput
                      style={styles.newNoteInput}
                      value={newClinicalNote}
                      onChangeText={setNewClinicalNote}
                      placeholder="Escribe una observación clínica (ej: brotando hoja nueva, poda sanitaria realizada...)"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      multiline
                    />
                    <View style={styles.newNoteActionsRow}>
                      <TouchableOpacity
                        style={styles.cancelNoteBtn}
                        onPress={() => {
                          setIsAddingNote(false);
                          setNewClinicalNote('');
                        }}
                      >
                        <Text style={styles.cancelNoteText}>Cancelar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.saveNoteBtn} onPress={handleAddCustomNote}>
                        <Text style={styles.saveNoteText}>Guardar en bitácora</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Timeline vertical */}
                {(!plant.clinicalLog || plant.clinicalLog.length === 0) ? (
                  <View style={styles.emptyBitacoraCard}>
                    <TreegohIcon name="calendario_agenda" size={20} color="#E6E8C4" glow={false} />
                    <Text style={styles.emptyBitacoraTitle}>Bitácora iniciada</Text>
                    <Text style={styles.emptyBitacoraSub}>
                      Los riegos, fertilizaciones, trasplantes y fotos que registres se archivarán aquí automáticamente en orden cronológico.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.timelineList}>
                    {plant.clinicalLog.map((event, idx) => {
                      const iconName: IconName =
                        event.type === 'riego'
                          ? 'riego_hidratacion'
                          : event.type === 'fertilizacion'
                          ? 'fertilizante_nutricion'
                          : event.type === 'trasplante'
                          ? 'maceta_trasplante'
                          : event.type === 'limpieza'
                          ? 'limpieza_foliar'
                          : event.type === 'foto'
                          ? 'camara_diagnostica'
                          : event.type === 'correccion_especie'
                          ? 'biblia_plantas'
                          : 'check_verificado';

                      return (
                        <View key={event.id || idx} style={styles.timelineItem}>
                          <View style={styles.timelineLeftColumn}>
                            <View style={styles.timelineDot}>
                              <TreegohIcon name={iconName} size={11} color="#0B130E" glow={false} />
                            </View>
                            {idx < (plant.clinicalLog || []).length - 1 && (
                              <View style={styles.timelineLine} />
                            )}
                          </View>

                          <View style={styles.timelineContentCard}>
                            <View style={styles.timelineMetaRow}>
                              <Text style={styles.timelineDateText}>{formatShortDate(event.date)}</Text>
                              <Text style={styles.timelineRelativeText}>{formatRelative(event.date)}</Text>
                            </View>
                            <Text style={styles.timelineTitleText}>{event.title}</Text>
                            {event.notes ? (
                              <Text style={styles.timelineNotesText}>{event.notes}</Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Galería de evolución histórica */}
                {plant.photoGallery && plant.photoGallery.length > 0 && (
                  <View style={styles.gallerySection}>
                    <Text style={styles.galleryTitle}>Evolución Fotográfica ({plant.photoGallery.length})</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                      {plant.photoGallery.map((uri, gIdx) => (
                        <View key={`gal_${gIdx}`} style={styles.galleryThumbWrap}>
                          <Image source={{ uri }} style={styles.galleryThumb} />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* ACCIONES DEL SISTEMA AL FINAL */}
            <View style={styles.systemActionsSection}>
              {/* Enlace a monografía científica */}
              {onOpenScientificMonograph && (
                <TouchableOpacity
                  style={styles.systemActionRowBtn}
                  onPress={() => {
                    triggerHaptic();
                    onOpenScientificMonograph(plant);
                  }}
                  activeOpacity={0.8}
                >
                  <TreegohIcon name="biblia_plantas" size={16} color="#86EFAC" glow={false} />
                  <Text style={styles.systemActionRowText}>Ver monografía científica completa</Text>
                </TouchableOpacity>
              )}

              {/* Reubicar en otro microclima */}
              {onRelocatePlant && (
                <TouchableOpacity
                  style={styles.systemActionRowBtn}
                  onPress={() => {
                    triggerHaptic();
                    onClose();
                    setTimeout(() => onRelocatePlant(plant), 200);
                  }}
                  activeOpacity={0.8}
                >
                  <TreegohIcon name="espacios_microclimas" size={16} color="#93C5FD" glow={false} />
                  <Text style={styles.systemActionRowText}>Reubicar en otra estancia</Text>
                </TouchableOpacity>
              )}

              {/* Retirar planta */}
              <TouchableOpacity
                style={styles.deletePlantBtn}
                onPress={() => {
                  triggerHaptic(true);
                  onDeletePlant(plant.id);
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.deletePlantBtnText}>Retirar planta del santuario</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* ======================================================== */}
        {/* SUB-MODAL 1: CORREGIR ESPECIE SI LA IA SE EQUIVOCÓ */}
        {/* ======================================================== */}
        <Modal
          visible={isCorrectSpeciesOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsCorrectSpeciesOpen(false)}
        >
          <View style={styles.subModalOverlay}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[styles.subModalSheet, { paddingTop: Math.max(insets.top, 20), paddingBottom: safeBottom + 10 }]}>
              <View style={styles.subModalHeader}>
                <View>
                  <Text style={styles.subModalTitle}>Corregir Especie</Text>
                  <Text style={styles.subModalSubtitle}>
                    Selecciona la especie correcta de nuestro catálogo botánico
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.subModalCloseBtn}
                  onPress={() => setIsCorrectSpeciesOpen(false)}
                >
                  <TreegohIcon name="flecha_volver" size={16} color="#FFFFFF" glow={false} />
                </TouchableOpacity>
              </View>

              {/* Buscador de especies */}
              <View style={styles.searchBarBox}>
                <TreegohIcon name="busqueda_typesense" size={15} color="#94A3B8" glow={false} />
                <TextInput
                  style={styles.searchBarInput}
                  value={speciesSearchQuery}
                  onChangeText={setSpeciesSearchQuery}
                  placeholder="Buscar por nombre común o científico (ej: Monstera, Ficus...)"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  autoCapitalize="none"
                />
              </View>

              <ScrollView style={styles.speciesListScroll} showsVerticalScrollIndicator={false}>
                {matchingSpecies.map(sp => (
                  <TouchableOpacity
                    key={sp.id}
                    style={styles.speciesItemRow}
                    onPress={() => handleSelectCorrectSpecies(sp)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: sp.imageUrl }} style={styles.speciesItemThumb} />
                    <View style={styles.speciesItemInfoCol}>
                      <Text style={styles.speciesItemCommon}>{sp.commonName}</Text>
                      <Text style={styles.speciesItemScientific}>
                        {sp.scientificName} · {sp.family}
                      </Text>
                      <Text style={styles.speciesItemTrait} numberOfLines={1}>
                        {sp.trait}
                      </Text>
                    </View>
                    <TreegohIcon
                      name="flecha_adelante"
                      size={14}
                      color="rgba(255, 255, 255, 0.5)"
                      glow={false}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ======================================================== */}
        {/* SUB-MODAL 2: GESTIÓN FOTOGRÁFICA (CÁMARA / GALERÍA / OFICIAL) */}
        {/* ======================================================== */}
        <Modal
          visible={isPhotoMenuOpen}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsPhotoMenuOpen(false)}
        >
          <View style={styles.subModalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setIsPhotoMenuOpen(false)}
            />
            <View style={[styles.photoActionCard, { paddingBottom: safeBottom + 12 }]}>
              <Text style={styles.photoActionTitle}>Actualizar Fotografía de la Planta</Text>
              <Text style={styles.photoActionSub}>
                Elige el origen para registrar el estado visual de tu especie:
              </Text>

              <TouchableOpacity style={styles.photoOptionBtn} onPress={handlePickFromCamera} activeOpacity={0.8}>
                <TreegohIcon name="camara_diagnostica" size={17} color="#E6E8C4" glow={false} />
                <View style={styles.photoOptionTexts}>
                  <Text style={styles.photoOptionLabel}>Hacer foto con la cámara</Text>
                  <Text style={styles.photoOptionDesc}>Captura el estado actual de tus hojas en vivo</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.photoOptionBtn} onPress={handlePickFromGallery} activeOpacity={0.8}>
                <TreegohIcon name="galeria_evolucion" size={17} color="#E6E8C4" glow={false} />
                <View style={styles.photoOptionTexts}>
                  <Text style={styles.photoOptionLabel}>Elegir foto de la galería</Text>
                  <Text style={styles.photoOptionDesc}>Selecciona una imagen guardada en tu dispositivo</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.photoOptionBtn} onPress={handleApplyOfficialPhoto} activeOpacity={0.8}>
                <TreegohIcon name="biblia_plantas" size={17} color="#86EFAC" glow={false} />
                <View style={styles.photoOptionTexts}>
                  <Text style={styles.photoOptionLabel}>Seleccionar foto oficial automática</Text>
                  <Text style={styles.photoOptionDesc}>Asigna la fotografía de alta resolución del catálogo</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelPhotoBtn}
                onPress={() => setIsPhotoMenuOpen(false)}
              >
                <Text style={styles.cancelPhotoText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ======================================================== */}
        {/* SUB-MODAL 3: SELECTOR DE FECHAS RELATIVAS */}
        {/* ======================================================== */}
        <Modal
          visible={isDatePickModalOpen}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsDatePickModalOpen(false)}
        >
          <View style={styles.subModalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setIsDatePickModalOpen(false)}
            />
            <View style={[styles.photoActionCard, { paddingBottom: safeBottom + 12 }]}>
              <Text style={styles.photoActionTitle}>
                {datePickTarget === 'compra'
                  ? '¿Cuándo compraste o adoptaste la planta?'
                  : datePickTarget === 'riego'
                  ? '¿Cuándo realizaste el último riego?'
                  : '¿Cuándo aplicaste fertilizante?'}
              </Text>

              {[
                { label: 'Hoy', days: 0 },
                { label: 'Ayer', days: 1 },
                { label: 'Hace 3 días', days: 3 },
                { label: 'Hace 1 semana', days: 7 },
                { label: 'Hace 2 semanas', days: 14 },
                { label: 'Hace 1 mes', days: 30 },
                { label: 'Hace 3 meses', days: 90 },
                { label: 'Hace 6 meses', days: 180 },
                { label: 'Hace 1 año', days: 365 },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.label}
                  style={styles.dateOptionBtn}
                  onPress={() => handleSetPurchasedRelative(opt.days, opt.label)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dateOptionLabel}>{opt.label}</Text>
                  <TreegohIcon name="check_verificado" size={13} color="#E6E8C4" glow={false} />
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.cancelPhotoBtn}
                onPress={() => setIsDatePickModalOpen(false)}
              >
                <Text style={styles.cancelPhotoText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ======================================================== */}
        {/* SUB-MODAL 4: REGISTRAR TRASPLANTE Y SUSTRATO */}
        {/* ======================================================== */}
        <Modal
          visible={isRepotModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsRepotModalOpen(false)}
        >
          <View style={styles.subModalOverlay}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[styles.subModalSheet, { paddingTop: Math.max(insets.top, 20), paddingBottom: safeBottom + 12 }]}>
              <View style={styles.subModalHeader}>
                <View>
                  <Text style={styles.subModalTitle}>Registrar Trasplante</Text>
                  <Text style={styles.subModalSubtitle}>
                    Indica el diámetro de la nueva maceta y el sustrato empleado
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.subModalCloseBtn}
                  onPress={() => setIsRepotModalOpen(false)}
                >
                  <TreegohIcon name="flecha_volver" size={16} color="#FFFFFF" glow={false} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.formSectionLabel}>Diámetro de la nueva maceta</Text>
                <View style={styles.potChipsRow}>
                  {[12, 14, 16, 18, 20, 22, 25, 30].map(dia => (
                    <TouchableOpacity
                      key={dia}
                      style={[
                        styles.potChip,
                        plant.potDiameterCm === dia && styles.potChipActive,
                      ]}
                      onPress={() => {
                        handleApplyRepot(dia, plant.substrateType || 'Sustrato Universal Aireado con Perlita');
                      }}
                    >
                      <Text style={[styles.potChipText, plant.potDiameterCm === dia && styles.potChipTextActive]}>
                        {dia} cm
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.formSectionLabel, { marginTop: 24 }]}>Tipo de sustrato utilizado</Text>
                {[
                  'Sustrato Universal Aireado con Perlita',
                  'Mezcla Aroid (Corteza de pino + Perlita + Arlita)',
                  'Fibra de Coco con Humus de Lombriz',
                  'Sustrato Drenante para Cactus y Suculentas',
                  'Musgo Sphagnum Vivo para Epífitas',
                ].map(subName => (
                  <TouchableOpacity
                    key={subName}
                    style={styles.substrateOptionBtn}
                    onPress={() => {
                      handleApplyRepot(plant.potDiameterCm || 16, subName);
                    }}
                    activeOpacity={0.8}
                  >
                    <TreegohIcon name="sustrato_aireacion" size={15} color="#E6E8C4" glow={false} />
                    <Text style={styles.substrateOptionText}>{subName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 14, 10, 0.82)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    height: '92%',
    maxHeight: '94%',
    backgroundColor: '#0D1510',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 10,
    paddingHorizontal: 20,
    gap: 14,
  },
  dragHandleWrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 6,
  },
  dragHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  sheetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 2,
  },
  sheetSpaceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(230, 232, 196, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(230, 232, 196, 0.22)',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  sheetSpaceTagText: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: '#E6E8C4',
    letterSpacing: 0.2,
  },
  topRightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  correctSpeciesQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  correctSpeciesQuickText: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    color: '#E6E8C4',
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    gap: 20,
    paddingBottom: 36,
  },
  // HERO PHOTO
  photoContainer: {
    width: '100%',
    height: 275,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  plantHeroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changePhotoFloatingBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6E8C4',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 18,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  changePhotoFloatingText: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0B130E',
  },
  photoBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(8, 14, 10, 0.88)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCommonName: {
    fontFamily: Fonts.regular,
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroScientificName: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    color: 'rgba(230, 232, 196, 0.85)',
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },
  nicknameDisplayRow: {
    marginTop: 4,
  },
  heroNickname: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: '#86EFAC',
    letterSpacing: 0.2,
  },
  nicknameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  nicknameInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  nicknameSaveBtn: {
    backgroundColor: '#86EFAC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  nicknameSaveText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    color: '#0B130E',
  },
  // TABS
  clinicalTabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  clinicalTabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 14,
  },
  clinicalTabItemActive: {
    backgroundColor: '#E6E8C4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  clinicalTabText: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.1,
  },
  clinicalTabTextActive: {
    color: '#0B130E',
    fontWeight: '600',
  },
  tabSection: {
    gap: 18,
  },
  // CLINICAL CARDS - AHORA MÁS AMPLIAS, EXPANDIDAS Y RELAJADAS
  clinicalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 20,
    gap: 14,
    overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircleSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleCol: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  cardSubTitle: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 3,
    lineHeight: 17,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  metricLabel: {
    fontFamily: Fonts.light,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  metricValue: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '600',
  },
  metricValueOk: {
    color: '#86EFAC',
  },
  metricValueUrgent: {
    color: '#F87171',
  },
  cardDescriptionText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 2,
  },
  cardSecondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  cardSecondaryActionText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#E6E8C4',
    letterSpacing: 0.1,
  },
  cardButtonsDoubleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  btnLogPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#86EFAC',
    paddingVertical: 12,
    borderRadius: 15,
  },
  btnLogPrimaryText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '600',
    color: '#0B130E',
  },
  btnLogSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  btnLogSecondaryText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#FFFFFF',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lightStatusBadge: {
    backgroundColor: 'rgba(253, 230, 138, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.25)',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  lightStatusBadgeText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#FDE68A',
  },
  traitCallout: {
    fontFamily: Fonts.light,
    fontSize: 13,
    color: '#86EFAC',
    fontStyle: 'italic',
    lineHeight: 19,
    backgroundColor: 'rgba(134, 239, 172, 0.06)',
    padding: 12,
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#86EFAC',
  },
  // BITÁCORA TIMELINE
  bitacoraHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  bitacoraSectionTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '600',
    color: '#E6E8C4',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E6E8C4',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 14,
  },
  addNoteBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    color: '#0B130E',
  },
  newNoteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  newNoteInput: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#FFFFFF',
    minHeight: 65,
    lineHeight: 18,
  },
  newNoteActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelNoteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelNoteText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  saveNoteBtn: {
    backgroundColor: '#86EFAC',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  saveNoteText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    color: '#0B130E',
  },
  emptyBitacoraCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyBitacoraTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyBitacoraSub: {
    fontFamily: Fonts.light,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 19,
  },
  timelineList: {
    gap: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 14,
  },
  timelineLeftColumn: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#86EFAC',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  timelineContentCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    gap: 5,
  },
  timelineMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineDateText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#E6E8C4',
    letterSpacing: 0.2,
  },
  timelineRelativeText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  timelineTitleText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  timelineNotesText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  gallerySection: {
    marginTop: 18,
    gap: 12,
  },
  galleryTitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '600',
    color: '#E6E8C4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  galleryScroll: {
    flexDirection: 'row',
  },
  galleryThumbWrap: {
    width: 84,
    height: 84,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  galleryThumb: {
    width: '100%',
    height: '100%',
  },
  // SYSTEM ACTIONS
  systemActionsSection: {
    gap: 12,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  systemActionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  systemActionRowText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  deletePlantBtn: {
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 2,
  },
  deletePlantBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: '#F87171',
    letterSpacing: 0.3,
  },
  // SUB-MODALS
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  subModalSheet: {
    flex: 1,
    backgroundColor: '#0D140F',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    gap: 14,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subModalTitle: {
    fontFamily: Fonts.regular,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subModalSubtitle: {
    fontFamily: Fonts.light,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
  },
  subModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchBarInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#FFFFFF',
  },
  speciesListScroll: {
    flex: 1,
  },
  speciesItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
  },
  speciesItemThumb: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  speciesItemInfoCol: {
    flex: 1,
  },
  speciesItemCommon: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  speciesItemScientific: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  speciesItemTrait: {
    fontFamily: Fonts.light,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  // PHOTO ACTION SHEET
  photoActionCard: {
    backgroundColor: '#141D16',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  photoActionTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photoActionSub: {
    fontFamily: Fonts.light,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 6,
  },
  photoOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 14,
  },
  photoOptionTexts: {
    flex: 1,
  },
  photoOptionLabel: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photoOptionDesc: {
    fontFamily: Fonts.light,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
  },
  cancelPhotoBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelPhotoText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  dateOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dateOptionLabel: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#FFFFFF',
  },
  // REPOT
  formSectionLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    color: '#E6E8C4',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  potChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  potChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  potChipActive: {
    backgroundColor: '#E6E8C4',
    borderColor: '#E6E8C4',
  },
  potChipText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#E6E8C4',
  },
  potChipTextActive: {
    color: '#0B130E',
    fontWeight: '600',
  },
  substrateOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  substrateOptionText: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
});
