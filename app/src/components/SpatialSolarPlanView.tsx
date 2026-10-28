import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { FullAnnualSolarReport } from '../utils/solarEngine';

const { width } = Dimensions.get('window');

interface SpatialSolarPlanProps {
  headingDegrees: number;
  orientationCode: 'N' | 'S' | 'E' | 'O' | 'NE' | 'SE' | 'NO' | 'SO';
  windowDistance: 'junto_a_ventana' | 'media_distancia' | 'rincon_profundo';
  floorLevel: 'baja' | 'media' | 'alta';
  selectedSeason: 'hoy' | 'invierno' | 'primavera' | 'verano';
  onSelectSeason: (season: 'hoy' | 'invierno' | 'primavera' | 'verano') => void;
  onSelectFloorLevel: (level: 'baja' | 'media' | 'alta') => void;
  solarReport: FullAnnualSolarReport;
  userAddress?: string;
  floorOrApt?: string;
}

export const SpatialSolarPlanView: React.FC<SpatialSolarPlanProps> = ({
  headingDegrees,
  orientationCode,
  windowDistance,
  floorLevel,
  selectedSeason,
  onSelectSeason,
  onSelectFloorLevel,
  solarReport,
  userAddress = 'Avenida Nuestra Señora de Valvanera, 93',
  floorOrApt = '3º D',
}) => {
  const triggerLightHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
  };

  const activeProfile =
    selectedSeason === 'invierno'
      ? solarReport.winterProfile
      : selectedSeason === 'primavera'
      ? solarReport.springProfile
      : selectedSeason === 'verano'
      ? solarReport.summerProfile
      : solarReport.todayProfile;

  // Dimensiones del plano SVG
  const svgWidth = Math.min(width - 40, 360);
  const svgHeight = 220;
  const roomX = 45;
  const roomY = 35;
  const roomW = svgWidth - 90;
  const roomH = 150;

  // Posición de la ventana según orientación
  // Sur = Muro inferior, Norte = Muro superior, Este = Muro derecho, Oeste = Muro izquierdo
  let winX1 = roomX + roomW * 0.25;
  let winY1 = roomY + roomH;
  let winX2 = roomX + roomW * 0.75;
  let winY2 = roomY + roomH;
  let beamPolygon = `${winX1},${winY1} ${winX2},${winY2} ${roomX + roomW * 0.9},${roomY + 20} ${roomX + roomW * 0.1},${roomY + 20}`;
  let plantX = roomX + roomW * 0.5;
  let plantY = roomY + roomH - 30;

  if (orientationCode === 'S' || orientationCode === 'SE' || orientationCode === 'SO') {
    winX1 = roomX + roomW * 0.25;
    winY1 = roomY + roomH;
    winX2 = roomX + roomW * 0.75;
    winY2 = roomY + roomH;

    // En invierno los rayos entran profundos (cono largo); en verano cenitales (cono ancho)
    const beamDepth = selectedSeason === 'invierno' ? roomY + 15 : selectedSeason === 'verano' ? roomY + 65 : roomY + 35;
    beamPolygon = `${winX1},${winY1} ${winX2},${winY2} ${roomX + roomW * 0.85},${beamDepth} ${roomX + roomW * 0.15},${beamDepth}`;

    if (windowDistance === 'junto_a_ventana') {
      plantY = roomY + roomH - 24;
    } else if (windowDistance === 'media_distancia') {
      plantY = roomY + roomH - 65;
    } else {
      plantY = roomY + 30;
    }
    plantX = roomX + roomW * 0.5;
  } else if (orientationCode === 'E' || orientationCode === 'NE') {
    winX1 = roomX + roomW;
    winY1 = roomY + roomH * 0.25;
    winX2 = roomX + roomW;
    winY2 = roomY + roomH * 0.75;

    const beamDepth = selectedSeason === 'invierno' ? roomX + 30 : roomX + 50;
    beamPolygon = `${winX1},${winY1} ${winX2},${winY2} ${beamDepth},${roomY + roomH * 0.9} ${beamDepth},${roomY + roomH * 0.1}`;

    if (windowDistance === 'junto_a_ventana') {
      plantX = roomX + roomW - 24;
    } else if (windowDistance === 'media_distancia') {
      plantX = roomX + roomW - 65;
    } else {
      plantX = roomX + 30;
    }
    plantY = roomY + roomH * 0.5;
  } else if (orientationCode === 'O' || orientationCode === 'NO') {
    winX1 = roomX;
    winY1 = roomY + roomH * 0.25;
    winX2 = roomX;
    winY2 = roomY + roomH * 0.75;

    const beamDepth = selectedSeason === 'invierno' ? roomX + roomW - 30 : roomX + roomW - 50;
    beamPolygon = `${winX1},${winY1} ${winX2},${winY2} ${beamDepth},${roomY + roomH * 0.1} ${beamDepth},${roomY + roomH * 0.9}`;

    if (windowDistance === 'junto_a_ventana') {
      plantX = roomX + 24;
    } else if (windowDistance === 'media_distancia') {
      plantX = roomX + 65;
    } else {
      plantX = roomX + roomW - 30;
    }
    plantY = roomY + roomH * 0.5;
  } else {
    // Norte
    winX1 = roomX + roomW * 0.25;
    winY1 = roomY;
    winX2 = roomX + roomW * 0.75;
    winY2 = roomY;

    beamPolygon = `${winX1},${winY1} ${winX2},${winY2} ${roomX + roomW * 0.7},${roomY + 45} ${roomX + roomW * 0.3},${roomY + 45}`;

    if (windowDistance === 'junto_a_ventana') {
      plantY = roomY + 24;
    } else if (windowDistance === 'media_distancia') {
      plantY = roomY + 65;
    } else {
      plantY = roomY + roomH - 30;
    }
    plantX = roomX + roomW * 0.5;
  }

  return (
    <View style={styles.container}>
      {/* CABECERA CON GEOLOCALIZACIÓN PRECISA */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.sectionTitle}>Plano Espacial & Ritmo Solar</Text>
          <Text style={styles.sectionSubtitle}>
            Simulación astronómica en tiempo real para tu planta y ventana en las 4 estaciones.
          </Text>
        </View>
      </View>

      {/* BADGE DE DIRECCIÓN Y PISO GPS */}
      <View style={styles.addressPillCard}>
        <View style={styles.addressLeft}>
          <View style={styles.addressIconWrap}>
            <TreegohIcon name="espacios_microclimas" size={18} color="#A7F3D0" />
          </View>
          <View style={styles.addressTextCol}>
            <Text style={styles.addressTitle} numberOfLines={1}>
              {userAddress}
            </Text>
            <Text style={styles.addressSub} numberOfLines={1}>
              {floorOrApt ? `${floorOrApt} • ` : ''}Lat {solarReport.latitude.toFixed(3)}°, Lon {solarReport.longitude.toFixed(3)}°
            </Text>
          </View>
        </View>

        <View style={styles.compassTag}>
          <TreegohIcon name="brujula_solar" size={14} color="#121A15" />
          <Text style={styles.compassTagText}>{headingDegrees}° {orientationCode}</Text>
        </View>
      </View>

      {/* SELECTOR DE PISO / ALTURA DEL INMUEBLE */}
      <View style={styles.floorSelectorBlock}>
        <Text style={styles.floorSelectorTitle}>Altura de la planta / piso:</Text>
        <View style={styles.floorTabsRow}>
          {[
            { id: 'baja', label: 'Bajo / PB', sub: 'Sombras de calle' },
            { id: 'media', label: '3º D (Medio)', sub: 'Luz despejada' },
            { id: 'alta', label: 'Ático / 6º+', sub: 'Máxima radiación' },
          ].map(f => {
            const isSelected = floorLevel === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.floorTabBtn,
                  isSelected && styles.floorTabBtnSelected,
                ]}
                onPress={() => {
                  triggerLightHaptic();
                  onSelectFloorLevel(f.id as any);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.floorTabLabel, isSelected && styles.floorTabLabelSelected]}>
                  {f.label}
                </Text>
                <Text style={[styles.floorTabSub, isSelected && styles.floorTabSubSelected]}>
                  {f.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* PLANO CENITAL ARQUITECTÓNICO & HAZ SOLAR (SVG VECTORIAL PURO) */}
      <View style={styles.planSvgContainer}>
        <Svg width={svgWidth} height={svgHeight}>
          <Defs>
            {/* Gradiente del haz de luz según estación */}
            <SvgLinearGradient id="sunBeamGrad" x1="0" y1="1" x2="0" y2="0">
              <Stop
                offset="0%"
                stopColor={selectedSeason === 'verano' ? '#FBBF24' : '#A7F3D0'}
                stopOpacity={selectedSeason === 'verano' ? '0.45' : '0.30'}
              />
              <Stop
                offset="100%"
                stopColor={selectedSeason === 'verano' ? '#F59E0B' : '#34D399'}
                stopOpacity="0.05"
              />
            </SvgLinearGradient>

            <SvgLinearGradient id="windowGlow" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#6EE7B7" stopOpacity="0.8" />
            </SvgLinearGradient>
          </Defs>

          {/* Guías de coordenadas cardinales exteriores */}
          <SvgText x={svgWidth / 2} y={18} fill="rgba(255,255,255,0.45)" fontSize="11" fontWeight="700" textAnchor="middle">
            NORTE (0°)
          </SvgText>
          <SvgText x={svgWidth / 2} y={svgHeight - 6} fill="rgba(255,255,255,0.75)" fontSize="11" fontWeight="800" textAnchor="middle">
            SUR (180°)
          </SvgText>
          <SvgText x={14} y={svgHeight / 2} fill="rgba(255,255,255,0.45)" fontSize="11" fontWeight="700" textAnchor="middle">
            O
          </SvgText>
          <SvgText x={svgWidth - 14} y={svgHeight / 2} fill="rgba(255,255,255,0.45)" fontSize="11" fontWeight="700" textAnchor="middle">
            E
          </SvgText>

          {/* Arcos astronómicos de recorrido solar */}
          {/* Arco de Verano (amplio y alto) */}
          <Path
            d={`M 25 ${roomY + roomH} Q ${svgWidth / 2} -10 ${svgWidth - 25} ${roomY + roomH}`}
            fill="none"
            stroke="rgba(251, 191, 36, 0.35)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Arco de Invierno (bajo y rasante) */}
          <Path
            d={`M 35 ${roomY + roomH} Q ${svgWidth / 2} ${roomY + 15} ${svgWidth - 35} ${roomY + roomH}`}
            fill="none"
            stroke="rgba(167, 243, 208, 0.40)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Paredes de la habitación (Muros con grosor arquitectónico) */}
          <Rect
            x={roomX}
            y={roomY}
            width={roomW}
            height={roomH}
            rx={16}
            fill="rgba(18, 26, 21, 0.70)"
            stroke="rgba(255, 255, 255, 0.22)"
            strokeWidth="2"
          />

          {/* Suelo cuadriculado sutil */}
          <Line x1={roomX + roomW * 0.33} y1={roomY} x2={roomX + roomW * 0.33} y2={roomY + roomH} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <Line x1={roomX + roomW * 0.66} y1={roomY} x2={roomX + roomW * 0.66} y2={roomY + roomH} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <Line x1={roomX} y1={roomY + roomH * 0.5} x2={roomX + roomW} y2={roomY + roomH * 0.5} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

          {/* Cono de radiación solar penetrando por el ventanal */}
          <Polygon points={beamPolygon} fill="url(#sunBeamGrad)" />

          {/* Muro del Ventanal Iluminado */}
          <Line
            x1={winX1}
            y1={winY1}
            x2={winX2}
            y2={winY2}
            stroke="url(#windowGlow)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Etiqueta de la Ventana */}
          <SvgText
            x={(winX1 + winX2) / 2}
            y={winY1 > roomY + roomH / 2 ? winY1 - 8 : winY1 + 14}
            fill="#A7F3D0"
            fontSize="10"
            fontWeight="800"
            textAnchor="middle"
          >
            VENTANA ({orientationCode})
          </SvgText>

          {/* Marcador de Planta */}
          <G>
            {/* Halo de fotosíntesis de la planta */}
            <Circle cx={plantX} cy={plantY} r={16} fill="rgba(167, 243, 208, 0.18)" />
            <Circle cx={plantX} cy={plantY} r={10} fill="#E8EFE7" stroke="#121A15" strokeWidth="2" />
            <Circle cx={plantX} cy={plantY} r={4} fill="#121A15" />
          </G>

          {/* Etiqueta de la Planta */}
          <SvgText
            x={plantX}
            y={plantY > roomY + roomH / 2 ? plantY - 20 : plantY + 24}
            fill="#FFFFFF"
            fontSize="10"
            fontWeight="700"
            textAnchor="middle"
          >
            Planta ({windowDistance === 'junto_a_ventana' ? '<50 cm' : windowDistance === 'media_distancia' ? '1.5 m' : '>3 m'})
          </SvgText>

          {/* Indicador del Sol en Tiempo Real */}
          <G transform={`translate(${plantX + (headingDegrees > 180 ? -60 : 60)}, ${roomY + 8})`}>
            <Circle cx={0} cy={0} r={10} fill="#FBBF24" />
            <Circle cx={0} cy={0} r={14} fill="none" stroke="rgba(251, 191, 36, 0.4)" strokeWidth="1.5" />
            <SvgText x={0} y={20} fill="#FBBF24" fontSize="9" fontWeight="800" textAnchor="middle">
              {activeProfile.maxSolarElevation}° Elev
            </SvgText>
          </G>
        </Svg>
      </View>

      {/* SELECTOR INTERACTIVO DE ESTACIONES */}
      <View style={styles.seasonTabsWrapper}>
        <Text style={styles.seasonSelectorTitle}>Simulador de incidencia en las 4 estaciones:</Text>
        <View style={styles.seasonTabsRow}>
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
                style={[
                  styles.seasonTabBtn,
                  isSelected && styles.seasonTabBtnSelected,
                ]}
                onPress={() => {
                  triggerLightHaptic();
                  onSelectSeason(s.id as any);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.seasonTabTitle, isSelected && styles.seasonTabTitleSelected]}>
                  {s.label}
                </Text>
                <Text style={[styles.seasonTabMonth, isSelected && styles.seasonTabMonthSelected]}>
                  {s.month}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* TARJETA DINÁMICA DE INCIDENCIA ESTACIONAL COMPUTADA */}
      <View style={styles.seasonalDiagnosisCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* FILA SUPERIOR: MÉTRICAS CLAVE ESTACIONALES */}
        <View style={styles.metricsPillsRow}>
          <View style={styles.metricPill}>
            <TreegohIcon name="luz_natural" size={16} color="#121A15" />
            <View style={styles.metricPillTextCol}>
              <Text style={styles.metricPillVal}>{activeProfile.directWindowHours} h</Text>
              <Text style={styles.metricPillLabel}>Sol directo ventana</Text>
            </View>
          </View>

          <View style={styles.metricPill}>
            <TreegohIcon name="brujula_solar" size={16} color="#121A15" />
            <View style={styles.metricPillTextCol}>
              <Text style={styles.metricPillVal}>{activeProfile.maxSolarElevation}°</Text>
              <Text style={styles.metricPillLabel}>Elevación cenit</Text>
            </View>
          </View>

          <View style={styles.metricPill}>
            <TreegohIcon name="sensor_lux" size={16} color="#121A15" />
            <View style={styles.metricPillTextCol}>
              <Text style={styles.metricPillVal}>~{activeProfile.estimatedLux.toLocaleString()}</Text>
              <Text style={styles.metricPillLabel}>Fotones Lux</Text>
            </View>
          </View>
        </View>

        {/* EXPLICACIÓN DEL COMPORTAMIENTO SOLAR */}
        <View style={styles.seasonTipBlock}>
          <Text style={styles.seasonTipText}>{activeProfile.seasonalTip}</Text>
        </View>

        {/* PAUTAS BOTÁNICAS CLAVE: PODA Y RIEGO */}
        <View style={styles.botanicalCareRow}>
          <View style={styles.careCol}>
            <View style={styles.careHeader}>
              <TreegohIcon name="poda_salud" size={16} color="#A7F3D0" />
              <Text style={styles.careHeaderTitle}>Poda en {activeProfile.name.split(' ')[0]}</Text>
            </View>
            <Text style={styles.careBodyText}>{activeProfile.pruningAdvice}</Text>
          </View>

          <View style={styles.careCol}>
            <View style={styles.careHeader}>
              <TreegohIcon name="riego_hidratacion" size={16} color="#A7F3D0" />
              <Text style={styles.careHeaderTitle}>Riego en {activeProfile.name.split(' ')[0]}</Text>
            </View>
            <Text style={styles.careBodyText}>{activeProfile.wateringAdvice}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 20,
  },
  addressPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 12,
    marginVertical: 10,
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  addressIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTextCol: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addressSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A7F3D0',
    marginTop: 2,
  },
  compassTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EFE7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 5,
  },
  compassTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#121A15',
  },
  floorSelectorBlock: {
    marginVertical: 8,
  },
  floorSelectorTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 6,
  },
  floorTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  floorTabBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  floorTabBtnSelected: {
    backgroundColor: '#E8EFE7',
    borderColor: '#E8EFE7',
  },
  floorTabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floorTabLabelSelected: {
    color: '#121A15',
  },
  floorTabSub: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.60)',
    marginTop: 2,
  },
  floorTabSubSelected: {
    color: '#2A3C30',
  },
  planSvgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 16, 12, 0.65)',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 8,
    marginVertical: 10,
    overflow: 'hidden',
  },
  seasonTabsWrapper: {
    marginTop: 10,
    marginBottom: 8,
  },
  seasonSelectorTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 8,
  },
  seasonTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  seasonTabBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  seasonTabBtnSelected: {
    backgroundColor: '#E8EFE7',
    borderColor: '#E8EFE7',
  },
  seasonTabTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seasonTabTitleSelected: {
    color: '#121A15',
  },
  seasonTabMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A7F3D0',
    marginTop: 2,
  },
  seasonTabMonthSelected: {
    color: '#2A3C30',
  },
  seasonalDiagnosisCard: {
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(167, 243, 208, 0.35)',
    padding: 16,
    overflow: 'hidden',
    marginTop: 8,
    gap: 12,
  },
  metricsPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricPill: {
    flex: 1,
    backgroundColor: '#E8EFE7',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricPillTextCol: {
    flex: 1,
  },
  metricPillVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#121A15',
  },
  metricPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2A3C30',
  },
  seasonTipBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#A7F3D0',
  },
  seasonTipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  botanicalCareRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 12,
  },
  careCol: {
    flex: 1,
    gap: 4,
  },
  careHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  careHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A7F3D0',
  },
  careBodyText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 16,
  },
});
