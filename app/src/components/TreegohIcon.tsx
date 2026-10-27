import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon, Ellipse, G } from 'react-native-svg';
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
  | 'check_verificado';

interface TreegohIconProps {
  name: IconName;
  variant?: 'lineal' | 'solido';
  size?: number;
  color?: string;
}

export const TreegohIcon: React.FC<TreegohIconProps> = ({
  name,
  variant = 'lineal',
  size = 24,
  color = Colors.darkObsidian,
}) => {
  const strokeWidth = 1.8;

  switch (name) {
    case 'luz_natural':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="4.2" stroke={color} strokeWidth={strokeWidth} fill={variant === 'solido' ? color : 'none'} />
          <Line x1="12" y1="2" x2="12" y2="4.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="12" y1="19.5" x2="12" y2="22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="2" y1="12" x2="4.5" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="19.5" y1="12" x2="22" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="4.93" y1="4.93" x2="6.7" y2="6.7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="17.3" y1="17.3" x2="19.07" y2="19.07" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="4.93" y1="19.07" x2="6.7" y2="17.3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="17.3" y1="6.7" x2="19.07" y2="4.93" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'voz_botanica':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth={variant === 'solido' ? 2.6 : strokeWidth} strokeLinecap="round" />
          <Line x1="8" y1="6" x2="8" y2="18" stroke={color} strokeWidth={variant === 'solido' ? 2.6 : strokeWidth} strokeLinecap="round" />
          <Line x1="16" y1="6" x2="16" y2="18" stroke={color} strokeWidth={variant === 'solido' ? 2.6 : strokeWidth} strokeLinecap="round" />
          <Line x1="4" y1="10" x2="4" y2="14" stroke={color} strokeWidth={variant === 'solido' ? 2.6 : strokeWidth} strokeLinecap="round" />
          <Line x1="20" y1="10" x2="20" y2="14" stroke={color} strokeWidth={variant === 'solido' ? 2.6 : strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'riego_hidratacion':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={variant === 'solido' ? color : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M12 9v7" stroke={variant === 'solido' ? '#FFFFFF' : color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M12 13l2.5-2.5" stroke={variant === 'solido' ? '#FFFFFF' : color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M12 15l-2-2" stroke={variant === 'solido' ? '#FFFFFF' : color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'espacios_microclimas':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 10.5L12 3l9 7.5v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={variant === 'solido' ? color : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M12 18V11" stroke={variant === 'solido' ? '#FFFFFF' : color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M12 14c2-2 3-1 4-1s0 3-1 4-2-1-3-3z" stroke={variant === 'solido' ? '#FFFFFF' : color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'camara_diagnostica':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 8V5a2 2 0 0 1 2-2h3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M19 8V5a2 2 0 0 0-2-2h-3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M5 16v3a2 2 0 0 0 2 2h3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M19 16v3a2 2 0 0 1-2 2h-3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth={strokeWidth} fill={variant === 'solido' ? color : 'none'} />
        </Svg>
      );

    case 'temperatura_termica':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={variant === 'solido' ? color : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="11.5" cy="17.5" r="1.5" fill={variant === 'solido' ? '#FFFFFF' : color} />
        </Svg>
      );

    case 'toxicidad_mascotas':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="6" cy="10" r="2" fill={color} />
          <Circle cx="10" cy="6" r="2" fill={color} />
          <Circle cx="14" cy="6" r="2" fill={color} />
          <Circle cx="18" cy="10" r="2" fill={color} />
          <Path
            d="M8 15c0-2.5 2-4 4-4s4 1.5 4 4c0 2.5-1.5 5-4 5s-4-2.5-4-5z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={variant === 'solido' ? color : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'floracion_fenologia':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth={strokeWidth} fill={variant === 'solido' ? '#141C19' : 'none'} />
          <Path d="M12 9.5a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 0 0 5z" stroke={color} strokeWidth={strokeWidth} fill={variant === 'solido' ? color : 'none'} />
          <Path d="M12 14.5a2.5 2.5 0 0 0 0 5 2.5 2.5 0 0 0 0-5z" stroke={color} strokeWidth={strokeWidth} fill={variant === 'solido' ? color : 'none'} />
          <Path d="M9.5 12a2.5 2.5 0 0 0-5 0 2.5 2.5 0 0 0 5 0z" stroke={color} strokeWidth={strokeWidth} fill={variant === 'solido' ? color : 'none'} />
          <Path d="M14.5 12a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0-5 0z" stroke={color} strokeWidth={strokeWidth} fill={variant === 'solido' ? color : 'none'} />
        </Svg>
      );

    case 'sonido_soundscapes':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" stroke={color} strokeWidth={strokeWidth} fill={variant === 'solido' ? color : 'none'} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'tarea_completada':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={strokeWidth + 0.6} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case 'humedad_vpd':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke={color} strokeWidth={strokeWidth} fill={variant === 'solido' ? color : 'none'} strokeLinejoin="round" />
          <Path d="M8 14a4 4 0 0 0 4 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'pulverizacion_spray':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3v4M8 7h8v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V7z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" fill={variant === 'solido' ? color : 'none'} />
          <Path d="M6 7l-2 2M18 7l2 2M16 4h3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'escudo_fitosanitario':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" fill={variant === 'solido' ? color : 'none'} />
        </Svg>
      );

    case 'mascota_gato':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 5.5c-3.5 0-6 2-6 5.5 0 4.2 2.8 7 6 7s6-2.8 6-7c0-3.5-2.5-5.5-6-5.5z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={variant === 'solido' ? color : 'none'}
          />
          <Path d="M6 9.5L4 4l5.5 2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M18 9.5L20 4l-5.5 2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="9.5" cy="11.5" r="1.1" fill={color} />
          <Circle cx="14.5" cy="11.5" r="1.1" fill={color} />
          <Path d="M11 14.2l1 .8 1-.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="4.5" y1="13" x2="7.5" y2="13.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="19.5" y1="13" x2="16.5" y2="13.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'mascota_perro':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 6c0-2 2-3 5-3s5 1 5 3v5c0 4.5-2.5 7.5-5 7.5S7 15.5 7 11V6z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={variant === 'solido' ? color : 'none'}
          />
          <Path d="M7 7C5 8 3.5 11 3.5 13.5c0 2 1 3 2.5 2.5L7 13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M17 7c2 1 3.5 4 3.5 6.5 0 2-1 3-2.5 2.5L17 13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="9.5" cy="10" r="1.2" fill={color} />
          <Circle cx="14.5" cy="10" r="1.2" fill={color} />
          <Path d="M10.5 13.5h3l-1.5 2-1.5-2z" fill={color} />
        </Svg>
      );

    case 'mascota_ave':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M16 4a5 5 0 0 0-5 5c0 1.5.5 3 1.5 4.2L4 18l3-1 2 3 5.5-3.5c1.2.5 2.5.5 3.5 0 3-1.5 4-5 4-8.5V4h-6z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={variant === 'solido' ? color : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="17" cy="8" r="1.2" fill={color} />
          <Path d="M22 8l-3-2v4l3-2z" fill={color} />
        </Svg>
      );

    case 'mascota_reptil':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="13" r="6.5" stroke={color} strokeWidth={strokeWidth} fill={variant === 'solido' ? color : 'none'} />
          <Circle cx="12" cy="4.5" r="2" stroke={color} strokeWidth={strokeWidth} fill={color} />
          <Path d="M6 9.5l-2.5-2M18 9.5l2.5-2M6 16.5l-2.5 2M18 16.5l2.5 2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M12 6.5v13M5.5 13h13" stroke={variant === 'solido' ? '#FFFFFF' : color} strokeWidth={1.5} />
        </Svg>
      );

    case 'mascota_roedor':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M8.5 11c-2.5 0-4.5 2-4.5 4.5 0 3 2.5 5.5 8 5.5s8-2.5 8-5.5c0-2.5-2-4.5-4.5-4.5h-7z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={variant === 'solido' ? color : 'none'}
          />
          <Path d="M9 11C8 8.5 7 3 9 3c1.8 0 2.5 4.5 2.5 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M15 11c1-2.5 2-8 0-8-1.8 0-2.5 4.5-2.5 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="8.5" cy="15" r="1.1" fill={color} />
          <Circle cx="15.5" cy="15" r="1.1" fill={color} />
          <Circle cx="12" cy="17" r="0.9" fill={color} />
        </Svg>
      );

    case 'mascota_libre':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V5l7-3z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={variant === 'solido' ? color : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M9 12l2 2 4-4" stroke={variant === 'solido' ? '#121A15' : color} strokeWidth={strokeWidth + 0.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case 'brujula_solar':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
          <Polygon points="12,5 14.5,12 12,11 9.5,12" fill={color} stroke={color} strokeWidth={1} />
          <Polygon points="12,19 14.5,12 12,13 9.5,12" stroke={color} strokeWidth={1} fill="none" />
          <Line x1="12" y1="2" x2="12" y2="4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="12" y1="20" x2="12" y2="22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'sensor_lux':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 18h6m-4 3h2m-4-7a6 6 0 1 1 6-6c0 2.2-1.2 3.8-2 5H11c-.8-1.2-2-2.8-2-5z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={variant === 'solido' ? color : 'none'}
          />
        </Svg>
      );

    case 'ventana_distancia':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth={strokeWidth} />
          <Line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth={strokeWidth} />
          <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );

    case 'alerta_termica':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case 'flecha_volver':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={strokeWidth + 0.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case 'check_verificado':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} fill={variant === 'solido' ? color : 'none'} />
          <Polyline points="8 12 11 15 16 9" stroke={variant === 'solido' ? '#121A15' : color} strokeWidth={strokeWidth + 0.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );
  }
};
