import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  Keyboard,
  ActivityIndicator,
  Animated,
  Easing,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingState, CustomMicroclimate } from '../../types/onboarding';
import { UserPlant } from '../../types/plant';
import { Fonts } from '../../constants/theme';
import { TreegohIcon } from '../../components/TreegohIcon';
import { BioLuminescentParticles, ParticleState } from '../../components/BioLuminescentParticles';
import { KowalskiPressable } from '../../components/KowalskiPressable';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { RandomFadeText } from '../../components/RandomFadeText';
import { CreateSpaceStudioModal } from '../../components/CreateSpaceStudioModal';
import * as ImagePicker from 'expo-image-picker';
import { GlassCardSheen } from '../../components/BlobAnimatedCard';
import { CircadianBackground } from '../../components/CircadianBackground';
import { BotanicalImage } from '../../components/BotanicalImage';
import { AddPlantModal, EXPANDED_CURATED_SPECIES } from '../../components/AddPlantModal';
import { BOTANICAL_DATABASE, ComprehensiveSpecies } from '../../constants/botanicalDatabase';
import { SpeciesEncyclopediaDetailModal } from '../../components/SpeciesEncyclopediaDetailModal';
import { SpaceDestinationPickerModal, PlantToPlaceTarget } from '../../components/SpaceDestinationPickerModal';

import { searchBotanicalWithTypesense, searchBotanicalSync } from '../../services/typesenseService';
import { syncWateringAlarmWithSanctuary } from '../../services/iosNotificationAlarmService';
import { BotanicalAssistantModal } from '../../components/BotanicalAssistantModal';
import {
  AssistantSanctuaryContext,
  queryBotanicalAssistant,
  AssistantMessage,
  AssistantAction,
} from '../../services/botanicalAssistantService';
import { BotanicalMessageView } from '../../components/BotanicalMessageView';
import { AssistantLoadingPulse } from '../../components/AssistantLoadingPulse';
import { speakWithElevenLabs, stopVoicePlayback } from '../../services/elevenLabsVoiceService';
import { PlantDetailModal } from '../../components/PlantDetailModal';
import {
  BotanicalCameraBubbleModal,
  CapturedBubbleFrame,
} from '../../components/BotanicalCameraBubbleModal';
import { getCircadianTheme, CircadianPhaseId } from '../../utils/circadianTheme';
import {
  identifyPlantWithOpenRouter,
  SpaceBotanicalContext,
} from '../../services/openRouterPlantIdentification';
import { UserProfileModal } from '../../components/UserProfileModal';
import { SoundscapePracticeModal, SOUND_SCENES, SoundScene } from '../../components/SoundscapePracticeModal';
import { savePlantToCloud, syncSanctuaryToCloud } from '../../services/firebaseAuthService';
import { FloatingBlobNavBar, NavTabItem } from '../../components/FloatingBlobNavBar';
import { fetchLiveWeather, WeatherData } from '../../services/weatherService';

const NAVIGATION_TABS: NavTabItem[] = [
  { id: 'inicio', icon: 'luz_natural' },
  { id: 'experto', icon: 'voz_botanica' },
  { id: 'espacios', icon: 'espacios_microclimas' },
  { id: 'enciclopedia', icon: 'biblia_plantas' },
];

interface SanctuaryHomeScreenProps {
  onboardingData: OnboardingState;
  onResetForTest?: () => void;
}

