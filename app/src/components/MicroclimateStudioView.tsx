import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

import { Fonts } from '../constants/theme';
import { TreegohIcon, IconName } from './TreegohIcon';
import { BlobAnimatedCard, GlassCardSheen } from './BlobAnimatedCard';
import { CustomMicroclimate, UserLocationDetails } from '../types/onboarding';
import { SpatialSolarPlanView } from './SpatialSolarPlanView';
import {
  BotanicalCameraBubbleModal,
  CapturedBubbleFrame,
} from './BotanicalCameraBubbleModal';
import { generateAnnualSolarReport, calculateSolarPosition } from '../utils/solarEngine';
import {
  analyzeSpacePhotoWithOpenRouter,
  SpatialVisionAnalysis,
  getFallbackAstronomicalVision,
} from '../services/openRouterVision';

interface Props {
  isActiveStep?: boolean;
  onBack: () => void;
  onSave: (microclimate: CustomMicroclimate) => void;
  onSaveAndAddAnother?: (microclimate: CustomMicroclimate) => void;
  onContinueNextStep?: () => void;
  savedMicroclimates?: CustomMicroclimate[];
  initialData?: Partial<CustomMicroclimate>;
  userLocation?: UserLocationDetails;
  renderOnboardingHeader?: () => React.ReactNode;
  safeTopPadding?: number;
  safeBottomPadding?: number;
  outerScrollX?: Animated.Value;
  outerPageIndex?: number;
  outerPageWidth?: number;
}

interface HomeSpacePreset {
  id: string;
  roomType: string;
  defaultName: string;
  icon: IconName;
  defaultDistance: 'junto_a_ventana' | 'media_distancia' | 'rincon_profundo';
  defaultHighHumidity?: boolean;
}

const HOME_SPACE_PRESETS: HomeSpacePreset[] = [
  {
    id: 'salon',
    roomType: 'Salón',
    defaultName: 'Ventanal Salón Principal',
    icon: 'espacios_microclimas',
    defaultDistance: 'media_distancia',
  },
  {
    id: 'terraza',
    roomType: 'Terraza / Balcón',
    defaultName: 'Terraza o Balcón',
    icon: 'luz_natural',
    defaultDistance: 'junto_a_ventana',
  },
  {
    id: 'dormitorio',
    roomType: 'Dormitorio',
    defaultName: 'Dormitorio Luminoso',
    icon: 'ventana_distancia',
    defaultDistance: 'media_distancia',
  },
  {
    id: 'estudio',
    roomType: 'Estudio',
    defaultName: 'Estudio o Despacho',
    icon: 'biblia_plantas',
    defaultDistance: 'media_distancia',
  },
  {
    id: 'cocina',
    roomType: 'Cocina',
    defaultName: 'Cocina Ventilada',
    icon: 'riego_hidratacion',
    defaultDistance: 'junto_a_ventana',
  },
  {
    id: 'bano',
    roomType: 'Baño',
    defaultName: 'Baño con Luz Natural',
    icon: 'humedad_vpd',
    defaultDistance: 'media_distancia',
    defaultHighHumidity: true,
  },
  {
    id: 'jardin',
    roomType: 'Patio / Jardín',
    defaultName: 'Patio o Porche',
    icon: 'floracion_fenologia',
    defaultDistance: 'junto_a_ventana',
  },
];

function degreesToCardinalMode(deg: number): 'S' | 'E' | 'O' | 'N' {
  const norm = ((deg % 360) + 360) % 360;
  if (norm >= 45 && norm < 135) return 'E';
  if (norm >= 135 && norm < 225) return 'S';
  if (norm >= 225 && norm < 315) return 'O';
  return 'N';
}

function degreesToCompassLabel(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  if (norm >= 337.5 || norm < 22.5) return 'Norte';
  if (norm < 67.5) return 'Noreste';
  if (norm < 112.5) return 'Este';
  if (norm < 157.5) return 'Sureste';
  if (norm < 202.5) return 'Sur';
  if (norm < 247.5) return 'Suroeste';
  if (norm < 292.5) return 'Oeste';
  return 'Noroeste';
}

interface WizardTab {
  id: number;
  label: string;
  icon: IconName;
}

const WIZARD_TABS: WizardTab[] = [
  { id: 0, label: '1. Cámara', icon: 'camara_diagnostica' },
  { id: 1, label: '2. Sol', icon: 'brujula_solar' },
  { id: 2, label: '3. Plano', icon: 'luz_natural' },
  { id: 3, label: '4. Salud', icon: 'escudo_fitosanitario' },
];

function extractFloorNumber(floorNumberProp?: number, floorOrApt?: string, address?: string): number {
  if (typeof floorNumberProp === 'number' && !isNaN(floorNumberProp)) {
    return Math.max(0, Math.min(99, floorNumberProp));
  }
  const text = `${floorOrApt || ''} ${address || ''}`.toLowerCase();
  if (text.includes('ático') || text.includes('atico')) return 7;
  if (
    text.includes('casa') ||
    text.includes('bajo') ||
    text.includes('pb') ||
    text.includes('baja') ||
    text.includes('planta baja')
  ) {
    return 0;
  }
  const match = text.match(/(?:piso|planta|floor)?\s*(\d+)\s*(?:º|ª|d|a|b|c|e|st|nd|rd|th)?/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num >= 0 && num <= 99) return num;
  }
  return 1;
}

function scrollHorizontalRefTo(ref: any, x: number, animated: boolean) {
  const node = ref?.current?.getNode ? ref.current.getNode() : ref?.current;
  node?.scrollTo?.({ x, animated });
}

