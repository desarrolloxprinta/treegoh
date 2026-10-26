import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useVideoPlayer, VideoView } from 'expo-video';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { TreegohLogo } from '../../components/TreegohLogo';
import { TreegohCharacter } from '../../components/TreegohCharacter';
import { TreegohIcon, IconName } from '../../components/TreegohIcon';
import { OnboardingState } from '../../types/onboarding';

const { width, height } = Dimensions.get('window');

// Video Pexels 7013844 macro de hoja con rocío matutino
const PEXELS_VIDEO_URL =
  'https://videos.pexels.com/video-files/7013844/7013844-hd_720_1366_25fps.mp4';

// Colores de fondo orgánicos y sutiles estilo TIDE para cada pantalla
const STEP_BACKGROUNDS = [
  '#FAF9F5', // Step 1: Warm Daylight Mist (debajo del video)
  '#F5F7F4', // Step 2: Faint Biophilic Sage
  '#F7F6F1', // Step 3: Faint Botanical Dew
  '#F6F8F6', // Step 4: Serene Morning Light
  '#FAF6F2', // Step 5: Soft Calming Peach
  '#F4F7F5', // Step 6: Sanctuary Resonance
  '#F9F9F7', // Step 7: Pure Cloud White
];

interface OnboardingScreenProps {
  onComplete: (data: OnboardingState) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [state, setState] = useState<OnboardingState>({
    currentStep: 1,
    goals: ['prevent_death'],
    location: {
      city: 'Madrid, España',
      bioclimaticZone: 'Interior Mediterráneo',
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

  // Configuración del video en loop
  const player = useVideoPlayer(PEXELS_VIDEO_URL, p => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Animaciones nativas de transición fluida estilo TIDE (Slide + Fade)
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  const triggerStepTransition = (targetStep: number, direction: 'forward' | 'backward' = 'forward') => {
    const initialSlide = direction === 'forward' ? 36 : -36;

    // Fade out y preparación de posición
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === 'forward' ? -24 : 24,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(targetStep);
      slideAnim.setValue(initialSlide);

      // Fade in y slide natural con curva elástica suave
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: targetStep - 1,
          duration: 350,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 7) {
      triggerStepTransition(step + 1, 'forward');
    } else {
      onComplete(state);
    }
  };

  const prevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      triggerStepTransition(step - 1, 'backward');
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

  // Interpolación suave del color de fondo orgánico
  const interpolatedBg = bgAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4, 5, 6],
    outputRange: STEP_BACKGROUNDS,
  });

