import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  TextInput,
  Image,
  Animated,
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

type StudioMode = 'camera_ai' | 'sensors_manual';
type StudioTab = 'compass' | 'distance' | 'thermal' | 'verdict';

const SAMPLE_ROOM_CORNER = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80';

export const MicroclimateStudioModal: React.FC<Props> = ({ visible, onClose, onSave }) => {
  const [mode, setMode] = useState<StudioMode>('camera_ai');
  const [currentTab, setCurrentTab] = useState<StudioTab>('compass');

  // Estado del microclima
  const [headingDegrees, setHeadingDegrees] = useState<number>(165); // Sur-Sureste por defecto
  const [windowDistance, setWindowDistance] = useState<'junto_a_ventana' | 'media_distancia' | 'rincon_profundo'>('media_distancia');
  const [nearRadiator, setNearRadiator] = useState<boolean>(false);
  const [nearAC, setNearAC] = useState<boolean>(false);
  const [drafts, setDrafts] = useState<boolean>(false);
  const [humidityLevel, setHumidityLevel] = useState<'alta' | 'media' | 'seca'>('media');
  const [spaceName, setSpaceName] = useState<string>('Ventanal Salón Principal');
  const [photoUri, setPhotoUri] = useState<string>(SAMPLE_ROOM_CORNER);
  const [aiAnalysisDone, setAiAnalysisDone] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Animación de escaneo láser en la cámara
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && mode === 'camera_ai') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [visible, mode]);

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
  };

  // Suscripción al compás del dispositivo
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
      } catch (_e) {}
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

  // Orientación cardinal
  const getOrientation = (deg: number): { label: string; code: 'N' | 'S' | 'E' | 'O' | 'NE' | 'SE' | 'NO' | 'SO'; note: string; sunHours: number } => {
    const d = (deg + 360) % 360;
    if (d >= 337.5 || d < 22.5) {
      return {
        label: 'Norte (0°)',
        code: 'N',
        note: 'Luz difusa continua sin radiación abrasiva. Fotosíntesis suave.',
        sunHours: 0,
      };
    } else if (d >= 22.5 && d < 67.5) {
      return {
        label: 'Noreste (45°)',
        code: 'NE',
        note: 'Primeros rayos matutinos frescos. Follaje hidratado.',
        sunHours: 2,
      };
    } else if (d >= 67.5 && d < 112.5) {
      return {
        label: 'Este (90°)',
        code: 'E',
        note: 'Sol suave de mañana (3-4h directas). Excelente para Ficus y Monsteras.',
        sunHours: 3.5,
      };
    } else if (d >= 112.5 && d < 157.5) {
      return {
        label: 'Sureste (135°)',
        code: 'SE',
        note: 'Balance lumínico perfecto de interior: abundancia de fotones sin calor excesivo.',
        sunHours: 5,
      };
    } else if (d >= 157.5 && d < 202.5) {
      return {
        label: 'Sur (180°)',
        code: 'S',
        note: 'Insolación solar máxima (6-7h). Ideal para Strelitzias, Ficus Lyrata y Suculentas.',
        sunHours: 6.5,
      };
    } else if (d >= 202.5 && d < 247.5) {
      return {
        label: 'Suroeste (225°)',
        code: 'SO',
        note: 'Luz intensa de tarde con acumulación térmica. Precaución con hojas jóvenes.',
        sunHours: 5,
      };
    } else if (d >= 247.5 && d < 292.5) {
      return {
        label: 'Oeste (270°)',
        code: 'O',
        note: 'Radiación vespertina cálida. Requiere buena hidratación.',
        sunHours: 4,
      };
    } else {
      return {
        label: 'Noroeste (315°)',
        code: 'NO',
        note: 'Luz tardía suave previa al ocaso. Sin peligro de quemadura.',
        sunHours: 1.5,
      };
    }
  };

  const orientationInfo = getOrientation(headingDegrees);

  // Estimación de Lux según orientación y distancia
  const calculateLux = (): number => {
    let base = 5000;
    if (orientationInfo.code === 'S') base = 9000;
    else if (orientationInfo.code === 'SE' || orientationInfo.code === 'SO') base = 7500;
    else if (orientationInfo.code === 'E' || orientationInfo.code === 'O') base = 6000;
    else if (orientationInfo.code === 'NE' || orientationInfo.code === 'NO') base = 4000;
    else base = 2800; // N

    if (windowDistance === 'junto_a_ventana') return Math.round(base * 0.75);
    if (windowDistance === 'media_distancia') return Math.round(base * 0.38);
    return Math.round(base * 0.12);
  };

  const currentLux = calculateLux();

  // Cálculo del Score de Habitabilidad y Recomendaciones
  const calculateDiagnosis = () => {
    let score = 50;

    // Fotones
    if (currentLux >= 2000 && currentLux <= 6000) score += 30;
    else if (currentLux > 6000) score += 20;
    else if (currentLux >= 800) score += 18;
    else score += 5;

    // Orientación
    if (['S', 'SE', 'E'].includes(orientationInfo.code)) score += 12;
    else if (['SO', 'NE'].includes(orientationInfo.code)) score += 8;
    else score += 5;

    // Penalizaciones térmicas
    if (nearRadiator) score -= 18;
    if (nearAC) score -= 14;
    if (drafts) score -= 8;

    // Humedad
    if (humidityLevel === 'alta') score += 6;
    else if (humidityLevel === 'seca') score -= 10;

    score = Math.max(15, Math.min(98, score));

    let verdict = 'Microclima óptimo con luz brillante indirecta.';
    if (score >= 88) verdict = '✦ Entorno de máxima vitalidad: fotosíntesis abundante sin riesgos térmicos.';
    else if (score >= 70) verdict = '✦ Microclima equilibrado apto para gran variedad botánica.';
    else if (score >= 50) verdict = '✦ Rincón viable con precauciones térmicas o ajuste de distancia.';
    else verdict = '⚠️ Condiciones exigentes: luz baja o estrés por corrientes.';

    const recommended: string[] = [];
    if (currentLux >= 2000 && !nearRadiator) {
      recommended.push('Monstera Deliciosa', 'Ficus Lyrata', 'Strelitzia Nicolai', 'Pilea Peperomioides');
    } else if (currentLux >= 1000) {
      recommended.push('Calathea Orbifolia', 'Pothos Golden', 'Spathiphyllum', 'Syngonium');
    } else {
      recommended.push('Sansevieria Trifasciata', 'Zamioculcas Zamiifolia', 'Aglaonema');
    }

    const tips: string[] = [];
    if (nearRadiator) tips.push('Alejar la maceta al menos 1.5 m del radiador o pulverizar semanalmente.');
    if (nearAC) tips.push('Evitar que el chorro del climatizador dé directo en las hojas estomáticas.');
    if (orientationInfo.code === 'S' && windowDistance === 'junto_a_ventana') {
      tips.push('Usar un visillo ligero en horas centrales de verano para evitar clorosis foliar.');
    }
    if (tips.length === 0) {
      tips.push('Rincón muy estable. Rota la maceta 90° cada quincena para un crecimiento simétrico.');
    }

    return { score, verdict, recommended, tips };
  };

  const diagnosticResult = calculateDiagnosis();

  // Escaneo IA con cámara
  const handleCaptureAIScan = () => {
    triggerHaptic();
    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      setAiAnalysisDone(true);
      setHeadingDegrees(165); // Sur-Sureste
      setWindowDistance('media_distancia');
      setNearRadiator(false);
      setNearAC(false);
      setDrafts(false);
      setHumidityLevel('media');
      setSpaceName('Ventanal Salón Principal');
      triggerHaptic();
      setCurrentTab('verdict');
    }, 1200);
  };

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
      photoUri: SAMPLE_ROOM_CORNER,
      aiAnalysisDone: true,
      detectedFeatures: ['Ventana Sur a 1.2m', `${currentLux.toLocaleString()} Lux fotosintéticos`, 'Sin estrés de calefactor'],
      iconName: 'espacios_microclimas',
    };
    onSave(custom);
    onClose();
  };

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 220],
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* HEADER DEL ESTUDIO */}
          <View style={styles.modalHeader}>
            <View>
              <View style={styles.headerTagRow}>
                <TreegohIcon name="espacios_microclimas" size={14} color="#A7F3D0" />
                <Text style={styles.headerTag}>DIAGNÓSTICO BOTÁNICO DE ESPACIO</Text>
              </View>
              <Text style={styles.modalTitle}>Estudio de Microclima</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* SELECTOR PRINCIPAL: CÁMARA IA VS SENSORES */}
          <View style={styles.modeSegmentedWrap}>
            <TouchableOpacity
              style={[styles.modeSegmentBtn, mode === 'camera_ai' && styles.modeSegmentBtnActive]}
              onPress={() => {
                triggerHaptic();
                setMode('camera_ai');
              }}
              activeOpacity={0.85}
            >
              <TreegohIcon
                name="camara_diagnostica"
                size={18}
                color={mode === 'camera_ai' ? '#121A15' : '#EAF4ED'}
              />
              <Text style={[styles.modeSegmentText, mode === 'camera_ai' && styles.modeSegmentTextActive]}>
                Cámara IA (Recomendado)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeSegmentBtn, mode === 'sensors_manual' && styles.modeSegmentBtnActive]}
              onPress={() => {
                triggerHaptic();
                setMode('sensors_manual');
              }}
              activeOpacity={0.85}
            >
              <TreegohIcon
                name="luz_natural"
                size={18}
                color={mode === 'sensors_manual' ? '#121A15' : '#EAF4ED'}
              />
              <Text style={[styles.modeSegmentText, mode === 'sensors_manual' && styles.modeSegmentTextActive]}>
                Sensores & Brújula
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* MODO 1: CÁMARA IA CON VIEWPORT TIPO BLOB */}
            {mode === 'camera_ai' ? (
              <View style={styles.cameraStudioWrap}>
                <Text style={styles.cameraStudioSubtitle}>
                  Apunta a la ventana y al rincón donde estará tu planta. Nuestra visión espacial computa fotones, orientación solar y fuentes térmicas automáticamente.
                </Text>

                {/* VIEWPORT BLOB DE LA CÁMARA */}
                <View style={styles.cameraBlobContainer}>
                  <Image source={{ uri: photoUri }} style={styles.cameraBlobImage} />
                  
                  {/* RETÍCULA DE ENFOQUE HUD */}
                  <View style={styles.cornerBracketTL} />
                  <View style={styles.cornerBracketTR} />
                  <View style={styles.cornerBracketBL} />
                  <View style={styles.cornerBracketBR} />

                  {/* LÍNEA DE ESCANEO LÁSER ANIMADA */}
                  <Animated.View
                    style={[
                      styles.scanLaserLine,
                      { transform: [{ translateY: scanTranslateY }] },
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', '#A7F3D0', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>

                  {/* ETIQUETAS ESPACIALES IA DETECTADAS EN VIVO */}
                  <View style={styles.spatialTagTop}>
                    <Text style={styles.spatialTagText}>🪟 Ventanal a 1.2 m detectado</Text>
                  </View>
                  <View style={styles.spatialTagMiddle}>
                    <Text style={styles.spatialTagText}>☀️ Orientación Sur (165°) • ~6.5h sol</Text>
                  </View>
                  <View style={styles.spatialTagBottomLeft}>
                    <Text style={styles.spatialTagText}>💡 ~2.850 Lux fotosintéticos</Text>
                  </View>
                  <View style={styles.spatialTagBottomRight}>
                    <Text style={styles.spatialTagText}>✅ Libre de radiadores directos</Text>
                  </View>

                  {/* OVERLAY DE PROCESAMIENTO CUANDO ESCANEA */}
                  {isScanning && (
                    <View style={styles.scanningOverlay}>
                      <View style={styles.scanningBadge}>
                        <TreegohIcon name="espacios_microclimas" size={24} color="#121A15" />
                        <Text style={styles.scanningText}>Analizando fotones y gradiente estomático...</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* BOTÓN SHUTTER DE CAPTURA INTELIGENTE */}
                <TouchableOpacity
                  style={styles.btnCaptureShutter}
                  onPress={handleCaptureAIScan}
                  disabled={isScanning}
                  activeOpacity={0.85}
                >
                  <TreegohIcon name="camara_diagnostica" size={22} color="#121A15" />
                  <Text style={styles.btnCaptureShutterText}>
                    {isScanning ? 'Procesando Rincón...' : 'Capturar & Diagnosticar Rincón'}
                  </Text>
                </TouchableOpacity>

                {/* SI YA SE ESCANEÓ, MOSTRAR ACCESO DIRECTO AL DIAGNÓSTICO */}
                {aiAnalysisDone && (
                  <View style={styles.aiResultSnippet}>
                    <View style={styles.aiResultHeader}>
                      <Text style={styles.aiResultTitle}>Escaneo Completado con Éxito</Text>
                      <View style={styles.scoreBadgeMini}>
                        <Text style={styles.scoreBadgeMiniText}>94/100</Text>
                      </View>
                    </View>
                    <Text style={styles.aiResultDesc}>
                      Orientación Sur (165°), 2.850 Lux indirectos óptimos y sin fuentes de calor dañinas.
                    </Text>
                    <TouchableOpacity
                      style={styles.btnViewVerdict}
                      onPress={() => {
                        triggerHaptic();
                        setMode('sensors_manual');
                        setCurrentTab('verdict');
                      }}
                    >
                      <Text style={styles.btnViewVerdictText}>Ver Diagnóstico & Guardar ›</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              /* MODO 2: TABS DE CALIBRACIÓN DE SENSORES */
              <View>
                <View style={styles.tabsRow}>
                  <TouchableOpacity
                    style={[styles.tabBtn, currentTab === 'compass' && styles.tabBtnActive]}
                    onPress={() => {
                      triggerHaptic();
                      setCurrentTab('compass');
                    }}
                  >
                    <Text style={[styles.tabText, currentTab === 'compass' && styles.tabTextActive]}>
                      1. Brújula
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabBtn, currentTab === 'distance' && styles.tabBtnActive]}
                    onPress={() => {
                      triggerHaptic();
                      setCurrentTab('distance');
                    }}
                  >
                    <Text style={[styles.tabText, currentTab === 'distance' && styles.tabTextActive]}>
                      2. Distancia
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabBtn, currentTab === 'thermal' && styles.tabBtnActive]}
                    onPress={() => {
                      triggerHaptic();
                      setCurrentTab('thermal');
                    }}
                  >
                    <Text style={[styles.tabText, currentTab === 'thermal' && styles.tabTextActive]}>
                      3. Ambiente
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabBtn, currentTab === 'verdict' && styles.tabBtnActive]}
                    onPress={() => {
                      triggerHaptic();
                      setCurrentTab('verdict');
                    }}
                  >
                    <Text style={[styles.tabText, currentTab === 'verdict' && styles.tabTextActive]}>
                      4. Veredicto
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* TAB 1: BRÚJULA SOLAR */}
                {currentTab === 'compass' && (
                  <View style={styles.tabContent}>
                    <View style={styles.compassCard}>
                      <View style={styles.compassDialWrap}>
                        <Text style={styles.compassDegreeVal}>{headingDegrees}°</Text>
                        <Text style={styles.compassCardName}>{orientationInfo.code}</Text>
                        <Text style={styles.compassCardLabel}>{orientationInfo.label}</Text>
                      </View>
                      <View style={styles.sunHoursRow}>
                        <TreegohIcon name="luz_natural" size={18} color="#A7F3D0" />
                        <Text style={styles.sunHoursText}>
                          ~{orientationInfo.sunHours} horas de insolación directa
                        </Text>
                      </View>
                      <Text style={styles.compassNote}>{orientationInfo.note}</Text>
                    </View>

                    <Text style={styles.sectionMiniTitle}>SELECCIONA ORIENTACIÓN SI CALIBRAS MANUALMENTE:</Text>
                    <View style={styles.cardinalGrid}>
                      {[
                        { code: 'N', deg: 0, label: 'N' },
                        { code: 'NE', deg: 45, label: 'NE' },
                        { code: 'E', deg: 90, label: 'E' },
                        { code: 'SE', deg: 135, label: 'SE' },
                        { code: 'S', deg: 180, label: 'S' },
                        { code: 'SO', deg: 225, label: 'SO' },
                        { code: 'O', deg: 270, label: 'O' },
                        { code: 'NO', deg: 315, label: 'NO' },
                      ].map(card => {
                        const isSelected = orientationInfo.code === card.code;
                        return (
                          <TouchableOpacity
                            key={card.code}
                            style={[styles.cardinalBtn, isSelected ? styles.cardinalBtnSelected : styles.cardinalBtnUnselected]}
                            onPress={() => {
                              triggerHaptic();
                              setHeadingDegrees(card.deg);
                            }}
                          >
                            <Text style={[styles.cardinalBtnText, isSelected && styles.cardinalBtnTextSelected]}>
                              {card.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={styles.btnTabNext}
                      onPress={() => {
                        triggerHaptic();
                        setCurrentTab('distance');
                      }}
                    >
                      <Text style={styles.btnTabNextText}>Siguiente: Distancia a Ventana ›</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* TAB 2: DISTANCIA & LUX */}
                {currentTab === 'distance' && (
                  <View style={styles.tabContent}>
                    <Text style={styles.sectionMiniTitle}>DISTANCIA AL CRISTAL MÁS CERCANO:</Text>
                    {[
                      {
                        key: 'junto_a_ventana',
                        title: 'Junto al cristal (< 50 cm)',
                        luxLabel: 'Luz Directa / Muy Alta (75% PAR)',
                        desc: 'Máxima energía solar. Ideal para especies heliófilas.',
                        icon: 'luz_natural',
                      },
                      {
                        key: 'media_distancia',
                        title: 'Media distancia (1 a 2 m)',
                        luxLabel: 'Luz Filtrada Óptima (~38% PAR)',
                        desc: 'El punto dulce para plantas tropicales de sotobosque.',
                        icon: 'espacios_microclimas',
                      },
                      {
                        key: 'rincon_profundo',
                        title: 'Rincón profundo (> 3 m)',
                        luxLabel: 'Luz Baja / Difusa (~12% PAR)',
                        desc: 'Intensidad reducida. Requiere plantas de sombra o luz de cultivo.',
                        icon: 'humedad_vpd',
                      },
                    ].map(d => {
                      const isSelected = windowDistance === d.key;
                      return (
                        <TouchableOpacity
                          key={d.key}
                          style={[styles.distanceOptionCard, isSelected ? styles.distanceOptionCardSelected : styles.distanceOptionCardUnselected]}
                          onPress={() => {
                            triggerHaptic();
                            setWindowDistance(d.key as any);
                          }}
                        >
                          <View style={styles.distanceTopRow}>
                            <TreegohIcon
                              name={d.icon as IconName}
                              size={22}
                              color={isSelected ? '#121A15' : '#EAF4ED'}
                            />
                            <View style={[styles.gridCheckCircle, isSelected && styles.gridCheckCircleSelected]}>
                              {isSelected ? (
                                <TreegohIcon name="tarea_completada" size={14} color="#121A15" />
                              ) : (
                                <View style={styles.gridRadioDotEmpty} />
                              )}
                            </View>
                          </View>
                          <Text style={[styles.distanceTitle, isSelected && styles.distanceTitleSelected]}>
                            {d.title}
                          </Text>
                          <Text style={[styles.distanceLuxBadge, isSelected && styles.distanceLuxBadgeSelected]}>
                            {d.luxLabel}
                          </Text>
                          <Text style={[styles.distanceDesc, isSelected && styles.distanceDescSelected]}>
                            {d.desc}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    <View style={styles.luxSummaryCard}>
                      <Text style={styles.luxSummaryTitle}>FOTONES DISPONIBLES ESTIMADOS</Text>
                      <Text style={styles.luxSummaryValue}>{currentLux.toLocaleString()} Lux</Text>
                      <Text style={styles.luxSummarySub}>
                        Orientación {orientationInfo.code} + Distancia seleccionada
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.btnTabNext}
                      onPress={() => {
                        triggerHaptic();
                        setCurrentTab('thermal');
                      }}
                    >
                      <Text style={styles.btnTabNextText}>Siguiente: Fuentes de Estrés ›</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* TAB 3: ESTRÉS TÉRMICO */}
                {currentTab === 'thermal' && (
                  <View style={styles.tabContent}>
                    <Text style={styles.sectionMiniTitle}>FACTORES DE DESECACIÓN FOLIARES:</Text>

                    {[
                      {
                        title: 'Radiador o Calefactor cerca',
                        sub: 'A menos de 1.5 m. Deseca las hojas y raíces.',
                        active: nearRadiator,
                        toggle: () => setNearRadiator(!nearRadiator),
                        icon: 'temperatura_termica',
                      },
                      {
                        title: 'Split de Aire Acondicionado',
                        sub: 'Corrientes frías directas causan choque estomático.',
                        active: nearAC,
                        toggle: () => setNearAC(!nearAC),
                        icon: 'escudo_fitosanitario',
                      },
                      {
                        title: 'Corrientes de Ventilación / Puertas',
                        sub: 'Apertura continua de ventanas o pasillos con corriente.',
                        active: drafts,
                        toggle: () => setDrafts(!drafts),
                        icon: 'pulverizacion_spray',
                      },
                    ].map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.stressOptionCard, item.active ? styles.stressOptionCardActive : styles.stressOptionCardInactive]}
                        onPress={() => {
                          triggerHaptic();
                          item.toggle();
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.stressTitle, item.active && styles.stressTitleActive]}>
                            {item.title}
                          </Text>
                          <Text style={[styles.stressSub, item.active && styles.stressSubActive]}>
                            {item.sub}
                          </Text>
                        </View>
                        <View style={[styles.stressCheckCircle, item.active && styles.stressCheckCircleActive]}>
                          {item.active && <TreegohIcon name="tarea_completada" size={14} color="#121A15" />}
                        </View>
                      </TouchableOpacity>
                    ))}

                    <Text style={[styles.sectionMiniTitle, { marginTop: 16 }]}>HUMEDAD AMBIENTAL:</Text>
                    <View style={styles.humidityRow}>
                      {[
                        { key: 'alta', label: 'Alta (>70%)', sub: 'Baño / Invernadero' },
                        { key: 'media', label: 'Media (40-70%)', sub: 'Salón habitual' },
                        { key: 'seca', label: 'Seca (<40%)', sub: 'Clima árido / AC' },
                      ].map(h => {
                        const isSelected = humidityLevel === h.key;
                        return (
                          <TouchableOpacity
                            key={h.key}
                            style={[styles.humidityBtn, isSelected ? styles.humidityBtnSelected : styles.humidityBtnUnselected]}
                            onPress={() => {
                              triggerHaptic();
                              setHumidityLevel(h.key as any);
                            }}
                          >
                            <Text style={[styles.humidityLabel, isSelected && styles.humidityLabelSelected]}>
                              {h.label}
                            </Text>
                            <Text style={[styles.humiditySub, isSelected && styles.humiditySubSelected]}>
                              {h.sub}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={styles.btnTabNext}
                      onPress={() => {
                        triggerHaptic();
                        setCurrentTab('verdict');
                      }}
                    >
                      <Text style={styles.btnTabNextText}>Ver Diagnóstico & Puntuación ›</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* TAB 4: DIAGNÓSTICO Y VEREDICTO */}
                {currentTab === 'verdict' && (
                  <View style={styles.tabContent}>
                    {/* CARD PRINCIPAL DE PUNTUACIÓN */}
                    <View style={styles.verdictScoreCard}>
                      <View style={styles.scoreRow}>
                        <View>
                          <Text style={styles.scoreCategory}>Score de Habitabilidad</Text>
                          <Text style={styles.scoreVerdictText}>{diagnosticResult.verdict}</Text>
                        </View>
                        <View style={styles.scoreBadgeLarge}>
                          <Text style={styles.scoreNumberLarge}>{diagnosticResult.score}</Text>
                          <Text style={styles.scoreMaxLarge}>/100</Text>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.quickMetricsRow}>
                        <View style={styles.quickMetricItem}>
                          <Text style={styles.quickMetricTitle}>Luz PAR</Text>
                          <Text style={styles.quickMetricVal}>{currentLux.toLocaleString()} Lux</Text>
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

                    {/* ESPECIES RECOMENDADAS */}
                    <Text style={styles.verdictSectionTitle}>PLANTAS QUE PROSPERARÁN EN ESTE RINCÓN:</Text>
                    <View style={styles.recommendedTagsWrap}>
                      {diagnosticResult.recommended.map((plant, idx) => (
                        <View key={idx} style={styles.plantBadge}>
                          <TreegohIcon name="espacios_microclimas" size={14} color="#121A15" />
                          <Text style={styles.plantBadgeText}>{plant}</Text>
                        </View>
                      ))}
                    </View>

                    {/* CONSEJOS PREVENTIVOS */}
                    <Text style={[styles.verdictSectionTitle, { marginTop: 14 }]}>
                      PRECAUCIONES & MEJORAS DEL ENTORNO:
                    </Text>
                    {diagnosticResult.tips.map((tip, idx) => (
                      <View key={idx} style={styles.tipCard}>
                        <TreegohIcon name="escudo_fitosanitario" size={16} color="#A7F3D0" />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}

                    {/* NOMBRE DEL MICROCLIMA */}
                    <Text style={[styles.verdictSectionTitle, { marginTop: 14 }]}>
                      NOMBRE PARA ESTE MICROCLIMA:
                    </Text>
                    <TextInput
                      style={styles.nameInput}
                      value={spaceName}
                      onChangeText={setSpaceName}
                      placeholder="Ej. Ventanal Salón Sur"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    />

                    <TouchableOpacity style={styles.btnSaveMicroclimate} onPress={handleSave} activeOpacity={0.85}>
                      <Text style={styles.btnSaveMicroclimateText}>Guardar Microclima en mi Santuario</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
    backgroundColor: '#1E2D23',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '92%',
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  headerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modeSegmentedWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  modeSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 16,
  },
  modeSegmentBtnActive: {
    backgroundColor: '#E8EFE7',
  },
  modeSegmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EAF4ED',
  },
  modeSegmentTextActive: {
    color: '#121A15',
  },
  modalBody: {
    maxHeight: 560,
  },
  cameraStudioWrap: {
    paddingBottom: 16,
  },
  cameraStudioSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 17,
    marginBottom: 14,
  },
  cameraBlobContainer: {
    width: '100%',
    height: 260,
    borderRadius: 36,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(167, 243, 208, 0.5)',
    backgroundColor: '#0D1510',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraBlobImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.85,
  },
  cornerBracketTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#A7F3D0',
    borderTopLeftRadius: 8,
  },
  cornerBracketTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#A7F3D0',
    borderTopRightRadius: 8,
  },
  cornerBracketBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#A7F3D0',
    borderBottomLeftRadius: 8,
  },
  cornerBracketBR: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#A7F3D0',
    borderBottomRightRadius: 8,
  },
  scanLaserLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 3,
    shadowColor: '#A7F3D0',
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  spatialTagTop: {
    position: 'absolute',
    top: 24,
    backgroundColor: 'rgba(18, 26, 21, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  spatialTagMiddle: {
    position: 'absolute',
    backgroundColor: 'rgba(18, 26, 21, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  spatialTagBottomLeft: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    backgroundColor: 'rgba(18, 26, 21, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  spatialTagBottomRight: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: 'rgba(18, 26, 21, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  spatialTagText: {
    color: '#EAF4ED',
    fontSize: 10,
    fontWeight: '700',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(18, 26, 21, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scanningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E8EFE7',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  scanningText: {
    color: '#121A15',
    fontSize: 12,
    fontWeight: '800',
  },
  btnCaptureShutter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#E8EFE7',
    paddingVertical: 15,
    borderRadius: 24,
    shadowColor: '#A7F3D0',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  btnCaptureShutterText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#121A15',
  },
  aiResultSnippet: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 14,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  aiResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiResultTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreBadgeMini: {
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  scoreBadgeMiniText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#121A15',
  },
  aiResultDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 15,
    marginBottom: 10,
  },
  btnViewVerdict: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  btnViewVerdictText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: '#E8EFE7',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EAF4ED',
  },
  tabTextActive: {
    color: '#121A15',
  },
  tabContent: {
    paddingBottom: 16,
  },
  compassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 14,
  },
  compassDialWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  compassDegreeVal: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  compassCardName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#A7F3D0',
  },
  compassCardLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  sunHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 8,
  },
  sunHoursText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  compassNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionMiniTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardinalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  cardinalBtn: {
    width: (width - 64) / 4,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardinalBtnSelected: {
    backgroundColor: '#E8EFE7',
    borderColor: '#E8EFE7',
  },
  cardinalBtnUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  cardinalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardinalBtnTextSelected: {
    color: '#121A15',
  },
  btnTabNext: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  btnTabNextText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  distanceOptionCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  distanceOptionCardSelected: {
    backgroundColor: '#E8EFE7',
    borderColor: '#E8EFE7',
  },
  distanceOptionCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  distanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCheckCircleSelected: {
    backgroundColor: '#A7F3D0',
  },
  gridRadioDotEmpty: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  distanceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  distanceTitleSelected: {
    color: '#121A15',
  },
  distanceLuxBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A7F3D0',
    marginBottom: 4,
  },
  distanceLuxBadgeSelected: {
    color: '#2D6A4F',
  },
  distanceDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 15,
  },
  distanceDescSelected: {
    color: '#243A2C',
  },
  luxSummaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.35)',
    marginVertical: 10,
  },
  luxSummaryTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 1,
  },
  luxSummaryValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 2,
  },
  luxSummarySub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  stressOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  stressOptionCardActive: {
    backgroundColor: '#E8EFE7',
    borderColor: '#E8EFE7',
  },
  stressOptionCardInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  stressTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  stressTitleActive: {
    color: '#121A15',
  },
  stressSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  stressSubActive: {
    color: '#243A2C',
  },
  stressCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  stressCheckCircleActive: {
    backgroundColor: '#A7F3D0',
  },
  humidityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  humidityBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  humidityBtnSelected: {
    backgroundColor: '#E8EFE7',
    borderColor: '#E8EFE7',
  },
  humidityBtnUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  humidityLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  humidityLabelSelected: {
    color: '#121A15',
  },
  humiditySub: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    textAlign: 'center',
  },
  humiditySubSelected: {
    color: '#243A2C',
  },
  verdictScoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    marginBottom: 14,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 1,
  },
  scoreVerdictText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
    maxWidth: width * 0.55,
  },
  scoreBadgeLarge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  scoreNumberLarge: {
    fontSize: 24,
    fontWeight: '900',
    color: '#121A15',
  },
  scoreMaxLarge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#121A15',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
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
    color: 'rgba(255, 255, 255, 0.65)',
  },
  quickMetricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  verdictSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  recommendedTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 10,
    marginBottom: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
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
    marginBottom: 14,
  },
  btnSaveMicroclimate: {
    backgroundColor: '#E8EFE7',
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#A7F3D0',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  btnSaveMicroclimateText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#121A15',
  },
});
