import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Rect,
  Circle,
  Line,
  Polygon,
  G,
  Path,
  Text as SvgText,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { TreegohIcon } from './TreegohIcon';
import { BlobAnimatedCard, GlassCardSheen } from './BlobAnimatedCard';
import { Fonts } from '../constants/theme';
import { FullAnnualSolarReport } from '../utils/solarEngine';

interface SpatialSolarPlanProps {
  headingDegrees: number;
  orientationCode: 'N' | 'S' | 'E' | 'O' | 'NE' | 'SE' | 'NO' | 'SO';
  windowDistance: 'junto_a_ventana' | 'media_distancia' | 'rincon_profundo';
  floorLevel: 'baja' | 'media' | 'alta';
  floorNumber?: number;
  selectedSeason: 'hoy' | 'invierno' | 'primavera' | 'verano';
  onSelectSeason: (season: 'hoy' | 'invierno' | 'primavera' | 'verano') => void;
  onSelectFloorLevel: (level: 'baja' | 'media' | 'alta') => void;
  onSelectFloorNumber?: (floorNum: number) => void;
  solarReport: FullAnnualSolarReport;
  userAddress?: string;
  floorOrApt?: string;
  scrollX?: Animated.Value;
  pageIndex?: number;
  pageWidth?: number;
  isActivePage?: boolean;
}

