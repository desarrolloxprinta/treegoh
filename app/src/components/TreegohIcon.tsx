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
  | 'compartir_exportar';

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

    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );
  }
};
