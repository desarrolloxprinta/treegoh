export type WateringStatus =
  | 'optimo'
  | 'necesita_riego'
  | 'hidratada'
  | 'en_reposo';

export type LightCompatibility = 'optima' | 'buena' | 'limite';

export interface UserPlant {
  id: string;
  spaceName: string; // Vinculado al espacio (ej: 'Salón', 'Dormitorio', 'Terraza')
  commonName: string;
  scientificName: string;
  family?: string;
  nickname?: string;
  imageUrl: string;
  wateringStatus: WateringStatus;
  daysUntilNextWatering: number;
  lightCompatibility: LightCompatibility;
  lightCompatibilityNote?: string;
  substrateType?: string;
  isPetSafe: boolean;
  toxicityNote?: string;
  addedAt: string;
  estimatedLuxDemand?: number;
  trait?: string;
  notes?: string;
  healthAssessment?: string;
  confidenceScore?: number;
  lastWateredDate?: string;
  needsPruning?: boolean;
  pruningNote?: string;
  needsRepotting?: boolean;
  repottingNote?: string;
  lastFertilizedDate?: string;
  daysUntilNextFertilization?: number;
  needsFertilization?: boolean;
  fertilizationNote?: string;
  lastCleanedDate?: string;
  daysUntilNextCleaning?: number;
  needsCleaning?: boolean;
  cleaningNote?: string;
  lastRotatedDate?: string;
  purchasedAt?: string;
  lastRepottedDate?: string;
  potDiameterCm?: number;
  photoGallery?: string[];
  clinicalLog?: PlantClinicalEvent[];
  emergencyAlert?: {
    type: 'temperatura' | 'plaga' | 'deshidratacion' | 'luz_excesiva';
    message: string;
    severity: 'alta' | 'media';
  };
}

export interface RecommendedSpaceSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  imageUrl: string;
  minLux: number;
  maxLux: number;
  isPetSafe: boolean;
  wateringIntervalDays: number;
  trait: string;
  suitableRooms: string[];
}

export type PlantClinicalEventType =
  | 'riego'
  | 'fertilizacion'
  | 'trasplante'
  | 'poda'
  | 'limpieza'
  | 'diagnostico'
  | 'foto'
  | 'adopcion'
  | 'correccion_especie';

export interface PlantClinicalEvent {
  id: string;
  type: PlantClinicalEventType;
  date: string;
  title: string;
  notes?: string;
  photoUri?: string;
}
