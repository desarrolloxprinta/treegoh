import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { OnboardingScreen } from './src/screens/onboarding/OnboardingScreen';
import { SanctuaryCelebrationView } from './src/components/SanctuaryCelebrationView';
import { SanctuaryHomeScreen } from './src/screens/sanctuary/SanctuaryHomeScreen';
import { OnboardingState } from './src/types/onboarding';
import { loadMontserratFonts } from './src/utils/loadMontserratFonts';
import { saveUserProfileToFirestore } from './src/services/userService';
import {
  loadPersistedUserSession,
  persistUserSession,
  clearUserSession,
} from './src/services/storageService';
import { syncSanctuaryToCloud, firebaseSignOut } from './src/services/firebaseAuthService';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Treegoh] Error contenido en RootErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleResetData = async () => {
    try {
      await clearUserSession();
    } catch (_e) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaProvider>
          <StatusBar style="light" />
          <View style={errorStyles.container}>
            <View style={errorStyles.badge}>
              <Text style={errorStyles.badgeText}>Recuperación de Santuario</Text>
            </View>
            <Text style={errorStyles.title}>Treegoh ha contenido una excepción</Text>
            <Text style={errorStyles.subtitle}>
              La pantalla ha protegido el proceso contra el cierre de la app en iOS.
            </Text>

            <View style={errorStyles.errorCard}>
              <Text style={errorStyles.errorMessage}>
                {this.state.error?.message || 'Error no especificado'}
              </Text>
              {this.state.error?.stack ? (
                <Text style={errorStyles.errorStack} numberOfLines={8}>
                  {this.state.error.stack}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={errorStyles.primaryBtn}
              onPress={this.handleRetry}
              activeOpacity={0.8}
            >
              <Text style={errorStyles.primaryBtnText}>Reintentar carga</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={errorStyles.secondaryBtn}
              onPress={this.handleResetData}
              activeOpacity={0.8}
            >
              <Text style={errorStyles.secondaryBtnText}>Restablecer datos locales</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaProvider>
      );
    }

    return this.props.children;
  }
}

// Datos predeterminados del santuario de test para desarrollo continuo y pruebas en Expo Go
export const DEFAULT_TEST_SANCTUARY_DATA: OnboardingState = {
  currentStep: 6,
  account: {
    uid: 'test_user_treegoh_dev',
    authProvider: 'google',
    displayName: 'Ruy',
    email: 'ruy.dejesus4@gmail.com',
    experienceLevel: 'habitual',
    photoURL: null,
    isGuest: false,
  },
  goals: ['vitalidad_foliar', 'riego_optimo', 'coleccion_segura'],
  location: {
    city: 'Madrid',
    bioclimaticZone: 'Interior Mediterráneo Continental',
    waterHardness: 'Blanda (óptima)',
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
    {
      id: 'terraza_sur',
      name: 'Terraza Sur',
      roomType: 'Terraza / Balcón',
      orientation: 'Sur' as any,
      headingDegrees: 190,
      windowDistance: 'junto_a_ventana',
      estimatedLux: 8500,
      thermalRisks: { nearRadiator: false, nearAC: false, drafts: true },
      humidityLevel: 'media',
      habitabilityScore: 96,
      verdict: 'Sol pleno y máxima luminosidad directa.',
      recommendedSpecies: ['Strelitzia reginae', 'Aloe vera'],
      preventiveTips: ['Proteger en horas centrales de ola de calor'],
    },
  ],
  safetyFilter: {
    hasPets: false,
    petTypes: [],
    hasChildren: false,
  },
  characterCalibrated: true,
  assignedAvatar: {
    species: 'Monstera Deliciosa',
    scientificName: 'Monstera deliciosa',
    alias: 'Monstera del Rincón',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80',
    trait: 'Icono del santuario botánico',
  },
  isGuest: false,
};