export const SanctuaryHomeScreen: React.FC<SanctuaryHomeScreenProps> = ({
  onboardingData,
  onResetForTest,
}) => {
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, Platform.OS === 'ios' ? 52 : StatusBar.currentHeight || 24);
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 32 : 18);

  const userName = useMemo(() => {
    const rawName = onboardingData?.account?.displayName?.trim();
    if (
      rawName &&
      rawName.toLowerCase() !== 'cultivador' &&
      rawName.toLowerCase() !== 'jardinero' &&
      rawName.toLowerCase() !== 'invitado'
    ) {
      return rawName.split(/\s+/)[0];
    }
    const emailPrefix = onboardingData?.account?.email?.split('@')[0]?.split(/[._-]/)[0]?.trim();
    if (emailPrefix && emailPrefix.toLowerCase() !== 'cultivador' && emailPrefix.length >= 2) {
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return 'Ruy';
  }, [onboardingData?.account?.displayName, onboardingData?.account?.email]);

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedSpaceIndex, setSelectedSpaceIndex] = useState<number>(0);
  const [isAddPlantModalOpen, setIsAddPlantModalOpen] = useState<boolean>(false);
  const [isBubbleCameraOpen, setIsBubbleCameraOpen] = useState<boolean>(false);
  const [bubbleCameraMode, setBubbleCameraMode] = useState<'add_plant' | 'assistant'>('add_plant');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [selectedPlantForDetail, setSelectedPlantForDetail] = useState<UserPlant | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isSoundscapeModalOpen, setIsSoundscapeModalOpen] = useState<boolean>(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState<boolean>(false);
  const [circadianPreviewPhase, setCircadianPreviewPhase] = useState<CircadianPhaseId | null>(null);
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(
    onboardingData?.account?.photoURL || null
  );

  useEffect(() => {
    setUserPhotoUrl(onboardingData?.account?.photoURL || null);
  }, [onboardingData?.account?.photoURL]);

  // Estados para el selector inteligente de destino al añadir o reubicar plantas en espacios
  const [plantForSpacePlacement, setPlantForSpacePlacement] = useState<PlantToPlaceTarget | null>(null);
  const [isSpacePickerOpen, setIsSpacePickerOpen] = useState<boolean>(false);
  const [pickerActionTitle, setPickerActionTitle] = useState<string>('Ubicar en este espacio');
  const [relocatingPlantId, setRelocatingPlantId] = useState<string | null>(null);

  // Tema circadiano reactivo a la hora del día o al selector de previsualización
  const theme = useMemo(
    () => getCircadianTheme(circadianPreviewPhase || undefined, currentTime, onboardingData?.location),
    [circadianPreviewPhase, currentTime, onboardingData?.location]
  );

  // Modal para añadir un nuevo espacio dinámico con estudio deslizante
  const [isAddSpaceModalOpen, setIsAddSpaceModalOpen] = useState<boolean>(false);

  // Clima en vivo obtenido de la ubicación del santuario o coordenadas nativas
  const [liveWeather, setLiveWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchLiveWeather(onboardingData?.location?.city || onboardingData?.location).then(data => {
      if (isMounted) setLiveWeather(data);
    });
    return () => {
      isMounted = false;
    };
  }, [onboardingData?.location]);

  // Animación viva de radar ping para el dot de atención prioritaria
  const alertDotPulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(alertDotPulseAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(alertDotPulseAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [alertDotPulseAnim]);

  // Filtros interactivos para el centro de alertas y la galería de plantas
  const [alertFilter, setAlertFilter] = useState<string>('Todas');
  const [plantListFilter, setPlantListFilter] = useState<string>('Todas');
  const [activeTideDot, setActiveTideDot] = useState<number>(0);

  // Estados de navegación flotante con carrusel horizontal tipo slide y efecto blob
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [activeNavTab, setActiveNavTab] = useState<number>(0);
  const activeNavTabRef = useRef<number>(0);
  const prevNavTabForDarkRef = useRef<number>(0);
  const [visitedTabs, setVisitedTabs] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
  });
  const [bibliaDisplayLimit, setBibliaDisplayLimit] = useState<number>(20);
  const horizontalNavScrollRef = useRef<any>(null);
  const navScrollX = useRef(new Animated.Value(0)).current;
  const isNavProgrammaticRef = useRef<boolean>(false);

  // Estados para la página dedicada del Asistente Botánico con Partículas (Tab 1)
  const [assistantParticleState, setAssistantParticleState] = useState<ParticleState>('reposo');
  const [isSpeakingWithElevenLabs, setIsSpeakingWithElevenLabs] = useState<boolean>(false);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);
  const [isListeningToUserVoice, setIsListeningToUserVoice] = useState<boolean>(false);
  const [typingPulseCount, setTypingPulseCount] = useState<number>(0);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [assistantDockHeight, setAssistantDockHeight] = useState<number>(90);
  const voiceListenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceQueryCycleRef = useRef<number>(0);
  const [assistantSpokenText, setAssistantSpokenText] = useState<string>(
    `Hola ${userName}. Siento el equilibrio de tu santuario. Puedes consultarme por voz con ElevenLabs, escribir cualquier duda o capturar una foto de tus hojas para diagnosticarlas con el visor óptico.`
  );
  const [assistantUserQuery, setAssistantUserQuery] = useState<string>('');
  const assistantUserQueryRef = useRef<string>('');
  const [isAssistantThinking, setIsAssistantThinking] = useState<boolean>(false);
  const [isTypingMode, setIsTypingMode] = useState<boolean>(false);
  const assistantSectionDarkAnim = useRef(new Animated.Value(0.80)).current;
  const lastSendTimestampRef = useRef<number>(0);
  const typingBlurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatScrollRef = useRef<ScrollView>(null);
  const middleInputRef = useRef<TextInput>(null);
  const cameraTargetSpaceNameRef = useRef<string | null>(null);

  // Altura real del teclado para anclar el Type Zone justo encima (sin cortes ni saltos)
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, e => {
      if (keyboardHideTimerRef.current) {
        clearTimeout(keyboardHideTimerRef.current);
        keyboardHideTimerRef.current = null;
      }
      setKeyboardHeight(e?.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => {
      // Pequeño margen para que al pulsar el botón Enviar no salte la barra antes de registrar el toque
      if (keyboardHideTimerRef.current) {
        clearTimeout(keyboardHideTimerRef.current);
      }
      keyboardHideTimerRef.current = setTimeout(() => {
        setKeyboardHeight(0);
      }, 140);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
      if (keyboardHideTimerRef.current) {
        clearTimeout(keyboardHideTimerRef.current);
      }
    };
  }, []);

  // Historial conversacional interactivo (inicialmente vacío para mostrar la vista central heroica)
  const [chatMessages, setChatMessages] = useState<AssistantMessage[]>([]);

  // Menú anidado en el símbolo "+" dentro de la barra de entrada con giro sutil al pulsarlo
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState<boolean>(false);
  const [renderedAttachMenu, setRenderedAttachMenu] = useState<boolean>(false);
  const attachPlusAnim = useRef(new Animated.Value(0)).current;

  const handleToggleAttachMenu = () => {
    triggerHaptic();
    if (isAttachMenuOpen) {
      setIsAttachMenuOpen(false);
      Animated.timing(attachPlusAnim, {
        toValue: 0,
        duration: 240,
        easing: Easing.bezier(0.32, 0, 0.67, 0),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setRenderedAttachMenu(false);
      });
    } else {
      setRenderedAttachMenu(true);
      setIsAttachMenuOpen(true);
      Animated.timing(attachPlusAnim, {
        toValue: 1,
        duration: 340,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }).start();
    }
  };

  const handleCloseAttachMenu = (callback?: () => void) => {
    if (!isAttachMenuOpen && !renderedAttachMenu) {
      callback?.();
      return;
    }
    setIsAttachMenuOpen(false);
    Animated.timing(attachPlusAnim, {
      toValue: 0,
      duration: 210,
      easing: Easing.bezier(0.32, 0, 0.67, 0),
      useNativeDriver: true,
    }).start(() => {
      setRenderedAttachMenu(false);
      callback?.();
    });
  };

  useEffect(() => {
    if ((chatMessages?.length || 0) > 1) {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [chatMessages?.length, isAssistantThinking]);
  const [chatAttachedImage, setChatAttachedImage] = useState<{
    uri: string;
    base64?: string;
  } | null>(null);
  const [renderedChatImage, setRenderedChatImage] = useState<{
    uri: string;
    base64?: string;
  } | null>(null);
  const chatImageAnim = useRef(new Animated.Value(0)).current;

  // Oscurecimiento progresivo: 0.80 en reposo en el Asistente y 0.94 profundo al interactuar con el Type Zone
  const isTypeZoneEngaged =
    isTypingMode ||
    (chatMessages?.length || 0) > 0 ||
    Boolean(chatAttachedImage) ||
    isAttachMenuOpen;

  useEffect(() => {
    const targetDarkness = isTypeZoneEngaged ? 0.94 : 0.80;
    const duration = isTypeZoneEngaged ? 950 : 1200;

    Animated.timing(assistantSectionDarkAnim, {
      toValue: targetDarkness,
      duration,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [isTypeZoneEngaged, assistantSectionDarkAnim]);

  useEffect(() => {
    if (chatAttachedImage) {
      setRenderedChatImage(chatAttachedImage);
      Animated.timing(chatImageAnim, {
        toValue: 1,
        duration: 440,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }).start();
    } else if (renderedChatImage) {
      Animated.timing(chatImageAnim, {
        toValue: 0,
        duration: 260,
        easing: Easing.bezier(0.32, 0, 0.67, 0),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setRenderedChatImage(null);
        }
      });
    }
  }, [chatAttachedImage]);

  const handleRemoveChatImage = () => {
    triggerHaptic();
    Animated.timing(chatImageAnim, {
      toValue: 0,
      duration: 240,
      easing: Easing.bezier(0.32, 0, 0.67, 0),
      useNativeDriver: true,
    }).start(() => {
      setRenderedChatImage(null);
      setChatAttachedImage(null);
    });
  };

  const handlePickChatPhoto = async () => {
    try {
      triggerHaptic();
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        setChatAttachedImage({
          uri: res.assets[0].uri,
          base64: res.assets[0].base64,
        });
      }
    } catch (_e) {}
  };

  const handleOpenAssistantBubbleCamera = () => {
    triggerHaptic();
    setBubbleCameraMode('assistant');
    setIsBubbleCameraOpen(true);
  };

  // Estados para búsqueda y filtrado de la Biblia Botánica (Tab 4)
  const [bibliaSearchQuery, setBibliaSearchQuery] = useState<string>('');
  const [bibliaActiveCategory, setBibliaActiveCategory] = useState<string>('todas');
  const [selectedSpeciesForMonograph, setSelectedSpeciesForMonograph] = useState<ComprehensiveSpecies | null>(null);

  // Estados para la práctica Zen y Soundscapes (Tab 5)
  const [activeZenScene, setActiveZenScene] = useState<SoundScene>(SOUND_SCENES[0]);
  const [zenDuration, setZenDuration] = useState<number>(2);
  const [isZenActive, setIsZenActive] = useState<boolean>(false);
  const [zenBreathPhase, setZenBreathPhase] = useState<'Inhala' | 'Retén' | 'Exhala' | 'Pausa'>('Inhala');
  const zenPulseAnim = useRef(new Animated.Value(1)).current;

  // Ciclo rítmico orgánico de respiración para la pestaña Zen (Box Breathing Botánico)
  useEffect(() => {
    if (!isZenActive) {
      zenPulseAnim.setValue(1);
      return;
    }

    let isMounted = true;
    const runCycle = () => {
      if (!isMounted) return;
      setZenBreathPhase('Inhala');
      Animated.timing(zenPulseAnim, {
        toValue: 1.35,
        duration: 4000,
        useNativeDriver: true,
      }).start(() => {
        if (!isMounted) return;
        setZenBreathPhase('Retén');
        setTimeout(() => {
          if (!isMounted) return;
          setZenBreathPhase('Exhala');
          Animated.timing(zenPulseAnim, {
            toValue: 0.95,
            duration: 4000,
            useNativeDriver: true,
          }).start(() => {
            if (!isMounted) return;
            setZenBreathPhase('Pausa');
            setTimeout(() => {
              if (isMounted) runCycle();
            }, 3000);
          });
        }, 4000);
      });
    };

    runCycle();

    return () => {
      isMounted = false;
    };
  }, [isZenActive]);

  const handleNavTabPress = (index: number) => {
    if (index < 0 || index >= NAVIGATION_TABS.length) return;
    isNavProgrammaticRef.current = true;
    activeNavTabRef.current = index;
    setActiveNavTab(index);
    setVisitedTabs(prev => (prev[index] ? prev : { ...prev, [index]: true }));

    // Sincronización inmediata de navScrollX en el hilo nativo de UI para interpolaciones reactivas
    Animated.spring(navScrollX, {
      toValue: index * windowWidth,
      damping: 24,
      stiffness: 220,
      mass: 0.8,
      useNativeDriver: true,
    }).start();

    // Scroll físico seguro para todas las variantes de ref en Animated.ScrollView
    const scrollTarget = horizontalNavScrollRef?.current;
    if (scrollTarget) {
      if (typeof scrollTarget.scrollTo === 'function') {
        scrollTarget.scrollTo({ x: index * windowWidth, animated: true });
      } else if (scrollTarget._component && typeof scrollTarget._component.scrollTo === 'function') {
        scrollTarget._component.scrollTo({ x: index * windowWidth, animated: true });
      } else if (typeof scrollTarget.getNode === 'function') {
        scrollTarget.getNode()?.scrollTo?.({ x: index * windowWidth, animated: true });
      }
    }

    setTimeout(() => {
      isNavProgrammaticRef.current = false;
    }, 450);
  };

  // Movimiento horizontal en el hilo nativo con detección única por cambio de página (protegido por activeNavTabRef)
  const handleNavScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { x: navScrollX } } }],
        {
          useNativeDriver: true,
          listener: (e: any) => {
            if (windowWidth <= 0) return;
            const offsetX = e?.nativeEvent?.contentOffset?.x ?? 0;
            const nearestIdx = Math.min(
              NAVIGATION_TABS.length - 1,
              Math.max(0, Math.round(offsetX / windowWidth))
            );
            const distFromPageCenter = Math.abs(offsetX - nearestIdx * windowWidth);
            if (distFromPageCenter < windowWidth * 0.25 && nearestIdx !== activeNavTabRef.current) {
              activeNavTabRef.current = nearestIdx;
              setActiveNavTab(nearestIdx);
              setVisitedTabs(prev => (prev[nearestIdx] ? prev : { ...prev, [nearestIdx]: true }));
            }
          },
        }
      ),
    [navScrollX, windowWidth]
  );

  const handleNavMomentumEnd = (e: any) => {
    isNavProgrammaticRef.current = false;
    if (windowWidth <= 0) return;
    const settledIdx = Math.min(
      NAVIGATION_TABS.length - 1,
      Math.max(0, Math.round(e.nativeEvent.contentOffset.x / windowWidth))
    );
    if (settledIdx !== activeNavTabRef.current) {
      activeNavTabRef.current = settledIdx;
      setActiveNavTab(settledIdx);
      setVisitedTabs(prev => (prev[settledIdx] ? prev : { ...prev, [settledIdx]: true }));
      try {
        Haptics.selectionAsync();
      } catch (_e) {}
    }
  };

  // Transición suave entre pantallas con escala 0.96, fade milimétrico y paralaje nativo (Emil Kowalski)
  const getPageAnimatedStyle = (pageIndex: number) => {
    if (windowWidth <= 0) return { width: windowWidth, flex: 1 };
    const pageCenter = pageIndex * windowWidth;
    const prevPage = (pageIndex - 1) * windowWidth;
    const nextPage = (pageIndex + 1) * windowWidth;

    const scale = navScrollX.interpolate({
      inputRange: [prevPage, pageCenter, nextPage],
      outputRange: [0.96, 1.0, 0.96],
      extrapolate: 'clamp',
    });

    const opacity = navScrollX.interpolate({
      inputRange: [
        prevPage,
        prevPage + windowWidth * 0.35,
        pageCenter,
        nextPage - windowWidth * 0.35,
        nextPage,
      ],
      outputRange: [0, 0.70, 1.0, 0.70, 0],
      extrapolate: 'clamp',
    });

    const translateX = navScrollX.interpolate({
      inputRange: [prevPage, pageCenter, nextPage],
      outputRange: [windowWidth * 0.10, 0, -windowWidth * 0.10],
      extrapolate: 'clamp',
    });

    return {
      width: windowWidth,
      flex: 1,
      transform: [{ translateX }, { scale }],
      opacity,
    };
  };

  // Progresión continua del oscurecimiento botánico:
  // - Responde en tiempo real al deslizamiento horizontal del carrusel hacia el Asistente (página 1)
  // - En reposo en la página 1 alcanza el 80% sin ocultar la escena circadiana
  // - Al interactuar o escribir en el Type Zone se profundiza con suavidad hasta el 94%
  const scrollDarkProgress = navScrollX.interpolate({
    inputRange: [-1, 0, windowWidth, windowWidth * 2, windowWidth * 3],
    outputRange: [0, 0, 1, 0, 0],
    extrapolate: 'clamp',
  });

  const assistantDarkOverlayOpacity = Animated.multiply(
    scrollDarkProgress,
    assistantSectionDarkAnim
  );

  // Actualización automática del tiempo cada 60 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Espacios base del onboarding + espacios dinámicos adicionales
  const initialSpaces: CustomMicroclimate[] = useMemo(() => {
    // 1. Sanitizar customMicroclimates si existen
    const rawList = onboardingData?.customMicroclimates;
    if (Array.isArray(rawList) && rawList.length > 0) {
      const parsedList: CustomMicroclimate[] = rawList
        .map(item => {
          if (!item) return null;
          if (typeof item === 'string') {
            try {
              return JSON.parse(item);
            } catch {
              return null;
            }
          }
          return typeof item === 'object' ? item : null;
        })
        .filter((item): item is CustomMicroclimate => Boolean(item && typeof item === 'object' && item.name));

      if (parsedList.length > 0) {
        return parsedList;
      }
    }

    // 2. Sanitizar spaces si existen
    const rawSpaces = onboardingData?.spaces;
    const validSpaces =
      Array.isArray(rawSpaces) && rawSpaces.length > 0
        ? rawSpaces.filter(s => typeof s === 'string' && s.trim().length > 0)
        : [];

    const defaultSpaces = validSpaces.length > 0 ? validSpaces : ['Salón'];

    return defaultSpaces.map(spName => ({
      id: spName.toLowerCase().replace(/\s+/g, '_'),
      name: spName,
      roomType: 'Salón',
      orientation: 'S' as any,
      headingDegrees: 180,
      windowDistance: 'media_distancia' as const,
      estimatedLux: 3200,
      thermalRisks: { nearRadiator: false, nearAC: false, drafts: false },
      humidityLevel: 'media' as const,
      habitabilityScore: 92,
      verdict: 'Excelente iluminación natural filtrada.',
      recommendedSpecies: ['Monstera deliciosa', 'Ficus lyrata'],
      preventiveTips: ['Girar 90° cada 15 días'],
    }));
  }, [onboardingData]);

  const fallbackSpace: CustomMicroclimate = useMemo(
    () => ({
      id: 'salon_principal',
      name: 'Salón Principal',
      roomType: 'Salón',
      orientation: 'Sur' as any,
      headingDegrees: 180,
      windowDistance: 'media_distancia' as const,
      estimatedLux: 3200,
      thermalRisks: { nearRadiator: false, nearAC: false, drafts: false },
      humidityLevel: 'media' as const,
      habitabilityScore: 92,
      verdict: 'Excelente iluminación natural filtrada.',
      recommendedSpecies: ['Monstera deliciosa', 'Ficus lyrata'],
      preventiveTips: ['Girar 90° cada 15 días'],
    }),
    []
  );

  const [customSpacesList, setCustomSpacesList] = useState<CustomMicroclimate[]>(() =>
    initialSpaces.length > 0 ? initialSpaces : [fallbackSpace]
  );

  useEffect(() => {
    if (initialSpaces.length > 0) {
      setCustomSpacesList(initialSpaces);
    }
  }, [initialSpaces]);

  const activeSpace: CustomMicroclimate =
    (customSpacesList && customSpacesList[selectedSpaceIndex]) ||
    (customSpacesList && customSpacesList[0]) ||
    fallbackSpace;

  // Plantas organizadas por espacio: Colección inicial realista de 12 plantas con estados y tareas
  const initialMainSpaceName = initialSpaces[0]?.name || 'Salón';
  const [plantsBySpace, setPlantsBySpace] = useState<Record<string, UserPlant[]>>({
    [initialMainSpaceName]: [
      {
        id: 'plant_monstera_1',
        spaceName: initialMainSpaceName,
        commonName: onboardingData?.assignedAvatar?.species || 'Costilla de Adán',
        scientificName: onboardingData?.assignedAvatar?.scientificName || 'Monstera deliciosa',
        family: 'Araceae',
        nickname: onboardingData?.assignedAvatar?.alias || 'Monstera del Rincón',
        imageUrl:
          onboardingData?.assignedAvatar?.imageUrl ||
          'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80',
        wateringStatus: 'necesita_riego',
        daysUntilNextWatering: 0,
        lightCompatibility: 'optima',
        lightCompatibilityNote: 'Iluminación indirecta óptima para maximizar fenestraciones.',
        isPetSafe: !onboardingData?.safetyFilter?.hasPets,
        toxicityNote: onboardingData?.safetyFilter?.hasPets
          ? 'Contiene oxalatos; mantener en maceta elevada si hay mascotas.'
          : 'Especie insignia de tu santuario.',
        addedAt: new Date().toISOString(),
        trait: onboardingData?.assignedAvatar?.trait || 'Planta avatar vinculada a tu perfil.',
        healthAssessment: 'Sustrato al 18% de humedad. Requiere riego hoy.',
      },
      {
        id: 'plant_ficus_lyrata_2',
        spaceName: initialMainSpaceName,
        commonName: 'Ficus Lyrata',
        scientificName: 'Ficus lyrata',
        family: 'Moraceae',
        nickname: 'Ficus Violín',
        imageUrl:
          'https://images.unsplash.com/photo-1598880940371-c756e015fea1?auto=format&fit=crop&w=600&q=80',
        wateringStatus: 'optimo',
        daysUntilNextWatering: 4,
        lightCompatibility: 'optima',
        isPetSafe: false,
        needsPruning: true,
        pruningNote: 'Hojas basales secas. Podar para airear la base del tronco.',
        addedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        healthAssessment: 'Follaje superior vigoroso, hojas inferiores senescentes.',
      },
      {
        id: 'plant_pothos_3',
        spaceName: initialMainSpaceName,
        commonName: 'Pothos Dorado',
        scientificName: 'Epipremnum aureum',
        family: 'Araceae',
        nickname: 'Pothos Cascada',
        imageUrl:
          'https://images.unsplash.com/photo-1596724817752-d96f9c9ebdc4?auto=format&fit=crop&w=600&q=80',
        wateringStatus: 'hidratada',
        daysUntilNextWatering: 6,
        lightCompatibility: 'optima',
        isPetSafe: false,
        addedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        healthAssessment: 'Guías colgantes con brotación activa.',
      },
      {
        id: 'plant_calathea_4',
        spaceName: initialMainSpaceName,
        commonName: 'Calathea Orbifolia',
        scientificName: 'Calathea orbifolia',
        family: 'Marantaceae',
        nickname: 'Calathea de Seda',
        imageUrl:
          'https://images.unsplash.com/photo-1599598425947-5202613d9be5?auto=format&fit=crop&w=600&q=80',
        wateringStatus: 'necesita_riego',
        daysUntilNextWatering: 1,
        lightCompatibility: 'optima',
        isPetSafe: true,
        addedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        healthAssessment: 'Puntas ligeramente rizadas por caída de humedad en sustrato.',
      },
      {
        id: 'plant_sansevieria_5',
        spaceName: initialMainSpaceName,
        commonName: 'Sansevieria Laurentii',
        scientificName: 'Sansevieria trifasciata',
        family: 'Asparagaceae',
        nickname: 'Espada Guardiana',
        imageUrl:
          'https://images.unsplash.com/photo-1620127682229-33388276e540?auto=format&fit=crop&w=600&q=80',
        wateringStatus: 'optimo',
        daysUntilNextWatering: 11,
        lightCompatibility: 'optima',
        isPetSafe: false,
        needsRepotting: true,
        repottingNote: 'Cepellón comprimido contra la maceta. Trasladar a tiesto +3cm.',
        addedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
        healthAssessment: 'Hojas erectas de gran turgencia, saturación de rizomas.',
      },
      {
        id: 'plant_helecho_6',
        spaceName: initialMainSpaceName,
        commonName: 'Helecho de Boston',
        scientificName: 'Nephrolepis exaltata',
        family: 'Lomariopsidaceae',
        nickname: 'Helecho Esmeralda',
        imageUrl:
          'https://images.unsplash.com/photo-1588691891530-0158223fc5d9?auto=format&fit=crop&w=600&q=80',
        wateringStatus: 'necesita_riego',
        daysUntilNextWatering: 0,
        lightCompatibility: 'buena',
        isPetSafe: true,
        emergencyAlert: {
          type: 'deshidratacion',
          message: 'Humedad relativa < 40% en Salón; frondas externas deshidratándose.',
          severity: 'alta',
        },
        addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        healthAssessment: 'Alerta por aire seco. Pulverizar de inmediato.',
      },
      {
        id: 'plant_pachira_7',
        spaceName: initialMainSpaceName,
        commonName: 'Pachira Acuática',
        scientificName: 'Pachira aquatica',
        family: 'Malvaceae',
        nickname: 'Árbol del Dinero',
        imageUrl:
          'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=600&q=80',
        wateringStatus: 'hidratada',
        daysUntilNextWatering: 5,
        lightCompatibility: 'optima',
        isPetSafe: true,
        addedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        healthAssessment: 'Tronco trenzado firme y ápices de 5 folíolos simétricos.',
      },
      {
        id: 'plant_zz_8',
        spaceName: initialMainSpaceName,
        commonName: 'Zamioculcas',
        scientificName: 'Zamioculcas zamiifolia',
        family: 'Araceae',
        nickname: 'Planta ZZ',
        imageUrl:
          'https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=600&q=80',
        wateringStatus: 'optimo',
        daysUntilNextWatering: 9,
        lightCompatibility: 'optima',
        isPetSafe: false,
        addedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
        healthAssessment: 'Rizomas con reserva de agua óptima.',
      },
      {
        id: 'plant_ficus_elastica_9',
        spaceName: initialMainSpaceName,
        commonName: 'Ficus Elástica',
        scientificName: 'Ficus elastica',
        family: 'Moraceae',
        nickname: 'Ficus Borgoña',
        imageUrl:
          'https://images.unsplash.com/photo-1604762524889-3e2fccbc95f8?auto=format&fit=crop&w=600&q=80',
        wateringStatus: 'optimo',
        daysUntilNextWatering: 3,
        lightCompatibility: 'optima',
        isPetSafe: false,
        needsPruning: true,
        pruningNote: 'Despuntar yema apical para favorecer crecimiento horizontal.',
        addedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
        healthAssessment: 'Hojas gruesas con alto brillo ceroso natural.',
      },
      {
        id: 'plant_spathiphyllum_10',
        spaceName: initialMainSpaceName,
        commonName: 'Cuna de Moisés',
        scientificName: 'Spathiphyllum wallisii',
        family: 'Araceae',
        nickname: 'Espatifilo de Paz',
        imageUrl:
          'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?auto=format&fit=crop&w=600&q=80',
        wateringStatus: 'necesita_riego',
        daysUntilNextWatering: 0,
        lightCompatibility: 'optima',
        isPetSafe: false,
        addedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        healthAssessment: 'Hojas levemente decaídas por déficit hídrico transitorio.',
      },
      {
        id: 'plant_maranta_11',
        spaceName: initialMainSpaceName,
        commonName: 'Maranta Fascinator',
        scientificName: 'Maranta leuconeura',
        family: 'Marantaceae',
        nickname: 'Planta de la Oración',
        imageUrl:
          'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=600&q=80',
        wateringStatus: 'hidratada',
        daysUntilNextWatering: 4,
        lightCompatibility: 'optima',
        isPetSafe: true,
        addedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        healthAssessment: 'Nictinastia nocturna activa y nervaduras carmesí intactas.',
      },
      {
        id: 'plant_ceropegia_12',
        spaceName: initialMainSpaceName,
        commonName: 'Ceropegia Woodii',
        scientificName: 'Ceropegia woodii',
        family: 'Apocynaceae',
        nickname: 'Rosario de Corazones',
        imageUrl:
          'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=600&q=80',
        wateringStatus: 'optimo',
        daysUntilNextWatering: 7,
        lightCompatibility: 'optima',
        isPetSafe: true,
        addedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
        healthAssessment: 'Tallos filiformes de 60cm con hojas suculentas variegadas.',
      },
    ],
  });

  const currentSpacePlants = plantsBySpace[activeSpace?.name] || [];

  const triggerHaptic = (heavy = false) => {
    try {
      Haptics.impactAsync(
        heavy ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
    } catch (_e) {}
  };

  const handleAddPlant = (newPlant: UserPlant) => {
    triggerHaptic(true);
    setPlantsBySpace(prev => {
      const spaceKey = newPlant.spaceName || activeSpace?.name || 'Salón';
      const existing = prev[spaceKey] || [];
      return {
        ...prev,
        [spaceKey]: [newPlant, ...existing],
      };
    });
    // Sincronización en la nube con Google Cloud Firestore (/users/{userId}/plants/{plantId})
    if (onboardingData.account?.uid) {
      savePlantToCloud(onboardingData.account.uid, newPlant);
    }
  };

  // Disparador del selector visual de estancias con evaluación bioclimática
  const handleOpenSpacePickerForSpecies = (
    species: ComprehensiveSpecies | UserPlant | any,
    isRelocate = false
  ) => {
    triggerHaptic();
    const minL = Number(species.minLux) || 800;
    const maxL = Number(species.maxLux) || 3500;
    setPlantForSpacePlacement({
      id: species.id,
      commonName: species.commonName || 'Especie',
      scientificName: species.scientificName || 'Planta',
      family: species.family,
      imageUrl: species.imageUrl,
      minLux: minL,
      maxLux: maxL,
      isPetSafe: Boolean(species.isPetSafe),
      wateringIntervalDays: species.wateringIntervalDays || species.daysUntilNextWatering || 7,
      trait: species.trait,
    });
    setRelocatingPlantId(isRelocate && species.id ? species.id : null);
    setPickerActionTitle(isRelocate ? 'Reubicar en este espacio' : 'Ubicar en este espacio');
    setIsSpacePickerOpen(true);
  };

  // Confirmación de colocación / reubicación en la estancia elegida
  const handleConfirmPlaceInSpace = (targetSpace: CustomMicroclimate) => {
    triggerHaptic(true);
    if (!plantForSpacePlacement) {
      setIsSpacePickerOpen(false);
      return;
    }

    const minL = Number(plantForSpacePlacement.minLux) || 800;
    const maxL = Number(plantForSpacePlacement.maxLux) || 3500;
    const targetLux = targetSpace.estimatedLux || 3200;
    const isOptimalLight = targetLux >= minL && targetLux <= maxL * 1.3;

    // Caso A: Reubicación de una planta ya existente
    if (relocatingPlantId) {
      let movedPlantRef: UserPlant | null = null;
      setPlantsBySpace(prev => {
        let plantToMove: UserPlant | null = null;
        const updated: Record<string, UserPlant[]> = {};

        Object.entries(prev).forEach(([spName, list]) => {
          const remaining = (list || []).filter(p => {
            if (p.id === relocatingPlantId) {
              plantToMove = p;
              return false;
            }
            return true;
          });
          updated[spName] = remaining;
        });

        if (plantToMove) {
          movedPlantRef = {
            ...plantToMove,
            spaceName: targetSpace.name,
            lightCompatibility: isOptimalLight ? 'optima' : 'buena',
            lightCompatibilityNote: `Reubicada en ${targetSpace.name} (~${targetLux.toLocaleString()} lx).`,
          };
          const targetList = updated[targetSpace.name] || [];
          updated[targetSpace.name] = [movedPlantRef, ...targetList];
        }
        return updated;
      });

      if (movedPlantRef && onboardingData.account?.uid) {
        savePlantToCloud(onboardingData.account.uid, movedPlantRef);
      }
      setIsSpacePickerOpen(false);
      setPlantForSpacePlacement(null);
      setRelocatingPlantId(null);
      return;
    }

    // Caso B: Incorporación de nueva especie (Enciclopedia o Recomendadas)
    const newPlant: UserPlant = {
      id: `plant_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spaceName: targetSpace.name,
      commonName: plantForSpacePlacement.commonName,
      scientificName: plantForSpacePlacement.scientificName,
      family: plantForSpacePlacement.family,
      imageUrl: plantForSpacePlacement.imageUrl,
      wateringStatus: 'optimo',
      daysUntilNextWatering: plantForSpacePlacement.wateringIntervalDays || 7,
      lightCompatibility: isOptimalLight ? 'optima' : 'buena',
      lightCompatibilityNote: `La iluminación de ~${targetLux.toLocaleString()} Lux en ${targetSpace.name} coincide con su demanda (${minL.toLocaleString()}–${maxL.toLocaleString()} lx).`,
      isPetSafe: plantForSpacePlacement.isPetSafe,
      toxicityNote: plantForSpacePlacement.isPetSafe
        ? 'Especie certificada no tóxica según ASPCA.'
        : 'Precaución: contiene principios activos que pueden irritar a mascotas.',
      trait: plantForSpacePlacement.trait || 'Incorporada desde la Enciclopedia Botánica.',
      estimatedLuxDemand: (minL + maxL) / 2,
      addedAt: new Date().toISOString(),
    };

    handleAddPlant(newPlant);
    setIsSpacePickerOpen(false);
    setPlantForSpacePlacement(null);
    setRelocatingPlantId(null);

    const targetIdx = customSpacesList.findIndex(s => s.name === targetSpace.name);
    if (targetIdx >= 0) {
      setSelectedSpaceIndex(targetIdx);
    }
  };

  // Sincronización de alarmas de iOS con el estado hídrico de las plantas
  useEffect(() => {
    const allPlants = Object.values(plantsBySpace).flat();
    syncWateringAlarmWithSanctuary(allPlants);
  }, [plantsBySpace]);

  // Reconocimiento botánico REAL con OpenRouter multimodal desde la cámara en burbuja
  const handleCaptureFromBubble = async (frame: CapturedBubbleFrame) => {
    if (bubbleCameraMode === 'assistant') {
      setIsBubbleCameraOpen(false);
      setIsAiAnalyzing(false);
      triggerHaptic(true);
      setChatAttachedImage({
        uri: frame.uri,
        base64: frame.base64,
      });
      return;
    }

    setIsAiAnalyzing(true);

    const chosenSpaceName = cameraTargetSpaceNameRef.current || activeSpace?.name || 'Salón';
    const targetSpaceObj = (customSpacesList || []).find(s => s.name === chosenSpaceName) || activeSpace;
    cameraTargetSpaceNameRef.current = null;
    const safeSpaceName = targetSpaceObj?.name || 'Salón';

    const context: SpaceBotanicalContext = {
      spaceName: safeSpaceName,
      roomType: targetSpaceObj?.roomType || 'Salón',
      estimatedLux: targetSpaceObj?.estimatedLux || 3200,
      orientation: targetSpaceObj?.orientation || 'Sur',
      windowDistance: targetSpaceObj?.windowDistance || 'media_distancia',
      hasPets: Boolean(onboardingData?.safetyFilter?.hasPets),
      petTypes: onboardingData?.safetyFilter?.petTypes || [],
      captureHour: currentTime.getHours(),
    };

    const res = await identifyPlantWithOpenRouter(frame.base64, context, frame.mimeType);

    setIsAiAnalyzing(false);
    setIsBubbleCameraOpen(false);

    const data = res.ok ? res.data : res.fallbackData!;
    const newPlant: UserPlant = {
      id: `plant_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spaceName: safeSpaceName,
      commonName: data.commonName,
      scientificName: data.scientificName,
      family: data.family,
      imageUrl: frame.uri,
      wateringStatus: 'optimo',
      daysUntilNextWatering: data.recommendedWateringIntervalDays,
      lightCompatibility: data.lightCompatibility,
      lightCompatibilityNote: data.lightCompatibilityNote,
      isPetSafe: data.isPetSafe,
      toxicityNote: data.toxicityNote,
      trait: data.trait,
      healthAssessment: data.healthAssessment,
      confidenceScore: data.confidenceScore,
      addedAt: new Date().toISOString(),
    };

    handleAddPlant(newPlant);
    setSelectedPlantForDetail(newPlant);
  };

  // Reconocimiento botánico REAL con OpenRouter multimodal desde la galería
  const handlePickGalleryForAi = async (imageUri: string, base64: string) => {
    setIsAiAnalyzing(true);
    setIsBubbleCameraOpen(true);

    const chosenSpaceName = cameraTargetSpaceNameRef.current || activeSpace?.name || 'Salón';
    const targetSpaceObj = (customSpacesList || []).find(s => s.name === chosenSpaceName) || activeSpace;
    cameraTargetSpaceNameRef.current = null;
    const safeSpaceName = targetSpaceObj?.name || 'Salón';

    const context: SpaceBotanicalContext = {
      spaceName: safeSpaceName,
      roomType: targetSpaceObj?.roomType || 'Salón',
      estimatedLux: targetSpaceObj?.estimatedLux || 3200,
      orientation: targetSpaceObj?.orientation || 'Sur',
      windowDistance: targetSpaceObj?.windowDistance || 'media_distancia',
      hasPets: Boolean(onboardingData?.safetyFilter?.hasPets),
      petTypes: onboardingData?.safetyFilter?.petTypes || [],
      captureHour: currentTime.getHours(),
    };

    const res = await identifyPlantWithOpenRouter(base64, context, 'image/jpeg');

    setIsAiAnalyzing(false);
    setIsBubbleCameraOpen(false);

    const data = res.ok ? res.data : res.fallbackData!;
    const newPlant: UserPlant = {
      id: `plant_gallery_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spaceName: safeSpaceName,
      commonName: data.commonName,
      scientificName: data.scientificName,
      family: data.family,
      imageUrl: imageUri,
      wateringStatus: 'optimo',
      daysUntilNextWatering: data.recommendedWateringIntervalDays,
      lightCompatibility: data.lightCompatibility,
      lightCompatibilityNote: data.lightCompatibilityNote,
      isPetSafe: data.isPetSafe,
      toxicityNote: data.toxicityNote,
      trait: data.trait,
      healthAssessment: data.healthAssessment,
      confidenceScore: data.confidenceScore,
      addedAt: new Date().toISOString(),
    };

    handleAddPlant(newPlant);
    setSelectedPlantForDetail(newPlant);
  };

  const handleWaterPlant = (plantId: string) => {
    triggerHaptic(true);
    setPlantsBySpace(prev => {
      const spaceKey = activeSpace?.name || 'Salón';
      const currentList = prev[spaceKey] || [];
      const updated = currentList.map(p =>
        p.id === plantId
          ? {
              ...p,
              wateringStatus: 'hidratada' as const,
              daysUntilNextWatering: 7,
              lastWateredDate: new Date().toISOString(),
            }
          : p
      );
      return { ...prev, [spaceKey]: updated };
    });

    if (selectedPlantForDetail && selectedPlantForDetail.id === plantId) {
      setSelectedPlantForDetail(prev =>
        prev
          ? {
              ...prev,
              wateringStatus: 'hidratada',
              daysUntilNextWatering: 7,
              lastWateredDate: new Date().toISOString(),
            }
          : null
      );
    }
  };

  const handleDeletePlant = (plantId: string) => {
    let plantName = 'esta planta';
    Object.values(plantsBySpace).forEach(list => {
      const found = list.find(p => p.id === plantId);
      if (found) plantName = found.commonName;
    });

    Alert.alert(
      'Retirar Planta',
      `¿Deseas retirar «${plantName}» de tu santuario?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Retirar',
          style: 'destructive',
          onPress: () => {
            triggerHaptic(true);
            setPlantsBySpace(prev => {
              const updated: Record<string, UserPlant[]> = {};
              Object.keys(prev).forEach(spKey => {
                updated[spKey] = (prev[spKey] || []).filter(p => p.id !== plantId);
              });
              return updated;
            });
            setSelectedPlantForDetail(null);
          },
        },
      ]
    );
  };

  const handleDeleteSpace = (spaceIndex: number) => {
    if (customSpacesList.length <= 1) {
      Alert.alert(
        'Espacio Principal',
        'Tu santuario botánico debe conservar al menos un espacio en el hogar.'
      );
      return;
    }

    const spaceToDelete = customSpacesList[spaceIndex];
    if (!spaceToDelete) return;
    const spaceName = spaceToDelete.name;
    const plantsInSpace = plantsBySpace[spaceName] || [];

    Alert.alert(
      'Eliminar Espacio',
      plantsInSpace.length > 0
        ? `¿Eliminar «${spaceName}»? Sus ${plantsInSpace.length} ${
            plantsInSpace.length === 1 ? 'planta se reubicará' : 'plantas se reubicarán'
          } automáticamente en el espacio principal.`
        : `¿Eliminar «${spaceName}» de los espacios de tu hogar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            triggerHaptic(true);
            const updatedSpaces = customSpacesList.filter((_, idx) => idx !== spaceIndex);
            const targetSpaceName = updatedSpaces[0]?.name || 'Salón';

            if (plantsInSpace.length > 0) {
              setPlantsBySpace(prev => {
                const targetList = prev[targetSpaceName] || [];
                const reallocated = plantsInSpace.map(p => ({
                  ...p,
                  spaceName: targetSpaceName,
                }));
                const nextState = { ...prev };
                delete nextState[spaceName];
                nextState[targetSpaceName] = [...targetList, ...reallocated];
                return nextState;
              });
            } else {
              setPlantsBySpace(prev => {
                const nextState = { ...prev };
                delete nextState[spaceName];
                return nextState;
              });
            }

            setCustomSpacesList(updatedSpaces);
            setSelectedSpaceIndex(0);

            if (onboardingData.account?.uid) {
              syncSanctuaryToCloud(onboardingData.account.uid, {
                ...onboardingData,
                customMicroclimates: updatedSpaces,
              });
            }
          },
        },
      ]
    );
  };

  const handleSaveNewSpaceFromStudio = (newSpace: CustomMicroclimate) => {
    triggerHaptic();
    const updatedList = [...customSpacesList, newSpace];
    setCustomSpacesList(updatedList);
    setSelectedSpaceIndex(customSpacesList?.length || 0);
    setIsAddSpaceModalOpen(false);

    if (onboardingData.account?.uid) {
      syncSanctuaryToCloud(onboardingData.account.uid, {
        ...onboardingData,
        customMicroclimates: updatedList,
      });
    }
  };

  // Acciones rápidas de cuidado prioritario (Riego, Poda, Trasplante, Emergencias)
  const handleQuickWater = (plantId: string) => {
    triggerHaptic(true);
    setPlantsBySpace(prev => {
      const updated: Record<string, UserPlant[]> = {};
      Object.keys(prev).forEach(spKey => {
        updated[spKey] = (prev[spKey] || []).map(p =>
          p.id === plantId
            ? {
                ...p,
                wateringStatus: 'hidratada',
                daysUntilNextWatering: 7,
                lastWateredDate: new Date().toISOString(),
              }
            : p
        );
      });
      return updated;
    });
  };

  const handleQuickPrune = (plantId: string) => {
    triggerHaptic();
    setPlantsBySpace(prev => {
      const updated: Record<string, UserPlant[]> = {};
      Object.keys(prev).forEach(spKey => {
        updated[spKey] = (prev[spKey] || []).map(p =>
          p.id === plantId ? { ...p, needsPruning: false } : p
        );
      });
      return updated;
    });
  };

  const handleQuickRepot = (plantId: string) => {
    triggerHaptic();
    setPlantsBySpace(prev => {
      const updated: Record<string, UserPlant[]> = {};
      Object.keys(prev).forEach(spKey => {
        updated[spKey] = (prev[spKey] || []).map(p =>
          p.id === plantId ? { ...p, needsRepotting: false } : p
        );
      });
      return updated;
    });
  };

  const handleQuickResolveEmergency = (plantId: string) => {
    triggerHaptic();
    setPlantsBySpace(prev => {
      const updated: Record<string, UserPlant[]> = {};
      Object.keys(prev).forEach(spKey => {
        updated[spKey] = (prev[spKey] || []).map(p =>
          p.id === plantId ? { ...p, emergencyAlert: undefined } : p
        );
      });
      return updated;
    });
  };

  // Definición y cómputo reactivo de alertas de cuidado prioritario en todo el santuario
  interface SanctuaryCareAlert {
    id: string;
    plantId: string;
    plantName: string;
    plantNickname?: string;
    plantImageUrl?: string;
    spaceName: string;
    type: 'riego' | 'poda' | 'trasplante' | 'emergencia';
    severity: 'urgente' | 'aviso';
    title: string;
    description: string;
    actionText: string;
    onAction: () => void;
  }

  const activeAlerts: SanctuaryCareAlert[] = useMemo(() => {
    const alerts: SanctuaryCareAlert[] = [];
    const allPlants = Object.values(plantsBySpace).flat();

    allPlants.forEach(plant => {
      // 1. Emergencias ambientales / térmicas / fitosanitarias
      if (plant.emergencyAlert) {
        alerts.push({
          id: `alert_emergency_${plant.id}`,
          plantId: plant.id,
          plantName: plant.commonName,
          plantNickname: plant.nickname,
          plantImageUrl: plant.imageUrl,
          spaceName: plant.spaceName,
          type: 'emergencia',
          severity: 'urgente',
          title: `Emergencia: ${plant.commonName}`,
          description: plant.emergencyAlert.message,
          actionText: 'Cuidar',
          onAction: () => handleQuickResolveEmergency(plant.id),
        });
      }

      // 2. Riego urgente (hoy o retrasado)
      if (plant.wateringStatus === 'necesita_riego' || plant.daysUntilNextWatering <= 0) {
        alerts.push({
          id: `alert_water_${plant.id}`,
          plantId: plant.id,
          plantName: plant.commonName,
          plantNickname: plant.nickname,
          plantImageUrl: plant.imageUrl,
          spaceName: plant.spaceName,
          type: 'riego',
          severity: 'urgente',
          title: `Riego urgente: ${plant.nickname ? `«${plant.nickname}»` : plant.commonName}`,
          description: `Sustrato al límite en ${plant.spaceName}. Hidratación requerida según déficit de vapor.`,
          actionText: 'Regar',
          onAction: () => handleQuickWater(plant.id),
        });
      }

      // 3. Poda sanitaria
      if (plant.needsPruning) {
        alerts.push({
          id: `alert_prune_${plant.id}`,
          plantId: plant.id,
          plantName: plant.commonName,
          plantNickname: plant.nickname,
          plantImageUrl: plant.imageUrl,
          spaceName: plant.spaceName,
          type: 'poda',
          severity: 'aviso',
          title: `Poda sanitaria: ${plant.commonName}`,
          description: plant.pruningNote || 'Retirar hojas secas basales para redirigir nutrientes al nuevo crecimiento.',
          actionText: 'Podar',
          onAction: () => handleQuickPrune(plant.id),
        });
      }

      // 4. Trasplante de maceta
      if (plant.needsRepotting) {
        alerts.push({
          id: `alert_repot_${plant.id}`,
          plantId: plant.id,
          plantName: plant.commonName,
          plantNickname: plant.nickname,
          plantImageUrl: plant.imageUrl,
          spaceName: plant.spaceName,
          type: 'trasplante',
          severity: 'aviso',
          title: `Trasplante: ${plant.commonName}`,
          description: plant.repottingNote || 'Cepellón comprimido. Trasladar a maceta de mayor diámetro (+3cm).',
          actionText: 'Mover',
          onAction: () => handleQuickRepot(plant.id),
        });
      }
    });

    return alerts;
  }, [plantsBySpace, activeSpace]);

  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'Todas') return activeAlerts;
    if (alertFilter === 'Riego') return activeAlerts.filter(a => a.type === 'riego');
    if (alertFilter === 'Poda') return activeAlerts.filter(a => a.type === 'poda');
    if (alertFilter === 'Trasplante') return activeAlerts.filter(a => a.type === 'trasplante');
    if (alertFilter === 'Emergencias') return activeAlerts.filter(a => a.type === 'emergencia');
    return activeAlerts;
  }, [activeAlerts, alertFilter]);

  const filteredCurrentSpacePlants = useMemo(() => {
    const list = currentSpacePlants || [];
    if (plantListFilter === 'Todas') return list;
    if (plantListFilter === 'Sedientas') {
      return list.filter(p => p.wateringStatus === 'necesita_riego' || p.daysUntilNextWatering <= 1);
    }
    if (plantListFilter === 'Tareas') {
      return list.filter(p => p.needsPruning || p.needsRepotting || p.emergencyAlert);
    }
    if (plantListFilter === 'Pet Friendly') {
      return list.filter(p => p.isPetSafe);
    }
    return list;
  }, [currentSpacePlants, plantListFilter]);

  const assistantContext: AssistantSanctuaryContext = useMemo(() => {
    const allPlantsList: Array<{
      commonName: string;
      scientificName: string;
      nickname?: string;
      wateringStatus: string;
      daysUntilNextWatering: number;
      isPetSafe: boolean;
      spaceName: string;
    }> = [];

    Object.entries(plantsBySpace).forEach(([spName, pList]) => {
      (pList || []).forEach(p => {
        allPlantsList.push({
          commonName: p.commonName,
          scientificName: p.scientificName,
          nickname: p.nickname,
          wateringStatus: p.wateringStatus,
          daysUntilNextWatering: p.daysUntilNextWatering,
          isPetSafe: p.isPetSafe,
          spaceName: spName,
        });
      });
    });

    return {
      userName,
      city: onboardingData?.location?.city || 'Madrid',
      activeSpaceName: activeSpace?.name || 'Salón Principal',
      activeSpaceLux: activeSpace?.estimatedLux || 3200,
      activeSpaceOrientation: activeSpace?.orientation || 'Sur',
      activeSpaceWindowDistance:
        activeSpace?.windowDistance === 'junto_a_ventana'
          ? '< 1 m'
          : activeSpace?.windowDistance === 'media_distancia'
          ? '1–2.5 m'
          : '> 3 m',
      spacesCount: customSpacesList?.length || 0,
      plantsCount: allPlantsList.length,
      plantsSummary: allPlantsList,
      hasPets: Boolean(onboardingData?.safetyFilter?.hasPets),
      petTypes: onboardingData?.safetyFilter?.petTypes || [],
    };
  }, [userName, onboardingData, activeSpace, customSpacesList, plantsBySpace]);

  // ============================================================================
  // PÁGINA 0: SANTUARIO (HOME DASHBOARD PRINCIPAL - ESTILO TIDE 2026)
  // ============================================================================
  const renderSantuarioPage = () => {
    const todayDayIndex = new Date().getDay();
    const greetingText =
      theme.id === 'dawn' || theme.id === 'sunrise' || theme.id === 'morning'
        ? 'Buen Día'
        : theme.id === 'solar_noon' || theme.id === 'golden_hour'
        ? 'Buena Tarde'
        : 'Buena Noche';

    return (
      <ScrollView
        style={styles.screenRoot}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: safeTop + 8, paddingBottom: safeBottom + 88 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. CABECERA FLUIDA ESTILO TIDE: Buen Día + D L M M J V S + Clima en Vivo + Avatar Orb */}
        <View style={styles.tideHeaderRow}>
          <View style={styles.tideGreetingCol}>
            <Text style={styles.tideMainGreeting}>{greetingText}</Text>
            <View style={styles.tideWeekdaysRow}>
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((dayChar, dIdx) => {
                const isToday = dIdx === todayDayIndex;
                return (
                  <View key={`tide_day_${dIdx}`} style={styles.tideDayItem}>
                    <Text style={[styles.tideDayChar, isToday && styles.tideDayCharActive]}>
                      {dayChar}
                    </Text>
                    {isToday && <View style={styles.tideDayActiveDot} />}
                  </View>
                );
              })}
            </View>

            {/* Píldora bioclimática en vivo conectada al clima nativo */}
            {liveWeather && (
              <View style={styles.tideWeatherPill}>
                <TreegohIcon
                  name={
                    liveWeather.condition === 'lluvia'
                      ? 'riego_hidratacion'
                      : liveWeather.condition === 'viento'
                      ? 'sustrato_aireacion'
                      : 'luz_natural'
                  }
                  size={12}
                  color={
                    liveWeather.condition === 'lluvia'
                      ? '#93C5FD'
                      : liveWeather.condition === 'viento'
                      ? '#E2E8F0'
                      : '#FDE68A'
                  }
                  glow={false}
                />
                <Text style={styles.tideWeatherPillText}>
                  {liveWeather.temperature}°C · {liveWeather.description} ({liveWeather.cityName})
                </Text>
              </View>
            )}
          </View>

          <View style={styles.tideTopRightRow}>
            {/* Pill de Soundscape y Espacios */}
            <TouchableOpacity
              style={styles.tideGlassPillBtn}
              onPress={() => {
                triggerHaptic();
                setIsSoundscapeModalOpen(true);
              }}
              activeOpacity={0.8}
            >
              <TreegohIcon name="sonido_soundscapes" size={16} color="#FFFFFF" glow={false} />
              <View style={styles.tidePillDivider} />
              <TreegohIcon name="espacios_microclimas" size={16} color="#FFFFFF" glow={false} />
            </TouchableOpacity>

            {/* Avatar Orb Etereo (Degradado orgánico coral/menta - Abre UserProfileModal) */}
            <TouchableOpacity
              style={styles.tideAvatarOrbBtn}
              onPress={() => {
                triggerHaptic();
                setIsProfileModalOpen(true);
              }}
              activeOpacity={0.85}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <View style={styles.tideAvatarOrbGlow} />
              <View style={styles.tideAvatarOrbInner}>
                {userPhotoUrl ? (
                  <Image
                    source={{ uri: userPhotoUrl }}
                    style={styles.tideAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.tideAvatarInitials}>
                    {userName.slice(0, 1).toUpperCase()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. ESPACIO HERO CIRCADIANO & CITA POÉTICA EDITORIAL TIPO TIDE */}
        <View style={styles.tideQuoteSection}>
          {/* Título de estado atmosférico central (como 'Rain' en Tide Mobbin) */}
          <Text style={styles.tideAtmosphericHeroTitle}>
            {liveWeather?.condition === 'lluvia'
              ? 'Lluvia'
              : liveWeather?.condition === 'viento'
              ? 'Viento'
              : liveWeather?.condition === 'sol'
              ? 'Luz Cenital'
              : liveWeather?.condition === 'nublado'
              ? 'Niebla'
              : theme.phaseName}
          </Text>

          <View style={styles.tideQuoteWrap}>
            <RandomFadeText
              text={`“${theme.quote.text}”`}
              style={styles.tideQuoteAnimated}
              maxDelayMs={900}
              fadeDurationMs={450}
            />
            <View style={styles.tideQuoteEditorialDivider} />
            <Text style={styles.tideQuoteAuthor}>— {theme.quote.author}</Text>
          </View>
        </View>

        {/* ESPACIADOR ATMOSFÉRICO TIPO TIDE 2026 */}
        <View style={styles.tideAtmosphericBreathingZone} />

        {/* 3. CENTRO DE ATENCIÓN PRIORITARIA (DOT ANIMADO RADAR PING SIN CONTADOR DE TAREAS) */}
        <View style={styles.careAlertsSection}>
          <View style={styles.careAlertsHeaderRow}>
            <View style={styles.careAlertsTitleGroup}>
              {/* Dot de atención prioritaria animado con radar ping */}
              <View style={styles.careAlertDotContainer}>
                {activeAlerts.length > 0 && (
                  <Animated.View
                    style={[
                      styles.careAlertPulsePing,
                      {
                        transform: [
                          {
                            scale: alertDotPulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 2.3],
                            }),
                          },
                        ],
                        opacity: alertDotPulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.75, 0],
                        }),
                        backgroundColor: activeAlerts.some(a => a.type === 'emergencia')
                          ? '#F87171'
                          : '#38BDF8',
                      },
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.careAlertPulseCore,
                    activeAlerts.length === 0
                      ? styles.careAlertPulseCoreQuiet
                      : activeAlerts.some(a => a.type === 'emergencia')
                      ? styles.careAlertPulseCoreEmergency
                      : styles.careAlertPulseCoreActive,
                  ]}
                />
              </View>
              <Text style={styles.careAlertsTitle}>Atención prioritaria</Text>
            </View>
          </View>

          {/* Chips de filtro de alertas a ancho completo */}
          {activeAlerts.length > 0 && (
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              style={styles.fullBleedScroll}
              contentContainerStyle={styles.careAlertFilterChips}
            >
              {['Todas', 'Riego', 'Poda', 'Trasplante', 'Emergencias'].map(fType => {
                const isSel = alertFilter === fType;
                return (
                  <TouchableOpacity
                    key={fType}
                    style={[styles.alertFilterChip, isSel && styles.alertFilterChipActive]}
                    onPress={() => {
                      triggerHaptic();
                      setAlertFilter(fType);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.alertFilterChipText,
                        isSel && styles.alertFilterChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {fType}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Tarjetas deslizables de alertas o estado sereno a ancho completo */}
          {activeAlerts.length === 0 ? (
            <View style={styles.careAlertsEmptyCard}>
              <GlassCardSheen />
              <TreegohIcon name="check_verificado" size={17} color="#86EFAC" glow={false} />
              <Text style={styles.careAlertsEmptyText}>
                Todo en equilibrio en tu santuario · Ninguna emergencia ni riego pendiente hoy.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              style={styles.fullBleedScroll}
              contentContainerStyle={styles.careAlertsTrack}
            >
              {filteredAlerts.map(alert => {
                const iconName: IconName =
                  alert.type === 'riego'
                    ? 'riego_hidratacion'
                    : alert.type === 'poda'
                    ? 'poda_salud'
                    : alert.type === 'trasplante'
                    ? 'maceta_trasplante'
                    : 'alerta_termica';

                const iconColor =
                  alert.type === 'riego'
                    ? '#93C5FD'
                    : alert.type === 'poda'
                    ? '#FDE68A'
                    : alert.type === 'trasplante'
                    ? '#FB923C'
                    : '#FCA5A5';

                const taskLabel =
                  alert.type === 'riego'
                    ? 'Riego hoy'
                    : alert.type === 'poda'
                    ? 'Poda sanitaria'
                    : alert.type === 'trasplante'
                    ? 'Trasplante'
                    : 'Alerta térmica';

                return (
                  <TouchableOpacity
                    key={alert.id}
                    style={[
                      styles.careAlertGlassCard,
                      alert.type === 'emergencia' && styles.careAlertCardEmergency,
                      alert.type === 'riego' && styles.careAlertCardWater,
                      alert.type === 'poda' && styles.careAlertCardPrune,
                      alert.type === 'trasplante' && styles.careAlertCardRepot,
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      const p = (plantsBySpace[alert.spaceName] || []).find(
                        item => item.id === alert.plantId
                      );
                      if (p) setSelectedPlantForDetail(p);
                    }}
                    activeOpacity={0.82}
                  >
                    <GlassCardSheen />

                    {/* Fila superior: Icono vectorial con glow blanco radiante estilo TIDE */}
                    <View style={styles.careAlertTopRow}>
                      <View style={styles.careAlertIconWrap}>
                        <TreegohIcon
                          name={iconName}
                          size={20}
                          color="#FFFFFF"
                          glow={true}
                          glowColor="#FFFFFF"
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.careAlertActionPill}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          alert.onAction();
                        }}
                        activeOpacity={0.75}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.careAlertActionPillText}>
                          {alert.actionText}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Información mínima: Nombre de la especie y estado */}
                    <View style={styles.careAlertBottomInfo}>
                      <Text style={styles.careAlertPlantTitle} numberOfLines={1}>
                        {alert.plantName}
                      </Text>
                      <Text style={styles.careAlertSubText} numberOfLines={1}>
                        {taskLabel} · {alert.spaceName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* 4. AHORA PARA TI Y TARJETAS EN EL BOTTOM CON MÁS ESPACIADO Y GLOW RADIANTE */}
        <View style={styles.tideBottomActionsSection}>
          <View style={styles.tideNowHeaderRow}>
            <View style={styles.tideNowHeaderLeft}>
              <Text style={styles.tideNowSparkle}>✦</Text>
              <Text style={styles.tideNowLabel}>Ahora para ti</Text>
            </View>
            <View style={styles.tideNowDotsRow}>
              {[0, 1, 2, 3].map(dotIdx => (
                <View
                  key={`tide_dot_${dotIdx}`}
                  style={[
                    styles.tideNowDot,
                    activeTideDot === dotIdx && styles.tideNowDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={styles.fullBleedScroll}
            contentContainerStyle={styles.tideActionsRow}
            onScroll={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const idx = Math.min(Math.max(Math.round(offsetX / 160), 0), 3);
              if (idx !== activeTideDot) setActiveTideDot(idx);
            }}
            scrollEventThrottle={16}
          >
            {/* Card 1: Riego VPD */}
            <TouchableOpacity
              style={styles.tideActionGlassCard}
              onPress={() => {
                triggerHaptic();
                handleNavTabPress(2);
              }}
              activeOpacity={0.82}
            >
              <GlassCardSheen />
              <View style={styles.tideActionIconWrap}>
                <TreegohIcon name="riego_hidratacion" size={24} color="#FFFFFF" glow={true} glowColor="#FFFFFF" />
              </View>
              <View style={styles.tideActionTextWrap}>
                <Text style={styles.tideActionTitle}>Riego VPD</Text>
                <Text style={styles.tideActionSub}>Déficit de vapor</Text>
              </View>
            </TouchableOpacity>

            {/* Card 2: Luz Solar */}
            <TouchableOpacity
              style={styles.tideActionGlassCard}
              onPress={() => {
                triggerHaptic();
                handleNavTabPress(2);
              }}
              activeOpacity={0.82}
            >
              <GlassCardSheen />
              <View style={styles.tideActionIconWrap}>
                <TreegohIcon name="luz_natural" size={24} color="#FFFFFF" glow={true} glowColor="#FFFFFF" />
              </View>
              <View style={styles.tideActionTextWrap}>
                <Text style={styles.tideActionTitle}>Luz Solar</Text>
                <Text style={styles.tideActionSub}>
                  ~{(activeSpace?.estimatedLux || 3200).toLocaleString()} Lux
                </Text>
              </View>
            </TouchableOpacity>

            {/* Card 3: Voz Botánica */}
            <TouchableOpacity
              style={styles.tideActionGlassCard}
              onPress={() => {
                triggerHaptic();
                handleNavTabPress(1);
              }}
              activeOpacity={0.82}
            >
              <GlassCardSheen />
              <View style={styles.tideActionIconWrap}>
                <TreegohIcon name="voz_botanica" size={24} color="#FFFFFF" glow={true} glowColor="#FFFFFF" />
              </View>
              <View style={styles.tideActionTextWrap}>
                <Text style={styles.tideActionTitle}>Voz Botánica</Text>
                <Text style={styles.tideActionSub}>ElevenLabs</Text>
              </View>
            </TouchableOpacity>

            {/* Card 4: Pausa Zen */}
            <TouchableOpacity
              style={styles.tideActionGlassCard}
              onPress={() => {
                triggerHaptic();
                setIsSoundscapeModalOpen(true);
              }}
              activeOpacity={0.82}
            >
              <GlassCardSheen />
              <View style={styles.tideActionIconWrap}>
                <TreegohIcon name="sonido_soundscapes" size={24} color="#FFFFFF" glow={true} glowColor="#FFFFFF" />
              </View>
              <View style={styles.tideActionTextWrap}>
                <Text style={styles.tideActionTitle}>Pausa Zen</Text>
                <Text style={styles.tideActionSub}>Soundscapes</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 4. SELECTOR DE MICROCLIMAS / ESPACIOS DEL HOGAR */}
        <View style={styles.spacesSection}>
          <View style={styles.spacesSectionHeaderRow}>
            <Text style={styles.sectionTitle}>Espacios del hogar</Text>
            <Text style={styles.sectionCounter}>
              {selectedSpaceIndex + 1} de {customSpacesList.length}
            </Text>
          </View>

          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={styles.fullBleedScroll}
            contentContainerStyle={styles.spacesScrollContent}
          >
            {(customSpacesList || []).map((space, idx) => {
              if (!space) return null;
              const spaceName = space.name || `Espacio ${idx + 1}`;
              const isSelected = idx === selectedSpaceIndex;
              const plantCount = (plantsBySpace[spaceName] || []).length;
              return (
                <TouchableOpacity
                  key={space.id || spaceName}
                  style={[
                    styles.spaceTabPill,
                    isSelected && styles.spaceTabPillSelected,
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setSelectedSpaceIndex(idx);
                  }}
                  onLongPress={() => handleDeleteSpace(idx)}
                  activeOpacity={0.8}
                >
                  <GlassCardSheen selected={isSelected} />
                  <TreegohIcon
                    name="espacios_microclimas"
                    size={15}
                    color="#FFFFFF"
                    glow={isSelected}
                  />
                  <Text
                    style={[
                      styles.spaceTabPillText,
                      isSelected && styles.spaceTabPillTextSelected,
                    ]}
                  >
                    {spaceName}
                  </Text>
                  <View style={styles.spacePlantCountTag}>
                    <Text style={styles.spacePlantCountText}>
                      {plantCount} {plantCount === 1 ? 'planta' : 'plantas'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.spaceAddPillBtn}
              onPress={() => {
                triggerHaptic();
                setIsAddSpaceModalOpen(true);
              }}
              activeOpacity={0.8}
            >
              <GlassCardSheen />
              <TreegohIcon name="mas" size={14} color="#FFFFFF" glow={false} />
              <Text style={styles.spaceAddPillText}>Añadir espacio</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 6. PLANTAS EN EL ESPACIO ACTIVO (DIAGRAMACIÓN AÉREA EN 2 COLUMNAS CON FOTO CARD) */}
        <View style={styles.plantsSectionWrap}>
          <View style={styles.plantsSectionHeaderRow}>
            <View style={styles.plantsSectionTitleCol}>
              <View style={styles.plantsSectionTitleRow}>
                <Text style={styles.sectionTitle}>
                  Plantas en {activeSpace?.name || 'Salón Principal'}
                </Text>
                {customSpacesList.length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteSpaceMiniBtn}
                    onPress={() => handleDeleteSpace(selectedSpaceIndex)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <TreegohIcon name="menos" size={11} color="rgba(255, 255, 255, 0.45)" glow={false} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.sectionSubtitle}>
                {filteredCurrentSpacePlants.length}{' '}
                {filteredCurrentSpacePlants.length === 1 ? 'especie' : 'especies'}{' '}
                {plantListFilter !== 'Todas' ? `(${plantListFilter.toLowerCase()})` : 'adaptadas a este rincón'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addPlantPillBtn}
              onPress={() => {
                triggerHaptic();
                setIsAddPlantModalOpen(true);
              }}
              activeOpacity={0.82}
            >
              <TreegohIcon name="mas" size={13} color="#FFFFFF" glow={false} />
              <Text style={styles.addPlantPillText}>Añadir</Text>
            </TouchableOpacity>
          </View>

          {/* Chips de filtro rápido del catálogo con ancho completo y mayor espaciado */}
          {currentSpacePlants.length > 0 && (
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              style={styles.fullBleedScroll}
              contentContainerStyle={styles.plantFiltersRow}
            >
              {[
                {
                  key: 'Todas',
                  label: `Todas (${currentSpacePlants.length})`,
                  icon: 'espacios_microclimas' as IconName,
                },
                {
                  key: 'Sedientas',
                  label: `Sedientas (${
                    currentSpacePlants.filter(
                      p => p.wateringStatus === 'necesita_riego' || p.daysUntilNextWatering <= 1
                    ).length
                  })`,
                  icon: 'riego_hidratacion' as IconName,
                },
                {
                  key: 'Tareas',
                  label: `Con tareas (${
                    currentSpacePlants.filter(
                      p => p.needsPruning || p.needsRepotting || p.emergencyAlert
                    ).length
                  })`,
                  icon: 'escudo_fitosanitario' as IconName,
                },
                {
                  key: 'Pet Friendly',
                  label: `Pet Friendly (${
                    currentSpacePlants.filter(p => p.isPetSafe).length
                  })`,
                  icon: 'mascota_libre' as IconName,
                },
              ].map(f => {
                const isSelected = plantListFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[
                      styles.plantFilterChip,
                      isSelected && styles.plantFilterChipActive,
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setPlantListFilter(f.key);
                    }}
                    activeOpacity={0.8}
                  >
                    <GlassCardSheen selected={isSelected} />
                    <TreegohIcon
                      name={f.icon}
                      size={13}
                      color={isSelected ? '#86EFAC' : 'rgba(255, 255, 255, 0.65)'}
                      glow={isSelected}
                    />
                    <Text
                      style={[
                        styles.plantFilterChipText,
                        isSelected && styles.plantFilterChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {currentSpacePlants.length === 0 ? (
            <TouchableOpacity
              style={styles.emptySpaceCtaCard}
              onPress={() => {
                triggerHaptic();
                setIsAddPlantModalOpen(true);
              }}
              activeOpacity={0.85}
            >
              <GlassCardSheen />
              <View style={styles.emptyIconCircle}>
                <TreegohIcon name="anadir_planta" size={28} color="#FFFFFF" glow={true} />
              </View>
              <Text style={styles.emptyCardTitle}>
                Añade tu primera planta a «{activeSpace?.name || 'este espacio'}»
              </Text>
              <Text style={styles.emptyCardSub}>
                Escanea con la burbuja óptica para verificar si tolerará los ~
                {(activeSpace?.estimatedLux || 3200).toLocaleString()} Lux de este rincón.
              </Text>
              <View style={styles.emptyButtonInside}>
                <Text style={styles.emptyButtonInsideText}>Abrir opciones de escaneo</Text>
              </View>
            </TouchableOpacity>
          ) : filteredCurrentSpacePlants.length === 0 ? (
            <View style={styles.emptyFilteredCard}>
              <GlassCardSheen />
              <TreegohIcon name="check_verificado" size={18} color="#86EFAC" glow={false} />
              <Text style={styles.emptyFilteredText}>
                No hay plantas en la categoría «{plantListFilter}».
              </Text>
            </View>
          ) : (
            <View style={styles.plantsGrid2Col}>
              {filteredCurrentSpacePlants.map(plant => (
                <TouchableOpacity
                  key={plant.id}
                  style={styles.plantGridCard}
                  onPress={() => {
                    triggerHaptic();
                    setSelectedPlantForDetail(plant);
                  }}
                  onLongPress={() => handleDeletePlant(plant.id)}
                  activeOpacity={0.84}
                >
                  <GlassCardSheen />

                  {/* Imagen superior con badges superpuestos (sin franja oscura en el fondo) */}
                  <View style={styles.plantGridImageWrap}>
                    <BotanicalImage
                      uri={plant.imageUrl}
                      scientificName={plant.scientificName}
                      commonName={plant.commonName}
                      style={styles.plantGridThumb}
                    />

                    {/* Fila superior de badges */}
                    <View style={styles.plantGridBadgeTopRow}>
                      <View
                        style={[
                          styles.plantWaterPill,
                          plant.wateringStatus === 'hidratada'
                            ? styles.plantWaterPillHydrated
                            : plant.wateringStatus === 'necesita_riego' || plant.daysUntilNextWatering <= 0
                            ? styles.plantWaterPillUrgent
                            : styles.plantWaterPillNormal,
                        ]}
                      >
                        <TreegohIcon
                          name="riego_hidratacion"
                          size={10}
                          color={
                            plant.wateringStatus === 'hidratada'
                              ? '#86EFAC'
                              : plant.wateringStatus === 'necesita_riego' || plant.daysUntilNextWatering <= 0
                              ? '#F87171'
                              : '#93C5FD'
                          }
                          glow={false}
                        />
                        <Text style={styles.plantWaterPillText}>
                          {plant.wateringStatus === 'hidratada'
                            ? 'Hoy ✓'
                            : plant.wateringStatus === 'necesita_riego' || plant.daysUntilNextWatering <= 0
                            ? 'Hoy'
                            : `${plant.daysUntilNextWatering}d`}
                        </Text>
                      </View>

                      {/* Badges complementarios a la derecha */}
                      <View style={styles.plantGridRightBadges}>
                        {plant.isPetSafe && (
                          <View style={styles.plantPetBadge}>
                            <Text style={styles.plantPetBadgeText}>ASPCA</Text>
                          </View>
                        )}
                        {plant.needsPruning && (
                          <View style={styles.plantTaskBadgePrune}>
                            <TreegohIcon name="poda_salud" size={10} color="#FDE68A" />
                          </View>
                        )}
                        {plant.needsRepotting && (
                          <View style={styles.plantTaskBadgeRepot}>
                            <TreegohIcon name="maceta_trasplante" size={10} color="#FB923C" />
                          </View>
                        )}
                        {plant.emergencyAlert && (
                          <View style={styles.plantTaskBadgeEmergency}>
                            <TreegohIcon name="alerta_termica" size={10} color="#F87171" />
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Información textual de la planta */}
                  <View style={styles.plantGridInfo}>
                    <Text style={styles.plantGridCommonName} numberOfLines={1}>
                      {plant.commonName}
                    </Text>
                    <Text style={styles.plantGridSubtitle} numberOfLines={1}>
                      {plant.nickname ? `«${plant.nickname}»` : plant.scientificName}
                    </Text>

                    {/* Pie de la card con estado y botones de acción rápida */}
                    <View style={styles.plantGridFooterRow}>
                      <View style={styles.plantGridStatusTag}>
                        <View
                          style={[
                            styles.plantStatusDot,
                            plant.wateringStatus === 'hidratada'
                              ? styles.plantStatusDotGreen
                              : plant.wateringStatus === 'necesita_riego' || plant.daysUntilNextWatering <= 0
                              ? styles.plantStatusDotRed
                              : styles.plantStatusDotBlue,
                          ]}
                        />
                        <Text style={styles.plantGridStatusText} numberOfLines={1}>
                          {plant.wateringStatus === 'hidratada'
                            ? 'Hidratada'
                            : plant.wateringStatus === 'necesita_riego' || plant.daysUntilNextWatering <= 0
                            ? 'Riego hoy'
                            : `En ${plant.daysUntilNextWatering}d`}
                        </Text>
                      </View>

                      <View style={styles.plantGridFooterActionsRow}>
                        <TouchableOpacity
                          style={styles.plantQuickDeleteBtn}
                          onPress={e => {
                            e.stopPropagation?.();
                            handleDeletePlant(plant.id);
                          }}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <TreegohIcon
                            name="menos"
                            size={11}
                            color="rgba(255, 255, 255, 0.45)"
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.plantQuickWaterBtn,
                            plant.wateringStatus === 'hidratada' && styles.plantQuickWaterBtnDone,
                          ]}
                          onPress={e => {
                            e.stopPropagation?.();
                            handleQuickWater(plant.id);
                          }}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <TreegohIcon
                            name="riego_hidratacion"
                            size={13}
                            color={plant.wateringStatus === 'hidratada' ? '#86EFAC' : '#FFFFFF'}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Contenedor interactivo vacío para añadir planta al final de la cuadrícula */}
              <TouchableOpacity
                style={styles.addPlantSlotCard}
                onPress={() => {
                  triggerHaptic();
                  setIsAddPlantModalOpen(true);
                }}
                activeOpacity={0.82}
              >
                <GlassCardSheen />
                <View style={styles.addPlantSlotIconCircle}>
                  <TreegohIcon name="mas" size={20} color="#FFFFFF" glow={true} glowColor="#FFFFFF" />
                </View>
                <Text style={styles.addPlantSlotTitle}>Añadir Planta</Text>
                <Text style={styles.addPlantSlotSub}>Escanea o selecciona</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 6. BOTÓN PARA REINICIAR TEST */}
        {onResetForTest && (
          <TouchableOpacity
            style={styles.testResetBtn}
            onPress={onResetForTest}
            activeOpacity={0.8}
          >
            <Text style={styles.testResetText}>Reiniciar Onboarding para Test</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  const handlePlayAssistantVoice = async (textToSpeak: string, msgId?: string) => {
    triggerHaptic();

    // Si ya está reproduciendo este mismo mensaje o nota de voz, detenerlo al pulsar
    if (isSpeakingWithElevenLabs && msgId && activeSpeakingMsgId === msgId) {
      stopVoicePlayback();
      setIsSpeakingWithElevenLabs(false);
      setActiveSpeakingMsgId(null);
      setAssistantParticleState('reposo');
      return;
    }

    setIsSpeakingWithElevenLabs(true);
    setActiveSpeakingMsgId(msgId || null);
    setAssistantParticleState('hablando');

    const res = await speakWithElevenLabs(textToSpeak, {
      onStart: () => {
        setIsListeningToUserVoice(false);
        setIsSpeakingWithElevenLabs(true);
        setActiveSpeakingMsgId(msgId || null);
        setAssistantParticleState('hablando');
      },
      onEnd: () => {
        setIsSpeakingWithElevenLabs(false);
        setActiveSpeakingMsgId(null);
        setAssistantParticleState('reposo');
      },
      onError: () => {
        setIsSpeakingWithElevenLabs(false);
        setActiveSpeakingMsgId(null);
        setAssistantParticleState('reposo');
      },
    });

    if (res?.durationSeconds && msgId) {
      setChatMessages(prev =>
        (prev || []).map(m =>
          m.id === msgId ? { ...m, audioDurationSec: res.durationSeconds } : m
        )
      );
    }
  };

  // Interacción vocal bidireccional: reacciona a la voz del usuario ('escuchando') y responde con ElevenLabs ('hablando')
  const VOICE_CONSULTATION_PROMPTS = [
    'Hola, ¿qué puedes hacer como mi asistente botánico?',
    '¿Por qué se ponen amarillas o secas las puntas de las hojas y cómo lo soluciono?',
    '¿Cómo preparo el mejor sustrato aireado universal para plantas de interior?',
    '¿Qué plantas de interior son las más resistentes y seguras para mascotas?',
  ];

  const handleToggleVoiceInteraction = () => {
    triggerHaptic(true);

    if (voiceListenTimerRef.current) {
      clearTimeout(voiceListenTimerRef.current);
      voiceListenTimerRef.current = null;
    }

    if (isSpeakingWithElevenLabs) {
      stopVoicePlayback();
      setIsSpeakingWithElevenLabs(false);
      setActiveSpeakingMsgId(null);
      setAssistantParticleState('reposo');
      return;
    }

    if (isListeningToUserVoice) {
      setIsListeningToUserVoice(false);
      const nextPrompt =
        VOICE_CONSULTATION_PROMPTS[voiceQueryCycleRef.current % VOICE_CONSULTATION_PROMPTS.length];
      voiceQueryCycleRef.current += 1;
      const voiceQuery = assistantUserQuery.trim() || nextPrompt;
      handleSendChatMessage(voiceQuery, true);
      return;
    }

    stopVoicePlayback();
    setIsSpeakingWithElevenLabs(false);
    setActiveSpeakingMsgId(null);
    setIsListeningToUserVoice(true);
    setAssistantParticleState('escuchando');

    // Auto-envío inteligente tras 3.8s de escucha vocal para que responda como nota de voz reproducible
    voiceListenTimerRef.current = setTimeout(() => {
      voiceListenTimerRef.current = null;
      setIsListeningToUserVoice(false);
      const nextPrompt =
        VOICE_CONSULTATION_PROMPTS[voiceQueryCycleRef.current % VOICE_CONSULTATION_PROMPTS.length];
      voiceQueryCycleRef.current += 1;
      const voiceQuery = assistantUserQuery.trim() || nextPrompt;
      handleSendChatMessage(voiceQuery, true);
    }, 3800);
  };

  const handleSendChatMessage = async (
    overrideText?: string,
    fromVoiceInteraction: boolean = false
  ) => {
    const now = Date.now();
    if (now - lastSendTimestampRef.current < 350) return;

    if (voiceListenTimerRef.current) {
      clearTimeout(voiceListenTimerRef.current);
      voiceListenTimerRef.current = null;
    }
    if (typingBlurTimerRef.current) {
      clearTimeout(typingBlurTimerRef.current);
      typingBlurTimerRef.current = null;
    }

    const text = (overrideText ?? assistantUserQueryRef.current ?? assistantUserQuery).trim();
    const attachedImg = chatAttachedImage;
    if (!text && !attachedImg) return;
    if (isAssistantThinking) return;

    lastSendTimestampRef.current = now;
    assistantUserQueryRef.current = '';
    setAssistantUserQuery('');
    setIsTypingMode(false);
    setKeyboardHeight(0);
    Keyboard.dismiss();

    triggerHaptic(true);
    const userMsgId = `msg_user_${now}`;
    const userText = text || '¿Cómo ves esta planta y el estado de sus hojas?';
    const newUserMsg: AssistantMessage = {
      id: userMsgId,
      sender: 'user',
      text: userText,
      imageUri: attachedImg?.uri,
      timestamp: 'Ahora',
      isVoiceNote: fromVoiceInteraction,
      audioDurationSec: fromVoiceInteraction
        ? Math.max(4, Math.round(userText.length / 13))
        : undefined,
    };

    const updatedHistory = [...(chatMessages || []), newUserMsg];
    setChatMessages(updatedHistory);
    setChatAttachedImage(null);
    setIsAssistantThinking(true);
    setAssistantParticleState('pensando');
    stopVoicePlayback();
    setIsSpeakingWithElevenLabs(false);
    setActiveSpeakingMsgId(null);
    setIsListeningToUserVoice(false);

    try {
      let replyText = '';
      let executedAction: AssistantAction | undefined;

      if (attachedImg?.base64) {
        const spaceCtx: SpaceBotanicalContext = {
          spaceName: activeSpace?.name || 'Salón',
          roomType: activeSpace?.roomType || 'Salón',
          estimatedLux: activeSpace?.estimatedLux || 3200,
          orientation: activeSpace?.orientation || 'Sur',
          windowDistance: activeSpace?.windowDistance || 'media_distancia',
          hasPets: Boolean(onboardingData?.safetyFilter?.hasPets),
          petTypes: onboardingData?.safetyFilter?.petTypes || [],
          captureHour: currentTime.getHours(),
        };
        const aiResult = await identifyPlantWithOpenRouter(
          attachedImg.base64,
          spaceCtx,
          'image/jpeg',
          text
        );
        if (aiResult?.ok && aiResult.data) {
          replyText = aiResult.data.conversationalDiagnosis;
        } else if (aiResult && !aiResult.ok && aiResult.fallbackData?.conversationalDiagnosis) {
          replyText = aiResult.fallbackData.conversationalDiagnosis;
        } else {
          const res = await queryBotanicalAssistant(
            text ? `${text} (He compartido una fotografía de la planta)` : 'Analiza esta planta y dime cómo ves sus hojas.',
            updatedHistory,
            assistantContext
          );
          replyText = res.text;
          executedAction = res.action;
        }
      } else {
        const res = await queryBotanicalAssistant(text, updatedHistory, assistantContext);
        replyText = res.text;
        executedAction = res.action;
      }

      // Ejecución interactiva de órdenes en el santuario (Riego masivo, estados, etc.)
      if (executedAction?.type === 'water_all_in_space') {
        const spaceKey = executedAction.spaceName || activeSpace?.name || 'Salón';
        const matchedKey = Object.keys(plantsBySpace).find(
          k => k.toLowerCase() === spaceKey.toLowerCase()
        ) || spaceKey;

        setPlantsBySpace(prev => {
          const currentList = prev[matchedKey] || [];
          const updated = currentList.map(p => ({
            ...p,
            wateringStatus: 'hidratada' as const,
            daysUntilNextWatering: 7,
            lastWateredDate: new Date().toISOString(),
          }));
          return { ...prev, [matchedKey]: updated };
        });

        triggerHaptic(true);

        if (onboardingData?.account?.uid) {
          syncSanctuaryToCloud(onboardingData.account.uid, {
            ...onboardingData,
            plantsBySpace: {
              ...plantsBySpace,
              [matchedKey]: (plantsBySpace[matchedKey] || []).map(p => ({
                ...p,
                wateringStatus: 'hidratada' as const,
                daysUntilNextWatering: 7,
                lastWateredDate: new Date().toISOString(),
              })),
            },
          });
        }
      } else if (executedAction?.type === 'water_plant' && executedAction.plantId) {
        handleWaterPlant(executedAction.plantId);
      }

      const assistantMsgId = `msg_asst_${Date.now()}`;
      const newAsstMsg: AssistantMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: replyText,
        timestamp: 'Ahora',
        action: executedAction,
        isVoiceNote: fromVoiceInteraction,
        audioDurationSec: fromVoiceInteraction
          ? Math.max(6, Math.round(replyText.length / 13))
          : undefined,
      };
      setChatMessages(prev => [...prev, newAsstMsg]);
      setAssistantSpokenText(replyText);
      setIsAssistantThinking(false);

      // Optimización de costes:
      // - Si la interacción se inició por VOZ, el asistente responde automáticamente por voz y queda como nota de voz reproducible.
      // - Si la interacción fue por TEXTO/FOTO, no se narra automáticamente (queda el botón "Escuchar respuesta" bajo demanda).
      if (fromVoiceInteraction) {
        setAssistantParticleState('hablando');
        handlePlayAssistantVoice(replyText, assistantMsgId);
      } else {
        setAssistantParticleState('reposo');
      }
    } catch (_e) {
      setIsAssistantThinking(false);
      setAssistantParticleState('reposo');
      const fallbackMsg: AssistantMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        text: `Estoy listo para ayudarte con cualquier duda sobre tus plantas, riego, sustratos, plagas o para examinar una foto de sus hojas contigo.`,
        timestamp: 'Ahora',
      };
      setChatMessages(prev => [...prev, fallbackMsg]);
    }
  };

  // ============================================================================
  // PÁGINA 1: ASISTENTE BOTÁNICO (CARDUMEN 3D PARTÍCULA A PARTÍCULA + VOZ 2026)
  // ============================================================================
  const renderAsistentePage = () => {
    const isConversationEmpty = (chatMessages?.length || 0) === 0;
    const isKeyboardOpen = keyboardHeight > 0 || isTypingMode;
    const hasAttachedPhoto = Boolean(chatAttachedImage || renderedChatImage);
    const isChatInteracting =
      !isConversationEmpty ||
      isTypingMode ||
      isListeningToUserVoice ||
      hasAttachedPhoto ||
      isAttachMenuOpen;
    const activeKbOffset =
      keyboardHeight > 0 ? keyboardHeight : Math.round(windowHeight * 0.36);

    // En conversación vacía: Type Zone centrado en la pantalla (o ajustado para la tarjeta de foto estilo Sora).
    // En conversación activa: el Type Zone y su leyenda inferior quedan íntegramente por encima del FloatingBlobNavBar (nunca detrás).
    const dockContainerMeasuredH = Math.max(assistantDockHeight, 96);
    const dockTop = isConversationEmpty
      ? isKeyboardOpen
        ? hasAttachedPhoto
          ? Math.max(safeTop + 62, windowHeight - activeKbOffset - dockContainerMeasuredH - 6)
          : Math.max(safeTop + 135, windowHeight - activeKbOffset - 108)
        : hasAttachedPhoto
        ? Math.max(safeTop + 105, Math.round(windowHeight * 0.25))
        : Math.round(windowHeight * 0.43)
      : isKeyboardOpen
      ? hasAttachedPhoto
        ? Math.max(safeTop + 62, windowHeight - activeKbOffset - dockContainerMeasuredH - 6)
        : Math.max(safeTop + 165, windowHeight - activeKbOffset - 108)
      : Math.round(windowHeight - safeBottom - 86 - dockContainerMeasuredH);

    const chatHeight = Math.max(150, dockTop - (safeTop + 52));

    // Interpolaciones suaves para la tarjeta de foto estilo Sora 2 y para el menú "+" anidado
    const photoCardScale = chatImageAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.86, 1],
    });
    const photoCardTranslateY = chatImageAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [26, 0],
    });
    const plusRotation = attachPlusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '45deg'],
    });
    const plusMenuTranslateY = attachPlusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 0],
    });
    const plusMenuScale = attachPlusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.88, 1],
    });

    // Saludo dinámico y personalizado según la hora, el usuario, su ciudad, el clima en vivo y sus plantas
    const hourNow = currentTime.getHours();
    const timeGreetingPrefix =
      hourNow >= 6 && hourNow < 13
        ? 'Buenos días'
        : hourNow >= 13 && hourNow < 20
        ? 'Buenas tardes'
        : 'Buenas noches';

    const thirstyList = assistantContext.plantsSummary.filter(
      p => p.wateringStatus === 'necesita_riego' || p.daysUntilNextWatering <= 1
    );
    const featuredPlantName =
      assistantContext.plantsSummary[0]?.commonName ||
      onboardingData?.assignedAvatar?.species ||
      'Monstera';
    const weatherBadge = liveWeather ? ` · ${liveWeather.temperature}°C` : '';

    const personalizedSubtitle =
      thirstyList.length > 0
        ? `${assistantContext.city}${weatherBadge} · Tu ${thirstyList[0].commonName}${
            thirstyList.length > 1 ? ` y ${thirstyList.length - 1} más` : ''
          } agradecerán hidratación hoy. ¿Hacemos un diagnóstico o consultamos otra especie?`
        : assistantContext.plantsCount > 0
        ? `${assistantContext.city}${weatherBadge} · Tus ${assistantContext.plantsCount} plantas (como tu ${featuredPlantName}) están en equilibrio. ¿Qué te gustaría consultar hoy?`
        : `${assistantContext.city}${weatherBadge} · Pregúntame sobre cualquier especie, cuidado botánico o diagnóstico foliar.`;

    return (
      <View style={[styles.assistantDarkCanvas, { width: windowWidth, height: windowHeight }]}>
        {/* 1. Cardumen vivo de partículas individuales de 1px con respiración continua y desenfoque del 30% al interactuar */}
        <BioLuminescentParticles
          width={windowWidth}
          height={windowHeight}
          state={assistantParticleState}
          voiceLevel={
            isSpeakingWithElevenLabs
              ? 0.95
              : isListeningToUserVoice
              ? 0.92
              : isAssistantThinking
              ? 0.65
              : 0
          }
          typingPulse={typingPulseCount}
          isActive={visitedTabs[1]}
          isFocused={activeNavTab === 1}
          isTypingMode={isTypingMode}
          isChatInteracting={isChatInteracting}
          onPress={() => {
            if (isAttachMenuOpen) {
              handleCloseAttachMenu();
            }
            Keyboard.dismiss();
          }}
        />

        {/* 2. Header superior editorial con position: 'absolute' garantizado visible */}
        <View
          style={[
            styles.assistantHypelistHeaderRow,
            {
              position: 'absolute',
              top: safeTop + 10,
              left: 0,
              right: 0,
              zIndex: 25,
            },
          ]}
        >
          <Text style={styles.assistantHypelistTitle}>ASK TREEGOH</Text>
          {!isConversationEmpty && (
            <TouchableOpacity
              style={styles.assistantResetPill}
              onPress={() => {
                triggerHaptic();
                setChatMessages([]);
              }}
              activeOpacity={0.8}
            >
              <TreegohIcon name="menos" size={12} color="rgba(255, 255, 255, 0.70)" glow={false} />
              <Text style={styles.assistantResetPillText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 3. ZONA DE SALUDO PERSONALIZADO O CONVERSACIÓN ABIERTA SIN CONTENEDOR */}
        {isConversationEmpty ? (
          !hasAttachedPhoto ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 24,
                right: 24,
                top: isKeyboardOpen
                  ? safeTop + 66
                  : Math.round(windowHeight * 0.28),
                alignItems: 'center',
                gap: 8,
                zIndex: 25,
              }}
            >
              <Text style={styles.assistantHeroGreetingTitle}>
                {isListeningToUserVoice
                  ? `Te escucho, ${userName}...`
                  : `${timeGreetingPrefix}, ${userName}`}
              </Text>
              <Text style={styles.assistantHeroGreetingSub}>
                {isAssistantThinking
                  ? 'Analizando tu consulta...'
                  : isListeningToUserVoice
                  ? 'Habla ahora · El cardumen responde a tu voz en vivo'
                  : isSpeakingWithElevenLabs
                  ? 'Reproduciendo voz de tu asistente...'
                  : personalizedSubtitle}
              </Text>
            </View>
          ) : null
        ) : (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: safeTop + 46,
              height: chatHeight,
              zIndex: 25,
            }}
          >
            <ScrollView
              ref={chatScrollRef}
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{
                paddingHorizontal: 22,
                paddingTop: 12,
                paddingBottom: 24,
                gap: 14,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="interactive"
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
            >
              <View style={styles.assistantFeedWrap}>
                {(chatMessages || []).map((msg, idx) => (
                  <BotanicalMessageView
                    key={msg.id}
                    message={msg}
                    isLatestAssistant={idx === (chatMessages?.length || 0) - 1}
                    isSpeakingThis={
                      isSpeakingWithElevenLabs &&
                      (activeSpeakingMsgId
                        ? activeSpeakingMsgId === msg.id
                        : idx === (chatMessages?.length || 0) - 1)
                    }
                    onPlayVoice={(t, id) => {
                      handlePlayAssistantVoice(t, id || msg.id);
                    }}
                  />
                ))}

                {isAssistantThinking && <AssistantLoadingPulse />}
              </View>
            </ScrollView>
          </View>
        )}

        {/* 4. TARJETA DE FOTO ADJUNTA ESTILO SORA 2 + TYPE ZONE CON ENVÍO AL PRIMER TOQUE */}
        <View
          onLayout={e => {
            const h = Math.round(e.nativeEvent.layout.height);
            if (h > 0 && Math.abs(h - assistantDockHeight) > 1) {
              setAssistantDockHeight(h);
            }
          }}
          style={[
            styles.assistantFloatingDockContainer,
            {
              top: dockTop,
              zIndex: 30,
            },
          ]}
        >
          {renderedChatImage && (
            <Animated.View
              style={[
                styles.soraImagePreviewStage,
                {
                  opacity: chatImageAnim,
                  transform: [
                    { translateY: photoCardTranslateY },
                    { scale: photoCardScale },
                  ],
                },
              ]}
            >
              {/* Halo ambiental suave detrás de la fotografía (estilo Sora 2) */}
              <View style={styles.soraImageAmbientGlow} pointerEvents="none" />

              <View style={styles.soraImageCard}>
                <Image
                  source={{ uri: renderedChatImage.uri }}
                  style={styles.soraImagePreviewFull}
                  resizeMode="cover"
                />
              </View>

              {/* Botón circular oscuro en la esquina superior derecha para quitar foto */}
              <TouchableOpacity
                onPress={handleRemoveChatImage}
                style={styles.soraImageDismissCircleBtn}
                activeOpacity={0.82}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Svg width={12} height={12} viewBox="0 0 14 14">
                  <Line
                    x1="3"
                    y1="3"
                    x2="11"
                    y2="11"
                    stroke="rgba(255, 255, 255, 0.90)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <Line
                    x1="11"
                    y1="3"
                    x2="3"
                    y2="11"
                    stroke="rgba(255, 255, 255, 0.90)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </Svg>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Menú flotante anidado desplegado sobre el símbolo "+" */}
          {renderedAttachMenu && (
            <Animated.View
              style={[
                styles.attachPlusMenuPopover,
                {
                  opacity: attachPlusAnim,
                  transform: [
                    { translateY: plusMenuTranslateY },
                    { scale: plusMenuScale },
                  ],
                },
              ]}
            >
              <GlassCardSheen />

              <TouchableOpacity
                style={styles.attachPlusMenuItem}
                onPress={() => {
                  handleCloseAttachMenu(() => {
                    handleOpenAssistantBubbleCamera();
                  });
                }}
                activeOpacity={0.8}
              >
                <View style={styles.attachPlusMenuIconWrap}>
                  <TreegohIcon name="camara_diagnostica" size={17} color="#FFFFFF" glow={false} />
                </View>
                <View style={styles.attachPlusMenuTextCol}>
                  <Text style={styles.attachPlusMenuTitle}>Desplegar cámara</Text>
                  <Text style={styles.attachPlusMenuSub}>Visor en burbuja integrada</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.attachPlusMenuDivider} />

              <TouchableOpacity
                style={styles.attachPlusMenuItem}
                onPress={() => {
                  handleCloseAttachMenu(() => {
                    handlePickChatPhoto();
                  });
                }}
                activeOpacity={0.8}
              >
                <View style={styles.attachPlusMenuIconWrap}>
                  <Svg width={17} height={17} viewBox="0 0 22 22">
                    <Rect
                      x="3"
                      y="3"
                      width="16"
                      height="16"
                      rx="4.2"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <Circle cx="8.2" cy="8.2" r="1.4" fill="#FFFFFF" />
                    <Path
                      d="M3.8 16.2L8.6 11.6C9.2 11 10.1 11 10.7 11.6L13.5 14.3L15.4 12.5C15.9 12 16.7 12 17.2 12.5L18.5 13.8"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </Svg>
                </View>
                <View style={styles.attachPlusMenuTextCol}>
                  <Text style={styles.attachPlusMenuTitle}>Elegir de galería</Text>
                  <Text style={styles.attachPlusMenuSub}>Subir foto de tus hojas</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.attachPlusMenuDivider} />

              <TouchableOpacity
                style={styles.attachPlusMenuItem}
                onPress={() => {
                  handleCloseAttachMenu(() => {
                    const spaceDiagnosticPrompt = `Analiza el microclima de mi ${
                      activeSpace?.name || 'Salón'
                    } (~${(activeSpace?.estimatedLux || 3200).toLocaleString()} Lux, orientación ${
                      activeSpace?.orientation || 'Sur'
                    }) y dime cómo optimizar el cuidado de mis plantas.`;
                    handleSendChatMessage(spaceDiagnosticPrompt, false);
                  });
                }}
                activeOpacity={0.8}
              >
                <View style={styles.attachPlusMenuIconWrap}>
                  <TreegohIcon name="luz_natural" size={17} color="#FFFFFF" glow={false} />
                </View>
                <View style={styles.attachPlusMenuTextCol}>
                  <Text style={styles.attachPlusMenuTitle}>Analizar microclima</Text>
                  <Text style={styles.attachPlusMenuSub}>
                    Luz y VPD en {activeSpace?.name || 'Salón'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Barra integrada con símbolo "+" animado con giro sutil + Input + Flecha/Voz */}
          <View
            style={[
              styles.assistantFloatingDockCapsule,
              {
                width: '100%',
                alignItems:
                  assistantUserQuery.includes('\n') || assistantUserQuery.length > 34
                    ? 'flex-end'
                    : 'center',
                borderColor: isListeningToUserVoice
                  ? '#86EFAC'
                  : isTypingMode || isAttachMenuOpen
                  ? 'rgba(255, 255, 255, 0.28)'
                  : 'rgba(255, 255, 255, 0.16)',
                backgroundColor: isTypingMode || isAttachMenuOpen
                  ? 'rgba(18, 20, 25, 0.94)'
                  : 'rgba(20, 23, 29, 0.86)',
              },
            ]}
          >
            <GlassCardSheen />

            <TouchableOpacity
              style={[
                styles.dockPlusTriggerBtn,
                isAttachMenuOpen && styles.dockPlusTriggerBtnActive,
              ]}
              onPress={handleToggleAttachMenu}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Animated.View style={{ transform: [{ rotate: plusRotation }] }}>
                <Svg width={18} height={18} viewBox="0 0 20 20">
                  <Line
                    x1="10"
                    y1="4.2"
                    x2="10"
                    y2="15.8"
                    stroke={isAttachMenuOpen ? '#121417' : 'rgba(255, 255, 255, 0.92)'}
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <Line
                    x1="4.2"
                    y1="10"
                    x2="15.8"
                    y2="10"
                    stroke={isAttachMenuOpen ? '#121417' : 'rgba(255, 255, 255, 0.92)'}
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </Svg>
              </Animated.View>
            </TouchableOpacity>

            <TextInput
              ref={middleInputRef}
              style={styles.largeBarTextInput}
              placeholder={
                isListeningToUserVoice
                  ? 'Escuchando tu consulta por voz...'
                  : chatAttachedImage
                  ? 'Pregunta sobre tu planta...'
                  : 'Pregunta lo que quieras...'
              }
              placeholderTextColor="rgba(255, 255, 255, 0.44)"
              value={assistantUserQuery}
              multiline={true}
              scrollEnabled={true}
              textAlignVertical="top"
              returnKeyType="send"
              blurOnSubmit={false}
              onFocus={() => {
                if (isAttachMenuOpen) {
                  handleCloseAttachMenu();
                }
                if (typingBlurTimerRef.current) {
                  clearTimeout(typingBlurTimerRef.current);
                  typingBlurTimerRef.current = null;
                }
                setIsTypingMode(true);
              }}
              onBlur={() => {
                typingBlurTimerRef.current = setTimeout(() => {
                  setIsTypingMode(false);
                }, 180);
              }}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Enter') {
                  const currentTxt = (assistantUserQueryRef.current || assistantUserQuery).trim();
                  if (currentTxt.length > 0 || chatAttachedImage) {
                    handleSendChatMessage(currentTxt, false);
                  }
                }
              }}
              onSubmitEditing={() => {
                const currentTxt = (assistantUserQueryRef.current || assistantUserQuery).trim();
                if (currentTxt.length > 0 || chatAttachedImage) {
                  handleSendChatMessage(currentTxt, false);
                }
              }}
              onChangeText={txt => {
                if (txt.includes('\n')) {
                  const cleanQuery = txt.replace(/\n+/g, ' ').trim();
                  assistantUserQueryRef.current = cleanQuery;
                  if (cleanQuery.length > 0 || chatAttachedImage) {
                    handleSendChatMessage(cleanQuery, false);
                  } else {
                    assistantUserQueryRef.current = '';
                    setAssistantUserQuery('');
                  }
                  return;
                }
                assistantUserQueryRef.current = txt;
                setAssistantUserQuery(txt);
                setTypingPulseCount(c => c + 1);
              }}
            />

            {assistantUserQuery.trim().length > 0 || chatAttachedImage ? (
              <TouchableOpacity
                style={styles.soraUpArrowSendBtn}
                delayPressIn={0}
                onTouchStart={() =>
                  handleSendChatMessage(assistantUserQueryRef.current || assistantUserQuery, false)
                }
                onPressIn={() =>
                  handleSendChatMessage(assistantUserQueryRef.current || assistantUserQuery, false)
                }
                onPress={() =>
                  handleSendChatMessage(assistantUserQueryRef.current || assistantUserQuery, false)
                }
                activeOpacity={0.85}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
                <Svg width={16} height={16} viewBox="0 0 18 18">
                  <Line
                    x1="9"
                    y1="14"
                    x2="9"
                    y2="4"
                    stroke="#121417"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <Path
                    d="M4.5 8.5L9 4L13.5 8.5"
                    stroke="#121417"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.largeBarActionBtnMic,
                  (isSpeakingWithElevenLabs || isListeningToUserVoice) &&
                    styles.largeBarActionBtnMicActive,
                ]}
                onPress={handleToggleVoiceInteraction}
                activeOpacity={0.85}
              >
                <TreegohIcon
                  name="voz_botanica"
                  size={18}
                  color={
                    isSpeakingWithElevenLabs || isListeningToUserVoice ? '#181A20' : '#86EFAC'
                  }
                  glow={isSpeakingWithElevenLabs || isListeningToUserVoice}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.assistantVoiceHintText, { marginTop: 6 }]} pointerEvents="none">
            {isListeningToUserVoice
              ? 'Escuchando tu voz · El cardumen reacciona en tiempo real'
              : isSpeakingWithElevenLabs
              ? 'Asistente hablando con ElevenLabs · Toca el micrófono para detener'
              : chatAttachedImage
              ? 'Escribe una pregunta sobre la foto o pulsa la flecha para diagnosticar'
              : 'Pulsa + para desplegar cámara o elegir de galería, o habla por voz'}
          </Text>
        </View>
      </View>
    );
  };

  // ============================================================================
  // PÁGINA 2: MICROCLIMAS (ESTUDIO SOLAR & TELEMETRÍA DE ESPACIOS)
  // ============================================================================
  const renderMicroclimasPage = () => (
    <ScrollView
      style={styles.screenRoot}
      contentContainerStyle={[
        styles.scrollContainer,
        { paddingTop: safeTop + 8, paddingBottom: safeBottom + 88 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.tabSectionHeaderBlock}>
        <Text style={styles.tabSectionTitle}>Estudio Solar & Espacios</Text>
        <Text style={styles.tabSectionSub}>
          Calibración biométrica de luz, rumbo cardinal y habitabilidad foliar (VPD) en {onboardingData.location.city || 'Madrid'}.
        </Text>
      </View>

      {/* Tarjeta Brújula y Orientación Cardinal Activa */}
      <View style={styles.compassHeroCard}>
        <GlassCardSheen />
        <View style={styles.compassTopRow}>
          <View style={styles.compassBadgePill}>
            <TreegohIcon name="brujula_solar" size={15} color="#FFFFFF" glow={false} />
            <Text style={styles.compassBadgeText}>
              {activeSpace.orientation || 'Sur'} ({activeSpace.headingDegrees || 180}°)
            </Text>
          </View>
          <Text style={styles.compassRoomTitle}>{activeSpace.name}</Text>
        </View>

        <View style={styles.compassVisualWrap}>
          <View style={styles.compassCircleOuter}>
            <View style={styles.compassCircleInner}>
              <TreegohIcon name="brujula_solar" size={32} color="#FFFFFF" glow={true} />
              <Text style={styles.compassDegreeNum}>{activeSpace.headingDegrees || 180}°</Text>
              <Text style={styles.compassCardinalLabel}>{activeSpace.orientation || 'Sur'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.compassMetricsGrid}>
          <View style={styles.compassMetricCell}>
            <Text style={styles.compassMetricVal}>~{(activeSpace.estimatedLux || 3200).toLocaleString()}</Text>
            <Text style={styles.compassMetricSub}>Lux estimados</Text>
          </View>
          <View style={styles.compassMetricDivider} />
          <View style={styles.compassMetricCell}>
            <Text style={styles.compassMetricVal}>{activeSpace.habitabilityScore || 92}/100</Text>
            <Text style={styles.compassMetricSub}>Score VPD</Text>
          </View>
          <View style={styles.compassMetricDivider} />
          <View style={styles.compassMetricCell}>
            <Text style={styles.compassMetricVal}>
              {activeSpace.windowDistance === 'junto_a_ventana'
                ? '< 1 m'
                : activeSpace.windowDistance === 'media_distancia'
                ? '1–2.5 m'
                : '> 3 m'}
            </Text>
            <Text style={styles.compassMetricSub}>A ventana</Text>
          </View>
        </View>
      </View>

      {/* Lista de todos los microclimas registrados en el hogar */}
      <View style={styles.allSpacesListBlock}>
        <View style={styles.allSpacesListHeaderRow}>
          <Text style={styles.allSpacesListTitle}>Espacios del hogar ({customSpacesList.length})</Text>
          <TouchableOpacity
            style={styles.addSpaceSmallPill}
            onPress={() => {
              triggerHaptic();
              setIsAddSpaceModalOpen(true);
            }}
            activeOpacity={0.8}
          >
            <TreegohIcon name="mas" size={13} color="#2C2A28" glow={false} />
            <Text style={styles.addSpaceSmallPillText}>Añadir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.allSpacesCardsCol}>
          {(customSpacesList || []).map((sp, idx) => {
            const isSelected = idx === selectedSpaceIndex;
            const count = (plantsBySpace[sp.name] || []).length;
            return (
              <TouchableOpacity
                key={sp.id || sp.name}
                style={[styles.allSpaceCardItem, isSelected && styles.allSpaceCardItemSelected]}
                onPress={() => {
                  triggerHaptic();
                  setSelectedSpaceIndex(idx);
                }}
                activeOpacity={0.82}
              >
                <GlassCardSheen selected={isSelected} />
                <View style={styles.allSpaceCardTopRow}>
                  <View style={styles.allSpaceCardLeft}>
                    <View style={styles.allSpaceCardIconWrap}>
                      <TreegohIcon name="espacios_microclimas" size={20} color="#FFFFFF" glow={isSelected} />
                    </View>
                    <View style={styles.allSpaceCardTexts}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.allSpaceCardName}>{sp.name}</Text>
                        {isSelected && (
                          <View style={styles.activeSpaceDotPill}>
                            <Text style={styles.activeSpaceDotText}>Activo</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.allSpaceCardSub}>
                        {sp.roomType} · {sp.orientation || 'Sur'} · {count} {count === 1 ? 'planta' : 'plantas'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.allSpaceRightWrap}>
                    <View style={styles.allSpaceScoreWrap}>
                      <Text style={styles.allSpaceScoreNum}>{sp.habitabilityScore || 92}</Text>
                      <Text style={styles.allSpaceScoreSub}>VPD</Text>
                    </View>
                    {customSpacesList.length > 1 && (
                      <TouchableOpacity
                        style={styles.deleteSpaceListItemBtn}
                        onPress={e => {
                          e.stopPropagation?.();
                          handleDeleteSpace(idx);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.7}
                      >
                        <TreegohIcon name="menos" size={12} color="rgba(255, 255, 255, 0.45)" glow={false} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* BOTÓN DIRECTO: AÑADIR PLANTA A ESTE MICROCLIMA */}
                <View style={styles.allSpaceCardBottomActionsRow}>
                  <TouchableOpacity
                    style={styles.addPlantToThisSpaceBtn}
                    onPress={e => {
                      e.stopPropagation?.();
                      triggerHaptic();
                      setSelectedSpaceIndex(idx);
                      setIsAddPlantModalOpen(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <TreegohIcon name="mas" size={11} color="#86EFAC" glow={false} />
                    <Text style={styles.addPlantToThisSpaceText}>Añadir planta a {sp.name}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  // ============================================================================
  // PÁGINA 2: ESCÁNER ÓPTICO IA (LABORATORIO EN BURBUJA & DIAGNÓSTICO)
  // ============================================================================
  const renderEscanerOpticoPage = () => (
    <ScrollView
      style={styles.screenRoot}
      contentContainerStyle={[
        styles.scrollContainer,
        { paddingTop: safeTop + 8, paddingBottom: safeBottom + 88 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.tabSectionHeaderBlock}>
        <Text style={styles.tabSectionTitle}>Visor Óptico Botánico</Text>
        <Text style={styles.tabSectionSub}>
          Reconocimiento biométrico foliar y validación de microclima con inteligencia artificial.
        </Text>
      </View>

      {/* Tarjeta Visor Limpio con Esquinas Redondeadas (Estilo Cal AI) */}
      <View style={styles.opticalScannerCard}>
        <GlassCardSheen />

        {/* Indicativo de luz muy discreto y en baja opacidad */}
        <View style={styles.discreetScannerTelemetryRow}>
          <View style={styles.discreetScannerDot} />
          <Text style={styles.discreetScannerTelemetryText}>
            {activeSpace.orientation || 'Sur'} ({activeSpace.headingDegrees || 180}°) · ~{(activeSpace.estimatedLux || 3200).toLocaleString()} lx
          </Text>
        </View>

        <View style={styles.cleanBracketPreviewBox}>
          <Svg width={132} height={96} viewBox="0 0 132 96">
            <Path
              d="M 2 26 L 2 14 Q 2 2 14 2 L 26 2 M 106 2 L 118 2 Q 130 2 130 14 L 130 26 M 2 70 L 2 82 Q 2 94 14 94 L 26 94 M 106 94 L 118 94 Q 130 94 130 82 L 130 70"
              stroke="rgba(255, 255, 255, 0.82)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
          <View style={styles.cleanBracketCenterIcon}>
            <TreegohIcon name="camara_diagnostica" size={26} color="rgba(255, 255, 255, 0.88)" glow={false} />
          </View>
        </View>

        <Text style={styles.opticalCardHeadline}>Cámara en Burbuja Integrada</Text>
        <Text style={styles.opticalCardSubline}>
          Despliega el visor limpio con lentes .5x, 1x y 2x sin salir de la pantalla para identificar tu planta y analizar su luz en «{activeSpace.name}».
        </Text>

        <View style={styles.opticalActionButtonsRow}>
          <TouchableOpacity
            style={styles.opticalPrimaryScanBtn}
            onPress={() => {
              triggerHaptic();
              setBubbleCameraMode('add_plant');
              setIsBubbleCameraOpen(true);
            }}
            activeOpacity={0.85}
          >
            <TreegohIcon name="camara_diagnostica" size={17} color="#121417" glow={false} />
            <Text style={styles.opticalPrimaryScanBtnText}>Desplegar Cámara</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.opticalSecondaryGalleryBtn}
            onPress={async () => {
              triggerHaptic();
              try {
                const ImagePicker = await import('expo-image-picker');
                const res = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ['images'],
                  allowsEditing: true,
                  aspect: [4, 3],
                  quality: 0.65,
                  base64: true,
                });
                if (!res.canceled && res.assets && res.assets[0]?.uri && res.assets[0]?.base64) {
                  handlePickGalleryForAi(res.assets[0].uri, res.assets[0].base64);
                }
              } catch (_e) {}
            }}
            activeOpacity={0.8}
          >
            <TreegohIcon name="galeria_evolucion" size={16} color="#FFFFFF" glow={false} />
            <Text style={styles.opticalSecondaryGalleryBtnText}>Subir de Galería</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4 Pilares del Diagnóstico en Grilla 2x2 */}
      <View style={styles.careGridSection}>
        <Text style={styles.sectionTitle}>Qué analiza el visor óptico</Text>
        <View style={styles.careGrid2x2}>
          <View style={styles.careCard}>
            <GlassCardSheen />
            <View style={styles.careCardTop}>
              <TreegohIcon name="biblia_plantas" size={24} color="#FFFFFF" glow={true} />
            </View>
            <View style={styles.careCardBottom}>
              <Text style={styles.careCardTitle}>Taxonomía Real</Text>
              <Text style={styles.careCardSub}>Identificación de especie botánica y familia taxonómica.</Text>
            </View>
          </View>

          <View style={styles.careCard}>
            <GlassCardSheen />
            <View style={styles.careCardTop}>
              <TreegohIcon name="luz_natural" size={24} color="#FFFFFF" glow={true} />
            </View>
            <View style={styles.careCardBottom}>
              <Text style={styles.careCardTitle}>Cotejo Lumínico</Text>
              <Text style={styles.careCardSub}>Verifica si tolera los Lux del espacio antes de colocarla.</Text>
            </View>
          </View>

          <View style={styles.careCard}>
            <GlassCardSheen />
            <View style={styles.careCardTop}>
              <TreegohIcon name="toxicidad_mascotas" size={24} color="#FFFFFF" glow={true} />
            </View>
            <View style={styles.careCardBottom}>
              <Text style={styles.careCardTitle}>Filtro ASPCA</Text>
              <Text style={styles.careCardSub}>Evalúa la seguridad toxicológica para mascotas del hogar.</Text>
            </View>
          </View>

          <View style={styles.careCard}>
            <GlassCardSheen />
            <View style={styles.careCardTop}>
              <TreegohIcon name="riego_hidratacion" size={24} color="#FFFFFF" glow={true} />
            </View>
            <View style={styles.careCardBottom}>
              <Text style={styles.careCardTitle}>Pauta VPD</Text>
              <Text style={styles.careCardSub}>Calcula el ritmo de absorción hídrica según transpiración.</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // ============================================================================
  // PÁGINA 3: BIBLIA BOTÁNICA (CATÁLOGO DE ESPECIES & CUIDADOS CON TYPESENSE)
  // ============================================================================
  const { typesenseResult, filteredEncyclopediaSpecies } = useMemo(() => {
    const res = searchBotanicalSync(bibliaSearchQuery, {
      category: bibliaActiveCategory,
      typoTolerance: true,
    });
    const list = (res?.hits || [])
      .map(h => h?.document)
      .filter((doc): doc is typeof BOTANICAL_DATABASE[number] => Boolean(doc && doc.commonName));
    return { typesenseResult: res, filteredEncyclopediaSpecies: list };
  }, [bibliaSearchQuery, bibliaActiveCategory]);

  const renderBibliaBotanicaPage = () => {
    try {
      const filteredSpecies = filteredEncyclopediaSpecies;
      const visibleSpecies = filteredSpecies.slice(0, bibliaDisplayLimit);

      return (
        <ScrollView
          style={styles.screenRoot}
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingTop: safeTop + 8, paddingBottom: safeBottom + 88 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tabSectionHeaderBlock}>
            <Text style={styles.tabSectionTitle}>Enciclopedia Botánica</Text>
            <Text style={styles.tabSectionSub}>
              Monografías científicas, morfología e imágenes reales de especies vegetales validadas con ciencia abierta.
            </Text>
          </View>

          {/* Banner de Repositorios Científicos Abiertos Conectados */}
          <View style={styles.scientificRepoBannerCard}>
            <GlassCardSheen />
            <View style={styles.scientificRepoBannerTop}>
              <TreegohIcon name="galeria_evolucion" size={16} color="#86EFAC" glow={false} />
              <Text style={styles.scientificRepoBannerTitle}>Repositorios de Imágenes Reales & Ciencia</Text>
            </View>
            <Text style={styles.scientificRepoBannerSub}>
              Fotografías taxonómicas, fenología y diagnóstico foliar de Wikimedia Commons, Pl@ntNet-300K, Ag Image Repository (AgIR / USDA ARS & NC State), PlantVillage y PhyloPic.
            </Text>
            <View style={styles.scientificRepoChipsRow}>
              <View style={styles.repoMiniChip}>
                <View style={styles.repoMiniChipDot} />
                <Text style={styles.repoMiniChipText}>Wikimedia Commons</Text>
              </View>
              <View style={styles.repoMiniChip}>
                <View style={styles.repoMiniChipDot} />
                <Text style={styles.repoMiniChipText}>Pl@ntNet-300K</Text>
              </View>
              <View style={styles.repoMiniChip}>
                <View style={styles.repoMiniChipDot} />
                <Text style={styles.repoMiniChipText}>AgIR · USDA ARS</Text>
              </View>
              <View style={styles.repoMiniChip}>
                <View style={styles.repoMiniChipDot} />
                <Text style={styles.repoMiniChipText}>PlantVillage</Text>
              </View>
              <View style={styles.repoMiniChip}>
                <View style={styles.repoMiniChipDot} />
                <Text style={styles.repoMiniChipText}>PhyloPic</Text>
              </View>
            </View>
          </View>

          {/* Buscador interactivo */}
          <View style={styles.bibliaSearchBox}>
            <TreegohIcon name="busqueda_typesense" size={17} color="#FFFFFF" glow={false} />
            <TextInput
              style={styles.bibliaSearchInput}
              placeholder="Buscar especie (ej: Monstera, Pothos, Calathea, Ficus)..."
              placeholderTextColor="rgba(255, 255, 255, 0.42)"
              value={bibliaSearchQuery}
              onChangeText={setBibliaSearchQuery}
              autoCorrect={false}
            />
            {bibliaSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setBibliaSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Metadatos de motor Typesense */}
          <View style={styles.typesenseMetaRow}>
            <TreegohIcon name="busqueda_typesense" size={13} color="#86EFAC" glow={false} />
            <Text style={styles.typesenseMetaText}>
              Typesense: {filteredSpecies.length} {filteredSpecies.length === 1 ? 'especie' : 'especies'}
              {bibliaSearchQuery.trim().length > 0 ? ` · ${typesenseResult?.search_time_ms ?? 0} ms (tolerancia a erratas activa)` : ' disponibles'}
            </Text>
          </View>

          {/* Filtros de Categoría Taxonómicos y de Requerimientos */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bibliaFiltersRow}>
            {[
              { id: 'todas', label: `Todas (${BOTANICAL_DATABASE.length})` },
              { id: 'mascotas', label: 'Seguras Mascotas (ASPCA)' },
              { id: 'tropical', label: 'Tropicales & Aráceas' },
              { id: 'suculenta', label: 'Suculentas & Cactus' },
              { id: 'helecho', label: 'Helechos & Calatheas' },
              { id: 'flor', label: 'Flores & Orquídeas' },
              { id: 'palmera', label: 'Palmeras' },
              { id: 'trepadora', label: 'Trepadoras & Potos' },
              { id: 'baja_luz', label: 'Baja Luz (<800 lx)' },
              { id: 'indirecta', label: 'Luz Indirecta' },
              { id: 'faciles', label: 'Riego Espaciado' },
              { id: 'principiantes', label: 'Principiantes' },
            ].map(cat => {
              const isSelected = bibliaActiveCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.bibliaFilterChip, isSelected && styles.bibliaFilterChipActive]}
                  onPress={() => {
                    triggerHaptic();
                    setBibliaActiveCategory(cat.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.bibliaFilterChipText, isSelected && styles.bibliaFilterChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Grid de Especies Interactivas con Monografías y Fotografía Real */}
          <View style={styles.bibliaSpeciesGrid}>
            {visibleSpecies.map((sp, idx) => {
              const minL = Number(sp?.minLux) || 800;
              const maxL = Number(sp?.maxLux) || 2500;
              return (
                <TouchableOpacity
                  key={`biblia_${sp?.id || idx}_${idx}`}
                  style={styles.bibliaSpeciesCard}
                  onPress={() => {
                    triggerHaptic();
                    setSelectedSpeciesForMonograph(sp);
                  }}
                  activeOpacity={0.88}
                >
                  <GlassCardSheen />
                  <BotanicalImage
                    uri={sp?.imageUrl}
                    scientificName={sp?.scientificName}
                    commonName={sp?.commonName || 'Especie'}
                    showRepositoryBadge={true}
                    style={styles.bibliaSpeciesThumb}
                  />
                  <View style={styles.bibliaSpeciesInfoCol}>
                    <View style={styles.bibliaSpeciesTopRow}>
                      <Text style={styles.bibliaSpeciesCommon} numberOfLines={1}>
                        {sp?.commonName || 'Especie'}
                      </Text>
                      {sp?.isPetSafe ? (
                        <View style={styles.petFriendlyBadge}>
                          <Text style={styles.petFriendlyBadgeText}>ASPCA</Text>
                        </View>
                      ) : (
                        <View style={styles.petWarningBadge}>
                          <Text style={styles.petWarningBadgeText}>Tóxica</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.bibliaSpeciesScientific} numberOfLines={1}>
                      {sp?.scientificName || ''} {sp?.family ? `· ${sp.family}` : ''}
                    </Text>
                    <Text style={styles.bibliaSpeciesTrait} numberOfLines={2}>
                      {sp?.trait || ''}
                    </Text>

                    <View style={styles.bibliaSpeciesFooterRow}>
                      <View style={styles.bibliaLuxPill}>
                        <TreegohIcon name="sensor_lux" size={12} color="#FFFFFF" glow={false} />
                        <Text style={styles.bibliaLuxText}>
                          {minL.toLocaleString()}–{maxL.toLocaleString()} lx
                        </Text>
                      </View>

                      <View style={styles.bibliaExplorePill}>
                        <TreegohIcon name="biblia_plantas" size={11} color="#A7F3D0" glow={false} />
                        <Text style={styles.bibliaExplorePillText}>Monografía</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.bibliaAddPillBtn}
                        onPress={e => {
                          e.stopPropagation?.();
                          handleOpenSpacePickerForSpecies(sp, false);
                        }}
                        activeOpacity={0.85}
                      >
                        <TreegohIcon name="mas" size={11} color="#2C2A28" glow={false} />
                        <Text style={styles.bibliaAddPillBtnText}>Añadir</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botón para cargar más especies si hay más disponibles */}
          {filteredSpecies.length > bibliaDisplayLimit && (
            <TouchableOpacity
              style={styles.loadMoreSpeciesBtn}
              onPress={() => {
                triggerHaptic();
                setBibliaDisplayLimit(prev => prev + 25);
              }}
              activeOpacity={0.82}
            >
              <GlassCardSheen />
              <TreegohIcon name="mas" size={14} color="#FFFFFF" glow={false} />
              <Text style={styles.loadMoreSpeciesBtnText}>
                Cargar más especies ({visibleSpecies.length} de {filteredSpecies.length})
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      );
    } catch (_err) {
      return (
        <View style={[styles.screenRoot, { paddingTop: safeTop + 40, alignItems: 'center', paddingHorizontal: 24 }]}>
          <Text style={styles.tabSectionTitle}>Enciclopedia Botánica</Text>
          <Text style={[styles.tabSectionSub, { marginTop: 12, textAlign: 'center' }]}>
            Sincronizando enciclopedia botánica con Typesense...
          </Text>
          <TouchableOpacity
            style={[styles.loadMoreSpeciesBtn, { marginTop: 24 }]}
            onPress={() => setBibliaSearchQuery('')}
          >
            <Text style={styles.loadMoreSpeciesBtnText}>Restablecer búsqueda</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  // ============================================================================
  // PÁGINA 4: SANTUARIO ZEN (SOUNDSCAPES & RESPIRACIÓN CIRCADIANA)
  // ============================================================================
  const renderSantuarioZenPage = () => (
    <ScrollView
      style={styles.screenRoot}
      contentContainerStyle={[
        styles.scrollContainer,
        { paddingTop: safeTop + 8, paddingBottom: safeBottom + 88 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.tabSectionHeaderBlock}>
        <Text style={styles.tabSectionTitle}>Santuario Zen</Text>
        <Text style={styles.tabSectionSub}>
          Bioacústica vegetal, paisajes sonoros circadianos y respiración consciente para el hogar.
        </Text>
      </View>

      {/* Tarjeta Halo de Respiración Circular */}
      <View style={styles.zenBreathCard}>
        <GlassCardSheen />
        <View style={styles.zenBreathHaloOuter}>
          <Animated.View
            style={[
              styles.zenBreathHaloPulse,
              {
                transform: [{ scale: zenPulseAnim }],
              },
            ]}
          />
          <View style={styles.zenBreathCenterCircle}>
            <TreegohIcon name="sonido_soundscapes" size={30} color="#FFFFFF" glow={true} />
            <Text style={styles.zenBreathPhaseText}>{isZenActive ? zenBreathPhase : 'Respira'}</Text>
            <Text style={styles.zenBreathSubText}>{isZenActive ? `${zenDuration} min sesión` : 'Toca para iniciar'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.zenActionBtn}
          onPress={() => {
            triggerHaptic(true);
            setIsZenActive(prev => !prev);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.zenActionBtnText}>
            {isZenActive ? 'Pausar respiración' : 'Iniciar respiración vegetal'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Paisajes Sonoros (SOUND_SCENES) */}
      <View style={styles.careGridSection}>
        <Text style={styles.sectionTitle}>Paisajes sonoros naturales</Text>
        <View style={styles.zenScenesGrid}>
          {SOUND_SCENES.map(scene => {
            const isSelected = activeZenScene.id === scene.id;
            return (
              <TouchableOpacity
                key={scene.id}
                style={[styles.zenSceneCard, isSelected && styles.zenSceneCardSelected]}
                onPress={() => {
                  triggerHaptic();
                  setActiveZenScene(scene);
                  setIsSoundscapeModalOpen(true);
                }}
                activeOpacity={0.84}
              >
                <GlassCardSheen selected={isSelected} />
                <View style={styles.zenSceneIconWrap}>
                  <TreegohIcon name={scene.icon} size={22} color="#FFFFFF" glow={isSelected} />
                </View>
                <View style={styles.zenSceneTextCol}>
                  <Text style={styles.zenSceneTitle}>{scene.name}</Text>
                  <Text style={styles.zenSceneDesc} numberOfLines={2}>
                    {scene.description}
                  </Text>
                </View>
                <View style={styles.zenPlayCircleBtn}>
                  <TreegohIcon name="sonido_soundscapes" size={13} color="#FFFFFF" glow={false} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <CircadianBackground
      coords={onboardingData.location}
      theme={theme}
      currentTime={currentTime}
      weatherCondition={liveWeather?.condition || 'despejado'}
    >
      {/* CAPA DE OSCURECIMIENTO DINÁMICO DEL 85% AL PASAR AL ASISTENTE */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: '#040507',
            opacity: assistantDarkOverlayOpacity,
            zIndex: 0,
          },
        ]}
      />

      {/* CARRUSEL HORIZONTAL TIPO SLIDE QUE CONTIENE LAS 4 PÁGINAS: INICIO, EXPERTO, ESPACIOS, ENCICLOPEDIA */}
      <Animated.ScrollView
        ref={horizontalNavScrollRef}
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        onScroll={handleNavScroll}
        onMomentumScrollEnd={handleNavMomentumEnd}
        scrollEventThrottle={16}
        style={styles.horizontalNavSlider}
      >
        <Animated.View style={getPageAnimatedStyle(0)}>{renderSantuarioPage()}</Animated.View>
        <Animated.View style={getPageAnimatedStyle(1)}>
          {visitedTabs[1] ? renderAsistentePage() : null}
        </Animated.View>
        <Animated.View style={getPageAnimatedStyle(2)}>
          {visitedTabs[2] ? renderMicroclimasPage() : null}
        </Animated.View>
        <Animated.View style={getPageAnimatedStyle(3)}>
          {visitedTabs[3] ? renderBibliaBotanicaPage() : null}
        </Animated.View>
      </Animated.ScrollView>

      {/* BARRA FLOTANTE DE NAVEGACIÓN CON EFECTO BLOB Y GLASS */}
      <FloatingBlobNavBar
        tabs={NAVIGATION_TABS}
        activeIndex={activeNavTab}
        onTabPress={handleNavTabPress}
        scrollX={navScrollX}
        pageWidth={windowWidth}
        bottomInset={insets.bottom}
      />

      {/* MODAL BOTTOM SHEET: AÑADIR PLANTA */}
      <AddPlantModal
        visible={isAddPlantModalOpen}
        activeSpace={activeSpace}
        spaces={customSpacesList}
        safetyFilter={onboardingData?.safetyFilter}
        theme={theme}
        currentTime={currentTime}
        weatherCondition={liveWeather?.condition || 'despejado'}
        coords={onboardingData.location}
        onClose={() => setIsAddPlantModalOpen(false)}
        onOpenBubbleCamera={targetSpaceName => {
          if (targetSpaceName) {
            cameraTargetSpaceNameRef.current = targetSpaceName;
          }
          setBubbleCameraMode('add_plant');
          setIsBubbleCameraOpen(true);
        }}
        onPickGalleryForAi={(imgUri, b64, targetSpaceName) => {
          if (targetSpaceName) {
            cameraTargetSpaceNameRef.current = targetSpaceName;
          }
          handlePickGalleryForAi(imgUri, b64);
        }}
        onPlantAdded={handleAddPlant}
        onRequestCreateSpace={() => {
          setIsAddPlantModalOpen(false);
          setIsAddSpaceModalOpen(true);
        }}
      />

      {/* MODAL DETALLE DE PLANTA INDIVIDUAL (REGISTRO DE RIEGO, LUZ Y SEGURIDAD) */}
      <PlantDetailModal
        plant={selectedPlantForDetail}
        spaceLux={activeSpace.estimatedLux}
        onClose={() => setSelectedPlantForDetail(null)}
        onWaterPlant={handleWaterPlant}
        onDeletePlant={handleDeletePlant}
        onRelocatePlant={plant => {
          setSelectedPlantForDetail(null);
          setTimeout(() => {
            handleOpenSpacePickerForSpecies(plant, true);
          }, 180);
        }}
        onReScanPlantWithCamera={() => {
          setSelectedPlantForDetail(null);
          setBubbleCameraMode('add_plant');
          setIsBubbleCameraOpen(true);
        }}
        onOpenScientificMonograph={userPlant => {
          setSelectedPlantForDetail(null);
          const found =
            BOTANICAL_DATABASE.find(
              b =>
                b.scientificName.toLowerCase() === userPlant.scientificName.toLowerCase() ||
                b.commonName.toLowerCase() === userPlant.commonName.toLowerCase()
            ) || {
              id: userPlant.id,
              commonName: userPlant.commonName,
              scientificName: userPlant.scientificName,
              family: userPlant.family,
              imageUrl: userPlant.imageUrl,
              minLux: 800,
              maxLux: 4500,
              isPetSafe: userPlant.isPetSafe,
              wateringIntervalDays: userPlant.daysUntilNextWatering || 7,
              wateringAdviceVPD: userPlant.lightCompatibilityNote || 'Cuidado botánico calibrado.',
              trait: userPlant.trait || 'Especie botánica.',
              suitableRooms: [userPlant.spaceName],
              difficulty: 'intermedio',
              category: 'tropical',
            };
          setTimeout(() => {
            setSelectedSpeciesForMonograph(found);
          }, 180);
        }}
      />

      {/* MODAL SELECTOR INTELIGENTE DE ESPACIO DE DESTINO CON AFINIDAD LUMÍNICA */}
      <SpaceDestinationPickerModal
        visible={isSpacePickerOpen}
        plant={plantForSpacePlacement}
        spaces={customSpacesList}
        currentSpaceName={activeSpace?.name}
        actionTitle={pickerActionTitle}
        theme={theme}
        currentTime={currentTime}
        weatherCondition={liveWeather?.condition || 'despejado'}
        coords={onboardingData.location}
        onClose={() => {
          setIsSpacePickerOpen(false);
          setPlantForSpacePlacement(null);
          setRelocatingPlantId(null);
        }}
        onSelectSpace={handleConfirmPlaceInSpace}
        onRequestCreateSpace={() => {
          setIsSpacePickerOpen(false);
          setIsAddSpaceModalOpen(true);
        }}
      />

      {/* MODAL DETALLE DE MONOGRAFÍA CIENTÍFICA BOTÁNICA DE LA ENCICLOPEDIA */}
      <SpeciesEncyclopediaDetailModal
        visible={Boolean(selectedSpeciesForMonograph)}
        species={selectedSpeciesForMonograph}
        activeSpaceName={activeSpace?.name || 'Salón'}
        activeSpaceLux={activeSpace?.estimatedLux || 3200}
        onClose={() => setSelectedSpeciesForMonograph(null)}
        onAddSpeciesToSpace={(sp, resolvedHeroUrl) => {
          setSelectedSpeciesForMonograph(null);
          setTimeout(() => {
            handleOpenSpacePickerForSpecies(
              {
                ...sp,
                imageUrl: resolvedHeroUrl || sp?.imageUrl || '',
              },
              false
            );
          }, 180);
        }}
      />

      {/* MODAL PARA CREAR UN NUEVO ESPACIO EN EL HOGAR */}
      {/* ESTUDIO COMPLETO DE CREACIÓN Y CALIBRACIÓN DE ESPACIOS (SLIDE-IN 2026) */}
      <CreateSpaceStudioModal
        visible={isAddSpaceModalOpen}
        onClose={() => setIsAddSpaceModalOpen(false)}
        onSaveSpace={handleSaveNewSpaceFromStudio}
        userLocation={onboardingData?.location}
        userCity={onboardingData?.location?.city || 'Madrid'}
      />

      {/* VISOR ÓPTICO EN BURBUJA ESTILO BITEPAL CONECTADO A OPENROUTER IA */}
      <BotanicalCameraBubbleModal
        visible={isBubbleCameraOpen}
        isAnalyzing={isAiAnalyzing}
        liveHeadingDegrees={activeSpace.headingDegrees || 180}
        liveCompassLabel={activeSpace.orientation || 'Sur'}
        estimatedLux={activeSpace.estimatedLux || 3200}
        onClose={() => setIsBubbleCameraOpen(false)}
        onCaptureFrame={handleCaptureFromBubble}
        onPickGalleryInsideModal={async () => {
          // Si el usuario presiona la galería dentro del visor
          const ImagePicker = await import('expo-image-picker');
          const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.65,
            base64: true,
          });

          if (!res.canceled && res.assets && res.assets[0]?.uri && res.assets[0]?.base64) {
            await handleCaptureFromBubble({
              uri: res.assets[0].uri,
              base64: res.assets[0].base64,
              mimeType: 'image/jpeg',
            });
          }
        }}
      />

      {/* MODAL DE PERFIL Y AJUSTES DEL SANTUARIO (SECCIÓN A PANTALLA COMPLETA 2026) */}
      <UserProfileModal
        visible={isProfileModalOpen}
        onboardingData={onboardingData}
        onClose={() => setIsProfileModalOpen(false)}
        onResetOnboarding={onResetForTest}
        previewPhase={circadianPreviewPhase}
        onSelectPreviewPhase={setCircadianPreviewPhase}
        theme={theme}
        currentTime={currentTime}
        weatherCondition={liveWeather?.condition || 'despejado'}
        coords={onboardingData.location}
        spacesCount={customSpacesList.length}
        totalPlantsCount={Object.values(plantsBySpace).reduce(
          (acc, list) => acc + (list?.length || 0),
          0
        )}
        onUpdateProfileName={newName => {
          if (onboardingData.account) {
            onboardingData.account.displayName = newName;
          }
        }}
        onUpdateProfilePhoto={newPhotoUri => {
          setUserPhotoUrl(newPhotoUri || null);
          if (onboardingData.account) {
            onboardingData.account.photoURL = newPhotoUri || null;
          }
        }}
      />

      {/* MODAL DE BIOACÚSTICA Y RESPIRACIÓN VEGETAL (ESTILO TIDE BOX BREATHING) */}
      <SoundscapePracticeModal
        visible={isSoundscapeModalOpen}
        onClose={() => setIsSoundscapeModalOpen(false)}
      />

      {/* MODAL DEL ASISTENTE BOTÁNICO CON INTELIGENCIA CONVERSACIONAL */}
      <BotanicalAssistantModal
        visible={isAssistantModalOpen}
        onClose={() => setIsAssistantModalOpen(false)}
        context={assistantContext}
      />
    </CircadianBackground>
  );
};

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    gap: 36,
  },
  // ==========================================
  // ESTILOS TIDE DASHBOARD (Referencia 2026 Mobbin)
  // ==========================================
  tideHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  tideGreetingCol: {
    flex: 1,
    gap: 6,
  },
  tideMainGreeting: {
    fontFamily: Fonts.light,
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  tideWeekdaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  tideWeatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tideWeatherPillText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.80)',
    letterSpacing: 0.1,
  },
  tideDayItem: {
    alignItems: 'center',
    minWidth: 16,
    gap: 4,
  },
  tideDayChar: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.45)',
  },
  tideDayCharActive: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  tideDayActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  tideTopRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tideGlassPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  tidePillDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  tideAvatarOrbBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tideAvatarOrbGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(253, 164, 175, 0.35)',
  },
  tideAvatarOrbInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 146, 60, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tideAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  tideAvatarInitials: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  tideQuoteSection: {
    marginTop: 22,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  tideAtmosphericHeroTitle: {
    fontFamily: Fonts.light,
    fontSize: 38,
    fontWeight: '200',
    color: 'rgba(255, 255, 255, 0.78)',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 10,
  },
  tideQuoteWrap: {
    paddingVertical: 6,
    gap: 10,
    alignItems: 'center',
  },
  tideQuoteAnimated: {
    fontFamily: Fonts.light,
    fontSize: 27,
    fontWeight: '300',
    color: '#FFFFFF',
    lineHeight: 39,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  tideQuoteEditorialDivider: {
    width: 28,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    alignSelf: 'center',
    marginVertical: 4,
  },
  tideQuoteAuthor: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  tideAtmosphericBreathingZone: {
    height: 28,
  },
  // ==========================================
  // ESTILOS CENTRO DE ALERTAS Y CUIDADOS CRÍTICOS
  // ==========================================
  fullBleedScroll: {
    marginHorizontal: -24,
  },
  careAlertsSection: {
    gap: 12,
  },
  careAlertsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  careAlertsTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  careAlertDotContainer: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  careAlertPulsePing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  careAlertPulseCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  careAlertPulseCoreActive: {
    backgroundColor: '#38BDF8',
  },
  careAlertPulseCoreEmergency: {
    backgroundColor: '#F87171',
  },
  careAlertPulseCoreQuiet: {
    backgroundColor: '#86EFAC',
  },
  careAlertsTitle: {
    fontFamily: Fonts.light,
    fontSize: 17,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  careAlertFilterChips: {
    paddingHorizontal: 24,
    gap: 8,
    paddingVertical: 4,
  },
  alertFilterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  alertFilterChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    borderColor: 'rgba(255, 255, 255, 0.65)',
  },
  alertFilterChipText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
  },
  alertFilterChipTextActive: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  careAlertsTrack: {
    paddingHorizontal: 24,
    gap: 14,
    paddingVertical: 6,
  },
  careAlertGlassCard: {
    width: 176,
    height: 136,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  careAlertCardEmergency: {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderColor: 'rgba(248, 113, 113, 0.45)',
  },
  careAlertCardWater: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(147, 197, 253, 0.38)',
  },
  careAlertCardPrune: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(253, 230, 138, 0.38)',
  },
  careAlertCardRepot: {
    backgroundColor: 'rgba(234, 88, 12, 0.08)',
    borderColor: 'rgba(251, 146, 60, 0.38)',
  },
  careAlertTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  careAlertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careAlertActionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  careAlertActionPillText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  careAlertBottomInfo: {
    gap: 3,
  },
  careAlertPlantTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  careAlertSubText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  careAlertsEmptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.35)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  careAlertsEmptyText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
    flex: 1,
    lineHeight: 17,
  },
  tideBottomActionsSection: {
    gap: 12,
  },
  tideNowHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tideNowHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tideNowSparkle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  tideNowLabel: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.3,
  },
  tideNowDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tideNowDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
  },
  tideNowDotActive: {
    width: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 2.5,
  },
  tideActionsRow: {
    gap: 14,
    paddingVertical: 6,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tideActionGlassCard: {
    width: 154,
    height: 156,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    padding: 18,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  tideActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tideActionTextWrap: {
    gap: 4,
  },
  tideActionTitle: {
    fontFamily: Fonts.light,
    fontSize: 15.5,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  tideActionSub: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
  },

  // ==========================================
  // ESTILOS ASISTENTE BOTÁNICO (PARTÍCULAS & CHAT)
  // ==========================================
  assistantParticlesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 20,
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
  },
  particleStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  particleStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  particleStatusDotActive: {
    backgroundColor: '#86EFAC',
  },
  particleStatusDotThinking: {
    backgroundColor: '#FDE68A',
  },
  particleStatusText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.90)',
  },
  // ==========================================
  // ESTILOS ASISTENTE BOTÁNICO (MINIMALISMO HYPELIST / SPOTIFY / CASH APP 2026)
  // ==========================================
  assistantDarkCanvas: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  assistantHypelistHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  assistantHypelistTitle: {
    fontFamily: Fonts.light,
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.90)',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  assistantResetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  assistantResetPillText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
  },
  assistantVoiceHeroWrap: {
    alignItems: 'center',
    gap: 18,
    paddingTop: 8,
    paddingHorizontal: 20,
    width: '100%',
  },
  assistantSwarmStageEmpty: {
    height: 60,
    width: '100%',
  },
  assistantVoiceHeroSection: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  assistantVoicePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 22,
    shadowColor: '#86EFAC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  assistantVoicePillBtnSpeaking: {
    backgroundColor: '#86EFAC',
    borderColor: '#86EFAC',
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  assistantVoicePillBtnThinking: {
    borderColor: 'rgba(253, 230, 138, 0.50)',
    backgroundColor: 'rgba(253, 230, 138, 0.12)',
  },
  assistantVoiceIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantVoicePillText: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  assistantVoicePillTextSpeaking: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#1A1816',
  },
  assistantVoiceHintText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.40)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  assistantIdleContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  assistantCenterHeroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 20,
    width: '100%',
    zIndex: 10,
  },
  screenLateralSeamCover: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 24,
    zIndex: 12,
  },
  assistantHeroGreetingBlock: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  assistantHeroGreetingTitle: {
    fontFamily: Fonts.light,
    fontSize: 27,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  assistantHeroGreetingSub: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 20,
  },
  assistantLargeCenterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  largeBarCameraBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeBarTextInput: {
    flex: 1,
    fontFamily: Fonts.light,
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '300',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
    minHeight: 32,
    maxHeight: 108,
  },
  largeBarActionBtnSend: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeBarActionBtnMic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeBarActionBtnMicActive: {
    backgroundColor: '#86EFAC',
    borderColor: '#86EFAC',
  },
  assistantSuggestionSection: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  assistantSuggestionHeader: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
    paddingHorizontal: 8,
    letterSpacing: 0.3,
  },
  assistantSuggestionCardsScroll: {
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  assistantSpotifyCard: {
    width: 178,
    height: 106,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 13,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  spotifyCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  spotifyCardTitle: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop: 4,
  },
  spotifyCardSub: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
    lineHeight: 15,
  },
  assistantDisclaimerText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.36)',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  assistantFeedWrap: {
    width: '100%',
    gap: 12,
    paddingBottom: 24,
  },

  // DOCK FLOTANTE MINIMALISTA + TARJETA DE FOTO ESTILO SORA 2 (Mobbin 2026)
  assistantFloatingDockContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 12,
  },
  soraImagePreviewStage: {
    width: '100%',
    height: 184,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  soraImageAmbientGlow: {
    position: 'absolute',
    width: '86%',
    height: 156,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#FDE68A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 36,
  },
  soraImageCard: {
    width: '100%',
    height: 184,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 20, 24, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.42,
    shadowRadius: 22,
    elevation: 12,
  },
  soraImagePreviewFull: {
    width: '100%',
    height: '100%',
  },
  soraImageDismissCircleBtn: {
    position: 'absolute',
    top: -8,
    right: -6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(38, 40, 46, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  dockPlusTriggerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockPlusTriggerBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  attachPlusMenuPopover: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: 12,
    zIndex: 40,
    width: 244,
    borderRadius: 24,
    backgroundColor: 'rgba(20, 23, 29, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 20,
    elevation: 12,
  },
  attachPlusMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  attachPlusMenuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachPlusMenuTextCol: {
    flex: 1,
    gap: 1,
  },
  attachPlusMenuTitle: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  attachPlusMenuSub: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.52)',
  },
  attachPlusMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 10,
  },
  soraUpArrowSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discreetScannerTelemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  discreetScannerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(134, 239, 172, 0.48)',
  },
  discreetScannerTelemetryText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.44)',
    letterSpacing: 0.2,
  },
  cleanBracketPreviewBox: {
    width: 132,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  cleanBracketCenterIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockImagePreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dockImageThumb: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dockImageLabel: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  dockImageRemoveBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  dockImageRemoveText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  assistantFloatingDockCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 60,
    maxHeight: 152,
    borderRadius: 28,
    backgroundColor: 'rgba(18, 22, 29, 0.86)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  dockCameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockTextInput: {
    flex: 1,
    fontFamily: Fonts.light,
    fontSize: 14.5,
    fontWeight: '300',
    color: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 0,
  },
  dockSendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockMicBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockMicBtnActive: {
    backgroundColor: '#86EFAC',
    borderColor: '#86EFAC',
  },
  spacesSection: {
    gap: 12,
  },
  spacesSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: Fonts.light,
    fontSize: 18,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
  },
  sectionCounter: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  spacesScrollContent: {
    paddingHorizontal: 24,
    gap: 10,
    paddingVertical: 2,
  },
  spaceTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    overflow: 'hidden',
  },
  spaceTabPillSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    borderColor: 'rgba(255, 255, 255, 0.70)',
  },
  spaceTabPillText: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  spaceTabPillTextSelected: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  spacePlantCountTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  spacePlantCountText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  spaceAddPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderStyle: 'dashed',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
    overflow: 'hidden',
  },
  spaceAddPillText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  activeSpaceHeroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    padding: 20,
    gap: 16,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitleCol: {
    flex: 1,
    gap: 4,
    paddingRight: 10,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#86EFAC',
  },
  heroBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: '#86EFAC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroSpaceName: {
    fontFamily: Fonts.light,
    fontSize: 22,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  heroVerdictText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
  },
  heroScoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScoreNum: {
    fontFamily: Fonts.light,
    fontSize: 20,
    fontWeight: '300',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  heroScoreLabel: {
    fontFamily: Fonts.light,
    fontSize: 10,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
  },
  heroMetricsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  heroMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  heroMetricVal: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  heroMetricLabel: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.52)',
  },
  heroHairline: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    marginHorizontal: 4,
  },
  plantsSectionWrap: {
    gap: 14,
  },
  plantsSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  plantsSectionTitleCol: {
    gap: 2,
    flex: 1,
  },
  plantsSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteSpaceMiniBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlantPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  addPlantPillText: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  emptySpaceCtaCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    padding: 24,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyCardTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptyCardSub: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: '90%',
  },
  emptyButtonInside: {
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  emptyButtonInsideText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  // ==========================================
  // ESTILOS DE GALERÍA BOTÁNICA AÉREA EN 2 COLUMNAS
  // ==========================================
  plantFiltersRow: {
    paddingHorizontal: 24,
    gap: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  plantFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    minHeight: 40,
    overflow: 'hidden',
  },
  plantFilterChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.65)',
  },
  plantFilterChipText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
    lineHeight: 18,
  },
  plantFilterChipTextActive: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  emptyFilteredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 16,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  emptyFilteredText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
    flex: 1,
  },
  plantsGrid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    width: '100%',
  },
  plantGridCard: {
    width: '48.2%',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
  },
  plantGridImageWrap: {
    width: '100%',
    height: 144,
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  plantGridThumb: {
    width: '100%',
    height: '100%',
  },
  plantGridGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  plantGridBadgeTopRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plantWaterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
  },
  plantWaterPillHydrated: {
    borderColor: 'rgba(134, 239, 172, 0.55)',
  },
  plantWaterPillUrgent: {
    borderColor: 'rgba(248, 113, 113, 0.75)',
    backgroundColor: 'rgba(220, 38, 38, 0.45)',
  },
  plantWaterPillNormal: {
    borderColor: 'rgba(147, 197, 253, 0.45)',
  },
  plantWaterPillText: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  plantGridRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  plantPetBadge: {
    backgroundColor: 'rgba(132, 169, 140, 0.35)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  plantPetBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 9,
    fontWeight: '300',
    color: '#A3D9B0',
  },
  plantTaskBadgePrune: {
    backgroundColor: 'rgba(253, 230, 138, 0.30)',
    padding: 3,
    borderRadius: 6,
  },
  plantTaskBadgeRepot: {
    backgroundColor: 'rgba(251, 146, 60, 0.30)',
    padding: 3,
    borderRadius: 6,
  },
  plantTaskBadgeEmergency: {
    backgroundColor: 'rgba(248, 113, 113, 0.35)',
    padding: 3,
    borderRadius: 6,
  },
  plantGridInfo: {
    padding: 11,
    gap: 3,
  },
  plantGridCommonName: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  plantGridSubtitle: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
    fontStyle: 'italic',
  },
  plantGridFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  plantGridStatusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  plantStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  plantStatusDotGreen: {
    backgroundColor: '#86EFAC',
  },
  plantStatusDotRed: {
    backgroundColor: '#F87171',
  },
  plantStatusDotBlue: {
    backgroundColor: '#93C5FD',
  },
  plantGridStatusText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
  },
  plantQuickWaterBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantQuickWaterBtnDone: {
    backgroundColor: 'rgba(134, 239, 172, 0.20)',
    borderColor: 'rgba(134, 239, 172, 0.50)',
  },
  plantGridFooterActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plantQuickDeleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlantSlotCard: {
    width: '48.2%',
    minHeight: 224,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    overflow: 'hidden',
  },
  addPlantSlotIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addPlantSlotTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  addPlantSlotSub: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.50)',
    textAlign: 'center',
  },
  allSpaceRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteSpaceListItemBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careGridSection: {
    gap: 14,
  },
  careGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  careCard: {
    width: '47.5%',
    minHeight: 145,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  careCardTop: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  careCardBottom: {
    gap: 4,
  },
  careCardTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  careCardSub: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
    lineHeight: 16,
  },
  testResetBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 10,
  },
  testResetText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  addSpaceCard: {
    width: '100%',
    backgroundColor: '#27292C',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    padding: 22,
    gap: 14,
    overflow: 'hidden',
  },
  addSpaceTitle: {
    fontFamily: Fonts.regular,
    fontSize: 18,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  addSpaceSub: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
  },
  spaceInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  roomTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomTypeChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  roomTypeChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.60)',
  },
  roomTypeChipText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
  },
  roomTypeChipTextActive: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  addSpaceBtnsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  confirmBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 18,
  },
  confirmBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#2C2A28',
  },
  horizontalNavSlider: {
    flex: 1,
  },
  tabSectionHeaderBlock: {
    marginBottom: 12,
    gap: 4,
  },
  tabSectionTitle: {
    fontFamily: Fonts.light,
    fontSize: 24,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  tabSectionSub: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.62)',
    lineHeight: 19,
  },
  compassHeroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    padding: 22,
    alignItems: 'center',
    gap: 18,
    overflow: 'hidden',
  },
  compassTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  compassBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  compassBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  compassRoomTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  compassVisualWrap: {
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassCircleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassCircleInner: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  compassDegreeNum: {
    fontFamily: Fonts.light,
    fontSize: 18,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  compassCardinalLabel: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
    textTransform: 'uppercase',
  },
  compassMetricsGrid: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  compassMetricCell: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  compassMetricVal: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  compassMetricSub: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  compassMetricDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  allSpacesListBlock: {
    gap: 14,
  },
  allSpacesListHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allSpacesListTitle: {
    fontFamily: Fonts.light,
    fontSize: 18,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  addSpaceSmallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  addSpaceSmallPillText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontWeight: '400',
    color: '#2C2A28',
  },
  allSpacesCardsCol: {
    gap: 10,
  },
  allSpaceCardItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 14,
    overflow: 'hidden',
    gap: 10,
  },
  allSpaceCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  allSpaceCardItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  allSpaceCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  allSpaceCardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allSpaceCardTexts: {
    gap: 3,
    flex: 1,
  },
  allSpaceCardName: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  activeSpaceDotPill: {
    backgroundColor: 'rgba(134, 239, 172, 0.22)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeSpaceDotText: {
    fontFamily: Fonts.light,
    fontSize: 10,
    fontWeight: '300',
    color: '#86EFAC',
  },
  allSpaceCardSub: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
  },
  allSpaceScoreWrap: {
    alignItems: 'center',
    paddingLeft: 8,
  },
  allSpaceScoreNum: {
    fontFamily: Fonts.light,
    fontSize: 16,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  allSpaceScoreSub: {
    fontFamily: Fonts.light,
    fontSize: 10,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.50)',
  },
  allSpaceCardBottomActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  addPlantToThisSpaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(134, 239, 172, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.25)',
  },
  addPlantToThisSpaceText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: '#86EFAC',
  },
  opticalScannerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    padding: 24,
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  opticalReticleCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  opticalReticleRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  opticalCardHeadline: {
    fontFamily: Fonts.regular,
    fontSize: 18,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  opticalCardSubline: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  opticalActionButtonsRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  opticalPrimaryScanBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 18,
  },
  opticalPrimaryScanBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: '#2C2A28',
  },
  opticalSecondaryGalleryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 14,
    borderRadius: 18,
  },
  opticalSecondaryGalleryBtnText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  scientificRepoBannerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 16,
    overflow: 'hidden',
    gap: 8,
  },
  scientificRepoBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scientificRepoBannerTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  scientificRepoBannerSub: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
    lineHeight: 17,
  },
  scientificRepoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  repoMiniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  repoMiniChipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#86EFAC',
  },
  repoMiniChipText: {
    fontFamily: Fonts.light,
    fontSize: 10,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.88)',
  },
  bibliaSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bibliaSearchInput: {
    flex: 1,
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: '#FFFFFF',
    padding: 0,
  },
  clearSearchText: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
    paddingHorizontal: 4,
  },
  typesenseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    marginTop: -2,
  },
  typesenseMetaText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(134, 239, 172, 0.85)',
    letterSpacing: 0.1,
  },
  bibliaFiltersRow: {
    gap: 8,
    paddingVertical: 2,
  },
  bibliaFilterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  bibliaFilterChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    borderColor: 'rgba(255, 255, 255, 0.65)',
  },
  bibliaFilterChipText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
  },
  bibliaFilterChipTextActive: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  bibliaSpeciesGrid: {
    gap: 12,
  },
  bibliaSpeciesCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 14,
    gap: 14,
    overflow: 'hidden',
  },
  bibliaSpeciesThumb: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  bibliaSpeciesInfoCol: {
    flex: 1,
    gap: 3,
  },
  bibliaSpeciesTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bibliaSpeciesCommon: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    flex: 1,
  },
  petWarningBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.20)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  petWarningBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 10,
    fontWeight: '300',
    color: '#FCA5A5',
  },
  bibliaSpeciesScientific: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
    fontStyle: 'italic',
  },
  bibliaSpeciesTrait: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 16,
    marginTop: 2,
  },
  bibliaSpeciesFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  bibliaLuxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.20)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bibliaLuxText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  bibliaExplorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(134, 239, 172, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.32)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bibliaExplorePillText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    fontWeight: '400',
    color: '#86EFAC',
  },
  bibliaAddPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  bibliaAddPillBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontWeight: '400',
    color: '#2C2A28',
  },
  loadMoreSpeciesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 8,
    overflow: 'hidden',
  },
  loadMoreSpeciesBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  zenBreathCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    padding: 26,
    alignItems: 'center',
    gap: 20,
    overflow: 'hidden',
  },
  zenBreathHaloOuter: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zenBreathHaloPulse: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  zenBreathCenterCircle: {
    width: 110,
    height: 110,
    borderRadius: 57,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.40)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  zenBreathPhaseText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  zenBreathSubText: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
  },
  zenActionBtn: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    paddingVertical: 13,
    borderRadius: 18,
    alignItems: 'center',
  },
  zenActionBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#2C2A28',
  },
  zenScenesGrid: {
    gap: 10,
  },
  zenSceneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 14,
    gap: 14,
    overflow: 'hidden',
  },
  zenSceneCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  zenSceneIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zenSceneTextCol: {
    flex: 1,
    gap: 2,
  },
  zenSceneTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  zenSceneDesc: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
    lineHeight: 16,
  },
  zenPlayCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
