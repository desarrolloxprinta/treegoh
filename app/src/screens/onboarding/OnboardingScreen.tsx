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
import { MicroclimateStudioModal } from '../../components/MicroclimateStudioModal';
import * as Location from 'expo-location';
import { OnboardingState, CustomMicroclimate } from '../../types/onboarding';
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

  // Reproductor de video expo-video (para Paso 1 y Paso 2)
  const videoPlayer = useVideoPlayer(PEXELS_VIDEO_URL, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // Reanudar video en pantalla de inicio (Paso 1) y en registro/auth (Paso 2)
  useEffect(() => {
    try {
      if (step === 1 || step === 2) {
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

  // Modal del Estudio Diagnóstico de Microclimas
  const [isMicroclimateModalVisible, setMicroclimateModalVisible] = useState(false);

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
    customMicroclimates: [],
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

  const handleSaveCustomMicroclimate = (micro: CustomMicroclimate) => {
    triggerHaptic();
    setState(prev => ({
      ...prev,
      spaces: prev.spaces.includes(micro.name) ? prev.spaces : [...prev.spaces, micro.name],
      customMicroclimates: [...(prev.customMicroclimates || []), micro],
    }));
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
        waterHardness: 'Blanda (excelente para tropicales)',
      };
    }
    if (c.includes('buenos aires') || c.includes('montevideo')) {
      return {
        bioclimaticZone: 'Pampas / Templado Húmedo',
        waterHardness: 'Semiblanda',
      };
    }
    if (c.includes('mexico') || c.includes('cdmx') || c.includes('guadalajara')) {
      return {
        bioclimaticZone: 'Altiplano Subtropical Templado',
        waterHardness: 'Dura (se recomienda agua reposada)',
      };
    }
    return {
      bioclimaticZone: 'Interior Mediterráneo Continental',
      waterHardness: 'Blanda (óptima para hojas sensibles)',
    };
  };

  const handleSelectCity = (city: string) => {
    triggerHaptic();
    const { bioclimaticZone, waterHardness } = inferBioclimaticZone(city);
    setState(prev => ({
      ...prev,
      location: {
        city,
        bioclimaticZone,
        waterHardness,
      },
    }));
    setLocationDetectionSource('manual');
    setLocationModalVisible(false);
  };

  const detectDeviceLocation = async () => {
    triggerHaptic();
    setIsDetectingLocation(true);
    setLocationPermissionDenied(false);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermissionDenied(true);
        setIsDetectingLocation(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (geocode) {
        const cityName = geocode.city || geocode.subregion || geocode.region || 'Madrid';
        const countryName = geocode.country || 'España';
        const fullCity = `${cityName}, ${countryName}`;
        const { bioclimaticZone, waterHardness } = inferBioclimaticZone(cityName);

        setState(prev => ({
          ...prev,
          location: {
            city: fullCity,
            bioclimaticZone,
            waterHardness,
          },
        }));
        setLocationDetectionSource('gps');
      }
    } catch (_error) {
      setLocationPermissionDenied(true);
    } finally {
      setIsDetectingLocation(false);
    }
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

  // FASE 1: BIENVENIDA CON VIDEO MACRO INTRO
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
            onPress={() => navigateToStep(2)}
            activeOpacity={0.7}
          >
            <Text style={styles.btnGhostText}>Ya tengo una cuenta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );

  // FASE 2: AUTENTICACIÓN INMEDIATA (PASO 1 DEL FLUJO: ATADO DE DATOS A CUENTA)
  const renderScreen2 = () => (
    <View style={styles.phasePage}>
      <View style={styles.phaseFixedContent}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.tideMainTitle}>Crea tu cuenta{'\n'}botánica</Text>
          <Text style={styles.tideSubTitle}>
            Tus microclimas, mediciones lumínicas y alertas preventivas estarán aseguradas desde el primer instante.
          </Text>
        </View>

        <View style={styles.authButtonsStackFixed}>
          <TouchableOpacity
            style={styles.tideAuthBtn}
            activeOpacity={0.85}
            onPress={() => {
              triggerHaptic();
              setState(prev => ({
                ...prev,
                isGuest: false,
                account: { authProvider: 'apple', isGuest: false },
              }));
              nextStep();
            }}
          >
            <Text style={styles.tideAuthBtnText}>Continuar con Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tideAuthBtn}
            activeOpacity={0.85}
            onPress={() => {
              triggerHaptic();
              setState(prev => ({
                ...prev,
                isGuest: false,
                account: { authProvider: 'google', isGuest: false },
              }));
              nextStep();
            }}
          >
            <Text style={styles.tideAuthBtnText}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tideAuthBtn}
            activeOpacity={0.85}
            onPress={() => {
              triggerHaptic();
              setState(prev => ({
                ...prev,
                isGuest: false,
                account: { authProvider: 'email', isGuest: false },
              }));
              nextStep();
            }}
          >
            <Text style={styles.tideAuthBtnText}>Continuar con Correo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              setState(prev => ({
                ...prev,
                isGuest: true,
                account: { authProvider: 'guest', isGuest: true },
              }));
              nextStep();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 14, right: 14 }}
            activeOpacity={0.7}
            style={{ alignItems: 'center', marginTop: 14 }}
          >
            <Text style={styles.guestLinkText}>
              Continuar en modo local (sin cuenta)
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.phaseBottomStickyFixed}>
          <Text style={styles.legalDisclaimerText}>
            Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad Botánica.
          </Text>
        </View>
      </View>
    </View>
  );

  // FASE 3: METAS BOTÁNICAS (GRID 2 COLUMNAS, SIN SCROLL)
  const renderScreen3 = () => {
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

  // FASE 4: UBICACIÓN GEOGRÁFICA Y BIOCLIMA (SIN SCROLL)
  const renderScreen4 = () => (
    <View style={styles.phasePage}>
      <View style={styles.phaseFixedContent}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.tideMainTitle}>¿Dónde viven{'\n'}tus plantas?</Text>
          <Text style={styles.tideSubTitle}>
            Conectamos con Open-Meteo para adaptar el riego a la humedad ambiental y avisarte de olas de calor.
          </Text>
        </View>

        <View style={styles.compactCardsStack}>
          {/* Card 1: Ubicación Detectada */}
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
                style={styles.waterPillBadge}
                onPress={() => setLocationModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.waterPillBadgeText}>Cambiar</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.gridCardTitle} numberOfLines={1}>
              {state.location.city}
            </Text>
            <Text style={styles.gridCardSub} numberOfLines={1}>
              {state.location.bioclimaticZone}
            </Text>

            <View style={styles.compactBadgeRow}>
              <View style={styles.gpsActivePill}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.gpsActiveText}>
                  {locationDetectionSource === 'gps' ? 'GPS Satelital Activo' : 'Predeterminado'}
                </Text>
              </View>
              <View style={styles.waterPillBadge}>
                <TreegohIcon name="riego_hidratacion" size={13} color="#EAF4ED" />
                <Text style={styles.waterPillBadgeText}>
                  Agua {state.location.waterHardness.split(' ')[0]}
                </Text>
              </View>
            </View>
          </View>

          {/* Card 2: Bioclima VPD */}
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
              <View style={styles.vpdActiveBadge}>
                <Text style={styles.vpdActiveText}>BIOCLIMA ACTIVO</Text>
              </View>
            </View>
            <Text style={styles.gridCardTitle} numberOfLines={1}>
              Déficit de Presión de Vapor (VPD)
            </Text>
            <Text style={styles.gridCardSub} numberOfLines={3}>
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

  // FASE 5: CALIBRA TUS MICROCLIMAS (EL CORE DE TREEGOH: SENSORES + ESPACIOS)
  const renderScreen5 = () => {
    const defaultPresets = [
      { name: 'Salón Luminoso', desc: '1.500 - 4.000 lux filtrados', icon: 'luz_natural' as IconName },
      { name: 'Balcón Exterior', desc: 'Sol directo y brisa natural', icon: 'temperatura_termica' as IconName },
      { name: 'Dormitorio Zen', desc: 'Luz media difusa sin corrientes', icon: 'espacios_microclimas' as IconName },
      { name: 'Baño Tropical', desc: 'Humedad ambiental alta >70%', icon: 'riego_hidratacion' as IconName },
    ];

    return (
      <View style={styles.phasePage}>
        <View style={styles.phaseFixedContent}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.tideMainTitle}>Calibra tus{'\n'}microclimas</Text>
            <Text style={styles.tideSubTitle}>
              El entorno decide si tu planta vive o muere. Selecciona tus espacios o calibra un rincón con brújula.
            </Text>
          </View>

          {/* BOTÓN DESTACADO: ESTUDIO DE MICROCLIMA CON SENSORES */}
          <TouchableOpacity
            style={styles.customStudioBtn}
            onPress={() => {
              triggerHaptic();
              setMicroclimateModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.studioIconBadge}>
              <TreegohIcon name="espacios_microclimas" size={24} color="#121A15" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.studioPillRow}>
                <Text style={styles.studioPillTag}>ESTUDIO GUIADO</Text>
                <Text style={styles.studioPillTagNew}>BRÚJULA & LUX</Text>
              </View>
              <Text style={styles.studioBtnTitle}>Calibrar rincón con sensores</Text>
              <Text style={styles.studioBtnSub}>
                Mide orientación solar, distancia al cristal y fuentes de estrés.
              </Text>
            </View>
            <Text style={styles.studioChevron}>›</Text>
          </TouchableOpacity>

          {/* LISTA DE RINCONES CALIBRADOS POR EL USUARIO */}
          {state.customMicroclimates && state.customMicroclimates.length > 0 && (
            <View style={styles.calibratedListContainer}>
              <View style={styles.calibratedHeaderRow}>
                <Text style={styles.calibratedHeaderTitle}>TUS RINCONES CALIBRADOS</Text>
                <View style={styles.calibratedCardBadge}>
                  <Text style={styles.calibratedCardBadgeText}>{state.customMicroclimates.length} ACTIVO(S)</Text>
                </View>
              </View>
              {state.customMicroclimates.map(cm => (
                <View key={cm.id} style={styles.calibratedCard}>
                  <View style={styles.calibratedCardLeft}>
                    <View style={styles.calibratedCardTitleRow}>
                      <Text style={styles.calibratedCardTitle}>{cm.name}</Text>
                      <View style={styles.calibratedCardBadge}>
                        <Text style={styles.calibratedCardBadgeText}>{cm.orientation} {cm.headingDegrees}°</Text>
                      </View>
                    </View>
                    <Text style={styles.calibratedCardSub}>
                      {cm.windowDistance} • ~{cm.estimatedLux.toLocaleString()} lux • {cm.directSunHours ? `${cm.directSunHours}h sol directo` : 'Luz difusa'}
                    </Text>
                    <Text style={styles.calibratedCardVerdict} numberOfLines={1}>
                      ✦ {cm.verdict}
                    </Text>
                  </View>
                  <View style={styles.calibratedScoreBadge}>
                    <Text style={styles.calibratedScoreNum}>{cm.habitabilityScore}</Text>
                    <Text style={styles.calibratedScoreLabel}>/100</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* GRID DE 2 COLUMNAS (PRESETS GLASSPHORPHISM) */}
          <View style={styles.gridTwoColumns}>
            {defaultPresets.map(sp => {
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

  // FASE 6: SEGURIDAD EN EL HOGAR (2 COLUMNAS LADO A LADO)
  const renderScreen6 = () => {
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

  // FASE 7: RESONANCIA BOTÁNICA, ASIGNACIÓN DE AVATAR Y ENTRADA AL SANTUARIO
  const renderScreen7 = () => (
    <View style={styles.phasePage}>
      <View style={styles.characterPhaseWrapper}>
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
            Tus microclimas y preferencias han sido configurados con éxito.
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

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" />

      {/* VIDEO DE FONDO VISIBLE EN PASO 1 (INTRO) Y PASO 2 (CREACIÓN DE CUENTA) */}
      <View
        style={[
          styles.videoAbsoluteContainer,
          { opacity: step === 1 || step === 2 ? 1 : 0 },
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

      {/* FONDO BOTÁNICO AMBIENTAL TIDE (50% MÁS CLARO, LUMINOSO FOREST-SAGE) PARA PASOS 3 AL 7 */}
      {step > 2 && (
        <View style={styles.videoAbsoluteContainer} pointerEvents="none">
          <LinearGradient
            colors={['#24372B', '#2E4436', '#3A5745', '#283B2E']}
            locations={[0, 0.35, 0.7, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.85, y: 0.95 }}
            style={styles.videoAbsoluteContainer}
          />
          <LinearGradient
            colors={['rgba(132, 169, 140, 0.40)', 'transparent', 'rgba(163, 201, 168, 0.28)']}
            start={{ x: 0.85, y: 0.05 }}
            end={{ x: 0.15, y: 0.95 }}
            style={styles.videoAbsoluteContainer}
          />
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

      {/* MODAL ESTUDIO DIAGNÓSTICO DE MICROCLIMA */}
      <MicroclimateStudioModal
        visible={isMicroclimateModalVisible}
        onClose={() => setMicroclimateModalVisible(false)}
        onSave={handleSaveCustomMicroclimate}
      />

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
            <Text style={styles.modalTitle}>Selecciona tu ciudad</Text>
            <Text style={styles.modalSubtitle}>
              Calibraremos la dureza del agua y el fotoperiodo estacional de tu región.
            </Text>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Buscar ciudad (ej: Valencia, Bilbao, Sevilla)..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchCityQuery}
              onChangeText={setSearchCityQuery}
              autoCorrect={false}
            />

            <ScrollView style={styles.modalCitiesList} showsVerticalScrollIndicator={false}>
              {[
                'Madrid, España',
                'Barcelona, España',
                'Valencia, España',
                'Sevilla, España',
                'Bilbao, España',
                'Málaga, España',
                'Alicante, España',
                'A Coruña, España',
                'Zaragoza, España',
                'Granada, España',
                'Palma de Mallorca, España',
                'Bogotá, Colombia',
                'Ciudad de México, México',
                'Buenos Aires, Argentina',
                'Santiago, Chile',
              ]
                .filter(c => c.toLowerCase().includes(searchCityQuery.toLowerCase()))
                .map(city => (
                  <TouchableOpacity
                    key={city}
                    style={styles.modalCityItem}
                    onPress={() => handleSelectCity(city)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalCityItemDot} />
                    <Text style={styles.modalCityItemText}>{city}</Text>
                    <Text style={styles.modalCityArrow}>›</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setLocationModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#203126',
  },
  videoAbsoluteContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  videoIntroDarkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 24, 18, 0.45)',
  },
  safeAreaRoot: {
    flex: 1,
    zIndex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
    zIndex: 10,
  },
  stepProgressContainer: {
    flexDirection: 'row',
    height: 4,
    gap: 6,
    marginBottom: 12,
  },
  progressSegmentBase: {
    height: 4,
    borderRadius: 2,
  },
  progressSegmentActiveLarge: {
    flex: 3.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  progressSegmentCompleted: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  progressSegmentInactive: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
  },
  headerControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
  },
  headerBackCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backChevronText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
    marginLeft: -1,
  },
  headerSkipPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  headerSkipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  horizontalPagingScroll: {
    flex: 1,
  },
  phasePage: {
    width,
    flex: 1,
    paddingHorizontal: 20,
  },
  phaseFixedContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  phaseScrollContent: {
    paddingBottom: 24,
  },
  welcomeSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  welcomeTopBlock: {
    paddingTop: 40,
  },
  logoWrapper: {
    marginBottom: 24,
  },
  welcomeTitleBig: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 40,
    letterSpacing: -0.6,
    marginBottom: 14,
  },
  welcomeSubLarge: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
    maxWidth: width * 0.88,
  },
  welcomeBottomBlock: {
    gap: 12,
  },
  btnTideGlassPrimary: {
    backgroundColor: '#E8EFE7',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  btnTideGlassPrimaryText: {
    color: '#121A15',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnGhostPill: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnGhostText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '600',
  },
  headerTextBlock: {
    marginTop: 6,
    marginBottom: 10,
  },
  tideMainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tideSubTitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.80)',
    lineHeight: 18,
  },
  authButtonsStackFixed: {
    gap: 12,
    marginVertical: 10,
  },
  tideAuthBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  tideAuthBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  guestLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B5D8BF',
    textAlign: 'center',
  },
  legalDisclaimerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.60)',
    textAlign: 'center',
    lineHeight: 15,
  },
  gridTwoColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginVertical: 6,
  },
  gridGlassCard: {
    width: (width - 40 - 12) / 2,
    height: 152,
    borderRadius: 24,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1.2,
    overflow: 'hidden',
  },
  gridGlassCardSafety: {
    width: (width - 40 - 12) / 2,
    height: 220,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1.2,
    overflow: 'hidden',
  },
  gridGlassCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.20)',
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
    gap: 3,
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  gridCardTitleSelected: {
    color: '#121A15',
  },
  gridCardSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 14,
  },
  gridCardSubSelected: {
    color: '#2A3C30',
  },
  compactCardsStack: {
    gap: 12,
    marginVertical: 8,
  },
  compactGlassCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    overflow: 'hidden',
    gap: 6,
  },
  compactCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  gpsActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#84A98C',
  },
  gpsActiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EAF4ED',
  },
  waterPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  waterPillBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EAF4ED',
  },
  vpdActiveBadge: {
    backgroundColor: 'rgba(132, 169, 140, 0.22)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  vpdActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B5D8BF',
    letterSpacing: 0.8,
  },
  customStudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    padding: 12,
    overflow: 'hidden',
    marginBottom: 6,
  },
  studioIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8EFE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studioPillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 3,
  },
  studioPillTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#84A98C',
    letterSpacing: 0.8,
  },
  studioPillTagNew: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EAF4ED',
    backgroundColor: 'rgba(132, 169, 140, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  studioBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studioBtnSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 1,
    lineHeight: 14,
  },
  studioChevron: {
    fontSize: 22,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '300',
    marginLeft: 6,
  },
  characterPhaseWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatarGlassOuterHalo: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.30)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  avatarInnerImageFrame: {
    width: 154,
    height: 154,
    borderRadius: 77,
    overflow: 'hidden',
  },
  avatarPhoto: {
    width: '100%',
    height: '100%',
  },
  avatarAliasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 10,
  },
  avatarAliasBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EAF4ED',
  },
  avatarAliasTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
  },
  avatarScientificSubtitle: {
    fontSize: 13,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  avatarTraitGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 16,
    width: '100%',
    marginTop: 12,
  },
  avatarTraitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  avatarNoteText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    marginTop: 8,
  },
  phaseBottomSticky: {
    width: '100%',
    paddingBottom: 8,
  },
  phaseBottomStickyFixed: {
    width: '100%',
    paddingBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1E2D23',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '80%',
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
    lineHeight: 18,
  },
  modalSearchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    marginBottom: 12,
  },
  modalCitiesList: {
    maxHeight: 280,
  },
  modalCityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalCityItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#84A98C',
    marginRight: 12,
  },
  modalCityItemText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalCityArrow: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  calibratedListContainer: {
    marginVertical: 8,
  },
  calibratedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  calibratedHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 1,
  },
  calibratedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calibratedCardLeft: {
    flex: 1,
    paddingRight: 8,
  },
  calibratedCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  calibratedCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  calibratedCardBadge: {
    backgroundColor: 'rgba(167, 243, 208, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  calibratedCardBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A7F3D0',
  },
  calibratedCardSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  calibratedCardVerdict: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EAF4ED',
    marginTop: 4,
  },
  calibratedScoreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#A7F3D0',
  },
  calibratedScoreNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#121A15',
  },
  calibratedScoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#121A15',
  },
});
