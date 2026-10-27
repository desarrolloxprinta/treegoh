import { BotanicalAvatar } from '../constants/botanicalAvatars';

export type PetType = 'gato' | 'perro' | 'ave' | 'reptil' | 'roedor' | 'exotico';

export interface CustomMicroclimate {
  id: string;
  name: string;
  roomType: string;
  orientation: 'N' | 'S' | 'E' | 'O' | 'NE' | 'SE' | 'NO' | 'SO';
  headingDegrees: number;
  windowDistance: 'junto_a_ventana' | 'media_distancia' | 'rincon_profundo';
  estimatedLux: number;
  thermalRisks: {
    nearRadiator: boolean;
    nearAC: boolean;
    drafts: boolean;
  };
  humidityLevel: 'alta' | 'media' | 'seca';
  habitabilityScore: number;
  verdict: string;
  recommendedSpecies: string[];
  preventiveTips: string[];
  directSunHours?: number;
  photoUri?: string;
  iconName?: string;
  aiAnalysisDone?: boolean;
  detectedFeatures?: string[];
}

export interface UserAccount {
  authProvider: 'apple' | 'google' | 'email' | 'guest';
  email?: string;
  displayName?: string;
  isGuest: boolean;
}

export interface SafetyFilter {
  hasPets: boolean;
  petTypes: PetType[];
  hasChildren: boolean;
}

export interface OnboardingState {
  currentStep: number;
  account?: UserAccount;
  goals: string[];
  location: {
    city: string;
    bioclimaticZone: string;
    waterHardness: string;
  };
  spaces: string[];
  customMicroclimates?: CustomMicroclimate[];
  safetyFilter: SafetyFilter;
  characterCalibrated: boolean;
  isGuest: boolean;
  assignedAvatar?: BotanicalAvatar;
}
