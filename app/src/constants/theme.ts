/**
 * Treegoh • Sistema de Diseño Oficial Light Luxury (#FFFFFF & #EBEAE4)
 * Cero Emojis Clásicos • Tipografía Funnel Display / Inter
 */

export const Colors = {
  // Base Lumínica Dominante
  pureWhite: '#FFFFFF',
  warmMist: '#EBEAE4',
  lightGray: '#F6F5F0',
  
  // Acentos Botánicos de Marca
  sage: '#84A98C',          // Verde Salvia (Salud / Óptimo)
  eucalyptus: '#52796F',    // Verde Eucalipto
  slateGreen: '#354F52',    // Pizarra Verde
  terracotta: '#E29578',    // Ámbar Suave (Atención requerida)
  
  // Rasgos Canónicos del Character Treegoh
  plum: '#5B1636',          // Ciruela profundo (Ojos, cejas, boca)
  pupilInner: '#7A2348',    // Interior pupila
  blush: '#F4A0B2',         // Coloretes suaves kawaii
  voiceResonance: '#9C8EB9',// Púrpura Resonancia (ElevenLabs activo)
  
  // Texto y Contraste
  darkObsidian: '#141C19',  // Títulos principales
  bodyText: '#40524D',      // Párrafos y subtítulos
  mutedText: '#80948C',     // Metadatos y pie
  
  // Bordes y Sombras
  borderLight: 'rgba(20, 28, 25, 0.08)',
  borderActive: '#52796F',
  shadowSubtle: 'rgba(20, 28, 25, 0.04)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 44,
};

export const Typography = {
  titleLarge: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.darkObsidian,
    letterSpacing: -0.4,
  },
  titleMedium: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.darkObsidian,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14,
    color: Colors.bodyText,
    lineHeight: 21,
  },
  caption: {
    fontSize: 12,
    color: Colors.mutedText,
    lineHeight: 16,
  },
};
