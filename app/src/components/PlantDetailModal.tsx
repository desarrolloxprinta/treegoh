import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Fonts } from '../constants/theme';
import { TreegohIcon } from './TreegohIcon';
import { GlassCardSheen } from './BlobAnimatedCard';
import { BotanicalImage } from './BotanicalImage';
import { UserPlant } from '../types/plant';

interface PlantDetailModalProps {
  plant: UserPlant | null;
  spaceLux?: number;
  onClose: () => void;
  onWaterPlant: (plantId: string) => void;
  onDeletePlant: (plantId: string) => void;
  onReScanPlantWithCamera?: (plant: UserPlant) => void;
  onOpenScientificMonograph?: (plant: UserPlant) => void;
  onRelocatePlant?: (plant: UserPlant) => void;
}

export const PlantDetailModal: React.FC<PlantDetailModalProps> = ({
  plant,
  spaceLux = 3200,
  onClose,
  onWaterPlant,
  onDeletePlant,
  onReScanPlantWithCamera,
  onOpenScientificMonograph,
  onRelocatePlant,
}) => {
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 28 : 16);

  const isVisible = Boolean(plant);

  const triggerHaptic = (heavy = false) => {
    try {
      Haptics.impactAsync(
        heavy ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
    } catch (_e) {}
  };

  const isWateredRecently = plant
    ? plant.wateringStatus === 'hidratada' || plant.daysUntilNextWatering >= 6
    : false;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      {plant ? (
        <View style={styles.modalOverlay}>
          {/* Telón táctil para cerrar al pulsar fuera */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={[styles.sheetContainer, { paddingBottom: safeBottom + 16 }]}>
          {/* 1. BARRA SUPERIOR CON RETROCESO */}
          <View style={styles.sheetTopRow}>
            <View style={styles.sheetSpaceTag}>
              <TreegohIcon name="espacios_microclimas" size={14} color="#FFFFFF" glow={false} />
              <Text style={styles.sheetSpaceTagText}>{plant.spaceName}</Text>
            </View>

            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => {
                triggerHaptic();
                onClose();
              }}
              activeOpacity={0.75}
            >
              <TreegohIcon name="flecha_volver" size={16} color="#FFFFFF" glow={false} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 2. FOTO PRINCIPAL DE LA PLANTA CON CRISTAL */}
            <View style={styles.photoContainer}>
              <BotanicalImage
                uri={plant.imageUrl}
                style={styles.plantHeroImage}
                commonName={plant.commonName}
              />
              <GlassCardSheen />
              <View style={styles.photoBottomOverlay}>
                <Text style={styles.heroCommonName}>{plant.commonName}</Text>
                <Text style={styles.heroScientificName}>
                  {plant.scientificName} {plant.family ? `· ${plant.family}` : ''}
                </Text>
                {plant.nickname ? (
                  <Text style={styles.heroNickname}>«{plant.nickname}»</Text>
                ) : null}
              </View>
            </View>

            {/* 3. TARJETA DE RIEGO HIDRODINÁMICO & VPD */}
            <View style={styles.detailGlassCard}>
              <GlassCardSheen />
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconCircleSmall}>
                  <TreegohIcon name="riego_hidratacion" size={18} color="#A7F3D0" glow={true} />
                </View>
                <Text style={styles.cardTitle}>Pauta de Riego Hidrodinámico</Text>
              </View>

              <Text style={styles.wateringDaysText}>
                {isWateredRecently
                  ? 'Sustrato hidratado y oxigenado'
                  : `Próximo riego en ${plant.daysUntilNextWatering} días`}
              </Text>
              <Text style={styles.cardBodySub}>
                {plant.wateringStatus === 'hidratada'
                  ? 'Riego registrado hoy. Deja que el tercio superior de tierra respire.'
                  : 'Cálculo de transpiración y déficit de presión de vapor (VPD) según la temperatura de tu hogar.'}
              </Text>

              <TouchableOpacity
                style={styles.btnLogWatering}
                onPress={() => {
                  triggerHaptic(true);
                  onWaterPlant(plant.id);
                }}
                activeOpacity={0.84}
              >
                <TreegohIcon name="tarea_completada" size={16} color="#2C2A28" glow={false} />
                <Text style={styles.btnLogWateringText}>Marcar regada hoy</Text>
              </TouchableOpacity>
            </View>

            {/* 4. TARJETA DE COMPATIBILIDAD LUMÍNICA */}
            <View style={styles.detailGlassCard}>
              <GlassCardSheen />
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconCircleSmall}>
                  <TreegohIcon name="luz_natural" size={18} color="#FDE68A" glow={true} />
                </View>
                <Text style={styles.cardTitle}>Biométrica de Luz Natural</Text>
              </View>

              <View style={styles.badgeRow}>
                <View style={styles.lightStatusBadge}>
                  <Text style={styles.lightStatusBadgeText}>
                    {plant.lightCompatibility === 'optima'
                      ? 'Luz Óptima'
                      : plant.lightCompatibility === 'buena'
                      ? 'Buena Adaptación'
                      : 'Luz Límite'}
                  </Text>
                </View>
                <Text style={styles.luxSubText}>~{spaceLux.toLocaleString()} Lux en este rincón</Text>
              </View>

              <Text style={styles.cardBodySub}>
                {plant.lightCompatibilityNote ||
                  `Esta especie se desarrolla con vitalidad bajo la radiación filtrada de ${plant.spaceName}.`}
              </Text>
            </View>

            {/* 5. TARJETA DE SEGURIDAD PARA MASCOTAS */}
            <View style={styles.detailGlassCard}>
              <GlassCardSheen />
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconCircleSmall}>
                  <TreegohIcon name="escudo_fitosanitario" size={18} color="#FFFFFF" glow={true} />
                </View>
                <Text style={styles.cardTitle}>Seguridad Doméstica y Mascotas</Text>
              </View>

              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.petSafetyBadge,
                    {
                      backgroundColor: plant.isPetSafe
                        ? 'rgba(134, 239, 172, 0.22)'
                        : 'rgba(248, 113, 113, 0.22)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.petSafetyBadgeText,
                      { color: plant.isPetSafe ? '#86EFAC' : '#FCA5A5' },
                    ]}
                  >
                    {plant.isPetSafe ? 'Apta para mascotas (No tóxica)' : 'Precaución con mascotas'}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardBodySub}>
                {plant.toxicityNote ||
                  (plant.isPetSafe
                    ? 'Especie certificada sin toxinas perjudiciales para perros ni gatos.'
                    : 'Mantén esta planta en zonas altas o fuera del alcance directo de mordisqueos.')}
              </Text>
            </View>

            {/* 6. EVALUACIÓN DE SALUD FOLIARES & VIRTUD */}
            {plant.trait || plant.healthAssessment ? (
              <View style={styles.detailGlassCard}>
                <GlassCardSheen />
                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconCircleSmall}>
                    <TreegohIcon name="camara_diagnostica" size={18} color="#FFFFFF" glow={true} />
                  </View>
                  <Text style={styles.cardTitle}>Fisiología & Diagnóstico Visual</Text>
                </View>

                {plant.trait ? (
                  <Text style={styles.traitCallout}>«{plant.trait}»</Text>
                ) : null}

                {plant.healthAssessment ? (
                  <Text style={styles.cardBodySub}>{plant.healthAssessment}</Text>
                ) : null}

                {onReScanPlantWithCamera && (
                  <TouchableOpacity
                    style={styles.reScanBtn}
                    onPress={() => {
                      triggerHaptic();
                      onClose();
                      setTimeout(() => {
                        onReScanPlantWithCamera(plant);
                      }, 240);
                    }}
                    activeOpacity={0.82}
                  >
                    <TreegohIcon name="camara_diagnostica" size={16} color="#FFFFFF" glow={false} />
                    <Text style={styles.reScanBtnText}>Escanear estado de salud con cámara</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {/* 7. ENLACE A LA MONOGRAFÍA CIENTÍFICA COMPLETA */}
            {onOpenScientificMonograph && (
              <TouchableOpacity
                style={styles.openMonographBtn}
                onPress={() => {
                  triggerHaptic();
                  onOpenScientificMonograph(plant);
                }}
                activeOpacity={0.84}
              >
                <GlassCardSheen />
                <View style={styles.openMonographLeftRow}>
                  <TreegohIcon name="biblia_plantas" size={18} color="#86EFAC" glow={false} />
                  <View style={styles.openMonographTextsCol}>
                    <Text style={styles.openMonographTitle}>Monografía Botánica Completa</Text>
                    <Text style={styles.openMonographSub}>
                      Morfología, cuidados hidrodinámicos y diagnóstico fitosanitario.
                    </Text>
                  </View>
                </View>
                <TreegohIcon
                  name="flecha_volver"
                  size={14}
                  color="rgba(255, 255, 255, 0.6)"
                  glow={false}
                  style={{ transform: [{ rotate: '180deg' }] }}
                />
              </TouchableOpacity>
            )}

            {/* 7.5. REUBICAR EN OTRO ESPACIO O MICROCLIMA */}
            {onRelocatePlant && (
              <TouchableOpacity
                style={styles.openMonographBtn}
                onPress={() => {
                  triggerHaptic();
                  onClose();
                  setTimeout(() => {
                    onRelocatePlant(plant);
                  }, 220);
                }}
                activeOpacity={0.84}
              >
                <GlassCardSheen />
                <View style={styles.openMonographLeftRow}>
                  <TreegohIcon name="espacios_microclimas" size={18} color="#93C5FD" glow={false} />
                  <View style={styles.openMonographTextsCol}>
                    <Text style={styles.openMonographTitle}>Reubicar en otro microclima</Text>
                    <Text style={styles.openMonographSub}>
                      Mover desde «{plant.spaceName}» a otra estancia evaluando compatibilidad.
                    </Text>
                  </View>
                </View>
                <TreegohIcon
                  name="flecha_volver"
                  size={14}
                  color="rgba(255, 255, 255, 0.6)"
                  glow={false}
                  style={{ transform: [{ rotate: '180deg' }] }}
                />
              </TouchableOpacity>
            )}

            {/* 8. ACCIÓN PARA RETIRAR O ELIMINAR PLANTA */}
            <TouchableOpacity
              style={styles.deletePlantBtn}
              onPress={() => {
                triggerHaptic(true);
                onDeletePlant(plant.id);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.deletePlantBtnText}>Retirar planta de este rincón</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    ) : null}
  </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 19, 22, 0.72)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#27292C',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingTop: 22,
    paddingHorizontal: 22,
    gap: 16,
  },
  sheetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetSpaceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sheetSpaceTagText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  sheetCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    gap: 16,
    paddingBottom: 20,
  },
  photoContainer: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  plantHeroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20, 22, 24, 0.78)',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 3,
  },
  heroCommonName: {
    fontFamily: Fonts.regular,
    fontSize: 20,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  heroScientificName: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.75)',
    fontStyle: 'italic',
  },
  heroNickname: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
    marginTop: 2,
  },
  detailGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 18,
    gap: 10,
    overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  wateringDaysText: {
    fontFamily: Fonts.light,
    fontSize: 16.5,
    fontWeight: '300',
    color: '#A7F3D0',
    letterSpacing: -0.2,
  },
  cardBodySub: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 19,
  },
  btnLogWatering: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 13,
    borderRadius: 20,
    marginTop: 4,
  },
  btnLogWateringText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: '#2C2A28',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lightStatusBadge: {
    backgroundColor: 'rgba(253, 230, 138, 0.22)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lightStatusBadgeText: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    fontWeight: '400',
    color: '#FDE68A',
  },
  luxSubText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
  },
  petSafetyBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  petSafetyBadgeText: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    fontWeight: '400',
  },
  traitCallout: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: '#FFFFFF',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  reScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 12,
    borderRadius: 18,
    marginTop: 4,
  },
  reScanBtnText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  openMonographBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 16,
    overflow: 'hidden',
    marginTop: 4,
    gap: 12,
  },
  openMonographLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  openMonographTextsCol: {
    flex: 1,
    gap: 3,
  },
  openMonographTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  openMonographSub: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 16.5,
  },
  deletePlantBtn: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  deletePlantBtnText: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(248, 113, 113, 0.85)',
  },
});

