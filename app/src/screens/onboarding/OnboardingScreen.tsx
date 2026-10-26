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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { TreegohLogo } from '../../components/TreegohLogo';
import { TreegohCharacter } from '../../components/TreegohCharacter';
import { TreegohIcon, IconName } from '../../components/TreegohIcon';
import * as Location from 'expo-location';
import { OnboardingState } from '../../types/onboarding';

const { width, height } = Dimensions.get('window');

// Zonas bioclimáticas con reglas agronómicas de agua y transpiración
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
    waterHardness: 'Media (Ajuste según test o sensor)',
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

  const horizontalScrollRef = useRef<any>(null);

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
  });

  // Navegación fluida por scroll horizontal continuo (sin recarga)
  const navigateToStep = (targetStep: number) => {
    if (targetStep < 1 || targetStep > 7) return;
    setStep(targetStep);
    horizontalScrollRef.current?.scrollTo({
      x: (targetStep - 1) * width,
      animated: true,
    });
  };

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 7) {
      navigateToStep(step + 1);
    } else {
      onComplete(state);
    }
  };

  const prevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      navigateToStep(step - 1);
    }
  };

  const toggleGoal = (id: string) => {
    Haptics.selectionAsync();
    setState(prev => {
      const exists = prev.goals.includes(id);
      return {
        ...prev,
        goals: exists ? prev.goals.filter(g => g !== id) : [...prev.goals, id],
      };
    });
  };

  const toggleSpace = (name: string) => {
    Haptics.selectionAsync();
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    Haptics.selectionAsync();
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  // Barra de progreso segmentada discreta estilo TIDE (solo visible a partir del paso 2)
  const renderSegmentedProgressBar = () => {
    if (step === 1) return null;

    return (
      <View style={styles.topProgressContainer}>
        <View style={styles.progressSegmentsRow}>
          {[2, 3, 4, 5, 6, 7].map(s => {
            const isFilled = step >= s;
            return (
              <View
                key={s}
                style={[
                  styles.progressSegmentPill,
                  isFilled ? styles.progressSegmentFilled : styles.progressSegmentEmpty,
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
                Haptics.selectionAsync();
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

  // FASE 1: BIENVENIDA BOTÁNICA EDITORIAL
  const renderScreen1 = () => (
    <View style={styles.phasePage}>
      <SafeAreaView style={styles.welcomeSafeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.welcomeTopBlock}>
          <View style={styles.logoWrapper}>
            {/* Solo renderizamos el logo en el paso 1 para evitar vibraciones o filtraciones visuales */}
            {step === 1 && (
              <TreegohLogo width={192} height={52} color={Colors.darkObsidian} />
            )}
          </View>
          <Text style={styles.welcomeTitle}>
            Cuidado botánico inteligente{'\n'}para espacios vivos
          </Text>
          <Text style={styles.welcomeSub}>
            Conecta con el ritmo natural de tus plantas mediante biométrica óptica y microclimas de luz.
          </Text>
        </View>

        <View style={styles.welcomeBottomBlock}>
          <TouchableOpacity
            style={styles.btnTidePrimary}
            activeOpacity={0.88}
            onPress={nextStep}
          >
            <Text style={styles.btnTidePrimaryText}>Comenzar exploración</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGhostPill}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigateToStep(7);
            }}
          >
            <Text style={styles.btnGhostText}>Ya tengo una cuenta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );

  // FASE 2: METAS BOTÁNICAS (TARJETAS GLASSMORPHISM EN GRID 2-COLUMNAS TIDE)
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
                  activeOpacity={0.85}
                >
                  <View style={[styles.iconHaloSquircle, isSelected && styles.iconHaloSquircleSelected]}>
                    <TreegohIcon
                      name={g.icon}
                      size={26}
                      color={isSelected ? Colors.eucalyptus : Colors.darkObsidian}
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
            <TouchableOpacity style={styles.btnTidePrimary} onPress={nextStep} activeOpacity={0.88}>
              <Text style={styles.btnTidePrimaryText}>Continuar</Text>
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
              <TreegohIcon name="temperatura_termica" size={24} color={Colors.eucalyptus} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.locationCityName}>{state.location.city}</Text>
              <Text style={styles.locationZoneText}>{state.location.bioclimaticZone}</Text>
            </View>
            <TouchableOpacity
              style={styles.editLocationPill}
              onPress={() => {
                Haptics.selectionAsync();
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
                  { backgroundColor: isDetectingLocation ? '#E29578' : '#52796F' },
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
            <TreegohIcon name="riego_hidratacion" size={16} color={Colors.eucalyptus} />
            <Text style={styles.waterHardnessText}>
              Agua: {state.location.waterHardness}
            </Text>
          </View>
        </View>

        <View style={styles.glassmorphInfoCard}>
          <View style={styles.infoCardHeader}>
            <TreegohIcon name="humedad_vpd" size={16} color={Colors.eucalyptus} />
            <Text style={styles.infoCardTitle}>Déficit de Presión de Vapor (VPD)</Text>
          </View>
          <Text style={styles.infoCardBody}>
            Treegoh sincroniza la evapotranspiración foliar en tiempo real. Si la temperatura o la humedad cambian bruscamente, el ciclo de riego se reprograma de inmediato.
          </Text>
        </View>

        <View style={styles.phaseBottomSticky}>
          <TouchableOpacity style={styles.btnTidePrimary} onPress={nextStep} activeOpacity={0.88}>
            <Text style={styles.btnTidePrimaryText}>Continuar con esta zona</Text>
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
                  activeOpacity={0.85}
                >
                  <View style={[styles.iconHaloSquircle, isSelected && styles.iconHaloSquircleSelected]}>
                    <TreegohIcon
                      name={sp.icon}
                      size={26}
                      color={isSelected ? Colors.eucalyptus : Colors.darkObsidian}
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
            <TouchableOpacity style={styles.btnTidePrimary} onPress={nextStep} activeOpacity={0.88}>
              <Text style={styles.btnTidePrimaryText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  // FASE 5: SEGURIDAD VITAL (ANIMALES DE COMPAÑÍA & FAMILIA)
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
            Filtramos especies con savia urticante o cristales de oxalato cálcico para proteger a tu familia.
          </Text>
        </View>

        <View style={{ marginTop: Spacing.md }}>
          <TouchableOpacity
            style={[
              styles.tideGlassCardFullWidth,
              state.safetyFilter.hasPets ? styles.tideGlassCardSelected : styles.tideGlassCardUnselected,
            ]}
            activeOpacity={0.88}
            onPress={() => {
              Haptics.selectionAsync();
              setState(prev => ({
                ...prev,
                safetyFilter: { ...prev.safetyFilter, hasPets: !prev.safetyFilter.hasPets },
              }));
            }}
          >
            <View style={[styles.iconHaloSquircle, state.safetyFilter.hasPets && styles.iconHaloSquircleSelected]}>
              <TreegohIcon
                name="toxicidad_mascotas"
                size={28}
                color={state.safetyFilter.hasPets ? Colors.eucalyptus : Colors.darkObsidian}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text
                style={[
                  styles.fullWidthCardTitle,
                  state.safetyFilter.hasPets && { color: Colors.eucalyptus },
                ]}
              >
                Hogar con animales de compañía
              </Text>
              <Text style={styles.fullWidthCardSub}>
                Filtro botánico estricto: catálogo exclusivo de especies no tóxicas (Calatheas, Helechos, Marantas).
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.phaseBottomSticky}>
          <TouchableOpacity style={styles.btnTidePrimary} onPress={nextStep} activeOpacity={0.88}>
            <Text style={styles.btnTidePrimaryText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // FASE 6: RESONANCIA BOTÁNICA & TREEGOH COMPANION
  const renderScreen6 = () => (
    <View style={styles.phasePage}>
      <View style={styles.characterPhaseWrapper}>
        <View style={styles.characterOuterHalo}>
          <View style={styles.characterInnerCard}>
            <TreegohCharacter
              size={136}
              mood="happy"
              statusOrbColor={Colors.eucalyptus}
              showStatusOrb={true}
            />
          </View>
        </View>

        <Text style={styles.tideMainTitleCentered}>Tu santuario está listo</Text>

        <View style={styles.voiceAssistantPill}>
          <TreegohIcon name="voz_botanica" size={15} color={Colors.eucalyptus} />
          <Text style={styles.voiceAssistantPillText}>Asistencia Botánica Multimodal Activa</Text>
        </View>

        <Text style={styles.speechQuoteCentered}>
          «He calibrado los microclimas de tus estancias y las condiciones meteorológicas de tu zona. Cuidemos juntos de tus plantas.»
        </Text>

        <View style={styles.phaseBottomSticky}>
          <TouchableOpacity style={styles.btnTidePrimary} onPress={nextStep} activeOpacity={0.88}>
            <Text style={styles.btnTidePrimaryText}>Entrar a mi santuario</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // FASE 7: AUTENTICACIÓN & MODO INVITADO
  const renderScreen7 = () => (
    <View style={styles.phasePage}>
      <ScrollView
        contentContainerStyle={styles.phaseScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.md }}>
          <TreegohCharacter size={84} mood="happy" showStatusOrb={false} />
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
            activeOpacity={0.88}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onComplete({ ...state, isGuest: false });
            }}
          >
            <Text style={styles.tideAuthBtnText}>Continuar con Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tideAuthBtn}
            activeOpacity={0.88}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onComplete({ ...state, isGuest: false });
            }}
          >
            <Text style={styles.tideAuthBtnText}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tideAuthBtn}
            activeOpacity={0.88}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onComplete({ ...state, isGuest: false });
            }}
          >
            <Text style={styles.tideAuthBtnText}>Continuar con Correo</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center', marginTop: Spacing.xl }}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              onComplete({ ...state, isGuest: true });
            }}
            hitSlop={{ top: 10, bottom: 10, left: 14, right: 14 }}
          >
            <Text style={styles.linkGuestAction}>Continuar como invitado (modo local)</Text>
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
      <StatusBar barStyle="dark-content" />

      {/* FONDO BOTÁNICO CONTINUO DESENFOCADO: MALLA DE GRADIENTES LUMINOSOS Y MIST ESTILO TIDE */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#F4F7F2', '#E7EFE7', '#DAE6DC', '#CCD9CF']}
          locations={[0, 0.35, 0.7, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.85, y: 0.95 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(132, 169, 140, 0.28)', 'rgba(235, 242, 236, 0.05)', 'rgba(82, 121, 111, 0.18)']}
          start={{ x: 0.9, y: 0.1 }}
          end={{ x: 0.1, y: 0.9 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.40)', 'rgba(255, 255, 255, 0.05)', 'rgba(82, 121, 111, 0.10)', 'rgba(244, 247, 243, 0.50)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

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
              <TreegohIcon name="temperatura_termica" size={18} color={Colors.eucalyptus} />
              <Text style={styles.modalGpsBtnText}>Detectar mi ubicación real actual (GPS)</Text>
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TreegohIcon name="busqueda_typesense" size={18} color={Colors.eucalyptus} />
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
                        state.location.city === loc.city && { color: Colors.eucalyptus },
                      ]}
                    >
                      {loc.city}
                    </Text>
                    <Text style={styles.presetZoneName}>{loc.bioclimaticZone}</Text>
                  </View>
                  {state.location.city === loc.city && (
                    <TreegohIcon name="tarea_completada" size={18} color={Colors.eucalyptus} />
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
    backgroundColor: '#FAF9F5',
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
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: height * 0.88,
    justifyContent: 'space-between',
  },
  // Barra de progreso superior multi-segmento discreta estilo TIDE
  topProgressContainer: {
    paddingHorizontal: 22,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  progressSegmentsRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
    marginBottom: 12,
  },
  progressSegmentPill: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  progressSegmentFilled: {
    backgroundColor: Colors.darkObsidian,
    opacity: 0.85,
  },
  progressSegmentEmpty: {
    backgroundColor: 'rgba(20, 28, 25, 0.08)',
  },
  topBarControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 38,
  },
  backChevronText: {
    fontSize: 24,
    color: Colors.darkObsidian,
    fontWeight: '300',
    marginTop: -2,
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
  },
  skipBtnText: {
    fontSize: 13,
    color: Colors.mutedText,
    fontWeight: '600',
  },
  // Bloques de texto tipo editorial TIDE
  headerTextBlock: {
    marginBottom: 20,
  },
  tideMainTitle: {
    fontSize: 27,
    fontWeight: '700',
    color: Colors.darkObsidian,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  tideSubTitle: {
    fontSize: 14,
    color: Colors.bodyText,
    marginTop: 8,
    lineHeight: 21,
    opacity: 0.88,
  },
  tideMainTitleCentered: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.darkObsidian,
    letterSpacing: -0.4,
    lineHeight: 33,
    textAlign: 'center',
  },
  tideSubTitleCentered: {
    fontSize: 14,
    color: Colors.bodyText,
    marginTop: 8,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 16,
    opacity: 0.88,
  },
  // Grid de 2 columnas con tarjetas Glassmorph estilo TIDE
  tideGrid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 12,
  },
  tideGlassCard2Col: {
    width: (width - 44 - 12) / 2,
    minHeight: 168,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
    elevation: 0,
  },
  tideGlassCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderColor: 'rgba(255, 255, 255, 0.60)',
    borderWidth: 1,
    shadowColor: '#141C19',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  tideGlassCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: Colors.eucalyptus,
    borderWidth: 1.5,
    shadowColor: Colors.eucalyptus,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  tideGlassCardFullWidth: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 0,
  },
  iconHaloSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(20, 28, 25, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconHaloSquircleSelected: {
    backgroundColor: 'rgba(82, 121, 111, 0.12)',
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkObsidian,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  gridCardTitleSelected: {
    color: Colors.eucalyptus,
  },
  gridCardSub: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 4,
    lineHeight: 16,
  },
  gridCardSubSelected: {
    color: Colors.bodyText,
  },
  fullWidthCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkObsidian,
    lineHeight: 21,
  },
  fullWidthCardSub: {
    fontSize: 12,
    color: Colors.bodyText,
    marginTop: 4,
    lineHeight: 17,
    opacity: 0.85,
  },
  // Botón inferior full-width pill estilo TIDE
  phaseBottomSticky: {
    width: '100%',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  btnTidePrimary: {
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.pureWhite,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 28, 25, 0.08)',
    shadowColor: '#141C19',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  btnTidePrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkObsidian,
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
    marginTop: height * 0.13,
  },
  logoWrapper: {
    marginBottom: Spacing.lg,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.darkObsidian,
    lineHeight: 35,
    letterSpacing: -0.5,
  },
  welcomeSub: {
    fontSize: 14,
    color: Colors.bodyText,
    marginTop: Spacing.md,
    lineHeight: 22,
    opacity: 0.9,
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
    color: Colors.darkObsidian,
    opacity: 0.85,
  },
  // Ubicación y Bioclima
  glassmorphContainerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#141C19',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 0,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(82, 121, 111, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationCityName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkObsidian,
    lineHeight: 22,
  },
  locationZoneText: {
    fontSize: 12,
    color: Colors.bodyText,
    marginTop: 2,
    opacity: 0.85,
  },
  editLocationPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(82, 121, 111, 0.1)',
  },
  editLocationPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.eucalyptus,
  },
  locationStatusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 28, 25, 0.05)',
  },
  statusIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusBadgeLabel: {
    fontSize: 11,
    color: Colors.mutedText,
    fontWeight: '500',
  },
  retryGpsBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  retryGpsBtnText: {
    fontSize: 11,
    color: Colors.eucalyptus,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  waterHardnessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(82, 121, 111, 0.08)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 99,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  waterHardnessText: {
    fontSize: 12,
    color: Colors.eucalyptus,
    fontWeight: '600',
  },
  glassmorphInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderRadius: 20,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    elevation: 0,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkObsidian,
  },
  infoCardBody: {
    fontSize: 12,
    color: Colors.bodyText,
    lineHeight: 18,
    opacity: 0.9,
  },
  // Pantalla de Character Companion
  characterPhaseWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  characterOuterHalo: {
    width: 172,
    height: 172,
    borderRadius: 86,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 28,
  },
  characterInnerCard: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceAssistantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(82, 121, 111, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 99,
    marginTop: 12,
    marginBottom: 16,
  },
  voiceAssistantPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.eucalyptus,
  },
  speechQuoteCentered: {
    fontSize: 15,
    fontStyle: 'italic',
    color: Colors.bodyText,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 16,
  },
  // Autenticación & Guest
  authButtonsStack: {
    gap: 12,
    marginVertical: 18,
  },
  tideAuthBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
  },
  tideAuthBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkObsidian,
  },
  linkGuestAction: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.eucalyptus,
    textDecorationLine: 'underline',
    marginBottom: 12,
  },
  legalNoticeText: {
    fontSize: 11,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 24,
  },
  // Modal de Ubicación
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 28, 25, 0.45)',
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
    color: Colors.eucalyptus,
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
    backgroundColor: Colors.eucalyptus,
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
