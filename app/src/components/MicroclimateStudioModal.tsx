import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { TreegohIcon, IconName } from './TreegohIcon';
import { CustomMicroclimate } from '../types/onboarding';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (microclimate: CustomMicroclimate) => void;
}

type StudioTab = 'compass' | 'distance' | 'thermal' | 'verdict';

export const MicroclimateStudioModal: React.FC<Props> = ({ visible, onClose, onSave }) => {
  const [currentTab, setCurrentTab] = useState<StudioTab>('compass');

  // Estado del microclima en construcción
  const [headingDegrees, setHeadingDegrees] = useState<number>(135); // Sureste por defecto
  const [windowDistance, setWindowDistance] = useState<'junto_a_ventana' | 'media_distancia' | 'rincon_profundo'>('media_distancia');
  const [nearRadiator, setNearRadiator] = useState<boolean>(false);
  const [nearAC, setNearAC] = useState<boolean>(false);
  const [drafts, setDrafts] = useState<boolean>(true);
  const [humidityLevel, setHumidityLevel] = useState<'alta' | 'media' | 'seca'>('media');
  const [spaceName, setSpaceName] = useState<string>('Rincón Luminoso Sureste');

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
  };

  // Suscripción al compás del dispositivo si está disponible
  useEffect(() => {
    let headingSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    async function startCompass() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted' && isMounted) {
          headingSubscription = await Location.watchHeadingAsync(headingData => {
            if (headingData && headingData.trueHeading !== undefined && headingData.trueHeading >= 0) {
              setHeadingDegrees(Math.round(headingData.trueHeading));
            } else if (headingData && headingData.magHeading !== undefined) {
              setHeadingDegrees(Math.round(headingData.magHeading));
            }
          });
        }
      } catch (_e) {
        // En emuladores o dispositivos sin sensor magnetómetro, mantenemos selección manual
      }
    }

    if (visible) {
      startCompass();
    }

    return () => {
      isMounted = false;
      if (headingSubscription) {
        headingSubscription.remove();
      }
    };
  }, [visible]);

  // Cálculo de orientación cardinal
  const getOrientation = (deg: number): { label: string; code: 'N' | 'S' | 'E' | 'O' | 'NE' | 'SE' | 'NO' | 'SO'; note: string; sunHours: number } => {
    const d = (deg + 360) % 360;
    if (d >= 337.5 || d < 22.5) {
      return {
        label: 'Norte (0°)',
        code: 'N',
        note: 'Luz difusa y constante. Cero quemaduras por sol directo todo el año. Evita sobre-riego en invierno.',
        sunHours: 0,
      };
    } else if (d >= 22.5 && d < 67.5) {
      return {
        label: 'Noreste (45°)',
        code: 'NE',
        note: 'Primeros rayos de la mañana frescos y seguros. Excelente para follaje delicado.',
        sunHours: 2,
      };
    } else if (d >= 67.5 && d < 112.5) {
      return {
        label: 'Este (90°)',
        code: 'E',
        note: 'Sol suave matutino (3-4h directas). Espectro ideal para fotosíntesis activa sin estrés hídrico.',
        sunHours: 3.5,
      };
    } else if (d >= 112.5 && d < 157.5) {
      return {
        label: 'Sureste (135°)',
        code: 'SE',
        note: 'El mejor compromiso lumínico de interior: luminosidad intensa y calor moderado.',
        sunHours: 5,
      };
    } else if (d >= 157.5 && d < 202.5) {
      return {
        label: 'Sur (180°)',
        code: 'S',
        note: 'Radiación solar máxima. Sol directo prolongado (5-7h). Ideal para Ficus, Strelitzia y Suculentas.',
        sunHours: 6.5,
      };
    } else if (d >= 202.5 && d < 247.5) {
      return {
        label: 'Suroeste (225°)',
        code: 'SO',
        note: 'Sol de tarde cálido e intenso. Requiere cortina traslúcida en meses de verano.',
        sunHours: 5,
      };
    } else if (d >= 247.5 && d < 292.5) {
      return {
        label: 'Oeste (270°)',
        code: 'O',
        note: 'Sol vespertino con aumento térmico rápido. Precaución con hojas jóvenes.',
        sunHours: 4,
      };
    } else {
      return {
        label: 'Noroeste (315°)',
        code: 'NO',
        note: 'Poco sol directo, ambiente fresco. Riego espaciado.',
        sunHours: 1.5,
      };
    }
  };

  const orientationInfo = getOrientation(headingDegrees);

  // Estimación de Lux según orientación y distancia
  const calculateLux = (): number => {
    let base = 3500;
    if (orientationInfo.code === 'S' || orientationInfo.code === 'SO') base = 5500;
    if (orientationInfo.code === 'E' || orientationInfo.code === 'SE') base = 4200;
    if (orientationInfo.code === 'O') base = 3800;
    if (orientationInfo.code === 'N') base = 2200;

    if (windowDistance === 'junto_a_ventana') return base;
    if (windowDistance === 'media_distancia') return Math.round(base * 0.45);
    return Math.round(base * 0.18);
  };

  const currentLux = calculateLux();

  // Cálculo del Score de Habitabilidad (0 - 100)
  const calculateScore = (): { score: number; verdict: string; recommended: string[]; tips: string[] } => {
    let score = 88;
    const tips: string[] = [];
    const recommended: string[] = [];

    // Ajuste por luz
    if (currentLux > 2000) {
      recommended.push('Monstera Deliciosa', 'Ficus Lyrata', 'Strelitzia Nicolai', 'Pilea Peperomioides');
    } else if (currentLux > 800) {
      recommended.push('Calathea Orbifolia', 'Philodendron Birkin', 'Helecho Boston', 'Epipremnum (Pothos)');
    } else {
      recommended.push('Zamioculca Zamiifolia', 'Sansevieria Trifasciata', 'Aspidistra Elatior', 'Aglaonema');
      tips.push('Luz baja: el consumo de agua será 50% menor. Riega sólo cuando el sustrato esté seco.');
    }

    // Ajuste por radiador
    if (nearRadiator) {
      score -= 12;
      tips.push('Radiador activo en invierno: coloca un plato con guijarros húmedos bajo la maceta para crear un micro-vapor ascendente.');
    }

    // Ajuste por aire acondicionado
    if (nearAC) {
      score -= 10;
      tips.push('Evita que la corriente del aire acondicionado apunte directamente al follaje; provoca caída súbita de hojas.');
    }

    // Ajuste por humedad
    if (humidityLevel === 'alta') {
      score += 6;
      recommended.push('Helechos Tropicales', 'Maranta Leuconeura');
    } else if (humidityLevel === 'seca') {
      score -= 8;
      tips.push('Ambiente seco: pulveriza agua destilada cada 2 días en horas matutinas.');
    }

    score = Math.max(50, Math.min(98, score));

    let verdict = 'Entorno equilibrado de alta habitabilidad';
    if (score >= 90) verdict = 'Microclima óptimo: Crecimiento foliar vigoroso';
    else if (score >= 75) verdict = 'Microclima favorable con precauciones térmicas';
    else verdict = 'Microclima exigente: Requiere especies resistentes';

    return { score, verdict, recommended: Array.from(new Set(recommended)).slice(0, 4), tips };
  };

  const diagnosticResult = calculateScore();

  const handleSave = () => {
    triggerHaptic();
    const custom: CustomMicroclimate = {
      id: `micro_${Date.now()}`,
      name: spaceName.trim() || `Rincón ${orientationInfo.label}`,
      roomType: 'estudio',
      orientation: orientationInfo.code,
      headingDegrees,
      windowDistance,
      estimatedLux: currentLux,
      thermalRisks: {
        nearRadiator,
        nearAC,
        drafts,
      },
      humidityLevel,
      habitabilityScore: diagnosticResult.score,
      verdict: diagnosticResult.verdict,
      recommendedSpecies: diagnosticResult.recommended,
      preventiveTips: diagnosticResult.tips,
      directSunHours: orientationInfo.sunHours,
      iconName: 'espacios_microclimas',
    };
    onSave(custom);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#24372B', '#2E4436', '#1E2D23']}
            style={StyleSheet.absoluteFill}
          />

          {/* CABECERA DEL ESTUDIO */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalBadgeText}>DIAGNÓSTICO BOTÁNICO DE ESPACIO</Text>
              <Text style={styles.modalTitle}>Estudio de Microclima</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* TABS DE PROCESO */}
          <View style={styles.tabsRow}>
            {[
              { id: 'compass', label: '1. Orientación' },
              { id: 'distance', label: '2. Distancia' },
              { id: 'thermal', label: '3. Ambiente' },
              { id: 'verdict', label: '4. Diagnóstico' },
            ].map(tab => {
              const isActive = currentTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabItem, isActive && styles.tabItemActive]}
                  onPress={() => {
                    triggerHaptic();
                    setCurrentTab(tab.id as StudioTab);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabItemText, isActive && styles.tabItemTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CONTENIDO SEGÚN TAB */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* TAB 1: BRÚJULA Y RITMO SOLAR */}
            {currentTab === 'compass' && (
              <View style={styles.tabSection}>
                <Text style={styles.sectionHeading}>Apunta a la ventana principal</Text>
                <Text style={styles.sectionSub}>
                  La dirección hacia donde mira tu ventana determina las horas de sol y el fotoperiodo natural.
                </Text>

                {/* Brújula interactiva visual */}
                <View style={styles.compassVisualWrap}>
                  <View style={styles.compassDial}>
                    <Text style={[styles.compassCardinal, styles.cardinalN]}>N</Text>
                    <Text style={[styles.compassCardinal, styles.cardinalE]}>E</Text>
                    <Text style={[styles.compassCardinal, styles.cardinalS]}>S</Text>
                    <Text style={[styles.compassCardinal, styles.cardinalW]}>O</Text>

                    <View
                      style={[
                        styles.compassNeedle,
                        { transform: [{ rotate: `${headingDegrees}deg` }] },
                      ]}
                    >
                      <View style={styles.needleNorth} />
                      <View style={styles.needleSouth} />
                    </View>
                    <View style={styles.compassCenterPivot} />
                  </View>

                  <View style={styles.headingBadge}>
                    <Text style={styles.headingDegreesText}>{headingDegrees}°</Text>
                    <Text style={styles.headingOrientationText}>{orientationInfo.label}</Text>
                  </View>
                </View>

                {/* Ajuste manual rápido de orientación */}
                <View style={styles.cardinalPillRow}>
                  {[
                    { deg: 0, label: 'Norte' },
                    { deg: 90, label: 'Este' },
                    { deg: 135, label: 'Sureste' },
                    { deg: 180, label: 'Sur' },
                    { deg: 270, label: 'Oeste' },
                  ].map(c => (
                    <TouchableOpacity
                      key={c.label}
                      style={[
                        styles.cardinalPill,
                        Math.abs(headingDegrees - c.deg) < 25 && styles.cardinalPillActive,
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setHeadingDegrees(c.deg);
                      }}
                    >
                      <Text
                        style={[
                          styles.cardinalPillText,
                          Math.abs(headingDegrees - c.deg) < 25 && styles.cardinalPillTextActive,
                        ]}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Tarjeta de impacto botánico */}
                <View style={styles.insightGlassCard}>
                  <View style={styles.insightHeaderRow}>
                    <TreegohIcon name="luz_natural" size={20} color="#84A98C" />
                    <Text style={styles.insightTitle}>Ritmo Solar Estimado</Text>
                  </View>
                  <Text style={styles.insightText}>{orientationInfo.note}</Text>
                  <View style={styles.sunHourBadge}>
                    <Text style={styles.sunHourBadgeText}>
                      ~{orientationInfo.sunHours} horas de insolación directa
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalNextBtn}
                  onPress={() => {
                    triggerHaptic();
                    setCurrentTab('distance');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalNextBtnText}>Siguiente: Distancia a la ventana ›</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 2: DISTANCIA Y LEY INVERSA DEL CUADRADO */}
            {currentTab === 'distance' && (
              <View style={styles.tabSection}>
                <Text style={styles.sectionHeading}>¿A qué distancia está la planta?</Text>
                <Text style={styles.sectionSub}>
                  La luz decae exponencialmente con la distancia. El ojo humano compensa la penumbra, pero las hojas no.
                </Text>

                <View style={styles.optionsStack}>
                  {[
                    {
                      id: 'junto_a_ventana',
                      title: 'Pegada a la ventana (< 50 cm)',
                      desc: '3.500 - 6.000 lux. Máxima fotosíntesis. 100% de luz incidente.',
                      icon: 'luz_natural' as IconName,
                    },
                    {
                      id: 'media_distancia',
                      title: 'Distancia media (1 a 2 metros)',
                      desc: '1.200 - 2.500 lux. Luz brillante filtrada ideal para el 80% de especies.',
                      icon: 'espacios_microclimas' as IconName,
                    },
                    {
                      id: 'rincon_profundo',
                      title: 'Rincón profundo (> 3 metros)',
                      desc: '350 - 800 lux. Zona de penumbra biológica. Solo para plantas de baja exigencia.',
                      icon: 'humedad_vpd' as IconName,
                    },
                  ].map(opt => {
                    const isSel = windowDistance === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.glassSelectRow, isSel && styles.glassSelectRowActive]}
                        onPress={() => {
                          triggerHaptic();
                          setWindowDistance(opt.id as any);
                        }}
                        activeOpacity={0.85}
                      >
                        <TreegohIcon
                          name={opt.icon}
                          size={24}
                          color={isSel ? '#121A15' : '#EAF4ED'}
                        />
                        <View style={{ flex: 1, marginLeft: 14 }}>
                          <Text style={[styles.selectRowTitle, isSel && styles.selectRowTitleActive]}>
                            {opt.title}
                          </Text>
                          <Text style={[styles.selectRowSub, isSel && styles.selectRowSubActive]}>
                            {opt.desc}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Métricas estimadas */}
                <View style={styles.luxSummaryCard}>
                  <Text style={styles.luxSummaryLabel}>Radiación Estimada en el Punto:</Text>
                  <Text style={styles.luxSummaryValue}>{currentLux} Lux</Text>
                  <Text style={styles.luxSummarySub}>
                    {currentLux > 2000
                      ? 'Zona de luz brillante viva. Apta para plantas de crecimiento rápido.'
                      : currentLux > 800
                      ? 'Luz difusa equilibrada. Protege el follaje tierno de quemaduras.'
                      : 'Luz tenue. Riego espaciado para evitar pudrición radicular.'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalNextBtn}
                  onPress={() => {
                    triggerHaptic();
                    setCurrentTab('thermal');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalNextBtnText}>Siguiente: Factores de Estrés Térmico ›</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 3: FACTORES DE ESTRÉS TÉRMICO Y HUMEDAD */}
            {currentTab === 'thermal' && (
              <View style={styles.tabSection}>
                <Text style={styles.sectionHeading}>Fuentes de calor y corrientes</Text>
                <Text style={styles.sectionSub}>
                  El aire caliente forzado y las corrientes frías alteran el VPD (Déficit de Presión de Vapor) foliar.
                </Text>

                <Text style={styles.toggleGroupTitle}>Fuentes cercanas al rincón:</Text>
                <View style={styles.toggleList}>
                  <TouchableOpacity
                    style={[styles.toggleCard, nearRadiator && styles.toggleCardActive]}
                    onPress={() => {
                      triggerHaptic();
                      setNearRadiator(!nearRadiator);
                    }}
                    activeOpacity={0.85}
                  >
                    <TreegohIcon
                      name="temperatura_termica"
                      size={22}
                      color={nearRadiator ? '#121A15' : '#EAF4ED'}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.toggleCardTitle, nearRadiator && styles.toggleCardTitleActive]}>
                        Radiador o Calefacción cerca (menos de 1.5 m)
                      </Text>
                      <Text style={[styles.toggleCardDesc, nearRadiator && styles.toggleCardDescActive]}>
                        Seca el sustrato a velocidad 3x y reseca las puntas de las hojas.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleCard, nearAC && styles.toggleCardActive]}
                    onPress={() => {
                      triggerHaptic();
                      setNearAC(!nearAC);
                    }}
                    activeOpacity={0.85}
                  >
                    <TreegohIcon
                      name="pulverizacion_spray"
                      size={22}
                      color={nearAC ? '#121A15' : '#EAF4ED'}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.toggleCardTitle, nearAC && styles.toggleCardTitleActive]}>
                        Aire Acondicionado o Bomba de calor
                      </Text>
                      <Text style={[styles.toggleCardDesc, nearAC && styles.toggleCardDescActive]}>
                        Ráfagas directas causan choque térmico y caída de hojas.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleCard, drafts && styles.toggleCardActive]}
                    onPress={() => {
                      triggerHaptic();
                      setDrafts(!drafts);
                    }}
                    activeOpacity={0.85}
                  >
                    <TreegohIcon
                      name="voz_botanica"
                      size={22}
                      color={drafts ? '#121A15' : '#EAF4ED'}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.toggleCardTitle, drafts && styles.toggleCardTitleActive]}>
                        Ventilación natural / Corrientes cruzadas
                      </Text>
                      <Text style={[styles.toggleCardDesc, drafts && styles.toggleCardDescActive]}>
                        Renueva el CO2, previene hongos y favorece tallos robustos.
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.toggleGroupTitle, { marginTop: 16 }]}>Humedad ambiental del espacio:</Text>
                <View style={styles.humidityRow}>
                  {[
                    { id: 'alta', label: 'Alta (> 65%)', sub: 'Baño / Cocina' },
                    { id: 'media', label: 'Media (40-60%)', sub: 'Salón estándar' },
                    { id: 'seca', label: 'Seca (< 40%)', sub: 'Calefacción continua' },
                  ].map(h => {
                    const isSel = humidityLevel === h.id;
                    return (
                      <TouchableOpacity
                        key={h.id}
                        style={[styles.humidityPill, isSel && styles.humidityPillActive]}
                        onPress={() => {
                          triggerHaptic();
                          setHumidityLevel(h.id as any);
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.humidityPillLabel, isSel && styles.humidityPillLabelActive]}>
                          {h.label}
                        </Text>
                        <Text style={[styles.humidityPillSub, isSel && styles.humidityPillSubActive]}>
                          {h.sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={styles.modalNextBtn}
                  onPress={() => {
                    triggerHaptic();
                    setCurrentTab('verdict');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalNextBtnText}>Generar Diagnóstico Completo ›</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 4: DIAGNÓSTICO Y VEREDICTO FINAL */}
            {currentTab === 'verdict' && (
              <View style={styles.tabSection}>
                <View style={styles.verdictScoreCard}>
                  <View style={styles.scoreRow}>
                    <View>
                      <Text style={styles.scoreLabel}>Score de Habitabilidad</Text>
                      <Text style={styles.scoreVerdictText}>{diagnosticResult.verdict}</Text>
                    </View>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreNumber}>{diagnosticResult.score}</Text>
                      <Text style={styles.scoreBase}>/100</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.quickMetricsRow}>
                    <View style={styles.quickMetricItem}>
                      <Text style={styles.quickMetricTitle}>Luz</Text>
                      <Text style={styles.quickMetricVal}>{currentLux} Lux</Text>
                    </View>
                    <View style={styles.quickMetricItem}>
                      <Text style={styles.quickMetricTitle}>Rumbo</Text>
                      <Text style={styles.quickMetricVal}>{orientationInfo.code}</Text>
                    </View>
                    <View style={styles.quickMetricItem}>
                      <Text style={styles.quickMetricTitle}>Sol Directo</Text>
                      <Text style={styles.quickMetricVal}>~{orientationInfo.sunHours}h</Text>
                    </View>
                    <View style={styles.quickMetricItem}>
                      <Text style={styles.quickMetricTitle}>Humedad</Text>
                      <Text style={styles.quickMetricVal}>{humidityLevel.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>

                {/* Especies recomendadas para este microclima */}
                <Text style={styles.verdictSectionTitle}>Plantas que prosperarán en este rincón:</Text>
                <View style={styles.recommendedTagsWrap}>
                  {diagnosticResult.recommended.map(sp => (
                    <View key={sp} style={styles.plantBadge}>
                      <TreegohIcon name="floracion_fenologia" size={13} color="#121A15" />
                      <Text style={styles.plantBadgeText}>{sp}</Text>
                    </View>
                  ))}
                </View>

                {/* Alertas y Tips de Cuidado Preventivo */}
                {diagnosticResult.tips.length > 0 && (
                  <>
                    <Text style={[styles.verdictSectionTitle, { marginTop: 14 }]}>
                      Protocolo de Cuidado Preventivo:
                    </Text>
                    {diagnosticResult.tips.map((tip, idx) => (
                      <View key={idx} style={styles.tipCard}>
                        <TreegohIcon name="escudo_fitosanitario" size={16} color="#84A98C" />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Asignación de Nombre */}
                <Text style={[styles.verdictSectionTitle, { marginTop: 14 }]}>
                  Nombre para este microclima:
                </Text>
                <TextInput
                  value={spaceName}
                  onChangeText={setSpaceName}
                  placeholder="Ej: Balcón soleado, Rincón del salón..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  style={styles.nameInput}
                />

                <TouchableOpacity
                  style={styles.btnSaveMicroclimate}
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnSaveMicroclimateText}>
                    Guardar Microclima en mi Santuario
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 12,
  },
  modalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#84A98C',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: '#E8EFE7',
  },
  tabItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  tabItemTextActive: {
    color: '#121A15',
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  tabSection: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 18,
    marginBottom: 6,
  },
  compassVisualWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  compassDial: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  compassCardinal: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '800',
    color: '#84A98C',
  },
  cardinalN: { top: 6 },
  cardinalE: { right: 8 },
  cardinalS: { bottom: 6 },
  cardinalW: { left: 8 },
  compassNeedle: {
    width: 6,
    height: 120,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  needleNorth: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 48,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#E63946',
  },
  needleSouth: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 48,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#A8DADC',
  },
  compassCenterPivot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
  },
  headingBadge: {
    marginTop: 10,
    alignItems: 'center',
  },
  headingDegreesText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headingOrientationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#84A98C',
  },
  cardinalPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginVertical: 4,
  },
  cardinalPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  cardinalPillActive: {
    backgroundColor: '#E8EFE7',
  },
  cardinalPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EAF4ED',
  },
  cardinalPillTextActive: {
    color: '#121A15',
    fontWeight: '700',
  },
  insightGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 14,
    marginTop: 6,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  insightText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginBottom: 8,
  },
  sunHourBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(132, 169, 140, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  sunHourBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B5D8BF',
  },
  modalNextBtn: {
    backgroundColor: '#E8EFE7',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  modalNextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121A15',
  },
  optionsStack: {
    gap: 10,
  },
  glassSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 14,
  },
  glassSelectRowActive: {
    backgroundColor: '#E8EFE7',
    borderColor: '#E8EFE7',
  },
  selectRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectRowTitleActive: {
    color: '#121A15',
  },
  selectRowSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 2,
    lineHeight: 16,
  },
  selectRowSubActive: {
    color: '#2A3C30',
  },
  luxSummaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  luxSummaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  luxSummaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#84A98C',
    marginVertical: 4,
  },
  luxSummarySub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  toggleGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#84A98C',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  toggleList: {
    gap: 8,
    marginTop: 6,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 12,
  },
  toggleCardActive: {
    backgroundColor: '#E8EFE7',
  },
  toggleCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleCardTitleActive: {
    color: '#121A15',
  },
  toggleCardDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    lineHeight: 15,
  },
  toggleCardDescActive: {
    color: '#2A3C30',
  },
  humidityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  humidityPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  humidityPillActive: {
    backgroundColor: '#E8EFE7',
  },
  humidityPillLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  humidityPillLabelActive: {
    color: '#121A15',
  },
  humidityPillSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
  },
  humidityPillSubActive: {
    color: '#2A3C30',
  },
  verdictScoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#84A98C',
    letterSpacing: 0.8,
  },
  scoreVerdictText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 3,
    maxWidth: width * 0.58,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(132, 169, 140, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreBase: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 12,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickMetricItem: {
    alignItems: 'center',
  },
  quickMetricTitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  quickMetricVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  verdictSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#84A98C',
    letterSpacing: 0.5,
  },
  recommendedTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  plantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8EFE7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  plantBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121A15',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    padding: 12,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 17,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 6,
  },
  btnSaveMicroclimate: {
    backgroundColor: '#E8EFE7',
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 18,
  },
  btnSaveMicroclimateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121A15',
  },
});
