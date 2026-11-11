import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Fonts } from '../constants/theme';
import { TreegohIcon } from './TreegohIcon';
import { GlassCardSheen } from './BlobAnimatedCard';
import { BotanicalImage } from './BotanicalImage';
import { CircadianBackground } from './CircadianBackground';
import { CircadianThemeConfig } from '../utils/circadianTheme';
import { WeatherConditionType } from '../services/weatherService';
import { CustomMicroclimate } from '../types/onboarding';

export interface PlantToPlaceTarget {
  id?: string;
  commonName: string;
  scientificName: string;
  family?: string;
  imageUrl?: string;
  minLux?: number;
  maxLux?: number;
  isPetSafe?: boolean;
  wateringIntervalDays?: number;
  trait?: string;
}

interface SpaceDestinationPickerModalProps {
  visible: boolean;
  plant: PlantToPlaceTarget | null;
  spaces: CustomMicroclimate[];
  currentSpaceName?: string;
  actionTitle?: string;
  theme?: CircadianThemeConfig;
  currentTime?: Date;
  weatherCondition?: WeatherConditionType;
  coords?: { latitude?: number; longitude?: number };
  onClose: () => void;
  onSelectSpace: (space: CustomMicroclimate) => void;
  onRequestCreateSpace?: () => void;
}

