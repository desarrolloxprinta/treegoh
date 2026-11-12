import React from 'react';
import { View, Platform } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon, G } from 'react-native-svg';
import { Colors } from '../constants/theme';

export type IconName =
  | 'luz_natural'
  | 'voz_botanica'
  | 'riego_hidratacion'
  | 'humedad_vpd'
  | 'poda_salud'
  | 'espacios_microclimas'
  | 'camara_diagnostica'
  | 'temperatura_termica'
  | 'fertilizante_nutricion'
  | 'maceta_trasplante'
  | 'sustrato_aireacion'
  | 'limpieza_foliar'
  | 'toxicidad_mascotas'
  | 'escudo_fitosanitario'
  | 'alerta_plaga'
  | 'pulverizacion_spray'
  | 'floracion_fenologia'
  | 'calendario_agenda'
  | 'sensor_iot'
  | 'historial_clinico'
  | 'galeria_evolucion'
  | 'biblia_plantas'
  | 'nivel_dificultad'
  | 'ajustes_sistema'
  | 'anadir_planta'
  | 'busqueda_typesense'
  | 'notificaciones_alertas'
  | 'filtros_parametros'
  | 'sonido_soundscapes'
  | 'tarea_completada'
  | 'posponer_snooze'
  | 'compartir_exportar'
  | 'mascota_gato'
  | 'mascota_perro'
  | 'mascota_ave'
  | 'mascota_reptil'
  | 'mascota_roedor'
  | 'mascota_libre'
  | 'brujula_solar'
  | 'sensor_lux'
  | 'ventana_distancia'
  | 'alerta_termica'
  | 'flecha_volver'
  | 'check_verificado'
  | 'flecha_adelante'
  | 'cierre'
  | 'flecha_abajo'
  | 'mas'
  | 'menos'
  | 'google';

interface TreegohIconProps {
  name: IconName;
  variant?: 'lineal' | 'solido';
  size?: number;
  color?: string;
  glow?: boolean;
  glowColor?: string;
}

