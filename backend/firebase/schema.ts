/**
 * Treegoh - Modelo de Datos Firestore & Firebase Auth
 * Arquitectura de Usuario, Avatares Canonicos y Coleccion Botanica
 */

export interface UserPreferences {
  theme: 'light_luxury' | 'system'; // Por defecto 'light_luxury' (#FFFFFF / #EBEAE4)
  hapticFeedback: boolean;
  voiceAssistantEnabled: boolean; // ElevenLabs botanic voice
  dailyNotificationTime: string; // "09:00"
}

export interface CharacterStateConfig {
  mood: 'neutral' | 'happy' | 'thirsty' | 'warning' | 'listening';
  customColors?: {
    eyesPlum: string; // Canonico: #5B1636
    coreAccent: string; // Canonico: #84A98C / #96E1A5
    blush: string; // Canonico: #F4A0B2
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  bio?: string;
  
  // Sistema de Avatar Canonico Treegoh (Cero Emojis)
  // Si photoURL es null o vacio, el cliente renderiza automaticamente el Character Oficial
  photoURL: string | null; 
  hasCustomPhoto: boolean; 
  characterState: CharacterStateConfig;

  preferences: UserPreferences;
  createdAt: number; // Timestamp Unix ms
  updatedAt: number;
}

export interface PlantVitalStatus {
  hydrationLevel: number; // 0 - 100
  lightLuxHours: number;
  temperatureCelsius: number;
  vpdKpa: number; // Deficit de Presion de Vapor
  statusOrb: 'optimal' | 'attention' | 'critical' | 'voice_active'; // #84A98C | #E29578 | #D9534F | #9C8EB9
}

export interface UserPlant {
  id: string;
  userId: string;
  nickname: string; // ej. "Monstera Salon"
  botanicalSpeciesId: string; // ref a biblia-plantas
  speciesCommonName: string; // "Monstera Deliciosa"
  
  // Foto real de la planta o fallback al Character botanico
  photoURL: string | null;
  spaceLocation: string; // "Salon Luminoso"
  potType: 'barro' | 'autorriego' | 'plastico';
  substrateType: string;

  vitals: PlantVitalStatus;
  lastWatered: number;
  nextScheduledWatering: number;
  createdAt: number;
}