function MainApp() {
  const [fontsReady, setFontsReady] = useState(false);
  const [isOnboardingDone, setIsOnboardingDone] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [userGardenData, setUserGardenData] = useState<OnboardingState | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const [_, session] = await Promise.all([
          loadMontserratFonts().catch(() => {}),
          loadPersistedUserSession().catch(() => ({
            isOnboardingDone: false,
            onboardingData: null,
            userProfile: null,
          })),
        ]);

        if (mounted) {
          if (session && session.isOnboardingDone && session.onboardingData) {
            const rawSavedName = session.onboardingData.account?.displayName?.trim();
            const isGenericPlaceholder =
              !rawSavedName ||
              rawSavedName.toLowerCase() === 'cultivador' ||
              rawSavedName.toLowerCase() === 'jardinero';
            const mergedData: OnboardingState = {
              ...DEFAULT_TEST_SANCTUARY_DATA,
              ...session.onboardingData,
              account: {
                ...DEFAULT_TEST_SANCTUARY_DATA.account,
                ...(session.onboardingData.account || {}),
                displayName: isGenericPlaceholder ? 'Ruy' : rawSavedName!,
                email:
                  !session.onboardingData.account?.email ||
                  session.onboardingData.account?.email === 'cultivador@treegoh.app'
                    ? 'ruy.dejesus4@gmail.com'
                    : session.onboardingData.account.email,
              },
              location: {
                ...DEFAULT_TEST_SANCTUARY_DATA.location,
                ...(session.onboardingData.location || {}),
              },
              safetyFilter: {
                ...DEFAULT_TEST_SANCTUARY_DATA.safetyFilter,
                ...(session.onboardingData.safetyFilter || {}),
              },
            };
            setUserGardenData(mergedData);
            setIsOnboardingDone(true);
            setShowCelebration(false); // Entra directo al Santuario sin repetir onboarding
          } else {
            // Mantiene activo el test de forma permanente en Expo Go sin desactivarse
            await persistUserSession(DEFAULT_TEST_SANCTUARY_DATA);
            setUserGardenData(DEFAULT_TEST_SANCTUARY_DATA);
            setIsOnboardingDone(true);
            setShowCelebration(false);
          }
          setFontsReady(true);
        }
      } catch (_e) {
        if (mounted) {
          setUserGardenData(DEFAULT_TEST_SANCTUARY_DATA);
          setIsOnboardingDone(true);
          setFontsReady(true);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const handleOnboardingComplete = async (data: OnboardingState) => {
    // 1. Sincronización completa con Google Cloud Firestore (/users/{userId})
    if (data.account?.uid) {
      await syncSanctuaryToCloud(data.account.uid, data);
    }
    // 2. Persistencia local en disco
    await persistUserSession(data);
    setUserGardenData(data);
    setIsOnboardingDone(true);
    setShowCelebration(true); // Abre la pantalla de consagración estilo TIDE Focus Ends
  };

  const handleEnterSanctuary = () => {
    setShowCelebration(false); // Entra al Santuario Home Dashboard
  };

  const handleResetForTest = async () => {
    await clearUserSession();
    await firebaseSignOut();
    setIsOnboardingDone(false);
    setUserGardenData(null);
    setShowCelebration(false);
  };

  if (!fontsReady) {
    return <View style={styles.loadingSplash} />;
  }

  // 1. FASE DE ONBOARDING
  if (!isOnboardingDone || !userGardenData) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    );
  }

  // 2. FASE DE CONSAGRACIÓN / LLEGADA POST-ONBOARDING (ESTILO TIDE FOCUS ENDS)
  if (showCelebration) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SanctuaryCelebrationView
          onboardingData={userGardenData}
          onEnterSanctuary={handleEnterSanctuary}
        />
      </SafeAreaProvider>
    );
  }

  // 3. FASE DE SANTUARIO BOTÁNICO (HOME DASHBOARD DIARIO)
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SanctuaryHomeScreen
        onboardingData={userGardenData}
        onResetForTest={handleResetForTest}
      />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootErrorBoundary>
        <MainApp />
      </RootErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingSplash: {
    flex: 1,
    backgroundColor: '#243C4D',
  },
});

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E2D38',
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(134, 239, 172, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.35)',
  },
  badgeText: {
    color: '#86EFAC',
    fontSize: 11,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.30)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 8,
    marginVertical: 8,
  },
  errorMessage: {
    fontSize: 13,
    fontWeight: '400',
    color: '#FCA5A5',
    lineHeight: 18,
  },
  errorStack: {
    fontSize: 10.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.50)',
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#1E2D38',
    fontSize: 14,
    fontWeight: '400',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '300',
  },
});
