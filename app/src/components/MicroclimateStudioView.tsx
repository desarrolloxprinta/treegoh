import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  useWindowDimensions,
  ScrollView,
  TextInput,
  Image,
  Animated,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import { TreegohIcon, IconName } from './TreegohIcon';
import { CustomMicroclimate, UserLocationDetails } from '../types/onboarding';
import { SpatialSolarPlanView } from './SpatialSolarPlanView';
import { generateAnnualSolarReport } from '../utils/solarEngine';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH_2COL = (width - 40 - 12) / 2;

interface Props {
  onBack: () => void;
  onSave: (microclimate: CustomMicroclimate) => void;
  initialData?: Partial<CustomMicroclimate>;
  userLocation?: UserLocationDetails;
}

// Perspectivas fotográficas reales de prueba para la cámara IA
const CAMERA_SNAPSHOTS = [
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
];

interface WizardTab {
  id: number;
  label: string;
  shortLabel: string;
  icon: IconName;
}

const WIZARD_TABS: WizardTab[] = [
  { id: 0, label: 'Cámara & Espacio', shortLabel: '1. Cámara', icon: 'camara_diagnostica' },
  { id: 1, label: 'Orientación Solar', shortLabel: '2. Orientación', icon: 'brujula_solar' },
  { id: 2, label: 'Plano 4 Estaciones', shortLabel: '3. Ritmo Solar', icon: 'luz_natural' },
  { id: 3, label: 'Diagnóstico Final', shortLabel: '4. Diagnóstico', icon: 'escudo_fitosanitario' },
];

