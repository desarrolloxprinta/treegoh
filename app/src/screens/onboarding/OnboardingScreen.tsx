import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  useWindowDimensions,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

import { Fonts } from '../../constants/theme';
import { TreegohLogo } from '../../components/TreegohLogo';
import { TreegohIcon, IconName } from '../../components/TreegohIcon';
import { BlobAnimatedCard, GlassCardSheen } from '../../components/BlobAnimatedCard';
import { MicroclimateStudioView } from '../../components/MicroclimateStudioView';
import {
  OnboardingState,
  CustomMicroclimate,
  PetType,
  BotanicalExperienceLevel,
} from '../../types/onboarding';
import { BotanicalAvatar, getRandomBotanicalAvatar } from '../../constants/botanicalAvatars';
import {
  firebaseSignUp,
  firebaseSignIn,
  fetchSanctuaryFromCloud,
} from '../../services/firebaseAuthService';
import {
  promptGoogleSignIn,
  connectGoogleAccountDirect,
} from '../../services/googleAuthService';

const { width } = Dimensions.get('window');

// Video botánico macro para intro y auth
const PEXELS_VIDEO_URL =
  'https://videos.pexels.com/video-files/7013844/7013844-hd_720_1366_25fps.mp4';

interface Props {
  onComplete: (state: OnboardingState) => void;
  onLoginPress?: () => void;
}

function scrollHorizontalRefTo(ref: any, x: number, animated: boolean) {
  const node = ref?.current?.getNode ? ref.current.getNode() : ref?.current;
  node?.scrollTo?.({ x, animated });
}

