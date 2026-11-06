import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingState } from '../types/onboarding';
import { Fonts } from '../constants/theme';
import { TreegohIcon } from './TreegohIcon';
import { GlassCardSheen } from './BlobAnimatedCard';
import { CircadianBackground } from './CircadianBackground';
import { getCircadianTheme } from '../utils/circadianTheme';

interface SanctuaryCelebrationViewProps {
  onboardingData: OnboardingState;
  onEnterSanctuary: () => void;
}

export const SanctuaryCelebrationView: React.FC<SanctuaryCelebrationViewProps> = ({
  onboardingData,
  onEnterSanctuary,
}) => {
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, Platform.OS === 'ios' ? 52 : StatusBar.currentHeight || 24);
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 32 : 20);

  // El ciclo solar es 100% automático tomando la hora local del dispositivo
  const theme = getCircadianTheme(
    undefined,
    new Date(),
    {
      latitude: onboardingData.location.latitude,
      longitude: onboardingData.location.longitude,
    }
  );

  const rawSpaces = onboardingData?.customMicroclimates;
  const spaces = Array.isArray(rawSpaces) && rawSpaces.length > 0
    ? rawSpaces
        .map(item => {
          if (!item) return null;
          if (typeof item === 'string') {
            try { return JSON.parse(item); } catch { return null; }
          }
          return typeof item === 'object' ? item : null;
        })
        .filter((s): s is CustomMicroclimate => Boolean(s && typeof s === 'object' && s.name))
    : [];

  const spacesCount = Math.max(spaces.length, onboardingData?.spaces?.length || 1);
  const avgScore =
    spaces.length > 0
      ? Math.round(spaces.reduce((acc, s) => acc + (s.habitabilityScore || 85), 0) / spaces.length)
      : 92;

  const primarySpaceName = spaces[0]?.name || onboardingData?.spaces?.[0] || 'Salón';
  const hasPets = onboardingData?.safetyFilter?.hasPets ?? true;

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
  };

  return (
    <CircadianBackground coords={onboardingData.location}>
      <ScrollView
        style={styles.scrollRoot}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: safeTop + 14, paddingBottom: safeBottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. CABECERA TIDE: MOMENTO DEL DÍA Y CULTIVADORES CONECTADOS */}
        <View style={styles.topHeaderRow}>
          <View style={styles.topMomentCol}>
            <Text style={styles.topMomentTitle}>{theme.label}</Text>
            <Text style={styles.topMomentSubtitle}>
              {onboardingData.location.city || 'Santuario Botánico'} · {theme.subLabel.split('·')[0]}
            </Text>
          </View>

          <View style={styles.communityBadge}>
            <View style={styles.communityDotsRow}>
              <View style={[styles.miniAvatarDot, { backgroundColor: '#B8C9B9' }]} />
              <View style={[styles.miniAvatarDot, { backgroundColor: '#E29578' }]} />
              <View style={[styles.miniAvatarDot, { backgroundColor: '#FDFBF7' }]} />
            </View>
            <Text style={styles.communityText}>700+ personas conectadas</Text>
          </View>
        </View>

        {/* 2. CITA BOTÁNICA INSPIRACIONAL EN MONTSERRAT LIGHT (ESTILO TIDE FOCUS) */}
        <View style={styles.quoteCardContainer}>
          <Text style={styles.quoteMainText}>“{theme.quote.text}”</Text>
          <Text style={styles.quoteAuthorText}>— {theme.quote.author}</Text>
        </View>

        {/* 3. BLOQUE DE 3 MÉTRICAS SINTÉTICAS CON SEPARADORES CAPILARES (|) */}
        <View style={styles.tideMetricsRow}>
          <View style={styles.tideMetricCol}>
            <Text style={styles.tideMetricNumber}>
              {spacesCount} {spacesCount === 1 ? 'Espacio' : 'Espacios'}
            </Text>
            <Text style={styles.tideMetricSub}>Calibrados</Text>
          </View>

          <View style={styles.tideHairlineDivider} />

          <View style={styles.tideMetricCol}>
            <Text style={styles.tideMetricNumber}>{avgScore}/100</Text>
            <Text style={styles.tideMetricSub}>Score Global</Text>
          </View>

          <View style={styles.tideHairlineDivider} />

          <View style={styles.tideMetricCol}>
            <Text style={styles.tideMetricNumber}>
              {hasPets ? 'Pet-Safe' : 'Colección'}
            </Text>
            <Text style={styles.tideMetricSub}>Filtro ASPCA</Text>
          </View>
        </View>

        {/* 5. TARJETA DE SUGERENCIA / PRIMER PASO (ESTILO SUGGESTION TIDE) */}
        <View style={styles.suggestionGlassCard}>
          <GlassCardSheen />
          <View style={styles.suggestionLeftIconWrap}>
            <TreegohIcon
              name="anadir_planta"
              size={22}
              color="#2C2A28"
              glow={false}
            />
          </View>
          <View style={styles.suggestionTextCol}>
            <Text style={styles.suggestionTitle}>
              Primer paso: Añadir planta a «{primarySpaceName}»
            </Text>
            <Text style={styles.suggestionSub}>
              Escanea con la burbuja óptica para validar luz y compatibilidad.
            </Text>
          </View>
        </View>

        {/* 6. BARRA INFERIOR DE ACCIONES TIDE: ICONO SECUNDARIO + PÍLDORA BLANCA SATINADA */}
        <View style={styles.bottomActionsRow}>
          <TouchableOpacity
            style={styles.circleShareBtn}
            onPress={() => {
              triggerHaptic();
            }}
            activeOpacity={0.8}
          >
            <TreegohIcon
              name="compartir_exportar"
              size={20}
              color="#FFFFFF"
              glow={false}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.donePrimaryPillBtn}
            onPress={() => {
              triggerHaptic();
              onEnterSanctuary();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.donePrimaryPillText}>Entrar a mi Santuario</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </CircadianBackground>
  );
};

const styles = StyleSheet.create({
  scrollRoot: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 26,
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 28,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  topMomentCol: {
    flex: 1,
    gap: 3,
  },
  topMomentTitle: {
    fontFamily: Fonts.light,
    fontSize: 27,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  topMomentSubtitle: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.68)',
  },
  communityBadge: {
    alignItems: 'flex-end',
    gap: 4,
  },
  communityDotsRow: {
    flexDirection: 'row',
    gap: -4,
  },
  miniAvatarDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  communityText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.62)',
  },
  quoteCardContainer: {
    paddingVertical: 18,
    gap: 12,
  },
  quoteMainText: {
    fontFamily: Fonts.light,
    fontSize: 26,
    fontWeight: '300',
    color: '#FFFFFF',
    lineHeight: 38,
    letterSpacing: -0.2,
  },
  quoteAuthorText: {
    fontFamily: Fonts.light,
    fontSize: 14.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
  },
  tideMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
  },
  tideMetricCol: {
    flex: 1,
    gap: 3,
  },
  tideMetricNumber: {
    fontFamily: Fonts.light,
    fontSize: 16.5,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  tideMetricSub: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.52)',
  },
  tideHairlineDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginHorizontal: 12,
  },
  suggestionGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
    overflow: 'hidden',
  },
  suggestionLeftIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  suggestionTextCol: {
    flex: 1,
    gap: 3,
  },
  suggestionTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  suggestionSub: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    paddingTop: 8,
  },
  circleShareBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donePrimaryPillBtn: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donePrimaryPillText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    fontWeight: '400',
    color: '#2C2A28',
    letterSpacing: 0.1,
  },
});

