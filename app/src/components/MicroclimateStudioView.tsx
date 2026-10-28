import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
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

const { width } = Dimensions.get('window');
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

export const MicroclimateStudioView: React.FC<Props> = ({ onBack, onSave, userLocation }) => {
  // Estado de datos biométricos y solares
  const [headingDegrees, setHeadingDegrees] = useState<number>(180); // Sur por defecto
  const [orientationMode, setOrientationMode] = useState<'S' | 'E' | 'O' | 'N'>('S');
  const [selectedSeason, setSelectedSeason] = useState<'hoy' | 'invierno' | 'primavera' | 'verano'>('hoy');
  const [floorLevel, setFloorLevel] = useState<'baja' | 'media' | 'alta'>(
    userLocation?.floorOrApt?.toLowerCase().includes('ático') ? 'alta' : userLocation?.floorOrApt?.toLowerCase().includes('bajo') ? 'baja' : 'media'
  );
  const [windowDistance, setWindowDistance] = useState<'junto_a_ventana' | 'media_distancia' | 'rincon_profundo'>('media_distancia');
  const [nearRadiator, setNearRadiator] = useState<boolean>(false);
  const [nearAC, setNearAC] = useState<boolean>(false);
  const [drafts, setDrafts] = useState<boolean>(false);
  const [humidityLevel, setHumidityLevel] = useState<'alta' | 'media' | 'seca'>('media');
  const [spaceName, setSpaceName] = useState<string>('Ventanal Salón Principal');

  // Estado de cámara interactiva y escáner
  const [snapshotIndex, setSnapshotIndex] = useState<number>(0);
  const [photoUri, setPhotoUri] = useState<string>(CAMERA_SNAPSHOTS[0]);
  const [hasRealPhoto, setHasRealPhoto] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Animaciones de escáner láser y flash de obturador de cámara
  const scanAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
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
    loop.start();
    return () => loop.stop();
  }, []);

  const triggerLightHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
  };

  const triggerHeavyHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (_e) {}
  };

  // Coordenadas hiper-locales del usuario
  const lat = userLocation?.latitude ?? 40.3884;
  const lon = userLocation?.longitude ?? -3.7382;

  // Informe solar estacional anual para la orientación y piso actuales
  const annualSolar = React.useMemo(() => {
    return generateAnnualSolarReport(lat, lon, headingDegrees, windowDistance, floorLevel);
  }, [lat, lon, headingDegrees, windowDistance, floorLevel]);

  // Perfiles de sol estacionales dinámicos para las 4 orientaciones cardinales según el GPS del usuario
  const solarSur = React.useMemo(() => generateAnnualSolarReport(lat, lon, 180, windowDistance, floorLevel), [lat, lon, windowDistance, floorLevel]);
  const solarEste = React.useMemo(() => generateAnnualSolarReport(lat, lon, 90, windowDistance, floorLevel), [lat, lon, windowDistance, floorLevel]);
  const solarOeste = React.useMemo(() => generateAnnualSolarReport(lat, lon, 270, windowDistance, floorLevel), [lat, lon, windowDistance, floorLevel]);
  const solarNorte = React.useMemo(() => generateAnnualSolarReport(lat, lon, 0, windowDistance, floorLevel), [lat, lon, windowDistance, floorLevel]);

  // Suscripción al sensor de orientación / brújula
  useEffect(() => {
    let headingSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    async function startCompass() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted' && isMounted) {
          headingSubscription = await Location.watchHeadingAsync(headingData => {
            if (headingData && headingData.trueHeading !== undefined && headingData.trueHeading >= 0) {
              const deg = Math.round(headingData.trueHeading);
              setHeadingDegrees(deg);
              syncOrientationFromDeg(deg);
            } else if (headingData && headingData.magHeading !== undefined) {
              const deg = Math.round(headingData.magHeading);
              setHeadingDegrees(deg);
              syncOrientationFromDeg(deg);
            }
          });
        }
      } catch (_e) {}
    }

    startCompass();

    return () => {
      isMounted = false;
      if (headingSubscription) {
        headingSubscription.remove();
      }
    };
  }, []);

  const syncOrientationFromDeg = (d: number) => {
    const deg = (d + 360) % 360;
    if (deg >= 45 && deg < 135) {
      setOrientationMode('E');
    } else if (deg >= 135 && deg < 225) {
      setOrientationMode('S');
    } else if (deg >= 225 && deg < 315) {
      setOrientationMode('O');
    } else {
      setOrientationMode('N');
    }
  };

  // DISPARAR OBTURADOR DE CÁMARA CON ANIMACIÓN DE FLASH Y CAPTURA
  const handleShutterCapture = () => {
    triggerHeavyHaptic();

    // 1. Efecto flash de obturador fotográfico
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // 2. Cambio a la siguiente escena fotográfica real
    const nextIdx = (snapshotIndex + 1) % CAMERA_SNAPSHOTS.length;
    setSnapshotIndex(nextIdx);
    setPhotoUri(CAMERA_SNAPSHOTS[nextIdx]);
    setHasRealPhoto(true);

    // 3. Proceso de análisis biométrico rápido
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      triggerLightHaptic();
    }, 700);
  };

  // DISPARAR CÁMARA NATIVA DEL SISTEMA
  const handleLaunchNativeCamera = async () => {
    triggerLightHaptic();
    try {
      if (Platform.OS === 'android') {
        await Linking.sendIntent('android.media.action.IMAGE_CAPTURE');
      }
    } catch (e) {
      console.log('Error abriendo cámara nativa:', e);
    }
  };

  // SELECCIONAR FOTO DE LA GALERÍA
  const handlePickGallery = async () => {
    triggerLightHaptic();
    try {
      if (Platform.OS === 'android') {
        await Linking.sendIntent('android.intent.action.GET_CONTENT', [
          { key: 'type', value: 'image/*' },
        ]);
      }
    } catch (e) {
      console.log('Error abriendo galería:', e);
    }
  };

  // Metadatos de orientación solar
  const getOrientationData = () => {
    switch (orientationMode) {
      case 'S':
        return {
          code: 'S' as const,
          title: 'Orientación Sur / SE',
          hours: 6.5,
          note: 'Sol directo máximo (6-7h). Ideal para Ficus, Strelitzias y Suculentas.',
          baseLux: 8500,
        };
      case 'E':
        return {
          code: 'E' as const,
          title: 'Orientación Este',
          hours: 3.5,
          note: 'Sol suave de mañana (3-4h). Luz fresca perfecta para Monsteras y Pothos.',
          baseLux: 5500,
        };
      case 'O':
        return {
          code: 'O' as const,
          title: 'Orientación Oeste',
          hours: 4.5,
          note: 'Radiación vespertina cálida (4-5h). Requiere buena humedad foliar.',
          baseLux: 6000,
        };
      case 'N':
      default:
        return {
          code: 'N' as const,
          title: 'Orientación Norte',
          hours: 0,
          note: 'Luz difusa continua sin sol directo abrasivo. Muy estable para Calatheas.',
          baseLux: 2800,
        };
    }
  };

  const orientData = getOrientationData();

  // Cálculo de fotones Lux según orientación y distancia
  const calculateLux = (): number => {
    const base = orientData.baseLux;
    if (windowDistance === 'junto_a_ventana') return Math.round(base * 0.75);
    if (windowDistance === 'media_distancia') return Math.round(base * 0.40);
    return Math.round(base * 0.15);
  };

  const currentLux = calculateLux();

  // Cálculo de score y habitabilidad botánica (0 emojis)
  const calculateDiagnosis = () => {
    let score = 55;

    if (currentLux >= 2000 && currentLux <= 5500) score += 30;
    else if (currentLux > 5500) score += 22;
    else if (currentLux >= 800) score += 18;
    else score += 5;

    if (orientationMode === 'S' || orientationMode === 'E') score += 10;
    else if (orientationMode === 'O') score += 7;
    else score += 5;

    if (nearRadiator) score -= 18;
    if (nearAC) score -= 14;
    if (drafts) score -= 8;

    if (humidityLevel === 'alta') score += 5;
    else if (humidityLevel === 'seca') score -= 10;

    score = Math.max(20, Math.min(98, score));

    let verdict = 'Microclima óptimo con luz brillante indirecta.';
    if (score >= 88) verdict = 'Entorno de máxima vitalidad: fotosíntesis abundante sin riesgos térmicos.';
    else if (score >= 70) verdict = 'Microclima equilibrado apto para gran variedad botánica.';
    else if (score >= 50) verdict = 'Rincón viable con precauciones térmicas o ajuste de distancia.';
    else verdict = 'Condiciones exigentes: luz baja o estrés por fuentes térmicas próximas.';

    const recommended: string[] = [];
    if (currentLux >= 2000 && !nearRadiator) {
      recommended.push('Monstera Deliciosa', 'Ficus Lyrata', 'Strelitzia Nicolai', 'Pilea Peperomioides');
    } else if (currentLux >= 1000) {
      recommended.push('Calathea Orbifolia', 'Pothos Golden', 'Spathiphyllum', 'Syngonium');
    } else {
      recommended.push('Sansevieria Trifasciata', 'Zamioculcas Zamiifolia', 'Aglaonema Silver');
    }

    const tips: string[] = [];
    if (nearRadiator) tips.push('Alejar la maceta al menos 1.5 m del radiador para evitar bordes marrones.');
    if (nearAC) tips.push('Evitar que el chorro del aire acondicionado incida directo sobre las hojas.');
    if (orientationMode === 'S' && windowDistance === 'junto_a_ventana') {
      tips.push('Usar visillo ligero en horas centrales estivales para evitar quemaduras foliares.');
    }
    if (tips.length === 0) {
      tips.push('Rincón sumamente estable. Rotar la maceta 90° cada 15 días para crecimiento simétrico.');
    }

    return { score, verdict, recommended, tips };
  };

  const diagnosis = calculateDiagnosis();

  const handleSave = () => {
    triggerLightHaptic();
    const finalMicro: CustomMicroclimate = {
      id: `custom_micro_${Date.now()}`,
      name: spaceName.trim() || 'Rincón Calibrado',
      roomType: 'Salón',
      photoUri,
      headingDegrees,
      orientation: orientData.code,
      windowDistance,
      floorLevel,
      fullAddress: userLocation?.fullAddress,
      directSunHours: annualSolar.todayProfile.directWindowHours,
      estimatedLux: currentLux,
      annualSolarSummary: {
        winterHours: annualSolar.winterProfile.directWindowHours,
        summerHours: annualSolar.summerProfile.directWindowHours,
        todayHours: annualSolar.todayProfile.directWindowHours,
        maxElevation: annualSolar.todayProfile.maxSolarElevation,
      },
      thermalRisks: {
        nearRadiator,
        nearAC,
        drafts,
      },
      humidityLevel,
      habitabilityScore: diagnosis.score,
      verdict: diagnosis.verdict,
      recommendedSpecies: diagnosis.recommended,
      preventiveTips: diagnosis.tips,
      aiAnalysisDone: true,
    };

    onSave(finalMicro);
  };

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 210],
  });

  return (
    <View style={styles.integratedContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TÍTULO Y SUBTÍTULO CON TIPOGRAFÍA GENEROSA DEL SISTEMA DE DISEÑO */}
        <View style={styles.headerTextBlock}>
          <Text style={styles.tideMainTitle}>Estudio de microclima</Text>
          <Text style={styles.tideSubTitle}>
            Diagnóstico biométrico con visión espacial de cámara y rumbo solar para adaptar el cuidado a tu hogar.
          </Text>
        </View>

        {/* NOMBRE DEL RINCÓN */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeaderTitle}>Nombre del espacio</Text>
          <View style={styles.inputContainer}>
            <TreegohIcon name="espacios_microclimas" size={24} color="#EAF4ED" />
            <TextInput
              style={styles.textInput}
              value={spaceName}
              onChangeText={setSpaceName}
              placeholder="Ej. Ventanal Salón, Balcón..."
              placeholderTextColor="rgba(255, 255, 255, 0.45)"
            />
          </View>
        </View>

        {/* CÁMARA IA CON OBTURADOR ACTIVO, HUD EN VIVO Y EFECTO FLASH */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionRowBetween}>
            <Text style={styles.sectionHeaderTitle}>Cámara IA & Visión Espacial</Text>
            {hasRealPhoto && (
              <View style={styles.badgeActive}>
                <TreegohIcon name="check_verificado" size={14} color="#121A15" />
                <Text style={styles.badgeActiveText}>FOTO CAPTURADA</Text>
              </View>
            )}
          </View>

          {/* VIEWPORT INTERACTIVO DE CÁMARA */}
          <View style={styles.cameraViewport}>
            <Image source={{ uri: photoUri }} style={styles.cameraImage} resizeMode="cover" />
            
            <LinearGradient
              colors={['rgba(18, 26, 21, 0.20)', 'rgba(18, 26, 21, 0.60)']}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* LÍNEA LÁSER DE ESCÁNER BIOMÉTRICO */}
            <Animated.View
              style={[
                styles.scanLaserLine,
                { transform: [{ translateY: scanTranslateY }] },
              ]}
            >
              <LinearGradient
                colors={['transparent', '#A7F3D0', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            {/* RETÍCULA DE ENFOQUE DE CÁMARA [ + ] */}
            <View style={styles.reticleOverlay} pointerEvents="none">
              <View style={styles.reticleCornerTopLeft} />
              <View style={styles.reticleCornerTopRight} />
              <View style={styles.reticleCornerBottomLeft} />
              <View style={styles.reticleCornerBottomRight} />
              <View style={styles.reticleCenterCross}>
                <View style={styles.reticleCrossH} />
                <View style={styles.reticleCrossV} />
              </View>
            </View>

            {/* HUD SUPERIOR: FOTONES LUX Y ORIENTACIÓN */}
            <View style={styles.hudTopRow}>
              <View style={styles.hudPill}>
                <TreegohIcon name="sensor_lux" size={15} color="#121A15" />
                <Text style={styles.hudPillText}>~{currentLux.toLocaleString()} Lux</Text>
              </View>

              <View style={styles.hudPill}>
                <TreegohIcon name="brujula_solar" size={15} color="#121A15" />
                <Text style={styles.hudPillText}>{orientData.code} ({headingDegrees}°)</Text>
              </View>
            </View>

            {/* HUD INFERIOR: DISTANCIA ESTIMADA */}
            <View style={styles.hudBottomRow}>
              <View style={styles.hudPillDark}>
                <TreegohIcon name="ventana_distancia" size={15} color="#A7F3D0" />
                <Text style={styles.hudPillDarkText}>
                  {windowDistance === 'junto_a_ventana' ? 'Distancia < 50 cm' : windowDistance === 'media_distancia' ? 'Distancia 1 - 2 m' : 'Rincón > 3 m'}
                </Text>
              </View>
            </View>

            {/* OVERLAY DE PROCESAMIENTO */}
            {isScanning && (
              <View style={styles.scanningOverlay}>
                <ActivityIndicator size="large" color="#A7F3D0" />
                <Text style={styles.scanningText}>Analizando espectro y fotoperiodo...</Text>
              </View>
            )}

            {/* EFECTO FLASH DE OBTURADOR REAL */}
            <Animated.View
              style={[
                styles.shutterFlashOverlay,
                { opacity: flashAnim },
              ]}
              pointerEvents="none"
            />
          </View>

          {/* BOTONES DE DISPARO DE CÁMARA */}
          <View style={styles.cameraButtonsWrapper}>
            <TouchableOpacity
              style={styles.btnShutterPrimary}
              onPress={handleShutterCapture}
              activeOpacity={0.85}
            >
              <TreegohIcon name="camara_diagnostica" size={24} color="#121A15" />
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
        </View>

        {/* DISTANCIA A LA FUENTE DE LUZ (CARDS DEL SISTEMA DE DISEÑO) */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeaderTitle}>Distancia a la ventana o luz</Text>
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
            ].map(item => {
              const isSelected = windowDistance === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.tideRowCard,
                    isSelected ? styles.tideCardSelected : styles.tideCardUnselected,
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

        {/* ORIENTACIÓN SOLAR DEDUCIDA POR GPS & PLANO ARQUITECTÓNICO ESTACIONAL */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionRowBetween}>
            <Text style={styles.sectionHeaderTitle}>Orientación cardinal y solar</Text>
            <View style={styles.compassDegreesTag}>
              <TreegohIcon name="brujula_solar" size={14} color="#A7F3D0" />
              <Text style={styles.compassDegreesTagText}>Brújula {headingDegrees}° {orientationMode}</Text>
            </View>
          </View>

          <View style={styles.gridTwoColumns}>
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
            ].map(item => {
              const isSelected = orientationMode === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.gridGlassCard,
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

          {/* PLANO CENITAL INTERACTIVO & MOTOR SOLAR DE LAS 4 ESTACIONES */}
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
        </View>

        {/* FUENTES DE ESTRÉS TÉRMICO (CARDS 2 COLUMNAS DEL SISTEMA DE DISEÑO) */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeaderTitle}>Fuentes de estrés térmico</Text>
          <View style={styles.gridTwoColumns}>
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
            ].map(item => {
              const isSelected = item.active;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.gridGlassCard,
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
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeaderTitle}>Diagnóstico biométrico computado</Text>
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
                  <TreegohIcon name="check_verificado" size={16} color="#A7F3D0" />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* BOTÓN PRINCIPAL DE GUARDAR Y ASIGNAR */}
        <TouchableOpacity
          style={styles.btnSavePrimary}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <TreegohIcon name="tarea_completada" size={20} color="#121A15" />
          <Text style={styles.btnSavePrimaryText}>Guardar & Asignar Microclima</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  integratedContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 40,
  },
  headerTextBlock: {
    marginBottom: 26,
  },
  tideMainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 38,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  tideSubTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.76)',
    lineHeight: 24,
  },
  sectionBlock: {
    marginBottom: 28,
  },
  sectionRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  badgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A7F3D0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 10,
  },
  badgeActiveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#121A15',
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 14,
  },
  cameraViewport: {
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    backgroundColor: '#0F1712',
  },
  cameraImage: {
    width: '100%',
    height: '100%',
  },
  scanLaserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
  },
  reticleOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleCornerTopLeft: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(167, 243, 208, 0.7)',
  },
  reticleCornerTopRight: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(167, 243, 208, 0.7)',
  },
  reticleCornerBottomLeft: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(167, 243, 208, 0.7)',
  },
  reticleCornerBottomRight: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(167, 243, 208, 0.7)',
  },
  reticleCenterCross: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleCrossH: {
    width: 16,
    height: 1.5,
    backgroundColor: 'rgba(167, 243, 208, 0.8)',
  },
  reticleCrossV: {
    position: 'absolute',
    width: 1.5,
    height: 16,
    backgroundColor: 'rgba(167, 243, 208, 0.8)',
  },
  hudTopRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EFE7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  hudPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121A15',
    marginLeft: 6,
  },
  hudBottomRow: {
    position: 'absolute',
    bottom: 14,
    left: 14,
  },
  hudPillDark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 26, 21, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.4)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  hudPillDarkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  scanningOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 18, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#A7F3D0',
  },
  shutterFlashOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  cameraButtonsWrapper: {
    marginTop: 14,
    gap: 10,
  },
  btnShutterPrimary: {
    width: '100%',
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EFE7',
    borderRadius: 26,
    paddingHorizontal: 18,
  },
  btnShutterPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121A15',
    marginLeft: 8,
  },
  cameraSecondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnSecondaryActionPill: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnSecondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  distanceCardsCol: {
    gap: 10,
  },
  tideRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1.2,
    overflow: 'hidden',
  },
  tideCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  tideCardSelected: {
    backgroundColor: '#E8EFE7',
    borderColor: '#E8EFE7',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  rowCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  rowCardTextWrap: {
    flex: 1,
  },
  rowCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardTitleSelected: {
    color: '#121A15',
  },
  cardSub: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 22,
  },
  cardSubSelected: {
    color: '#2D4233',
  },
  distanceTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  distanceTagPillSelected: {
    backgroundColor: 'rgba(18, 26, 21, 0.12)',
  },
  distanceTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  distanceTagTextSelected: {
    color: '#121A15',
  },
  compassDegreesTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  compassDegreesTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 5,
  },
  gridTwoColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  gridGlassCard: {
    width: (width - 40 - 12) / 2,
    minHeight: 172,
    borderRadius: 24,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1.2,
    overflow: 'hidden',
  },
  gridGlassCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  gridGlassCardSelected: {
    backgroundColor: '#E8EFE7',
    borderColor: '#E8EFE7',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  gridCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cleanIconWrap: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCheckCircleSelected: {
    backgroundColor: 'transparent',
    borderColor: '#121A15',
  },
  gridRadioDotEmpty: {
    width: 0,
    height: 0,
  },
  gridCardTextWrap: {
    marginTop: 10,
  },
  gridCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  gridCardSubHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A7F3D0',
    marginBottom: 3,
  },
  gridCardSubHighlightSelected: {
    color: '#121A15',
  },
  gridCardSub: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 20,
  },
  diagnosisWideCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(167, 243, 208, 0.4)',
    overflow: 'hidden',
  },
  diagnosisTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  diagnosisTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  diagnosisScoreVal: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  diagnosisLuxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EFE7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  diagnosisLuxPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#121A15',
    marginLeft: 6,
  },
  diagnosisVerdictText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 22,
    marginBottom: 16,
  },
  speciesContainer: {
    marginBottom: 16,
  },
  speciesSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  speciesChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speciesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EFE7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  speciesChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121A15',
    marginLeft: 6,
  },
  tipsContainer: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 14,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.78)',
    flex: 1,
    lineHeight: 18,
  },
  btnSavePrimary: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8EFE7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10,
  },
  btnSavePrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121A15',
    marginLeft: 8,
  },
});
