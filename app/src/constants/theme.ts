/**
 * Treegoh • Sistema de Diseño Atmosférico TIDE & Montserrat Light
 * Cero Emojis Clásicos • Tipografía Montserrat Light (Cero Bold)
 * 
 * En iOS se utiliza la fuente del sistema ("System" / San Francisco) con pesos '300' y '400',
 * garantizando cero llamadas erróneas a CoreText y máxima fidelidad visual.
 */

import { Platform } from 'react-native';

export const Fonts = {
  extraLight: Platform.select({ ios: 'System', default: 'sans-serif-thin' }),
  light: Platform.select({ ios: 'System', default: 'sans-serif-light' }),
  lightItalic: Platform.select({ ios: 'System', default: 'sans-serif-light' }),
  regular: Platform.select({ ios: 'System', default: 'sans-serif' }),
  medium: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
};

export const Colors = {
  // Base Lumínica & Atmosférica TIDE
  pureWhite: '#FFFFFF',
  warmMist: '#EBEAE4',
  lightGray: '#F6F5F0',
  tideBaseDark: '#353330',
  tideMidStone: '#4B4742',
  tideWarmTaupe: '#5E5851',
  tideSlateMist: '#6F767A',

  // Acentos Suaves
  sage: '#84A98C',
  eucalyptus: '#52796F',
  slateGreen: '#354F52',
  terracotta: '#E29578',

  // Rasgos Canónicos del Character Treegoh
  plum: '#5B1636',
  pupilInner: '#7A2348',
  blush: '#F4A0B2',
  voiceResonance: '#9C8EB9',

  // Texto y Contraste
  darkObsidian: '#1E1D1B',
  bodyText: '#4A4743',
  mutedText: '#8A857F',

  // Bordes y Sombras
  borderLight: 'rgba(20, 28, 25, 0.08)',
  borderActive: 'rgba(255, 255, 255, 0.72)',
  shadowSubtle: 'rgba(20, 28, 25, 0.04)',

  // Tokens Minerales TIDE Glassmorphism Canónico
  glassSurface: 'rgba(255, 255, 255, 0.08)',
  glassSurfaceActive: 'rgba(255, 255, 255, 0.16)',
  glassSurfaceSubtle: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.16)',
  glassBorderActive: '#FFFFFF',
  glassBorderSubtle: 'rgba(255, 255, 255, 0.10)',
  glassTextPrimary: '#FFFFFF',
  glassTextSecondary: 'rgba(255, 255, 255, 0.70)',
  glassTextMuted: 'rgba(255, 255, 255, 0.52)',
  glassDivider: 'rgba(255, 255, 255, 0.15)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 44,
};

/**
 * Reglas Maestras de Diagramación y Tarjetas Canónicas TIDE
 * Establecidas como estándar absoluto para todo Treegoh (2026).
 */
export const LayoutMetrics = {
  // Márgenes de Pantalla
  screenPaddingHorizontal: 24,
  screenPaddingTop: 16,
  screenPaddingBottom: 120,

  // Separación entre Secciones
  sectionGap: 34,
  sectionHeaderGap: 8,

  // Grillas y Distribución 2x2 / 2 Columnas
  gridGap: 16,
  grid2ColWidth: '48.2%' as const,
  grid2ColSelectionWidth: '47.4%' as const,

  // Geometría y Padding de Tarjetas
  cardRadius: 22,
  cardRadiusLarge: 26,
  cardRadiusPill: 20,
  cardPadding: 18,
  cardPaddingLarge: 24,
  cardPaddingCompact: 14,
  cardSelectionMinHeight: 128,
  cardGoalMinHeight: 204,

  // Ranuras Interactivas Vacías (Add Slot)
  slotCardBorderWidth: 1.5,
  slotCardBorderStyle: 'dashed' as const,
  slotCardMinHeight: 224,

  // Prohibición Estricta
  // 1. CERO negritas ('bold', '600', '700', '800', '900') — únicamente '300' y '400'.
  // 2. CERO emojis clásicos — todo mediante TreegohIcon vectorial.
  // 3. CERO franjas o cajas negras duras sobre fotos botánicas.
  // 4. CERO solapamientos: números display y badges con bloque hero propio.
};

export const Typography = {
  titleLarge: {
    fontFamily: Fonts.light,
    fontSize: 26,
    fontWeight: '300' as const,
    color: Colors.darkObsidian,
    letterSpacing: -0.2,
  },
  titleMedium: {
    fontFamily: Fonts.light,
    fontSize: 20,
    fontWeight: '300' as const,
    color: Colors.darkObsidian,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300' as const,
    color: Colors.bodyText,
    lineHeight: 22,
  },
  caption: {
    fontFamily: Fonts.light,
    fontSize: 14,
    fontWeight: '300' as const,
    color: Colors.mutedText,
    lineHeight: 19,
  },
  // Jerarquías en cristal oscuro TIDE
  glassDisplay: {
    fontFamily: Fonts.light,
    fontSize: 32,
    fontWeight: '300' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  glassTitle: {
    fontFamily: Fonts.light,
    fontSize: 18,
    fontWeight: '300' as const,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  glassCardTitle: {
    fontFamily: Fonts.light,
    fontSize: 15.5,
    fontWeight: '300' as const,
    color: '#FFFFFF',
  },
  glassCardTitleActive: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    fontWeight: '400' as const,
    color: '#FFFFFF',
  },
  glassCardSub: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300' as const,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  glassMicroTag: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300' as const,
    color: 'rgba(255, 255, 255, 0.70)',
    letterSpacing: 0.8,
  },
};