export const MicroclimateStudioView: React.FC<Props> = ({
  isActiveStep = true,
  onBack,
  onSave,
  onSaveAndAddAnother,
  onContinueNextStep,
  savedMicroclimates = [],
  userLocation,
  renderOnboardingHeader,
  safeTopPadding = 20,
  safeBottomPadding = 24,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(windowWidth);

  // Navegación horizontal animada del wizard (deformación Blob sutil y orgánica sin rotación)
  const [wizardStep, setWizardStep] = useState<number>(0);
  const wizardStepRef = useRef<number>(0);
  const isProgrammaticWizardScrollRef = useRef<boolean>(false);
  const horizontalScrollRef = useRef<any>(null);
  const wizardScrollX = useRef(new Animated.Value(0)).current;

  const userLat = userLocation?.latitude ?? 40.4168;
  const userLon = userLocation?.longitude ?? -3.7038;
  const currentSunPos = calculateSolarPosition(userLat, userLon, new Date());

  // Orientación solar deducida automáticamente por GPS + Norte Verdadero (True Heading)
  const defaultEquatorDeg = userLat >= 0 ? 180 : 0;
  const [headingDegrees, setHeadingDegrees] = useState<number>(defaultEquatorDeg);
  const [liveSensorHeading, setLiveSensorHeading] = useState<number>(defaultEquatorDeg);
  const liveSensorHeadingRef = useRef<number>(defaultEquatorDeg);
  const [hasLiveCompassSignal, setHasLiveCompassSignal] = useState<boolean>(false);
  const [orientationMode, setOrientationMode] = useState<'S' | 'E' | 'O' | 'N'>(
    degreesToCardinalMode(defaultEquatorDeg)
  );
  const [isOrientationLocked, setIsOrientationLocked] = useState<boolean>(false);
  const [orientationSource, setOrientationSource] = useState<'gps_compass' | 'ia_solar' | 'manual'>(
    'gps_compass'
  );

  const [windowDistance, setWindowDistance] = useState<
    'junto_a_ventana' | 'media_distancia' | 'rincon_profundo'
  >('media_distancia');

  // Gestión dinámica de pisos (0 a 99) sincronizada con la vivienda
  const [floorNumber, setFloorNumber] = useState<number>(() =>
    extractFloorNumber(userLocation?.floorNumber, userLocation?.floorOrApt, userLocation?.fullAddress)
  );
  const [floorLevel, setFloorLevel] = useState<'baja' | 'media' | 'alta'>(() =>
    floorNumber <= 0 ? 'baja' : floorNumber >= 6 ? 'alta' : 'media'
  );

  useEffect(() => {
    if (typeof userLocation?.floorNumber === 'number') {
      setFloorNumber(userLocation.floorNumber);
      setFloorLevel(
        userLocation.floorNumber <= 0 ? 'baja' : userLocation.floorNumber >= 6 ? 'alta' : 'media'
      );
    }
  }, [userLocation?.floorNumber]);

  useEffect(() => {
    if (!hasLiveCompassSignal && !isOrientationLocked) {
      const hemDeg = userLat >= 0 ? 180 : 0;
      setHeadingDegrees(hemDeg);
      setOrientationMode(degreesToCardinalMode(hemDeg));
    }
  }, [userLat, hasLiveCompassSignal, isOrientationLocked]);

  const [selectedSeason, setSelectedSeason] = useState<
    'hoy' | 'invierno' | 'primavera' | 'verano'
  >('hoy');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('Salón');
  const [name, setName] = useState<string>('Ventanal Salón Principal');
  const [hasCustomEditedName, setHasCustomEditedName] = useState<boolean>(false);

  // Estrés ambiental
  const [nearRadiator, setNearRadiator] = useState<boolean>(false);
  const [nearAC, setNearAC] = useState<boolean>(false);
  const [hasDrafts, setHasDrafts] = useState<boolean>(false);
  const [highHumidity, setHighHumidity] = useState<boolean>(false);

  // Visor en burbuja de cámara integrada (100% in-app) + Visión Espacial OpenRouter IA
  const [isBubbleModalOpen, setIsBubbleModalOpen] = useState<boolean>(false);
  const [modalFrozenUri, setModalFrozenUri] = useState<string | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<SpatialVisionAnalysis | null>(null);
  const [aiErrorMsg, setAiErrorMsg] = useState<string | null>(null);

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

  const goToWizardStep = (stepIdx: number) => {
    if (stepIdx < 0 || stepIdx >= WIZARD_TABS.length) return;
    triggerLightHaptic();
    isProgrammaticWizardScrollRef.current = true;
    setTimeout(() => {
      isProgrammaticWizardScrollRef.current = false;
    }, 440);
    wizardStepRef.current = stepIdx;
    setWizardStep(stepIdx);
    scrollHorizontalRefTo(horizontalScrollRef, stepIdx * containerWidth, true);
  };

  const handleWizardScroll = (e: any) => {
    if (isProgrammaticWizardScrollRef.current || containerWidth <= 0) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIdx = Math.round(offsetX / containerWidth);
    if (newIdx !== wizardStepRef.current && newIdx >= 0 && newIdx < WIZARD_TABS.length) {
      wizardStepRef.current = newIdx;
      setWizardStep(newIdx);
      triggerLightHaptic();
    }
  };

  const handleHorizontalScrollEnd = (e: any) => {
    isProgrammaticWizardScrollRef.current = false;
    if (containerWidth <= 0) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIdx = Math.round(offsetX / containerWidth);
    if (newIdx !== wizardStepRef.current && newIdx >= 0 && newIdx < WIZARD_TABS.length) {
      wizardStepRef.current = newIdx;
      setWizardStep(newIdx);
      triggerLightHaptic();
    }
  };

  const handleSelectSpacePreset = (preset: HomeSpacePreset) => {
    triggerLightHaptic();
    setSelectedRoomType(preset.roomType);
    setName(preset.defaultName);
    setHasCustomEditedName(false);
    if (!aiAnalysis) {
      setWindowDistance(preset.defaultDistance);
      setHighHumidity(Boolean(preset.defaultHighHumidity));
    }
  };

  useEffect(() => {
    if (!isActiveStep) return;
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          subscription = await Location.watchHeadingAsync(headingData => {
            const rawDeg =
              headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
            if (typeof rawDeg === 'number' && !isNaN(rawDeg)) {
              const deg = ((Math.round(rawDeg) % 360) + 360) % 360;
              liveSensorHeadingRef.current = deg;
              setLiveSensorHeading(deg);
              setHasLiveCompassSignal(true);
            }
          });
        }
      } catch (_e) {}
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, [isActiveStep]);

  useEffect(() => {
    if (!isOrientationLocked && hasLiveCompassSignal) {
      setHeadingDegrees(liveSensorHeading);
      setOrientationMode(degreesToCardinalMode(liveSensorHeading));
      setOrientationSource('gps_compass');
    }
  }, [liveSensorHeading, isOrientationLocked, hasLiveCompassSignal]);

  const lockGpsWindowOrientation = () => {
    const lockedDeg = hasLiveCompassSignal ? liveSensorHeadingRef.current : headingDegrees;
    setHeadingDegrees(lockedDeg);
    setOrientationMode(degreesToCardinalMode(lockedDeg));
    setIsOrientationLocked(true);
    setOrientationSource('gps_compass');
    return lockedDeg;
  };

  const handleFloorChange = (newFloor: number) => {
    setFloorNumber(newFloor);
    setFloorLevel(newFloor <= 0 ? 'baja' : newFloor >= 6 ? 'alta' : 'media');
  };

  const annualSolar = generateAnnualSolarReport(
    userLat,
    userLon,
    headingDegrees,
    windowDistance,
    floorLevel,
    floorNumber
  );
  const solarSur = generateAnnualSolarReport(userLat, userLon, 180, windowDistance, floorLevel, floorNumber);
  const solarEste = generateAnnualSolarReport(userLat, userLon, 90, windowDistance, floorLevel, floorNumber);
  const solarOeste = generateAnnualSolarReport(userLat, userLon, 270, windowDistance, floorLevel, floorNumber);
  const solarNorte = generateAnnualSolarReport(userLat, userLon, 0, windowDistance, floorLevel, floorNumber);

  const calculateEstimatedLux = (): number => {
    if (aiAnalysis && aiAnalysis.estimatedLux > 0) {
      if (windowDistance === aiAnalysis.windowDistance) {
        return aiAnalysis.estimatedLux;
      }
    }
    let base = 3200;
    if (orientationMode === 'S') base = 4800;
    if (orientationMode === 'E') base = 3600;
    if (orientationMode === 'O') base = 4200;
    if (orientationMode === 'N') base = 1600;

    const floorMult =
      floorNumber <= 0 ? 0.8 : floorNumber <= 5 ? 0.95 : floorNumber <= 15 ? 1.05 : 1.15;

    if (windowDistance === 'junto_a_ventana') return Math.round(base * 1.0 * floorMult);
    if (windowDistance === 'media_distancia') return Math.round(base * 0.58 * floorMult);
    return Math.round(base * 0.25 * floorMult);
  };

  const runVisionAnalysisOnBase64 = async (
    base64Data: string,
    mimeType: string = 'image/jpeg',
    capturedHeading?: number
  ) => {
    setIsAnalyzingAI(true);
    setAiErrorMsg(null);

    const visionContext = {
      city: userLocation?.city,
      latitude: userLat,
      longitude: userLon,
      floorNumber,
      currentSunAzimuth: currentSunPos.azimuth,
      currentSunElevation: currentSunPos.elevation,
      deviceHeadingDegrees: capturedHeading,
    };

    const res = await analyzeSpacePhotoWithOpenRouter(
      base64Data,
      visionContext,
      mimeType
    );

    setIsAnalyzingAI(false);

    const vision: SpatialVisionAnalysis = res.ok
      ? res.data
      : getFallbackAstronomicalVision(visionContext);

    setAiAnalysis(vision);
    setWindowDistance(vision.windowDistance);
    setSelectedRoomType(vision.detectedRoomType);
    if (!hasCustomEditedName) {
      setName(vision.suggestedSpaceName);
    }
    setNearRadiator(vision.thermalRisksDetected.nearRadiator);
    setNearAC(vision.thermalRisksDetected.nearAC);
    setHasDrafts(vision.thermalRisksDetected.drafts);
    if (vision.highHumidityLikely) {
      setHighHumidity(true);
    }
    if (typeof capturedHeading !== 'number' && vision.inferredOrientationMode) {
      const mode = vision.inferredOrientationMode;
      const degMap: Record<'S' | 'E' | 'O' | 'N', number> = { S: 180, E: 90, O: 270, N: 0 };
      setOrientationMode(mode);
      setHeadingDegrees(degMap[mode]);
      setIsOrientationLocked(true);
      setOrientationSource('ia_solar');
    }
    triggerMediumHaptic();
  };

  const handleOpenBubbleCamera = () => {
    triggerMediumHaptic();
    setAiErrorMsg(null);
    setModalFrozenUri(null);
    setIsOrientationLocked(false);
    setIsBubbleModalOpen(true);
  };

  const handleCloseBubbleCamera = () => {
    setIsBubbleModalOpen(false);
    setTimeout(() => {
      setModalFrozenUri(null);
    }, 320);
  };

  const handleBubbleCapture = async (frame: CapturedBubbleFrame) => {
    const lockedDeg = lockGpsWindowOrientation();
    setCapturedPhotoUri(frame.uri);
    await runVisionAnalysisOnBase64(frame.base64, frame.mimeType, lockedDeg);
    setIsBubbleModalOpen(false);
    setTimeout(() => {
      setModalFrozenUri(null);
    }, 320);
  };

  const handlePickFromGallery = async (fromInsideModal: boolean = false) => {
    triggerMediumHaptic();
    if (fromInsideModal) {
      setIsBubbleModalOpen(false);
      await new Promise(resolve => setTimeout(resolve, 380));
    }
    try {
      if (Platform.OS === 'android') {
        const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!req.granted) {
            setAiErrorMsg('Activa el permiso de Fotos para cargar una imagen de tu galería.');
            return;
          }
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: Platform.OS === 'android',
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setCapturedPhotoUri(asset.uri);
        setModalFrozenUri(asset.uri);
        setIsBubbleModalOpen(true);
        await runVisionAnalysisOnBase64(
          asset.base64 || '',
          asset.mimeType || 'image/jpeg',
          undefined
        );
        setIsBubbleModalOpen(false);
        setTimeout(() => {
          setModalFrozenUri(null);
        }, 320);
      }
    } catch (err: any) {
      console.warn('[Treegoh] Error cargando imagen en onboarding:', err);
      setIsBubbleModalOpen(false);
      setModalFrozenUri(null);
      setAiErrorMsg('No se pudo cargar la imagen desde la galería.');
    }
  };

  const calculateBotanicalDiagnosis = () => {
    let score = 92;
    if (orientationMode === 'N' && windowDistance === 'rincon_profundo') score -= 28;
    if (orientationMode === 'O' && windowDistance === 'junto_a_ventana') score -= 12;
    if (nearRadiator) score -= 18;
    if (nearAC) score -= 14;
    if (hasDrafts) score -= 10;
    if (highHumidity) score += 4;
    if (floorNumber <= 0) score -= 4;

    score = Math.max(35, Math.min(99, score));

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
      tips.push('Microclima equilibrado: excelente balance entre renovación aerodinámica y fotoperiodo útil.');
    }

    let verdict = 'Zona con habitabilidad óptima y alto potencial fotosintético.';
    if (score < 60) verdict = 'Zona vulnerable: requiere mitigación térmica antes de colocar especies sensibles.';
    else if (score < 80) verdict = 'Habitabilidad moderada: adecuada para plantas rústicas o de semi-sombra.';

    const recs =
      score >= 85
        ? ['Monstera Deliciosa', 'Ficus Lyrata', 'Strelitzia Nicolai']
        : score >= 65
        ? ['Zamioculca', 'Sansevieria Trifasciata', 'Pothos Aureum']
        : ['Aspidistra Elatior', 'Aglaonema Commutatum', 'Helecho Nephrolepis'];

    return { score, verdict, tips, recs };
  };

  const diagnosis = calculateBotanicalDiagnosis();

  const buildCurrentMicroclimate = (): CustomMicroclimate => ({
    id: `micro_${Date.now()}`,
    name: name.trim() || `${selectedRoomType} Principal`,
    roomType: selectedRoomType,
    orientation: orientationMode,
    headingDegrees,
    windowDistance,
    floorLevel,
    floorNumber,
    estimatedLux: calculateEstimatedLux(),
    thermalRisks: {
      nearRadiator,
      nearAC,
      drafts: hasDrafts,
    },
    humidityLevel: highHumidity ? 'alta' : nearRadiator ? 'seca' : 'media',
    habitabilityScore: diagnosis.score,
    verdict: aiAnalysis ? `${diagnosis.verdict} ${aiAnalysis.aiDiagnosisNote}` : diagnosis.verdict,
    recommendedSpecies: diagnosis.recs,
    preventiveTips: diagnosis.tips,
    directSunHours: annualSolar.todayProfile.directWindowHours,
    photoUri: capturedPhotoUri || undefined,
    fullAddress: userLocation?.fullAddress,
    annualSolarSummary: {
      winterHours: annualSolar.winterProfile.directWindowHours,
      summerHours: annualSolar.summerProfile.directWindowHours,
      todayHours: annualSolar.todayProfile.directWindowHours,
      maxElevation: annualSolar.todayProfile.maxSolarElevation,
    },
  });

  const handleSave = () => {
    triggerMediumHaptic();
    onSave(buildCurrentMicroclimate());
  };

  const handleSaveAndAddAnother = () => {
    if (!onSaveAndAddAnother) return;
    triggerMediumHaptic();
    const saved = buildCurrentMicroclimate();
    onSaveAndAddAnother(saved);

    const usedTypes = new Set([
      ...(savedMicroclimates || []).map(m => m?.roomType).filter(Boolean),
      saved.roomType,
    ]);
    const nextPreset =
      HOME_SPACE_PRESETS.find(p => !usedTypes.has(p.roomType)) || HOME_SPACE_PRESETS[1];
    setSelectedRoomType(nextPreset.roomType);
    setName(nextPreset.defaultName);
    setHasCustomEditedName(false);
    setWindowDistance(nextPreset.defaultDistance);
    setNearRadiator(false);
    setNearAC(false);
    setHasDrafts(false);
    setHighHumidity(Boolean(nextPreset.defaultHighHumidity));
    setCapturedPhotoUri(null);
    setAiAnalysis(null);
    setAiErrorMsg(null);
    setIsOrientationLocked(false);
    goToWizardStep(0);
  };

  // CABECERA INTEGRADA DENTRO DEL FLUJO DE SCROLL (CERO FIXED, CERO GLOW EN BOTONES)
  const renderInFlowTopNav = () => (
    <View style={styles.inFlowTopHeaderBlock}>
      {renderOnboardingHeader ? renderOnboardingHeader() : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.fullBleedHorizontalScroll}
        contentContainerStyle={styles.wizardSegmentTabsScrollContent}
      >
        {WIZARD_TABS.map(tab => {
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
              activeOpacity={0.82}
            >
              <TreegohIcon
                name={isCompleted ? 'tarea_completada' : tab.icon}
                size={15}
                color={isActive ? '#2C2A28' : '#FFFFFF'}
                glow={false}
              />
              <Text
                style={[
                  styles.wizardSegmentTabText,
                  isActive && styles.wizardSegmentTabTextActive,
                  isCompleted && styles.wizardSegmentTabTextCompleted,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {(savedMicroclimates || []).length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.fullBleedHorizontalScroll}
          contentContainerStyle={styles.savedSpacesScrollContent}
        >
          {(savedMicroclimates || [])
            .filter(sp => Boolean(sp && sp.name))
            .map(sp => (
              <View key={sp.id || sp.name} style={styles.savedSpaceBadgePill}>
                <TreegohIcon name="check_verificado" size={14} color="#FFFFFF" glow={false} />
                <Text style={styles.savedSpaceBadgeText}>
                  {sp.name} · {sp.habitabilityScore || 90}/100
                </Text>
              </View>
            ))}

          <TouchableOpacity
            style={styles.addAnotherSpacePillBtn}
            onPress={handleSaveAndAddAnother}
            activeOpacity={0.8}
          >
            <TreegohIcon name="mas" size={13} color="#FFFFFF" glow={false} />
            <Text style={styles.addAnotherSpacePillText}>+ Añadir otro espacio</Text>
          </TouchableOpacity>

          {onContinueNextStep && (
            <TouchableOpacity
              style={styles.savedSpacesContinuePill}
              onPress={onContinueNextStep}
              activeOpacity={0.82}
            >
              <Text style={styles.savedSpacesContinueText}>
                Continuar con {savedMicroclimates.length} {savedMicroclimates.length === 1 ? 'espacio' : 'espacios'}
              </Text>
              <TreegohIcon name="flecha_adelante" size={14} color="#2C2A28" glow={false} />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );

  // NAVEGACIÓN INFERIOR EN FLUJO CON FLECHA SIMPLE (CERO FIXED, CERO GLOW EN BOTONES)
  const renderInFlowBottomNav = (segIdx: number) => (
    <View style={styles.inFlowBottomNavRow}>
      <TouchableOpacity
        style={styles.dockIconCircleBtn}
        onPress={() => (segIdx > 0 ? goToWizardStep(segIdx - 1) : onBack())}
        activeOpacity={0.82}
      >
        <TreegohIcon name="flecha_volver" size={20} color="#FFFFFF" glow={false} />
      </TouchableOpacity>

      <View style={styles.dockStepIndicatorRow}>
        {WIZARD_TABS.map((tab, idx) => {
          const isActive = idx === segIdx;
          const isDone = idx < segIdx;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => goToWizardStep(idx)}
              style={[
                styles.dockStepPill,
                isActive && styles.dockStepPillActive,
                isDone && styles.dockStepPillDone,
              ]}
              activeOpacity={0.75}
            />
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.dockPrimaryCircleBtn}
        onPress={() => (segIdx < WIZARD_TABS.length - 1 ? goToWizardStep(segIdx + 1) : handleSave())}
        activeOpacity={0.85}
      >
        <TreegohIcon name="flecha_adelante" size={22} color="#2C2A28" glow={false} />
      </TouchableOpacity>
    </View>
  );

  const dynamicScrollContentStyle = [
    styles.slideScrollContent,
    {
      paddingTop: safeTopPadding,
      paddingBottom: safeBottomPadding + 38,
    },
  ];

  return (
    <View
      style={styles.container}
      onLayout={e => {
        const measured = e.nativeEvent.layout.width;
        if (measured > 0 && Math.abs(measured - containerWidth) > 0.5) {
          setContainerWidth(measured);
          requestAnimationFrame(() => {
            scrollHorizontalRefTo(horizontalScrollRef, wizardStep * measured, false);
          });
        }
      }}
    >
      {/* CONTENEDOR HORIZONTAL FLUIDO CON DEFORMACIÓN BLOB SUTIL Y SIN ROTACIÓN */}
      <Animated.ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled={true}
        bounces={false}
        directionalLockEnabled={true}
        keyboardDismissMode="on-drag"
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: wizardScrollX } } }],
          {
            useNativeDriver: true,
            listener: handleWizardScroll,
          }
        )}
        onMomentumScrollEnd={handleHorizontalScrollEnd}
        scrollEventThrottle={16}
        style={styles.horizontalSlider}
        contentContainerStyle={{ width: containerWidth * WIZARD_TABS.length }}
      >
        {/* ============================================================ */}
        {/* SEGMENTO 1: CÁMARA IA, VISIÓN ESPACIAL & DISTANCIA */}
        {/* ============================================================ */}
        <View style={[styles.slidePage, { width: containerWidth }]}>
          <ScrollView
            style={styles.slideScroll}
            contentContainerStyle={dynamicScrollContentStyle}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderInFlowTopNav()}

            <View style={styles.slideHeaderBlock}>
              <Text style={styles.slideMainTitle}>Visión espacial y distancia</Text>
              <Text style={styles.slideSubTitle}>
                Elige o nombra el espacio de tu hogar donde viven tus plantas y calibra su luminosidad y distancia a la luz.
              </Text>
            </View>

            {/* ESPACIOS DEL HOGAR EN CARD GLASS CON DEFORMACIÓN BLOB SUTIL */}
            <BlobAnimatedCard
              scrollX={wizardScrollX}
              pageIndex={0}
              pageWidth={containerWidth}
              cardIndex={0}
              isActivePage={isActiveStep && wizardStep === 0}
              style={styles.inputCardWrapper}
            >
              <View style={styles.inputSpaceGlassCard}>
                <GlassCardSheen />
                <View style={styles.inputSpaceHeaderRow}>
                  <Text style={styles.cardSectionLabelInside}>
                    {savedMicroclimates.length > 0
                      ? `Espacio #${savedMicroclimates.length + 1} del hogar`
                      : 'Espacio del hogar'}
                  </Text>
                  {savedMicroclimates.length > 0 && (
                    <View style={styles.savedCountMiniBadge}>
                      <Text style={styles.savedCountMiniText}>
                        {savedMicroclimates.length} {savedMicroclimates.length === 1 ? 'guardado' : 'guardados'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.inputSpaceHelperSub}>
                  Elige o escribe el nombre del rincón. Puedes calibrar varios espacios (Salón, Balcón, Dormitorio...) guardando cada uno.
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.spacePresetsScrollContent}
                >
                  {HOME_SPACE_PRESETS.map(preset => {
                    const isPresetActive = selectedRoomType === preset.roomType;
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        style={[
                          styles.spacePresetChip,
                          isPresetActive && styles.spacePresetChipActive,
                        ]}
                        onPress={() => handleSelectSpacePreset(preset)}
                        activeOpacity={0.8}
                      >
                        <TreegohIcon
                          name={preset.icon}
                          size={15}
                          color={isPresetActive ? '#2C2A28' : '#FFFFFF'}
                          glow={false}
                        />
                        <Text
                          style={[
                            styles.spacePresetChipText,
                            isPresetActive && styles.spacePresetChipTextActive,
                          ]}
                        >
                          {preset.roomType}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.inputFieldContainer}>
                  <View style={styles.inputIconPrefix}>
                    <TreegohIcon
                      name="espacios_microclimas"
                      size={20}
                      color="#FFFFFF"
                      glow={true}
                    />
                  </View>
                  <TextInput
                    style={styles.textInputField}
                    value={name}
                    onChangeText={txt => {
                      setName(txt);
                      setHasCustomEditedName(true);
                    }}
                    placeholder="Ej. Ventanal Salón Principal"
                    placeholderTextColor="rgba(255, 255, 255, 0.42)"
                  />
                </View>
              </View>
            </BlobAnimatedCard>

            {/* ESCÁNER ÓPTICO EN BURBUJA INTEGRADA + OPENROUTER VISION IA */}
            <View style={styles.cameraSectionBlock}>
              <Text style={styles.cardSectionLabel}>Cámara IA y Visión Espacial</Text>

              <BlobAnimatedCard
                scrollX={wizardScrollX}
                pageIndex={0}
                pageWidth={containerWidth}
                cardIndex={1}
                isActivePage={isActiveStep && wizardStep === 0}
              >
                {!capturedPhotoUri ? (
                  <View style={styles.bubbleLauncherCard}>
                    <GlassCardSheen />

                    {/* Indicativo de luz meramente informativo y muy discreto en baja opacidad */}
                    <View style={styles.bubbleLiveTelemetryBadge}>
                      <View
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 2.5,
                          backgroundColor: 'rgba(134, 239, 172, 0.48)',
                        }}
                      />
                      <Text style={styles.bubbleLiveTelemetryText}>
                        {degreesToCompassLabel(headingDegrees)} {headingDegrees}° · ~{calculateEstimatedLux().toLocaleString()} lx
                      </Text>
                    </View>

                    {/* Visor limpio de 4 esquinas redondeadas (Estilo Cal AI) */}
                    <View style={{ width: 128, height: 92, alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width={128} height={92} viewBox="0 0 128 92">
                        <Path
                          d="M 2 24 L 2 14 Q 2 2 14 2 L 24 2 M 104 2 L 114 2 Q 126 2 126 14 L 126 24 M 2 68 L 2 78 Q 2 90 14 90 L 24 90 M 104 90 L 114 90 Q 126 90 126 78 L 126 68"
                          stroke="rgba(255, 255, 255, 0.80)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </Svg>
                      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
                        <TreegohIcon
                          name="camara_diagnostica"
                          size={24}
                          color="rgba(255, 255, 255, 0.85)"
                          glow={false}
                        />
                      </View>
                    </View>

                    <View style={styles.bubbleLauncherTextBlock}>
                      <Text style={styles.bubbleLauncherTitle}>
                        Cámara en burbuja integrada
                      </Text>
                      <Text style={styles.bubbleLauncherSub}>
                        Despliega la burbuja de cámara con lentes .5x, 1x y 2x para medir la luz y distancia a la ventana sin salir de la pantalla.
                      </Text>
                    </View>

                    <View style={styles.bubbleLauncherActionsStack}>
                      <TouchableOpacity
                        style={styles.btnShootCamera}
                        onPress={handleOpenBubbleCamera}
                        disabled={isAnalyzingAI}
                        activeOpacity={0.85}
                      >
                        <TreegohIcon
                          name="camara_diagnostica"
                          size={18}
                          color="#121417"
                          glow={false}
                        />
                        <Text style={styles.btnShootCameraText}>Desplegar Cámara</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.btnSecondaryFullWidth}
                        onPress={() => handlePickFromGallery(false)}
                        disabled={isAnalyzingAI}
                        activeOpacity={0.78}
                      >
                        <TreegohIcon
                          name="galeria_evolucion"
                          size={18}
                          color="#FFFFFF"
                          glow={false}
                        />
                        <Text style={styles.btnSecondaryText}>Elegir foto de galería</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.capturedResultBlock}>
                    <View style={{ position: 'relative' }}>
                      <View style={styles.viewfinderCardContainer}>
                        <Image
                          source={{ uri: capturedPhotoUri }}
                          style={styles.viewfinderImage}
                          resizeMode="cover"
                        />
                        <LinearGradient
                          colors={['rgba(0,0,0,0.32)', 'transparent', 'rgba(0,0,0,0.58)']}
                          style={StyleSheet.absoluteFill}
                          pointerEvents="none"
                        />

                        {/* Indicativo informativo discreto en baja opacidad */}
                        <View style={styles.viewfinderTelemetryTop}>
                          <View style={styles.telemetryPill}>
                            <Text style={styles.telemetryPillText}>
                              {orientationMode} {headingDegrees}° · ~{calculateEstimatedLux().toLocaleString()} lx
                            </Text>
                          </View>
                        </View>

                        {isAnalyzingAI && (
                          <View style={styles.aiAnalyzingOverlay}>
                            <ActivityIndicator color="#FFFFFF" size="small" />
                            <Text style={styles.aiAnalyzingText}>
                              Analizando luz y distancia...
                            </Text>
                          </View>
                        )}

                        <View style={styles.viewfinderTelemetryBottom}>
                          <View style={styles.distanceBadgePill}>
                            <Text style={styles.distanceBadgePillText}>
                              {aiAnalysis
                                ? `~${aiAnalysis.estimatedDistanceMeters} m · ${
                                    windowDistance === 'junto_a_ventana'
                                      ? 'Junto a ventana'
                                      : windowDistance === 'media_distancia'
                                      ? 'Media distancia'
                                      : 'Rincón profundo'
                                  }`
                                : `Distancia ${
                                    windowDistance === 'junto_a_ventana'
                                      ? '< 50 cm'
                                      : windowDistance === 'media_distancia'
                                      ? '1 - 2 m'
                                      : '> 3 m'
                                  }`}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Botón circular superior derecho estilo Sora para volver a tomar foto */}
                      <TouchableOpacity
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -6,
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: 'rgba(34, 36, 42, 0.94)',
                          borderWidth: 1,
                          borderColor: 'rgba(255, 255, 255, 0.18)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 15,
                        }}
                        onPress={() => setCapturedPhotoUri(null)}
                        activeOpacity={0.82}
                      >
                        <Svg width={12} height={12} viewBox="0 0 14 14">
                          <Line x1="3" y1="3" x2="11" y2="11" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round" />
                          <Line x1="11" y1="3" x2="3" y2="11" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round" />
                        </Svg>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.secondaryCameraActionsRow}>
                      <TouchableOpacity
                        style={styles.btnRescanBubblePrimary}
                        onPress={handleOpenBubbleCamera}
                        disabled={isAnalyzingAI}
                        activeOpacity={0.85}
                      >
                        <TreegohIcon
                          name="camara_diagnostica"
                          size={18}
                          color="#121417"
                          glow={false}
                        />
                        <Text style={styles.btnRescanBubblePrimaryText}>Desplegar Cámara</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.btnSecondaryCamera}
                        onPress={() => handlePickFromGallery(false)}
                        disabled={isAnalyzingAI}
                        activeOpacity={0.78}
                      >
                        <TreegohIcon
                          name="galeria_evolucion"
                          size={18}
                          color="#FFFFFF"
                          glow={false}
                        />
                        <Text style={styles.btnSecondaryText}>Galería</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </BlobAnimatedCard>

              {aiAnalysis && !isAnalyzingAI && (
                <BlobAnimatedCard
                  scrollX={wizardScrollX}
                  pageIndex={0}
                  pageWidth={containerWidth}
                  cardIndex={2}
                  isActivePage={isActiveStep && wizardStep === 0}
                >
                  <View style={styles.aiVisionResultCard}>
                    <GlassCardSheen />
                    <View style={styles.aiVisionResultHeader}>
                      <TreegohIcon
                        name="check_verificado"
                        size={17}
                        color="#FFFFFF"
                        glow={true}
                      />
                      <Text style={styles.aiVisionResultTitle}>
                        Diagnóstico óptico IA (~{aiAnalysis.estimatedDistanceMeters} m · ~{aiAnalysis.estimatedLux.toLocaleString()} Lux)
                      </Text>
                    </View>
                    <Text style={styles.aiVisionResultBody}>{aiAnalysis.aiDiagnosisNote}</Text>
                  </View>
                </BlobAnimatedCard>
              )}

              {aiErrorMsg && !isAnalyzingAI && (
                <View style={styles.aiVisionErrorCard}>
                  <TreegohIcon name="alerta_termica" size={16} color="#FDE68A" glow={false} />
                  <Text style={styles.aiVisionErrorText}>{aiErrorMsg}</Text>
                </View>
              )}
            </View>

            {/* SELECCIÓN DE DISTANCIA A LA VENTANA (AUTOCOMPLETADA POR LA FOTO + EDITABLE) */}
            <View style={styles.distanceSectionBlock}>
              <View style={styles.distanceHeaderRow}>
                <Text style={[styles.cardSectionLabel, { marginBottom: 0 }]}>
                  Distancia a la ventana o luz
                </Text>
                {aiAnalysis && (
                  <View style={styles.aiAutoCompletedBadge}>
                    <TreegohIcon
                      name="check_verificado"
                      size={13}
                      color="#2C2A28"
                      glow={false}
                    />
                    <Text style={styles.aiAutoCompletedBadgeText}>
                      Autocompletado IA
                    </Text>
                  </View>
                )}
              </View>

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
                    tag: '1 - 2 m',
                    sub: 'Luz brillante filtrada. El estándar óptimo de interior.',
                    icon: 'luz_natural' as IconName,
                  },
                  {
                    id: 'rincon_profundo',
                    title: 'Rincón profundo',
                    tag: '> 3 m',
                    sub: 'Penumbra suave o sombra. Apto para especies resistentes.',
                    icon: 'espacios_microclimas' as IconName,
                  },
                ].map((item, idx) => {
                  const isSelected = windowDistance === item.id;
                  return (
                    <BlobAnimatedCard
                      key={item.id}
                      scrollX={wizardScrollX}
                      pageIndex={0}
                      pageWidth={containerWidth}
                      cardIndex={3 + idx}
                      isActivePage={isActiveStep && wizardStep === 0}
                    >
                      <TouchableOpacity
                        style={[
                          styles.spaciousRowCard,
                          isSelected
                            ? styles.spaciousRowCardSelected
                            : styles.spaciousRowCardUnselected,
                        ]}
                        onPress={() => {
                          triggerLightHaptic();
                          setWindowDistance(item.id as any);
                        }}
                        activeOpacity={0.85}
                      >
                        <GlassCardSheen selected={isSelected} />

                        <View style={styles.rowCardLeft}>
                          <View style={styles.cleanIconWrap}>
                            <TreegohIcon
                              name={item.icon}
                              size={26}
                              color="#FFFFFF"
                              glow={true}
                            />
                          </View>
                          <View style={styles.rowCardTextWrap}>
                            <View style={styles.rowCardTitleRow}>
                              <Text style={styles.cardTitle}>{item.title}</Text>
                              <View style={styles.distanceTagPill}>
                                <Text style={styles.distanceTagText}>{item.tag}</Text>
                              </View>
                            </View>
                            <Text style={styles.cardSub}>{item.sub}</Text>
                          </View>
                        </View>

                        {isSelected ? (
                          <View style={styles.tideSelectedIndicator}>
                            <TreegohIcon
                              name="tarea_completada"
                              size={13}
                              color="#FFFFFF"
                              glow={false}
                            />
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    </BlobAnimatedCard>
                  );
                })}
              </View>
            </View>

            {renderInFlowBottomNav(0)}
          </ScrollView>
        </View>

        {/* ============================================================ */}
        {/* SEGMENTO 2: ORIENTACIÓN CARDINAL & FACHADA */}
        {/* ============================================================ */}
        <View style={[styles.slidePage, { width: containerWidth }]}>
          <ScrollView
            style={styles.slideScroll}
            contentContainerStyle={dynamicScrollContentStyle}
            showsVerticalScrollIndicator={false}
          >
            {renderInFlowTopNav()}

            <View style={styles.slideHeaderBlock}>
              <View style={styles.slideHeaderWithTag}>
                <Text style={[styles.slideMainTitle, { marginBottom: 0 }]}>Orientación y sol</Text>
                <View style={styles.autoTagPill}>
                  <TreegohIcon
                    name="brujula_solar"
                    size={13}
                    color="#FFFFFF"
                    glow={false}
                  />
                  <Text style={styles.autoTagText}>
                    {orientationSource === 'manual' ? 'Ajuste Manual' : 'GPS + Rumbo Auto'}
                  </Text>
                </View>
              </View>
              <Text style={styles.slideSubTitle}>
                No necesitas saber dónde está el norte: Treegoh deduce la trayectoria solar por tu GPS y fija el rumbo de tu ventana automáticamente.
              </Text>
            </View>

            {/* TARJETA DE DETECCIÓN SOLAR AUTOMÁTICA POR GPS */}
            <BlobAnimatedCard
              scrollX={wizardScrollX}
              pageIndex={1}
              pageWidth={containerWidth}
              cardIndex={0}
              isActivePage={isActiveStep && wizardStep === 1}
            >
              <View style={styles.gpsSolarAssistantCard}>
                <GlassCardSheen />
                <View style={styles.gpsSolarTopRow}>
                  <View style={styles.gpsSolarIconWrap}>
                    <TreegohIcon
                      name="brujula_solar"
                      size={26}
                      color="#FFFFFF"
                      glow={true}
                    />
                  </View>
                  <View style={styles.gpsSolarTextCol}>
                    <Text style={styles.gpsSolarHeadline}>
                      Ventana orientada al {degreesToCompassLabel(headingDegrees)} ({headingDegrees}°)
                    </Text>
                    <Text style={styles.gpsSolarSubline}>
                      {currentSunPos.elevation > 0
                        ? `Sol actual por GPS: ${Math.round(currentSunPos.azimuth)}° (${degreesToCompassLabel(
                            currentSunPos.azimuth
                          )}) a ${Math.round(currentSunPos.elevation)}° de elevación.`
                        : `Noche solar en tu GPS · Máxima radiación anual desde el ${
                            userLat >= 0 ? 'Sur (180°)' : 'Norte (0°)'
                          }.`}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.gpsSolarActionBtn,
                    !isOrientationLocked && styles.gpsSolarActionBtnLive,
                  ]}
                  onPress={() => {
                    triggerMediumHaptic();
                    if (isOrientationLocked) {
                      setIsOrientationLocked(false);
                    } else {
                      lockGpsWindowOrientation();
                    }
                  }}
                  activeOpacity={0.82}
                >
                  <TreegohIcon
                    name={isOrientationLocked ? 'brujula_solar' : 'check_verificado'}
                    size={16}
                    color={isOrientationLocked ? '#FFFFFF' : '#2C2A28'}
                    glow={false}
                  />
                  <Text
                    style={[
                      styles.gpsSolarActionBtnText,
                      !isOrientationLocked && styles.gpsSolarActionBtnTextLive,
                    ]}
                  >
                    {isOrientationLocked
                      ? 'Recalibrar apuntando el iPhone a la ventana'
                      : `Apunta a tu ventana y toca para fijar (${liveSensorHeading}° ${degreesToCompassLabel(
                          liveSensorHeading
                        )})`}
                  </Text>
                </TouchableOpacity>
              </View>
            </BlobAnimatedCard>

            {/* GRILLA EN 2 COLUMNAS CON ESPACIADO Y GLOW TIDE */}
            <View style={styles.twoColumnGridWrapper}>
              <View style={styles.twoColumnRow}>
                <BlobAnimatedCard
                  scrollX={wizardScrollX}
                  pageIndex={1}
                  pageWidth={containerWidth}
                  cardIndex={1}
                  isActivePage={isActiveStep && wizardStep === 1}
                  style={styles.twoColumnBlobCell}
                >
                  <TouchableOpacity
                    style={[
                      styles.twoColumnCard,
                      orientationMode === 'S' ? styles.gridCardSelected : styles.gridCardUnselected,
                    ]}
                    onPress={() => {
                      triggerLightHaptic();
                      setOrientationMode('S');
                      setHeadingDegrees(180);
                      setIsOrientationLocked(true);
                      setOrientationSource('manual');
                    }}
                    activeOpacity={0.85}
                  >
                    <GlassCardSheen selected={orientationMode === 'S'} />
                    <View style={styles.gridCardHeaderRow}>
                      <TreegohIcon
                        name="brujula_solar"
                        size={28}
                        color="#FFFFFF"
                        glow={true}
                      />
                      {orientationMode === 'S' ? (
                        <View style={styles.tideSelectedIndicator}>
                          <TreegohIcon
                            name="tarea_completada"
                            size={13}
                            color="#FFFFFF"
                            glow={false}
                          />
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.gridCardTextWrap}>
                      <Text style={styles.gridCardTitle}>Sur / SE</Text>
                      <Text style={styles.gridCardSubHighlight}>
                        Ene: {solarSur.winterProfile.directWindowHours}h · Jun:{' '}
                        {solarSur.summerProfile.directWindowHours}h
                      </Text>
                      <Text style={styles.gridCardSub}>Sol intenso al mediodía</Text>
                    </View>
                  </TouchableOpacity>
                </BlobAnimatedCard>

                <BlobAnimatedCard
                  scrollX={wizardScrollX}
                  pageIndex={1}
                  pageWidth={containerWidth}
                  cardIndex={2}
                  isActivePage={isActiveStep && wizardStep === 1}
                  style={styles.twoColumnBlobCell}
                >
                  <TouchableOpacity
                    style={[
                      styles.twoColumnCard,
                      orientationMode === 'E' ? styles.gridCardSelected : styles.gridCardUnselected,
                    ]}
                    onPress={() => {
                      triggerLightHaptic();
                      setOrientationMode('E');
                      setHeadingDegrees(90);
                      setIsOrientationLocked(true);
                      setOrientationSource('manual');
                    }}
                    activeOpacity={0.85}
                  >
                    <GlassCardSheen selected={orientationMode === 'E'} />
                    <View style={styles.gridCardHeaderRow}>
                      <TreegohIcon
                        name="luz_natural"
                        size={28}
                        color="#FFFFFF"
                        glow={true}
                      />
                      {orientationMode === 'E' ? (
                        <View style={styles.tideSelectedIndicator}>
                          <TreegohIcon
                            name="tarea_completada"
                            size={13}
                            color="#FFFFFF"
                            glow={false}
                          />
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.gridCardTextWrap}>
                      <Text style={styles.gridCardTitle}>Este</Text>
                      <Text style={styles.gridCardSubHighlight}>
                        Ene: {solarEste.winterProfile.directWindowHours}h · Jun:{' '}
                        {solarEste.summerProfile.directWindowHours}h
                      </Text>
                      <Text style={styles.gridCardSub}>Sol suave por la mañana</Text>
                    </View>
                  </TouchableOpacity>
                </BlobAnimatedCard>
              </View>

              <View style={styles.twoColumnRow}>
                <BlobAnimatedCard
                  scrollX={wizardScrollX}
                  pageIndex={1}
                  pageWidth={containerWidth}
                  cardIndex={3}
                  isActivePage={isActiveStep && wizardStep === 1}
                  style={styles.twoColumnBlobCell}
                >
                  <TouchableOpacity
                    style={[
                      styles.twoColumnCard,
                      orientationMode === 'O' ? styles.gridCardSelected : styles.gridCardUnselected,
                    ]}
                    onPress={() => {
                      triggerLightHaptic();
                      setOrientationMode('O');
                      setHeadingDegrees(270);
                      setIsOrientationLocked(true);
                      setOrientationSource('manual');
                    }}
                    activeOpacity={0.85}
                  >
                    <GlassCardSheen selected={orientationMode === 'O'} />
                    <View style={styles.gridCardHeaderRow}>
                      <TreegohIcon
                        name="alerta_termica"
                        size={28}
                        color="#FFFFFF"
                        glow={true}
                      />
                      {orientationMode === 'O' ? (
                        <View style={styles.tideSelectedIndicator}>
                          <TreegohIcon
                            name="tarea_completada"
                            size={13}
                            color="#FFFFFF"
                            glow={false}
                          />
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.gridCardTextWrap}>
                      <Text style={styles.gridCardTitle}>Oeste</Text>
                      <Text style={styles.gridCardSubHighlight}>
                        Ene: {solarOeste.winterProfile.directWindowHours}h · Jun:{' '}
                        {solarOeste.summerProfile.directWindowHours}h
                      </Text>
                      <Text style={styles.gridCardSub}>Sol cálido por la tarde</Text>
                    </View>
                  </TouchableOpacity>
                </BlobAnimatedCard>

                <BlobAnimatedCard
                  scrollX={wizardScrollX}
                  pageIndex={1}
                  pageWidth={containerWidth}
                  cardIndex={4}
                  isActivePage={isActiveStep && wizardStep === 1}
                  style={styles.twoColumnBlobCell}
                >
                  <TouchableOpacity
                    style={[
                      styles.twoColumnCard,
                      orientationMode === 'N' ? styles.gridCardSelected : styles.gridCardUnselected,
                    ]}
                    onPress={() => {
                      triggerLightHaptic();
                      setOrientationMode('N');
                      setHeadingDegrees(0);
                      setIsOrientationLocked(true);
                      setOrientationSource('manual');
                    }}
                    activeOpacity={0.85}
                  >
                    <GlassCardSheen selected={orientationMode === 'N'} />
                    <View style={styles.gridCardHeaderRow}>
                      <TreegohIcon
                        name="escudo_fitosanitario"
                        size={28}
                        color="#FFFFFF"
                        glow={true}
                      />
                      {orientationMode === 'N' ? (
                        <View style={styles.tideSelectedIndicator}>
                          <TreegohIcon
                            name="tarea_completada"
                            size={13}
                            color="#FFFFFF"
                            glow={false}
                          />
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.gridCardTextWrap}>
                      <Text style={styles.gridCardTitle}>Norte</Text>
                      <Text style={styles.gridCardSubHighlight}>
                        Luz difusa ({solarNorte.todayProfile.daylightHours}h luz)
                      </Text>
                      <Text style={styles.gridCardSub}>Claridad sin sol directo</Text>
                    </View>
                  </TouchableOpacity>
                </BlobAnimatedCard>
              </View>
            </View>

            {/* BANNER INFORMATIVO DE ASESORÍA BOTÁNICA */}
            <BlobAnimatedCard
              scrollX={wizardScrollX}
              pageIndex={1}
              pageWidth={containerWidth}
              cardIndex={5}
              isActivePage={isActiveStep && wizardStep === 1}
            >
              <View style={styles.botanicalBannerCard}>
                <GlassCardSheen />
                <View style={styles.bannerIconCol}>
                  <TreegohIcon name="luz_natural" size={24} color="#FFFFFF" glow={true} />
                </View>
                <View style={styles.bannerTextCol}>
                  <Text style={styles.bannerTitle}>
                    {orientationMode === 'S'
                      ? 'Alta Insolación'
                      : orientationMode === 'E'
                      ? 'Luz Matutina Óptima'
                      : orientationMode === 'O'
                      ? 'Precaución Térmica Estival'
                      : 'Luz Indirecta Constante'}
                  </Text>
                  <Text style={styles.bannerSub}>
                    {orientationMode === 'S'
                      ? 'Rayos bajos y penetrantes en invierno; sol perpendicular y caliente en verano.'
                      : orientationMode === 'E'
                      ? 'Estupendo despertar fotosintético con radiación suave antes del mediodía.'
                      : orientationMode === 'O'
                      ? 'Radiación intensa por la tarde. Ideal para plantas tropicales o con visillo.'
                      : 'Excelente para helechos, monsteras y calatheas que rehúyen del sol abrasivo.'}
                  </Text>
                </View>
              </View>
            </BlobAnimatedCard>

            {renderInFlowBottomNav(1)}
          </ScrollView>
        </View>

        {/* ============================================================ */}
        {/* SEGMENTO 3: PLANO ARQUITECTÓNICO & RITMO SOLAR EN 4 ESTACIONES */}
        {/* ============================================================ */}
        <View style={[styles.slidePage, { width: containerWidth }]}>
          <ScrollView
            style={styles.slideScroll}
            contentContainerStyle={dynamicScrollContentStyle}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderInFlowTopNav()}

            <View style={styles.slideHeaderBlock}>
              <Text style={styles.slideMainTitle}>Plano y ritmo solar</Text>
              <Text style={styles.slideSubTitle}>
                Simulación arquitectónica cenital en tiempo real para tu planta y ventanal en las 4 estaciones.
              </Text>
            </View>

            <SpatialSolarPlanView
              headingDegrees={headingDegrees}
              orientationCode={orientationMode}
              windowDistance={windowDistance}
              floorLevel={floorLevel}
              floorNumber={floorNumber}
              onSelectFloorNumber={handleFloorChange}
              onSelectFloorLevel={setFloorLevel}
              selectedSeason={selectedSeason}
              onSelectSeason={setSelectedSeason}
              solarReport={annualSolar}
              userAddress={userLocation?.fullAddress || 'Ubicación Geocodificada'}
              floorOrApt={userLocation?.floorOrApt || `Piso ${floorNumber}º`}
              scrollX={wizardScrollX}
              pageIndex={2}
              pageWidth={containerWidth}
              isActivePage={isActiveStep && wizardStep === 2}
            />

            {renderInFlowBottomNav(2)}
          </ScrollView>
        </View>

        {/* ============================================================ */}
        {/* SEGMENTO 4: ESTRÉS TÉRMICO & DIAGNÓSTICO FINAL */}
        {/* ============================================================ */}
        <View style={[styles.slidePage, { width: containerWidth }]}>
          <ScrollView
            style={styles.slideScroll}
            contentContainerStyle={dynamicScrollContentStyle}
            showsVerticalScrollIndicator={false}
          >
            {renderInFlowTopNav()}

            <View style={styles.slideHeaderBlock}>
              <Text style={styles.slideMainTitle}>Estrés térmico y salud</Text>
              <Text style={styles.slideSubTitle}>
                Identifica fuentes de calor seco o corrientes y revisa el dictamen de habitabilidad final de tu planta.
              </Text>
            </View>

            <View style={styles.stressSectionBlock}>
              <Text style={styles.cardSectionLabel}>Fuentes de estrés ambiental</Text>

              <View style={styles.twoColumnGridWrapper}>
                <View style={styles.twoColumnRow}>
                  <BlobAnimatedCard
                    scrollX={wizardScrollX}
                    pageIndex={3}
                    pageWidth={containerWidth}
                    cardIndex={0}
                    isActivePage={isActiveStep && wizardStep === 3}
                    style={styles.twoColumnBlobCell}
                  >
                    <TouchableOpacity
                      style={[
                        styles.twoColumnCard,
                        nearRadiator ? styles.gridCardSelected : styles.gridCardUnselected,
                      ]}
                      onPress={() => {
                        triggerLightHaptic();
                        setNearRadiator(!nearRadiator);
                      }}
                      activeOpacity={0.85}
                    >
                      <GlassCardSheen selected={nearRadiator} />
                      <View style={styles.gridCardHeaderRow}>
                        <TreegohIcon
                          name="alerta_termica"
                          size={28}
                          color="#FFFFFF"
                          glow={true}
                        />
                        {nearRadiator ? (
                          <View style={styles.tideSelectedIndicator}>
                            <TreegohIcon
                              name="tarea_completada"
                              size={13}
                              color="#FFFFFF"
                              glow={false}
                            />
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.gridCardTextWrap}>
                        <Text style={styles.gridCardTitle}>Radiador cerca</Text>
                        <Text style={styles.gridCardSub}>Calor seco deshidratante</Text>
                      </View>
                    </TouchableOpacity>
                  </BlobAnimatedCard>

                  <BlobAnimatedCard
                    scrollX={wizardScrollX}
                    pageIndex={3}
                    pageWidth={containerWidth}
                    cardIndex={1}
                    isActivePage={isActiveStep && wizardStep === 3}
                    style={styles.twoColumnBlobCell}
                  >
                    <TouchableOpacity
                      style={[
                        styles.twoColumnCard,
                        nearAC ? styles.gridCardSelected : styles.gridCardUnselected,
                      ]}
                      onPress={() => {
                        triggerLightHaptic();
                        setNearAC(!nearAC);
                      }}
                      activeOpacity={0.85}
                    >
                      <GlassCardSheen selected={nearAC} />
                      <View style={styles.gridCardHeaderRow}>
                        <TreegohIcon
                          name="temperatura_termica"
                          size={28}
                          color="#FFFFFF"
                          glow={true}
                        />
                        {nearAC ? (
                          <View style={styles.tideSelectedIndicator}>
                            <TreegohIcon
                              name="tarea_completada"
                              size={13}
                              color="#FFFFFF"
                              glow={false}
                            />
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.gridCardTextWrap}>
                        <Text style={styles.gridCardTitle}>Aire acondicionado</Text>
                        <Text style={styles.gridCardSub}>Chorro frío en estomas</Text>
                      </View>
                    </TouchableOpacity>
                  </BlobAnimatedCard>
                </View>

                <View style={styles.twoColumnRow}>
                  <BlobAnimatedCard
                    scrollX={wizardScrollX}
                    pageIndex={3}
                    pageWidth={containerWidth}
                    cardIndex={2}
                    isActivePage={isActiveStep && wizardStep === 3}
                    style={styles.twoColumnBlobCell}
                  >
                    <TouchableOpacity
                      style={[
                        styles.twoColumnCard,
                        hasDrafts ? styles.gridCardSelected : styles.gridCardUnselected,
                      ]}
                      onPress={() => {
                        triggerLightHaptic();
                        setHasDrafts(!hasDrafts);
                      }}
                      activeOpacity={0.85}
                    >
                      <GlassCardSheen selected={hasDrafts} />
                      <View style={styles.gridCardHeaderRow}>
                        <TreegohIcon
                          name="espacios_microclimas"
                          size={28}
                          color="#FFFFFF"
                          glow={true}
                        />
                        {hasDrafts ? (
                          <View style={styles.tideSelectedIndicator}>
                            <TreegohIcon
                              name="tarea_completada"
                              size={13}
                              color="#FFFFFF"
                              glow={false}
                            />
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.gridCardTextWrap}>
                        <Text style={styles.gridCardTitle}>Corrientes de aire</Text>
                        <Text style={styles.gridCardSub}>Puertas o ventanas</Text>
                      </View>
                    </TouchableOpacity>
                  </BlobAnimatedCard>

                  <BlobAnimatedCard
                    scrollX={wizardScrollX}
                    pageIndex={3}
                    pageWidth={containerWidth}
                    cardIndex={3}
                    isActivePage={isActiveStep && wizardStep === 3}
                    style={styles.twoColumnBlobCell}
                  >
                    <TouchableOpacity
                      style={[
                        styles.twoColumnCard,
                        highHumidity ? styles.gridCardSelected : styles.gridCardUnselected,
                      ]}
                      onPress={() => {
                        triggerLightHaptic();
                        setHighHumidity(!highHumidity);
                      }}
                      activeOpacity={0.85}
                    >
                      <GlassCardSheen selected={highHumidity} />
                      <View style={styles.gridCardHeaderRow}>
                        <TreegohIcon
                          name="humedad_vpd"
                          size={28}
                          color="#FFFFFF"
                          glow={true}
                        />
                        {highHumidity ? (
                          <View style={styles.tideSelectedIndicator}>
                            <TreegohIcon
                              name="tarea_completada"
                              size={13}
                              color="#FFFFFF"
                              glow={false}
                            />
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.gridCardTextWrap}>
                        <Text style={styles.gridCardTitle}>Humedad alta (&gt;70%)</Text>
                        <Text style={styles.gridCardSub}>Baño o humidificador</Text>
                      </View>
                    </TouchableOpacity>
                  </BlobAnimatedCard>
                </View>
              </View>
            </View>

            {/* TARJETA DE SCORE DE HABITABILIDAD (CERO DESBORDE HORIZONTAL, TIPOGRAFÍA MUY LIGHT) */}
            <View style={styles.verdictSectionBlock}>
              <Text style={styles.cardSectionLabel}>Dictamen botánico computado</Text>

              <BlobAnimatedCard
                scrollX={wizardScrollX}
                pageIndex={3}
                pageWidth={containerWidth}
                cardIndex={4}
                isActivePage={isActiveStep && wizardStep === 3}
              >
                <View style={styles.verdictCardContainer}>
                  <GlassCardSheen />

                  <View style={styles.verdictHeaderBlock}>
                    <Text style={styles.scoreLabel}>SCORE DE HABITABILIDAD</Text>

                    <View style={styles.verdictScoreAndMetricsRow}>
                      <Text style={styles.scoreBigNumber}>{diagnosis.score}/100</Text>

                      <View style={styles.verdictMetricsPillsWrap}>
                        <View style={styles.verdictLuxBadge}>
                          <TreegohIcon
                            name="sensor_lux"
                            size={14}
                            color="#2C2A28"
                            glow={false}
                          />
                          <Text style={styles.verdictLuxText}>
                            ~{calculateEstimatedLux().toLocaleString()} Lux
                          </Text>
                        </View>

                        <View style={styles.verdictParGlassPill}>
                          <Text style={styles.verdictPpfdSubText}>
                            ~{Math.round(calculateEstimatedLux() * 0.018)} µmol/m²·s PAR
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.verdictSummary}>{diagnosis.verdict}</Text>

                  <View style={styles.speciesRecommendationRow}>
                    <Text style={styles.speciesRowTitle}>Especies óptimas para este rincón:</Text>
                    <View style={styles.speciesTagsWrap}>
                      {diagnosis.recs.map((sp, idx) => (
                        <View key={idx} style={styles.botanicalSpeciesTag}>
                          <TreegohIcon
                            name="espacios_microclimas"
                            size={14}
                            color="#FFFFFF"
                            glow={true}
                          />
                          <Text style={styles.botanicalTagText}>{sp}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {diagnosis.tips.length > 0 && (
                    <View style={styles.tipsContainerBlock}>
                      {diagnosis.tips.map((tip, idx) => (
                        <View key={idx} style={styles.tipItemRow}>
                          <TreegohIcon
                            name="escudo_fitosanitario"
                            size={16}
                            color="#FFFFFF"
                            glow={true}
                          />
                          <Text style={styles.verdictTipText}>{tip}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </BlobAnimatedCard>

              {onSaveAndAddAnother && (
                <BlobAnimatedCard
                  scrollX={wizardScrollX}
                  pageIndex={3}
                  pageWidth={containerWidth}
                  cardIndex={5}
                  isActivePage={isActiveStep && wizardStep === 3}
                >
                  <TouchableOpacity
                    style={styles.btnAddAnotherSpace}
                    onPress={handleSaveAndAddAnother}
                    activeOpacity={0.82}
                  >
                    <TreegohIcon name="mas" size={17} color="#FFFFFF" glow={false} />
                    <View style={styles.btnAddAnotherSpaceCol}>
                      <Text style={styles.btnAddAnotherSpaceText}>
                        Guardar «{name.trim() || selectedRoomType}» y añadir otro espacio
                      </Text>
                      <Text style={styles.btnAddAnotherSpaceHint}>
                        Calibra el siguiente rincón (Terraza, Dormitorio, Cocina...)
                      </Text>
                    </View>
                  </TouchableOpacity>
                </BlobAnimatedCard>
              )}
            </View>

            {renderInFlowBottomNav(3)}
          </ScrollView>
        </View>
      </Animated.ScrollView>

      {/* MODAL IN-APP DE CÁMARA EN BURBUJA ÓPTICA CIRCULAR */}
      <BotanicalCameraBubbleModal
        visible={isBubbleModalOpen}
        isAnalyzing={isAnalyzingAI}
        externalFrozenUri={modalFrozenUri}
        liveHeadingDegrees={hasLiveCompassSignal ? liveSensorHeading : headingDegrees}
        liveCompassLabel={degreesToCompassLabel(
          hasLiveCompassSignal ? liveSensorHeading : headingDegrees
        )}
        estimatedLux={calculateEstimatedLux()}
        onClose={handleCloseBubbleCamera}
        onCaptureFrame={handleBubbleCapture}
        onPickGalleryInsideModal={() => handlePickFromGallery(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  inFlowTopHeaderBlock: {
    gap: 16,
    marginBottom: 26,
  },
  fullBleedHorizontalScroll: {
    marginHorizontal: -24,
  },
  wizardSegmentTabsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  wizardSegmentTab: {
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  wizardSegmentTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderColor: 'rgba(255, 255, 255, 0.96)',
  },
  wizardSegmentTabCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.44)',
  },
  wizardSegmentTabText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.86)',
  },
  wizardSegmentTabTextActive: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#2C2A28',
  },
  wizardSegmentTabTextCompleted: {
    color: 'rgba(255, 255, 255, 0.94)',
  },
  savedSpacesScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  savedSpaceBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 18,
  },
  savedSpaceBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.92)',
  },
  savedSpacesContinuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  savedSpacesContinueText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#2C2A28',
  },
  addAnotherSpacePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  addAnotherSpacePillText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: '#FFFFFF',
  },

  horizontalSlider: {
    flex: 1,
  },
  slidePage: {
    flexGrow: 0,
    flexShrink: 0,
  },
  slideScroll: {
    flex: 1,
  },
  slideScrollContent: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  slideHeaderBlock: {
    marginBottom: 34,
  },
  slideHeaderWithTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  slideMainTitle: {
    fontFamily: Fonts.light,
    fontSize: 28,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.96)',
    lineHeight: 38,
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  slideSubTitle: {
    fontFamily: Fonts.light,
    fontSize: 14.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.64)',
    lineHeight: 23,
  },
  autoTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 16,
    gap: 6,
  },
  autoTagText: {
    fontFamily: Fonts.light,
    color: 'rgba(255, 255, 255, 0.90)',
    fontSize: 13,
    fontWeight: '300',
  },

  // INPUT NOMBRE Y SELECTOR DE ESPACIOS DEL HOGAR (GLASS CARD TIDE)
  inputCardWrapper: {
    marginBottom: 28,
  },
  inputSpaceGlassCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    overflow: 'hidden',
  },
  inputSpaceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  savedCountMiniBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savedCountMiniText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  inputSpaceHelperSub: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
    lineHeight: 18,
    marginBottom: 14,
  },
  cardSectionLabelInside: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.92)',
    letterSpacing: 0.1,
  },
  cardSectionLabel: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  spacePresetsScrollContent: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    paddingRight: 8,
  },
  spacePresetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  spacePresetChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderColor: 'rgba(255, 255, 255, 0.96)',
  },
  spacePresetChipText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.88)',
  },
  spacePresetChipTextActive: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#2C2A28',
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 16,
    height: 54,
  },
  inputIconPrefix: {
    marginRight: 12,
  },
  textInputField: {
    flex: 1,
    minWidth: 0,
    fontFamily: Fonts.light,
    fontSize: 15.5,
    fontWeight: '300',
    color: '#FFFFFF',
  },

  // LANZADOR DE CÁMARA EN BURBUJA INTEGRADA & PREVIEW
  cameraSectionBlock: {
    marginBottom: 30,
  },
  bubbleLauncherCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    alignItems: 'center',
    gap: 18,
    overflow: 'hidden',
  },
  bubbleLiveTelemetryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  bubbleLiveTelemetryText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.44)',
    letterSpacing: 0.2,
  },
  bubbleEmblemOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.44)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleEmblemInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleLauncherTextBlock: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    width: '100%',
  },
  bubbleLauncherTitle: {
    fontFamily: Fonts.regular,
    fontSize: 18,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.96)',
    textAlign: 'center',
  },
  bubbleLauncherSub: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.64)',
    textAlign: 'center',
    lineHeight: 22,
  },
  bubbleLauncherActionsStack: {
    width: '100%',
    gap: 12,
    marginTop: 4,
  },
  capturedResultBlock: {
    gap: 16,
  },
  viewfinderCardContainer: {
    minHeight: 214,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(38, 36, 33, 0.88)',
    position: 'relative',
    justifyContent: 'space-between',
    padding: 16,
  },
  viewfinderImage: {
    ...StyleSheet.absoluteFill,
  },
  aiAnalyzingOverlay: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(36, 34, 31, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    zIndex: 10,
  },
  aiAnalyzingText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  viewfinderTelemetryTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    zIndex: 5,
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 12, 16, 0.36)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  telemetryPillText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.56)',
    letterSpacing: 0.2,
  },
  viewfinderTelemetryBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    zIndex: 5,
  },
  distanceBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
    backgroundColor: 'rgba(34, 32, 29, 0.88)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    gap: 7,
  },
  distanceBadgePillText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: '#FFFFFF',
    flexShrink: 1,
  },

  // BOTONES DE CÁMARA Y GALERÍA (CERO SOMBRA / CERO GLOW EN BOTONES)
  btnShootCamera: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnShootCameraText: {
    fontFamily: Fonts.regular,
    color: '#2C2A28',
    fontSize: 15,
    fontWeight: '400',
  },
  btnSecondaryFullWidth: {
    width: '100%',
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryCameraActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  btnRescanBubblePrimary: {
    flex: 1.3,
    minWidth: 145,
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnRescanBubblePrimaryText: {
    fontFamily: Fonts.regular,
    color: '#2C2A28',
    fontSize: 14.5,
    fontWeight: '400',
  },
  btnSecondaryCamera: {
    flex: 1,
    minWidth: 118,
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSecondaryText: {
    fontFamily: Fonts.light,
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 14,
    fontWeight: '300',
  },

  aiVisionResultCard: {
    marginTop: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
    borderRadius: 20,
    padding: 18,
    gap: 10,
    overflow: 'hidden',
  },
  aiVisionResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiVisionResultTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    fontWeight: '400',
    color: '#FFFFFF',
    flex: 1,
    minWidth: 0,
  },
  aiVisionResultBody: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.80)',
    lineHeight: 21,
  },
  aiVisionErrorCard: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.36)',
    borderRadius: 18,
    padding: 16,
  },
  aiVisionErrorText: {
    flex: 1,
    minWidth: 0,
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: '#FEF3C7',
    lineHeight: 20,
  },

  // DISTANCIA A LA VENTANA
  distanceSectionBlock: {
    marginBottom: 8,
  },
  distanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  aiAutoCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  aiAutoCompletedBadgeText: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    fontWeight: '400',
    color: '#2C2A28',
  },
  gpsSolarAssistantCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 22,
    gap: 16,
    overflow: 'hidden',
  },
  gpsSolarTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  gpsSolarIconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsSolarTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  gpsSolarHeadline: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.96)',
    lineHeight: 22,
  },
  gpsSolarSubline: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.64)',
    lineHeight: 21,
  },
  gpsSolarActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: 24,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  gpsSolarActionBtnLive: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderColor: 'rgba(255, 255, 255, 0.96)',
  },
  gpsSolarActionBtnText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.90)',
    flexShrink: 1,
    textAlign: 'center',
    lineHeight: 19,
  },
  gpsSolarActionBtnTextLive: {
    fontFamily: Fonts.regular,
    color: '#2C2A28',
    fontWeight: '400',
  },
  distanceCardsCol: {
    gap: 16,
  },
  spaciousRowCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  spaciousRowCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  spaciousRowCardUnselected: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  rowCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 16,
    marginRight: 12,
  },
  cleanIconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCardTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  rowCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 5,
  },
  cardTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.96)',
  },
  distanceTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  distanceTagText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.88)',
  },
  cardSub: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
    lineHeight: 20,
  },

  tideSelectedIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.70)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // GRILLA EN 2 COLUMNAS CON ESPACIADO Y DISTANCIAS TIDE (16PX GAP, 20PX RADIUS)
  twoColumnGridWrapper: {
    marginBottom: 16,
    width: '100%',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    width: '100%',
  },
  twoColumnBlobCell: {
    flex: 1,
    minWidth: 0,
  },
  twoColumnCard: {
    flex: 1,
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    minHeight: 196,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  gridCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  gridCardUnselected: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  gridCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 18,
  },
  gridCardTextWrap: {
    gap: 5,
    minWidth: 0,
  },
  gridCardTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.96)',
  },
  gridCardSubHighlight: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.80)',
  },
  gridCardSub: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.56)',
    lineHeight: 19.5,
  },

  // BANNER BOTÁNICO GLASS
  botanicalBannerCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    padding: 20,
    gap: 15,
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  bannerIconCol: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  bannerTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.96)',
    marginBottom: 2,
  },
  bannerSub: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.64)',
    lineHeight: 21,
  },

  // ESTRÉS & SCORE DE HABITABILIDAD (CERO DESBORDE HORIZONTAL, TIPOGRAFÍA MUY LIGHT)
  stressSectionBlock: {
    marginBottom: 24,
  },
  verdictSectionBlock: {
    marginBottom: 8,
  },
  verdictCardContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 22,
    overflow: 'hidden',
    position: 'relative',
    gap: 18,
  },
  verdictHeaderBlock: {
    width: '100%',
    gap: 10,
    minWidth: 0,
  },
  scoreLabel: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
    letterSpacing: 1.2,
  },
  verdictScoreAndMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  scoreBigNumber: {
    fontFamily: Fonts.extraLight,
    fontSize: 38,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  verdictMetricsPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  verdictLuxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 6,
    maxWidth: '100%',
  },
  verdictLuxText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: '#2C2A28',
    flexShrink: 1,
  },
  verdictParGlassPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    maxWidth: '100%',
  },
  verdictPpfdSubText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.86)',
    flexShrink: 1,
  },
  verdictSummary: {
    fontFamily: Fonts.light,
    fontSize: 15,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 23,
  },
  speciesRecommendationRow: {
    gap: 12,
    minWidth: 0,
  },
  speciesRowTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.84)',
  },
  speciesTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  botanicalSpeciesTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 8,
    maxWidth: '100%',
  },
  botanicalTagText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.94)',
    flexShrink: 1,
  },
  tipsContainerBlock: {
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.14)',
    paddingTop: 18,
  },
  tipItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  verdictTipText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.78)',
    lineHeight: 21,
    flex: 1,
    minWidth: 0,
  },

  // BOTÓN GUARDAR Y AÑADIR OTRO ESPACIO (BOTÓN PLANO SIN GLOW NI GLASSCARDSHEEN)
  btnAddAnotherSpace: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: 26,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  btnAddAnotherSpaceCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  btnAddAnotherSpaceText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.94)',
  },
  btnAddAnotherSpaceHint: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
  },

  // NAVEGACIÓN INFERIOR EN FLUJO (CERO FIXED, CERO SOMBRA / CERO GLOW EN BOTONES)
  inFlowBottomNavRow: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  dockIconCircleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockPrimaryCircleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockStepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  dockStepPill: {
    width: 7,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  dockStepPillActive: {
    width: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
  },
  dockStepPillDone: {
    width: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
  },
});