  // PANTALLA 1: WELCOME CON VIDEO BACKGROUND Y CAPA WARM MIST
  const renderScreen1 = () => (
    <View style={styles.fullScreen}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      {/* Capa protectora Warm Mist translúcida para contraste editorial nórdico */}
      <View style={styles.videoOverlay} />

      <SafeAreaView style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          <View style={styles.logoWrapper}>
            <TreegohLogo width={196} height={54} color={Colors.darkObsidian} />
          </View>
          <Text style={styles.welcomeTitle}>
            Cuidado botánico inteligente{'\n'}para espacios vivos
          </Text>
          <Text style={styles.welcomeSub}>
            Conecta con el ritmo natural de tus plantas mediante biométrica óptica y microclimas de luz.
          </Text>
        </View>

        <View style={styles.welcomeBottom}>
          <TouchableOpacity
            style={styles.btnPrimary}
            activeOpacity={0.88}
            onPress={nextStep}
          >
            <Text style={styles.btnPrimaryText}>Comenzar exploración</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGhost}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              triggerStepTransition(7, 'forward');
            }}
          >
            <Text style={styles.btnGhostText}>Ya tengo una cuenta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );

  // BARRA DE PROGRESO DISCRETA ESTILO TIDE
  const renderProgressBar = () => {
    if (step === 1) return null;
    const progressPercent = ((step - 1) / 5) * 100;
    return (
      <View style={styles.progressContainer}>
        <TouchableOpacity
          onPress={prevStep}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButtonCircle}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
        </View>

        <Text style={styles.stepText}>{step - 1} de 5</Text>
      </View>
    );
  };

  // PANTALLA 2: METAS BOTÁNICAS
  const renderScreen2 = () => {
    const goalOptions: { id: string; title: string; sub: string; icon: IconName }[] = [
      {
        id: 'prevent_death',
        title: 'Evitar que se mueran',
        sub: 'Riego adaptado a sustrato y humedad',
        icon: 'riego_hidratacion',
      },
      {
        id: 'maximize_growth',
        title: 'Maximizar crecimiento & floración',
        sub: 'Luxómetro C1 y fertilización en ciclo activo',
        icon: 'floracion_fenologia',
      },
      {
        id: 'pest_diagnosis',
        title: 'Detectar y curar plagas a tiempo',
        sub: 'Cámara diagnóstica en 3 tomas y MAPA seguro',
        icon: 'camara_diagnostica',
      },
      {
        id: 'wellbeing_sanctuary',
        title: 'Santuario de bienestar & aire puro',
        sub: 'Purificación biogénica y soundscapes',
        icon: 'sonido_soundscapes',
      },
    ];

    return (
      <View style={styles.stepContainer}>
        <Text style={Typography.titleLarge}>¿Cuál es tu principal{'\n'}objetivo botánico?</Text>
        <Text style={[Typography.body, { marginTop: Spacing.sm }]}>
          Personalizaremos el algoritmo de riego y tus alertas preventivas de clima.
        </Text>

        <View style={styles.cardsGrid}>
          {goalOptions.map(g => {
            const isSelected = state.goals.includes(g.id);
            return (
              <TouchableOpacity
                key={g.id}
                style={[styles.glassCard, isSelected && styles.glassCardSelected]}
                onPress={() => toggleGoal(g.id)}
                activeOpacity={0.88}
              >
                <View
                  style={[
                    styles.iconBox,
                    isSelected ? styles.iconBoxSelected : styles.iconBoxDefault,
                  ]}
                >
                  <TreegohIcon
                    name={g.icon}
                    size={22}
                    color={isSelected ? Colors.eucalyptus : Colors.darkObsidian}
                  />
                </View>
                <View style={styles.cardTexts}>
                  <Text style={[styles.cardTitle, isSelected && { color: Colors.eucalyptus }]}>
                    {g.title}
                  </Text>
                  <Text style={styles.cardSub}>{g.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={nextStep}>
          <Text style={styles.btnPrimaryText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // PANTALLA 3: BIOCLIMA & LOCALIZACIÓN METEOROLÓGICA
  const renderScreen3 = () => (
    <View style={styles.stepContainer}>
      <Text style={Typography.titleLarge}>¿Dónde viven{'\n'}tus plantas?</Text>
      <Text style={[Typography.body, { marginTop: Spacing.sm }]}>
        Conectamos con Open-Meteo para adaptar el riego a la humedad ambiental y avisarte de olas de calor (M02).
      </Text>

      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <View style={styles.iconBoxAccent}>
            <TreegohIcon name="temperatura_termica" size={24} color={Colors.eucalyptus} />
          </View>
          <View style={{ marginLeft: Spacing.md, flex: 1 }}>
            <Text style={styles.cardTitle}>{state.location.city}</Text>
            <Text style={styles.cardSub}>Zona bioclimática: {state.location.bioclimaticZone}</Text>
          </View>
        </View>

        <View style={styles.waterBadge}>
          <TreegohIcon name="riego_hidratacion" size={14} color={Colors.eucalyptus} />
          <Text style={styles.waterBadgeText}>Agua corriente: {state.location.waterHardness}</Text>
        </View>
      </View>

      <View style={styles.tipsBox}>
        <View style={styles.tipsHeader}>
          <TreegohIcon name="humedad_vpd" size={16} color={Colors.eucalyptus} />
          <Text style={styles.tipsTitle}>Precisión Fisiológica</Text>
        </View>
        <Text style={styles.tipsBody}>
          Treegoh no usa calendarios estáticos. Si la humedad relativa desciende de forma abrupta, el sistema recalibra automáticamente el déficit de presión de vapor (VPD) foliar.
        </Text>
      </View>

      <TouchableOpacity style={[styles.btnPrimary, { marginTop: Spacing.xl }]} onPress={nextStep}>
        <Text style={styles.btnPrimaryText}>Continuar con esta zona</Text>
      </TouchableOpacity>
    </View>
  );

  // PANTALLA 4: ESPACIOS & MICROCLIMAS
  const renderScreen4 = () => {
    const spacePresets = [
      { name: 'Salón Luminoso', desc: 'Luz brillante indirecta (1.500 - 4.000 lux)', icon: 'espacios_microclimas' as IconName },
      { name: 'Balcón Exterior', desc: 'Sol matutino directo y ventilación', icon: 'luz_natural' as IconName },
      { name: 'Dormitorio Sereno', desc: 'Luz media filtrada sin corrientes', icon: 'espacios_microclimas' as IconName },
      { name: 'Baño Húmedo', desc: 'Alta humedad ambiental (ideal helechos)', icon: 'pulverizacion_spray' as IconName },
    ];

    return (
      <View style={styles.stepContainer}>
        <Text style={Typography.titleLarge}>Configura tus{'\n'}microclimas</Text>
        <Text style={[Typography.body, { marginTop: Spacing.sm }]}>
          Las plantas en un mismo espacio comparten condiciones ambientales. Podrás añadir más estancias en cualquier momento.
        </Text>

        <View style={styles.cardsGrid}>
          {spacePresets.map(sp => {
            const isSelected = state.spaces.includes(sp.name);
            return (
              <TouchableOpacity
                key={sp.name}
                style={[styles.glassCard, isSelected && styles.glassCardSelected]}
                onPress={() => toggleSpace(sp.name)}
                activeOpacity={0.88}
              >
                <View
                  style={[
                    styles.iconBox,
                    isSelected ? styles.iconBoxSelected : styles.iconBoxDefault,
                  ]}
                >
                  <TreegohIcon
                    name={sp.icon}
                    size={22}
                    color={isSelected ? Colors.eucalyptus : Colors.darkObsidian}
                  />
                </View>
                <View style={styles.cardTexts}>
                  <Text style={[styles.cardTitle, isSelected && { color: Colors.eucalyptus }]}>
                    {sp.name}
                  </Text>
                  <Text style={styles.cardSub}>{sp.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={nextStep}>
          <Text style={styles.btnPrimaryText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // PANTALLA 5: SEGURIDAD VITAL (MASCOTAS & FAMILIA)
  const renderScreen5 = () => (
    <View style={styles.stepContainer}>
      <Text style={Typography.titleLarge}>Seguridad en{'\n'}el hogar</Text>
      <Text style={[Typography.body, { marginTop: Spacing.sm }]}>
        Filtramos especies con savia urticante o cristales de oxalato cálcico insoluble para proteger a quienes más quieres.
      </Text>

      <View style={{ gap: Spacing.md, marginVertical: Spacing.xl }}>
        <TouchableOpacity
          style={[styles.glassCard, state.safetyFilter.hasPets && styles.glassCardSelected]}
          activeOpacity={0.88}
          onPress={() => {
            Haptics.selectionAsync();
            setState(prev => ({
              ...prev,
              safetyFilter: { ...prev.safetyFilter, hasPets: !prev.safetyFilter.hasPets },
            }));
          }}
        >
          <View
            style={[
              styles.iconBox,
              state.safetyFilter.hasPets ? styles.iconBoxSelected : styles.iconBoxDefault,
            ]}
          >
            <TreegohIcon
              name="toxicidad_mascotas"
              size={22}
              color={state.safetyFilter.hasPets ? Colors.eucalyptus : Colors.darkObsidian}
            />
          </View>
          <View style={styles.cardTexts}>
            <Text style={[styles.cardTitle, state.safetyFilter.hasPets && { color: Colors.eucalyptus }]}>
              Hogar con animales de compañía
            </Text>
            <Text style={styles.cardSub}>
              Filtro botánico estricto: catálogo exclusivo de especies no tóxicas aprobadas por toxicología veterinaria (Calatheas, Helechos, Marantas).
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.btnPrimary, { marginTop: Spacing.lg }]} onPress={nextStep}>
        <Text style={styles.btnPrimaryText}>Continuar</Text>
      </TouchableOpacity>
    </View>
  );

  // PANTALLA 6: CHARACTER SYNC & ASISTENCIA BOTÁNICA SENSORIAL
  const renderScreen6 = () => (
    <View style={[styles.stepContainer, { alignItems: 'center', justifyContent: 'center' }]}>
      <View style={styles.characterContainer}>
        <TreegohCharacter
          size={144}
          mood="happy"
          statusOrbColor={Colors.eucalyptus}
          showStatusOrb={true}
        />
      </View>

      <Text style={[Typography.titleMedium, { textAlign: 'center', marginTop: Spacing.xl }]}>
        Tu santuario está listo
      </Text>
      
      <View style={styles.voiceBadgeClean}>
        <TreegohIcon name="voz_botanica" size={14} color={Colors.eucalyptus} />
        <Text style={styles.voiceBadgeText}>Asistencia Botánica Multimodal Activa</Text>
      </View>

      <Text style={styles.speechQuote}>
        «He calibrado los microclimas de tus estancias y las condiciones meteorológicas de tu zona. Cuidemos juntos de tus plantas.»
      </Text>

      <TouchableOpacity
        style={[styles.btnPrimary, { marginTop: Spacing.xxl, width: '100%' }]}
        onPress={nextStep}
      >
        <Text style={styles.btnPrimaryText}>Entrar a mi santuario</Text>
      </TouchableOpacity>
    </View>
  );

  // PANTALLA 7: AUTH & REGISTRO
  const renderScreen7 = () => (
    <View style={styles.stepContainer}>
      <View style={{ alignItems: 'center', marginBottom: Spacing.md }}>
        <TreegohCharacter size={80} mood="happy" showStatusOrb={false} />
      </View>
      <Text style={[Typography.titleLarge, { textAlign: 'center' }]}>
        Guarda tu colección{'\n'}y mantén tus plantas a salvo
      </Text>
      <Text style={[Typography.body, { textAlign: 'center', marginTop: Spacing.xs }]}>
        Sincroniza tus registros botánicos y alertas en la nube de forma segura.
      </Text>

      <View style={{ gap: Spacing.md, marginTop: Spacing.xl }}>
        <TouchableOpacity
          style={styles.btnAuth}
          activeOpacity={0.88}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onComplete({ ...state, isGuest: false });
          }}
        >
          <Text style={styles.btnAuthText}>Continuar con Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnAuth}
          activeOpacity={0.88}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onComplete({ ...state, isGuest: false });
          }}
        >
          <Text style={styles.btnAuthText}>Continuar con Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnAuth}
          activeOpacity={0.88}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onComplete({ ...state, isGuest: false });
          }}
        >
          <Text style={styles.btnAuthText}>Continuar con Correo</Text>
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: 'center', marginTop: Spacing.xl }}>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            onComplete({ ...state, isGuest: true });
          }}
        >
          <Text style={styles.linkGuest}>Continuar como invitado (modo local)</Text>
        </TouchableOpacity>

        <Text style={styles.legalNotice}>
          Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad Botánica.
        </Text>
      </View>
    </View>
  );

  if (step === 1) {
    return (
      <View style={styles.mainWrapper}>
        <StatusBar barStyle="dark-content" />
        {renderScreen1()}
      </View>
    );
  }

  return (
    <Animated.View style={[styles.mainWrapper, { backgroundColor: interpolatedBg }]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right', 'bottom']}>
        {renderProgressBar()}

        <Animated.View
          style={[
            styles.animatedContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {step === 2 && renderScreen2()}
            {step === 3 && renderScreen3()}
            {step === 4 && renderScreen4()}
            {step === 5 && renderScreen5()}
            {step === 6 && renderScreen6()}
            {step === 7 && renderScreen7()}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  fullScreen: {
    width,
    height,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(235, 234, 228, 0.48)',
  },
  safeContainer: {
    flex: 1,
  },
  animatedContent: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  welcomeContent: {
    marginTop: height * 0.14,
  },
  logoWrapper: {
    marginBottom: Spacing.lg,
  },
  welcomeTitle: {
    fontSize: 27,
    fontWeight: '700',
    color: Colors.darkObsidian,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  welcomeSub: {
    fontSize: 14,
    color: Colors.bodyText,
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  welcomeBottom: {
    gap: Spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 28, 25, 0.06)',
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.darkObsidian,
    fontWeight: '300',
    marginTop: -2,
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(20, 28, 25, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.eucalyptus,
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    color: Colors.mutedText,
    fontWeight: '500',
  },
  stepContainer: {
    flex: 1,
    paddingTop: Spacing.sm,
  },
  cardsGrid: {
    gap: 12,
    marginVertical: Spacing.lg,
  },
  // Tarjetas Glassmorphism Light Luxury
  glassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#141C19',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 2,
  },
  glassCardSelected: {
    borderColor: Colors.eucalyptus,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowOpacity: 0.07,
    shadowRadius: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconBoxDefault: {
    backgroundColor: 'rgba(20, 28, 25, 0.04)',
  },
  iconBoxSelected: {
    backgroundColor: 'rgba(82, 121, 111, 0.12)',
  },
  iconBoxAccent: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(82, 121, 111, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTexts: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkObsidian,
    lineHeight: 20,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.bodyText,
    marginTop: 3,
    lineHeight: 16,
    opacity: 0.88,
  },
  locationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 22,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#141C19',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(82, 121, 111, 0.09)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 99,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  waterBadgeText: {
    fontSize: 12,
    color: Colors.eucalyptus,
    fontWeight: '600',
  },
  tipsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    padding: Spacing.md,
    borderRadius: 18,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(20, 28, 25, 0.05)',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkObsidian,
  },
  tipsBody: {
    fontSize: 12,
    color: Colors.bodyText,
    lineHeight: 18,
    opacity: 0.9,
  },
  characterContainer: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(82, 121, 111, 0.18)',
    shadowColor: '#141C19',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  voiceBadgeClean: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(82, 121, 111, 0.09)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 99,
    marginTop: Spacing.md,
  },
  voiceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.eucalyptus,
  },
  speechQuote: {
    fontSize: 14,
    color: Colors.bodyText,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  btnPrimary: {
    backgroundColor: Colors.pureWhite,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 28, 25, 0.12)',
    shadowColor: '#141C19',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkObsidian,
    letterSpacing: -0.2,
  },
  btnGhost: {
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
  btnAuth: {
    backgroundColor: Colors.pureWhite,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 28, 25, 0.1)',
    shadowColor: '#141C19',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  btnAuthText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkObsidian,
  },
  linkGuest: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.eucalyptus,
  },
  legalNotice: {
    fontSize: 11,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: Spacing.xl,
  },
});
