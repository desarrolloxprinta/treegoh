import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Fonts } from '../constants/theme';
import { TreegohIcon } from './TreegohIcon';
import { GlassCardSheen } from './BlobAnimatedCard';
import { BotanicalImage } from './BotanicalImage';
import { ComprehensiveSpecies } from '../constants/botanicalDatabase';
import {
  BibliaSpeciesMonograph,
  getClinicalSymptomById,
  getSpeciesMonograph,
  PhyloPicSilhouette,
  RealSpeciesPhotoItem,
  resolvePhyloPicSilhouetteAsync,
  resolveSpeciesGalleryAsync,
  SCIENTIFIC_IMAGE_REPOSITORIES,
} from '../services/botanicalEncyclopediaService';

interface SpeciesEncyclopediaDetailModalProps {
  visible: boolean;
  species: ComprehensiveSpecies | null;
  activeSpaceName?: string;
  activeSpaceLux?: number;
  onClose: () => void;
  onAddSpeciesToSpace: (species: ComprehensiveSpecies, resolvedHeroUrl?: string) => void;
}

type MonographSectionTab =
  | 'morfologia'
  | 'cuidados'
  | 'cultivo'
  | 'fitosanitario'
  | 'estacional';

export const SpeciesEncyclopediaDetailModal: React.FC<SpeciesEncyclopediaDetailModalProps> = ({
  visible,
  species,
  activeSpaceName = 'Salón',
  activeSpaceLux = 3200,
  onClose,
  onAddSpeciesToSpace,
}) => {
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, Platform.OS === 'ios' ? 46 : 24);
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 28 : 16);

  const [activeTab, setActiveTab] = useState<MonographSectionTab>('morfologia');
  const [galleryPhotos, setGalleryPhotos] = useState<RealSpeciesPhotoItem[]>([]);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number>(0);
  const [isLoadingGallery, setIsLoadingGallery] = useState<boolean>(false);
  const [phyloPic, setPhyloPic] = useState<PhyloPicSilhouette | null>(null);
  const [expandedSymptomId, setExpandedSymptomId] = useState<string | null>(null);

  const monograph: BibliaSpeciesMonograph | null = React.useMemo(() => {
    if (!species) return null;
    return getSpeciesMonograph(species.scientificName, species.commonName);
  }, [species]);

  useEffect(() => {
    if (!visible || !species) return;
    setActiveTab('morfologia');
    setSelectedPhotoIdx(0);
    setExpandedSymptomId(null);

    let cancelled = false;
    setIsLoadingGallery(true);

    resolveSpeciesGalleryAsync(species.scientificName, species.commonName)
      .then(photos => {
        if (!cancelled) {
          setGalleryPhotos(photos);
          setIsLoadingGallery(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoadingGallery(false);
      });

    resolvePhyloPicSilhouetteAsync(
      species.scientificName,
      monograph?.familia || species.family
    ).then(sil => {
      if (!cancelled) setPhyloPic(sil);
    });

    return () => {
      cancelled = true;
    };
  }, [visible, species, monograph]);

  const isVisible = Boolean(visible && species);

  const triggerHaptic = (heavy = false) => {
    try {
      Haptics.impactAsync(
        heavy ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
    } catch (_e) {}
  };

  const activePhotoItem = galleryPhotos[selectedPhotoIdx] || null;
  const heroImageUri = activePhotoItem?.url || species?.imageUrl || '';

  const minLux = monograph?.cuidados?.luz?.lux_min ?? species?.minLux ?? 800;
  const maxLux = monograph?.cuidados?.luz?.lux_max ?? species?.maxLux ?? 6000;
  const isSpaceLuxCompatible =
    activeSpaceLux >= minLux * 0.7 && (maxLux === null || activeSpaceLux <= maxLux * 1.35);

  const formatToxicityPill = (val?: string) => {
    const clean = (val || '').toLowerCase();
    if (clean === 'no_toxica' || clean === 'segura') {
      return { label: 'Segura (ASPCA)', color: '#86EFAC', bg: 'rgba(134, 239, 172, 0.16)' };
    }
    if (clean === 'toxica') {
      return { label: 'Tóxica', color: '#FCA5A5', bg: 'rgba(248, 113, 113, 0.18)' };
    }
    return { label: 'No documentada', color: '#FDE68A', bg: 'rgba(253, 230, 138, 0.15)' };
  };

  const dogTox = formatToxicityPill(
    monograph?.toxicidad?.perros || (species?.isPetSafe ? 'no_toxica' : 'toxica')
  );
  const catTox = formatToxicityPill(
    monograph?.toxicidad?.gatos || (species?.isPetSafe ? 'no_toxica' : 'toxica')
  );
  const childTox = formatToxicityPill(
    monograph?.toxicidad?.ninos || (species?.isPetSafe ? 'no_toxica' : 'toxica')
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      {species ? (
        <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.sheetRoot,
            { paddingTop: safeTop + 6, paddingBottom: safeBottom + 12 },
          ]}
        >
          {/* BARRA SUPERIOR DE NAVEGACIÓN DE LA MONOGRAFÍA */}
          <View style={styles.topHeaderBar}>
            <View style={styles.topHeaderTagPill}>
              <TreegohIcon name="biblia_plantas" size={14} color="#86EFAC" glow={false} />
              <Text style={styles.topHeaderTagText}>Monografía Botánica Científica</Text>
            </View>

            <TouchableOpacity
              style={styles.closeCircleBtn}
              onPress={() => {
                triggerHaptic();
                onClose();
              }}
              activeOpacity={0.75}
            >
              <TreegohIcon name="flecha_volver" size={16} color="#FFFFFF" glow={false} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.mainScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. VISOR FOTOGRÁFICO REAL MULTI-REPOSITORIO (WIKIMEDIA COMMONS + PL@NTNET/INAT) */}
            <View style={styles.heroCardFrame}>
              <BotanicalImage
                uri={heroImageUri}
                scientificName={species.scientificName}
                commonName={species.commonName}
                preferHighRes={true}
                style={styles.heroMainImage}
              />
              <LinearGradient
                colors={['rgba(6, 10, 15, 0.12)', 'rgba(6, 10, 15, 0.45)', 'rgba(6, 10, 15, 0.92)']}
                locations={[0, 0.52, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              {/* Insignia del repositorio científico activo */}
              <View style={styles.repoTopLeftBadge}>
                <View style={styles.repoLiveDot} />
                <Text style={styles.repoTopLeftText}>
                  {activePhotoItem?.repository || 'Wikimedia Commons · Verificada'}
                </Text>
              </View>

              {/* Insignia PhyloPic si hay silueta taxonómica disponible */}
              {phyloPic && (
                <View style={styles.phyloPicBadge}>
                  <Image
                    source={{ uri: phyloPic.imageUrl }}
                    style={styles.phyloPicIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.phyloPicBadgeText}>PhyloPic · {phyloPic.taxonName}</Text>
                </View>
              )}

              {/* Bloque de título taxonómico sobre la fotografía real */}
              <View style={styles.heroBottomInfo}>
                <View style={styles.heroBadgesRow}>
                  <View style={styles.categoryGlassPill}>
                    <Text style={styles.categoryGlassPillText}>
                      {(monograph?.categoria || species.category || 'Botánica').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.difficultyGlassPill}>
                    <Text style={styles.difficultyGlassPillText}>
                      Dificultad: {monograph?.dificultad || species.difficulty}
                    </Text>
                  </View>
                  {monograph?.rareza && (
                    <View style={styles.difficultyGlassPill}>
                      <Text style={styles.difficultyGlassPillText}>
                        Rareza: {monograph.rareza}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.heroCommonTitle}>{species.commonName}</Text>
                <Text style={styles.heroScientificTitle}>
                  {monograph?.nomenclatura?.nombre_mostrar ||
                    monograph?.nombre_cientifico ||
                    species.scientificName}
                </Text>

                {monograph?.nombres_comunes && monograph.nombres_comunes.length > 0 && (
                  <Text style={styles.heroSynonymsText} numberOfLines={2}>
                    Nombres vernáculos: {monograph.nombres_comunes.join(' · ')}
                  </Text>
                )}

                {activePhotoItem?.attribution && (
                  <Text style={styles.photoAttributionText} numberOfLines={1}>
                    Fuente visual: {activePhotoItem.attribution.replace(/<[^>]*>/g, '')}
                  </Text>
                )}
              </View>
            </View>

            {/* TIRA DE MINIATURAS REALES DE ESPECÍMENES (WIKIMEDIA + PL@NTNET / INATURALIST) */}
            {(galleryPhotos.length > 1 || isLoadingGallery) && (
              <View style={styles.galleryStripSection}>
                <View style={styles.galleryStripHeader}>
                  <Text style={styles.galleryStripLabel}>
                    Especímenes reales verificados ({galleryPhotos.length}{' '}
                    {galleryPhotos.length === 1 ? 'fotografía' : 'fotografías'})
                  </Text>
                  {isLoadingGallery && <ActivityIndicator size="small" color="#86EFAC" />}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryThumbsRow}
                >
                  {galleryPhotos.map((item, idx) => {
                    const isSelected = idx === selectedPhotoIdx;
                    return (
                      <TouchableOpacity
                        key={`spec_photo_${idx}`}
                        style={[
                          styles.galleryThumbItem,
                          isSelected && styles.galleryThumbItemActive,
                        ]}
                        onPress={() => {
                          triggerHaptic();
                          setSelectedPhotoIdx(idx);
                        }}
                        activeOpacity={0.82}
                      >
                        <Image
                          source={{ uri: item.thumbnailUrl }}
                          style={styles.galleryThumbImg}
                          resizeMode="cover"
                        />
                        <View style={styles.galleryThumbTag}>
                          <Text style={styles.galleryThumbTagText} numberOfLines={1}>
                            {item.repository === 'Wikimedia Commons' ? 'Commons' : 'Pl@ntNet'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* BOTÓN DE ACCIÓN RÁPIDA: AÑADIR AL ESPACIO ACTIVO */}
            <View style={styles.quickActionCard}>
              <GlassCardSheen />
              <View style={styles.quickActionLeft}>
                <View style={styles.quickActionCompatibilityRow}>
                  <View
                    style={[
                      styles.compatDot,
                      { backgroundColor: isSpaceLuxCompatible ? '#86EFAC' : '#FDE68A' },
                    ]}
                  />
                  <Text style={styles.quickActionTitle}>
                    {isSpaceLuxCompatible
                      ? `Compatible con ${activeSpaceName}`
                      : `Luz exigente en ${activeSpaceName}`}
                  </Text>
                </View>
                <Text style={styles.quickActionSub}>
                  Tu rincón aporta ~{activeSpaceLux.toLocaleString()} lx · Requiere{' '}
                  {minLux.toLocaleString()}
                  {maxLux ? `–${maxLux.toLocaleString()} lx` : '+ lx'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addSpeciesPrimaryBtn}
                onPress={() => {
                  triggerHaptic(true);
                  onAddSpeciesToSpace(species, heroImageUri);
                }}
                activeOpacity={0.85}
              >
                <TreegohIcon name="mas" size={13} color="#121417" glow={false} />
                <Text style={styles.addSpeciesPrimaryBtnText}>Añadir a {activeSpaceName}</Text>
              </TouchableOpacity>
            </View>

            {/* SELECTOR DE LAS 5 SECCIONES DE LA MONOGRAFÍA CIENTÍFICA */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsRow}
            >
              {[
                { id: 'morfologia' as MonographSectionTab, label: 'Morfología & Taxón' },
                { id: 'cuidados' as MonographSectionTab, label: 'Luz, Riego & Clima' },
                { id: 'cultivo' as MonographSectionTab, label: 'Sustrato & Propagación' },
                { id: 'fitosanitario' as MonographSectionTab, label: 'Salud & Toxicidad' },
                { id: 'estacional' as MonographSectionTab, label: 'Estacional & Fuentes' },
              ].map(tab => {
                const isSelected = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tabPill, isSelected && styles.tabPillActive]}
                    onPress={() => {
                      triggerHaptic();
                      setActiveTab(tab.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabPillText, isSelected && styles.tabPillTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ============================================================== */}
            {/* SECCIÓN 1: MORFOLOGÍA, TAXONOMÍA, ORIGEN Y CONFUSIONES         */}
            {/* ============================================================== */}
            {activeTab === 'morfologia' && (
              <View style={styles.sectionStack}>
                {/* Tarjeta de Taxonomía, Familia y Distribución Nativa (POWO Kew) */}
                <View style={styles.glassInfoCard}>
                  <GlassCardSheen />
                  <View style={styles.cardHeaderRow}>
                    <TreegohIcon name="biblia_plantas" size={18} color="#86EFAC" glow={false} />
                    <Text style={styles.cardSectionTitle}>
                      Taxonomía, Familia y Hábitat Nativo (POWO Kew)
                    </Text>
                  </View>

                  <View style={styles.keyValueBlock}>
                    <Text style={styles.keyLabel}>Familia Botánica</Text>
                    <Text style={styles.valueParagraph}>
                      {monograph?.familia || species.family}
                    </Text>
                  </View>

                  {monograph?.origen && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Distribución Geográfica Nativa</Text>
                      <Text style={styles.valueParagraph}>{monograph.origen}</Text>
                    </View>
                  )}

                  {monograph?.clima_nativo && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Ecología y Clima Nativo</Text>
                      <Text style={styles.valueParagraph}>{monograph.clima_nativo}</Text>
                    </View>
                  )}

                  {monograph?.identificacion?.tamano_adulto_interior && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Dimensiones en Cultivo de Interior</Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.identificacion.tamano_adulto_interior}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Tarjeta de Identificación Morfológica Detallada */}
                {monograph?.identificacion && (
                  <View style={styles.glassInfoCard}>
                    <GlassCardSheen />
                    <View style={styles.cardHeaderRow}>
                      <TreegohIcon name="camara_diagnostica" size={18} color="#A7F3D0" glow={false} />
                      <Text style={styles.cardSectionTitle}>
                        Anatomía e Identificación Botánica
                      </Text>
                    </View>

                    {monograph.identificacion.hojas && (
                      <View style={styles.keyValueBlock}>
                        <Text style={styles.keyLabel}>Lámina Foliar y Filotaxis (Hojas)</Text>
                        <Text style={styles.valueParagraph}>{monograph.identificacion.hojas}</Text>
                      </View>
                    )}

                    {monograph.identificacion.nerviacion && (
                      <View style={styles.keyValueBlock}>
                        <Text style={styles.keyLabel}>Arquitectura de Nerviación</Text>
                        <Text style={styles.valueParagraph}>
                          {monograph.identificacion.nerviacion}
                        </Text>
                      </View>
                    )}

                    {monograph.identificacion.variegacion && (
                      <View style={styles.keyValueBlock}>
                        <Text style={styles.keyLabel}>Variegación y Cultivares Comerciales</Text>
                        <Text style={styles.valueParagraph}>
                          {monograph.identificacion.variegacion}
                        </Text>
                      </View>
                    )}

                    {monograph.identificacion.tallo && (
                      <View style={styles.keyValueBlock}>
                        <Text style={styles.keyLabel}>Tallo, Pecíolo, Rizoma o Cáudice</Text>
                        <Text style={styles.valueParagraph}>{monograph.identificacion.tallo}</Text>
                      </View>
                    )}

                    {monograph.identificacion.habito && (
                      <View style={styles.keyValueBlock}>
                        <Text style={styles.keyLabel}>Hábito de Crecimiento y Floración</Text>
                        <Text style={styles.valueParagraph}>{monograph.identificacion.habito}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Especies Similares y Confusiones Frecuentes */}
                {monograph?.identificacion?.confusiones &&
                  monograph.identificacion.confusiones.length > 0 && (
                    <View style={styles.glassInfoCard}>
                      <GlassCardSheen />
                      <View style={styles.cardHeaderRow}>
                        <TreegohIcon
                          name="busqueda_typesense"
                          size={18}
                          color="#FDE68A"
                          glow={false}
                        />
                        <Text style={styles.cardSectionTitle}>
                          Especies Similares y Rasgos Diferenciadores (
                          {monograph.identificacion.confusiones.length})
                        </Text>
                      </View>
                      <Text style={styles.cardIntroSub}>
                        Claves taxonómicas para no confundir {species.commonName} con otras especies
                        morfológicamente parecidas:
                      </Text>

                      {monograph.identificacion.confusiones.map((conf, idx) => (
                        <View key={`conf_${idx}`} style={styles.confusionSubCard}>
                          <Text style={styles.confusionSpeciesTitle}>{conf.especie}</Text>
                          <Text style={styles.confusionDiffText}>{conf.rasgo_diferenciador}</Text>
                        </View>
                      ))}
                    </View>
                  )}
              </View>
            )}

            {/* ============================================================== */}
            {/* SECCIÓN 2: LUZ, RIEGO HIDRODINÁMICO, TEMPERATURA Y HUMEDAD     */}
            {/* ============================================================== */}
            {activeTab === 'cuidados' && (
              <View style={styles.sectionStack}>
                {/* Fotoperiodo y Luz Natural */}
                <View style={styles.glassInfoCard}>
                  <GlassCardSheen />
                  <View style={styles.cardHeaderRow}>
                    <TreegohIcon name="luz_natural" size={18} color="#FDE68A" glow={false} />
                    <Text style={styles.cardSectionTitle}>Ingeniería Lumínica y Fotoperiodo</Text>
                  </View>

                  <View style={styles.metricsPillsWrap}>
                    <View style={styles.metricMiniBox}>
                      <Text style={styles.metricMiniLabel}>Tipo de Luz</Text>
                      <Text style={styles.metricMiniValue}>
                        {(monograph?.cuidados?.luz?.tipo || 'Indirecta').replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <View style={styles.metricMiniBox}>
                      <Text style={styles.metricMiniLabel}>Rango Fotométrico</Text>
                      <Text style={styles.metricMiniValue}>
                        {minLux.toLocaleString()}
                        {maxLux ? `–${maxLux.toLocaleString()} lx` : '+ lx'}
                      </Text>
                    </View>
                  </View>

                  {monograph?.cuidados?.luz?.orientacion_hn && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Orientación y Ventana Recomendada</Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.cuidados.luz.orientacion_hn}
                      </Text>
                    </View>
                  )}

                  {monograph?.cuidados?.luz?.tolera_sol_directo && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Tolerancia al Sol Directo</Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.cuidados.luz.tolera_sol_directo}
                      </Text>
                    </View>
                  )}

                  {monograph?.cuidados?.luz?.notas && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Notas Fotométricas de Investigación</Text>
                      <Text style={styles.valueParagraph}>{monograph.cuidados.luz.notas}</Text>
                    </View>
                  )}
                </View>

                {/* Riego Hidrodinámico y Calidad del Agua */}
                <View style={styles.glassInfoCard}>
                  <GlassCardSheen />
                  <View style={styles.cardHeaderRow}>
                    <TreegohIcon name="riego_hidratacion" size={18} color="#A7F3D0" glow={false} />
                    <Text style={styles.cardSectionTitle}>
                      Pauta de Riego Estacional y Calidad del Agua
                    </Text>
                  </View>

                  <View style={styles.metricsPillsWrap}>
                    <View style={styles.metricMiniBox}>
                      <Text style={styles.metricMiniLabel}>Sensibilidad Exceso</Text>
                      <Text style={styles.metricMiniValue}>
                        {(monograph?.cuidados?.riego?.sensibilidad_exceso || 'Alta').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.metricMiniBox}>
                      <Text style={styles.metricMiniLabel}>Sensibilidad Sequía</Text>
                      <Text style={styles.metricMiniValue}>
                        {(monograph?.cuidados?.riego?.sensibilidad_sequia || 'Media').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.keyValueBlock}>
                    <Text style={styles.keyLabel}>Criterio Maestro de Riego</Text>
                    <Text style={styles.valueParagraph}>
                      {monograph?.cuidados?.riego?.criterio || species.wateringAdviceVPD}
                    </Text>
                  </View>

                  {monograph?.cuidados?.riego?.primavera_verano && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Primavera y Verano (Crecimiento Activo)</Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.cuidados.riego.primavera_verano}
                      </Text>
                    </View>
                  )}

                  {monograph?.cuidados?.riego?.otono_invierno && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Otoño e Invierno (Parada / Frío)</Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.cuidados.riego.otono_invierno}
                      </Text>
                    </View>
                  )}

                  {monograph?.cuidados?.riego?.calidad_agua && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Calidad del Agua, Sales y Mineralización</Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.cuidados.riego.calidad_agua}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Temperatura, Humedad Ambiental y Reposo */}
                <View style={styles.glassInfoCard}>
                  <GlassCardSheen />
                  <View style={styles.cardHeaderRow}>
                    <TreegohIcon
                      name="espacios_microclimas"
                      size={18}
                      color="#93C5FD"
                      glow={false}
                    />
                    <Text style={styles.cardSectionTitle}>
                      Termometría, Humedad Relativa y Reposo
                    </Text>
                  </View>

                  <View style={styles.metricsPillsWrap}>
                    <View style={styles.metricMiniBox}>
                      <Text style={styles.metricMiniLabel}>Rango Térmico Ideal</Text>
                      <Text style={styles.metricMiniValue}>
                        {monograph?.cuidados?.temperatura?.ideal_min_c ?? 18}–
                        {monograph?.cuidados?.temperatura?.ideal_max_c ?? 28} °C
                      </Text>
                    </View>
                    <View style={styles.metricMiniBox}>
                      <Text style={styles.metricMiniLabel}>Mínimo Crítico</Text>
                      <Text style={styles.metricMiniValue}>
                        {monograph?.cuidados?.temperatura?.min_c ?? 12} °C
                      </Text>
                    </View>
                    {monograph?.cuidados?.humedad?.ideal_pct && (
                      <View style={styles.metricMiniBox}>
                        <Text style={styles.metricMiniLabel}>Humedad Ideal</Text>
                        <Text style={styles.metricMiniValue}>
                          {monograph.cuidados.humedad.ideal_pct}% HR
                        </Text>
                      </View>
                    )}
                  </View>

                  {monograph?.cuidados?.temperatura?.notas && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Tolerancia Térmica y Umbrales de Frío</Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.cuidados.temperatura.notas}
                      </Text>
                    </View>
                  )}

                  {monograph?.cuidados?.humedad?.notas && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Humedad Relativa y Transpiración (VPD)</Text>
                      <Text style={styles.valueParagraph}>{monograph.cuidados.humedad.notas}</Text>
                    </View>
                  )}

                  {monograph?.cuidados?.reposo && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>
                        Ciclo de Reposo ({monograph.cuidados.reposo.epoca || 'Otoño-Invierno'})
                      </Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.cuidados.reposo.cambios}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* SECCIÓN 3: SUSTRATO, ABONO, TRASPLANTE, PODA Y PROPAGACIÓN     */}
            {/* ============================================================== */}
            {activeTab === 'cultivo' && (
              <View style={styles.sectionStack}>
                {/* Sustrato y Drenaje */}
                {monograph?.cuidados?.sustrato && (
                  <View style={styles.glassInfoCard}>
                    <GlassCardSheen />
                    <View style={styles.cardHeaderRow}>
                      <TreegohIcon name="biblia_plantas" size={18} color="#86EFAC" glow={false} />
                      <Text style={styles.cardSectionTitle}>
                        Ingeniería de Sustrato, pH y Drenaje
                      </Text>
                    </View>

                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Mezcla Granulométrica Recomendada</Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.cuidados.sustrato.mezcla}
                      </Text>
                    </View>

                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Rango de pH Óptimo</Text>
                      <Text style={styles.valueParagraph}>{monograph.cuidados.sustrato.ph}</Text>
                    </View>

                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Arquitectura de Drenaje y Maceta</Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.cuidados.sustrato.drenaje}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Fertilización y Nutrición */}
                {monograph?.cuidados?.fertilizacion && (
                  <View style={styles.glassInfoCard}>
                    <GlassCardSheen />
                    <View style={styles.cardHeaderRow}>
                      <TreegohIcon name="luz_natural" size={18} color="#A7F3D0" glow={false} />
                      <Text style={styles.cardSectionTitle}>Nutrición Mineral y Fertilización</Text>
                    </View>

                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Formulación y Equilibrio NPK</Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.cuidados.fertilizacion.tipo}
                        {monograph.cuidados.fertilizacion.npk
                          ? ` · NPK: ${monograph.cuidados.fertilizacion.npk}`
                          : ''}
                      </Text>
                    </View>

                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Pauta en Primavera y Verano</Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.cuidados.fertilizacion.primavera_verano}
                      </Text>
                    </View>

                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Pauta en Otoño e Invierno</Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.cuidados.fertilizacion.otono_invierno}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Trasplante y Poda */}
                {(monograph?.cuidados?.trasplante || monograph?.cuidados?.poda) && (
                  <View style={styles.glassInfoCard}>
                    <GlassCardSheen />
                    <View style={styles.cardHeaderRow}>
                      <TreegohIcon
                        name="tarea_completada"
                        size={18}
                        color="#FDE68A"
                        glow={false}
                      />
                      <Text style={styles.cardSectionTitle}>Protocolo de Trasplante y Poda</Text>
                    </View>

                    {monograph?.cuidados?.trasplante && (
                      <>
                        <View style={styles.keyValueBlock}>
                          <Text style={styles.keyLabel}>
                            Frecuencia y Época de Trasplante ({monograph.cuidados.trasplante.epoca})
                          </Text>
                          <Text style={styles.valueParagraph}>
                            {monograph.cuidados.trasplante.frecuencia}
                          </Text>
                        </View>
                        <View style={styles.keyValueBlock}>
                          <Text style={styles.keyLabel}>Señales Radiculares para Trasplantar</Text>
                          <Text style={styles.valueParagraph}>
                            {monograph.cuidados.trasplante.senales}
                          </Text>
                        </View>
                      </>
                    )}

                    {monograph?.cuidados?.poda && (
                      <View style={styles.keyValueBlock}>
                        <Text style={styles.keyLabel}>
                          Técnica de Poda ({monograph.cuidados.poda.epoca})
                        </Text>
                        <Text style={styles.valueParagraph}>
                          {monograph.cuidados.poda.necesita} · {monograph.cuidados.poda.como}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Propagación y Multiplicación */}
                {monograph?.cuidados?.propagacion && (
                  <View style={styles.glassInfoCard}>
                    <GlassCardSheen />
                    <View style={styles.cardHeaderRow}>
                      <TreegohIcon name="mas" size={18} color="#86EFAC" glow={false} />
                      <Text style={styles.cardSectionTitle}>
                        Multiplicación y Propagación Botánica
                      </Text>
                    </View>

                    {Array.isArray(monograph.cuidados.propagacion.metodos) && (
                      <View style={styles.methodsWrapRow}>
                        {monograph.cuidados.propagacion.metodos.map((m, idx) => (
                          <View key={`prop_m_${idx}`} style={styles.methodChip}>
                            <Text style={styles.methodChipText}>{m}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>
                        Época Óptima: {monograph.cuidados.propagacion.epoca}
                      </Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.cuidados.propagacion.pasos}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ============================================================== */}
            {/* SECCIÓN 4: SALUD FITOSANITARIA (PLANTVILLAGE) Y TOXICIDAD      */}
            {/* ============================================================== */}
            {activeTab === 'fitosanitario' && (
              <View style={styles.sectionStack}>
                {/* Toxicología Clínica Verificada (ASPCA / Poisons Info) */}
                <View style={styles.glassInfoCard}>
                  <GlassCardSheen />
                  <View style={styles.cardHeaderRow}>
                    <TreegohIcon
                      name="toxicidad_mascotas"
                      size={18}
                      color={species.isPetSafe ? '#86EFAC' : '#FCA5A5'}
                      glow={false}
                    />
                    <Text style={styles.cardSectionTitle}>
                      Toxicología Clínica Verificada (ASPCA)
                    </Text>
                  </View>

                  <View style={styles.toxMatrixRow}>
                    <View style={[styles.toxMatrixCell, { backgroundColor: dogTox.bg }]}>
                      <Text style={styles.toxMatrixTarget}>Perros</Text>
                      <Text style={[styles.toxMatrixStatus, { color: dogTox.color }]}>
                        {dogTox.label}
                      </Text>
                    </View>
                    <View style={[styles.toxMatrixCell, { backgroundColor: catTox.bg }]}>
                      <Text style={styles.toxMatrixTarget}>Gatos</Text>
                      <Text style={[styles.toxMatrixStatus, { color: catTox.color }]}>
                        {catTox.label}
                      </Text>
                    </View>
                    <View style={[styles.toxMatrixCell, { backgroundColor: childTox.bg }]}>
                      <Text style={styles.toxMatrixTarget}>Niños</Text>
                      <Text style={[styles.toxMatrixStatus, { color: childTox.color }]}>
                        {childTox.label}
                      </Text>
                    </View>
                  </View>

                  {monograph?.toxicidad?.principio_activo && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Principio Activo / Compuesto Fitoquímico</Text>
                      <Text style={styles.valueParagraph}>
                        {monograph.toxicidad.principio_activo}
                      </Text>
                    </View>
                  )}

                  {monograph?.toxicidad?.sintomas && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Cuadro Clínico y Precauciones de Manejo</Text>
                      <Text style={styles.valueParagraph}>{monograph.toxicidad.sintomas}</Text>
                    </View>
                  )}

                  {monograph?.toxicidad?.notas && (
                    <View style={styles.keyValueBlock}>
                      <Text style={styles.keyLabel}>Notas Toxicológicas Contrastadas</Text>
                      <Text style={styles.valueParagraph}>{monograph.toxicidad.notas}</Text>
                    </View>
                  )}
                </View>

                {/* Patologías y Problemas Frecuentes (Cruzado con los 36 Síntomas S01-S36) */}
                {monograph?.problemas_frecuentes && monograph.problemas_frecuentes.length > 0 && (
                  <View style={styles.glassInfoCard}>
                    <GlassCardSheen />
                    <View style={styles.cardHeaderRow}>
                      <TreegohIcon
                        name="escudo_fitosanitario"
                        size={18}
                        color="#FDE68A"
                        glow={false}
                      />
                      <Text style={styles.cardSectionTitle}>
                        Diagnóstico Fitosanitario ({monograph.problemas_frecuentes.length}{' '}
                        Síndromes)
                      </Text>
                    </View>
                    <Text style={styles.cardIntroSub}>
                      Toca cualquier síntoma para desplegar la guía de inspección visual y el
                      tratamiento clínico verificado (PlantVillage · Extensión Universitaria):
                    </Text>

                    {monograph.problemas_frecuentes.map((prob, idx) => {
                      const clinicalSymptom = getClinicalSymptomById(prob.sintoma_id);
                      const isExpanded = expandedSymptomId === `${prob.sintoma_id}_${idx}`;
                      const urgency = (clinicalSymptom?.urgencia || 'media').toLowerCase();
                      const urgencyColor =
                        urgency === 'alta'
                          ? '#FCA5A5'
                          : urgency === 'media'
                          ? '#FDE68A'
                          : '#86EFAC';

                      return (
                        <TouchableOpacity
                          key={`prob_${prob.sintoma_id}_${idx}`}
                          style={styles.symptomAccordionCard}
                          onPress={() => {
                            triggerHaptic();
                            setExpandedSymptomId(
                              isExpanded ? null : `${prob.sintoma_id}_${idx}`
                            );
                          }}
                          activeOpacity={0.82}
                        >
                          <View style={styles.symptomTopRow}>
                            <View style={styles.symptomCodeBadge}>
                              <Text style={styles.symptomCodeText}>{prob.sintoma_id}</Text>
                            </View>
                            <Text style={styles.symptomTitleText} numberOfLines={2}>
                              {clinicalSymptom?.nombre || `Síndrome clínico ${prob.sintoma_id}`}
                            </Text>
                            <View
                              style={[
                                styles.urgencyDotBadge,
                                { borderColor: urgencyColor },
                              ]}
                            >
                              <Text style={[styles.urgencyDotText, { color: urgencyColor }]}>
                                {urgency.toUpperCase()}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.symptomSpeciesCause}>
                            {prob.causa_habitual_en_esta_especie}
                          </Text>

                          {isExpanded && clinicalSymptom && (
                            <View style={styles.symptomExpandedBox}>
                              <View style={styles.keyValueBlock}>
                                <Text style={styles.keyLabel}>Inspección Visual (Cómo se ve)</Text>
                                <Text style={styles.valueParagraph}>
                                  {clinicalSymptom.como_se_ve}
                                </Text>
                              </View>
                              <View style={styles.keyValueBlock}>
                                <Text style={styles.keyLabel}>Dónde examinar en la planta</Text>
                                <Text style={styles.valueParagraph}>
                                  {clinicalSymptom.donde_mirar}
                                </Text>
                              </View>
                              {clinicalSymptom.causas?.[0]?.tratamiento && (
                                <View style={styles.keyValueBlock}>
                                  <Text style={styles.keyLabel}>
                                    Protocolo de Actuación y Tratamiento
                                  </Text>
                                  {clinicalSymptom.causas[0].tratamiento.map((step, sIdx) => (
                                    <Text key={`step_${sIdx}`} style={styles.treatmentStepText}>
                                      {step}
                                    </Text>
                                  ))}
                                </View>
                              )}
                            </View>
                          )}

                          <Text style={styles.expandHintText}>
                            {isExpanded
                              ? 'Ocultar protocolo clínico'
                              : 'Ver inspección visual y tratamiento paso a paso'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* ============================================================== */}
            {/* SECCIÓN 5: AJUSTE ESTACIONAL Y FUENTES CIENTÍFICAS             */}
            {/* ============================================================== */}
            {activeTab === 'estacional' && (
              <View style={styles.sectionStack}>
                {/* Ajustes Estacionales (Verano / Invierno / Ubicación) */}
                {monograph?.ajustes_madrid && (
                  <View style={styles.glassInfoCard}>
                    <GlassCardSheen />
                    <View style={styles.cardHeaderRow}>
                      <TreegohIcon name="luz_natural" size={18} color="#FDE68A" glow={false} />
                      <Text style={styles.cardSectionTitle}>
                        Adaptación Estacional y Ubicación en el Hogar
                      </Text>
                    </View>

                    {monograph.ajustes_madrid.ubicacion_recomendada && (
                      <View style={styles.keyValueBlock}>
                        <Text style={styles.keyLabel}>Ubicación Óptima Recomendada</Text>
                        <Text style={styles.valueParagraph}>
                          {monograph.ajustes_madrid.ubicacion_recomendada}
                        </Text>
                      </View>
                    )}

                    {monograph.ajustes_madrid.verano && (
                      <View style={styles.keyValueBlock}>
                        <Text style={styles.keyLabel}>Protocolo de Verano y Olas de Calor</Text>
                        <Text style={styles.valueParagraph}>
                          {monograph.ajustes_madrid.verano}
                        </Text>
                      </View>
                    )}

                    {monograph.ajustes_madrid.invierno && (
                      <View style={styles.keyValueBlock}>
                        <Text style={styles.keyLabel}>
                          Protocolo de Invierno, Frío y Calefacción
                        </Text>
                        <Text style={styles.valueParagraph}>
                          {monograph.ajustes_madrid.invierno}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Repositorios Visuales y Botánicos Conectados */}
                <View style={styles.glassInfoCard}>
                  <GlassCardSheen />
                  <View style={styles.cardHeaderRow}>
                    <TreegohIcon name="galeria_evolucion" size={18} color="#86EFAC" glow={false} />
                    <Text style={styles.cardSectionTitle}>
                      Repositorios de Imágenes y Ciencia Abierta
                    </Text>
                  </View>
                  <Text style={styles.cardIntroSub}>
                    Bases de datos científicas integradas para la verificación morfológica,
                    agrícola y fitosanitaria:
                  </Text>

                  {SCIENTIFIC_IMAGE_REPOSITORIES.map(repo => (
                    <TouchableOpacity
                      key={repo.id}
                      style={styles.sourceItemCard}
                      onPress={() => {
                        triggerHaptic();
                        Linking.openURL(repo.url).catch(() => {});
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.sourceItemTopRow}>
                        <Text style={styles.sourceInstTitle}>{repo.name}</Text>
                        <View style={styles.sourcePriorityBadge}>
                          <Text style={styles.sourcePriorityText}>{repo.countLabel}</Text>
                        </View>
                      </View>
                      <Text style={styles.sourceRoleText}>{repo.role}</Text>
                      <Text style={styles.sourceUrlText} numberOfLines={1}>
                        {repo.url}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Bibliografía Académica Específica de la Especie */}
                {monograph?.fuentes && monograph.fuentes.length > 0 && (
                  <View style={styles.glassInfoCard}>
                    <GlassCardSheen />
                    <View style={styles.cardHeaderRow}>
                      <TreegohIcon name="biblia_plantas" size={18} color="#A7F3D0" glow={false} />
                      <Text style={styles.cardSectionTitle}>
                        Referencias Académicas de esta Monografía ({monograph.fuentes.length})
                      </Text>
                    </View>

                    {monograph.fuentes.map((fuente, idx) => (
                      <TouchableOpacity
                        key={`fuente_${fuente.id}_${idx}`}
                        style={styles.sourceItemCard}
                        onPress={() => {
                          triggerHaptic();
                          if (fuente.url) {
                            Linking.openURL(fuente.url).catch(() => {});
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.sourceItemTopRow}>
                          <Text style={styles.sourceIdPill}>[{fuente.id}]</Text>
                          <Text style={styles.sourceInstTitle} numberOfLines={2}>
                            {fuente.institucion}
                          </Text>
                        </View>
                        {fuente.url && (
                          <Text style={styles.sourceUrlText} numberOfLines={1}>
                            {fuente.url}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 12, 0.88)',
  },
  sheetRoot: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  topHeaderTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  topHeaderTagText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.92)',
    letterSpacing: 0.2,
  },
  closeCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: 36,
    gap: 14,
  },
  heroCardFrame: {
    width: '100%',
    height: 300,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  heroMainImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  repoTopLeftBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(7, 11, 18, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  repoLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#86EFAC',
  },
  repoTopLeftText: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  phyloPicBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(7, 11, 18, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  phyloPicIcon: {
    width: 15,
    height: 15,
    tintColor: '#A7F3D0',
  },
  phyloPicBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 10,
    fontWeight: '300',
    color: '#A7F3D0',
  },
  heroBottomInfo: {
    padding: 18,
    gap: 4,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  categoryGlassPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
    backgroundColor: 'rgba(134, 239, 172, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.4)',
  },
  categoryGlassPillText: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    fontWeight: '400',
    color: '#86EFAC',
    letterSpacing: 0.5,
  },
  difficultyGlassPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  difficultyGlassPillText: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  heroCommonTitle: {
    fontFamily: Fonts.regular,
    fontSize: 24,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroScientificTitle: {
    fontFamily: Fonts.light,
    fontSize: 14.5,
    fontWeight: '300',
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.86)',
  },
  heroSynonymsText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 2,
  },
  photoAttributionText: {
    fontFamily: Fonts.light,
    fontSize: 10,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
  },
  galleryStripSection: {
    gap: 8,
  },
  galleryStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  galleryStripLabel: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.72)',
  },
  galleryThumbsRow: {
    gap: 9,
    paddingHorizontal: 2,
  },
  galleryThumbItem: {
    width: 68,
    height: 68,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    position: 'relative',
  },
  galleryThumbItemActive: {
    borderColor: '#86EFAC',
    transform: [{ scale: 1.03 }],
  },
  galleryThumbImg: {
    width: '100%',
    height: '100%',
  },
  galleryThumbTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(6, 10, 16, 0.72)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  galleryThumbTagText: {
    fontFamily: Fonts.light,
    fontSize: 8.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.88)',
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
    gap: 10,
  },
  quickActionLeft: {
    flex: 1,
    gap: 3,
  },
  quickActionCompatibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compatDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  quickActionTitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  quickActionSub: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.72)',
  },
  addSpeciesPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  addSpeciesPrimaryBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    fontWeight: '400',
    color: '#121417',
  },
  tabsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  tabPillText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.84)',
  },
  tabPillTextActive: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#121417',
  },
  sectionStack: {
    gap: 14,
  },
  glassInfoCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  cardSectionTitle: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  cardIntroSub: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 18,
  },
  keyValueBlock: {
    gap: 4,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  keyLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontWeight: '400',
    color: '#A7F3D0',
    letterSpacing: 0.2,
  },
  valueParagraph: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 20.5,
  },
  confusionSubCard: {
    padding: 13,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 4,
  },
  confusionSpeciesTitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: '#FDE68A',
  },
  confusionDiffText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 19,
  },
  metricsPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricMiniBox: {
    flex: 1,
    minWidth: 110,
    padding: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 3,
  },
  metricMiniLabel: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.62)',
  },
  metricMiniValue: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  methodsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  methodChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(134, 239, 172, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.35)',
  },
  methodChipText: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    fontWeight: '400',
    color: '#86EFAC',
  },
  toxMatrixRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toxMatrixCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    gap: 3,
  },
  toxMatrixTarget: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.72)',
  },
  toxMatrixStatus: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
  symptomAccordionCard: {
    padding: 13,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.13)',
    gap: 7,
  },
  symptomTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symptomCodeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  symptomCodeText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  symptomTitleText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  urgencyDotBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  urgencyDotText: {
    fontFamily: Fonts.regular,
    fontSize: 9.5,
    fontWeight: '400',
  },
  symptomSpeciesCause: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 19,
  },
  symptomExpandedBox: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    gap: 8,
  },
  treatmentStepText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 19,
    marginTop: 3,
  },
  expandHintText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    fontWeight: '400',
    color: '#86EFAC',
    marginTop: 2,
  },
  sourceItemCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 4,
  },
  sourceItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sourceIdPill: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    fontWeight: '400',
    color: '#86EFAC',
  },
  sourceInstTitle: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  sourcePriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    backgroundColor: 'rgba(134, 239, 172, 0.16)',
  },
  sourcePriorityText: {
    fontFamily: Fonts.light,
    fontSize: 10,
    fontWeight: '300',
    color: '#86EFAC',
  },
  sourceRoleText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sourceUrlText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(147, 197, 253, 0.85)',
  },
});

