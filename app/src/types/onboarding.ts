import { BotanicalAvatar } from '../constants/botanicalAvatars';

export type PetType = 'gato' | 'perro' | 'ave' | 'reptil' | 'roedor' | 'exotico';

export interface CustomMicroclimate {
  id: string;
  name: string;
  roomType: string;
  orientation: 'N' | 'S' | 'E' | 'O' | 'NE' | 'SE' | 'NO' | 'SO';
  headingDegrees: number;
  windowDistance: 'junto_a_ventana' | 'media_distancia' | 'rincon_profundo';
  floorLevel?: 'baja' | 'media' | 'alta';
  floorNumber?: number;
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
  fullAddress?: string;
  annualSolarSummary?: {
    winterHours: number;
    summerHours: number;
    todayHours: number;
    maxElevation: number;
  };
}

export type BotanicalExperienceLevel =
  | 'principiante'
  | 'habitual'
  | 'experto';

export interface UserAccount {
  uid?: string;
  authProvider: 'apple' | 'google' | 'email' | 'guest';
  email?: string;
  displayName?: string;
  photoURL?: string | null;
  experienceLevel?: BotanicalExperienceLevel;
  isGuest: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface SafetyFilter {
  hasPets: boolean;
  petTypes: PetType[];
  hasChildren: boolean;
}

export interface UserLocationDetails {
  city: string;
  bioclimaticZone: string;
  waterHardness: string;
  street?: string;
  streetNumber?: string;
  floorOrApt?: string;
  floorNumber?: number;
  propertyType?: 'casa' | 'edificio';
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  altitudeMeters?: number;
  fullAddress?: string;
}

export interface OnboardingState {
  currentStep: number;
  account?: UserAccount;
  goals: string[];
  location: UserLocationDetails;
  spaces: string[];
  customMicroclimates?: CustomMicroclimate[];
  safetyFilter: SafetyFilter;
  characterCalibrated: boolean;
  isGuest: boolean;
  assignedAvatar?: BotanicalAvatar;
}
