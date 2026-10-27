import { BotanicalAvatar } from '../constants/botanicalAvatars';

export interface OnboardingState {
  currentStep: number;
  goals: string[];
  location: {
    city: string;
    bioclimaticZone: string;
    waterHardness: string;
  };
  spaces: string[];
  safetyFilter: {
    hasPets: boolean;
    hasChildren: boolean;
  };
  characterCalibrated: boolean;
  isGuest: boolean;
  assignedAvatar?: BotanicalAvatar;
}
