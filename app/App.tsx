import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { OnboardingScreen } from './src/screens/onboarding/OnboardingScreen';
import { TreegohCharacter } from './src/components/TreegohCharacter';
import { Colors, Spacing, Typography } from './src/constants/theme';
import { OnboardingState } from './src/types/onboarding';

export default function App() {
  const [isOnboardingDone, setIsOnboardingDone] = useState(false);
  const [userGardenData, setUserGardenData] = useState<OnboardingState | null>(null);

  const handleOnboardingComplete = (data: OnboardingState) => {
    setUserGardenData(data);
    setIsOnboardingDone(true);
  };

  if (!isOnboardingDone) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Vista de bienvenida a "Mi Jardín" tras completar Onboarding
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.avatarWrap}>
          <TreegohCharacter size={100} mood="happy" statusOrbColor={Colors.sage} />
        </View>

        <Text style={Typography.titleLarge}>¡Bienvenido a Treegoh!</Text>
        <Text style={[Typography.body, { textAlign: 'center', marginTop: Spacing.sm }]}>
          Tu santuario ha sido calibrado para {userGardenData?.location.city}.
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Configuración Botánica Activa:</Text>
          <Text style={styles.summaryItem}>• Cultivador: {userGardenData?.account?.displayName || 'Invitado'}{userGardenData?.account?.email ? ` (${userGardenData.account.email})` : ''}</Text>
          <Text style={styles.summaryItem}>• Avatar Botánico: {userGardenData?.assignedAvatar?.alias || 'Monstera Deliciosa'}</Text>
          <Text style={styles.summaryItem}>• Espacios: {userGardenData?.spaces.join(', ')}</Text>
          {userGardenData?.customMicroclimates && userGardenData.customMicroclimates.length > 0 && (
            <Text style={[styles.summaryItem, { color: '#2D6A4F', fontWeight: '700' }]}>
              • Rincones Calibrados: {userGardenData.customMicroclimates.map(m => `${m.name} (${m.habitabilityScore}/100 - ${m.estimatedLux.toLocaleString()} lux)`).join('; ')}
            </Text>
          )}
          <Text style={styles.summaryItem}>• Filtro Mascotas: {userGardenData?.safetyFilter.hasPets ? 'Activado (Pet-Friendly)' : 'Sin filtro'}</Text>
          <Text style={styles.summaryItem}>• Asistente de Voz Botánica: Calibrado y Activo</Text>
          <Text style={styles.summaryItem}>• Modo: {userGardenData?.isGuest ? 'Invitado Local' : 'Sincronizado con Firebase'}</Text>
        </View>

        <TouchableOpacity
          style={styles.btnReset}
          onPress={() => setIsOnboardingDone(false)}
        >
          <Text style={styles.btnResetText}>Reiniciar Onboarding para Test</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmMist,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  avatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.pureWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(82, 121, 111, 0.25)',
  },
  summaryCard: {
    backgroundColor: Colors.pureWhite,
    width: '100%',
    padding: Spacing.lg,
    borderRadius: 20,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.xs,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkObsidian,
    marginBottom: 4,
  },
  summaryItem: {
    fontSize: 13,
    color: Colors.bodyText,
    lineHeight: 20,
  },
  btnReset: {
    backgroundColor: Colors.pureWhite,
    marginTop: Spacing.xl,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: 25,
    borderWidth: 1.2,
    borderColor: 'rgba(20, 28, 25, 0.12)',
  },
  btnResetText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.eucalyptus,
  },
});