export const TreegohIcon: React.FC<TreegohIconProps> = React.memo(({
  name,
  variant = 'lineal',
  size = 24,
  color = Colors.darkObsidian,
  glow = false,
  glowColor,
}) => {
  const baseStrokeWidth = 1.7;
  const resolvedGlowColor = glowColor || '#FFFFFF';

  const renderShapes = (activeColor: string, sw: number, isGlowLayer: boolean) => {
    const useFill = !isGlowLayer && variant === 'solido';
    const innerContrast = useFill ? '#FFFFFF' : activeColor;
    const innerDarkContrast = useFill ? '#121A15' : activeColor;

    switch (name) {
      case 'luz_natural':
        return (
          <>
            <Circle cx="12" cy="12" r="4.2" stroke={activeColor} strokeWidth={sw} fill={useFill ? activeColor : 'none'} />
            <Line x1="12" y1="2" x2="12" y2="4.5" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Line x1="12" y1="19.5" x2="12" y2="22" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Line x1="2" y1="12" x2="4.5" y2="12" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Line x1="19.5" y1="12" x2="22" y2="12" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Line x1="4.93" y1="4.93" x2="6.7" y2="6.7" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Line x1="17.3" y1="17.3" x2="19.07" y2="19.07" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Line x1="4.93" y1="19.07" x2="6.7" y2="17.3" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Line x1="17.3" y1="6.7" x2="19.07" y2="4.93" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'voz_botanica':
        return (
          <>
            <Line x1="12" y1="3" x2="12" y2="21" stroke={activeColor} strokeWidth={useFill ? sw + 0.7 : sw} strokeLinecap="round" />
            <Line x1="8" y1="6" x2="8" y2="18" stroke={activeColor} strokeWidth={useFill ? sw + 0.7 : sw} strokeLinecap="round" />
            <Line x1="16" y1="6" x2="16" y2="18" stroke={activeColor} strokeWidth={useFill ? sw + 0.7 : sw} strokeLinecap="round" />
            <Line x1="4" y1="10" x2="4" y2="14" stroke={activeColor} strokeWidth={useFill ? sw + 0.7 : sw} strokeLinecap="round" />
            <Line x1="20" y1="10" x2="20" y2="14" stroke={activeColor} strokeWidth={useFill ? sw + 0.7 : sw} strokeLinecap="round" />
          </>
        );

      case 'riego_hidratacion':
        return (
          <>
            <Path
              d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
              stroke={activeColor}
              strokeWidth={sw}
              fill={useFill ? activeColor : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path d="M12 9v7" stroke={innerContrast} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M12 13l2.5-2.5" stroke={innerContrast} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M12 15l-2-2" stroke={innerContrast} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'espacios_microclimas':
        return (
          <>
            <Path
              d="M3 10.5L12 3l9 7.5v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9z"
              stroke={activeColor}
              strokeWidth={sw}
              fill={useFill ? activeColor : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path d="M12 18V11" stroke={innerContrast} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M12 14c2-2 3-1 4-1s0 3-1 4-2-1-3-3z" stroke={innerContrast} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'camara_diagnostica':
        return (
          <>
            <Path d="M5 8V5a2 2 0 0 1 2-2h3" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M19 8V5a2 2 0 0 0-2-2h-3" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M5 16v3a2 2 0 0 0 2 2h3" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M19 16v3a2 2 0 0 1-2 2h-3" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Circle cx="12" cy="12" r="3.2" stroke={activeColor} strokeWidth={sw} fill={useFill ? activeColor : 'none'} />
          </>
        );

      case 'galeria_evolucion':
        return (
          <>
            <Rect
              x="3"
              y="4"
              width="18"
              height="16"
              rx="3"
              stroke={activeColor}
              strokeWidth={sw}
              fill={useFill ? activeColor : 'none'}
            />
            <Circle
              cx="8.5"
              cy="9"
              r="1.7"
              stroke={innerContrast}
              strokeWidth={Math.max(1.4, sw - 0.3)}
              fill={isGlowLayer ? 'none' : innerContrast}
            />
            <Path
              d="M3.5 17.2l5-4.8a1.4 1.4 0 0 1 2 0l3.3 3.2 2.3-2.2a1.4 1.4 0 0 1 2 0l2.4 2.4"
              stroke={innerContrast}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );

      case 'biblia_plantas':
        return (
          <>
            <Path
              d="M12 5.5C9.8 4.1 6.8 3.7 4 4v14.2c2.8-.3 5.8.1 8 1.5m0-14.2c2.2-1.4 5.2-1.8 8-1.5v14.2c-2.8-.3-5.8.1-8 1.5m0-14.2v14.2"
              stroke={activeColor}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );

      case 'busqueda_typesense':
        return (
          <>
            <Circle cx="11" cy="11" r="6.8" stroke={activeColor} strokeWidth={sw} />
            <Line x1="20.5" y1="20.5" x2="16" y2="16" stroke={activeColor} strokeWidth={sw + 0.3} strokeLinecap="round" />
          </>
        );

      case 'poda_salud':
        return (
          <>
            <Circle cx="6.5" cy="6.5" r="2.5" stroke={activeColor} strokeWidth={sw} />
            <Circle cx="6.5" cy="17.5" r="2.5" stroke={activeColor} strokeWidth={sw} />
            <Line x1="20" y1="4" x2="8.5" y2="15.5" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Line x1="8.5" y1="8.5" x2="20" y2="20" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'fertilizante_nutricion':
        return (
          <>
            <Path
              d="M12 3c4.5 3.5 7 7.5 7 11.2A7 7 0 0 1 5 14.2C5 10.5 7.5 6.5 12 3z"
              stroke={activeColor}
              strokeWidth={sw}
              strokeLinejoin="round"
            />
            <Path d="M12 9v7M9.5 12.5h5" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'maceta_trasplante':
        return (
          <>
            <Path d="M6 10h12l-1.5 10h-9L6 10z" stroke={activeColor} strokeWidth={sw} strokeLinejoin="round" />
            <Rect x="4.5" y="7" width="15" height="3" rx="1" stroke={activeColor} strokeWidth={sw} />
            <Path d="M12 7V3m0 0c-2 0-3.5 1-3.5 2.5M12 3c2 0 3.5 1 3.5 2.5" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'sustrato_aireacion':
        return (
          <>
            <Path d="M4 15h16M6 19h12M7 11h10" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Circle cx="9" cy="7" r="1.3" fill={activeColor} />
            <Circle cx="15" cy="7" r="1.3" fill={activeColor} />
          </>
        );

      case 'limpieza_foliar':
        return (
          <>
            <Path
              d="M19 5c-7 0-13 4.5-14 13 8.5-1 13-7 14-13z"
              stroke={activeColor}
              strokeWidth={sw}
              strokeLinejoin="round"
            />
            <Path d="M5 18L13 10" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'alerta_plaga':
        return (
          <>
            <Circle cx="12" cy="13" r="5" stroke={activeColor} strokeWidth={sw} />
            <Path d="M10 8V6a2 2 0 1 1 4 0v2M4 13h3m10 0h3M5.5 8.5l2.2 1.5m8.6-1.5l-2.2 1.5M5.5 17.5l2.2-1.5m8.6 1.5l-2.2-1.5" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'calendario_agenda':
        return (
          <>
            <Rect x="3" y="5" width="18" height="16" rx="2.5" stroke={activeColor} strokeWidth={sw} />
            <Line x1="3" y1="10" x2="21" y2="10" stroke={activeColor} strokeWidth={sw} />
            <Line x1="8" y1="3" x2="8" y2="7" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Line x1="16" y1="3" x2="16" y2="7" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'sensor_iot':
        return (
          <>
            <Circle cx="12" cy="14" r="2.5" stroke={activeColor} strokeWidth={sw} />
            <Path d="M7.5 10a6.5 6.5 0 0 1 9 0M4.5 7a10.5 10.5 0 0 1 15 0" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Line x1="12" y1="16.5" x2="12" y2="21" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'historial_clinico':
        return (
          <>
            <Path d="M3 12h4l2.5-6 5 12 2.5-6H21" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          </>
        );

      case 'nivel_dificultad':
        return (
          <>
            <Line x1="6" y1="19" x2="6" y2="14" stroke={activeColor} strokeWidth={sw + 0.6} strokeLinecap="round" />
            <Line x1="12" y1="19" x2="12" y2="10" stroke={activeColor} strokeWidth={sw + 0.6} strokeLinecap="round" />
            <Line x1="18" y1="19" x2="18" y2="5" stroke={activeColor} strokeWidth={sw + 0.6} strokeLinecap="round" />
          </>
        );

      case 'ajustes_sistema':
        return (
          <>
            <Circle cx="12" cy="12" r="3.5" stroke={activeColor} strokeWidth={sw} />
            <Path d="M12 2.5v2.5m0 14v2.5M2.5 12H5m14 0h2.5M5.3 5.3l1.8 1.8m9.8 9.8l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'anadir_planta':
        return (
          <>
            <Circle cx="12" cy="12" r="9" stroke={activeColor} strokeWidth={sw} />
            <Path d="M12 8v8M8 12h8" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'notificaciones_alertas':
        return (
          <>
            <Path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9z" stroke={activeColor} strokeWidth={sw} strokeLinejoin="round" />
            <Path d="M10 20a2.2 2.2 0 0 0 4 0" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'filtros_parametros':
        return (
          <>
            <Line x1="4" y1="7" x2="20" y2="7" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Line x1="4" y1="17" x2="20" y2="17" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Circle cx="9" cy="7" r="2.3" stroke={activeColor} strokeWidth={sw} fill="#163022" />
            <Circle cx="15" cy="17" r="2.3" stroke={activeColor} strokeWidth={sw} fill="#163022" />
          </>
        );

      case 'posponer_snooze':
        return (
          <>
            <Circle cx="12" cy="12" r="9" stroke={activeColor} strokeWidth={sw} />
            <Polyline points="12 7 12 12 15.5 14" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          </>
        );

      case 'compartir_exportar':
        return (
          <>
            <Path d="M12 3v12m0-12L8 7m4-4l4 4" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'temperatura_termica':
        return (
          <>
            <Path
              d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
              stroke={activeColor}
              strokeWidth={sw}
              fill={useFill ? activeColor : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx="11.5" cy="17.5" r="1.5" fill={innerContrast} />
          </>
        );

      case 'toxicidad_mascotas':
        return (
          <>
            <Circle cx="6" cy="10" r="2" fill={activeColor} />
            <Circle cx="10" cy="6" r="2" fill={activeColor} />
            <Circle cx="14" cy="6" r="2" fill={activeColor} />
            <Circle cx="18" cy="10" r="2" fill={activeColor} />
            <Path
              d="M8 15c0-2.5 2-4 4-4s4 1.5 4 4c0 2.5-1.5 5-4 5s-4-2.5-4-5z"
              stroke={activeColor}
              strokeWidth={sw}
              fill={useFill ? activeColor : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );

      case 'floracion_fenologia':
        return (
          <>
            <Circle cx="12" cy="12" r="2.5" stroke={activeColor} strokeWidth={sw} fill={useFill ? '#141C19' : 'none'} />
            <Path d="M12 9.5a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 0 0 5z" stroke={activeColor} strokeWidth={sw} fill={useFill ? activeColor : 'none'} />
            <Path d="M12 14.5a2.5 2.5 0 0 0 0 5 2.5 2.5 0 0 0 0-5z" stroke={activeColor} strokeWidth={sw} fill={useFill ? activeColor : 'none'} />
            <Path d="M9.5 12a2.5 2.5 0 0 0-5 0 2.5 2.5 0 0 0 5 0z" stroke={activeColor} strokeWidth={sw} fill={useFill ? activeColor : 'none'} />
            <Path d="M14.5 12a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0-5 0z" stroke={activeColor} strokeWidth={sw} fill={useFill ? activeColor : 'none'} />
          </>
        );

      case 'sonido_soundscapes':
        return (
          <>
            <Polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" stroke={activeColor} strokeWidth={sw} fill={useFill ? activeColor : 'none'} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'tarea_completada':
        return (
          <Polyline points="20 6 9 17 4 12" stroke={activeColor} strokeWidth={sw + 0.6} strokeLinecap="round" strokeLinejoin="round" />
        );

      case 'humedad_vpd':
        return (
          <>
            <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke={activeColor} strokeWidth={sw} fill={useFill ? activeColor : 'none'} strokeLinejoin="round" />
            <Path d="M8 14a4 4 0 0 0 4 4" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'pulverizacion_spray':
        return (
          <>
            <Path d="M12 3v4M8 7h8v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V7z" stroke={activeColor} strokeWidth={sw} strokeLinejoin="round" fill={useFill ? activeColor : 'none'} />
            <Path d="M6 7l-2 2M18 7l2 2M16 4h3" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'escudo_fitosanitario':
        return (
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={activeColor} strokeWidth={sw} strokeLinejoin="round" fill={useFill ? activeColor : 'none'} />
        );

      case 'mascota_gato':
        return (
          <>
            <Path
              d="M12 5.5c-3.5 0-6 2-6 5.5 0 4.2 2.8 7 6 7s6-2.8 6-7c0-3.5-2.5-5.5-6-5.5z"
              stroke={activeColor}
              strokeWidth={sw}
              fill={useFill ? activeColor : 'none'}
            />
            <Path d="M6 9.5L4 4l5.5 2.5" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M18 9.5L20 4l-5.5 2.5" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="9.5" cy="11.5" r="1.1" fill={activeColor} />
            <Circle cx="14.5" cy="11.5" r="1.1" fill={activeColor} />
            <Path d="M11 14.2l1 .8 1-.8" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Line x1="4.5" y1="13" x2="7.5" y2="13.5" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Line x1="19.5" y1="13" x2="16.5" y2="13.5" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'mascota_perro':
        return (
          <>
            <Path
              d="M7 6c0-2 2-3 5-3s5 1 5 3v5c0 4.5-2.5 7.5-5 7.5S7 15.5 7 11V6z"
              stroke={activeColor}
              strokeWidth={sw}
              fill={useFill ? activeColor : 'none'}
            />
            <Path d="M7 7C5 8 3.5 11 3.5 13.5c0 2 1 3 2.5 2.5L7 13" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M17 7c2 1 3.5 4 3.5 6.5 0 2-1 3-2.5 2.5L17 13" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="9.5" cy="10" r="1.2" fill={activeColor} />
            <Circle cx="14.5" cy="10" r="1.2" fill={activeColor} />
            <Path d="M10.5 13.5h3l-1.5 2-1.5-2z" fill={activeColor} />
          </>
        );

      case 'mascota_ave':
        return (
          <>
            <Path
              d="M16 4a5 5 0 0 0-5 5c0 1.5.5 3 1.5 4.2L4 18l3-1 2 3 5.5-3.5c1.2.5 2.5.5 3.5 0 3-1.5 4-5 4-8.5V4h-6z"
              stroke={activeColor}
              strokeWidth={sw}
              fill={useFill ? activeColor : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx="17" cy="8" r="1.2" fill={activeColor} />
            <Path d="M22 8l-3-2v4l3-2z" fill={activeColor} />
          </>
        );

      case 'mascota_reptil':
        return (
          <>
            <Circle cx="12" cy="13" r="6.5" stroke={activeColor} strokeWidth={sw} fill={useFill ? activeColor : 'none'} />
            <Circle cx="12" cy="4.5" r="2" stroke={activeColor} strokeWidth={sw} fill={activeColor} />
            <Path d="M6 9.5l-2.5-2M18 9.5l2.5-2M6 16.5l-2.5 2M18 16.5l2.5 2" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M12 6.5v13M5.5 13h13" stroke={innerContrast} strokeWidth={1.5} />
          </>
        );

      case 'mascota_roedor':
        return (
          <>
            <Path
              d="M8.5 11c-2.5 0-4.5 2-4.5 4.5 0 3 2.5 5.5 8 5.5s8-2.5 8-5.5c0-2.5-2-4.5-4.5-4.5h-7z"
              stroke={activeColor}
              strokeWidth={sw}
              fill={useFill ? activeColor : 'none'}
            />
            <Path d="M9 11C8 8.5 7 3 9 3c1.8 0 2.5 4.5 2.5 8" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M15 11c1-2.5 2-8 0-8-1.8 0-2.5 4.5-2.5 8" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="8.5" cy="15" r="1.1" fill={activeColor} />
            <Circle cx="15.5" cy="15" r="1.1" fill={activeColor} />
            <Circle cx="12" cy="17" r="0.9" fill={activeColor} />
          </>
        );

      case 'mascota_libre':
        return (
          <>
            <Path
              d="M12 2l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V5l7-3z"
              stroke={activeColor}
              strokeWidth={sw}
              fill={useFill ? activeColor : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path d="M9 12l2 2 4-4" stroke={innerDarkContrast} strokeWidth={sw + 0.4} strokeLinecap="round" strokeLinejoin="round" />
          </>
        );

      case 'brujula_solar':
        return (
          <>
            <Circle cx="12" cy="12" r="9" stroke={activeColor} strokeWidth={sw} />
            <Polygon points="12,5 14.5,12 12,11 9.5,12" fill={activeColor} stroke={activeColor} strokeWidth={1} />
            <Polygon points="12,19 14.5,12 12,13 9.5,12" stroke={activeColor} strokeWidth={1} fill="none" />
            <Line x1="12" y1="2" x2="12" y2="4" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
            <Line x1="12" y1="20" x2="12" y2="22" stroke={activeColor} strokeWidth={sw} strokeLinecap="round" />
          </>
        );

      case 'sensor_lux':
        return (
          <Path
            d="M9 18h6m-4 3h2m-4-7a6 6 0 1 1 6-6c0 2.2-1.2 3.8-2 5H11c-.8-1.2-2-2.8-2-5z"
            stroke={activeColor}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={useFill ? activeColor : 'none'}
          />
        );

      case 'ventana_distancia':
        return (
          <>
            <Rect x="4" y="3" width="16" height="18" rx="2" stroke={activeColor} strokeWidth={sw} />
            <Line x1="12" y1="3" x2="12" y2="21" stroke={activeColor} strokeWidth={sw} />
            <Line x1="4" y1="12" x2="20" y2="12" stroke={activeColor} strokeWidth={sw} />
          </>
        );

      case 'alerta_termica':
        return (
          <Path
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            stroke={activeColor}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'flecha_volver':
        return (
          <Path d="M19 12H5M12 19l-7-7 7-7" stroke={activeColor} strokeWidth={sw + 0.4} strokeLinecap="round" strokeLinejoin="round" />
        );

      case 'flecha_adelante':
        return (
          <Path d="M5 12h14M12 5l7 7-7 7" stroke={activeColor} strokeWidth={sw + 0.4} strokeLinecap="round" strokeLinejoin="round" />
        );

      case 'check_verificado':
        return (
          <>
            <Circle cx="12" cy="12" r="9" stroke={activeColor} strokeWidth={sw} fill={useFill ? activeColor : 'none'} />
            <Polyline points="8 12 11 15 16 9" stroke={innerDarkContrast} strokeWidth={sw + 0.4} strokeLinecap="round" strokeLinejoin="round" />
          </>
        );

      case 'cierre':
        return (
          <Path d="M18 6L6 18M6 6l12 12" stroke={activeColor} strokeWidth={sw + 0.4} strokeLinecap="round" strokeLinejoin="round" />
        );

      case 'flecha_abajo':
        return (
          <Path d="M6 9l6 6 6-6" stroke={activeColor} strokeWidth={sw + 0.4} strokeLinecap="round" strokeLinejoin="round" />
        );

      case 'mas':
        return (
          <Path d="M12 5v14M5 12h14" stroke={activeColor} strokeWidth={sw + 0.4} strokeLinecap="round" strokeLinejoin="round" />
        );

      case 'menos':
        return (
          <Path d="M5 12h14" stroke={activeColor} strokeWidth={sw + 0.4} strokeLinecap="round" strokeLinejoin="round" />
        );

      case 'google':
        if (isGlowLayer) {
          return (
            <Path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              stroke={activeColor}
              strokeWidth={sw}
            />
          );
        }
        return (
          <>
            <Path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <Path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <Path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <Path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </>
        );

      default:
        return (
          <Circle cx="12" cy="12" r="9" stroke={activeColor} strokeWidth={sw} />
        );
    }
  };

  const vbBleed = glow ? 4 : 0;
  const pxBleed = glow ? (size * vbBleed) / 24 : 0;

  return (
    <View
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
      }}
    >
      <Svg
        width={size + pxBleed * 2}
        height={size + pxBleed * 2}
        viewBox={`${-vbBleed} ${-vbBleed} ${24 + vbBleed * 2} ${24 + vbBleed * 2}`}
        fill="none"
        style={pxBleed > 0 ? { margin: -pxBleed } : undefined}
      >
        {glow && (
          <G opacity={0.32}>
            {renderShapes(resolvedGlowColor, baseStrokeWidth + 3.2, true)}
          </G>
        )}
        <G>{renderShapes(color, baseStrokeWidth, false)}</G>
      </Svg>
    </View>
  );
});
