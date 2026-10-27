import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { TreegohLogo } from '../../components/TreegohLogo';
import { TreegohIcon, IconName } from '../../components/TreegohIcon';
import * as Location from 'expo-location';
import { OnboardingState } from '../../types/onboarding';
import { BotanicalAvatar, getRandomBotanicalAvatar } from '../../constants/botanicalAvatars';

const { width, height } = Dimensions.get('window');

// Video Pexels 7013844 macro de hoja con rocío matutino (EXCLUSIVO PARA PANTALLA DE INTRO)
const PEXELS_VIDEO_URL =
  'https://videos.pexels.com/video-files/7013844/7013844-hd_720_1366_25fps.mp4';

// Zonas bioclimáticas con reglas agronómicas
const PRESET_LOCATIONS = [
  {
    city: 'Madrid, España',
    bioclimaticZone: 'Interior Mediterráneo Continental',
    waterHardness: 'Blanda (ideal para hojas sensibles)',
  },
  {
    city: 'Barcelona, España',
    bioclimaticZone: 'Litoral Mediterráneo Húmedo',
    waterHardness: 'Muy dura (requiere reposo para cal)',
  },
  {
    city: 'Valencia, España',
    bioclimaticZone: 'Mediterráneo Costero Cálido',
    waterHardness: 'Dura (filtrar para Marantas/Calatheas)',
  },
  {
    city: 'Sevilla, España',
    bioclimaticZone: 'Valle del Guadalquivir (Calor extremo)',
    waterHardness: 'Media-Dura (alto VPD en verano)',
  },
  {
    city: 'Bilbao, España',
    bioclimaticZone: 'Atlántico Oceánico Templado',
    waterHardness: 'Muy blanda (óptima para helechos)',
  },
  {
    city: 'La Coruña, España',
    bioclimaticZone: 'Atlántico Gallego Pluvioso',
    waterHardness: 'Muy blanda (sin acumulación de sales)',
  },
  {
    city: 'Las Palmas / Tenerife',
    bioclimaticZone: 'Subtropical Macaronésico',
    waterHardness: 'Media (humedad marina constante)',
  },
];

// Inferencia inteligente de zona bioclimática según GPS
const inferBioclimaticZone = (
  city?: string | null,
  region?: string | null,
  country?: string | null,
  latitude?: number,
  longitude?: number
): { bioclimaticZone: string; waterHardness: string } => {
  const norm = `${city || ''} ${region || ''} ${country || ''}`.toLowerCase();

  if (norm.includes('barcelona') || norm.includes('catalun') || norm.includes('tarragona') || norm.includes('girona') || norm.includes('baleares') || norm.includes('mallorca') || norm.includes('ibiza')) {
    return {
      bioclimaticZone: 'Litoral Mediterráneo Húmedo',
      waterHardness: 'Muy dura (requiere reposo para cal)',
    };
  }
  if (norm.includes('valencia') || norm.includes('alicante') || norm.includes('castell') || norm.includes('murcia')) {
    return {
      bioclimaticZone: 'Mediterráneo Costero Cálido',
      waterHardness: 'Dura (filtrar para Marantas/Calatheas)',
    };
  }
  if (norm.includes('sevilla') || norm.includes('cordoba') || norm.includes('andaluc') || norm.includes('granada') || norm.includes('malaga')) {
    return {
      bioclimaticZone: 'Mediterráneo Continentalizado / Valle Cálido',
      waterHardness: 'Media-Dura (alto VPD en verano)',
    };
  }
  if (norm.includes('bilbao') || norm.includes('vizcaya') || norm.includes('bizkaia') || norm.includes('guipuzcoa') || norm.includes('gipuzkoa') || norm.includes('asturias') || norm.includes('cantabria') || norm.includes('santander')) {
    return {
      bioclimaticZone: 'Atlántico Oceánico Templado',
      waterHardness: 'Muy blanda (óptima para helechos)',
    };
  }
  if (norm.includes('coruña') || norm.includes('galicia') || norm.includes('vigo') || norm.includes('pontevedra') || norm.includes('ourense') || norm.includes('lugo')) {
    return {
      bioclimaticZone: 'Atlántico Gallego Pluvioso',
      waterHardness: 'Muy blanda (sin acumulación de sales)',
    };
  }
  if (norm.includes('palmas') || norm.includes('tenerife') || norm.includes('canarias')) {
    return {
      bioclimaticZone: 'Subtropical Macaronésico',
      waterHardness: 'Media (humedad marina constante)',
    };
  }
  if (norm.includes('madrid') || norm.includes('toledo') || norm.includes('castilla') || norm.includes('aragon') || norm.includes('zaragoza') || norm.includes('valladolid')) {
    return {
      bioclimaticZone: 'Interior Mediterráneo Continental',
      waterHardness: 'Blanda (ideal para hojas sensibles)',
    };
  }

  if (latitude !== undefined) {
    if (Math.abs(latitude) < 23.5) {
      return {
        bioclimaticZone: 'Trópico Húmedo / Ecuatorial',
        waterHardness: 'Media (calibrada por estación)',
      };
    }
    if (latitude >= 36 && latitude <= 44) {
      return {
        bioclimaticZone: 'Zona Templada / Mediterránea',
        waterHardness: 'Blanda-Media',
      };
    }
    if (latitude > 44) {
      return {
        bioclimaticZone: 'Templado Frío / Continental Nórdico',
        waterHardness: 'Blanda (baja salinidad)',
      };
    }
  }

  return {
    bioclimaticZone: 'Microclima Calibrado por Coordenadas',
    waterHardness: 'Media (Ajuste según sensor)',
  };
};