export const SpatialSolarPlanView: React.FC<SpatialSolarPlanProps> = ({
  headingDegrees,
  orientationCode,
  windowDistance,
  floorNumber = 3,
  selectedSeason,
  onSelectSeason,
  onSelectFloorLevel,
  onSelectFloorNumber,
  solarReport,
  userAddress,
  scrollX,
  pageIndex = 2,
  pageWidth = 390,
  isActivePage = false,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const [measuredPlanWidth, setMeasuredPlanWidth] = useState<number>(
    Math.max(260, windowWidth - 48)
  );
  const [floorInputText, setFloorInputText] = useState<string>(String(floorNumber));

  useEffect(() => {
    setFloorInputText(String(floorNumber));
  }, [floorNumber]);

  const triggerLightHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
  };

  const applyFloorNumber = (rawFloor: number) => {
    const clamped = Math.max(0, Math.min(99, rawFloor));
    if (onSelectFloorNumber) {
      onSelectFloorNumber(clamped);
    }
    const derivedLevel = clamped <= 0 ? 'baja' : clamped >= 6 ? 'alta' : 'media';
    onSelectFloorLevel(derivedLevel);
  };

  const handleStepFloor = (delta: number) => {
    triggerLightHaptic();
    applyFloorNumber(floorNumber + delta);
  };

  const setFloorDirect = (num: number) => {
    triggerLightHaptic();
    applyFloorNumber(num);
  };

  const svgWidth = Math.max(240, measuredPlanWidth - 16);
  const svgHeight = 220;

  const roomW = svgWidth * 0.76;
  const roomH = 145;
  const roomX = (svgWidth - roomW) / 2;
  const roomY = 38;

  let winX1 = roomX + roomW * 0.25;
  let winX2 = roomX + roomW * 0.75;
  let winY1 = roomY + roomH;
  let winY2 = roomY + roomH;

  if (orientationCode === 'N') {
    winY1 = roomY;
    winY2 = roomY;
  } else if (orientationCode === 'E') {
    winX1 = roomX + roomW;
    winX2 = roomX + roomW;
    winY1 = roomY + roomH * 0.25;
    winY2 = roomY + roomH * 0.75;
  } else if (orientationCode === 'O') {
    winX1 = roomX;
    winX2 = roomX;
    winY1 = roomY + roomH * 0.25;
    winY2 = roomY + roomH * 0.75;
  }

  let plantX = roomX + roomW * 0.5;
  let plantY = roomY + roomH * 0.5;

  if (windowDistance === 'junto_a_ventana') {
    if (orientationCode === 'S') plantY = winY1 - 22;
    else if (orientationCode === 'N') plantY = winY1 + 22;
    else if (orientationCode === 'E') plantX = winX1 - 22;
    else if (orientationCode === 'O') plantX = winX1 + 22;
  } else if (windowDistance === 'media_distancia') {
    if (orientationCode === 'S') plantY = winY1 - 50;
    else if (orientationCode === 'N') plantY = winY1 + 50;
    else if (orientationCode === 'E') plantX = winX1 - 50;
    else if (orientationCode === 'O') plantX = winX1 + 50;
  } else {
    if (orientationCode === 'S') plantY = roomY + 24;
    else if (orientationCode === 'N') plantY = roomY + roomH - 24;
    else if (orientationCode === 'E') plantX = roomX + 24;
    else if (orientationCode === 'O') plantX = roomX + roomW - 24;
  }

  const beamDepth =
    selectedSeason === 'invierno'
      ? roomH * 0.85
      : selectedSeason === 'verano'
      ? roomH * 0.45
      : roomH * 0.65;
  const spreadX = selectedSeason === 'invierno' ? 38 : 18;

  let beamPolygon = '';
  if (orientationCode === 'S') {
    beamPolygon = `${winX1},${winY1} ${winX2},${winY2} ${winX2 + spreadX},${
      winY2 - beamDepth
    } ${winX1 - spreadX},${winY1 - beamDepth}`;
  } else if (orientationCode === 'N') {
    beamPolygon = `${winX1},${winY1} ${winX2},${winY2} ${winX2 + spreadX},${
      winY2 + beamDepth
    } ${winX1 - spreadX},${winY1 + beamDepth}`;
  } else if (orientationCode === 'E') {
    beamPolygon = `${winX1},${winY1} ${winX2},${winY2} ${winX2 - beamDepth},${
      winY2 + spreadX
    } ${winX1 - beamDepth},${winY1 - spreadX}`;
  } else {
    beamPolygon = `${winX1},${winY1} ${winX2},${winY2} ${winX2 + beamDepth},${
      winY2 + spreadX
    } ${winX1 + beamDepth},${winY1 - spreadX}`;
  }

  const activeProfile =
    selectedSeason === 'invierno'
      ? solarReport.winterProfile
      : selectedSeason === 'primavera'
      ? solarReport.springProfile
      : selectedSeason === 'verano'
      ? solarReport.summerProfile
      : solarReport.todayProfile;

  return (
    <View style={styles.container}>
      {/* CABECERA DE DIRECCIÓN GPS & ALTURA */}
      <BlobAnimatedCard
        scrollX={scrollX}
        pageIndex={pageIndex}
        pageWidth={pageWidth}
        cardIndex={0}
        isActivePage={isActivePage}
      >
        <View style={styles.addressPillCard}>
          <GlassCardSheen />
          <View style={styles.addressLeft}>
            <View style={styles.addressIconWrap}>
              <TreegohIcon name="espacios_microclimas" size={20} color="#FFFFFF" glow />
            </View>
            <View style={styles.addressTextCol}>
              <Text style={styles.addressTitle} numberOfLines={2}>
                {userAddress || 'Ubicación Geocodificada'}
              </Text>
              <Text style={styles.addressSub} numberOfLines={2}>
                {floorNumber === 0 ? 'Planta Baja' : `Piso ${floorNumber}º`} • Lat{' '}
                {solarReport.latitude.toFixed(3)}°, Lon {solarReport.longitude.toFixed(3)}°
              </Text>
            </View>
          </View>

          <View style={styles.compassTag}>
            <TreegohIcon name="brujula_solar" size={15} color="#262422" />
            <Text style={styles.compassTagText}>
              {headingDegrees}° {orientationCode}
            </Text>
          </View>
        </View>
      </BlobAnimatedCard>

      {/* GESTIÓN DINÁMICA DE ALTURA / PISOS */}
      <BlobAnimatedCard
        scrollX={scrollX}
        pageIndex={pageIndex}
        pageWidth={pageWidth}
        cardIndex={1}
        isActivePage={isActivePage}
      >
        <View style={styles.floorCardBlock}>
          <GlassCardSheen />
          <View style={styles.floorHeaderRow}>
            <View style={styles.floorTitleCol}>
              <Text style={styles.floorSelectorTitle}>Altura de la planta / piso</Text>
              <Text style={styles.floorDynamicSub}>
                {floorNumber === 0
                  ? 'Planta Baja · Sombras de calles y edificios opuestos'
                  : floorNumber <= 5
                  ? `Piso ${floorNumber}º · Luz despejada a media altura`
                  : floorNumber <= 15
                  ? `Piso ${floorNumber}º · Planta alta de gran luminosidad`
                  : `Piso ${floorNumber}º · Torre / Rascacielos con horizonte libre`}
              </Text>
            </View>

            <View style={styles.floorStepperRow}>
              <TouchableOpacity
                style={styles.stepperCircleBtn}
                onPress={() => handleStepFloor(-1)}
                activeOpacity={0.75}
              >
                <TreegohIcon name="menos" size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.floorNumberBadge}>
                <TextInput
                  style={styles.floorNumberInput}
                  value={floorInputText}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  onChangeText={txt => {
                    const clean = txt.replace(/[^0-9]/g, '');
                    setFloorInputText(clean);
                    if (clean.length > 0) {
                      const parsed = parseInt(clean, 10);
                      if (!isNaN(parsed)) {
                        applyFloorNumber(parsed);
                      }
                    }
                  }}
                  onBlur={() => {
                    if (!floorInputText) {
                      setFloorInputText(String(floorNumber));
                    }
                  }}
                />
              </View>

              <TouchableOpacity
                style={styles.stepperCircleBtn}
                onPress={() => handleStepFloor(1)}
                activeOpacity={0.75}
              >
                <TreegohIcon name="mas" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickFloorChipsRow}
          >
            {[
              { num: 0, label: 'Casa / Bajo (0)' },
              { num: 3, label: 'Piso 3º' },
              { num: 8, label: 'Piso 8º' },
              { num: 20, label: 'Piso 20º' },
              { num: 45, label: 'Torre 45º' },
            ].map(chip => {
              const isChipActive = floorNumber === chip.num;
              return (
                <TouchableOpacity
                  key={chip.num}
                  style={[styles.quickFloorChip, isChipActive && styles.quickFloorChipActive]}
                  onPress={() => setFloorDirect(chip.num)}
                  activeOpacity={0.78}
                >
                  <Text
                    style={[
                      styles.quickFloorChipText,
                      isChipActive && styles.quickFloorChipTextActive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </BlobAnimatedCard>

      {/* PLANO CENITAL ARQUITECTÓNICO & HAZ SOLAR */}
      <BlobAnimatedCard
        scrollX={scrollX}
        pageIndex={pageIndex}
        pageWidth={pageWidth}
        cardIndex={2}
        isActivePage={isActivePage}
      >
        <View
          style={styles.planSvgContainer}
          onLayout={e => {
            const w = e.nativeEvent.layout.width;
            if (w > 100 && Math.abs(w - measuredPlanWidth) > 1) {
              setMeasuredPlanWidth(w);
            }
          }}
        >
          <GlassCardSheen />
          <Svg width={svgWidth} height={svgHeight}>
            <Defs>
              <SvgLinearGradient id="sunBeamGrad" x1="0" y1="1" x2="0" y2="0">
                <Stop
                  offset="0%"
                  stopColor={selectedSeason === 'verano' ? '#FDE68A' : '#FFFFFF'}
                  stopOpacity={selectedSeason === 'verano' ? '0.38' : '0.26'}
                />
                <Stop
                  offset="100%"
                  stopColor={selectedSeason === 'verano' ? '#F5EBE0' : '#FFFFFF'}
                  stopOpacity="0.03"
                />
              </SvgLinearGradient>

              <SvgLinearGradient id="windowGlow" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.90" />
                <Stop offset="100%" stopColor="#E6DED5" stopOpacity="0.80" />
              </SvgLinearGradient>
            </Defs>

            <SvgText
              x={svgWidth / 2}
              y={18}
              fill="rgba(255,255,255,0.52)"
              fontSize="14"
              fontWeight="300"
              textAnchor="middle"
            >
              NORTE (0°)
            </SvgText>
            <SvgText
              x={svgWidth / 2}
              y={svgHeight - 6}
              fill="rgba(255,255,255,0.88)"
              fontSize="14"
              fontWeight="400"
              textAnchor="middle"
            >
              SUR (180°)
            </SvgText>
            <SvgText
              x={14}
              y={svgHeight / 2}
              fill="rgba(255,255,255,0.52)"
              fontSize="14"
              fontWeight="300"
              textAnchor="middle"
            >
              O
            </SvgText>
            <SvgText
              x={svgWidth - 14}
              y={svgHeight / 2}
              fill="rgba(255,255,255,0.52)"
              fontSize="14"
              fontWeight="300"
              textAnchor="middle"
            >
              E
            </SvgText>

            <Path
              d={`M 25 ${roomY + roomH} Q ${svgWidth / 2} -10 ${svgWidth - 25} ${roomY + roomH}`}
              fill="none"
              stroke="rgba(253, 230, 138, 0.34)"
              strokeWidth="1.3"
              strokeDasharray="4 3"
            />

            <Path
              d={`M 35 ${roomY + roomH} Q ${svgWidth / 2} ${roomY + 15} ${svgWidth - 35} ${
                roomY + roomH
              }`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.32)"
              strokeWidth="1.3"
              strokeDasharray="4 3"
            />

            <Rect
              x={roomX}
              y={roomY}
              width={roomW}
              height={roomH}
              rx={18}
              fill="rgba(38, 36, 33, 0.68)"
              stroke="rgba(255, 255, 255, 0.24)"
              strokeWidth="1.5"
            />

            <Line
              x1={roomX + roomW * 0.33}
              y1={roomY}
              x2={roomX + roomW * 0.33}
              y2={roomY + roomH}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
            />
            <Line
              x1={roomX + roomW * 0.66}
              y1={roomY}
              x2={roomX + roomW * 0.66}
              y2={roomY + roomH}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
            />
            <Line
              x1={roomX}
              y1={roomY + roomH * 0.5}
              x2={roomX + roomW}
              y2={roomY + roomH * 0.5}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
            />

            <Polygon points={beamPolygon} fill="url(#sunBeamGrad)" />

            <Line
              x1={winX1}
              y1={winY1}
              x2={winX2}
              y2={winY2}
              stroke="url(#windowGlow)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />

            <SvgText
              x={(winX1 + winX2) / 2}
              y={winY1 > roomY + roomH / 2 ? winY1 - 8 : winY1 + 16}
              fill="rgba(255, 255, 255, 0.90)"
              fontSize="14"
              fontWeight="400"
              textAnchor="middle"
            >
              VENTANA ({orientationCode})
            </SvgText>

            <G>
              <Circle cx={plantX} cy={plantY} r={17} fill="rgba(255, 255, 255, 0.20)" />
              <Circle
                cx={plantX}
                cy={plantY}
                r={9.5}
                fill="#FFFFFF"
                stroke="#353330"
                strokeWidth="2"
              />
              <Circle cx={plantX} cy={plantY} r={3.5} fill="#5E5851" />
            </G>

            <SvgText
              x={plantX}
              y={plantY > roomY + roomH / 2 ? plantY - 22 : plantY + 28}
              fill="#FFFFFF"
              fontSize="14"
              fontWeight="300"
              textAnchor="middle"
            >
              Planta (
              {windowDistance === 'junto_a_ventana'
                ? '<50 cm'
                : windowDistance === 'media_distancia'
                ? '1.5 m'
                : '>3 m'}
              )
            </SvgText>

            <G transform={`translate(${plantX + (headingDegrees > 180 ? -60 : 60)}, ${roomY + 8})`}>
              <Circle cx={0} cy={0} r={9} fill="#F5EBE0" />
              <Circle
                cx={0}
                cy={0}
                r={13}
                fill="none"
                stroke="rgba(245, 235, 224, 0.42)"
                strokeWidth="1.2"
              />
              <SvgText
                x={0}
                y={22}
                fill="rgba(255, 255, 255, 0.88)"
                fontSize="14"
                fontWeight="300"
                textAnchor="middle"
              >
                {activeProfile.maxSolarElevation}° Elev
              </SvgText>
            </G>
          </Svg>
        </View>
      </BlobAnimatedCard>

      {/* SELECTOR DE ESTACIONES */}
      <View style={styles.seasonTabsWrapper}>
        <Text style={styles.seasonSelectorTitle}>
          Simulador de incidencia en las 4 estaciones:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.seasonTabsRow}
        >
          {[
            { id: 'hoy', label: 'Hoy', month: 'Actual' },
            { id: 'invierno', label: 'Invierno', month: 'Enero' },
            { id: 'primavera', label: 'Primavera', month: 'Abril' },
            { id: 'verano', label: 'Verano', month: 'Junio' },
          ].map(s => {
            const isSelected = selectedSeason === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.seasonTabBtn, isSelected && styles.seasonTabBtnSelected]}
                onPress={() => {
                  triggerLightHaptic();
                  onSelectSeason(s.id as any);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.seasonTabTitle, isSelected && styles.seasonTabTitleSelected]}
                >
                  {s.label}
                </Text>
                <Text
                  style={[styles.seasonTabMonth, isSelected && styles.seasonTabMonthSelected]}
                >
                  {s.month}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* TARJETA DINÁMICA DE INCIDENCIA ESTACIONAL */}
      <BlobAnimatedCard
        scrollX={scrollX}
        pageIndex={pageIndex}
        pageWidth={pageWidth}
        cardIndex={3}
        isActivePage={isActivePage}
      >
        <View style={styles.seasonalDiagnosisCard}>
          <GlassCardSheen />

          <View style={styles.metricsPillsRow}>
            <View style={styles.metricPill}>
              <View style={styles.metricTopInline}>
                <TreegohIcon name="luz_natural" size={16} color="#FFFFFF" glow />
                <Text style={styles.metricPillVal} numberOfLines={1} adjustsFontSizeToFit>
                  {activeProfile.directWindowHours} h
                </Text>
              </View>
              <Text style={styles.metricPillLabel} numberOfLines={1}>
                Sol directo
              </Text>
            </View>

            <View style={styles.metricPill}>
              <View style={styles.metricTopInline}>
                <TreegohIcon name="brujula_solar" size={16} color="#FFFFFF" glow />
                <Text style={styles.metricPillVal} numberOfLines={1} adjustsFontSizeToFit>
                  {activeProfile.maxSolarElevation}°
                </Text>
              </View>
              <Text style={styles.metricPillLabel} numberOfLines={1}>
                Elevación
              </Text>
            </View>

            <View style={styles.metricPill}>
              <View style={styles.metricTopInline}>
                <TreegohIcon name="sensor_lux" size={16} color="#FFFFFF" glow />
                <Text style={styles.metricPillVal} numberOfLines={1} adjustsFontSizeToFit>
                  ~{activeProfile.estimatedLux.toLocaleString()}
                </Text>
              </View>
              <Text style={styles.metricPillLabel} numberOfLines={1}>
                Lux PAR
              </Text>
            </View>
          </View>

          <View style={styles.seasonTipBlock}>
            <Text style={styles.seasonTipText}>{activeProfile.seasonalTip}</Text>
          </View>

          <View style={styles.botanicalCareRow}>
            <View style={styles.careCol}>
              <View style={styles.careHeader}>
                <TreegohIcon name="floracion_fenologia" size={16} color="#FFFFFF" glow />
                <Text style={styles.careHeaderTitle}>Poda Estacional</Text>
              </View>
              <Text style={styles.careBodyText}>{activeProfile.pruningAdvice}</Text>
            </View>

            <View style={styles.careCol}>
              <View style={styles.careHeader}>
                <TreegohIcon name="riego_hidratacion" size={16} color="#FFFFFF" glow />
                <Text style={styles.careHeaderTitle}>Pauta de Riego</Text>
              </View>
              <Text style={styles.careBodyText}>{activeProfile.wateringAdvice}</Text>
            </View>
          </View>
        </View>
      </BlobAnimatedCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
    paddingBottom: 8,
  },
  addressPillCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    padding: 20,
    gap: 12,
    overflow: 'hidden',
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 190,
    gap: 14,
  },
  addressIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  addressTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  addressSub: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.62)',
  },
  compassTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 15,
    gap: 6,
  },
  compassTagText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: '#262422',
  },
  floorCardBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    padding: 20,
    gap: 16,
    overflow: 'hidden',
  },
  floorHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  floorTitleCol: {
    flex: 1,
    minWidth: 165,
    gap: 4,
  },
  floorSelectorTitle: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  floorDynamicSub: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.62)',
    lineHeight: 21,
  },
  floorStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floorNumberBadge: {
    minWidth: 54,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  floorNumberInput: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    fontWeight: '400',
    color: '#262422',
    textAlign: 'center',
    minWidth: 34,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  quickFloorChipsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
    paddingRight: 6,
  },
  quickFloorChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickFloorChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.72)',
  },
  quickFloorChipText: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.72)',
  },
  quickFloorChipTextActive: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  planSvgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    paddingVertical: 18,
    overflow: 'hidden',
  },
  seasonTabsWrapper: {
    gap: 12,
  },
  seasonSelectorTitle: {
    fontFamily: Fonts.light,
    fontSize: 15,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  seasonTabsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 8,
  },
  seasonTabBtn: {
    minWidth: 108,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 3,
  },
  seasonTabBtnSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  seasonTabTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.90)',
  },
  seasonTabTitleSelected: {
    color: '#FFFFFF',
  },
  seasonTabMonth: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.56)',
  },
  seasonTabMonthSelected: {
    color: 'rgba(255, 255, 255, 0.82)',
  },
  seasonalDiagnosisCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    overflow: 'hidden',
    gap: 18,
  },
  metricsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricPill: {
    flexGrow: 1,
    flexBasis: '29%',
    minWidth: 92,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 12,
    gap: 6,
  },
  metricTopInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricPillVal: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  metricPillLabel: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
  },
  seasonTipBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 15,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 255, 255, 0.55)',
  },
  seasonTipText: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 22,
  },
  botanicalCareRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  careCol: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 16,
    padding: 15,
    gap: 8,
  },
  careHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  careHeaderTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.94)',
    flexShrink: 1,
  },
  careBodyText: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 21,
  },
});
