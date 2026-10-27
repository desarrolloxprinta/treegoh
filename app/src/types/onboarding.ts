import { BotanicalAvatar } from '../constants/botanicalAvatars';

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
}

export interface UserAccount {
  authProvider: 'apple' | 'google' | 'email' | 'guest';
  email?: string;
  displayName?: string;
  isGuest: boolean;
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
  safetyFilter: {
    hasPets: boolean;
    hasChildren: boolean;
  };
  characterCalibrated: boolean;
  isGuest: boolean;
  assignedAvatar?: BotanicalAvatar;
}
