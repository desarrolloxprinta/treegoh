/**
 * CreateSpaceStudioModal.tsx — Estudio de Creación de Espacios Botánicos (2026)
 * 
 * Determinación del espacio asistida por IA y astronomía solar en tiempo real:
 * - Análisis visual multimodal con OpenRouter IA (deduce estancia, lux, distancia a ventana y riesgos).
 * - Motor astronómico solar real (calcula azimut, elevación solar hoy, inclinación en otoño y rango anual según GPS de la ciudad).
 * - Sensor de brújula / Norte Verdadero en tiempo real para capturar la orientación cardinal exacta de la ventana.
 * - Estética zen y mineral de TIDE (Mobbin): espaciado generoso (gap: 14 - 36), cards simples, iconos blancos con glow.
 * - Cero emojis, cero fuentes bold (solo light '300' y regular '400').
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  Platform,
  Easing,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line } from 'react-native-svg';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

import { Fonts } from '../constants/theme';
import { TreegohIcon, IconName } from './TreegohIcon';
import { GlassCardSheen } from './BlobAnimatedCard';
import { CustomMicroclimate, UserLocationDetails } from '../types/onboarding';
import {
  BotanicalCameraBubbleModal,
  CapturedBubbleFrame,
} from './BotanicalCameraBubbleModal';
import {
  analyzeSpacePhotoWithOpenRouter,
  SpatialVisionAnalysis,
} from '../services/openRouterVision';
import {
  generateAnnualSolarReport,
  calculateSolarPosition,
} from '../utils/solarEngine';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface CreateSpaceStudioModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveSpace: (newSpace: CustomMicroclimate) => void;
  userLocation?: UserLocationDetails;
  userCity?: string;
}

interface RoomPreset {
  id: string;
  name: string;
  defaultName: string;
  icon: IconName;
  baseLux: number;
  defaultDistance: 'junto_a_ventana' | 'media_distancia' | 'rincon_profundo';
  defaultHumidity: 'alta' | 'media' | 'seca';
  description: string;
}

const ROOM_PRESETS: RoomPreset[] = [
  {
    id: 'salon',
    name: 'Salón',
    defaultName: 'Ventanal Salón Principal',
    icon: 'espacios_microclimas',
    baseLux: 3600,
    defaultDistance: 'media_distancia',
    defaultHumidity: 'media',
    description: 'Luz natural',
  },
  {
    id: 'terraza',
    name: 'Terraza',
    defaultName: 'Terraza Luminosa',
    icon: 'luz_natural',
    baseLux: 7200,
    defaultDistance: 'junto_a_ventana',
    defaultHumidity: 'media',
    description: 'Exterior',
  },
  {
    id: 'dormitorio',
    name: 'Dormitorio',
    defaultName: 'Dormitorio Sereno',
    icon: 'ventana_distancia',
    baseLux: 2600,
    defaultDistance: 'media_distancia',
    defaultHumidity: 'media',
    description: 'Luz suave',
  },
  {
    id: 'estudio',
    name: 'Estudio',
    defaultName: 'Estudio de Trabajo',
    icon: 'biblia_plantas',
    baseLux: 3100,
    defaultDistance: 'media_distancia',
    defaultHumidity: 'media',
    description: 'Luz filtrada',
  },
  {
    id: 'cocina',
    name: 'Cocina',
    defaultName: 'Cocina Ventilada',
    icon: 'riego_hidratacion',
    baseLux: 2900,
    defaultDistance: 'junto_a_ventana',
    defaultHumidity: 'media',
    description: 'Ventilación',
  },
  {
    id: 'bano',
    name: 'Baño',
    defaultName: 'Baño Tropical',
    icon: 'humedad_vpd',
    baseLux: 1900,
    defaultDistance: 'media_distancia',
    defaultHumidity: 'alta',
    description: 'Vapor y humedad',
  },
  {
    id: 'patio',
    name: 'Patio',
    defaultName: 'Patio Abierto',
    icon: 'floracion_fenologia',
    baseLux: 6800,
    defaultDistance: 'junto_a_ventana',
    defaultHumidity: 'media',
    description: 'Intemperie',
  },
];

type CardinalOrientation = 'Sur' | 'Este' | 'Oeste' | 'Norte';

interface OrientationOption {
  key: CardinalOrientation;
  label: string;
  degrees: number;
  multiplier: number;
  description: string;
}

const ORIENTATIONS: OrientationOption[] = [
  {
    key: 'Sur',
    label: 'Sur (180°)',
    degrees: 180,
    multiplier: 1.35,
    description: 'Máxima insolación',
  },
  {
    key: 'Este',
    label: 'Este (90°)',
    degrees: 90,
    multiplier: 1.05,
    description: 'Sol de mañana',
  },
  {
    key: 'Oeste',
    label: 'Oeste (270°)',
    degrees: 270,
    multiplier: 1.2,
    description: 'Sol de tarde',
  },
  {
    key: 'Norte',
    label: 'Norte (0°)',
    degrees: 0,
    multiplier: 0.65,
    description: 'Luz indirecta',
  },
];

function degreesToCardinal(deg: number): CardinalOrientation {
  const norm = ((deg % 360) + 360) % 360;
  if (norm >= 45 && norm < 135) return 'Este';
  if (norm >= 135 && norm < 225) return 'Sur';
  if (norm >= 225 && norm < 315) return 'Oeste';
  return 'Norte';
}

export const CreateSpaceStudioModal: React.FC<CreateSpaceStudioModalProps> = ({
  visible,
  onClose,
  onSaveSpace,
  userLocation,
  userCity: userCityProp,
}) => {
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, Platform.OS === 'ios' ? 48 : 24);
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 34 : 20);

  const city = userLocation?.city || userCityProp || 'Madrid';
  const userLat = userLocation?.latitude ?? 40.4168;
  const userLon = userLocation?.longitude ?? -3.7038;
  const floorNumber = userLocation?.floorNumber ?? 1;
  const floorLevel: 'baja' | 'media' | 'alta' =
    floorNumber <= 0 ? 'baja' : floorNumber >= 6 ? 'alta' : 'media';

  const [rendered, setRendered] = useState(visible);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeBackdrop = useRef(new Animated.Value(0)).current;

  // Estados del formulario
  const [selectedPreset, setSelectedPreset] = useState<RoomPreset>(ROOM_PRESETS[0]);
  const [spaceName, setSpaceName] = useState<string>(ROOM_PRESETS[0].defaultName);
  const [hasCustomEditedName, setHasCustomEditedName] = useState<boolean>(false);
  const [windowDistance, setWindowDistance] = useState<
    'junto_a_ventana' | 'media_distancia' | 'rincon_profundo'
  >('media_distancia');
  const [orientation, setOrientation] = useState<CardinalOrientation>('Sur');
  const [headingDegrees, setHeadingDegrees] = useState<number>(180);
  const [humidityLevel, setHumidityLevel] = useState<'alta' | 'media' | 'seca'>('media');
  const [nearRadiator, setNearRadiator] = useState<boolean>(false);
  const [nearAC, setNearAC] = useState<boolean>(false);
  const [drafts, setDrafts] = useState<boolean>(false);

  // Estados de escaneo óptico y visión espacial con IA
  const [isBubbleCameraOpen, setIsBubbleCameraOpen] = useState<boolean>(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<SpatialVisionAnalysis | null>(null);
  const [aiErrorMsg, setAiErrorMsg] = useState<string | null>(null);

  // Sensor de brújula / Norte Verdadero en tiempo real
  const [liveHeading, setLiveHeading] = useState<number>(180);
  const [hasCompassSignal, setHasCompassSignal] = useState<boolean>(false);

  useEffect(() => {
    if (!visible) return;
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          subscription = await Location.watchHeadingAsync(data => {
            const raw = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
            if (typeof raw === 'number' && !isNaN(raw)) {
              const deg = ((Math.round(raw) % 360) + 360) % 360;
              setLiveHeading(deg);
              setHasCompassSignal(true);
            }
          });
        }
      } catch (_e) {}
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, [visible]);

  // Animación de slide in / slide out
  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeBackdrop, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeBackdrop, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setRendered(false);
      });
    }
  }, [visible]);

  const handleClose = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeBackdrop, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setRendered(false);
      onClose();
    });
  };

  // Posición solar en tiempo real (Azimut y Elevación)
  const currentSunPos = useMemo(() => {
    return calculateSolarPosition(userLat, userLon, new Date());
  }, [userLat, userLon]);

  // Motor astronómico anual real (Sol hoy, otoño, invierno, verano)
  const annualSolar = useMemo(() => {
    return generateAnnualSolarReport(
      userLat,
      userLon,
      headingDegrees,
      windowDistance,
      floorLevel,
      floorNumber
    );
  }, [userLat, userLon, headingDegrees, windowDistance, floorLevel, floorNumber]);

  // Análisis multimodal con OpenRouter IA
  const runVisionAnalysisOnBase64 = async (base64Data: string, mimeType: string = 'image/jpeg', lockedHeading?: number) => {
    setIsAnalyzingAI(true);
    setAiErrorMsg(null);

    const degToUse = typeof lockedHeading === 'number' ? lockedHeading : liveHeading;

    const res = await analyzeSpacePhotoWithOpenRouter(
      base64Data,
      {
        city,
        latitude: userLat,
        longitude: userLon,
        floorNumber,
        currentSunAzimuth: currentSunPos.azimuth,
        currentSunElevation: currentSunPos.elevation,
        deviceHeadingDegrees: degToUse,
      },
      mimeType
    );

    setIsAnalyzingAI(false);

    if (res.ok) {
      const vision = res.data;
      setAiAnalysis(vision);

      // Autocompletar automáticamente todos los parámetros sin que el usuario tenga que adivinar
      setWindowDistance(vision.windowDistance);

      const matchedPreset = ROOM_PRESETS.find(p => p.name === vision.detectedRoomType) || ROOM_PRESETS[0];
      setSelectedPreset(matchedPreset);

      if (!hasCustomEditedName) {
        setSpaceName(vision.suggestedSpaceName);
      }

      setNearRadiator(vision.thermalRisksDetected.nearRadiator);
      setNearAC(vision.thermalRisksDetected.nearAC);
      setDrafts(vision.thermalRisksDetected.drafts);

      if (vision.highHumidityLikely) {
        setHumidityLevel('alta');
      }

      // Si la orientación se capturó con la brújula o la infirió la IA
      if (typeof lockedHeading === 'number') {
        setHeadingDegrees(lockedHeading);
        setOrientation(degreesToCardinal(lockedHeading));
      } else if (vision.inferredOrientationMode) {
        const mode = vision.inferredOrientationMode;
        const degMap: Record<'S' | 'E' | 'O' | 'N', number> = { S: 180, E: 90, O: 270, N: 0 };
        const cardMap: Record<'S' | 'E' | 'O' | 'N', CardinalOrientation> = {
          S: 'Sur',
          E: 'Este',
          O: 'Oeste',
          N: 'Norte',
        };
        setHeadingDegrees(degMap[mode]);
        setOrientation(cardMap[mode]);
      }

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (_e) {}
    } else {
      setAiErrorMsg(res.error);
    }
  };

  // Captura desde la burbuja óptica
  const handleCaptureFrame = async (frame: CapturedBubbleFrame) => {
    setIsBubbleCameraOpen(false);
    setCapturedPhotoUri(frame.uri);

    const capturedDeg = hasCompassSignal ? liveHeading : headingDegrees;
    setHeadingDegrees(capturedDeg);
    setOrientation(degreesToCardinal(capturedDeg));

    await runVisionAnalysisOnBase64(frame.base64, frame.mimeType, capturedDeg);
  };

  // Carga desde galería
  const handlePickFromGallery = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setAiErrorMsg('Permite acceso a Fotos para seleccionar la imagen del rincón.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.65,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setCapturedPhotoUri(asset.uri);
        if (asset.base64) {
          await runVisionAnalysisOnBase64(asset.base64, asset.mimeType || 'image/jpeg');
        }
      }
    } catch (_err) {
      setAiErrorMsg('No se pudo cargar la imagen desde la galería.');
    }
  };

  // Calibración científica de Lux y Habitabilidad
  const { estimatedLux, habitabilityScore, recommendedSpecies, verdict } = useMemo(() => {
    let lux = 3400;

    if (aiAnalysis && aiAnalysis.estimatedLux > 0) {
      lux = aiAnalysis.estimatedLux;
    } else {
      const base = selectedPreset.baseLux;
      const orientOpt = ORIENTATIONS.find(o => o.key === orientation) || ORIENTATIONS[0];
      const distMult =
        windowDistance === 'junto_a_ventana' ? 1.4 : windowDistance === 'media_distancia' ? 0.85 : 0.42;
      const floorMult = floorNumber <= 0 ? 0.85 : floorNumber <= 5 ? 1.0 : 1.15;
      lux = Math.round(base * orientOpt.multiplier * distMult * floorMult);
    }

    lux = Math.max(400, Math.min(12000, lux));

    // Habitabilidad calculada
    let score = 96;
    if (nearRadiator) score -= 12;
    if (nearAC) score -= 10;
    if (drafts) score -= 8;
    if (lux < 900) score -= 10;
    if (score < 45) score = 45;

    let species: string[] = [];
    if (lux >= 5000) {
      species = ['Ficus Lyrata', 'Strelitzia Nicolai', 'Sansevieria', 'Euphorbia'];
    } else if (lux >= 2400) {
      species = ['Monstera Deliciosa', 'Pothos Dorado', 'Ficus Elastica', 'Pachira Aquatica'];
    } else {
      species = ['Zamioculcas', 'Calathea Orbifolia', 'Spathiphyllum', 'Aglaonema Silver'];
    }

    if (humidityLevel === 'alta') {
      species.unshift('Helecho de Boston');
    }

    const verd = `Microclima calibrado con IA en ${selectedPreset.name}: ~${lux.toLocaleString()} Lux y ${annualSolar.todayProfile.directWindowHours}h sol directo (${orientation}).`;

    return {
      estimatedLux: lux,
      habitabilityScore: score,
      recommendedSpecies: species.slice(0, 4),
      verdict: verd,
    };
  }, [aiAnalysis, selectedPreset, orientation, windowDistance, floorNumber, nearRadiator, nearAC, drafts, humidityLevel, annualSolar]);

  const handleSaveSpaceAction = () => {
    if (!spaceName.trim()) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_e) {}

    const newSpace: CustomMicroclimate = {
      id: `space_${Date.now()}`,
      name: spaceName.trim(),
      roomType: selectedPreset.name,
      orientation: (orientation === 'Sur' ? 'S' : orientation === 'Este' ? 'E' : orientation === 'Oeste' ? 'O' : 'N') as any,
      headingDegrees,
      windowDistance,
      floorNumber,
      floorLevel,
      estimatedLux,
      directSunHours: annualSolar.todayProfile.directWindowHours,
      photoUri: capturedPhotoUri || undefined,
      aiAnalysisDone: Boolean(aiAnalysis),
      annualSolarSummary: {
        todayHours: annualSolar.todayProfile.directWindowHours,
        autumnHours: annualSolar.autumnProfile.directWindowHours,
        winterHours: annualSolar.winterProfile.directWindowHours,
        summerHours: annualSolar.summerProfile.directWindowHours,
        maxElevation: annualSolar.todayProfile.maxSolarElevation,
      },
      thermalRisks: {
        nearRadiator,
        nearAC,
        drafts,
      },
      humidityLevel,
      habitabilityScore,
      verdict,
      recommendedSpecies,
      preventiveTips: [
        nearRadiator ? 'Alejar del chorro de calefacción' : 'Supervisar fotoperiodo diurno',
        drafts ? 'Proteger de corrientes frías continuas' : 'Mantener ventilación equilibrada',
      ],
    };

    onSaveSpace(newSpace);
    handleClose();
  };

  if (!rendered) return null;

  return (
    <Modal visible={rendered} transparent={true} animationType="none" statusBarTranslucent={true}>
      <View style={styles.modalOverlay}>
        {/* Telón de fondo con fundido suave */}
        <Animated.View
          style={[
            styles.backdropOverlay,
            {
              opacity: fadeBackdrop,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Pantalla deslizante completa */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#181E25', '#10141A', '#090C10']}
            style={styles.sheetGradient}
          >
            {/* Cabecera superior espaciosa */}
            <View style={[styles.topBarRow, { paddingTop: safeTop + 8 }]}>
              <TouchableOpacity
                style={styles.backPillBtn}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <TreegohIcon name="flecha_volver" size={16} color="#FFFFFF" glow={false} />
                <Text style={styles.backPillText}>Cerrar</Text>
              </TouchableOpacity>

              <View style={styles.headerStudioBadge}>
                <TreegohIcon name="camara_diagnostica" size={13} color="#FFFFFF" glow={true} glowColor="#FFFFFF" />
                <Text style={styles.headerStudioBadgeText}>IA Solar & Visión</Text>
              </View>
            </View>

            {/* Contenido desplazable espacioso */}
            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: safeBottom + 120 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Título principal y subtítulo */}
              <View style={styles.headerTitlesCol}>
                <Text style={styles.mainTitle}>Nuevo Espacio</Text>
                <Text style={styles.mainSubtitle}>
                  Calibra la luz real, inclinación solar y microclima con visión IA y astronomía en {city}.
                </Text>
              </View>

              {/* 1. SECCIÓN PRINCIPAL: ESCÁNER ÓPTICO Y VISIÓN ESPACIAL CON IA */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>1. Determinación visual vía IA</Text>
                  {aiAnalysis && (
                    <View style={styles.aiVerifiedBadge}>
                      <TreegohIcon name="check_verificado" size={11} color="#86EFAC" />
                      <Text style={styles.aiVerifiedBadgeText}>Calibrado con IA</Text>
                    </View>
                  )}
                </View>

                {isAnalyzingAI ? (
                  <View style={styles.aiAnalyzingCard}>
                    <GlassCardSheen />
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.aiAnalyzingTitle}>Analizando microclima con IA...</Text>
                    <Text style={styles.aiAnalyzingSub}>
                      Deduciendo fotoperiodo, distancia a ventana y obstáculos térmicos en {city}.
                    </Text>
                  </View>
                ) : capturedPhotoUri ? (
                  <View style={styles.photoResultWrap}>
                    <View style={{ position: 'relative' }}>
                      <View style={styles.photoFrame}>
                        <Image source={{ uri: capturedPhotoUri }} style={styles.photoThumb} />
                        <View style={styles.photoGradientOverlay} />

                        {/* Indicativo informativo discreto y en baja opacidad */}
                        <View style={styles.photoBadgesTopRow}>
                          <View
                            style={{
                              backgroundColor: 'rgba(10, 12, 16, 0.36)',
                              paddingVertical: 4,
                              paddingHorizontal: 10,
                              borderRadius: 12,
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: Fonts.light,
                                fontSize: 11,
                                fontWeight: '300',
                                color: 'rgba(255, 255, 255, 0.56)',
                                letterSpacing: 0.2,
                              }}
                            >
                              {aiAnalysis?.detectedRoomType || selectedPreset.name} · {orientation} {headingDegrees}° · ~{estimatedLux.toLocaleString()} lx
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Botón circular estilo Sora en esquina superior derecha para cambiar foto */}
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

                    {/* Resumen del diagnóstico visual */}
                    {aiAnalysis?.aiDiagnosisNote && (
                      <View style={styles.aiDiagnosisNoteCard}>
                        <GlassCardSheen />
                        <TreegohIcon name="luz_natural" size={16} color="#FFFFFF" glow={true} glowColor="#FFFFFF" />
                        <Text style={styles.aiDiagnosisNoteText}>{aiAnalysis.aiDiagnosisNote}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.retakePhotoBtn}
                      onPress={() => setIsBubbleCameraOpen(true)}
                      activeOpacity={0.82}
                    >
                      <TreegohIcon name="camara_diagnostica" size={14} color="#FFFFFF" glow={false} />
                      <Text style={styles.retakePhotoBtnText}>Desplegar cámara de nuevo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.cameraHeroCard}>
                    <GlassCardSheen />

                    {/* Indicativo de luz meramente informativo y muy discreto */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      }}
                    >
                      <View
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 2.5,
                          backgroundColor: 'rgba(134, 239, 172, 0.48)',
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: Fonts.light,
                          fontSize: 11,
                          fontWeight: '300',
                          color: 'rgba(255, 255, 255, 0.44)',
                          letterSpacing: 0.2,
                        }}
                      >
                        {orientation} {headingDegrees}° · ~{estimatedLux.toLocaleString()} lx
                      </Text>
                    </View>

                    {/* Marco limpio de 4 esquinas redondeadas (Estilo Cal AI) */}
                    <View style={{ width: 124, height: 88, alignItems: 'center', justifyContent: 'center', marginVertical: 4 }}>
                      <Svg width={124} height={88} viewBox="0 0 124 88">
                        <Path
                          d="M 2 24 L 2 14 Q 2 2 14 2 L 24 2 M 100 2 L 110 2 Q 122 2 122 14 L 122 24 M 2 64 L 2 74 Q 2 86 14 86 L 24 86 M 100 86 L 110 86 Q 122 86 122 74 L 122 64"
                          stroke="rgba(255, 255, 255, 0.80)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </Svg>
                      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
                        <TreegohIcon name="camara_diagnostica" size={24} color="rgba(255, 255, 255, 0.86)" glow={false} />
                      </View>
                    </View>

                    <Text style={styles.cameraHeroTitle}>Cámara en burbuja integrada</Text>
                    <Text style={styles.cameraHeroSub}>
                      Despliega la burbuja de cámara con lentes .5x, 1x y 2x para deducir distancia a la ventana, luminosidad y microclima sin salir de la pantalla.
                    </Text>

                    <View style={styles.cameraActionsRow}>
                      <TouchableOpacity
                        style={styles.openCameraBtn}
                        onPress={() => setIsBubbleCameraOpen(true)}
                        activeOpacity={0.85}
                      >
                        <TreegohIcon name="camara_diagnostica" size={16} color="#141416" glow={false} />
                        <Text style={styles.openCameraBtnText}>Desplegar Cámara</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.openGalleryBtn}
                        onPress={handlePickFromGallery}
                        activeOpacity={0.82}
                      >
                        <TreegohIcon name="galeria_evolucion" size={16} color="#FFFFFF" glow={false} />
                        <Text style={styles.openGalleryBtnText}>Galería</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {aiErrorMsg && (
                  <View style={styles.errorMsgCard}>
                    <TreegohIcon name="alerta_termica" size={14} color="#F87171" />
                    <Text style={styles.errorMsgText}>{aiErrorMsg}</Text>
                  </View>
                )}
              </View>

              {/* 2. MOTOR ASTRONÓMICO SOLAR REAL (COORDENADAS GPS & INCLINACIÓN EN OTOÑO) */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>2. Trayectoria solar real ({city})</Text>
                  <Text style={styles.sectionCounter}>{orientation} · {headingDegrees}°</Text>
                </View>

                <View style={styles.solarCardsGrid}>
                  {/* Card 1: Sol Hoy */}
                  <View style={styles.solarMetricCard}>
                    <GlassCardSheen />
                    <View style={styles.solarMetricTopRow}>
                      <TreegohIcon name="luz_natural" size={20} color="#FFFFFF" glow={true} glowColor="#FFFFFF" />
                      <Text style={styles.solarMetricBadge}>Hoy</Text>
                    </View>
                    <Text style={styles.solarMetricBigVal}>
                      {annualSolar.todayProfile.directWindowHours}h
                    </Text>
                    <Text style={styles.solarMetricDesc}>
                      Sol directo en ventana · Elevación {Math.round(annualSolar.todayProfile.maxSolarElevation)}°
                    </Text>
                  </View>

                  {/* Card 2: Inclinación en Otoño (Crítico para cuidadores) */}
                  <View style={styles.solarMetricCard}>
                    <GlassCardSheen />
                    <View style={styles.solarMetricTopRow}>
                      <TreegohIcon name="brujula_solar" size={20} color="#FFFFFF" glow={true} glowColor="#FFFFFF" />
                      <Text style={styles.solarMetricBadge}>Otoño</Text>
                    </View>
                    <Text style={styles.solarMetricBigVal}>
                      {annualSolar.autumnProfile.directWindowHours}h
                    </Text>
                    <Text style={styles.solarMetricDesc}>
                      Sol directo en otoño · Elevación {Math.round(annualSolar.autumnProfile.maxSolarElevation)}°
                    </Text>
                  </View>

                  {/* Card 3: Rango Invierno / Verano */}
                  <View style={[styles.solarMetricCard, styles.solarMetricCardWide]}>
                    <GlassCardSheen />
                    <View style={styles.solarMetricTopRow}>
                      <TreegohIcon name="sensor_lux" size={20} color="#FFFFFF" glow={true} glowColor="#FFFFFF" />
                      <Text style={styles.solarMetricBadge}>Rango Anual</Text>
                    </View>
                    <View style={styles.solarRangeRow}>
                      <View style={styles.solarRangeCol}>
                        <Text style={styles.solarRangeVal}>{annualSolar.winterProfile.directWindowHours}h</Text>
                        <Text style={styles.solarRangeLabel}>Invierno</Text>
                      </View>
                      <View style={styles.solarRangeDivider} />
                      <View style={styles.solarRangeCol}>
                        <Text style={styles.solarRangeVal}>{annualSolar.summerProfile.directWindowHours}h</Text>
                        <Text style={styles.solarRangeLabel}>Verano</Text>
                      </View>
                      <View style={styles.solarRangeDivider} />
                      <View style={styles.solarRangeCol}>
                        <Text style={styles.solarRangeVal}>~{estimatedLux.toLocaleString()}</Text>
                        <Text style={styles.solarRangeLabel}>Lux Estimados</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* 3. PARÁMETROS DEL RINCÓN (AUTOCOMPLETADOS CON AJUSTE OPCIONAL) */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>3. Nombre del rincón</Text>
                <View style={styles.inputGlassWrap}>
                  <TreegohIcon name="espacios_microclimas" size={18} color="#FFFFFF" glow={false} />
                  <TextInput
                    style={styles.textInput}
                    value={spaceName}
                    onChangeText={txt => {
                      setSpaceName(txt);
                      setHasCustomEditedName(true);
                    }}
                    placeholder="Ej. Ventanal Salón Este"
                    placeholderTextColor="rgba(255, 255, 255, 0.40)"
                    maxLength={32}
                  />
                  {spaceName.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSpaceName('')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <TreegohIcon name="menos" size={14} color="rgba(255, 255, 255, 0.50)" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* 4. SELECCIÓN DE ESTANCIA (GRID ESPACIOSO DE 2 COLUMNAS) */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>4. Tipo de estancia</Text>
                  <Text style={styles.sectionCounter}>{selectedPreset.name}</Text>
                </View>

                <View style={styles.presetsGrid}>
                  {ROOM_PRESETS.map(preset => {
                    const isSelected = selectedPreset.id === preset.id;
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        style={[styles.presetCard, isSelected && styles.presetCardSelected]}
                        onPress={() => {
                          try { Haptics.selectionAsync(); } catch (_e) {}
                          setSelectedPreset(preset);
                          if (!hasCustomEditedName) {
                            setSpaceName(preset.defaultName);
                          }
                        }}
                        activeOpacity={0.82}
                      >
                        <GlassCardSheen selected={isSelected} />
                        <View style={styles.cardIconTopWrap}>
                          <TreegohIcon
                            name={preset.icon}
                            size={24}
                            color="#FFFFFF"
                            glow={isSelected}
                            glowColor="#FFFFFF"
                          />
                        </View>
                        <View style={styles.cardTextBottomWrap}>
                          <Text
                            style={[
                              styles.presetCardTitle,
                              isSelected && styles.presetCardTitleSelected,
                            ]}
                          >
                            {preset.name}
                          </Text>
                          <Text style={styles.presetCardSub} numberOfLines={1}>
                            {preset.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 5. DISTANCIA A LA VENTANA */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>5. Distancia a la fuente de luz</Text>
                <View style={styles.distanceCardsCol}>
                  {[
                    {
                      key: 'junto_a_ventana',
                      label: 'Junto a la ventana',
                      sub: '< 1 m · Radiación directa',
                    },
                    {
                      key: 'media_distancia',
                      label: 'Media distancia',
                      sub: '1 – 2.5 m · Luz filtrada',
                    },
                    {
                      key: 'rincon_profundo',
                      label: 'Rincón profundo',
                      sub: '> 3 m · Luz suave o penumbra',
                    },
                  ].map(dist => {
                    const isSelected = windowDistance === dist.key;
                    return (
                      <TouchableOpacity
                        key={dist.key}
                        style={[
                          styles.distanceChipCard,
                          isSelected && styles.distanceChipCardSelected,
                        ]}
                        onPress={() => {
                          try { Haptics.selectionAsync(); } catch (_e) {}
                          setWindowDistance(dist.key as any);
                        }}
                        activeOpacity={0.82}
                      >
                        <GlassCardSheen selected={isSelected} />
                        <View style={styles.distanceLeftRow}>
                          <View
                            style={[
                              styles.distanceIconCircle,
                              isSelected && styles.distanceIconCircleSelected,
                            ]}
                          >
                            <TreegohIcon
                              name="ventana_distancia"
                              size={18}
                              color="#FFFFFF"
                              glow={isSelected}
                              glowColor="#FFFFFF"
                            />
                          </View>
                          <View style={styles.distanceTextCol}>
                            <Text
                              style={[
                                styles.distanceChipTitle,
                                isSelected && styles.distanceChipTitleSelected,
                              ]}
                            >
                              {dist.label}
                            </Text>
                            <Text style={styles.distanceChipSub}>{dist.sub}</Text>
                          </View>
                        </View>
                        <View
                          style={[
                            styles.distanceRadioDot,
                            isSelected && styles.distanceRadioDotSelected,
                          ]}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 6. HUMEDAD Y RIESGOS TÉRMICOS */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>6. Humedad ambiental y riesgos térmicos</Text>
                <View style={styles.humidityRow}>
                  {[
                    { key: 'alta', label: 'Alta', sub: '> 65%' },
                    { key: 'media', label: 'Media', sub: '45–65%' },
                    { key: 'seca', label: 'Seca', sub: '< 45%' },
                  ].map(h => {
                    const isSelected = humidityLevel === h.key;
                    return (
                      <TouchableOpacity
                        key={h.key}
                        style={[styles.humidityCard, isSelected && styles.humidityCardSelected]}
                        onPress={() => {
                          try { Haptics.selectionAsync(); } catch (_e) {}
                          setHumidityLevel(h.key as any);
                        }}
                        activeOpacity={0.82}
                      >
                        <GlassCardSheen selected={isSelected} />
                        <TreegohIcon
                          name="humedad_vpd"
                          size={18}
                          color="#FFFFFF"
                          glow={isSelected}
                          glowColor="#FFFFFF"
                        />
                        <Text
                          style={[
                            styles.humidityTitle,
                            isSelected && styles.humidityTitleSelected,
                          ]}
                        >
                          {h.label}
                        </Text>
                        <Text style={styles.humiditySub}>{h.sub}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.thermalTogglesCol}>
                  {[
                    {
                      label: 'Radiador o calefactor cercano',
                      icon: 'alerta_termica' as IconName,
                      active: nearRadiator,
                      toggle: () => setNearRadiator(v => !v),
                    },
                    {
                      label: 'Aire acondicionado directo',
                      icon: 'temperatura_termica' as IconName,
                      active: nearAC,
                      toggle: () => setNearAC(v => !v),
                    },
                    {
                      label: 'Corrientes de aire frecuentes',
                      icon: 'sustrato_aireacion' as IconName,
                      active: drafts,
                      toggle: () => setDrafts(v => !v),
                    },
                  ].map((item, idx) => (
                    <TouchableOpacity
                      key={`risk_${idx}`}
                      style={[styles.toggleRowCard, item.active && styles.toggleRowCardActive]}
                      onPress={() => {
                        try { Haptics.selectionAsync(); } catch (_e) {}
                        item.toggle();
                      }}
                      activeOpacity={0.82}
                    >
                      <GlassCardSheen selected={item.active} />
                      <View style={styles.toggleRowLeft}>
                        <View
                          style={[
                            styles.toggleIconWrap,
                            item.active && styles.toggleIconWrapActive,
                          ]}
                        >
                          <TreegohIcon
                            name={item.icon}
                            size={18}
                            color="#FFFFFF"
                            glow={item.active}
                            glowColor="#FFFFFF"
                          />
                        </View>
                        <Text style={styles.toggleLabel}>{item.label}</Text>
                      </View>
                      <View
                        style={[
                          styles.toggleSwitch,
                          item.active && styles.toggleSwitchActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.toggleThumb,
                            item.active && styles.toggleThumbActive,
                          ]}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 7. PREVISUALIZACIÓN DE CALIBRACIÓN EN VIVO (ESTILO TIDE REPORT CARD) */}
              <View style={styles.liveCalibrationCard}>
                <GlassCardSheen />

                {/* Cabecera espaciosa con badge y nombre */}
                <View style={styles.liveCardHeaderCol}>
                  <View style={styles.liveCardBadgeRow}>
                    <Text style={styles.liveCardBadge}>✦ CALIBRACIÓN BOTÁNICA EN VIVO</Text>
                    <View style={styles.liveRoomTypeBadge}>
                      <Text style={styles.liveRoomTypeBadgeText}>{selectedPreset.name}</Text>
                    </View>
                  </View>
                  <Text style={styles.liveSpaceTitle} numberOfLines={2}>
                    {spaceName || 'Espacio Sin Nombre'}
                  </Text>
                </View>

                {/* Hero del índice de habitabilidad: porcentaje grande sin montarse */}
                <View style={styles.scoreHeroBlock}>
                  <View style={styles.scoreHeroNumberWrap}>
                    <Text style={styles.scoreHeroNumber}>{habitabilityScore}%</Text>
                  </View>
                  <View style={styles.scoreHeroTextCol}>
                    <Text style={styles.scoreHeroTitle}>Habitabilidad del Rincón</Text>
                    <Text style={styles.scoreHeroSub}>
                      {habitabilityScore >= 80
                        ? 'Condiciones excelentes para vegetación de interior'
                        : 'Condiciones moderadas con precauciones recomendadas'}
                    </Text>
                  </View>
                </View>

                {/* Métricas clave en fila espaciosa separadas por divisores */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <TreegohIcon name="sensor_lux" size={17} color="#FFFFFF" glow={true} glowColor="#FFFFFF" />
                    <Text style={styles.metricVal}>~{estimatedLux.toLocaleString()}</Text>
                    <Text style={styles.metricDesc}>Lux diurnos</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <TreegohIcon name="brujula_solar" size={17} color="#FFFFFF" glow={true} glowColor="#FFFFFF" />
                    <Text style={styles.metricVal}>{orientation}</Text>
                    <Text style={styles.metricDesc}>{headingDegrees}° brújula</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <TreegohIcon name="luz_natural" size={17} color="#FFFFFF" glow={true} glowColor="#FFFFFF" />
                    <Text style={styles.metricVal}>{annualSolar.todayProfile.directWindowHours}h</Text>
                    <Text style={styles.metricDesc}>Sol directo hoy</Text>
                  </View>
                </View>

                {/* Especies recomendadas compatibles */}
                <View style={styles.speciesRecommendedWrap}>
                  <Text style={styles.speciesRecTitle}>Especies recomendadas para este microclima:</Text>
                  <View style={styles.speciesChipsWrap}>
                    {recommendedSpecies.map((sp, sIdx) => (
                      <View key={`sp_${sIdx}`} style={styles.specieChip}>
                        <TreegohIcon name="anadir_planta" size={12} color="#FFFFFF" glow={false} />
                        <Text style={styles.specieChipText}>{sp}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* BARRA DE ACCIÓN INFERIOR FLOTANTE ESTILO TIDE PILL */}
            <View style={[styles.bottomBarContainer, { paddingBottom: safeBottom + 12 }]}>
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  !spaceName.trim() && styles.ctaButtonDisabled,
                ]}
                disabled={!spaceName.trim()}
                onPress={handleSaveSpaceAction}
                activeOpacity={0.88}
              >
                <Text style={styles.ctaButtonText}>Guardar Espacio Calibrado</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* VISOR ÓPTICO EN BURBUJA PARA FOTOGRAFIAR EL ESPACIO */}
        <BotanicalCameraBubbleModal
          visible={isBubbleCameraOpen}
          isAnalyzing={isAnalyzingAI}
          liveHeadingDegrees={hasCompassSignal ? liveHeading : headingDegrees}
          liveCompassLabel={orientation}
          estimatedLux={estimatedLux}
          onClose={() => setIsBubbleCameraOpen(false)}
          onCaptureFrame={handleCaptureFrame}
          onPickGalleryInsideModal={async () => {
            setIsBubbleCameraOpen(false);
            await new Promise(r => setTimeout(r, 350));
            await handlePickFromGallery();
          }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 8, 12, 0.76)',
  },
  sheetContainer: {
    flex: 1,
    marginTop: 18,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
  },
  sheetGradient: {
    flex: 1,
  },
  topBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.10)',
  },
  backPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  backPillText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  headerStudioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  headerStudioBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 36,
  },
  headerTitlesCol: {
    gap: 8,
  },
  mainTitle: {
    fontFamily: Fonts.light,
    fontSize: 30,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
    lineHeight: 20,
  },
  sectionBlock: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily: Fonts.light,
    fontSize: 14.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.90)',
    letterSpacing: 0.2,
  },
  sectionCounter: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.50)',
  },
  aiVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(134, 239, 172, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.35)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  aiVerifiedBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: '#86EFAC',
  },

  // HERO CARD DE CÁMARA
  cameraHeroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 22,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  cameraHeroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cameraHeroTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cameraHeroSub: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: '92%',
  },
  cameraActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  openCameraBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  openCameraBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#141416',
  },
  openGalleryBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 6,
  },
  openGalleryBtnText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: '#FFFFFF',
  },

  // CARD DE ANÁLISIS EN PROGRESO
  aiAnalyzingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    padding: 24,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  aiAnalyzingTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop: 4,
  },
  aiAnalyzingSub: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 18,
  },

  // RESULTADO FOTOGRÁFICO CON BADGES
  photoResultWrap: {
    gap: 12,
  },
  photoFrame: {
    width: '100%',
    height: 180,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  photoBadgesTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  photoPillBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  aiDiagnosisNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 14,
    overflow: 'hidden',
  },
  aiDiagnosisNoteText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
    flex: 1,
    lineHeight: 18,
  },
  retakePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 18,
  },
  retakePhotoBtnText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  errorMsgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    padding: 12,
  },
  errorMsgText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: '#FCA5A5',
    flex: 1,
  },

  // CARDS DE TRAYECTORIA SOLAR REAL
  solarCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  solarMetricCard: {
    width: '48.2%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 116,
    overflow: 'hidden',
  },
  solarMetricCardWide: {
    width: '100%',
    minHeight: 100,
  },
  solarMetricTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  solarMetricBadge: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  solarMetricBigVal: {
    fontFamily: Fonts.light,
    fontSize: 26,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  solarMetricDesc: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
    lineHeight: 15,
  },
  solarRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  solarRangeCol: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  solarRangeVal: {
    fontFamily: Fonts.light,
    fontSize: 15,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  solarRangeLabel: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.50)',
  },
  solarRangeDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  // PRESETS GRID (ESTILO TIDE SELECTION CARDS: ESPACIADAS Y AIROSAS)
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  presetCard: {
    width: '47.4%',
    minHeight: 128,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 18,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  presetCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  cardIconTopWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextBottomWrap: {
    gap: 4,
    marginTop: 14,
  },
  presetCardTitle: {
    fontFamily: Fonts.light,
    fontSize: 15.5,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  presetCardTitleSelected: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  presetCardSub: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
  },

  // INPUT WRAP
  inputGlassWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  textInput: {
    flex: 1,
    fontFamily: Fonts.light,
    fontSize: 14.5,
    fontWeight: '300',
    color: '#FFFFFF',
    padding: 0,
  },

  // DISTANCE CARDS
  distanceCardsCol: {
    gap: 12,
  },
  distanceChipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  distanceChipCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  distanceLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  distanceIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceIconCircleSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  distanceTextCol: {
    flex: 1,
    gap: 3,
  },
  distanceChipTitle: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  distanceChipTitleSelected: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  distanceChipSub: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  distanceRadioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.30)',
  },
  distanceRadioDotSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },

  // HUMIDITY CARDS
  humidityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  humidityCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 16,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  humidityCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  humidityTitle: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
  },
  humidityTitleSelected: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  humiditySub: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.50)',
    textAlign: 'center',
  },

  // THERMAL TOGGLES
  thermalTogglesCol: {
    gap: 12,
    marginTop: 6,
  },
  toggleRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  toggleRowCardActive: {
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  toggleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  toggleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIconWrapActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  toggleTextCol: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  toggleSub: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.50)',
  },
  toggleSwitch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 3,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    transform: [{ translateX: 18 }],
  },

  // LIVE CALIBRATION CARD (TIDE REPORT - ESPACIADO Y SIN MONTAR ELEMENTOS)
  liveCalibrationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    padding: 24,
    gap: 20,
    overflow: 'hidden',
  },
  liveCardHeaderCol: {
    gap: 8,
    width: '100%',
  },
  liveCardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  liveCardBadge: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
    letterSpacing: 0.8,
  },
  liveRoomTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  liveRoomTypeBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  liveSpaceTitle: {
    fontFamily: Fonts.light,
    fontSize: 20,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  scoreHeroBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    gap: 16,
  },
  scoreHeroNumberWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreHeroNumber: {
    fontFamily: Fonts.light,
    fontSize: 22,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  scoreHeroTextCol: {
    flex: 1,
    gap: 3,
  },
  scoreHeroTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  scoreHeroSub: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
    lineHeight: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  metricVal: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  metricDesc: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  speciesRecommendedWrap: {
    gap: 10,
  },
  speciesRecTitle: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  speciesChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specieChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  specieChipText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
  },

  // CTA BUTTON
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 14, 18, 0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  ctaButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaButtonDisabled: {
    opacity: 0.35,
  },
  ctaButtonText: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    fontWeight: '400',
    color: '#141416',
    letterSpacing: 0.2,
  },
});