export const SpaceDestinationPickerModal: React.FC<SpaceDestinationPickerModalProps> = ({
  visible,
  plant,
  spaces,
  currentSpaceName,
  actionTitle = 'Ubicar en este espacio',
  theme,
  currentTime,
  weatherCondition = 'despejado',
  coords,
  onClose,
  onSelectSpace,
  onRequestCreateSpace,
}) => {
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, Platform.OS === 'ios' ? 50 : 24);
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 34 : 20);

  const isVisible = Boolean(visible && plant);

  const triggerHaptic = (heavy = false) => {
    try {
      Haptics.impactAsync(
        heavy ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
    } catch (_e) {}
  };

  const minL = Number(plant?.minLux) || 800;
  const maxL = Number(plant?.maxLux) || 3500;

  const computeAffinity = (space: CustomMicroclimate) => {
    const lux = space.estimatedLux || 3200;
    if (lux >= minL && lux <= maxL * 1.3) {
      return {
        level: 'optima' as const,
        label: 'Afinidad lumínica óptima',
        detail: `Sus ~${lux.toLocaleString()} Lux coinciden plenamente con el rango de esta especie (${minL.toLocaleString()}–${maxL.toLocaleString()} lx).`,
        color: '#86EFAC',
        bg: 'rgba(134, 239, 172, 0.14)',
      };
    }
    if (lux < minL) {
      return {
        level: 'baja' as const,
        label: 'Claridad suave',
        detail: `Rincón con ~${lux.toLocaleString()} Lux. Conviene situar la maceta a menos de 1 metro del ventanal.`,
        color: '#FDE68A',
        bg: 'rgba(253, 230, 138, 0.14)',
      };
    }
    return {
      level: 'alta' as const,
      label: 'Sol abundante',
      color: '#93C5FD',
      bg: 'rgba(147, 197, 253, 0.14)',
    };
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      {plant ? (
        /* FONDO CIRCADIANO ANIMADO IDÉNTICO A LA APP CON VELO 50% MÁS CLARO */
        <CircadianBackground
          coords={coords}
          theme={theme}
          currentTime={currentTime}
          weatherCondition={weatherCondition}
        >
        <View style={styles.translucentLightVeil}>
          {/* 1. BARRA SUPERIOR DE NAVEGACIÓN AÉREA */}
          <View style={[styles.topNavBarRow, { paddingTop: safeTop + 6 }]}>
            <TouchableOpacity
              style={styles.navBackBtnPill}
              onPress={() => {
                triggerHaptic();
                onClose();
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <TreegohIcon name="flecha_volver" size={16} color="#FFFFFF" glow={false} />
              <Text style={styles.navBackBtnText}>Volver</Text>
            </TouchableOpacity>

            <View style={styles.topActionBadge}>
              <TreegohIcon name="espacios_microclimas" size={13} color="#86EFAC" glow={false} />
              <Text style={styles.topActionBadgeText} numberOfLines={1}>Selección de Estancia</Text>
            </View>
          </View>

          {/* 2. SCROLL PRINCIPAL FLUIDO DE PANTALLA COMPLETA */}
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={[
              styles.mainScrollContent,
              { paddingBottom: safeBottom + 60 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* BLOQUE HERO EDITORIAL */}
            <View style={styles.editorialHeaderBlock}>
              <View style={styles.heroSuperTagPill}>
                <TreegohIcon name="luz_natural" size={12} color="#86EFAC" glow={false} />
                <Text style={styles.heroSuperTagText}>UBICACIÓN EN EL HOGAR</Text>
              </View>
              <Text
                style={styles.editorialMainTitle}
                numberOfLines={2}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.85}
              >
                ¿Dónde vas a colocar tu {plant.commonName}?
              </Text>
              <Text style={styles.editorialSubtitle}>
                Compara en vivo las lecturas lumínicas de tus estancias y elige el rincón donde la especie recibirá las condiciones idóneas para su crecimiento.
              </Text>
            </View>

            {/* TARJETA RESUMEN DE LA ESPECIE SELECCIONADA (AMPLIA Y ESPACIOSA) */}
            <View style={styles.plantSummaryCard}>
              <GlassCardSheen />
              <BotanicalImage
                uri={plant.imageUrl}
                scientificName={plant.scientificName}
                commonName={plant.commonName}
                style={styles.plantSummaryThumb}
              />
              <View style={styles.plantSummaryTexts}>
                <View style={styles.plantSummaryNameRow}>
                  <Text style={styles.plantSummaryCommon} numberOfLines={1} ellipsizeMode="tail">
                    {plant.commonName}
                  </Text>
                  {plant.isPetSafe ? (
                    <View style={styles.petBadgeSafe}>
                      <Text style={styles.petBadgeSafeText}>ASPCA</Text>
                    </View>
                  ) : (
                    <View style={styles.petBadgeTox}>
                      <Text style={styles.petBadgeToxText}>Tóxica</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.plantSummaryScientific} numberOfLines={1} ellipsizeMode="tail">
                  {plant.scientificName} {plant.family ? `· ${plant.family}` : ''}
                </Text>

                <View style={styles.luxDemandsRow}>
                  <TreegohIcon name="sensor_lux" size={13} color="#86EFAC" glow={false} />
                  <Text style={styles.luxDemandsText} numberOfLines={1} ellipsizeMode="tail">
                    Demanda lumínica: {minL.toLocaleString()} a {maxL.toLocaleString()} Lux
                  </Text>
                </View>
              </View>
            </View>

            {/* SECCIÓN LISTA DE ESTANCIAS */}
            <View style={styles.spacesSectionWrap}>
              <View style={styles.spacesSectionHeaderRow}>
                <View style={styles.sectionTitleWithIcon}>
                  <TreegohIcon name="espacios_microclimas" size={18} color="#FFFFFF" glow={false} />
                  <Text style={styles.sectionTitle}>Estancias disponibles</Text>
                </View>
                <Text style={styles.sectionCounter}>
                  {spaces.length} {spaces.length === 1 ? 'espacio' : 'espacios'}
                </Text>
              </View>

              <View style={styles.spacesListCol}>
                {spaces.map(space => {
                  const affinity = computeAffinity(space);
                  const isCurrent = currentSpaceName === space.name;

                  return (
                    <TouchableOpacity
                      key={space.id || space.name}
                      style={[
                        styles.spaceCardItem,
                        isCurrent && styles.spaceCardItemCurrent,
                      ]}
                      onPress={() => {
                        triggerHaptic(true);
                        onSelectSpace(space);
                      }}
                      activeOpacity={0.84}
                    >
                      <GlassCardSheen selected={isCurrent} />

                      <View style={styles.spaceCardTopRow}>
                        <View style={styles.spaceCardIdentityLeft}>
                          <View style={styles.spaceCardIconCircle}>
                            <TreegohIcon
                              name="espacios_microclimas"
                              size={18}
                              color="#FFFFFF"
                              glow={isCurrent}
                            />
                          </View>
                          <View style={styles.spaceCardTitlesWrap}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text
                                style={styles.spaceCardName}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {space.name}
                              </Text>
                              {isCurrent && (
                                <View style={styles.currentDotTag}>
                                  <Text style={styles.currentDotText}>Actual</Text>
                                </View>
                              )}
                            </View>
                            <Text
                              style={styles.spaceCardSub}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {space.roomType} · Orientación {space.orientation || 'Sur'} · ~{(space.estimatedLux || 3200).toLocaleString()} lx
                            </Text>
                          </View>
                        </View>

                        <View style={styles.spaceSelectArrowCircle}>
                          <TreegohIcon name="mas" size={13} color="#161922" glow={false} />
                        </View>
                      </View>

                      {/* Píldora de afinidad bioclimática con el espacio */}
                      <View style={[styles.affinityPillRow, { backgroundColor: affinity.bg }]}>
                        <View style={[styles.affinityDot, { backgroundColor: affinity.color }]} />
                        <Text
                          style={[styles.affinityLabel, { color: affinity.color }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {affinity.label}
                        </Text>
                      </View>

                      <Text style={styles.affinityDetailText}>
                        {affinity.detail}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {/* BOTÓN CREAR NUEVO ESPACIO DIRECTO */}
                {onRequestCreateSpace && (
                  <TouchableOpacity
                    style={styles.addNewSpaceCardBtn}
                    onPress={() => {
                      triggerHaptic();
                      onClose();
                      setTimeout(() => {
                        onRequestCreateSpace();
                      }, 240);
                    }}
                    activeOpacity={0.8}
                  >
                    <GlassCardSheen />
                    <View style={styles.addNewSpaceIconWrap}>
                      <TreegohIcon name="mas" size={16} color="#FFFFFF" glow={false} />
                    </View>
                    <View style={styles.addNewSpaceTextCol}>
                      <Text style={styles.addNewSpaceTitle} numberOfLines={1} ellipsizeMode="tail">
                        Crear un nuevo espacio
                      </Text>
                      <Text style={styles.addNewSpaceSub} numberOfLines={2} ellipsizeMode="tail">
                        Calibra la orientación y los Lux de otro rincón de tu hogar.
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </CircadianBackground>
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Velo translúcido un 50% más claro para que la animación circadiana de la app respire detrás
  translucentLightVeil: {
    flex: 1,
    backgroundColor: 'rgba(9, 14, 21, 0.38)',
  },
  topNavBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
    zIndex: 10,
  },
  navBackBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  navBackBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  topActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 16,
    backgroundColor: 'rgba(134, 239, 172, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.30)',
    maxWidth: '55%',
  },
  topActionBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: '#86EFAC',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    gap: 28,
  },
  editorialHeaderBlock: {
    gap: 8,
  },
  heroSuperTagPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(134, 239, 172, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.25)',
  },
  heroSuperTagText: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: '#86EFAC',
    letterSpacing: 1.2,
  },
  editorialMainTitle: {
    fontFamily: Fonts.light,
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  editorialSubtitle: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 22,
  },

  // Tarjeta resumen de especie amplia
  plantSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 16,
    overflow: 'hidden',
  },
  plantSummaryThumb: {
    width: 74,
    height: 74,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  plantSummaryTexts: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  plantSummaryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plantSummaryCommon: {
    flex: 1,
    minWidth: 0,
    fontFamily: Fonts.regular,
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  petBadgeSafe: {
    flexShrink: 0,
    backgroundColor: 'rgba(134, 239, 172, 0.28)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  petBadgeSafeText: {
    fontFamily: Fonts.light,
    fontSize: 10,
    fontWeight: '300',
    color: '#86EFAC',
  },
  petBadgeTox: {
    flexShrink: 0,
    backgroundColor: 'rgba(248, 113, 113, 0.28)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  petBadgeToxText: {
    fontFamily: Fonts.light,
    fontSize: 10,
    fontWeight: '300',
    color: '#FCA5A5',
  },
  plantSummaryScientific: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
    fontStyle: 'italic',
  },
  luxDemandsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  luxDemandsText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
  },

  // Sección de estancias
  spacesSectionWrap: {
    gap: 14,
  },
  spacesSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.light,
    fontSize: 20,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  sectionCounter: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.50)',
  },
  spacesListCol: {
    gap: 14,
  },
  spaceCardItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 18,
    gap: 10,
    overflow: 'hidden',
  },
  spaceCardItemCurrent: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderColor: 'rgba(134, 239, 172, 0.55)',
  },
  spaceCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spaceCardIdentityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  spaceCardIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceCardTitlesWrap: {
    flex: 1,
    gap: 2,
  },
  spaceCardName: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  currentDotTag: {
    backgroundColor: 'rgba(134, 239, 172, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentDotText: {
    fontFamily: Fonts.light,
    fontSize: 10,
    fontWeight: '300',
    color: '#86EFAC',
  },
  spaceCardSub: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
  },
  spaceSelectArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  affinityPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  affinityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  affinityLabel: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
  },
  affinityDetailText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
  },
  addNewSpaceCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderStyle: 'dashed',
    padding: 18,
    overflow: 'hidden',
  },
  addNewSpaceIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewSpaceTextCol: {
    flex: 1,
    gap: 2,
  },
  addNewSpaceTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  addNewSpaceSub: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
  },
});