interface OnboardingScreenProps {
  onComplete: (data: OnboardingState) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [isLocationModalVisible, setLocationModalVisible] = useState<boolean>(false);
  const [customCityInput, setCustomCityInput] = useState<string>('');
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [locationDetectionSource, setLocationDetectionSource] = useState<'gps' | 'manual'>('gps');
  const [locationPermissionDenied, setLocationPermissionDenied] = useState<boolean>(false);
  const hasTriggeredGps = useRef<boolean>(false);

  // Avatar botánico aleatorio asignado de la base de datos de especies
  const [assignedAvatar] = useState<BotanicalAvatar>(() => getRandomBotanicalAvatar());

  const horizontalScrollRef = useRef<any>(null);

  // Video en bucle exclusivo para la pantalla 1
  const videoPlayer = useVideoPlayer(PEXELS_VIDEO_URL, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const [state, setState] = useState<OnboardingState>({
    currentStep: 1,
    goals: ['prevent_death'],
    location: {
      city: 'Madrid, España',
      bioclimaticZone: 'Interior Mediterráneo Continental',
      waterHardness: 'Blanda (óptima para hojas sensibles)',
    },
    spaces: ['Salón Luminoso'],
    safetyFilter: {
      hasPets: true,
      hasChildren: false,
    },
    characterCalibrated: false,
    isGuest: true,
    assignedAvatar,
  });

  // Haptic feedback sutil unificado para no abrumar
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Navegación fluida por scroll horizontal de fase en fase (sin recarga de página)
  const navigateToStep = (targetStep: number) => {
    if (targetStep < 1 || targetStep > 7) return;
    triggerHaptic();
    setStep(targetStep);
    horizontalScrollRef.current?.scrollTo({
      x: (targetStep - 1) * width,
      animated: true,
    });
  };

  const nextStep = () => {
    triggerHaptic();
    if (step < 7) {
      navigateToStep(step + 1);
    } else {
      onComplete({ ...state, assignedAvatar });
    }
  };

  const prevStep = () => {
    triggerHaptic();
    if (step > 1) {
      navigateToStep(step - 1);
    }
  };

  const toggleGoal = (id: string) => {
    triggerHaptic();
    setState(prev => {
      const exists = prev.goals.includes(id);
      return {
        ...prev,
        goals: exists ? prev.goals.filter(g => g !== id) : [...prev.goals, id],
      };
    });
  };

  const toggleSpace = (name: string) => {
    triggerHaptic();
    setState(prev => {
      const exists = prev.spaces.includes(name);
      return {
        ...prev,
        spaces: exists ? prev.spaces.filter(s => s !== name) : [...prev.spaces, name],
      };
    });
  };

  // Detección automática de ubicación real del usuario vía GPS
  const detectUserLocation = async (isManualRetry = false) => {
    try {
      setIsDetectingLocation(true);
      setLocationPermissionDenied(false);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermissionDenied(true);
        setIsDetectingLocation(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;

      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const cityName = addr.city || addr.subregion || addr.region || addr.name || 'Mi Ubicación';
        const regionName = addr.region || addr.country || '';
        const displayCity = regionName ? `${cityName}, ${regionName}` : cityName;

        const { bioclimaticZone, waterHardness } = inferBioclimaticZone(
          addr.city,
          addr.region,
          addr.country,
          latitude,
          longitude
        );

        setState(prev => ({
          ...prev,
          location: {
            city: displayCity,
            bioclimaticZone,
            waterHardness,
          },
        }));

        setLocationDetectionSource('gps');
        if (isManualRetry) {
          triggerHaptic();
        }
      }
    } catch (err) {
      console.warn('Error detectando ubicación real:', err);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  useEffect(() => {
    if (step === 3 && !hasTriggeredGps.current) {
      hasTriggeredGps.current = true;
      detectUserLocation();
    }
  }, [step]);

  const handleSelectLocation = (loc: typeof PRESET_LOCATIONS[0]) => {
    triggerHaptic();
    setState(prev => ({
      ...prev,
      location: {
        city: loc.city,
        bioclimaticZone: loc.bioclimaticZone,
        waterHardness: loc.waterHardness,
      },
    }));
    setLocationDetectionSource('manual');
    setLocationModalVisible(false);
  };

  const handleApplyCustomCity = () => {
    if (!customCityInput.trim()) return;
    triggerHaptic();
    const { bioclimaticZone, waterHardness } = inferBioclimaticZone(customCityInput);
    setState(prev => ({
      ...prev,
      location: {
        city: customCityInput.trim(),
        bioclimaticZone,
        waterHardness,
      },
    }));
    setLocationDetectionSource('manual');
    setCustomCityInput('');
    setLocationModalVisible(false);
  };

  // Barra de progreso segmentada: el paso actual es una línea muy grande respecto a los faltantes
  const renderSegmentedProgressBar = () => {
    if (step === 1) return null;

    const totalSteps = [2, 3, 4, 5, 6, 7];

    return (
      <View style={styles.topProgressContainer}>
        <View style={styles.progressSegmentsRow}>
          {totalSteps.map(s => {
            const isCurrent = step === s;
            const isCompleted = step > s;
            return (
              <View
                key={s}
                style={[
                  styles.progressSegmentPill,
                  isCurrent
                    ? styles.progressSegmentActiveLarge
                    : isCompleted
                    ? styles.progressSegmentCompleted
                    : styles.progressSegmentPending,
                ]}
              />
            );
          })}
        </View>

        <View style={styles.topBarControls}>
          <TouchableOpacity
            style={styles.backButtonCircle}
            onPress={prevStep}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backChevronText}>‹</Text>
          </TouchableOpacity>

          {step < 7 && (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => {
                triggerHaptic();
                navigateToStep(step + 1);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.skipBtnText}>Omitir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // FASE 1: BIENVENIDA CON VIDEO MACRO INTRO Y OSCURECIMIENTO ELEGANTE
  const renderScreen1 = () => (
    <View style={styles.phasePage}>
      {/* Video exclusivo para el intro */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <VideoView
          player={videoPlayer}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
        <View style={styles.videoIntroDarkOverlay} />
      </View>

      <SafeAreaView style={styles.welcomeSafeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.welcomeTopBlock}>
          <View style={styles.logoWrapper}>
            {step === 1 && (
              <TreegohLogo width={204} height={56} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.welcomeTitleBig}>
            Cuidado botánico inteligente{'\n'}para espacios vivos
          </Text>
          <Text style={styles.welcomeSubLarge}>
            Conecta con el ritmo natural de tus plantas mediante biométrica óptica y microclimas de luz.
          </Text>
        </View>

        <View style={styles.welcomeBottomBlock}>
          <TouchableOpacity
            style={styles.btnTideGlassPrimary}
            activeOpacity={0.85}
            onPress={nextStep}
          >
            <Text style={styles.btnTideGlassPrimaryText}>Comenzar exploración</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGhostPill}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic();
              navigateToStep(7);
            }}
          >
            <Text style={styles.btnGhostText}>Ya tengo una cuenta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );

  // FASE 2: METAS BOTÁNICAS (TARJETAS GLASSMORPHISM CON GLOW EN GRID 2-COLUMNAS TIDE)
  const renderScreen2 = () => {
    const goalOptions: { id: string; title: string; sub: string; icon: IconName }[] = [
      {
        id: 'prevent_death',
        title: 'Evitar marchitez',
        sub: 'Riego por evaporación y humedad',
        icon: 'riego_hidratacion',
      },
      {
        id: 'maximize_growth',
        title: 'Floración & Brillo',
        sub: 'Luxómetro C1 y ciclo de luz activa',
        icon: 'floracion_fenologia',
      },
      {
        id: 'pest_diagnosis',
        title: 'Sanidad & Plagas',
        sub: 'Cámara diagnóstica en 3 tomas',
        icon: 'camara_diagnostica',
      },
      {
        id: 'wellbeing_sanctuary',
        title: 'Santuario Zen',
        sub: 'Soundscapes y purificación biogénica',
        icon: 'sonido_soundscapes',
      },
    ];

    return (
      <View style={styles.phasePage}>
        <ScrollView
          contentContainerStyle={styles.phaseScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.headerTextBlock}>
            <Text style={styles.tideMainTitle}>¿Cuál es tu principal{'\n'}objetivo botánico?</Text>
            <Text style={styles.tideSubTitle}>
              Personalizaremos el algoritmo bioclimático y tus recordatorios preventivos.
            </Text>
          </View>

          <View style={styles.tideGrid2Col}>
            {goalOptions.map(g => {
              const isSelected = state.goals.includes(g.id);
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.tideGlassCard2Col,
                    isSelected ? styles.tideGlassCardSelected : styles.tideGlassCardUnselected,
                  ]}
                  onPress={() => toggleGoal(g.id)}
                  activeOpacity={0.82}
                >
                  <View style={[styles.iconHaloSquircle, isSelected && styles.iconHaloSquircleSelected]}>
                    <TreegohIcon
                      name={g.icon}
                      size={28}
                      color={isSelected ? '#121A15' : '#EAF4ED'}
                    />
                  </View>
                  <View>
                    <Text style={[styles.gridCardTitle, isSelected && styles.gridCardTitleSelected]}>
                      {g.title}
                    </Text>
                    <Text style={[styles.gridCardSub, isSelected && styles.gridCardSubSelected]}>
                      {g.sub}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.phaseBottomSticky}>
            <TouchableOpacity
              style={styles.btnTideGlassPrimary}
              onPress={nextStep}
              activeOpacity={0.85}
            >
              <Text style={styles.btnTideGlassPrimaryText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  // FASE 3: BIOCLIMA & LOCALIZACIÓN METEOROLÓGICA (CON DETECCIÓN GPS)
  const renderScreen3 = () => (
    <View style={styles.phasePage}>
      <ScrollView
        contentContainerStyle={styles.phaseScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.headerTextBlock}>
          <Text style={styles.tideMainTitle}>¿Dónde viven{'\n'}tus plantas?</Text>
          <Text style={styles.tideSubTitle}>
            Conectamos con Open-Meteo para adaptar el riego a la humedad ambiental y avisarte de olas de calor.
          </Text>
        </View>

        <View style={styles.glassmorphContainerCard}>
          <View style={styles.locationHeaderRow}>
            <View style={styles.locationIconBox}>
              <TreegohIcon name="temperatura_termica" size={26} color="#84A98C" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.locationCityName}>{state.location.city}</Text>
              <Text style={styles.locationZoneText}>{state.location.bioclimaticZone}</Text>
            </View>
            <TouchableOpacity
              style={styles.editLocationPill}
              onPress={() => {
                triggerHaptic();
                setLocationModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.editLocationPillText}>Cambiar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.locationStatusPillRow}>
            <View style={styles.statusIndicatorBadge}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isDetectingLocation ? '#E29578' : '#64B5A5' },
                ]}
              />
              <Text style={styles.statusBadgeLabel}>
                {isDetectingLocation
                  ? 'Calibrando sensores GPS...'
                  : locationDetectionSource === 'gps'
                  ? 'GPS Satelital Activo'
                  : 'Ubicación Calibrada Manualmente'}
              </Text>
            </View>

            {locationPermissionDenied && (
              <TouchableOpacity onPress={() => detectUserLocation(true)} style={styles.retryGpsBtn}>
                <Text style={styles.retryGpsBtnText}>Activar GPS</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.waterHardnessBox}>
            <TreegohIcon name="riego_hidratacion" size={16} color="#84A98C" />
            <Text style={styles.waterHardnessText}>
              Agua: {state.location.waterHardness}
            </Text>
          </View>
        </View>

        <View style={styles.glassmorphInfoCard}>
          <View style={styles.infoCardHeader}>
            <TreegohIcon name="humedad_vpd" size={18} color="#84A98C" />
            <Text style={styles.infoCardTitle}>Déficit de Presión de Vapor (VPD)</Text>
          </View>
          <Text style={styles.infoCardBody}>
            Treegoh sincroniza la evapotranspiración foliar en tiempo real. Si la temperatura o la humedad cambian bruscamente, el ciclo de riego se reprograma de inmediato.
          </Text>
        </View>

        <View style={styles.phaseBottomSticky}>
          <TouchableOpacity
            style={styles.btnTideGlassPrimary}
            onPress={nextStep}
            activeOpacity={0.85}
          >
            <Text style={styles.btnTideGlassPrimaryText}>Continuar con esta zona</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // FASE 4: ESPACIOS & MICROCLIMAS (CARDS EN GRID 2-COLUMNAS TIDE)
  const renderScreen4 = () => {
    const spacePresets = [
      { name: 'Salón Luminoso', desc: '1.500 - 4.000 lux filtrados', icon: 'espacios_microclimas' as IconName },
      { name: 'Balcón Exterior', desc: 'Sol matutino y aire puro', icon: 'luz_natural' as IconName },
      { name: 'Dormitorio Zen', desc: 'Luz media sin corrientes', icon: 'espacios_microclimas' as IconName },
      { name: 'Baño Tropical', desc: 'Humedad alta (Helechos)', icon: 'pulverizacion_spray' as IconName },
    ];

    return (
      <View style={styles.phasePage}>
        <ScrollView
          contentContainerStyle={styles.phaseScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.headerTextBlock}>
            <Text style={styles.tideMainTitle}>Configura tus{'\n'}microclimas</Text>
            <Text style={styles.tideSubTitle}>
              Las plantas en un mismo espacio comparten temperatura y radiación lumínica.
            </Text>
          </View>

          <View style={styles.tideGrid2Col}>
            {spacePresets.map(sp => {
              const isSelected = state.spaces.includes(sp.name);
              return (
                <TouchableOpacity
                  key={sp.name}
                  style={[
                    styles.tideGlassCard2Col,
                    isSelected ? styles.tideGlassCardSelected : styles.tideGlassCardUnselected,
                  ]}
                  onPress={() => toggleSpace(sp.name)}
                  activeOpacity={0.82}
                >
                  <View style={[styles.iconHaloSquircle, isSelected && styles.iconHaloSquircleSelected]}>
                    <TreegohIcon
                      name={sp.icon}
                      size={28}
                      color={isSelected ? '#121A15' : '#EAF4ED'}
                    />
                  </View>
                  <View>
                    <Text style={[styles.gridCardTitle, isSelected && styles.gridCardTitleSelected]}>
                      {sp.name}
                    </Text>
                    <Text style={[styles.gridCardSub, isSelected && styles.gridCardSubSelected]}>
                      {sp.desc}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.phaseBottomSticky}>
            <TouchableOpacity
              style={styles.btnTideGlassPrimary}
              onPress={nextStep}
              activeOpacity={0.85}
            >
              <Text style={styles.btnTideGlassPrimaryText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  // FASE 5: SEGURIDAD VITAL (CARDS VERTICALES GENEROSAS QUE LLENAN LA PANTALLA)
  const renderScreen5 = () => (
    <View style={styles.phasePage}>
      <ScrollView
        contentContainerStyle={styles.phaseScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.headerTextBlock}>
          <Text style={styles.tideMainTitle}>Seguridad en{'\n'}el hogar</Text>
          <Text style={styles.tideSubTitle}>
            Filtramos especies con savia urticante o cristales de oxalato cálcico según tu convivencia.
          </Text>
        </View>

        <View style={styles.safetyCardsVerticalStack}>
          {/* Card 1: Hogar con Mascotas */}
          <TouchableOpacity
            style={[
              styles.safetyVerticalCard,
              state.safetyFilter.hasPets ? styles.safetyVerticalCardSelected : styles.safetyVerticalCardUnselected,
            ]}
            activeOpacity={0.85}
            onPress={() => {
              triggerHaptic();
              setState(prev => ({
                ...prev,
                safetyFilter: { ...prev.safetyFilter, hasPets: !prev.safetyFilter.hasPets },
              }));
            }}
          >
            <View style={styles.safetyCardTopRow}>
              <View
                style={[
                  styles.iconHaloSquircle,
                  state.safetyFilter.hasPets && styles.iconHaloSquircleSelected,
                ]}
              >
                <TreegohIcon
                  name="toxicidad_mascotas"
                  size={30}
                  color={state.safetyFilter.hasPets ? '#121A15' : '#EAF4ED'}
                />
              </View>
              <View style={[styles.safetyBadgePill, state.safetyFilter.hasPets && styles.safetyBadgePillActive]}>
                <Text style={[styles.safetyBadgePillText, state.safetyFilter.hasPets && styles.safetyBadgePillTextActive]}>
                  {state.safetyFilter.hasPets ? 'Filtro Activado' : 'Filtro Opcional'}
                </Text>
              </View>
            </View>

            <Text style={[styles.safetyCardTitle, state.safetyFilter.hasPets && styles.safetyCardTitleSelected]}>
              Hogar con animales de compañía
            </Text>
            <Text style={[styles.safetyCardBody, state.safetyFilter.hasPets && styles.safetyCardBodySelected]}>
              Filtro estricto ASPCA: catálogo exclusivo de especies no tóxicas para perros y gatos curiosos (Calatheas, Helechos, Marantas y Peperomias).
            </Text>

            <View style={styles.safetyTraitRow}>
              <TreegohIcon name="tarea_completada" size={15} color={state.safetyFilter.hasPets ? '#52796F' : '#84A98C'} />
              <Text style={[styles.safetyTraitLabel, state.safetyFilter.hasPets && { color: '#354F52' }]}>
                Inocuidad gástrica comprobada
              </Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Espacio Libre / Coleccionista */}
          <TouchableOpacity
            style={[
              styles.safetyVerticalCard,
              !state.safetyFilter.hasPets ? styles.safetyVerticalCardSelected : styles.safetyVerticalCardUnselected,
            ]}
            activeOpacity={0.85}
            onPress={() => {
              triggerHaptic();
              setState(prev => ({
                ...prev,
                safetyFilter: { ...prev.safetyFilter, hasPets: false },
              }));
            }}
          >
            <View style={styles.safetyCardTopRow}>
              <View
                style={[
                  styles.iconHaloSquircle,
                  !state.safetyFilter.hasPets && styles.iconHaloSquircleSelected,
                ]}
              >
                <TreegohIcon
                  name="floracion_fenologia"
                  size={30}
                  color={!state.safetyFilter.hasPets ? '#121A15' : '#EAF4ED'}
                />
              </View>
              <View style={[styles.safetyBadgePill, !state.safetyFilter.hasPets && styles.safetyBadgePillActive]}>
                <Text style={[styles.safetyBadgePillText, !state.safetyFilter.hasPets && styles.safetyBadgePillTextActive]}>
                  Acceso Total
                </Text>
              </View>
            </View>

            <Text style={[styles.safetyCardTitle, !state.safetyFilter.hasPets && styles.safetyCardTitleSelected]}>
              Espacio sin animales (Coleccionista)
            </Text>
            <Text style={[styles.safetyCardBody, !state.safetyFilter.hasPets && styles.safetyCardBodySelected]}>
              Desbloquea todo el catálogo sin restricciones: Monsteras majestuosas, Filodendros exóticos, Alocasias y Ficus de gran porte.
            </Text>

            <View style={styles.safetyTraitRow}>
              <TreegohIcon name="tarea_completada" size={15} color={!state.safetyFilter.hasPets ? '#52796F' : '#84A98C'} />
              <Text style={[styles.safetyTraitLabel, !state.safetyFilter.hasPets && { color: '#354F52' }]}>
                170+ especies botánicas habilitadas
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.phaseBottomSticky}>
          <TouchableOpacity
            style={styles.btnTideGlassPrimary}
            onPress={nextStep}
            activeOpacity={0.85}
          >
            <Text style={styles.btnTideGlassPrimaryText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // FASE 6: RESONANCIA BOTÁNICA & ASIGNACIÓN DE AVATAR BOTÁNICO ALEATORIO
  const renderScreen6 = () => (
    <View style={styles.phasePage}>
      <View style={styles.characterPhaseWrapper}>
        {/* Avatar botánico asignado con foto real de especie y marco luminoso */}
        <View style={styles.avatarGlassOuterHalo}>
          <View style={styles.avatarInnerImageFrame}>
            <Image
              source={{ uri: assignedAvatar.imageUrl }}
              style={styles.avatarPhoto}
              resizeMode="cover"
              onError={(e) => console.log('AVATAR_IMAGE_ERROR:', e.nativeEvent.error)}
              onLoad={() => console.log('AVATAR_IMAGE_LOADED_OK')}
            />
          </View>
        </View>

        <View style={styles.avatarAliasBadge}>
          <TreegohIcon name="floracion_fenologia" size={14} color="#84A98C" />
          <Text style={styles.avatarAliasBadgeText}>Identidad botánica inicial asignada</Text>
        </View>

        <Text style={styles.avatarAliasTitle}>«{assignedAvatar.alias}»</Text>
        <Text style={styles.avatarScientificSubtitle}>{assignedAvatar.scientificName} • {assignedAvatar.species}</Text>

        <View style={styles.avatarTraitGlassCard}>
          <Text style={styles.avatarTraitText}>
            «{assignedAvatar.trait}»
          </Text>
          <Text style={styles.avatarNoteText}>
            Puedes cambiar tu avatar y especie libremente cuando quieras desde tu perfil.
          </Text>
        </View>

        <View style={styles.phaseBottomSticky}>
          <TouchableOpacity
            style={styles.btnTideGlassPrimary}
            onPress={nextStep}
            activeOpacity={0.85}
          >
            <Text style={styles.btnTideGlassPrimaryText}>Entrar a mi santuario</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // FASE 7: AUTENTICACIÓN & MODO INVITADO CON AVATAR ASIGNADO
  const renderScreen7 = () => (
    <View style={styles.phasePage}>
      <ScrollView
        contentContainerStyle={styles.phaseScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.sm }}>
          <View style={styles.authAvatarMiniRing}>
            <Image
              source={{ uri: assignedAvatar.imageUrl }}
              style={styles.authAvatarMiniPhoto}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.authAvatarMiniAlias}>Explorador: {assignedAvatar.alias}</Text>
        </View>

        <View style={styles.headerTextBlock}>
          <Text style={styles.tideMainTitleCentered}>
            Guarda tu colección{'\n'}y mantén tus plantas a salvo
          </Text>
          <Text style={styles.tideSubTitleCentered}>
            Sincroniza tus microclimas, biométrica foliar y alertas preventivas en la nube.
          </Text>
        </View>

        <View style={styles.authButtonsStack}>
          <TouchableOpacity
            style={styles.tideAuthBtn}
            activeOpacity={0.85}
            onPress={() => {
              triggerHaptic();
              onComplete({ ...state, isGuest: false, assignedAvatar });
            }}
          >
            <Text style={styles.tideAuthBtnText}>Continuar con Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tideAuthBtn}
            activeOpacity={0.85}
            onPress={() => {
              triggerHaptic();
              onComplete({ ...state, isGuest: false, assignedAvatar });
            }}
          >
            <Text style={styles.tideAuthBtnText}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tideAuthBtn}
            activeOpacity={0.85}
            onPress={() => {
              triggerHaptic();
              onComplete({ ...state, isGuest: false, assignedAvatar });
            }}
          >
            <Text style={styles.tideAuthBtnText}>Continuar con Correo</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center', marginTop: Spacing.lg }}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              onComplete({ ...state, isGuest: true, assignedAvatar });
            }}
            hitSlop={{ top: 10, bottom: 10, left: 14, right: 14 }}
          >
            <Text style={styles.linkGuestAction}>
              Continuar como {assignedAvatar.alias} (modo local)
            </Text>
          </TouchableOpacity>

          <Text style={styles.legalNoticeText}>
            Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad Botánica.
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" />

      {/* FONDO OSCURO BOTÁNICO AMBIENTAL PARA PASOS 2 A 7 (ESTILO TIDE ATMOSFÉRICO) */}
      {step > 1 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LinearGradient
            colors={['#0F1612', '#15201A', '#1D2D23', '#111813']}
            locations={[0, 0.35, 0.7, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.85, y: 0.95 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Velo de resplandor difuso botánico que da profundidad sin cortes */}
          <LinearGradient
            colors={['rgba(82, 121, 111, 0.32)', 'transparent', 'rgba(132, 169, 140, 0.18)']}
            start={{ x: 0.9, y: 0.1 }}
            end={{ x: 0.1, y: 0.9 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.25)', 'transparent', 'rgba(0, 0, 0, 0.55)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      <SafeAreaView style={styles.safeAreaRoot} edges={['top', 'left', 'right', 'bottom']}>
        {renderSegmentedProgressBar()}

        {/* CONTENEDOR HORIZONTAL SUPER ANCHO CON DESPLAZAMIENTO SUAVE DE FASE EN FASE */}
        <ScrollView
          ref={horizontalScrollRef}
          horizontal={true}
          pagingEnabled={true}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalPagingScroll}
          contentContainerStyle={{ width: width * 7 }}
        >
          {renderScreen1()}
          {renderScreen2()}
          {renderScreen3()}
          {renderScreen4()}
          {renderScreen5()}
          {renderScreen6()}
          {renderScreen7()}
        </ScrollView>
      </SafeAreaView>

      {/* MODAL EDITAR UBICACIÓN MANUALMENTE */}
      <Modal
        visible={isLocationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={Typography.titleMedium}>Seleccionar Ciudad</Text>
              <TouchableOpacity
                onPress={() => setLocationModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalGpsBtn}
              onPress={() => {
                setLocationModalVisible(false);
                detectUserLocation(true);
              }}
            >
              <TreegohIcon name="temperatura_termica" size={18} color="#52796F" />
              <Text style={styles.modalGpsBtnText}>Detectar mi ubicación real actual (GPS)</Text>
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TreegohIcon name="busqueda_typesense" size={18} color="#52796F" />
              <TextInput
                style={styles.textInput}
                placeholder="Escribe tu ciudad o código postal..."
                placeholderTextColor={Colors.mutedText}
                value={customCityInput}
                onChangeText={setCustomCityInput}
                onSubmitEditing={handleApplyCustomCity}
                returnKeyType="done"
              />
              {customCityInput.length > 0 && (
                <TouchableOpacity onPress={handleApplyCustomCity} style={styles.inputApplyBtn}>
                  <Text style={styles.inputApplyBtnText}>Aplicar</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.presetSectionTitle}>Zonas Bioclimáticas Frecuentes:</Text>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {PRESET_LOCATIONS.map((loc, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.locationPresetItem,
                    state.location.city === loc.city && styles.locationPresetItemSelected,
                  ]}
                  onPress={() => handleSelectLocation(loc)}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.presetCityName,
                        state.location.city === loc.city && { color: '#52796F' },
                      ]}
                    >
                      {loc.city}
                    </Text>
                    <Text style={styles.presetZoneName}>{loc.bioclimaticZone}</Text>
                  </View>
                  {state.location.city === loc.city && (
                    <TreegohIcon name="tarea_completada" size={18} color="#52796F" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#0F1612',
  },
  videoIntroDarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 16, 13, 0.48)',
  },
  safeAreaRoot: {
    flex: 1,
  },
  horizontalPagingScroll: {
    flex: 1,
  },
  phasePage: {
    width,
    flex: 1,
    overflow: 'hidden',
  },
  phaseScrollContent: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 40,
    minHeight: height * 0.88,
    justifyContent: 'space-between',
  },
  // Barra de progreso con línea grande para el paso activo
  topProgressContainer: {
    paddingHorizontal: 22,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  progressSegmentsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressSegmentPill: {
    height: 4,
    borderRadius: 2,
  },
  progressSegmentActiveLarge: {
    flex: 3.5, // Mucho más grande respecto a los faltantes
    backgroundColor: '#EAF4ED',
    shadowColor: '#84A98C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  progressSegmentCompleted: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  progressSegmentPending: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  topBarControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 38,
  },
  backChevronText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
  backButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  skipBtnText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  // Bloques de texto tipo editorial TIDE con tipografía el doble de grande
  headerTextBlock: {
    marginBottom: 22,
  },
  tideMainTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 42,
  },
  tideSubTitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 10,
    lineHeight: 22,
  },
  tideMainTitleCentered: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.7,
    lineHeight: 40,
    textAlign: 'center',
  },
  tideSubTitleCentered: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 10,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  // Grid de 2 columnas con tarjetas Glassmorph oscuras y glow al seleccionar
  tideGrid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 10,
  },
  tideGlassCard2Col: {
    width: (width - 44 - 12) / 2,
    minHeight: 174,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
    elevation: 0,
  },
  tideGlassCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
  },
  tideGlassCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: '#84A98C',
    borderWidth: 1.5,
    shadowColor: '#84A98C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  iconHaloSquircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconHaloSquircleSelected: {
    backgroundColor: 'rgba(82, 121, 111, 0.16)',
    shadowColor: '#84A98C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  gridCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 21,
    letterSpacing: -0.3,
  },
  gridCardTitleSelected: {
    color: '#121A15',
  },
  gridCardSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 4,
    lineHeight: 16,
  },
  gridCardSubSelected: {
    color: '#34473C',
  },
  // Botones primarios Glassmorphism con sombreado claro al pulsar
  phaseBottomSticky: {
    width: '100%',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  btnTideGlassPrimary: {
    height: 56,
    width: '100%',
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#84A98C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 3,
  },
  btnTideGlassPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121915',
    letterSpacing: -0.2,
  },
  // Pantalla de Bienvenida
  welcomeSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: Spacing.xl,
  },
  welcomeTopBlock: {
    marginTop: height * 0.11,
  },
  logoWrapper: {
    marginBottom: Spacing.lg,
  },
  welcomeTitleBig: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  welcomeSubLarge: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: Spacing.md,
    lineHeight: 24,
  },
  welcomeBottomBlock: {
    gap: 12,
  },
  btnGhostPill: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.85,
  },
  // Ubicación y Bioclima en fondo oscuro
  glassmorphContainerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    elevation: 0,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(132, 169, 140, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationCityName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 23,
  },
  locationZoneText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.68)',
    marginTop: 2,
  },
  editLocationPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  editLocationPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EAF4ED',
  },
  locationStatusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.70)',
    fontWeight: '500',
  },
  retryGpsBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  retryGpsBtnText: {
    fontSize: 11,
    color: '#84A98C',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  waterHardnessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(132, 169, 140, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 99,
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  waterHardnessText: {
    fontSize: 12,
    color: '#EAF4ED',
    fontWeight: '600',
  },
  glassmorphInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    elevation: 0,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoCardBody: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.70)',
    lineHeight: 19,
  },
  // Sección de Seguridad: Cards verticales generosas que llenan la pantalla
  safetyCardsVerticalStack: {
    gap: 16,
    marginVertical: 12,
  },
  safetyVerticalCard: {
    borderRadius: 24,
    padding: 20,
    elevation: 0,
  },
  safetyVerticalCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  safetyVerticalCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1.5,
    borderColor: '#84A98C',
    shadowColor: '#84A98C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  safetyCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  safetyBadgePill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  safetyBadgePillActive: {
    backgroundColor: 'rgba(82, 121, 111, 0.18)',
  },
  safetyBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.80)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  safetyBadgePillTextActive: {
    color: '#354F52',
  },
  safetyCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  safetyCardTitleSelected: {
    color: '#121A15',
  },
  safetyCardBody: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.68)',
    lineHeight: 19,
    marginTop: 8,
  },
  safetyCardBodySelected: {
    color: '#354F52',
  },
  safetyTraitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  safetyTraitLabel: {
    fontSize: 12,
    color: '#84A98C',
    fontWeight: '600',
  },
  // Fase 6: Avatar Botánico asignado al azar
  characterPhaseWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  avatarGlassOuterHalo: {
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#84A98C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    marginBottom: 20,
  },
  avatarInnerImageFrame: {
    width: 134,
    height: 134,
    borderRadius: 67,
    overflow: 'hidden',
    backgroundColor: '#1C2B22',
  },
  avatarPhoto: {
    width: 134,
    height: 134,
    borderRadius: 67,
  },
  avatarAliasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(132, 169, 140, 0.16)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 99,
    marginBottom: 10,
  },
  avatarAliasBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EAF4ED',
  },
  avatarAliasTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  avatarScientificSubtitle: {
    fontSize: 13,
    color: '#84A98C',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  avatarTraitGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  avatarTraitText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 21,
  },
  avatarNoteText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  // Fase 7: Auth y Guest
  authAvatarMiniRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#84A98C',
    overflow: 'hidden',
    marginBottom: 8,
  },
  authAvatarMiniPhoto: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  authAvatarMiniAlias: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EAF4ED',
  },
  authButtonsStack: {
    gap: 12,
    marginVertical: 16,
  },
  tideAuthBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
  },
  tideAuthBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  linkGuestAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#84A98C',
    textDecorationLine: 'underline',
    marginBottom: 12,
  },
  legalNoticeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.50)',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 24,
  },
  // Modal de Ubicación
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: height * 0.82,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(20, 28, 25, 0.15)',
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCloseText: {
    fontSize: 14,
    color: Colors.mutedText,
    fontWeight: '600',
  },
  modalGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(82, 121, 111, 0.08)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  modalGpsBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52796F',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 18,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.darkObsidian,
  },
  inputApplyBtn: {
    backgroundColor: '#52796F',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  inputApplyBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  presetSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.mutedText,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationPresetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20, 28, 25, 0.05)',
  },
  locationPresetItemSelected: {
    backgroundColor: 'rgba(82, 121, 111, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  presetCityName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkObsidian,
  },
  presetZoneName: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 2,
  },
});