export const MicroclimateStudioView: React.FC<Props> = ({ onBack, onSave, userLocation }) => {
  const { width } = useWindowDimensions();
  // Estado de navegación horizontal del wizard fluido (0 reloads)
  const [wizardStep, setWizardStep] = useState<number>(0);
  const horizontalScrollRef = useRef<any>(null);

  // Estado de datos biométricos y solares
  const [headingDegrees, setHeadingDegrees] = useState<number>(180); // Sur por defecto
  const [orientationMode, setOrientationMode] = useState<'S' | 'E' | 'O' | 'N'>('S');
  const [windowDistance, setWindowDistance] = useState<'junto_a_ventana' | 'media_distancia' | 'rincon_profundo'>('media_distancia');
  const [floorLevel, setFloorLevel] = useState<'baja' | 'media' | 'alta'>(
    userLocation?.floorOrApt?.toLowerCase().includes('ático')
      ? 'alta'
      : userLocation?.floorOrApt?.toLowerCase().includes('bajo')
      ? 'baja'
      : 'media'
  );
  const [nearRadiator, setNearRadiator] = useState<boolean>(false);
  const [nearAC, setNearAC] = useState<boolean>(false);
  const [drafts, setDrafts] = useState<boolean>(false);
  const [humidityLevel, setHumidityLevel] = useState<'baja' | 'media' | 'alta'>('media');
  const [name, setName] = useState<string>('Ventanal Salón Principal');
  const [selectedSeason, setSelectedSeason] = useState<'hoy' | 'invierno' | 'primavera' | 'verano'>('hoy');

  // Estado de cámara interactiva y escáner
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasRealPhoto, setHasRealPhoto] = useState<boolean>(false);
  const [cameraPhotoIndex, setCameraPhotoIndex] = useState<number>(0);
  const [isAnalyzingBiometrics, setIsAnalyzingBiometrics] = useState<boolean>(false);

  // Animaciones de escáner láser y flash de obturador de cámara
  const scanAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const triggerLightHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
  };

  const triggerMediumHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_e) {}
  };

  // Navegar entre pasos del wizard de forma fluida y sin recargas
  const goToWizardStep = (stepIdx: number) => {
    if (stepIdx < 0 || stepIdx >= WIZARD_TABS.length) return;
    triggerLightHaptic();
    setWizardStep(stepIdx);
    horizontalScrollRef.current?.scrollTo({ x: stepIdx * width, animated: true });
  };

  const handleHorizontalScrollEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIdx = Math.round(offsetX / width);
    if (newIdx >= 0 && newIdx < WIZARD_TABS.length && newIdx !== wizardStep) {
      setWizardStep(newIdx);
      triggerLightHaptic();
    }
  };

  // Ciclo continuo de escaneo láser en el visor
  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    scanLoop.start();
    return () => scanLoop.stop();
  }, [scanAnim]);

  // Coordenadas hiper-locales del usuario
  const userLat = userLocation?.latitude ?? 40.3884;
  const userLon = userLocation?.longitude ?? -3.7382;

  // Informe solar estacional anual para la orientación y piso actuales
  const annualSolar = generateAnnualSolarReport(userLat, userLon, headingDegrees, windowDistance, floorLevel);

  // Perfiles de sol estacionales dinámicos para las 4 orientaciones cardinales según el GPS del usuario
  const solarSur = generateAnnualSolarReport(userLat, userLon, 180, windowDistance, floorLevel);
  const solarEste = generateAnnualSolarReport(userLat, userLon, 90, windowDistance, floorLevel);
  const solarOeste = generateAnnualSolarReport(userLat, userLon, 270, windowDistance, floorLevel);
  const solarNorte = generateAnnualSolarReport(userLat, userLon, 0, windowDistance, floorLevel);

  // Suscripción al sensor de orientación / brújula
  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          await Location.watchHeadingAsync((headingData) => {
            if (!isSubscribed) return;
            const h = Math.round(headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading);
            setHeadingDegrees(h);

            // Mapear rumbo a orientación cardinal
            if (h >= 315 || h < 45) {
              setOrientationMode('N');
            } else if (h >= 45 && h < 135) {
              setOrientationMode('E');
            } else if (h >= 135 && h < 225) {
              setOrientationMode('S');
            } else {
              setOrientationMode('O');
            }
          });
        }
      } catch (_e) {
        // En emuladores sin magnetómetro se mantiene rumbo predeterminado Sur (180°)
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // DISPARAR OBTURADOR DE CÁMARA CON ANIMACIÓN DE FLASH Y CAPTURA
  const handleShutterCapture = () => {
    triggerMediumHaptic();

    // 1. Efecto flash de obturador fotográfico
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // 2. Cambio a la siguiente escena fotográfica real
    const nextIdx = (cameraPhotoIndex + 1) % CAMERA_SNAPSHOTS.length;
    setCameraPhotoIndex(nextIdx);
    setCapturedImage(CAMERA_SNAPSHOTS[nextIdx]);
    setHasRealPhoto(true);

    // 3. Proceso de análisis biométrico rápido
    setIsAnalyzingBiometrics(true);
    setTimeout(() => {
      setIsAnalyzingBiometrics(false);
      triggerLightHaptic();
    }, 900);
  };

  // DISPARAR CÁMARA NATIVA DEL SISTEMA
  const handleLaunchNativeCamera = async () => {
    triggerLightHaptic();
    try {
      if (Platform.OS === 'android') {
        await Linking.openURL('content://media/external/images/media');
      }
    } catch (_e) {
      handleShutterCapture();
    }
  };

  // SELECCIONAR FOTO DE LA GALERÍA
  const handlePickGallery = async () => {
    triggerLightHaptic();
    try {
      if (Platform.OS === 'android') {
        await Linking.openURL('content://media/external/images/media');
      }
    } catch (_e) {
      handleShutterCapture();
    }
  };

  // Metadatos de orientación solar
  const orientationMetadata: Record<'S' | 'E' | 'O' | 'N', { name: string; tag: string; icon: IconName; desc: string }> = {
    S: {
      name: 'Sur / Sureste',
      tag: 'Alta Insolación',
      icon: 'brujula_solar',
      desc: 'Rayos bajos y penetrantes en invierno; sol perpendicular y caliente en verano.',
    },
    E: {
      name: 'Este',
      tag: 'Sol Matutino',
      icon: 'luz_natural',
      desc: 'Radiación fresca matinal. Ideal para follaje delicado y fotosíntesis activa.',
    },
    O: {
      name: 'Oeste',
      tag: 'Sol Vespertino',
      icon: 'temperatura_termica',
      desc: 'Calor concentrado al atardecer. Mayor evaporación hídrica y estrés térmico.',
    },
    N: {
      name: 'Norte',
      tag: 'Luz Difusa',
      icon: 'escudo_fitosanitario',
      desc: 'Luz homogénea y estable todo el año sin incidencia abrasiva directa.',
    },
  };

  // Cálculo de fotones Lux según orientación y distancia
  const calculateLux = (): number => {
    let base = 2500;
    if (orientationMode === 'S') base = 4800;
    if (orientationMode === 'E') base = 3600;
    if (orientationMode === 'O') base = 4200;
    if (orientationMode === 'N') base = 1600;

    if (windowDistance === 'junto_a_ventana') return Math.round(base * 1.0);
    if (windowDistance === 'media_distancia') return Math.round(base * 0.58);
    return Math.round(base * 0.25);
  };

  // Cálculo de score y habitabilidad botánica (0 emojis)
  const calculateDiagnosis = () => {
    let score = 92;
    if (nearRadiator) score -= 18;
    if (nearAC) score -= 14;
    if (drafts) score -= 8;
    if (windowDistance === 'rincon_profundo' && orientationMode === 'N') score -= 22;

    const tips: string[] = [];
    if (nearRadiator) {
      tips.push('Peligro térmico: alejar la maceta al menos 1.2 m del radiador o interponer pantalla aislante.');
    }
    if (nearAC) {
      tips.push('Corriente fría: evitar flujo directo para impedir cierre prematuro de estomas foliares.');
    }
    if (windowDistance === 'junto_a_ventana' && (orientationMode === 'S' || orientationMode === 'O')) {
      tips.push('Filtrar radiación estival: instalar visillo translúcido en verano para prevenir quemaduras.');
    }
    if (tips.length === 0) {
      tips.push('Microclima premium: excelente balance entre renovación aerodinámica y fotoperiodo útil.');
    }

    const recommended: string[] = [];
    if (orientationMode === 'S' || orientationMode === 'O') {
      recommended.push('Monstera Deliciosa', 'Ficus Lyrata', 'Strelitzia Reginae', 'Olivo');
    } else if (orientationMode === 'E') {
      recommended.push('Calathea Orbifolia', 'Pothos Golden', 'Philodendron', 'Helecho');
    } else {
      recommended.push('Zamioculca', 'Sansevieria', 'Aglaonema', 'Aspidistra');
    }

    return {
      score: Math.max(35, Math.min(100, score)),
      verdict:
        score >= 80
          ? 'Zona con habitabilidad óptima y alto potencial fotosintético.'
          : score >= 60
          ? 'Espacio viable con precauciones frente a gradientes térmicos.'
          : 'Microclima exigente: precisa selección estricta de especies tolerantes.',
      tips,
      recommended,
    };
  };

  const diagnosis = calculateDiagnosis();
  const currentLux = calculateLux();

  const handleSave = () => {
    triggerMediumHaptic();
    const finalMicroclimate: CustomMicroclimate = {
      id: `custom_${Date.now()}`,
      name: name.trim() || 'Ventanal Salón Principal',
      roomType: 'salon',
      orientation: orientationMode,
      headingDegrees,
      windowDistance,
      floorLevel,
      estimatedLux: currentLux,
      thermalRisks: {
        nearRadiator,
        nearAC,
        drafts,
      },
      humidityLevel: humidityLevel === 'alta' ? 'alta' : humidityLevel === 'media' ? 'media' : 'seca',
      habitabilityScore: diagnosis.score,
      verdict: diagnosis.verdict,
      recommendedSpecies: diagnosis.recommended,
      preventiveTips: diagnosis.tips,
      directSunHours: annualSolar.todayProfile.directWindowHours,
      photoUri: capturedImage || CAMERA_SNAPSHOTS[cameraPhotoIndex],
      aiAnalysisDone: hasRealPhoto,
      fullAddress: userLocation?.fullAddress,
      annualSolarSummary: {
        winterHours: annualSolar.winterProfile.directWindowHours,
        summerHours: annualSolar.summerProfile.directWindowHours,
        todayHours: annualSolar.todayProfile.directWindowHours,
        maxElevation: annualSolar.summerProfile.maxSolarElevation,
      },
    };

    onSave(finalMicroclimate);
  };

  return (
    <View style={styles.container}>
      {/* CABECERA CON SELECTOR SEGMENTADO DE WIZARD HORIZONTAL FLUIDO */}
      <View style={styles.topHeader}>
        <View style={styles.wizardSegmentTabsRow}>
          {WIZARD_TABS.map((tab) => {
            const isActive = tab.id === wizardStep;
            const isCompleted = tab.id < wizardStep;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.wizardSegmentTab,
                  isActive && styles.wizardSegmentTabActive,
                  isCompleted && styles.wizardSegmentTabCompleted,
                ]}
                onPress={() => goToWizardStep(tab.id)}
                activeOpacity={0.8}
              >
                <View style={styles.wizardTabContent}>
                  <TreegohIcon
                    name={isCompleted ? 'tarea_completada' : tab.icon}
                    size={14}
                    color={isActive ? '#121A15' : isCompleted ? '#A7F3D0' : '#8FA89B'}
                  />
                  <Text
                    style={[
                      styles.wizardSegmentTabText,
                      isActive && styles.wizardSegmentTabTextActive,
                      isCompleted && styles.wizardSegmentTabTextCompleted,
                    ]}
                    numberOfLines={1}
                  >
                    {tab.shortLabel}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* CONTENEDOR HORIZONTAL FLUIDO CON DESLIZAMIENTO NATIVO (0 RECARGAS) */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        snapToInterval={width}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleHorizontalScrollEnd}
        scrollEventThrottle={16}
        style={styles.horizontalSlider}
        contentContainerStyle={{ width: width * 4 }}
      >
        {/* ============================================================ */}
        {/* SEGMENTO 1: CÁMARA IA, VISIÓN ESPACIAL & DISTANCIA */}
        {/* ============================================================ */}
        <View style={[styles.slidePage, { width }]}>
          <ScrollView
            style={styles.slideScroll}
            contentContainerStyle={styles.slideScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.slideHeaderBlock}>
              <Text style={styles.slideMainTitle}>Visión espacial & distancia</Text>
              <Text style={styles.slideSubTitle}>
                Fotografía el rincón de tu planta para deducir luminosidad Lux y calibrar la distancia al ventanal.
              </Text>
            </View>

            {/* NOMBRE DEL ESPACIO */}
            <View style={styles.inputCardWrapper}>
              <Text style={styles.cardSectionLabel}>Nombre del espacio</Text>
              <View style={styles.inputFieldContainer}>
                <View style={styles.inputIconPrefix}>
                  <TreegohIcon name="espacios_microclimas" size={20} color="#A7F3D0" />
                </View>
                <TextInput
                  style={styles.textInputField}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ej. Ventanal Salón Principal"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            {/* VISOR FOTOGRAMÉTRICO DE CÁMARA IA */}
            <View style={styles.cameraStudioBlock}>
              <Text style={styles.cardSectionLabel}>Cámara IA & Visión Espacial</Text>
              <View style={styles.viewfinderFrame}>
                <Image
                  source={{ uri: capturedImage || CAMERA_SNAPSHOTS[cameraPhotoIndex] }}
                  style={styles.viewfinderImage}
                  resizeMode="cover"
                />

                {/* ANIMACIÓN DE LÁSER ESCÁNER BIOMÉTRICO */}
                <Animated.View
                  style={[
                    styles.laserScanLine,
                    {
                      transform: [
                        {
                          translateY: scanAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 190],
                          }),
                        },
                      ],
                    },
                  ]}
                />

                {/* EFECTO FLASH DEL OBTURADOR */}
                <Animated.View
                  pointerEvents="none"
                  style={[styles.flashOverlay, { opacity: flashAnim }]}
                />

                {/* OVERLAYS TELEMÉTRICOS EN EL VISOR */}
                <View style={styles.viewfinderTelemetryTop}>
                  <View style={styles.telemetryPill}>
                    <TreegohIcon name="sensor_lux" size={13} color="#121A15" />
                    <Text style={styles.telemetryPillText}>~{currentLux.toLocaleString()} Lux</Text>
                  </View>

                  <View style={styles.telemetryPill}>
                    <TreegohIcon name="brujula_solar" size={13} color="#121A15" />
                    <Text style={styles.telemetryPillText}>
                      {orientationMode} ({headingDegrees}°)
                    </Text>
                  </View>
                </View>

                {/* RETÍCULA CENTRAL Y MEDIDOR */}
                <View style={styles.centerReticleCross}>
                  <View style={styles.crossH} />
                  <View style={styles.crossV} />
                </View>

                <View style={styles.viewfinderTelemetryBottom}>
                  <View style={styles.distanceBadgePill}>
                    <TreegohIcon name="ventana_distancia" size={14} color="#A7F3D0" />
                    <Text style={styles.distanceBadgePillText}>
                      Distancia {windowDistance === 'junto_a_ventana' ? '< 50 cm' : windowDistance === 'media_distancia' ? '1 - 2 m' : '> 3 m'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* BOTONES DE DISPARO Y FUENTES DE CÁMARA */}
              <TouchableOpacity
                style={styles.btnShutterPrimary}
                onPress={handleShutterCapture}
                activeOpacity={0.85}
              >
                <TreegohIcon name="camara_diagnostica" size={22} color="#121A15" />
                <Text style={styles.btnShutterPrimaryText}>
                  {hasRealPhoto ? 'Disparar Nueva Captura' : 'Disparar Cámara IA'}
                </Text>
              </TouchableOpacity>

              <View style={styles.cameraSecondaryActionsRow}>
                <TouchableOpacity
                  style={styles.btnSecondaryActionPill}
                  onPress={handleLaunchNativeCamera}
                  activeOpacity={0.8}
                >
                  <TreegohIcon name="camara_diagnostica" size={16} color="#A7F3D0" />
                  <Text style={styles.btnSecondaryActionText}>Cámara del móvil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnSecondaryActionPill}
                  onPress={handlePickGallery}
                  activeOpacity={0.8}
                >
                  <TreegohIcon name="galeria_evolucion" size={16} color="#A7F3D0" />
                  <Text style={styles.btnSecondaryActionText}>Subir de galería</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* DISTANCIA A LA VENTANA O LUZ */}
            <View style={styles.distanceSectionBlock}>
              <Text style={styles.cardSectionLabel}>Distancia a la ventana o luz</Text>
              <View style={styles.distanceCardsCol}>
                {[
                  {
                    id: 'junto_a_ventana',
                    title: 'Junto a ventana',
                    tag: '< 50 cm',
                    sub: 'Insolación directa alta y máxima absorción.',
                    icon: 'ventana_distancia' as IconName,
                  },
                  {
                    id: 'media_distancia',
                    title: 'Media distancia',
                    tag: '1 - 2 metros',
                    sub: 'Luz brillante filtrada. El estándar óptimo de interior.',
                    icon: 'luz_natural' as IconName,
                  },
                  {
                    id: 'rincon_profundo',
                    title: 'Rincón profundo',
                    tag: '> 3 metros',
                    sub: 'Penumbra suave o sombra. Apto para especies resistentes.',
                    icon: 'espacios_microclimas' as IconName,
                  },
                ].map((item) => {
                  const isSelected = windowDistance === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.spaciousRowCard,
                        isSelected ? styles.spaciousRowCardSelected : styles.spaciousRowCardUnselected,
                      ]}
                      onPress={() => {
                        triggerLightHaptic();
                        setWindowDistance(item.id as any);
                      }}
                      activeOpacity={0.85}
                    >
                      {!isSelected && (
                        <LinearGradient
                          colors={['rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0.04)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                          pointerEvents="none"
                        />
                      )}

                      <View style={styles.rowCardLeft}>
                        <View style={styles.cleanIconWrap}>
                          <TreegohIcon
                            name={item.icon}
                            size={28}
                            color={isSelected ? '#121A15' : '#EAF4ED'}
                          />
                        </View>
                        <View style={styles.rowCardTextWrap}>
                          <View style={styles.rowCardTitleRow}>
                            <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                              {item.title}
                            </Text>
                            <View style={[styles.distanceTagPill, isSelected && styles.distanceTagPillSelected]}>
                              <Text style={[styles.distanceTagText, isSelected && styles.distanceTagTextSelected]}>
                                {item.tag}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.cardSub, isSelected && styles.cardSubSelected]}>
                            {item.sub}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.gridCheckCircle, isSelected && styles.gridCheckCircleSelected]}>
                        {isSelected ? (
                          <TreegohIcon name="tarea_completada" size={14} color="#121A15" />
                        ) : (
                          <View style={styles.gridRadioDotEmpty} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* ============================================================ */}
        {/* SEGMENTO 2: ORIENTACIÓN CARDINAL & FACHADA */}
        {/* ============================================================ */}
        <View style={[styles.slidePage, { width }]}>
          <ScrollView
            style={styles.slideScroll}
            contentContainerStyle={styles.slideScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.slideHeaderBlock}>
              <View style={styles.slideHeaderWithTag}>
                <Text style={styles.slideMainTitle}>Orientación cardinal y fachada</Text>
                <View style={styles.compassLivePill}>
                  <TreegohIcon name="brujula_solar" size={14} color="#A7F3D0" />
                  <Text style={styles.compassLivePillText}>Brújula {headingDegrees}° {orientationMode}</Text>
                </View>
              </View>
              <Text style={styles.slideSubTitle}>
                Selecciona la orientación de tu fachada. Calculamos con astronomía real las horas de sol estacional en tu ubicación exacta.
              </Text>
            </View>

            <View style={styles.gridTwoColumnsSpacious}>
              {[
                {
                  id: 'S',
                  heading: 180,
                  name: 'Sur / SE',
                  sun: `Ene: ${solarSur.winterProfile.directWindowHours}h • Jun: ${solarSur.summerProfile.directWindowHours}h`,
                  note: 'Máxima insolación y rayos bajos',
                  icon: 'brujula_solar' as IconName,
                },
                {
                  id: 'E',
                  heading: 90,
                  name: 'Este',
                  sun: `Ene: ${solarEste.winterProfile.directWindowHours}h • Jun: ${solarEste.summerProfile.directWindowHours}h`,
                  note: 'Sol matutino fresco y suave',
                  icon: 'luz_natural' as IconName,
                },
                {
                  id: 'O',
                  heading: 270,
                  name: 'Oeste',
                  sun: `Ene: ${solarOeste.winterProfile.directWindowHours}h • Jun: ${solarOeste.summerProfile.directWindowHours}h`,
                  note: 'Sol vespertino de alta radiación',
                  icon: 'temperatura_termica' as IconName,
                },
                {
                  id: 'N',
                  heading: 0,
                  name: 'Norte',
                  sun: `Luz difusa (${solarNorte.summerProfile.daylightHours}h luz)`,
                  note: 'Sin sol abrasivo directo',
                  icon: 'escudo_fitosanitario' as IconName,
                },
              ].map((item) => {
                const isSelected = orientationMode === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.gridGlassCardSpacious,
                      isSelected ? styles.gridGlassCardSelected : styles.gridGlassCardUnselected,
                    ]}
                    onPress={() => {
                      triggerLightHaptic();
                      setOrientationMode(item.id as any);
                      setHeadingDegrees(item.heading);
                    }}
                    activeOpacity={0.85}
                  >
                    {!isSelected && (
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0.04)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                      />
                    )}

                    <View style={styles.gridCardTopRow}>
                      <View style={styles.cleanIconWrap}>
                        <TreegohIcon
                          name={item.icon}
                          size={28}
                          color={isSelected ? '#121A15' : '#EAF4ED'}
                        />
                      </View>
                      <View style={[styles.gridCheckCircle, isSelected && styles.gridCheckCircleSelected]}>
                        {isSelected ? (
                          <TreegohIcon name="tarea_completada" size={14} color="#121A15" />
                        ) : (
                          <View style={styles.gridRadioDotEmpty} />
                        )}
                      </View>
                    </View>

                    <View style={styles.gridCardTextWrap}>
                      <Text style={[styles.gridCardTitle, isSelected && styles.cardTitleSelected]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.gridCardSubHighlight, isSelected && styles.gridCardSubHighlightSelected]}>
                        {item.sun}
                      </Text>
                      <Text style={[styles.gridCardSub, isSelected && styles.cardSubSelected]}>
                        {item.note}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* TARJETA INFORMATIVA BOTÁNICA DE ORIENTACIÓN */}
            <View style={styles.botanicalBannerCard}>
              <LinearGradient
                colors={['rgba(167, 243, 208, 0.14)', 'rgba(255, 255, 255, 0.04)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.botanicalBannerHeader}>
                <TreegohIcon name="luz_natural" size={20} color="#A7F3D0" />
                <Text style={styles.botanicalBannerTitle}>
                  {orientationMetadata[orientationMode].tag}
                </Text>
              </View>
              <Text style={styles.botanicalBannerDesc}>
                {orientationMetadata[orientationMode].desc}
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* ============================================================ */}
        {/* SEGMENTO 3: PLANO ESPACIAL & RITMO SOLAR ANUAL */}
        {/* ============================================================ */}
        <View style={[styles.slidePage, { width }]}>
          <ScrollView
            style={styles.slideScroll}
            contentContainerStyle={styles.slideScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.slideHeaderBlock}>
              <Text style={styles.slideMainTitle}>Plano espacial & ritmo solar</Text>
              <Text style={styles.slideSubTitle}>
                Simulación arquitectónica cenital en tiempo real para tu planta y ventanal en las 4 estaciones.
              </Text>
            </View>

            <SpatialSolarPlanView
              headingDegrees={headingDegrees}
              orientationCode={orientationMode}
              windowDistance={windowDistance}
              floorLevel={floorLevel}
              selectedSeason={selectedSeason}
              onSelectSeason={setSelectedSeason}
              onSelectFloorLevel={setFloorLevel}
              solarReport={annualSolar}
              userAddress={userLocation?.fullAddress || userLocation?.street || 'Avenida Nuestra Señora de Valvanera, 93'}
              floorOrApt={userLocation?.floorOrApt || '3º D'}
            />
          </ScrollView>
        </View>

        {/* ============================================================ */}
        {/* SEGMENTO 4: ESTRÉS TÉRMICO & DIAGNÓSTICO FINAL */}
        {/* ============================================================ */}
        <View style={[styles.slidePage, { width }]}>
          <ScrollView
            style={styles.slideScroll}
            contentContainerStyle={styles.slideScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.slideHeaderBlock}>
              <Text style={styles.slideMainTitle}>Estrés térmico & diagnóstico</Text>
              <Text style={styles.slideSubTitle}>
                Identifica fuentes de calor seco o corrientes y revisa el dictamen de habitabilidad final de tu planta.
              </Text>
            </View>

            {/* FUENTES DE ESTRÉS TÉRMICO */}
            <View style={styles.thermalStressBlock}>
              <Text style={styles.cardSectionLabel}>Fuentes de estrés ambiental</Text>
              <View style={styles.gridTwoColumnsSpacious}>
                {[
                  {
                    id: 'radiator',
                    name: 'Radiador cerca',
                    desc: 'Calor seco deshidratante',
                    active: nearRadiator,
                    onToggle: () => setNearRadiator(!nearRadiator),
                    icon: 'alerta_termica' as IconName,
                  },
                  {
                    id: 'ac',
                    name: 'Aire acondicionado',
                    desc: 'Chorro frío en estomas',
                    active: nearAC,
                    onToggle: () => setNearAC(!nearAC),
                    icon: 'temperatura_termica' as IconName,
                  },
                  {
                    id: 'drafts',
                    name: 'Corrientes de aire',
                    desc: 'Puertas o ventanas abiertas',
                    active: drafts,
                    onToggle: () => setDrafts(!drafts),
                    icon: 'pulverizacion_spray' as IconName,
                  },
                  {
                    id: 'high_humidity',
                    name: 'Humedad alta (>70%)',
                    desc: 'Baño o humidificador',
                    active: humidityLevel === 'alta',
                    onToggle: () => setHumidityLevel(humidityLevel === 'alta' ? 'media' : 'alta'),
                    icon: 'humedad_vpd' as IconName,
                  },
                ].map((item) => {
                  const isSelected = item.active;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.gridGlassCardSpacious,
                        isSelected ? styles.gridGlassCardSelected : styles.gridGlassCardUnselected,
                      ]}
                      onPress={() => {
                        triggerLightHaptic();
                        item.onToggle();
                      }}
                      activeOpacity={0.85}
                    >
                      {!isSelected && (
                        <LinearGradient
                          colors={['rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0.04)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                          pointerEvents="none"
                        />
                      )}

                      <View style={styles.gridCardTopRow}>
                        <View style={styles.cleanIconWrap}>
                          <TreegohIcon
                            name={item.icon}
                            size={28}
                            color={isSelected ? '#121A15' : '#EAF4ED'}
                          />
                        </View>
                        <View style={[styles.gridCheckCircle, isSelected && styles.gridCheckCircleSelected]}>
                          {isSelected ? (
                            <TreegohIcon name="tarea_completada" size={14} color="#121A15" />
                          ) : (
                            <View style={styles.gridRadioDotEmpty} />
                          )}
                        </View>
                      </View>

                      <View style={styles.gridCardTextWrap}>
                        <Text style={[styles.gridCardTitle, isSelected && styles.cardTitleSelected]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.gridCardSub, isSelected && styles.cardSubSelected]}>
                          {item.desc}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* DIAGNÓSTICO BIOMÉTRICO COMPUTADO (CARD PREDOMINANTE AMPLIA) */}
            <View style={styles.diagnosisWideCardWrapper}>
              <Text style={styles.cardSectionLabel}>Dictamen botánico computado</Text>
              <View style={styles.diagnosisWideCard}>
                <LinearGradient
                  colors={['rgba(167, 243, 208, 0.20)', 'rgba(255, 255, 255, 0.06)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />

                <View style={styles.diagnosisTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.diagnosisTagText}>SCORE DE HABITABILIDAD</Text>
                    <Text style={styles.diagnosisScoreVal}>{diagnosis.score}/100</Text>
                  </View>

                  <View style={styles.diagnosisLuxPill}>
                    <TreegohIcon name="sensor_lux" size={16} color="#121A15" />
                    <Text style={styles.diagnosisLuxPillText}>~{currentLux.toLocaleString()} Lux</Text>
                  </View>
                </View>

                <Text style={styles.diagnosisVerdictText}>{diagnosis.verdict}</Text>

                <View style={styles.speciesContainer}>
                  <Text style={styles.speciesSubtitle}>Especies óptimas para este rincón:</Text>
                  <View style={styles.speciesChipsWrap}>
                    {diagnosis.recommended.map((sp, idx) => (
                      <View key={idx} style={styles.speciesChip}>
                        <TreegohIcon name="espacios_microclimas" size={14} color="#121A15" />
                        <Text style={styles.speciesChipText}>{sp}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.tipsContainer}>
                  {diagnosis.tips.map((tip, idx) => (
                    <View key={idx} style={styles.tipRow}>
                      <View style={styles.tipIconWrap}>
                        <TreegohIcon name="escudo_fitosanitario" size={16} color="#A7F3D0" />
                      </View>
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* BARRA INFERIOR DE NAVEGACIÓN FLUIDA DEL WIZARD (STICKY FOOTER) */}
      <View style={styles.stickyFooterBar}>
        <LinearGradient
          colors={['rgba(18, 26, 21, 0)', 'rgba(18, 26, 21, 0.95)', '#121A15']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={styles.footerButtonsRow}>
          {wizardStep > 0 ? (
            <TouchableOpacity
              style={styles.btnWizardPrev}
              onPress={() => goToWizardStep(wizardStep - 1)}
              activeOpacity={0.8}
            >
              <TreegohIcon name="flecha_volver" size={16} color="#EAF4ED" />
              <Text style={styles.btnWizardPrevText}>Anterior</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 0.4 }} />
          )}

          {wizardStep < WIZARD_TABS.length - 1 ? (
            <TouchableOpacity
              style={styles.btnWizardNext}
              onPress={() => goToWizardStep(wizardStep + 1)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnWizardNextText}>
                Siguiente: {WIZARD_TABS[wizardStep + 1].label.split(' ')[0]}
              </Text>
              <TreegohIcon name="flecha_adelante" size={16} color="#121A15" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.btnWizardSave}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <TreegohIcon name="tarea_completada" size={18} color="#121A15" />
              <Text style={styles.btnWizardSaveText}>Guardar Microclima</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topHeaderTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  studioSuperTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#EAF4ED',
    letterSpacing: -0.3,
  },
  studioStepCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A7F3D0',
    marginTop: 2,
  },
  btnSkipAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  btnSkipActionText: {
    color: '#8FA89B',
    fontSize: 13,
    fontWeight: '600',
  },
  wizardSegmentTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  wizardSegmentTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardSegmentTabActive: {
    backgroundColor: '#E8EFE7',
    borderColor: '#E8EFE7',
    shadowColor: '#A7F3D0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  wizardSegmentTabCompleted: {
    backgroundColor: 'rgba(167, 243, 208, 0.12)',
    borderColor: 'rgba(167, 243, 208, 0.3)',
  },
  wizardTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  wizardSegmentTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8FA89B',
  },
  wizardSegmentTabTextActive: {
    color: '#121A15',
  },
  wizardSegmentTabTextCompleted: {
    color: '#A7F3D0',
  },

  // SLIDER HORIZONTAL
  horizontalSlider: {
    flex: 1,
  },
  slidePage: {
    width,
    flexGrow: 0,
    flexShrink: 0,
  },
  slideScroll: {
    flex: 1,
  },
  slideScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110, // Espacio para no chocar con la barra flotante inferior
  },
  slideHeaderBlock: {
    marginBottom: 20,
  },
  slideHeaderWithTag: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  slideMainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#EAF4ED',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  slideSubTitle: {
    fontSize: 15,
    color: '#8FA89B',
    lineHeight: 22,
    marginTop: 8,
  },
  compassLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(167, 243, 208, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.28)',
  },
  compassLivePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A7F3D0',
  },

  cardSectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EAF4ED',
    marginBottom: 10,
    letterSpacing: -0.2,
  },

  // INPUT NOMBRE
  inputCardWrapper: {
    marginBottom: 22,
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIconPrefix: {
    marginRight: 12,
  },
  textInputField: {
    flex: 1,
    color: '#EAF4ED',
    fontSize: 16,
    fontWeight: '600',
  },

  // CÁMARA
  cameraStudioBlock: {
    marginBottom: 24,
  },
  viewfinderFrame: {
    width: '100%',
    height: 200,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 243, 208, 0.35)',
    backgroundColor: '#0A0F0C',
  },
  viewfinderImage: {
    width: '100%',
    height: '100%',
  },
  laserScanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: '#34D399',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
  },
  viewfinderTelemetryTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  telemetryPillText: {
    color: '#121A15',
    fontSize: 12,
    fontWeight: '800',
  },
  centerReticleCross: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 24,
    height: 24,
    marginLeft: -12,
    marginTop: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossH: {
    position: 'absolute',
    width: 18,
    height: 2,
    backgroundColor: 'rgba(167, 243, 208, 0.85)',
  },
  crossV: {
    position: 'absolute',
    width: 2,
    height: 18,
    backgroundColor: 'rgba(167, 243, 208, 0.85)',
  },
  viewfinderTelemetryBottom: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  distanceBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(18, 26, 21, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.3)',
  },
  distanceBadgePillText: {
    color: '#EAF4ED',
    fontSize: 12,
    fontWeight: '700',
  },
  btnShutterPrimary: {
    backgroundColor: '#E8EFE7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 18,
    marginTop: 12,
    shadowColor: '#A7F3D0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnShutterPrimaryText: {
    color: '#121A15',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cameraSecondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  btnSecondaryActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  btnSecondaryActionText: {
    color: '#EAF4ED',
    fontSize: 13,
    fontWeight: '700',
  },

  // DISTANCIA A LA VENTANA
  distanceSectionBlock: {
    marginBottom: 20,
  },
  distanceCardsCol: {
    gap: 12,
  },
  spaciousRowCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 88,
  },
  spaciousRowCardUnselected: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  spaciousRowCardSelected: {
    backgroundColor: '#E8EFE7',
    borderWidth: 1,
    borderColor: '#E8EFE7',
    shadowColor: '#A7F3D0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  rowCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  cleanIconWrap: {
    marginRight: 14,
  },
  rowCardTextWrap: {
    flex: 1,
  },
  rowCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#EAF4ED',
    letterSpacing: -0.2,
  },
  cardTitleSelected: {
    color: '#121A15',
  },
  cardSub: {
    fontSize: 14,
    color: '#8FA89B',
    lineHeight: 20,
  },
  cardSubSelected: {
    color: '#344E41',
  },
  distanceTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  distanceTagPillSelected: {
    backgroundColor: 'rgba(18, 26, 21, 0.12)',
  },
  distanceTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
  },
  distanceTagTextSelected: {
    color: '#121A15',
  },
  gridCheckCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCheckCircleSelected: {
    backgroundColor: '#121A15',
    borderColor: '#121A15',
  },
  gridRadioDotEmpty: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },

  // CARDS 2 COLUMNAS BIEN ESPACIADAS
  gridTwoColumnsSpacious: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    marginBottom: 20,
  },
  gridGlassCardSpacious: {
    width: CARD_WIDTH_2COL,
    borderRadius: 22,
    padding: 18,
    minHeight: 165,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  gridGlassCardUnselected: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  gridGlassCardSelected: {
    backgroundColor: '#E8EFE7',
    borderWidth: 1,
    borderColor: '#E8EFE7',
    shadowColor: '#A7F3D0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gridCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridCardTextWrap: {
    marginTop: 4,
  },
  gridCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#EAF4ED',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  gridCardSubHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#A7F3D0',
    marginBottom: 6,
  },
  gridCardSubHighlightSelected: {
    color: '#121A15',
  },
  gridCardSub: {
    fontSize: 14,
    color: '#8FA89B',
    lineHeight: 20,
  },

  // BANNER INFORMATIVO
  botanicalBannerCard: {
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.25)',
  },
  botanicalBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  botanicalBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.3,
  },
  botanicalBannerDesc: {
    fontSize: 14,
    color: '#EAF4ED',
    lineHeight: 21,
  },

  // ESTRÉS TÉRMICO & DIAGNÓSTICO
  thermalStressBlock: {
    marginBottom: 20,
  },
  diagnosisWideCardWrapper: {
    marginBottom: 20,
  },
  diagnosisWideCard: {
    borderRadius: 24,
    padding: 22,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.35)',
  },
  diagnosisTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  diagnosisTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.5,
  },
  diagnosisScoreVal: {
    fontSize: 34,
    fontWeight: '900',
    color: '#EAF4ED',
    letterSpacing: -1,
  },
  diagnosisLuxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  diagnosisLuxPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#121A15',
  },
  diagnosisVerdictText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EAF4ED',
    lineHeight: 22,
    marginBottom: 16,
  },
  speciesContainer: {
    marginBottom: 16,
  },
  speciesSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8FA89B',
    marginBottom: 8,
  },
  speciesChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speciesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8EFE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  speciesChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121A15',
  },
  tipsContainer: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipIconWrap: {
    marginTop: 2,
  },
  tipText: {
    fontSize: 13,
    color: '#EAF4ED',
    lineHeight: 18,
    flex: 1,
  },

  // FOOTER BAR STICKY
  stickyFooterBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    zIndex: 100,
    elevation: 12,
  },
  footerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 101,
    elevation: 13,
  },
  btnWizardPrev: {
    flex: 0.38,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnWizardPrevText: {
    color: '#EAF4ED',
    fontSize: 15,
    fontWeight: '700',
  },
  btnWizardNext: {
    flex: 0.62,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E8EFE7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#A7F3D0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  btnWizardNextText: {
    color: '#121A15',
    fontSize: 15,
    fontWeight: '800',
  },
  btnWizardSave: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E8EFE7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#A7F3D0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  btnWizardSaveText: {
    color: '#121A15',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
