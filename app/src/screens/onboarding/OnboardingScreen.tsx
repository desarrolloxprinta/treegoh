import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

// Video botánico macro para intro y auth
const PEXELS_VIDEO_URL =
  'https://videos.pexels.com/video-files/7013844/7013844-hd_720_1366_25fps.mp4';

interface Props {
  onComplete: (state: OnboardingState) => void;
  onLoginPress?: () => void;
}

export const OnboardingScreen: React.FC<Props> = ({ onComplete, onLoginPress }) => {
  const [step, setStep] = useState(1);
  const horizontalScrollRef = useRef<any>(null);

  // Reproductor de video expo-video (para Paso 1 y Paso 7)
  const videoPlayer = useVideoPlayer(PEXELS_VIDEO_URL, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // Reanudar video en pantalla de inicio (Paso 1) y en registro/auth (Paso 7)
  useEffect(() => {
    try {
      if (step === 1 || step === 7) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    } catch (_e) {
      // Ignorar si el reproductor está inicializando
    }
  }, [step, videoPlayer]);

  // Estado de detección de ubicación real del dispositivo
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetectionSource, setLocationDetectionSource] = useState<'gps' | 'fallback' | 'manual'>('fallback');
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [searchCityQuery, setSearchCityQuery] = useState('');

  // Avatar botánico asignado aleatoriamente desde la base de datos de especies
  const [assignedAvatar] = useState<BotanicalAvatar>(() => getRandomBotanicalAvatar());

  const [state, setState] = useState<OnboardingState>({
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
    currentStep: 1,
    characterCalibrated: true,
    isGuest: false,
    assignedAvatar,
  });

  // Haptic feedback sutil unificado
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Navegación fluida por scroll horizontal de fase en fase
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

  // Geocodificación y Bioclima
  const inferBioclimaticZone = (city: string): { bioclimaticZone: string; waterHardness: string } => {
    const c = city.toLowerCase();
    if (c.includes('barcelona') || c.includes('valencia') || c.includes('alicante') || c.includes('málaga') || c.includes('palma')) {
      return {
        bioclimaticZone: 'Mediterráneo Costero Húmedo',
        waterHardness: 'Dura (precaución acumulación calcárea)',
      };
    }
    if (c.includes('bilbao') || c.includes('coruña') || c.includes('santander') || c.includes('oviedo') || c.includes('vigo') || c.includes('san sebastián')) {
      return {
        bioclimaticZone: 'Atlántico / Oceánico Templado',
        waterHardness: 'Muy Blanda (Baja mineralización)',
      };
    }
    if (c.includes('sevilla') || c.includes('córdoba') || c.includes('granada') || c.includes('murcia')) {
      return {
        bioclimaticZone: 'Mediterráneo Meridional Cálido',
        waterHardness: 'Media / Semidura',
      };
    }
    if (c.includes('bogot') || c.includes('quito') || c.includes('la paz')) {
      return {
        bioclimaticZone: 'Trópico de Montaña / Altitud',
        waterHardness: 'Blanda de alta pureza',
      };
    }
    if (c.includes('méxico') || c.includes('mexico') || c.includes('guadalajara') || c.includes('monterrey')) {
      return {
        bioclimaticZone: 'Subtropical Templado de Altura',
        waterHardness: 'Semidura equilibrada',
      };
    }
    if (c.includes('santiago') || c.includes('lima')) {
      return {
        bioclimaticZone: 'Costa Pacífica Semiárida',
        waterHardness: 'Dura / Muy mineralizada',
      };
    }
    if (c.includes('buenos aires') || c.includes('montevideo')) {
      return {
        bioclimaticZone: 'Pampeano Húmedo Templado',
        waterHardness: 'Blanda equilibrada',
      };
    }
    return {
      bioclimaticZone: 'Interior Mediterráneo Continental',
      waterHardness: 'Blanda (óptima para hojas sensibles)',
    };
  };

  const detectUserLocation = async (userInitiated = false) => {
    if (isDetectingLocation) return;
    setIsDetectingLocation(true);
    setLocationPermissionDenied(false);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermissionDenied(true);
        setLocationDetectionSource('fallback');
        setIsDetectingLocation(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });

      let detectedCity = 'Ubicación Detectada';
      if (reverseGeocode && reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const cityName = place.city || place.subregion || place.region || 'Tu Zona';
        const countryName = place.country || '';
        detectedCity = countryName ? `${cityName}, ${countryName}` : cityName;
      }

      const bioData = inferBioclimaticZone(detectedCity);

      setState(prev => ({
        ...prev,
        location: {
          city: detectedCity,
          bioclimaticZone: bioData.bioclimaticZone,
          waterHardness: bioData.waterHardness,
        },
      }));
      setLocationDetectionSource('gps');
    } catch (error) {
      console.warn('Error detectando ubicación real:', error);
      setLocationDetectionSource('fallback');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  useEffect(() => {
    detectUserLocation(false);
  }, []);

  const manualCities = [
    { city: 'Madrid, España', zone: 'Interior Mediterráneo Continental', water: 'Blanda (óptima para hojas sensibles)' },
    { city: 'Barcelona, España', zone: 'Mediterráneo Costero', water: 'Dura (precaución acumulación de cal)' },
    { city: 'Valencia, España', zone: 'Mediterráneo Litoral', water: 'Muy Dura (descalcificar o reposar)' },
    { city: 'Sevilla, España', zone: 'Mediterráneo Meridional Cálido', water: 'Media / Semidura' },
    { city: 'Bilbao, España', zone: 'Atlántico Húmedo Templado', water: 'Muy Blanda (Baja mineralización)' },
    { city: 'Bogotá, Colombia', zone: 'Trópico de Montaña / Altitud', water: 'Blanda de alta pureza' },
    { city: 'Ciudad de México, México', zone: 'Subtropical Templado de Altura', water: 'Semidura equilibrada' },
    { city: 'Santiago, Chile', zone: 'Mediterráneo Semiárido', water: 'Dura / Muy mineralizada' },
    { city: 'Buenos Aires, Argentina', zone: 'Pampeano Húmedo Templado', water: 'Blanda equilibrada' },
  ];

  const handleSelectManualCity = (item: typeof manualCities[0]) => {
    triggerHaptic();
    setState(prev => ({
      ...prev,
      location: {
        city: item.city,
        bioclimaticZone: item.zone,
        waterHardness: item.water,
      },
    }));
    setLocationDetectionSource('manual');
    setLocationModalVisible(false);
  };

  // BARRA DE PROGRESO SUPERIOR: El paso actual es una línea muy grande y luminosa
  const renderSegmentedProgressBar = () => {
    if (step === 1) return null;
    return (
      <View style={styles.headerContainer}>
        <View style={styles.stepProgressContainer}>
          {[2, 3, 4, 5, 6, 7].map(s => {
            const isActive = s === step;
            const isCompleted = s < step;
            return (
              <View
                key={s}
                style={[
                  styles.progressSegmentBase,
                  isActive && styles.progressSegmentActiveLarge,
                  isCompleted && styles.progressSegmentCompleted,
                  !isActive && !isCompleted && styles.progressSegmentInactive,
                ]}
              />
            );
          })}
        </View>

        <View style={styles.headerControlsRow}>
          <TouchableOpacity
            onPress={prevStep}
            style={styles.headerBackCircleBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Text style={styles.backChevronText}>‹</Text>
          </TouchableOpacity>

          {step < 7 && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                navigateToStep(step + 1);
              }}
              style={styles.headerSkipPill}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.75}
            >
              <Text style={styles.headerSkipText}>Omitir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // FASE 1: BIENVENIDA CON VIDEO MACRO INTRO Y OSCURECIMIENTO ELEGANTE
  const renderScreen1 = () => (
    <View style={styles.phasePage}>
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
            onPress={nextStep}
            activeOpacity={0.85}
          >
            <Text style={styles.btnTideGlassPrimaryText}>Comenzar exploración</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGhostPill}
            onPress={onLoginPress || (() => onComplete({ ...state, isGuest: true, assignedAvatar }))}
            activeOpacity={0.7}
          >
            <Text style={styles.btnGhostText}>Ya tengo una cuenta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );

  // FASE 2: METAS BOTÁNICAS (GRID 2 COLUMNAS GLASSPHORPHISM, SIN SCROLL)
  const renderScreen2 = () => {
    const goalOptions: { id: string; title: string; sub: string; icon: IconName }[] = [
      {
        id: 'prevent_death',
        title: 'Evitar marchitez',
        sub: 'Riego predictivo y curva de absorción.',
        icon: 'riego_hidratacion',
      },
      {
        id: 'maximize_growth',
        title: 'Floración activa',
        sub: 'Luxómetro C1 y fotoperiodo circadiano.',
        icon: 'floracion_fenologia',
      },
      {
        id: 'pest_diagnosis',
        title: 'Sanidad foliar',
        sub: 'Detección temprana de patógenos.',
        icon: 'camara_diagnostica',
      },
      {
        id: 'wellbeing_sanctuary',
        title: 'Santuario Zen',
        sub: 'Soundscapes y bienestar biogénico.',
        icon: 'sonido_soundscapes',
      },
    ];

    return (
      <View style={styles.phasePage}>
        <View style={styles.phaseFixedContent}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.tideMainTitle}>¿Cuál es tu principal{'\n'}objetivo botánico?</Text>
            <Text style={styles.tideSubTitle}>
              Personalizaremos el algoritmo bioclimático y tus recordatorios preventivos.
            </Text>
          </View>

          {/* GRID DE 2 COLUMNAS (4 CARDS GLASSPHORPHISM) */}
          <View style={styles.gridTwoColumns}>
            {goalOptions.map(g => {
              const isSelected = state.goals.includes(g.id);
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.gridGlassCard,
                    isSelected ? styles.gridGlassCardSelected : styles.gridGlassCardUnselected,
                  ]}
                  onPress={() => toggleGoal(g.id)}
                  activeOpacity={0.82}
                >
                  {/* Refracción Glassmorphism en estado no seleccionado */}
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
                    {/* Icono limpio: sin caja glow, solo el icono con su color/luz */}
                    <View style={styles.cleanIconWrap}>
                      <TreegohIcon
                        name={g.icon}
                        size={30}
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
                    <Text style={[styles.gridCardTitle, isSelected && styles.gridCardTitleSelected]} numberOfLines={2}>
                      {g.title}
                    </Text>
                    <Text style={[styles.gridCardSub, isSelected && styles.gridCardSubSelected]} numberOfLines={2}>
                      {g.sub}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.phaseBottomStickyFixed}>
            <TouchableOpacity
              style={styles.btnTideGlassPrimary}
              onPress={nextStep}
              activeOpacity={0.85}
            >
              <Text style={styles.btnTideGlassPrimaryText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // FASE 3: BIOCLIMA & LOCALIZACIÓN METEOROLÓGICA (CARDS GLASSPHORPHISM SIN SCROLL)
  const renderScreen3 = () => (
    <View style={styles.phasePage}>
      <View style={styles.phaseFixedContent}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.tideMainTitle}>¿Dónde viven{'\n'}tus plantas?</Text>
          <Text style={styles.tideSubTitle}>
            Conectamos con Open-Meteo para adaptar el riego a la humedad ambiental y avisarte de olas de calor.
          </Text>
        </View>

        <View style={styles.compactCardsStack}>
          {/* Card Glassmorphic de Localización */}
          <View style={styles.compactGlassCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.compactCardTopRow}>
              <View style={styles.cleanIconWrap}>
                <TreegohIcon name="temperatura_termica" size={28} color="#EAF4ED" />
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

            <Text style={styles.locationCityNameLarge}>{state.location.city}</Text>
            <Text style={styles.locationZoneTextLarge}>{state.location.bioclimaticZone}</Text>

            <View style={styles.compactBadgeRow}>
              <View style={styles.statusIndicatorBadge}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isDetectingLocation ? '#E29578' : '#64B5A5' },
                  ]}
                />
                <Text style={styles.statusBadgeLabel}>
                  {isDetectingLocation ? 'Calibrando...' : 'GPS Satelital Activo'}
                </Text>
              </View>
              <View style={styles.waterPillBadge}>
                <TreegohIcon name="riego_hidratacion" size={13} color="#EAF4ED" />
                <Text style={styles.waterPillBadgeText}>Agua Blanda</Text>
              </View>
            </View>
          </View>

          {/* Card Glassmorphic de Déficit de Presión de Vapor (VPD) */}
          <View style={styles.compactGlassCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.compactCardTopRow}>
              <View style={styles.cleanIconWrap}>
                <TreegohIcon name="humedad_vpd" size={28} color="#EAF4ED" />
              </View>
              <View style={styles.vpdBadgePill}>
                <Text style={styles.vpdBadgePillText}>Bioclima Activo</Text>
              </View>
            </View>

            <Text style={styles.vpdCardTitle}>Déficit de Presión de Vapor (VPD)</Text>
            <Text style={styles.vpdCardBody}>
              Treegoh sincroniza la tasa de evapotranspiración foliar en tiempo real para optimizar el ciclo de riego.
            </Text>
          </View>
        </View>

        <View style={styles.phaseBottomStickyFixed}>
          <TouchableOpacity
            style={styles.btnTideGlassPrimary}
            onPress={nextStep}
            activeOpacity={0.85}
          >
            <Text style={styles.btnTideGlassPrimaryText}>Continuar con esta zona</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // FASE 4: ESPACIOS & MICROCLIMAS (GRID 2 COLUMNAS GLASSPHORPHISM, SIN SCROLL)
  const renderScreen4 = () => {
    const spacePresets = [
      { name: 'Salón Luminoso', desc: '1.500 - 4.000 lux filtrados', icon: 'luz_natural' as IconName },
      { name: 'Balcón Exterior', desc: 'Sol directo y brisa natural', icon: 'temperatura_termica' as IconName },
      { name: 'Dormitorio Zen', desc: 'Luz media difusa sin corrientes', icon: 'humedad_vpd' as IconName },
      { name: 'Baño Tropical', desc: 'Humedad ambiental alta >70%', icon: 'pulverizacion_spray' as IconName },
    ];

    return (
      <View style={styles.phasePage}>
        <View style={styles.phaseFixedContent}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.tideMainTitle}>Configura tus{'\n'}microclimas</Text>
            <Text style={styles.tideSubTitle}>
              Las plantas en un mismo espacio comparten temperatura, fotoperiodo y radiación lumínica.
            </Text>
          </View>

          {/* GRID DE 2 COLUMNAS (4 PRESETS GLASSPHORPHISM) */}
          <View style={styles.gridTwoColumns}>
            {spacePresets.map(sp => {
              const isSelected = state.spaces.includes(sp.name);
              return (
                <TouchableOpacity
                  key={sp.name}
                  style={[
                    styles.gridGlassCard,
                    isSelected ? styles.gridGlassCardSelected : styles.gridGlassCardUnselected,
                  ]}
                  onPress={() => toggleSpace(sp.name)}
                  activeOpacity={0.82}
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
                        name={sp.icon}
                        size={30}
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
                    <Text style={[styles.gridCardTitle, isSelected && styles.gridCardTitleSelected]} numberOfLines={2}>
                      {sp.name}
                    </Text>
                    <Text style={[styles.gridCardSub, isSelected && styles.gridCardSubSelected]} numberOfLines={2}>
                      {sp.desc}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.phaseBottomStickyFixed}>
            <TouchableOpacity
              style={styles.btnTideGlassPrimary}
              onPress={nextStep}
              activeOpacity={0.85}
            >
              <Text style={styles.btnTideGlassPrimaryText}>Continuar con estos espacios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // FASE 5: SEGURIDAD EN EL HOGAR (2 COLUMNAS SIDE-BY-SIDE GLASSPHORPHISM, SIN SCROLL)
  const renderScreen5 = () => {
    const hasPets = state.safetyFilter.hasPets;
    return (
      <View style={styles.phasePage}>
        <View style={styles.phaseFixedContent}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.tideMainTitle}>Seguridad en{'\n'}el hogar</Text>
            <Text style={styles.tideSubTitle}>
              Filtramos especies con savia urticante o cristales de oxalato cálcico según tu convivencia.
            </Text>
          </View>

          <View style={styles.gridTwoColumns}>
            {/* Opción 1: Con mascotas */}
            <TouchableOpacity
              style={[
                styles.gridGlassCardSafety,
                hasPets ? styles.gridGlassCardSelected : styles.gridGlassCardUnselected,
              ]}
              activeOpacity={0.85}
              onPress={() => {
                triggerHaptic();
                setState(prev => ({
                  ...prev,
                  safetyFilter: { ...prev.safetyFilter, hasPets: true },
                }));
              }}
            >
              {!hasPets && (
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
                    name="toxicidad_mascotas"
                    size={32}
                    color={hasPets ? '#121A15' : '#EAF4ED'}
                  />
                </View>
                <View style={[styles.gridCheckCircle, hasPets && styles.gridCheckCircleSelected]}>
                  {hasPets ? (
                    <TreegohIcon name="tarea_completada" size={14} color="#121A15" />
                  ) : (
                    <View style={styles.gridRadioDotEmpty} />
                  )}
                </View>
              </View>

              <View style={styles.gridCardTextWrap}>
                <Text style={[styles.gridCardTitle, hasPets && styles.gridCardTitleSelected]} numberOfLines={2}>
                  Con animales de compañía
                </Text>
                <Text style={[styles.gridCardSub, hasPets && styles.gridCardSubSelected]} numberOfLines={3}>
                  Filtro estricto ASPCA: especies 100% no tóxicas para perros y gatos.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Opción 2: Sin mascotas / Coleccionista */}
            <TouchableOpacity
              style={[
                styles.gridGlassCardSafety,
                !hasPets ? styles.gridGlassCardSelected : styles.gridGlassCardUnselected,
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
              {hasPets && (
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
                    name="floracion_fenologia"
                    size={32}
                    color={!hasPets ? '#121A15' : '#EAF4ED'}
                  />
                </View>
                <View style={[styles.gridCheckCircle, !hasPets && styles.gridCheckCircleSelected]}>
                  {!hasPets ? (
                    <TreegohIcon name="tarea_completada" size={14} color="#121A15" />
                  ) : (
                    <View style={styles.gridRadioDotEmpty} />
                  )}
                </View>
              </View>

              <View style={styles.gridCardTextWrap}>
                <Text style={[styles.gridCardTitle, !hasPets && styles.gridCardTitleSelected]} numberOfLines={2}>
                  Sin mascotas (Coleccionista)
                </Text>
                <Text style={[styles.gridCardSub, !hasPets && styles.gridCardSubSelected]} numberOfLines={3}>
                  Catálogo botánico total: 170+ especies sin restricciones.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.phaseBottomStickyFixed}>
            <TouchableOpacity
              style={styles.btnTideGlassPrimary}
              onPress={nextStep}
              activeOpacity={0.85}
            >
              <Text style={styles.btnTideGlassPrimaryText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // FASE 6: RESONANCIA BOTÁNICA & ASIGNACIÓN DE AVATAR BOTÁNICO ALEATORIO (SIN SÍMBOLOS «»)
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
            />
          </View>
        </View>

        <View style={styles.avatarAliasBadge}>
          <TreegohIcon name="floracion_fenologia" size={14} color="#84A98C" />
          <Text style={styles.avatarAliasBadgeText}>Identidad botánica inicial asignada</Text>
        </View>

        <Text style={styles.avatarAliasTitle}>{assignedAvatar.alias}</Text>
        <Text style={styles.avatarScientificSubtitle}>{assignedAvatar.scientificName} • {assignedAvatar.species}</Text>

        <View style={styles.avatarTraitGlassCard}>
          <Text style={styles.avatarTraitText}>
            {assignedAvatar.trait}
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

  // FASE 7: AUTENTICACIÓN & MODO INVITADO CON VIDEO DE FONDO NUEVAMENTE
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
            activeOpacity={0.7}
          >
            <Text style={styles.guestLinkText}>
              Continuar como {assignedAvatar.alias} (modo local)
            </Text>
          </TouchableOpacity>
          <Text style={styles.legalDisclaimerText}>
            Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad Botánica.
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" />

      {/* VIDEO DE FONDO PERMANENTEMENTE MONTADO, VISIBLE EN PASO 1 (INTRO) Y PASO 7 (AUTH REGISTRO) */}
      <View
        style={[
          styles.videoAbsoluteContainer,
          { opacity: step === 1 || step === 7 ? 1 : 0 },
        ]}
        pointerEvents="none"
      >
        <VideoView
          player={videoPlayer}
          style={styles.videoAbsoluteContainer}
          contentFit="cover"
          nativeControls={false}
        />
        <View style={styles.videoIntroDarkOverlay} />
      </View>

      {/* FONDO BOTÁNICO AMBIENTAL TIDE (50% MÁS CLARO, LUMINOSO FOREST-SAGE) */}
      {step > 1 && step < 7 && (
        <View style={styles.videoAbsoluteContainer} pointerEvents="none">
          <LinearGradient
            colors={['#24372B', '#2E4436', '#3A5745', '#283B2E']}
            locations={[0, 0.35, 0.7, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.85, y: 0.95 }}
            style={styles.videoAbsoluteContainer}
          />
          {/* Velo de resplandor difuso botánico luminoso */}
          <LinearGradient
            colors={['rgba(132, 169, 140, 0.40)', 'transparent', 'rgba(163, 201, 168, 0.28)']}
            start={{ x: 0.85, y: 0.05 }}
            end={{ x: 0.15, y: 0.95 }}
            style={styles.videoAbsoluteContainer}
          />
          {/* Suave viñeta de profundidad */}
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.05)', 'transparent', 'rgba(18, 28, 20, 0.30)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.videoAbsoluteContainer}
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
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Buscar ciudad (ej. Madrid, Bogotá)..."
              placeholderTextColor="rgba(255, 255, 255, 0.45)"
              value={searchCityQuery}
              onChangeText={setSearchCityQuery}
              autoCorrect={false}
            />

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {manualCities
                .filter(c => c.city.toLowerCase().includes(searchCityQuery.toLowerCase()))
                .map(item => (
                  <TouchableOpacity
                    key={item.city}
                    style={styles.modalCityOption}
                    onPress={() => handleSelectManualCity(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalCityIconWrap}>
                      <TreegohIcon name="temperatura_termica" size={18} color="#84A98C" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.modalCityNameText}>{item.city}</Text>
                      <Text style={styles.modalCityZoneText}>{item.zone}</Text>
                    </View>
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
  // CONTENIDO FIJO SIN SCROLL INNECESARIO
  phaseFixedContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    justifyContent: 'space-between',
  },
  phaseBottomStickyFixed: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  // GRID DE 2 COLUMNAS GLASSPHORPHISM
  gridTwoColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  gridGlassCard: {
    width: (width - 40 - 12) / 2,
    height: 164,
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  gridGlassCardSafety: {
    width: (width - 40 - 12) / 2,
    height: 205,
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  gridGlassCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  gridGlassCardSelected: {
    backgroundColor: '#E8EFE7',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
    shadowColor: '#84A98C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  gridCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cleanIconWrap: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCheckCircleSelected: {
    backgroundColor: '#C5D6C6',
    borderColor: '#121A15',
  },
  gridRadioDotEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  gridCardTextWrap: {
    gap: 4,
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    lineHeight: 19,
  },
  gridCardTitleSelected: {
    color: '#121A15',
  },
  gridCardSub: {
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255, 255, 255, 0.68)',
    fontWeight: '400',
  },
  gridCardSubSelected: {
    color: '#3B4E41',
  },
  // COMPACT CARDS PARA PASO 3 (SIN SCROLL)
  compactCardsStack: {
    gap: 12,
    marginVertical: 4,
  },
  compactGlassCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  compactCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  waterPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  waterPillBadgeText: {
    fontSize: 12,
    color: '#EAF4ED',
    fontWeight: '500',
  },

  screenRoot: {
    flex: 1,
    backgroundColor: '#203126',
  },
  safeAreaRoot: {
    flex: 1,
  },
  videoAbsoluteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoIntroDarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 16, 12, 0.62)',
  },
  headerContainer: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 6,
    zIndex: 10,
  },
  stepProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 5,
    marginBottom: 16,
  },
  progressSegmentBase: {
    height: 4,
    borderRadius: 2,
  },
  progressSegmentActiveLarge: {
    flex: 3.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#EAF4ED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  progressSegmentCompleted: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  progressSegmentInactive: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  headerControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBackCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  backChevronText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
  headerSkipPill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  headerSkipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EAF4ED',
  },
  horizontalPagingScroll: {
    flex: 1,
  },
  phasePage: {
    width,
    flex: 1,
    backgroundColor: 'transparent',
  },
  phaseScrollContent: {
    paddingHorizontal: 22,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl + 20,
  },
  headerTextBlock: {
    marginBottom: Spacing.lg,
  },
  tideMainTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 42,
    letterSpacing: -0.8,
  },
  tideMainTitleCentered: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 40,
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  tideSubTitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 8,
    lineHeight: 22,
  },
  tideSubTitleCentered: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 8,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  // STACK DE CARDS VERTICALES ESPACIOSAS (Similares a Seguridad en el Hogar)
  verticalCardsStack: {
    gap: 14,
    marginVertical: 10,
  },
  verticalSpaciousCard: {
    borderRadius: 24,
    padding: 20,
    elevation: 0,
  },
  verticalSpaciousCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  verticalSpaciousCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.5,
    borderColor: '#84A98C',
    shadowColor: '#84A98C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.50,
    shadowRadius: 18,
  },
  verticalCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  // GLOW EN LA ICONOGRAFÍA: Resplandor verde menta luminoso
  iconHaloSquircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(132, 169, 140, 0.26)',
    borderWidth: 2,
    borderColor: 'rgba(132, 169, 140, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#84A98C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 18,
    elevation: 8,
  },
  iconHaloSquircleSelected: {
    backgroundColor: '#1E3326',
    borderColor: '#2F4838',
    shadowColor: '#1E3326',
    shadowOpacity: 0.35,
  },
  cardSelectionIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardSelectionIndicatorActive: {
    borderColor: '#121A15',
    backgroundColor: '#84A98C',
  },
  cardRadioEmpty: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  verticalCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  verticalCardTitleSelected: {
    color: '#121A15',
  },
  verticalCardSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 19,
    marginTop: 6,
  },
  verticalCardSubSelected: {
    color: '#34473C',
  },
  cardTraitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTraitLabel: {
    fontSize: 12,
    color: '#84A98C',
    fontWeight: '600',
  },
  // Cards de Fase 3: Ubicación y Bioclima generosas y verticales
  locationVerticalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    elevation: 0,
  },
  locationCityNameLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  locationZoneTextLarge: {
    fontSize: 14,
    color: '#84A98C',
    fontWeight: '600',
    marginTop: 4,
  },
  locationBodyText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 19,
    marginTop: 10,
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
  waterHardnessBoxLarge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(132, 169, 140, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(132, 169, 140, 0.35)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginTop: 16,
  },
  waterHardnessText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  waterHardnessSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
    lineHeight: 15,
  },
  editLocationPill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  editLocationPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EAF4ED',
  },
  vpdVerticalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    elevation: 0,
  },
  vpdBadgePill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(132, 169, 140, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(132, 169, 140, 0.35)',
  },
  vpdBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#84A98C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vpdCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  vpdCardBody: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 20,
    marginTop: 8,
  },
  // Sección de Seguridad: Cards verticales generosas
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
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  safetyVerticalCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  // Botones primarios Glassmorphism
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
    marginVertical: Spacing.md,
  },
  tideAuthBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  tideAuthBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  guestLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#84A98C',
    textDecorationLine: 'underline',
  },
  legalDisclaimerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  // Modal Selector de Ciudad
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#15201A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalHandle: {
    width: 44,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.70)',
    fontWeight: '600',
  },
  modalSearchInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.md,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  modalCityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalCityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(132, 169, 140, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCityNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalCityZoneText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
  },
});
