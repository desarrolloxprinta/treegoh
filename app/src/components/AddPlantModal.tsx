import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Fonts } from '../constants/theme';
import { TreegohIcon } from './TreegohIcon';
import { GlassCardSheen } from './BlobAnimatedCard';
import { BotanicalImage } from './BotanicalImage';
import { CircadianBackground } from './CircadianBackground';
import { CircadianThemeConfig } from '../utils/circadianTheme';
import { WeatherConditionType } from '../services/weatherService';
import { getRealSpeciesImageSync } from '../services/botanicalEncyclopediaService';
import { searchBotanicalSync } from '../services/typesenseService';
import { UserPlant, RecommendedSpaceSpecies } from '../types/plant';
import { CustomMicroclimate, SafetyFilter } from '../types/onboarding';
import { BOTANICAL_DATABASE, ComprehensiveSpecies } from '../constants/botanicalDatabase';

export const EXPANDED_CURATED_SPECIES: RecommendedSpaceSpecies[] = BOTANICAL_DATABASE;

const INITIAL_SPECIES_DISPLAY_LIMIT = 12;

interface AddPlantModalProps {
  visible: boolean;
  activeSpace: CustomMicroclimate | null;
  spaces?: CustomMicroclimate[];
  safetyFilter?: SafetyFilter;
  theme?: CircadianThemeConfig;
  currentTime?: Date;
  weatherCondition?: WeatherConditionType;
  coords?: { latitude?: number; longitude?: number };
  onClose: () => void;
  onOpenBubbleCamera: (targetSpaceName?: string) => void;
  onPickGalleryForAi: (imageUri: string, base64: string, targetSpaceName?: string) => void;
  onPlantAdded: (plant: UserPlant) => void;
  onRequestCreateSpace?: () => void;
}

type AddTabMode = 'recommended' | 'scan' | 'manual';
type QuickFilterType = 'todas' | 'optimas' | 'pet_safe' | 'poca_luz' | 'purificadoras' | 'colgantes' | 'faciles';