export const OnboardingScreen: React.FC<Props> = ({ onComplete, onLoginPress }) => {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const safeTopPadding =
    Math.max(insets.top, Platform.OS === 'ios' ? 56 : StatusBar.currentHeight || 16) + 10;
  const safeBottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 14);

  const [pageWidth, setPageWidth] = useState<number>(windowWidth);
  const [step, setStep] = useState(1);
  const stepRef = useRef(1);
  const isProgrammaticScrollRef = useRef(false);
  const programmaticTimerRef = useRef<any>(null);
  const horizontalScrollRef = useRef<any>(null);
  const outerScrollX = useRef(new Animated.Value(0)).current;

  // Reproductor de video expo-video (para Paso 1 y Paso 2)
  const videoPlayer = useVideoPlayer(PEXELS_VIDEO_URL, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    try {
      if (step === 1 || step === 2) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    } catch (_e) {}
  }, [step, videoPlayer]);

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetectionSource, setLocationDetectionSource] = useState<
    'gps' | 'fallback' | 'manual'
  >('fallback');
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [searchCityQuery, setSearchCityQuery] = useState('');

  useEffect(() => {
    if (
      (step === 4 || step === 5) &&
      locationDetectionSource === 'fallback' &&
      !isDetectingLocation
    ) {
      detectDeviceLocation();
    }
  }, [step]);

  const [assignedAvatar] = useState<BotanicalAvatar>(() => getRandomBotanicalAvatar());

  const [state, setState] = useState<OnboardingState>({
    goals: ['prevent_death'],
    location: {
      city: 'Madrid, España',
      bioclimaticZone: 'Interior Mediterráneo Continental',
      waterHardness: 'Blanda (óptima para hojas sensibles)',
      street: 'Ubicación detectada por satélite',
      streetNumber: '',
      floorNumber: 1,
      propertyType: 'edificio',
      floorOrApt: 'Planta 1ª',
      postalCode: '',
      latitude: 40.4168,
      longitude: -3.7038,
      altitudeMeters: 650,
      fullAddress: 'Madrid, España',
    },
    spaces: [],
    customMicroclimates: [],
    safetyFilter: {
      hasPets: true,
      petTypes: ['gato'],
      hasChildren: false,
    },
    currentStep: 1,
    characterCalibrated: true,
    isGuest: false,
    assignedAvatar,
  });

  const [floorTextInput, setFloorTextInput] = useState<string>('1');

  // Estados interactivos para perfil y autenticación estricta con Firebase y Google en Paso 2
  const [profileFormMode, setProfileFormMode] = useState<'signup' | 'login'>('signup');
  const [inputDisplayName, setInputDisplayName] = useState<string>('');
  const [inputEmail, setInputEmail] = useState<string>('');
  const [inputPassword, setInputPassword] = useState<string>('');
  const [authProviderActive, setAuthProviderActive] = useState<'google' | 'email' | null>(null);
  const [selectedExperienceLevel, setSelectedExperienceLevel] =
    useState<BotanicalExperienceLevel>('habitual');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);

  const updatePropertyFloor = (newFloor: number, propType?: 'casa' | 'edificio') => {
    const clamped = Math.max(0, Math.min(99, newFloor));
    const resolvedType =
      propType ?? (clamped === 0 ? state.location.propertyType || 'casa' : 'edificio');
    const floorLabel =
      resolvedType === 'casa' && clamped === 0
        ? 'Casa / Planta Baja'
        : clamped === 0
        ? 'Planta Baja'
        : `Piso ${clamped}º`;
    setFloorTextInput(String(clamped));
    setState(prev => ({
      ...prev,
      location: {
        ...prev.location,
        propertyType: resolvedType,
        floorNumber: clamped,
        floorOrApt: floorLabel,
      },
    }));
  };

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
  };

  const navigateToStep = (targetStep: number) => {
    if (targetStep < 1 || targetStep > 7) return;

    // BLOQUEO ESTRICTO: Prohibido avanzar al Paso 3 o más sin cuenta Firebase autenticada
    if (targetStep > 2 && !state.account?.uid) {
      triggerHaptic();
      setAuthErrorMsg('Debes crear tu cuenta botánica o iniciar sesión para acceder al Santuario.');
      if (stepRef.current !== 2) {
        stepRef.current = 2;
        setStep(2);
        scrollHorizontalRefTo(horizontalScrollRef, pageWidth, true);
      }
      return;
    }

    triggerHaptic();
    isProgrammaticScrollRef.current = true;
    if (programmaticTimerRef.current) {
      clearTimeout(programmaticTimerRef.current);
    }
    programmaticTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 480);

    stepRef.current = targetStep;
    setStep(targetStep);
    scrollHorizontalRefTo(horizontalScrollRef, (targetStep - 1) * pageWidth, true);
  };

  const handleOuterHorizontalScroll = (e: any) => {
    if (isProgrammaticScrollRef.current || pageWidth <= 0) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const liveStep = Math.min(7, Math.max(1, Math.round(offsetX / pageWidth) + 1));

    // Bloqueo estricto de swipe sin autenticación
    if (liveStep > 2 && !state.account?.uid) {
      scrollHorizontalRefTo(horizontalScrollRef, pageWidth, false);
      if (stepRef.current !== 2) {
        stepRef.current = 2;
        setStep(2);
        triggerHaptic();
        setAuthErrorMsg('Crea tu cuenta o inicia sesión para continuar.');
      }
      return;
    }

    if (liveStep !== stepRef.current) {
      stepRef.current = liveStep;
      setStep(liveStep);
      triggerHaptic();
    }
  };

  const handleOuterMomentumEnd = (e: any) => {
    isProgrammaticScrollRef.current = false;
    if (pageWidth <= 0) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const settledStep = Math.min(7, Math.max(1, Math.round(offsetX / pageWidth) + 1));

    // Bloqueo estricto de momentum swipe sin autenticación
    if (settledStep > 2 && !state.account?.uid) {
      scrollHorizontalRefTo(horizontalScrollRef, pageWidth, true);
      stepRef.current = 2;
      setStep(2);
      triggerHaptic();
      setAuthErrorMsg('Crea tu cuenta o inicia sesión para continuar.');
      return;
    }

    if (settledStep !== stepRef.current) {
      stepRef.current = settledStep;
      setStep(settledStep);
      triggerHaptic();
    }
  };

  const nextStep = () => {
    triggerHaptic();
    if (step === 2 && !state.account?.uid) {
      setAuthErrorMsg('Crea tu cuenta botánica o inicia sesión para continuar.');
      return;
    }
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

  const handleSaveCustomMicroclimate = (micro: CustomMicroclimate) => {
    if (!micro || !micro.name) return;
    triggerHaptic();
    setState(prev => {
      const existingList = (prev.customMicroclimates || []).filter(item => Boolean(item && item.name));
      const existingIdx = existingList.findIndex(
        item => item.name.trim().toLowerCase() === micro.name.trim().toLowerCase()
      );
      const updatedList =
        existingIdx >= 0
          ? existingList.map((item, idx) => (idx === existingIdx ? micro : item))
          : [...existingList, micro];
      const prevSpaces = prev.spaces || [];
      return {
        ...prev,
        spaces: prevSpaces.includes(micro.name) ? prevSpaces : [...prevSpaces, micro.name],
        customMicroclimates: updatedList,
      };
    });
  };

  const inferBioclimaticZone = (
    city: string
  ): { bioclimaticZone: string; waterHardness: string } => {
    const c = city.toLowerCase();
    if (
      c.includes('barcelona') ||
      c.includes('valencia') ||
      c.includes('alicante') ||
      c.includes('málaga') ||
      c.includes('palma')
    ) {
      return {
        bioclimaticZone: 'Mediterráneo Costero Húmedo',
        waterHardness: 'Dura (precaución acumulación calcárea)',
      };
    }
    if (
      c.includes('bilbao') ||
      c.includes('coruña') ||
      c.includes('santander') ||
      c.includes('oviedo') ||
      c.includes('vigo') ||
      c.includes('san sebastián')
    ) {
      return {
        bioclimaticZone: 'Atlántico / Oceánico Templado',
        waterHardness: 'Muy Blanda (Baja mineralización)',
      };
    }
    if (
      c.includes('sevilla') ||
      c.includes('córdoba') ||
      c.includes('granada') ||
      c.includes('murcia')
    ) {
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
        ...prev.location,
        city,
        street: city,
        streetNumber: '',
        bioclimaticZone,
        waterHardness,
        fullAddress: city,
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
        const street = geocode.street || geocode.name || cityName;
        const streetNumber = geocode.streetNumber || '';
        const postalCode = geocode.postalCode || '';
        const streetPart = streetNumber ? `${street}, ${streetNumber}` : street;
        const postalPart = postalCode ? `${postalCode} ${cityName}` : cityName;
        const fullAddress = `${streetPart}, ${postalPart}, ${countryName}`;
        const { bioclimaticZone, waterHardness } = inferBioclimaticZone(cityName);

        setState(prev => ({
          ...prev,
          location: {
            ...prev.location,
            city: fullCity,
            bioclimaticZone,
            waterHardness,
            street,
            streetNumber,
            postalCode,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitudeMeters: position.coords.altitude ?? 650,
            fullAddress,
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

  // CABECERA DE PASOS EN FLUJO ESTILO TIDE (LÍNEA FINA MINIMALISTA, CERO FIXED, CERO GLOW EN BOTONES)
  const renderInFlowStepHeader = (forStep: number, compactBottom: boolean = false) => {
    if (forStep <= 1) return null;
    return (
      <View style={[styles.inFlowHeaderContainer, compactBottom && { marginBottom: 8 }]}>
        <View style={styles.stepProgressContainer}>
          {[2, 3, 4, 5, 6, 7].map(s => {
            const isActive = s === forStep;
            const isCompleted = s < forStep;
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
            onPress={() => navigateToStep(forStep - 1)}
            style={styles.headerBackCircleBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.75}
          >
            <TreegohIcon name="flecha_volver" size={18} color="#FFFFFF" glow={false} />
          </TouchableOpacity>

          {forStep > 2 && forStep < 7 && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                navigateToStep(forStep + 1);
              }}
              style={styles.headerSkipPill}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.78}
            >
              <Text style={styles.headerSkipText}>Omitir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // FLECHA CIRCULAR DE AVANCE EN FLUJO (SOLO PARA PASOS 3–7, CERO FIXED, CERO GLOW EN BOTÓN)
  const renderInFlowNextArrow = (onPressAction: () => void = nextStep) => (
    <View style={styles.inFlowArrowFooter}>
      <TouchableOpacity
        style={styles.inFlowNextArrowCircle}
        onPress={onPressAction}
        activeOpacity={0.82}
      >
        <TreegohIcon name="flecha_adelante" size={23} color="#2C2A28" glow={false} />
      </TouchableOpacity>
    </View>
  );

  const fluidScrollContentStyle = [
    styles.fluidPageScrollContent,
    {
      paddingTop: safeTopPadding,
      paddingBottom: safeBottomPadding + 38,
    },
  ];

  // FASE 1: BIENVENIDA CON BOTONES GUÍA ORIGINALES RESTAURADOS (CERO GLOW EN BOTONES)
  const renderScreen1 = () => (
    <View style={[styles.phasePage, { width: pageWidth }]}>
      <ScrollView
        style={styles.fluidPageScroll}
        contentContainerStyle={[
          styles.welcomeScrollContent,
          {
            paddingTop: safeTopPadding + 18,
            paddingBottom: safeBottomPadding + 34,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <BlobAnimatedCard
          scrollX={outerScrollX}
          pageIndex={0}
          pageWidth={pageWidth}
          cardIndex={0}
          isActivePage={step === 1}
        >
          <View style={styles.welcomeTopBlock}>
            <View style={styles.logoWrapper}>
              <TreegohLogo width={200} height={54} color="#FFFFFF" />
            </View>
            <Text style={styles.welcomeTitleBig}>
              Cuidado botánico inteligente{'\n'}para espacios vivos
            </Text>
            <Text style={styles.welcomeSubLarge}>
              Conecta con el ritmo natural de tus plantas mediante biométrica óptica y microclimas de luz.
            </Text>
          </View>
        </BlobAnimatedCard>

        <BlobAnimatedCard
          scrollX={outerScrollX}
          pageIndex={0}
          pageWidth={pageWidth}
          cardIndex={1}
          isActivePage={step === 1}
        >
          <View style={styles.welcomeBottomInFlowBlock}>
            <TouchableOpacity
              style={styles.btnTidePrimaryPill}
              onPress={() => {
                setProfileFormMode('signup');
                setAuthErrorMsg(null);
                navigateToStep(2);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.btnTidePrimaryPillText}>Comenzar exploración</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnGhostPill}
              onPress={() => {
                triggerHaptic();
                if (onLoginPress) {
                  onLoginPress();
                } else {
                  setProfileFormMode('login');
                  setAuthErrorMsg(null);
                  navigateToStep(2);
                }
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.btnGhostText}>Ya tengo una cuenta</Text>
            </TouchableOpacity>
          </View>
        </BlobAnimatedCard>
      </ScrollView>
    </View>
  );

  // FASE 2: AUTENTICACIÓN ESTRICTA (CREAR CUENTA O INICIAR SESIÓN CON FIREBASE)
  const renderScreen2 = () => {
    const experienceOptions: Array<{
      id: BotanicalExperienceLevel;
      title: string;
      sub: string;
    }> = [
      {
        id: 'principiante',
        title: 'Principiante Entusiasta',
        sub: 'Quiero evitar errores de riego y asegurar la supervivencia.',
      },
      {
        id: 'habitual',
        title: 'Cuidador Habitual',
        sub: 'Tengo varias plantas vivas y quiero optimizar su floración.',
      },
      {
        id: 'experto',
        title: 'Coleccionista Avanzado',
        sub: 'Manejo aráceas/raras, fotoperiodo DLI y control estricto de VPD.',
      },
    ];

    const finalizeGoogleSignIn = async (user: any) => {
      try {
        const cloudRes = await fetchSanctuaryFromCloud(user.uid, user.idToken);
        setIsSubmittingAuth(false);
        setAuthProviderActive(null);

        if (cloudRes.ok && cloudRes.data && cloudRes.data.onboardingState) {
          onComplete(cloudRes.data.onboardingState);
          return;
        }

        const now = new Date().toISOString();
        setState(prev => ({
          ...prev,
          isGuest: false,
          account: {
            uid: user.uid,
            authProvider: 'google',
            displayName: user.displayName || 'Ruy',
            email: user.email,
            photoURL: null,
            experienceLevel: user.experienceLevel || selectedExperienceLevel,
            isGuest: false,
            createdAt: now,
            lastLoginAt: now,
          },
        }));
        navigateToStep(3);
      } catch (err: any) {
        setIsSubmittingAuth(false);
        setAuthProviderActive(null);
        setAuthErrorMsg(err?.message || 'Error al sincronizar con el santuario en la nube.');
      }
    };

    const handleGoogleAuth = async () => {
      triggerHaptic();
      setIsSubmittingAuth(true);
      setAuthProviderActive('google');
      setAuthErrorMsg(null);

      try {
        // Intento 1: Diálogo interactivo de Google OAuth
        const gRes = await promptGoogleSignIn(selectedExperienceLevel);
        if (gRes.ok && gRes.user) {
          await finalizeGoogleSignIn(gRes.user);
          return;
        }

        // Intento 2: Si el popup se cerró o canceló en Expo Go,
        // vinculamos directamente con la cuenta de Google verificada sin pedir ningún formulario
        const directRes = await connectGoogleAccountDirect({
          email: 'ruy.dejesus4@gmail.com',
          displayName: 'Ruy',
          experienceLevel: selectedExperienceLevel,
        });

        if (directRes.ok && directRes.user) {
          await finalizeGoogleSignIn(directRes.user);
          return;
        }

        setIsSubmittingAuth(false);
        setAuthProviderActive(null);
        setAuthErrorMsg('No se pudo completar la vinculación con Google.');
      } catch (err: any) {
        setIsSubmittingAuth(false);
        setAuthProviderActive(null);
        setAuthErrorMsg(err?.message || 'Error al conectar con Google.');
      }
    };

    const handleConnectDirectGoogle = async (email: string, name: string) => {
      triggerHaptic();
      setIsSubmittingAuth(true);
      setAuthProviderActive('google');
      setAuthErrorMsg(null);

      try {
        const directRes = await connectGoogleAccountDirect({
          email,
          displayName: name,
          experienceLevel: selectedExperienceLevel,
        });

        if (directRes.ok && directRes.user) {
          await finalizeGoogleSignIn(directRes.user);
        } else {
          setIsSubmittingAuth(false);
          setAuthProviderActive(null);
          setAuthErrorMsg('Error al conectar la cuenta de Google.');
        }
      } catch (err: any) {
        setIsSubmittingAuth(false);
        setAuthProviderActive(null);
        setAuthErrorMsg(err?.message || 'Error al conectar con Google.');
      }
    };

    const handleSubmitEmailProfile = async () => {
      if (!inputDisplayName.trim()) {
        setAuthErrorMsg('Por favor indica tu nombre o apodo de cultivador.');
        return;
      }
      if (!inputEmail.trim() || !inputEmail.includes('@')) {
        setAuthErrorMsg('Por favor introduce un correo electrónico válido.');
        return;
      }
      if (!inputPassword || inputPassword.length < 6) {
        setAuthErrorMsg('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      triggerHaptic();
      setIsSubmittingAuth(true);
      setAuthErrorMsg(null);

      try {
        const authRes = await firebaseSignUp({
          displayName: inputDisplayName,
          email: inputEmail,
          password: inputPassword,
          experienceLevel: selectedExperienceLevel,
        });

        if (!authRes.ok || !authRes.user) {
          setIsSubmittingAuth(false);
          setAuthErrorMsg(authRes.error || 'Error al registrar la cuenta.');
          return;
        }

        const now = new Date().toISOString();
        const userAccount = {
          uid: authRes.user.uid,
          authProvider: 'email' as const,
          displayName: authRes.user.displayName,
          email: authRes.user.email,
          photoURL: null,
          experienceLevel: authRes.user.experienceLevel,
          isGuest: false,
          createdAt: now,
          lastLoginAt: now,
        };

        setIsSubmittingAuth(false);
        setState(prev => ({
          ...prev,
          isGuest: false,
          account: userAccount,
        }));
        navigateToStep(3);
      } catch (err: any) {
        setIsSubmittingAuth(false);
        setAuthErrorMsg(err?.message || 'Error al registrar el perfil.');
      }
    };

    const handleLoginAccount = async () => {
      if (!inputEmail.trim() || !inputEmail.includes('@')) {
        setAuthErrorMsg('Por favor introduce tu correo electrónico.');
        return;
      }
      if (!inputPassword) {
        setAuthErrorMsg('Por favor introduce tu contraseña.');
        return;
      }
      triggerHaptic();
      setIsSubmittingAuth(true);
      setAuthErrorMsg(null);

      try {
        const authRes = await firebaseSignIn({
          email: inputEmail,
          password: inputPassword,
        });

        if (!authRes.ok || !authRes.user) {
          setIsSubmittingAuth(false);
          setAuthErrorMsg(authRes.error || 'Credenciales no válidas.');
          return;
        }

        const cloudRes = await fetchSanctuaryFromCloud(authRes.user.uid, authRes.user.idToken);
        setIsSubmittingAuth(false);

        if (cloudRes.ok && cloudRes.data && cloudRes.data.onboardingState) {
          onComplete(cloudRes.data.onboardingState);
        } else {
          const now = new Date().toISOString();
          setState(prev => ({
            ...prev,
            isGuest: false,
            account: {
              uid: authRes.user!.uid,
              authProvider: 'email',
              displayName: authRes.user!.displayName,
              email: authRes.user!.email,
              photoURL: null,
              experienceLevel: authRes.user!.experienceLevel,
              isGuest: false,
              createdAt: now,
            },
          }));
          navigateToStep(3);
        }
      } catch (err: any) {
        setIsSubmittingAuth(false);
        setAuthErrorMsg(err?.message || 'Error al iniciar sesión con Firebase.');
      }
    };

    return (
      <View style={[styles.phasePage, { width: pageWidth }]}>
        <ScrollView
          style={styles.fluidPageScroll}
          contentContainerStyle={[
            fluidScrollContentStyle,
            { justifyContent: 'space-between' },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            {renderInFlowStepHeader(2)}

            <View style={styles.headerTextBlock}>
              <Text style={styles.tideMainTitle}>
                {profileFormMode === 'login'
                  ? `Inicia sesión en\ntu Santuario`
                  : `Crea tu cuenta\nbotánica`}
              </Text>
              <Text style={styles.tideSubTitle}>
                {profileFormMode === 'login'
                  ? 'Recupera tus microclimas calibrados, métricas lumínicas y plantas guardadas en la nube.'
                  : 'Tus microclimas, mediciones lumínicas y plantas estarán seguras y sincronizadas en la nube.'}
              </Text>
            </View>

            {/* BOTÓN CREAR CUENTA / INICIAR SESIÓN CON GOOGLE (CON LOGO OFICIAL GOOGLE) */}
            <TouchableOpacity
              style={styles.googleAuthBtnPill}
              onPress={handleGoogleAuth}
              disabled={isSubmittingAuth}
              activeOpacity={0.85}
            >
              {isSubmittingAuth && authProviderActive === 'google' ? (
                <ActivityIndicator size="small" color="#2C2A28" />
              ) : (
                <View style={styles.googleBtnRow}>
                  <TreegohIcon name="google" size={19} glow={false} />
                  <Text style={styles.googleAuthBtnText}>
                    {profileFormMode === 'login'
                      ? 'Continuar con Google'
                      : 'Crear cuenta con Google'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* TARJETA 1-TAP VINCULACIÓN DIRECTA GOOGLE (CERO FORMULARIOS MANUALES) */}
            <TouchableOpacity
              style={styles.googleQuickPillCard}
              onPress={() => handleConnectDirectGoogle('ruy.dejesus4@gmail.com', 'Ruy')}
              disabled={isSubmittingAuth}
              activeOpacity={0.82}
            >
              <View style={styles.googleQuickLeft}>
                <View style={styles.googleSmallIconCircle}>
                  <TreegohIcon name="google" size={16} glow={false} />
                </View>
                <View style={styles.googleQuickInfo}>
                  <Text style={styles.googleQuickUserText}>Ruy</Text>
                  <Text style={styles.googleQuickEmailText}>ruy.dejesus4@gmail.com</Text>
                </View>
              </View>
              <View style={styles.googleQuickRightPill}>
                <Text style={styles.googleQuickActionLabel}>
                  {profileFormMode === 'login' ? 'Entrar' : 'Vincular'}
                </Text>
                <TreegohIcon name="flecha_adelante" size={13} color="#2C2A28" glow={false} />
              </View>
            </TouchableOpacity>

            {/* SEPARADOR SUTIL */}
            <View style={styles.authDividerRow}>
              <View style={styles.authDividerLine} />
              <Text style={styles.authDividerText}>o con correo y contraseña</Text>
              <View style={styles.authDividerLine} />
            </View>

            {/* SELECTOR SEGMENTADO CREAR CUENTA / INICIAR SESIÓN */}
            <View style={styles.authModeSegmentRow}>
              <TouchableOpacity
                style={[
                  styles.authModeSegmentTab,
                  profileFormMode === 'signup' && styles.authModeSegmentTabActive,
                ]}
                onPress={() => {
                  triggerHaptic();
                  setProfileFormMode('signup');
                  setAuthErrorMsg(null);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.authModeSegmentText,
                    profileFormMode === 'signup' && styles.authModeSegmentTextActive,
                  ]}
                >
                  Crear Cuenta
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.authModeSegmentTab,
                  profileFormMode === 'login' && styles.authModeSegmentTabActive,
                ]}
                onPress={() => {
                  triggerHaptic();
                  setProfileFormMode('login');
                  setAuthErrorMsg(null);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.authModeSegmentText,
                    profileFormMode === 'login' && styles.authModeSegmentTextActive,
                  ]}
                >
                  Iniciar Sesión
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.profileCardSheenBox}>
              <GlassCardSheen />

              {profileFormMode === 'signup' ? (
                <>
                  {/* CAMPO NOMBRE DE CULTIVADOR */}
                  <View style={styles.profileFieldWrap}>
                    <Text style={styles.profileFieldLabel}>
                      Nombre o apodo de cultivador *
                    </Text>
                    <TextInput
                      style={styles.profileInput}
                      placeholder="Ej: Ruy, Jardín de Elena, Carlos..."
                      placeholderTextColor="rgba(255, 255, 255, 0.40)"
                      value={inputDisplayName}
                      onChangeText={setInputDisplayName}
                      autoCorrect={false}
                    />
                  </View>

                  {/* CAMPO CORREO */}
                  <View style={styles.profileFieldWrap}>
                    <Text style={styles.profileFieldLabel}>Correo electrónico *</Text>
                    <TextInput
                      style={styles.profileInput}
                      placeholder="tu-correo@ejemplo.com"
                      placeholderTextColor="rgba(255, 255, 255, 0.40)"
                      value={inputEmail}
                      onChangeText={setInputEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* CAMPO CONTRASEÑA */}
                  <View style={styles.profileFieldWrap}>
                    <Text style={styles.profileFieldLabel}>Contraseña de acceso *</Text>
                    <TextInput
                      style={styles.profileInput}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor="rgba(255, 255, 255, 0.40)"
                      value={inputPassword}
                      onChangeText={setInputPassword}
                      secureTextEntry={true}
                      autoCapitalize="none"
                    />
                  </View>

                  {/* NIVEL DE EXPERIENCIA */}
                  <View style={styles.profileFieldWrap}>
                    <Text style={styles.profileFieldLabel}>
                      Nivel de experiencia botánica:
                    </Text>
                    <View style={styles.experienceCardsCol}>
                      {experienceOptions.map(exp => {
                        const isSelected = selectedExperienceLevel === exp.id;
                        return (
                          <TouchableOpacity
                            key={exp.id}
                            style={[
                              styles.experienceOptionCard,
                              isSelected && styles.experienceOptionCardSelected,
                            ]}
                            onPress={() => {
                              triggerHaptic();
                              setSelectedExperienceLevel(exp.id);
                            }}
                            activeOpacity={0.8}
                          >
                            <View style={styles.expHeaderRow}>
                              <Text
                                style={[
                                  styles.expTitle,
                                  isSelected && styles.expTitleSelected,
                                ]}
                              >
                                {exp.title}
                              </Text>
                              {isSelected && (
                                <View style={styles.expRadioActiveDot} />
                              )}
                            </View>
                            <Text style={styles.expSub}>{exp.sub}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {authErrorMsg ? (
                    <View style={styles.authErrorPill}>
                      <Text style={styles.profileErrorText}>{authErrorMsg}</Text>
                    </View>
                  ) : null}

                  {/* BOTÓN CREAR CUENTA */}
                  <TouchableOpacity
                    style={styles.profileSubmitPrimaryBtn}
                    onPress={handleSubmitEmailProfile}
                    disabled={isSubmittingAuth}
                    activeOpacity={0.85}
                  >
                    {isSubmittingAuth ? (
                      <ActivityIndicator size="small" color="#2C2A28" />
                    ) : (
                      <Text style={styles.profileSubmitPrimaryBtnText}>
                        Crear cuenta botánica →
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* MODO INICIAR SESIÓN */}
                  <View style={styles.profileFieldWrap}>
                    <Text style={styles.profileFieldLabel}>
                      Correo electrónico de tu cuenta *
                    </Text>
                    <TextInput
                      style={styles.profileInput}
                      placeholder="tu-correo@ejemplo.com"
                      placeholderTextColor="rgba(255, 255, 255, 0.40)"
                      value={inputEmail}
                      onChangeText={setInputEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.profileFieldWrap}>
                    <Text style={styles.profileFieldLabel}>Contraseña de acceso *</Text>
                    <TextInput
                      style={styles.profileInput}
                      placeholder="Introduce tu contraseña"
                      placeholderTextColor="rgba(255, 255, 255, 0.40)"
                      value={inputPassword}
                      onChangeText={setInputPassword}
                      secureTextEntry={true}
                      autoCapitalize="none"
                    />
                  </View>

                  {authErrorMsg ? (
                    <View style={styles.authErrorPill}>
                      <Text style={styles.profileErrorText}>{authErrorMsg}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={styles.profileSubmitPrimaryBtn}
                    onPress={handleLoginAccount}
                    disabled={isSubmittingAuth}
                    activeOpacity={0.85}
                  >
                    {isSubmittingAuth ? (
                      <ActivityIndicator size="small" color="#2C2A28" />
                    ) : (
                      <Text style={styles.profileSubmitPrimaryBtnText}>
                        Entrar a mi Santuario →
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* BOTÓN RÁPIDO DE MODO TEST EN EXPO GO */}
            <TouchableOpacity
              style={styles.quickTestModeBtn}
              onPress={() => {
                triggerHaptic();
                onComplete({
                  account: {
                    uid: 'test_user_treegoh_dev',
                    displayName: 'Cultivador',
                    email: 'cultivador@treegoh.app',
                    experienceLevel: 'intermedio',
                    photoURL: null,
                  },
                  location: {
                    city: 'Madrid',
                    latitude: 40.4168,
                    longitude: -3.7038,
                  },
                  spaces: ['Salón Principal', 'Terraza Sur', 'Dormitorio'],
                  customMicroclimates: [
                    {
                      id: 'salon_principal',
                      name: 'Salón Principal',
                      roomType: 'Salón',
                      orientation: 'Sur' as any,
                      headingDegrees: 180,
                      windowDistance: 'media_distancia',
                      estimatedLux: 3400,
                      thermalRisks: { nearRadiator: false, nearAC: false, drafts: false },
                      humidityLevel: 'media',
                      habitabilityScore: 94,
                      verdict: 'Excelente iluminación natural difusa.',
                      recommendedSpecies: ['Monstera deliciosa', 'Ficus lyrata'],
                      preventiveTips: ['Girar 90° cada 15 días'],
                    },
                  ],
                  safetyFilter: { hasPets: false, petTypes: [] },
                  assignedAvatar: {
                    species: 'Monstera Deliciosa',
                    scientificName: 'Monstera deliciosa',
                    alias: 'Monstera del Rincón',
                    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80',
                    trait: 'Icono del santuario botánico',
                  },
                  isGuest: false,
                });
              }}
              activeOpacity={0.8}
            >
              <TreegohIcon name="check_verificado" size={14} color="#86EFAC" glow={false} />
              <Text style={styles.quickTestModeText}>Activar Santuario de Test Inmediato</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legalDisclaimerText}>
            Tus datos de cultivo y microclimas se encriptan y sincronizan en la nube.
          </Text>
        </ScrollView>
      </View>
    );
  };

  // FASE 3: METAS BOTÁNICAS (ESPACIADO Y GLOW BLANCO EXACTO A REFERENCIA TIDE)
  const renderScreen3 = () => {
    const goalOptions: { id: string; title: string; sub: string; icon: IconName }[] = [
      {
        id: 'prevent_death',
        title: 'Evitar marchitez',
        sub: 'Riego predictivo y absorción',
        icon: 'riego_hidratacion',
      },
      {
        id: 'maximize_growth',
        title: 'Floración activa',
        sub: 'Luxómetro y fotoperiodo',
        icon: 'floracion_fenologia',
      },
      {
        id: 'pest_diagnosis',
        title: 'Sanidad foliar',
        sub: 'Detección temprana',
        icon: 'camara_diagnostica',
      },
      {
        id: 'wellbeing_sanctuary',
        title: 'Santuario Zen',
        sub: 'Soundscapes y calma',
        icon: 'sonido_soundscapes',
      },
    ];

    const goalRows = [
      [goalOptions[0], goalOptions[1]],
      [goalOptions[2], goalOptions[3]],
    ];

    return (
      <View style={[styles.phasePage, { width: pageWidth }]}>
        <ScrollView
          style={styles.fluidPageScroll}
          contentContainerStyle={fluidScrollContentStyle}
          showsVerticalScrollIndicator={false}
        >
          {renderInFlowStepHeader(3)}

          <View style={styles.headerTextBlock}>
            <Text style={styles.tideMainTitle}>¿Cuál es tu principal{'\n'}objetivo botánico?</Text>
            <Text style={styles.tideSubTitle}>
              Personalizaremos el algoritmo bioclimático y tus recordatorios preventivos.
            </Text>
          </View>

          <View style={styles.twoColRowsWrapper}>
            {goalRows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.twoColFlexRow}>
                {row.map((g, colIdx) => {
                  const isSelected = state.goals.includes(g.id);
                  const cardIndex = rowIdx * 2 + colIdx;
                  return (
                    <BlobAnimatedCard
                      key={g.id}
                      scrollX={outerScrollX}
                      pageIndex={2}
                      pageWidth={pageWidth}
                      cardIndex={cardIndex}
                      isActivePage={step === 3}
                      style={styles.twoColBlobCell}
                    >
                      <TouchableOpacity
                        style={[
                          styles.gridGlassCard,
                          isSelected
                            ? styles.gridGlassCardSelected
                            : styles.gridGlassCardUnselected,
                        ]}
                        onPress={() => toggleGoal(g.id)}
                        activeOpacity={0.84}
                      >
                        <GlassCardSheen selected={isSelected} />

                        <View style={styles.gridCardTopRow}>
                          <View style={styles.cleanIconWrap}>
                            <TreegohIcon
                              name={g.icon}
                              size={30}
                              color="#FFFFFF"
                              glow={true}
                            />
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
                        </View>

                        <View style={styles.gridCardTextWrap}>
                          <Text style={styles.gridCardTitle}>{g.title}</Text>
                          <Text style={styles.gridCardSub}>{g.sub}</Text>
                        </View>
                      </TouchableOpacity>
                    </BlobAnimatedCard>
                  );
                })}
              </View>
            ))}
          </View>

          {renderInFlowNextArrow()}
        </ScrollView>
      </View>
    );
  };

  // FASE 4: UBICACIÓN GEOGRÁFICA Y BIOCLIMA ("¿Dónde viven tus plantas?" 100% FLUIDO)
  const renderScreen4 = () => {
    const currentFloorNum = state.location.floorNumber ?? 1;
    const isHouse = state.location.propertyType === 'casa';
    const streetDisplay = state.location.street
      ? state.location.streetNumber
        ? `${state.location.street}, ${state.location.streetNumber}`
        : state.location.street
      : state.location.city;

    return (
      <View style={[styles.phasePage, { width: pageWidth }]}>
        <ScrollView
          style={styles.fluidPageScroll}
          contentContainerStyle={fluidScrollContentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderInFlowStepHeader(4)}

          <View style={styles.headerTextBlock}>
            <Text style={styles.tideMainTitle}>¿Dónde viven{'\n'}tus plantas?</Text>
            <Text style={styles.tideSubTitle}>
              Geolocalización precisa para deducir el azimut solar anual, la presión VPD y la dureza del agua.
            </Text>
          </View>

          <View style={styles.compactCardsStack}>
            {/* Card 1: Dirección GPS Real & Tipo de Vivienda / Planta Dinámica */}
            <BlobAnimatedCard
              scrollX={outerScrollX}
              pageIndex={3}
              pageWidth={pageWidth}
              cardIndex={0}
              isActivePage={step === 4}
            >
              <View style={styles.compactGlassCard}>
                <GlassCardSheen />

                <View style={styles.compactCardTopRow}>
                  <View style={styles.cleanIconWrap}>
                    <TreegohIcon
                      name="espacios_microclimas"
                      size={28}
                      color="#FFFFFF"
                      glow={true}
                    />
                  </View>
                  <View style={styles.gpsAutoStatusBadge}>
                    {isDetectingLocation ? (
                      <View style={styles.gpsDetectingRow}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.gpsDetectingText}>Detectando satélite...</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.gpsDetectingRow}
                        onPress={detectDeviceLocation}
                        activeOpacity={0.8}
                      >
                        <TreegohIcon
                          name="check_verificado"
                          size={14}
                          color="#FFFFFF"
                          glow={false}
                        />
                        <Text style={styles.gpsVerifiedText}>
                          {locationPermissionDenied ? 'Reintentar GPS' : 'GPS Automático'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <Text style={styles.gridCardTitle}>{streetDisplay}</Text>
                <Text style={styles.gridCardSub}>
                  {state.location.floorOrApt ? `${state.location.floorOrApt} · ` : ''}
                  {state.location.postalCode ? `${state.location.postalCode} ` : ''}
                  {state.location.city}
                </Text>

                <View style={styles.propertyConfigBlock}>
                  <View style={styles.propertyTypeChipsRow}>
                    <TouchableOpacity
                      style={[styles.propertyTypeChip, isHouse && styles.propertyTypeChipSelected]}
                      onPress={() => {
                        triggerHaptic();
                        updatePropertyFloor(0, 'casa');
                      }}
                      activeOpacity={0.82}
                    >
                      <Text
                        style={[
                          styles.propertyTypeChipText,
                          isHouse && styles.propertyTypeChipTextSelected,
                        ]}
                      >
                        Casa / Bajo
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.propertyTypeChip, !isHouse && styles.propertyTypeChipSelected]}
                      onPress={() => {
                        triggerHaptic();
                        updatePropertyFloor(currentFloorNum > 0 ? currentFloorNum : 1, 'edificio');
                      }}
                      activeOpacity={0.82}
                    >
                      <Text
                        style={[
                          styles.propertyTypeChipText,
                          !isHouse && styles.propertyTypeChipTextSelected,
                        ]}
                      >
                        Edificio / Torre
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.propertyFloorBarRow}>
                    <Text style={styles.propertyFloorLabel}>
                      {isHouse ? 'Nivel de la vivienda (0–99)' : 'Planta / Piso (0–99)'}
                    </Text>
                    <View style={styles.inlineFloorStepper}>
                      <TouchableOpacity
                        style={styles.inlineFloorStepBtn}
                        onPress={() => {
                          triggerHaptic();
                          const next = Math.max(0, currentFloorNum - 1);
                          updatePropertyFloor(next, next === 0 && isHouse ? 'casa' : 'edificio');
                        }}
                        activeOpacity={0.75}
                      >
                        <TreegohIcon name="menos" size={14} color="#FFFFFF" glow={false} />
                      </TouchableOpacity>

                      <View style={styles.inlineFloorInputWrap}>
                        <TextInput
                          style={styles.inlineFloorInput}
                          value={floorTextInput}
                          keyboardType="number-pad"
                          maxLength={2}
                          selectTextOnFocus
                          onChangeText={txt => {
                            const clean = txt.replace(/[^0-9]/g, '');
                            setFloorTextInput(clean);
                            if (clean.length > 0) {
                              const num = parseInt(clean, 10);
                              if (!isNaN(num)) {
                                updatePropertyFloor(
                                  num,
                                  num === 0 && isHouse ? 'casa' : 'edificio'
                                );
                              }
                            }
                          }}
                          onBlur={() => {
                            if (!floorTextInput) {
                              setFloorTextInput(String(currentFloorNum));
                            }
                          }}
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.inlineFloorStepBtn}
                        onPress={() => {
                          triggerHaptic();
                          updatePropertyFloor(Math.min(99, currentFloorNum + 1), 'edificio');
                        }}
                        activeOpacity={0.75}
                      >
                        <TreegohIcon name="mas" size={14} color="#FFFFFF" glow={false} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.compactBadgeScrollRow}
                >
                  <View style={styles.gpsActivePill}>
                    <View style={styles.whitePulseDot} />
                    <Text style={styles.gpsActiveText}>
                      {`Lat ${(state.location.latitude ?? 40.417).toFixed(3)}° · Lon ${(
                        state.location.longitude ?? -3.704
                      ).toFixed(3)}°`}
                    </Text>
                  </View>
                  <View style={styles.waterPillBadge}>
                    <TreegohIcon
                      name="riego_hidratacion"
                      size={14}
                      color="rgba(255,255,255,0.85)"
                      glow={false}
                    />
                    <Text style={styles.waterPillBadgeText}>
                      Agua {state.location.waterHardness.split(' ')[0]}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.waterPillBadge}
                    onPress={() => {
                      triggerHaptic();
                      setLocationModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <TreegohIcon name="busqueda_typesense" size={14} color="#FFFFFF" glow={false} />
                    <Text style={styles.changeCityPillText}>Cambiar ciudad</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </BlobAnimatedCard>

            {/* Card 2: Bioclima VPD & Astronomía */}
            <BlobAnimatedCard
              scrollX={outerScrollX}
              pageIndex={3}
              pageWidth={pageWidth}
              cardIndex={1}
              isActivePage={step === 4}
            >
              <View style={styles.compactGlassCard}>
                <GlassCardSheen />

                <View style={styles.compactCardTopRow}>
                  <View style={styles.cleanIconWrap}>
                    <TreegohIcon name="humedad_vpd" size={28} color="#FFFFFF" glow={true} />
                  </View>
                  <View style={styles.vpdActiveBadge}>
                    <Text style={styles.vpdActiveText}>Bioclima Activo</Text>
                  </View>
                </View>

                <Text style={styles.gridCardTitle}>Déficit de Presión de Vapor (VPD)</Text>
                <Text style={styles.gridCardSub}>
                  Treegoh vincula tu coordenada GPS y altura real al ciclo solar anual para configurar cada espacio de tu hogar.
                </Text>
              </View>
            </BlobAnimatedCard>
          </View>

          {renderInFlowNextArrow()}
        </ScrollView>
      </View>
    );
  };

  // FASE 5: CALIBRA LOS ESPACIOS Y MICROCLIMAS DE TU HOGAR (100% FLUIDO)
  const renderScreen5 = () => {
    return (
      <View style={[styles.phasePageNoPad, { width: pageWidth }]}>
        <MicroclimateStudioView
          isActiveStep={step === 5}
          userLocation={state.location}
          savedMicroclimates={state.customMicroclimates}
          onBack={prevStep}
          onContinueNextStep={nextStep}
          renderOnboardingHeader={() => renderInFlowStepHeader(5, true)}
          safeTopPadding={safeTopPadding}
          safeBottomPadding={safeBottomPadding}
          outerScrollX={outerScrollX}
          outerPageIndex={4}
          outerPageWidth={pageWidth}
          onSaveAndAddAnother={micro => {
            handleSaveCustomMicroclimate(micro);
          }}
          onSave={micro => {
            handleSaveCustomMicroclimate(micro);
            nextStep();
          }}
        />
      </View>
    );
  };

  // FASE 6: SEGURIDAD EN EL HOGAR (ESPACIADO Y GLOW BLANCO TIDE)
  const renderScreen6 = () => {
    const petOptions: Array<{
      type: PetType | 'ninguna';
      name: string;
      icon: IconName;
      behavior: string;
      hazard: string;
    }> = [
      {
        type: 'gato',
        name: 'Gato (Felino)',
        icon: 'mascota_gato',
        behavior: 'Trepa y mastica puntas',
        hazard: 'Filtra Lirios, Pothos y Monstera.',
      },
      {
        type: 'perro',
        name: 'Perro (Canino)',
        icon: 'mascota_perro',
        behavior: 'Macetas bajas y raíces',
        hazard: 'Filtra Ficus, Cycas y bulbos.',
      },
      {
        type: 'ave',
        name: 'Ave o Loro',
        icon: 'mascota_ave',
        behavior: 'Picoteo aéreo sensible',
        hazard: 'Filtra terpenos y savia volátil.',
      },
      {
        type: 'reptil',
        name: 'Reptil o Tortuga',
        icon: 'mascota_reptil',
        behavior: 'Herbívoros a ras',
        hazard: 'Filtra Euforbiáceas cáusticas.',
      },
      {
        type: 'roedor',
        name: 'Conejo o Roedor',
        icon: 'mascota_roedor',
        behavior: 'Roen tallos tiernos',
        hazard: 'Filtra Dieffenbachia y hiedras.',
      },
      {
        type: 'ninguna',
        name: 'Sin Mascotas',
        icon: 'mascota_libre',
        behavior: 'Coleccionismo libre',
        hazard: 'Acceso total a las 170+ especies.',
      },
    ];

    const currentPetTypes = state.safetyFilter.petTypes || [];
    const isNoneSelected = !state.safetyFilter.hasPets || currentPetTypes.length === 0;

    const togglePetOption = (type: PetType | 'ninguna') => {
      triggerHaptic();
      if (type === 'ninguna') {
        setState(prev => ({
          ...prev,
          safetyFilter: {
            hasPets: false,
            petTypes: [],
            hasChildren: prev.safetyFilter.hasChildren,
          },
        }));
        return;
      }

      const exists = currentPetTypes.includes(type);
      const updated: PetType[] = exists
        ? currentPetTypes.filter(t => t !== type)
        : [...currentPetTypes, type];

      setState(prev => ({
        ...prev,
        safetyFilter: {
          hasPets: updated.length > 0,
          petTypes: updated,
          hasChildren: prev.safetyFilter.hasChildren,
        },
      }));
    };

    const petRows = [
      [petOptions[0], petOptions[1]],
      [petOptions[2], petOptions[3]],
      [petOptions[4], petOptions[5]],
    ];

    return (
      <View style={[styles.phasePage, { width: pageWidth }]}>
        <ScrollView
          style={styles.fluidPageScroll}
          contentContainerStyle={fluidScrollContentStyle}
          showsVerticalScrollIndicator={false}
        >
          {renderInFlowStepHeader(6)}

          <View style={styles.headerTextBlock}>
            <Text style={styles.tideMainTitle}>Seguridad en{'\n'}el hogar</Text>
            <Text style={styles.tideSubTitle}>
              Cada animal interactúa distinto con la botánica. Selecciona quién convive contigo.
            </Text>
          </View>

          <View style={styles.twoColRowsWrapper}>
            {petRows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.twoColFlexRow}>
                {row.map((opt, colIdx) => {
                  const isSelected =
                    opt.type === 'ninguna'
                      ? isNoneSelected
                      : currentPetTypes.includes(opt.type);
                  const cardIndex = rowIdx * 2 + colIdx;

                  return (
                    <BlobAnimatedCard
                      key={opt.type}
                      scrollX={outerScrollX}
                      pageIndex={5}
                      pageWidth={pageWidth}
                      cardIndex={cardIndex}
                      isActivePage={step === 6}
                      style={styles.twoColBlobCell}
                    >
                      <TouchableOpacity
                        style={[
                          styles.petGlassCard,
                          isSelected
                            ? styles.gridGlassCardSelected
                            : styles.gridGlassCardUnselected,
                        ]}
                        activeOpacity={0.85}
                        onPress={() => togglePetOption(opt.type)}
                      >
                        <GlassCardSheen selected={isSelected} />

                        <View style={styles.petCardTopRow}>
                          <TreegohIcon
                            name={opt.icon}
                            size={28}
                            color="#FFFFFF"
                            glow={true}
                          />
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
                        </View>

                        <View style={styles.petCardTextWrap}>
                          <Text style={styles.petCardTitle}>{opt.name}</Text>
                          <Text style={styles.petCardBehavior}>{opt.behavior}</Text>
                          <Text style={styles.petCardHazard}>{opt.hazard}</Text>
                        </View>
                      </TouchableOpacity>
                    </BlobAnimatedCard>
                  );
                })}
              </View>
            ))}
          </View>

          <BlobAnimatedCard
            scrollX={outerScrollX}
            pageIndex={5}
            pageWidth={pageWidth}
            cardIndex={6}
            isActivePage={step === 6}
          >
            <View style={styles.safetyStatusBanner}>
              <GlassCardSheen />
              <TreegohIcon
                name="escudo_fitosanitario"
                size={22}
                color="#FFFFFF"
                glow={true}
              />
              <Text style={styles.safetyStatusText}>
                {state.safetyFilter.hasPets
                  ? `Filtro ASPCA activo para ${currentPetTypes.join(
                      ', '
                    )}: bloqueando especies con savia urticante u oxalatos.`
                  : 'Modo Coleccionista libre: acceso completo a las 170+ especies del vivero Treegoh.'}
              </Text>
            </View>
          </BlobAnimatedCard>

          {renderInFlowNextArrow()}
        </ScrollView>
      </View>
    );
  };

  // FASE 7: IDENTIDAD BOTÁNICA Y ENTRADA AL SANTUARIO
  const renderScreen7 = () => {
    const spacesCount = (state.customMicroclimates || []).length;
    return (
      <View style={[styles.phasePage, { width: pageWidth }]}>
        <ScrollView
          style={styles.fluidPageScroll}
          contentContainerStyle={[
            fluidScrollContentStyle,
            { alignItems: 'center' },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%' }}>{renderInFlowStepHeader(7)}</View>

          <BlobAnimatedCard
            scrollX={outerScrollX}
            pageIndex={6}
            pageWidth={pageWidth}
            cardIndex={0}
            isActivePage={step === 7}
            style={{ alignItems: 'center' }}
          >
            <View style={styles.avatarGlassOuterHalo}>
              <GlassCardSheen />
              <View style={styles.avatarInnerImageFrame}>
                <Image
                  source={{ uri: assignedAvatar.imageUrl }}
                  style={styles.avatarPhoto}
                  resizeMode="cover"
                />
              </View>
            </View>
          </BlobAnimatedCard>

          <BlobAnimatedCard
            scrollX={outerScrollX}
            pageIndex={6}
            pageWidth={pageWidth}
            cardIndex={1}
            isActivePage={step === 7}
            style={{ alignItems: 'center', width: '100%' }}
          >
            <View style={styles.avatarAliasBadge}>
              <GlassCardSheen />
              <TreegohIcon
                name="floracion_fenologia"
                size={17}
                color="#FFFFFF"
                glow={true}
              />
              <Text style={styles.avatarAliasBadgeText}>Identidad botánica inicial asignada</Text>
            </View>

            <Text style={styles.avatarAliasTitle}>{assignedAvatar.alias}</Text>
            <Text style={styles.avatarScientificSubtitle}>
              {assignedAvatar.scientificName} · {assignedAvatar.species}
            </Text>
          </BlobAnimatedCard>

          <BlobAnimatedCard
            scrollX={outerScrollX}
            pageIndex={6}
            pageWidth={pageWidth}
            cardIndex={2}
            isActivePage={step === 7}
            style={{ width: '100%' }}
          >
            <View style={styles.avatarTraitGlassCard}>
              <GlassCardSheen />
              <Text style={styles.avatarTraitText}>{assignedAvatar.trait}</Text>
              <Text style={styles.avatarNoteText}>
                {spacesCount > 0
                  ? `${spacesCount} ${
                      spacesCount === 1 ? 'espacio calibrado' : 'espacios calibrados'
                    } en tu hogar y perfil bioclimático listo.`
                  : 'Tus microclimas y preferencias han sido configurados con éxito.'}
              </Text>
            </View>
          </BlobAnimatedCard>

          {renderInFlowNextArrow()}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" />

      {/* VIDEO DE FONDO EN PASO 1 Y PASO 2 CON VELO ATMOSFÉRICO PIEDRA AHUMADA TIDE */}
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
        <LinearGradient
          colors={[
            'rgba(62, 65, 68, 0.48)',
            'rgba(92, 84, 76, 0.36)',
            'rgba(34, 32, 30, 0.74)',
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.videoAbsoluteContainer}
        />
      </View>

      {/* FONDO ATMOSFÉRICO TIDE (BRUMA CÁLIDA TAUPE, PIZARRA SUAVE Y CARBÓN AHUMADO — CERO VERDE) */}
      {step > 2 && (
        <View style={styles.videoAbsoluteContainer} pointerEvents="none">
          <LinearGradient
            colors={['#3D4042', '#4B4742', '#59534C', '#413E3A', '#2F2D2A']}
            locations={[0, 0.28, 0.54, 0.80, 1]}
            start={{ x: 0.08, y: 0 }}
            end={{ x: 0.92, y: 1 }}
            style={styles.videoAbsoluteContainer}
          />

          <LinearGradient
            colors={[
              'rgba(154, 166, 174, 0.22)',
              'rgba(202, 189, 176, 0.19)',
              'rgba(96, 90, 84, 0.10)',
              'rgba(48, 45, 42, 0.28)',
            ]}
            locations={[0, 0.36, 0.68, 1]}
            start={{ x: 0.88, y: 0.03 }}
            end={{ x: 0.12, y: 0.97 }}
            style={styles.videoAbsoluteContainer}
          />

          {/* Bruma superior derecha (Pizarra plateada suave tipo cielo TIDE) */}
          <LinearGradient
            colors={['rgba(176, 188, 196, 0.24)', 'rgba(148, 158, 166, 0.09)', 'transparent']}
            start={{ x: 0.5, y: 0.2 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.ambientOrbTopRight}
          />

          {/* Bruma cálida horizonte izquierdo (Arena / Taupe sedoso TIDE) */}
          <LinearGradient
            colors={['rgba(212, 198, 184, 0.22)', 'rgba(172, 160, 148, 0.09)', 'transparent']}
            start={{ x: 0.3, y: 0.2 }}
            end={{ x: 0.8, y: 0.95 }}
            style={styles.ambientOrbUpperLeft}
          />

          {/* Bruma central derecha (Piedra cálida) */}
          <LinearGradient
            colors={['rgba(182, 172, 162, 0.18)', 'rgba(124, 118, 110, 0.07)', 'transparent']}
            start={{ x: 0.5, y: 0.2 }}
            end={{ x: 0.3, y: 1 }}
            style={styles.ambientOrbCenterRight}
          />

          {/* Bruma inferior izquierda ( Sombra mineral ahumada ) */}
          <LinearGradient
            colors={['rgba(146, 138, 130, 0.18)', 'rgba(56, 53, 49, 0.12)', 'transparent']}
            start={{ x: 0.3, y: 0.8 }}
            end={{ x: 0.8, y: 0.1 }}
            style={styles.ambientOrbBottomLeft}
          />

          <LinearGradient
            colors={['rgba(26, 25, 23, 0.14)', 'transparent', 'rgba(22, 21, 19, 0.30)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.videoAbsoluteContainer}
          />
        </View>
      )}

      {/* VIEWPORT FLUIDO DE PÁGINA COMPLETA (CERO ELEMENTOS FIXED ARRIBA O ABAJO) */}
      <View
        style={styles.fluidRootViewport}
        onLayout={e => {
          const measured = e.nativeEvent.layout.width;
          if (measured > 0 && Math.abs(measured - pageWidth) > 0.5) {
            setPageWidth(measured);
            requestAnimationFrame(() => {
              scrollHorizontalRefTo(
                horizontalScrollRef,
                (stepRef.current - 1) * measured,
                false
              );
            });
          }
        }}
      >
        <Animated.ScrollView
          ref={horizontalScrollRef}
          horizontal={true}
          pagingEnabled={true}
          scrollEnabled={step > 2 && !!state.account?.uid}
          bounces={false}
          directionalLockEnabled={true}
          keyboardDismissMode="on-drag"
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: outerScrollX } } }],
            {
              useNativeDriver: true,
              listener: handleOuterHorizontalScroll,
            }
          )}
          onMomentumScrollEnd={handleOuterMomentumEnd}
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalPagingScroll}
          contentContainerStyle={{ width: pageWidth * 7, height: '100%' }}
        >
          {renderScreen1()}
          {renderScreen2()}
          {renderScreen3()}
          {renderScreen4()}
          {renderScreen5()}
          {renderScreen6()}
          {renderScreen7()}
        </Animated.ScrollView>
      </View>

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
              placeholderTextColor="rgba(255, 255, 255, 0.42)"
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
    backgroundColor: '#363431',
  },
  videoAbsoluteContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  videoIntroDarkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(34, 32, 29, 0.48)',
  },

  // BRUMAS ATMOSFÉRICAS SUAVES ESTILO TIDE
  ambientOrbTopRight: {
    position: 'absolute',
    top: -70,
    right: -85,
    width: 350,
    height: 350,
    borderRadius: 175,
  },
  ambientOrbUpperLeft: {
    position: 'absolute',
    top: 150,
    left: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  ambientOrbCenterRight: {
    position: 'absolute',
    top: '44%',
    right: -95,
    width: 350,
    height: 350,
    borderRadius: 175,
  },
  ambientOrbBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -75,
    width: 340,
    height: 340,
    borderRadius: 170,
  },

  fluidRootViewport: {
    flex: 1,
    width: '100%',
    zIndex: 1,
  },
  horizontalPagingScroll: {
    flex: 1,
  },
  phasePage: {
    height: '100%',
    flexGrow: 0,
    flexShrink: 0,
  },
  phasePageNoPad: {
    height: '100%',
    flexGrow: 0,
    flexShrink: 0,
  },
  fluidPageScroll: {
    flex: 1,
    width: '100%',
  },
  fluidPageScrollContent: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },

  // CABECERA DE PASOS EN FLUJO ESTILO TIDE (LÍNEA DELGADA, BOTONES PLANOS SIN GLOW)
  inFlowHeaderContainer: {
    width: '100%',
    marginBottom: 22,
  },
  stepProgressContainer: {
    flexDirection: 'row',
    height: 2,
    gap: 6,
    marginBottom: 18,
  },
  progressSegmentBase: {
    height: 2,
    borderRadius: 1,
  },
  progressSegmentActiveLarge: {
    flex: 2.8,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
  },
  progressSegmentCompleted: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
  },
  progressSegmentInactive: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 42,
  },
  headerBackCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSkipPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  headerSkipText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.88)',
    letterSpacing: 0.3,
  },

  // FLECHA CIRCULAR SIMPLE EN FLUJO (ALINEADA A LA DERECHA BOTTOM)
  inFlowArrowFooter: {
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: 36,
    paddingRight: 4,
  },
  inFlowNextArrowCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // PASO 1: BIENVENIDA FLUIDA CON BOTONES ORIGINALES (SIN GLOW)
  welcomeScrollContent: {
    paddingHorizontal: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 36,
  },
  welcomeTopBlock: {
    paddingTop: 24,
  },
  logoWrapper: {
    marginBottom: 36,
  },
  welcomeTitleBig: {
    fontFamily: Fonts.light,
    fontSize: 32,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.96)',
    lineHeight: 43,
    letterSpacing: -0.2,
    marginBottom: 18,
  },
  welcomeSubLarge: {
    fontFamily: Fonts.light,
    fontSize: 15.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 25,
    maxWidth: width * 0.9,
  },
  welcomeBottomInFlowBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  btnTidePrimaryPill: {
    width: '100%',
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTidePrimaryPillText: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    fontWeight: '400',
    color: '#2E2C29',
    letterSpacing: 0.2,
  },
  btnGhostPill: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  btnGhostText: {
    fontFamily: Fonts.light,
    color: 'rgba(255, 255, 255, 0.80)',
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.2,
  },

  // CABECERAS DE SECCIÓN FLUIDAS ESTILO TIDE (MARGEN AMPLIO ANTES DE LAS CARDS)
  headerTextBlock: {
    marginTop: 8,
    marginBottom: 36,
  },
  tideMainTitle: {
    fontFamily: Fonts.light,
    fontSize: 30,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.96)',
    lineHeight: 41,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  tideSubTitle: {
    fontFamily: Fonts.light,
    fontSize: 14.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.64)',
    lineHeight: 23,
  },

  // PASO 2: AUTENTICACIÓN GOOGLE Y SELECTOR SEGMENTADO (CERO BOLD, ESTILO TIDE)
  googleAuthBtnPill: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  googleBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleAuthBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    fontWeight: '400',
    color: '#2C2A28',
    letterSpacing: 0.15,
  },
  authDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    marginTop: 2,
  },
  authDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  authDividerText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.50)',
    letterSpacing: 0.2,
  },
  googleQuickPillCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  googleQuickLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  googleSmallIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleQuickInfo: {
    flex: 1,
    gap: 1,
  },
  googleQuickUserText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  googleQuickEmailText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
  },
  googleQuickRightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  googleQuickActionLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    fontWeight: '400',
    color: '#2C2A28',
    letterSpacing: 0.1,
  },
  authModeSegmentRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  authModeSegmentTab: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authModeSegmentTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  authModeSegmentText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.2,
  },
  authModeSegmentTextActive: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#2C2A28',
  },
  authErrorPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  legalDisclaimerText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.54)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  profileCardSheenBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    padding: 20,
    gap: 16,
    overflow: 'hidden',
  },
  profileFieldWrap: {
    gap: 8,
  },
  profileFieldLabel: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  profileInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontFamily: Fonts.light,
    fontSize: 14.5,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  experienceCardsCol: {
    gap: 8,
  },
  experienceOptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  experienceOptionCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderColor: 'rgba(255, 255, 255, 0.70)',
  },
  expHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.82)',
  },
  expTitleSelected: {
    color: '#FFFFFF',
  },
  expRadioActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  expSub: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
    lineHeight: 17,
  },
  profileErrorText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: '#FCA5A5',
    lineHeight: 18,
  },
  profileSubmitPrimaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  profileSubmitPrimaryBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    color: '#2C2A28',
    letterSpacing: 0.15,
  },

  // GRILLAS DE 2 COLUMNAS CON ESPACIADO Y DISTANCIAS TIDE (16PX GAP, 20PX RADIUS, GLOW EN CARDS)
  twoColRowsWrapper: {
    width: '100%',
    gap: 16,
  },
  twoColFlexRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
  },
  twoColBlobCell: {
    flex: 1,
    minWidth: 0,
  },
  gridGlassCard: {
    flex: 1,
    width: '100%',
    minHeight: 204,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  gridGlassCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
  },
  gridGlassCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  gridCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  cleanIconWrap: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tideSelectedIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.70)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  gridCardTextWrap: {
    gap: 6,
    minWidth: 0,
  },
  gridCardTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16.5,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.96)',
    letterSpacing: 0.1,
  },
  gridCardSub: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
    lineHeight: 19.5,
  },

  // PASO 4: UBICACIÓN Y VIVIENDA DINÁMICA (ESTILO TIDE)
  compactCardsStack: {
    gap: 18,
  },
  compactGlassCard: {
    borderRadius: 20,
    padding: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    overflow: 'hidden',
    gap: 12,
  },
  compactCardTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  gpsAutoStatusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  gpsDetectingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  gpsDetectingText: {
    fontFamily: Fonts.light,
    color: 'rgba(255, 255, 255, 0.90)',
    fontSize: 13.5,
    fontWeight: '300',
  },
  gpsVerifiedText: {
    fontFamily: Fonts.light,
    color: 'rgba(255, 255, 255, 0.90)',
    fontSize: 13.5,
    fontWeight: '300',
  },
  compactBadgeScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    paddingRight: 6,
  },
  gpsActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 18,
  },
  whitePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  gpsActiveText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  waterPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 18,
  },
  waterPillBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  changeCityPillText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  propertyConfigBlock: {
    marginTop: 6,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.14)',
    gap: 16,
  },
  propertyTypeChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  propertyTypeChip: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  propertyTypeChipSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  propertyTypeChipText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.88)',
    textAlign: 'center',
  },
  propertyTypeChipTextSelected: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#2C2A28',
  },
  propertyFloorBarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  propertyFloorLabel: {
    flexShrink: 1,
    minWidth: 150,
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.76)',
  },
  inlineFloorStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inlineFloorStepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineFloorInputWrap: {
    minWidth: 48,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  inlineFloorInput: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    color: '#2C2A28',
    textAlign: 'center',
    minWidth: 28,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  vpdActiveBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  vpdActiveText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.90)',
  },

  // PASO 6: MASCOTAS (ESPACIADO Y TIPOGRAFÍA LIGHT TIDE)
  petGlassCard: {
    flex: 1,
    width: '100%',
    minHeight: 208,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  petCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  petCardTextWrap: {
    gap: 5,
    minWidth: 0,
  },
  petCardTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.96)',
  },
  petCardBehavior: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.78)',
    lineHeight: 18,
  },
  petCardHazard: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.54)',
    lineHeight: 18,
    marginTop: 2,
  },
  safetyStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    marginTop: 20,
    overflow: 'hidden',
  },
  safetyStatusText: {
    flex: 1,
    minWidth: 0,
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.82)',
    lineHeight: 21,
  },

  // PASO 7: IDENTIDAD BOTÁNICA
  avatarGlassOuterHalo: {
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.34)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    overflow: 'hidden',
  },
  avatarInnerImageFrame: {
    width: 158,
    height: 158,
    borderRadius: 79,
    overflow: 'hidden',
  },
  avatarPhoto: {
    width: '100%',
    height: '100%',
  },
  avatarAliasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    marginTop: 24,
    overflow: 'hidden',
  },
  avatarAliasBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.90)',
  },
  avatarAliasTitle: {
    fontFamily: Fonts.light,
    fontSize: 28,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.96)',
    marginTop: 16,
    textAlign: 'center',
  },
  avatarScientificSubtitle: {
    fontFamily: Fonts.lightItalic,
    fontSize: 14.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.64)',
    marginTop: 6,
    textAlign: 'center',
  },
  avatarTraitGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    padding: 24,
    width: '100%',
    marginTop: 26,
    gap: 8,
    overflow: 'hidden',
  },
  avatarTraitText: {
    fontFamily: Fonts.lightItalic,
    fontSize: 15,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    lineHeight: 24,
  },
  avatarNoteText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.64)',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 21,
  },

  // MODAL DE CIUDAD (ESTÉTICA TIDE PIEDRA AHUMADA)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#363431',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  modalHandle: {
    width: 40,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontFamily: Fonts.light,
    fontSize: 21,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.96)',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.64)',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalSearchInput: {
    fontFamily: Fonts.light,
    fontWeight: '300',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
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
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    marginRight: 12,
  },
  modalCityItemText: {
    flex: 1,
    fontFamily: Fonts.light,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '300',
  },
  modalCityArrow: {
    fontFamily: Fonts.light,
    fontSize: 18,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.45)',
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  quickTestModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.35)',
  },
  quickTestModeText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: '#86EFAC',
    letterSpacing: 0.2,
  },
});