export const AddPlantModal: React.FC<AddPlantModalProps> = ({
  visible,
  activeSpace,
  spaces = [],
  safetyFilter = { hasPets: false, petTypes: [] },
  theme,
  currentTime,
  weatherCondition = 'despejado',
  coords,
  onClose,
  onOpenBubbleCamera,
  onPickGalleryForAi,
  onPlantAdded,
  onRequestCreateSpace,
}) => {
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, Platform.OS === 'ios' ? 48 : 24);
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 32 : 18);

  // Espacios disponibles
  const availableSpaces = useMemo(() => {
    if (spaces && spaces.length > 0) return spaces;
    if (activeSpace) return [activeSpace];
    return [
      {
        id: 'salon_principal',
        name: 'Salón',
        roomType: 'Salón',
        orientation: 'Sur' as const,
        headingDegrees: 180,
        windowDistance: 'media_distancia' as const,
        estimatedLux: 3200,
        thermalRisks: { nearRadiator: false, nearAC: false, drafts: false },
        humidityLevel: 'media' as const,
        habitabilityScore: 92,
        verdict: 'Excelente iluminación natural filtrada.',
        recommendedSpecies: ['Monstera deliciosa', 'Ficus lyrata'],
        preventiveTips: ['Girar 90° cada 15 días'],
      },
    ];
  }, [spaces, activeSpace]);

  // Espacio destino seleccionado
  const [selectedSpaceIndex, setSelectedSpaceIndex] = useState<number>(0);

  useEffect(() => {
    if (activeSpace && availableSpaces.length > 0) {
      const idx = availableSpaces.findIndex(s => s.name === activeSpace.name);
      if (idx >= 0) {
        setSelectedSpaceIndex(idx);
      }
    }
  }, [activeSpace, availableSpaces]);

  const currentTargetSpace: CustomMicroclimate =
    availableSpaces[selectedSpaceIndex] || availableSpaces[0];

  const targetSpaceName = currentTargetSpace?.name || 'Salón';
  const targetSpaceLux = currentTargetSpace?.estimatedLux || 3200;

  const [activeTab, setActiveTab] = useState<AddTabMode>('recommended');

  // Pestaña Recomendadas
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('todas');
  const [speciesDisplayLimit, setSpeciesDisplayLimit] = useState<number>(INITIAL_SPECIES_DISPLAY_LIMIT);

  // Pestaña Manual
  const [manualName, setManualName] = useState('');
  const [manualNickname, setManualNickname] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualWateringDays, setManualWateringDays] = useState<number>(7);
  const [manualIsPetSafe, setManualIsPetSafe] = useState<boolean>(!safetyFilter.hasPets);
  const [manualImageUri, setManualImageUri] = useState<string | null>(null);

  // Reiniciar paginación al abrir modal o al cambiar filtros (para despliegue a 120 FPS sin freeze)
  useEffect(() => {
    if (visible) {
      setSpeciesDisplayLimit(INITIAL_SPECIES_DISPLAY_LIMIT);
    }
  }, [visible, searchQuery, quickFilter, selectedSpaceIndex]);

  const triggerHaptic = (heavy = false) => {
    try {
      Haptics.impactAsync(
        heavy ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
    } catch (_e) {}
  };

  // Cálculo conciso de afinidad lumínica (sin textos largos que rompan cards)
  const getLightAffinity = (minLux: number, maxLux: number) => {
    const minL = Number(minLux) || 800;
    const maxL = Number(maxLux) || 3500;
    if (targetSpaceLux >= minL && targetSpaceLux <= maxL * 1.25) {
      return {
        level: 'optima' as const,
        label: 'Luz óptima',
        color: '#86EFAC',
        bg: 'rgba(134, 239, 172, 0.16)',
      };
    }
    if (targetSpaceLux < minL) {
      return {
        level: 'baja' as const,
        label: 'Claridad suave',
        color: '#FDE68A',
        bg: 'rgba(253, 230, 138, 0.16)',
      };
    }
    return {
      level: 'alta' as const,
      label: 'Sol abundante',
      color: '#93C5FD',
      bg: 'rgba(147, 197, 253, 0.16)',
    };
  };

  // Filtrado Typesense sincrónico
  const displayedSpecies = useMemo(() => {
    let list: ComprehensiveSpecies[] = BOTANICAL_DATABASE;

    const trimmed = searchQuery.trim();
    if (trimmed.length > 0) {
      const searchRes = searchBotanicalSync(trimmed, 80);
      list = (searchRes?.hits || []).map(h => h.document).filter(Boolean);
    }

    return list.filter(sp => {
      if (safetyFilter.hasPets && !sp.isPetSafe && quickFilter === 'pet_safe') {
        return false;
      }

      const minL = Number(sp.minLux) || 800;
      const maxL = Number(sp.maxLux) || 3500;
      const isOptimal = targetSpaceLux >= minL && targetSpaceLux <= maxL * 1.25;

      switch (quickFilter) {
        case 'optimas':
          return isOptimal;
        case 'pet_safe':
          return Boolean(sp.isPetSafe);
        case 'poca_luz':
          return minL <= 800;
        case 'purificadoras':
          return (
            sp.category === 'purificadora' ||
            (sp.trait && sp.trait.toLowerCase().includes('purific')) ||
            (sp.commonName && sp.commonName.toLowerCase().includes('sansevieria')) ||
            (sp.commonName && sp.commonName.toLowerCase().includes('spathiphyllum'))
          );
        case 'colgantes':
          return (
            (sp.trait && sp.trait.toLowerCase().includes('colgante')) ||
            (sp.trait && sp.trait.toLowerCase().includes('trepadora')) ||
            (sp.category && sp.category.toLowerCase().includes('trepadora'))
          );
        case 'faciles':
          return (
            sp.difficulty === 'facil' ||
            (sp.wateringIntervalDays && sp.wateringIntervalDays >= 9)
          );
        case 'todas':
        default:
          return true;
      }
    });
  }, [searchQuery, quickFilter, safetyFilter.hasPets, targetSpaceLux]);

  // Solo renderizar el subset paginado visible para 0 ms de demora
  const visibleSpecies = useMemo(() => {
    return displayedSpecies.slice(0, speciesDisplayLimit);
  }, [displayedSpecies, speciesDisplayLimit]);

  const handleSelectCuratedSpecies = (species: ComprehensiveSpecies) => {
    triggerHaptic(true);
    const minL = Number(species.minLux) || 800;
    const maxL = Number(species.maxLux) || 3500;
    const isOptimalLight = targetSpaceLux >= minL && targetSpaceLux <= maxL * 1.25;
    const realImg = getRealSpeciesImageSync(
      species.scientificName,
      species.commonName,
      species.imageUrl
    );

    const newPlant: UserPlant = {
      id: `plant_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spaceName: targetSpaceName,
      commonName: species.commonName,
      scientificName: species.scientificName,
      family: species.family,
      imageUrl: realImg.primaryUrl || species.imageUrl,
      wateringStatus: 'optimo',
      daysUntilNextWatering: species.wateringIntervalDays || 7,
      lightCompatibility: isOptimalLight ? 'optima' : 'buena',
      lightCompatibilityNote: `La iluminación de ~${targetSpaceLux.toLocaleString()} Lux en ${targetSpaceName} coincide con el rango de esta especie.`,
      isPetSafe: species.isPetSafe,
      toxicityNote: species.isPetSafe
        ? 'Especie certificada no tóxica según ASPCA.'
        : 'Precaución: contiene principios botánicos que pueden irritar a perros y gatos.',
      addedAt: new Date().toISOString(),
      trait: species.trait,
      estimatedLuxDemand: (minL + maxL) / 2,
    };

    onPlantAdded(newPlant);
    onClose();
  };

  const handlePickManualPhoto = async () => {
    triggerHaptic();
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.75,
      });

      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        setManualImageUri(res.assets[0].uri);
      }
    } catch (_err) {}
  };

  const handleSaveManual = () => {
    if (!manualName.trim()) return;
    triggerHaptic(true);

    const defaultImg =
      'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=600&q=80';

    const newPlant: UserPlant = {
      id: `plant_manual_${Date.now()}`,
      spaceName: targetSpaceName,
      commonName: manualName.trim(),
      scientificName: 'Especie registrada en el santuario',
      nickname: manualNickname.trim() || undefined,
      notes: manualNotes.trim() || undefined,
      imageUrl: manualImageUri || defaultImg,
      wateringStatus: 'optimo',
      daysUntilNextWatering: manualWateringDays,
      lightCompatibility: 'optima',
      lightCompatibilityNote: `Ubicada en ${targetSpaceName} con pauta de riego cada ${manualWateringDays} días.`,
      isPetSafe: manualIsPetSafe,
      toxicityNote: manualIsPetSafe
        ? 'Clasificada como segura para mascotas por el usuario.'
        : 'Mantener protegida de mascotas y niños pequeños.',
      addedAt: new Date().toISOString(),
      trait: 'Planta incorporada por el usuario al santuario.',
    };

    onPlantAdded(newPlant);
    setManualName('');
    setManualNickname('');
    setManualNotes('');
    setManualImageUri(null);
    onClose();
  };

  // Manejador de scroll infinito suave
  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e?.nativeEvent || {};
    if (layoutMeasurement && contentOffset && contentSize) {
      if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 320) {
        if (speciesDisplayLimit < displayedSpecies.length) {
          setSpeciesDisplayLimit(prev => Math.min(prev + 12, displayedSpecies.length));
        }
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      {/* FONDO CIRCADIANO ANIMADO IDÉNTICO A LA APP CON VELO 50% MÁS CLARO */}
      <CircadianBackground
        coords={coords}
        theme={theme}
        currentTime={currentTime}
        weatherCondition={weatherCondition}
      >
        <View style={styles.translucentLightVeil}>
          {/* 1. BARRA SUPERIOR DE NAVEGACIÓN AÉREA */}
          <View style={[styles.topNavBarRow, { paddingTop: safeTop + 4 }]}>
            <TouchableOpacity
              style={styles.navBackBtnPill}
              onPress={() => {
                triggerHaptic();
                onClose();
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <TreegohIcon name="flecha_volver" size={16} color="#FFFFFF" glow={false} />
              <Text style={styles.navBackBtnText}>Santuario</Text>
            </TouchableOpacity>

            <View style={styles.topMicroclimateBadge}>
              <TreegohIcon name="luz_natural" size={13} color="#86EFAC" glow={false} />
              <Text style={styles.topMicroclimateBadgeText} numberOfLines={1}>
                {targetSpaceName} · ~{targetSpaceLux.toLocaleString()} lx
              </Text>
            </View>
          </View>

          {/* 2. CONTENIDO PRINCIPAL CON SCROLL FLUIDO */}
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={[
              styles.mainScrollContent,
              { paddingBottom: safeBottom + 60 },
            ]}
            showsVerticalScrollIndicator={false}
            horizontal={false}
            showsHorizontalScrollIndicator={false}
            alwaysBounceHorizontal={false}
            directionalLockEnabled={true}
            keyboardShouldPersistTaps="handled"
            onScroll={handleScroll}
            scrollEventThrottle={64}
          >
            {/* BLOQUE HERO EDITORIAL */}
            <View style={styles.editorialHeaderBlock}>
              <View style={styles.heroSuperTagPill}>
                <TreegohIcon name="anadir_planta" size={12} color="#86EFAC" glow={false} />
                <Text style={styles.heroSuperTagText}>INCORPORACIÓN BOTÁNICA</Text>
              </View>
              <Text style={styles.editorialMainTitle}>Añadir Planta</Text>
              <Text style={styles.editorialSubtitle}>
                Selecciona la estancia de destino y descubre especies idóneas para su microclima, o incorpora tu planta manualmente.
              </Text>
            </View>

            {/* 3. SECCIÓN ESTANCIA DE DESTINO (RÉPLICA DEL DASHBOARD) */}
            <View style={styles.spacesSectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleWithIcon}>
                  <TreegohIcon name="espacios_microclimas" size={17} color="#FFFFFF" glow={false} />
                  <Text style={styles.sectionTitle}>Espacio de destino</Text>
                </View>
                <Text style={styles.sectionCounter}>
                  {selectedSpaceIndex + 1} de {availableSpaces.length}
                </Text>
              </View>

              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                style={styles.fullBleedScroll}
                contentContainerStyle={styles.spacesScrollContent}
              >
                {availableSpaces.map((sp, idx) => {
                  const isSelected = idx === selectedSpaceIndex;
                  const lux = sp.estimatedLux || 3200;
                  return (
                    <TouchableOpacity
                      key={sp.id || sp.name}
                      style={[
                        styles.spaceTabPill,
                        isSelected && styles.spaceTabPillSelected,
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setSelectedSpaceIndex(idx);
                      }}
                      activeOpacity={0.8}
                    >
                      <GlassCardSheen selected={isSelected} />
                      <TreegohIcon
                        name="espacios_microclimas"
                        size={15}
                        color="#FFFFFF"
                        glow={isSelected}
                      />
                      <Text
                        style={[
                          styles.spaceTabPillText,
                          isSelected && styles.spaceTabPillTextSelected,
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {sp.name}
                      </Text>
                      <View
                        style={[
                          styles.spaceLuxPillTag,
                          isSelected && styles.spaceLuxPillTagSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.spaceLuxPillTagText,
                            isSelected && styles.spaceLuxPillTagTextSelected,
                          ]}
                        >
                          ~{lux.toLocaleString()} lx
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {onRequestCreateSpace && (
                  <TouchableOpacity
                    style={styles.spaceAddPillBtn}
                    onPress={() => {
                      triggerHaptic();
                      onClose();
                      setTimeout(() => {
                        onRequestCreateSpace();
                      }, 240);
                    }}
                    activeOpacity={0.8}
                  >
                    <GlassCardSheen />
                    <TreegohIcon name="mas" size={13} color="#FFFFFF" glow={false} />
                    <Text style={styles.spaceAddPillText}>Nuevo espacio</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              {/* Ficha bioclimática sin desbordes */}
              <View style={styles.selectedSpaceBioclimaticCard}>
                <GlassCardSheen />
                <View style={styles.selectedSpaceBioIconWrap}>
                  <TreegohIcon name="sensor_lux" size={17} color="#86EFAC" glow={false} />
                </View>
                <View style={styles.selectedSpaceBioTexts}>
                  <Text style={styles.selectedSpaceBioName} numberOfLines={1}>
                    Microclima de «{targetSpaceName}»
                  </Text>
                  <Text style={styles.selectedSpaceBioSub} numberOfLines={2}>
                    {currentTargetSpace.orientation || 'Sur'} · ~{targetSpaceLux.toLocaleString()} Lux · {currentTargetSpace.verdict || 'Afinidad natural equilibrada'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 4. SELECTOR DE MÉTODO BLINDADO CONTRA DESBORDES */}
            <View style={styles.modeTabsDock}>
              <TouchableOpacity
                style={[styles.modeTabBtn, activeTab === 'recommended' && styles.modeTabBtnActive]}
                onPress={() => {
                  triggerHaptic();
                  setActiveTab('recommended');
                }}
                activeOpacity={0.82}
              >
                <GlassCardSheen selected={activeTab === 'recommended'} />
                <TreegohIcon
                  name="biblia_plantas"
                  size={13}
                  color={activeTab === 'recommended' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'}
                  glow={activeTab === 'recommended'}
                />
                <Text
                  style={[
                    styles.modeTabBtnText,
                    activeTab === 'recommended' && styles.modeTabBtnTextActive,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.75}
                >
                  Recomendadas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTabBtn, activeTab === 'scan' && styles.modeTabBtnActive]}
                onPress={() => {
                  triggerHaptic();
                  setActiveTab('scan');
                }}
                activeOpacity={0.82}
              >
                <GlassCardSheen selected={activeTab === 'scan'} />
                <TreegohIcon
                  name="camara_diagnostica"
                  size={13}
                  color={activeTab === 'scan' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'}
                  glow={activeTab === 'scan'}
                />
                <Text
                  style={[
                    styles.modeTabBtnText,
                    activeTab === 'scan' && styles.modeTabBtnTextActive,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.75}
                >
                  Visor Óptico
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTabBtn, activeTab === 'manual' && styles.modeTabBtnActive]}
                onPress={() => {
                  triggerHaptic();
                  setActiveTab('manual');
                }}
                activeOpacity={0.82}
              >
                <GlassCardSheen selected={activeTab === 'manual'} />
                <TreegohIcon
                  name="anadir_planta"
                  size={13}
                  color={activeTab === 'manual' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'}
                  glow={activeTab === 'manual'}
                />
                <Text
                  style={[
                    styles.modeTabBtnText,
                    activeTab === 'manual' && styles.modeTabBtnTextActive,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.75}
                >
                  Manual
                </Text>
              </TouchableOpacity>
            </View>

            {/* 5. CONTENIDO: PESTAÑA RECOMENDADAS */}
            {activeTab === 'recommended' && (
              <View style={styles.catalogSectionBlock}>
                {/* Buscador Typesense amplio */}
                <View style={styles.searchBarCard}>
                  <TreegohIcon name="busqueda_typesense" size={17} color="#FFFFFF" glow={false} />
                  <TextInput
                    style={styles.searchBarInput}
                    placeholder={`Buscar especies para ${targetSpaceName}...`}
                    placeholderTextColor="rgba(255, 255, 255, 0.45)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.clearSearchCross}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Chips de filtro temáticos */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.fullBleedScroll}
                  contentContainerStyle={styles.filterChipsScrollRow}
                >
                  {[
                    { id: 'todas' as QuickFilterType, label: `Todas (${displayedSpecies.length})` },
                    { id: 'optimas' as QuickFilterType, label: `Óptimas para ${targetSpaceName}` },
                    { id: 'pet_safe' as QuickFilterType, label: 'Pet-Safe (ASPCA)' },
                    { id: 'poca_luz' as QuickFilterType, label: 'Poca luz (<800 lx)' },
                    { id: 'purificadoras' as QuickFilterType, label: 'Purificadoras NASA' },
                    { id: 'colgantes' as QuickFilterType, label: 'Colgantes & Guías' },
                    { id: 'faciles' as QuickFilterType, label: 'Riego Espaciado' },
                  ].map(chip => {
                    const isSelected = quickFilter === chip.id;
                    return (
                      <TouchableOpacity
                        key={chip.id}
                        style={[
                          styles.filterChipItem,
                          isSelected && styles.filterChipItemActive,
                        ]}
                        onPress={() => {
                          triggerHaptic();
                          setQuickFilter(chip.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <GlassCardSheen selected={isSelected} />
                        <Text
                          style={[
                            styles.filterChipText,
                            isSelected && styles.filterChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {chip.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Grid en 2 Columnas protegido contra desbordes */}
                {displayedSpecies.length === 0 ? (
                  <View style={styles.emptySearchCard}>
                    <GlassCardSheen />
                    <TreegohIcon name="busqueda_typesense" size={26} color="rgba(255, 255, 255, 0.45)" glow={false} />
                    <Text style={styles.emptySearchTitle}>
                      No encontramos especies para «{searchQuery}»
                    </Text>
                    <Text style={styles.emptySearchSub}>
                      Prueba buscando términos como «Poto», «Monstera», «Pet-Safe» o añade tu planta desde la pestaña Manual.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.plantsGrid2Col}>
                      {visibleSpecies.map(sp => {
                        const minL = Number(sp.minLux) || 800;
                        const maxL = Number(sp.maxLux) || 3500;
                        const affinity = getLightAffinity(minL, maxL);

                        return (
                          <View key={sp.id || sp.scientificName} style={styles.plantGridCard}>
                            <GlassCardSheen />

                            {/* Fotografía verified */}
                            <View style={styles.plantGridImageWrap}>
                              <BotanicalImage
                                uri={sp.imageUrl}
                                scientificName={sp.scientificName}
                                commonName={sp.commonName}
                                style={styles.plantGridThumb}
                              />

                              {/* Badges superiores protegidos */}
                              <View style={styles.plantGridBadgeTopRow}>
                                {sp.isPetSafe ? (
                                  <View style={styles.petBadgeSafe}>
                                    <Text style={styles.petBadgeSafeText}>ASPCA</Text>
                                  </View>
                                ) : (
                                  <View style={styles.petBadgeTox}>
                                    <Text style={styles.petBadgeToxText}>Tóxica</Text>
                                  </View>
                                )}

                                <View style={styles.luxDemandsPill}>
                                  <Text style={styles.luxDemandsPillText}>
                                    ~{minL.toLocaleString()} lx
                                  </Text>
                                </View>
                              </View>
                            </View>

                            {/* Textos blindados sin salirse de la tarjeta */}
                            <View style={styles.plantGridCardBody}>
                              <Text
                                style={styles.plantGridCardName}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {sp.commonName}
                              </Text>
                              <Text
                                style={styles.plantGridCardScientific}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {sp.scientificName}
                              </Text>

                              {/* Píldora de afinidad bioclimática */}
                              <View
                                style={[
                                  styles.affinityBadgePill,
                                  { backgroundColor: affinity.bg },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.affinityBadgeDot,
                                    { backgroundColor: affinity.color },
                                  ]}
                                />
                                <Text
                                  style={[
                                    styles.affinityBadgeLabel,
                                    { color: affinity.color },
                                  ]}
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  {affinity.label}
                                </Text>
                              </View>

                              {/* Botón de acción conciso (Añadir) que nunca desborda */}
                              <TouchableOpacity
                                style={styles.addPlantCtaBtn}
                                onPress={() => handleSelectCuratedSpecies(sp)}
                                activeOpacity={0.84}
                              >
                                <TreegohIcon name="mas" size={11} color="#161922" glow={false} />
                                <Text style={styles.addPlantCtaBtnText} numberOfLines={1}>
                                  Añadir
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {/* Botón para cargar más especies de forma instantánea */}
                    {visibleSpecies.length < displayedSpecies.length && (
                      <TouchableOpacity
                        style={styles.loadMoreSpeciesBtn}
                        onPress={() =>
                          setSpeciesDisplayLimit(prev =>
                            Math.min(prev + 12, displayedSpecies.length)
                          )
                        }
                        activeOpacity={0.8}
                      >
                        <GlassCardSheen />
                        <TreegohIcon name="biblia_plantas" size={14} color="#86EFAC" glow={false} />
                        <Text style={styles.loadMoreSpeciesText}>
                          Ver más especies ({visibleSpecies.length} de {displayedSpecies.length})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            )}

            {/* 6. CONTENIDO: PESTAÑA VISOR ÓPTICO IA */}
            {activeTab === 'scan' && (
              <View style={styles.opticalScannerCard}>
                <GlassCardSheen />

                {/* Telemetría blindada contra desbordes */}
                <View style={styles.discreetScannerTelemetryRow}>
                  <View style={styles.discreetScannerDot} />
                  <Text
                    style={styles.discreetScannerTelemetryText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Destino: «{targetSpaceName}» ({currentTargetSpace?.orientation || 'Sur'}) · ~{targetSpaceLux.toLocaleString()} lx
                  </Text>
                </View>

                {/* Marco biométrico */}
                <View style={styles.cleanBracketPreviewBox}>
                  <Svg width={130} height={90} viewBox="0 0 130 90">
                    <Path
                      d="M 2 26 L 2 14 Q 2 2 14 2 L 26 2 M 104 2 L 116 2 Q 128 2 128 14 L 128 26 M 2 64 L 2 76 Q 2 88 14 88 L 26 88 M 104 88 L 116 88 Q 128 88 128 76 L 128 64"
                      stroke="rgba(255, 255, 255, 0.85)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </Svg>
                  <View style={styles.bracketCenterIconWrap}>
                    <TreegohIcon
                      name="camara_diagnostica"
                      size={28}
                      color="rgba(255, 255, 255, 0.95)"
                      glow={false}
                    />
                  </View>
                </View>

                <Text
                  style={styles.opticalCardHeadline}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.85}
                >
                  Reconocimiento Biométrico Foliar
                </Text>
                <Text style={styles.opticalCardSubline}>
                  Encuadra la planta o sube una fotografía. El modelo de visión artificial identificará la especie y comprobará si prosperará con los ~{targetSpaceLux.toLocaleString()} Lux de «{targetSpaceName}».
                </Text>

                <View style={styles.opticalActionButtonsRow}>
                  <TouchableOpacity
                    style={styles.opticalPrimaryScanBtn}
                    onPress={() => {
                      triggerHaptic();
                      onClose();
                      setTimeout(() => {
                        onOpenBubbleCamera(targetSpaceName);
                      }, 220);
                    }}
                    activeOpacity={0.85}
                  >
                    <TreegohIcon name="camara_diagnostica" size={17} color="#2C2A28" glow={false} />
                    <Text
                      style={styles.opticalPrimaryScanBtnText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.80}
                    >
                      Escanear con Cámara
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.opticalSecondaryGalleryBtn}
                    onPress={async () => {
                      triggerHaptic();
                      try {
                        const res = await ImagePicker.launchImageLibraryAsync({
                          mediaTypes: ['images'],
                          allowsEditing: true,
                          aspect: [4, 3],
                          quality: 0.65,
                          base64: true,
                        });

                        if (!res.canceled && res.assets && res.assets[0]?.uri && res.assets[0]?.base64) {
                          onClose();
                          setTimeout(() => {
                            onPickGalleryForAi(res.assets[0].uri, res.assets[0].base64!, targetSpaceName);
                          }, 250);
                        }
                      } catch (_err) {}
                    }}
                    activeOpacity={0.82}
                  >
                    <TreegohIcon name="galeria_evolucion" size={17} color="#FFFFFF" glow={false} />
                    <Text
                      style={styles.opticalSecondaryGalleryBtnText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.80}
                    >
                      Subir desde Galería
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 7. CONTENIDO: PESTAÑA REGISTRO MANUAL */}
            {activeTab === 'manual' && (
              <View style={styles.manualFormSection}>
                {/* Tarjeta heroica para adjuntar imagen */}
                <TouchableOpacity
                  style={styles.manualPhotoHeroCard}
                  onPress={handlePickManualPhoto}
                  activeOpacity={0.82}
                >
                  <GlassCardSheen />
                  {manualImageUri ? (
                    <Image source={{ uri: manualImageUri }} style={styles.manualPhotoHeroPreview} />
                  ) : (
                    <View style={styles.manualPhotoPlaceholderCircle}>
                      <TreegohIcon name="camara_diagnostica" size={24} color="#FFFFFF" glow={false} />
                    </View>
                  )}
                  <View style={styles.manualPhotoHeroTexts}>
                    <Text style={styles.manualPhotoHeroTitle} numberOfLines={1}>
                      {manualImageUri ? 'Fotografía seleccionada' : 'Fotografía de tu planta'}
                    </Text>
                    <Text style={styles.manualPhotoHeroSub} numberOfLines={1}>
                      {manualImageUri
                        ? 'Toca para cambiar la imagen'
                        : 'Toca para elegir una foto de tu carrete'}
                    </Text>
                  </View>
                  <View style={styles.manualPhotoPickerActionCircle}>
                    <TreegohIcon name="galeria_evolucion" size={15} color="#FFFFFF" glow={false} />
                  </View>
                </TouchableOpacity>

                {/* Nombre común */}
                <View style={styles.manualFormGroup}>
                  <Text style={styles.manualFormLabel}>Nombre común de la planta *</Text>
                  <TextInput
                    style={styles.manualFormInput}
                    placeholder="Ej: Ficus Lyrata, Poto Dorado, Crotón, Calathea..."
                    placeholderTextColor="rgba(255, 255, 255, 0.42)"
                    value={manualName}
                    onChangeText={setManualName}
                  />
                </View>

                {/* Apodo en el hogar */}
                <View style={styles.manualFormGroup}>
                  <Text style={styles.manualFormLabel}>Apodo o mote en el hogar (opcional)</Text>
                  <TextInput
                    style={styles.manualFormInput}
                    placeholder="Ej: La reina de la ventana, Guardián del rincón..."
                    placeholderTextColor="rgba(255, 255, 255, 0.42)"
                    value={manualNickname}
                    onChangeText={setManualNickname}
                  />
                </View>

                {/* Frecuencia de riego sugerida */}
                <View style={styles.manualFormGroup}>
                  <Text style={styles.manualFormLabel}>Frecuencia de riego sugerida</Text>
                  <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    style={styles.fullBleedScroll}
                    contentContainerStyle={styles.manualOptionsScrollRow}
                  >
                    {[
                      { days: 3, label: 'Cada 3 días' },
                      { days: 5, label: 'Cada 5 días' },
                      { days: 7, label: 'Semanal (7d)' },
                      { days: 10, label: 'Cada 10 días' },
                      { days: 14, label: 'Quincenal (14d)' },
                      { days: 21, label: 'Cada 21 días' },
                    ].map(opt => {
                      const isSelected = manualWateringDays === opt.days;
                      return (
                        <TouchableOpacity
                          key={opt.days}
                          style={[
                            styles.manualPillOption,
                            isSelected && styles.manualPillOptionActive,
                          ]}
                          onPress={() => {
                            triggerHaptic();
                            setManualWateringDays(opt.days);
                          }}
                          activeOpacity={0.8}
                        >
                          <GlassCardSheen selected={isSelected} />
                          <Text
                            style={[
                              styles.manualPillOptionText,
                              isSelected && styles.manualPillOptionTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Seguridad para mascotas (ASPCA) */}
                <View style={styles.manualFormGroup}>
                  <Text style={styles.manualFormLabel}>Seguridad para mascotas (ASPCA)</Text>
                  <View style={styles.manualDualCardsRow}>
                    <TouchableOpacity
                      style={[
                        styles.manualChoiceCard,
                        manualIsPetSafe && styles.manualChoiceCardSafeActive,
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setManualIsPetSafe(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <GlassCardSheen selected={manualIsPetSafe} />
                      <View style={styles.manualChoiceIconCircle}>
                        <TreegohIcon
                          name="mascota_libre"
                          size={18}
                          color={manualIsPetSafe ? '#86EFAC' : 'rgba(255, 255, 255, 0.65)'}
                          glow={manualIsPetSafe}
                        />
                      </View>
                      <Text
                        style={[
                          styles.manualChoiceTitle,
                          manualIsPetSafe && { color: '#86EFAC' },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.85}
                      >
                        Pet-Safe (Segura)
                      </Text>
                      <Text style={styles.manualChoiceSub} numberOfLines={2}>
                        No presenta riesgo para perros ni gatos.
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.manualChoiceCard,
                        !manualIsPetSafe && styles.manualChoiceCardToxActive,
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setManualIsPetSafe(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <GlassCardSheen selected={!manualIsPetSafe} />
                      <View style={styles.manualChoiceIconCircle}>
                        <TreegohIcon
                          name="escudo_fitosanitario"
                          size={18}
                          color={!manualIsPetSafe ? '#FCA5A5' : 'rgba(255, 255, 255, 0.65)'}
                          glow={!manualIsPetSafe}
                        />
                      </View>
                      <Text
                        style={[
                          styles.manualChoiceTitle,
                          !manualIsPetSafe && { color: '#FCA5A5' },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.85}
                      >
                        Tóxica / Precaución
                      </Text>
                      <Text style={styles.manualChoiceSub} numberOfLines={2}>
                        Contiene oxalatos o savia irritante.
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Notas de cuidado */}
                <View style={styles.manualFormGroup}>
                  <Text style={styles.manualFormLabel}>Notas de cuidado inicial (opcional)</Text>
                  <TextInput
                    style={styles.manualFormTextarea}
                    placeholder="Ej: Maceta de barro con drenaje, perlita y corteza de pino."
                    placeholderTextColor="rgba(255, 255, 255, 0.42)"
                    value={manualNotes}
                    onChangeText={setManualNotes}
                    multiline={true}
                    textAlignVertical="top"
                  />
                </View>

                {/* Botón hero de guardado sin desbordes */}
                <TouchableOpacity
                  style={[
                    styles.saveManualHeroBtn,
                    !manualName.trim() && { opacity: 0.45 },
                  ]}
                  disabled={!manualName.trim()}
                  onPress={handleSaveManual}
                  activeOpacity={0.85}
                >
                  <Text
                    style={styles.saveManualHeroBtnText}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.85}
                  >
                    Guardar en {targetSpaceName}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </CircadianBackground>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Velo translúcido un 50% más claro para que la animación circadiana de la app respire detrás
  translucentLightVeil: {
    flex: 1,
    backgroundColor: 'rgba(9, 14, 21, 0.38)',
  },
  topNavBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 10,
    zIndex: 10,
  },
  navBackBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  navBackBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  topMicroclimateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(134, 239, 172, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.32)',
    maxWidth: '55%',
  },
  topMicroclimateBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: '#86EFAC',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 28,
  },

  // Bloque hero editorial
  editorialHeaderBlock: {
    gap: 8,
  },
  heroSuperTagPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(134, 239, 172, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.28)',
  },
  heroSuperTagText: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: '#86EFAC',
    letterSpacing: 1.2,
  },
  editorialMainTitle: {
    fontFamily: Fonts.light,
    fontSize: 30,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  editorialSubtitle: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
    lineHeight: 21,
  },

  // Sección de estancias del hogar
  spacesSectionBlock: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.light,
    fontSize: 19,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  sectionCounter: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  fullBleedScroll: {
    marginHorizontal: -20,
  },
  spacesScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  spaceTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    overflow: 'hidden',
  },
  spaceTabPillSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(134, 239, 172, 0.65)',
  },
  spaceTabPillText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.75)',
    maxWidth: 160,
  },
  spaceTabPillTextSelected: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  spaceLuxPillTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  spaceLuxPillTagSelected: {
    backgroundColor: 'rgba(134, 239, 172, 0.25)',
  },
  spaceLuxPillTagText: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  spaceLuxPillTagTextSelected: {
    color: '#86EFAC',
    fontWeight: '400',
  },
  spaceAddPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  spaceAddPillText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.80)',
  },
  selectedSpaceBioclimaticCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 13,
    gap: 12,
    overflow: 'hidden',
  },
  selectedSpaceBioIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(134, 239, 172, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSpaceBioTexts: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  selectedSpaceBioName: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  selectedSpaceBioSub: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
  },

  // Selector de método / pestañas blindado contra desbordes
  modeTabsDock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    padding: 3,
    gap: 4,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  modeTabBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 18,
    overflow: 'hidden',
  },
  modeTabBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.40)',
  },
  modeTabBtnText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
    flexShrink: 1,
    textAlign: 'center',
  },
  modeTabBtnTextActive: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#FFFFFF',
  },

  // Pestaña Recomendadas
  catalogSectionBlock: {
    gap: 16,
  },
  searchBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    gap: 12,
  },
  searchBarInput: {
    flex: 1,
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  clearSearchCross: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.50)',
    paddingHorizontal: 4,
  },
  filterChipsScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  filterChipItem: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
  },
  filterChipItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    borderColor: 'rgba(255, 255, 255, 0.65)',
  },
  filterChipText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
  },
  filterChipTextActive: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  emptySearchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 36,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  emptySearchTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptySearchSub: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: '90%',
  },

  // Grid en 2 columnas
  plantsGrid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    width: '100%',
  },
  plantGridCard: {
    width: '48%',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  plantGridImageWrap: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  plantGridThumb: {
    width: '100%',
    height: '100%',
  },
  plantGridBadgeTopRow: {
    position: 'absolute',
    top: 7,
    left: 7,
    right: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  petBadgeSafe: {
    backgroundColor: 'rgba(134, 239, 172, 0.32)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  petBadgeSafeText: {
    fontFamily: Fonts.light,
    fontSize: 9.5,
    fontWeight: '300',
    color: '#86EFAC',
  },
  petBadgeTox: {
    backgroundColor: 'rgba(248, 113, 113, 0.32)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  petBadgeToxText: {
    fontFamily: Fonts.light,
    fontSize: 9.5,
    fontWeight: '300',
    color: '#FCA5A5',
  },
  luxDemandsPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.50)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  luxDemandsPillText: {
    fontFamily: Fonts.light,
    fontSize: 9.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.80)',
  },
  plantGridCardBody: {
    padding: 12,
    gap: 5,
    minWidth: 0,
    overflow: 'hidden',
  },
  plantGridCardName: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: -0.1,
    minWidth: 0,
  },
  plantGridCardScientific: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
    fontStyle: 'italic',
    minWidth: 0,
  },
  affinityBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginVertical: 1,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  affinityBadgeDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
  },
  affinityBadgeLabel: {
    fontFamily: Fonts.light,
    fontSize: 10,
    fontWeight: '300',
    flexShrink: 1,
  },
  addPlantCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginTop: 4,
    width: '100%',
  },
  addPlantCtaBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: '#161922',
  },
  loadMoreSpeciesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginVertical: 10,
    overflow: 'hidden',
  },
  loadMoreSpeciesText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: '#86EFAC',
  },

  // Pestaña Visor Óptico IA
  opticalScannerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    padding: 24,
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
    width: '100%',
  },
  discreetScannerTelemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    maxWidth: '100%',
  },
  discreetScannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(134, 239, 172, 0.75)',
  },
  discreetScannerTelemetryText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
    flexShrink: 1,
  },
  cleanBracketPreviewBox: {
    width: 130,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  bracketCenterIconWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  opticalCardHeadline: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  opticalCardSubline: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 6,
  },
  opticalActionButtonsRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 11,
    width: '100%',
    marginTop: 6,
  },
  opticalPrimaryScanBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  opticalPrimaryScanBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: '#161922',
    flexShrink: 1,
  },
  opticalSecondaryGalleryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  opticalSecondaryGalleryBtnText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: '#FFFFFF',
    flexShrink: 1,
  },

  // Pestaña Manual
  manualFormSection: {
    gap: 18,
  },
  manualPhotoHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 14,
    overflow: 'hidden',
  },
  manualPhotoHeroPreview: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  manualPhotoPlaceholderCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualPhotoHeroTexts: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  manualPhotoHeroTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  manualPhotoHeroSub: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
  },
  manualPhotoPickerActionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualFormGroup: {
    gap: 7,
  },
  manualFormLabel: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.80)',
  },
  manualFormInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  manualOptionsScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  manualPillOption: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
  },
  manualPillOptionActive: {
    backgroundColor: 'rgba(134, 239, 172, 0.20)',
    borderColor: 'rgba(134, 239, 172, 0.55)',
  },
  manualPillOptionText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
  },
  manualPillOptionTextActive: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#86EFAC',
  },
  manualDualCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  manualChoiceCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 14,
    gap: 6,
    overflow: 'hidden',
  },
  manualChoiceCardSafeActive: {
    backgroundColor: 'rgba(134, 239, 172, 0.16)',
    borderColor: 'rgba(134, 239, 172, 0.55)',
  },
  manualChoiceCardToxActive: {
    backgroundColor: 'rgba(248, 113, 113, 0.16)',
    borderColor: 'rgba(248, 113, 113, 0.55)',
  },
  manualChoiceIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualChoiceTitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  manualChoiceSub: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
    lineHeight: 15,
  },
  manualFormTextarea: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: '#FFFFFF',
    height: 90,
  },
  saveManualHeroBtn: {
    marginTop: 6,
    paddingVertical: 15,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  saveManualHeroBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    fontWeight: '400',
    color: '#161922',
  },
});
