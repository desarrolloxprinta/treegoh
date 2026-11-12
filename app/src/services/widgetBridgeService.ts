/**
 * iOS WidgetKit & Dynamic Sanctuary Bridge — Treegoh
 * 
 * Sincroniza el estado del santuario (plantas, riegos pendientes, racha estilo Duolingo y microclima)
 * con los widgets nativos de iOS (Home Screen y Lock Screen) a través de App Groups (UserDefaults).
 */

import { Platform, NativeModules } from 'react-native';
import { getItem, setItem } from './storageService';
import { UserPlant } from '../types/plant';
import { CareStreakData } from './reminderService';

export interface SanctuaryWidgetPayload {
  sanctuaryName: string;
  streakDays: number;
  streakTitle: string;
  duoMessageTitle: string;
  duoMessageBody: string;
  urgency: 'optimo' | 'atencion' | 'urgente';
  pendingWateringsCount: number;
  pendingOtherCount: number;
  nextWateringPlantName: string;
  nextWateringSpaceName: string;
  nextWateringDays: number;
  lastUpdatedIso: string;
  totalPlantsCount: number;
  temperatureCelsius?: number;
  weatherCondition?: string;
}

const STORAGE_WIDGET_KEY = '@treegoh_widget_data_v1';
export const APP_GROUP_ID = 'group.com.treegoh.app';

/**
 * Prepara el paquete de datos estructurado para el Widget de iOS
 */
export function buildWidgetPayload(
  plants: UserPlant[],
  streak: CareStreakData,
  sanctuaryName = 'Mi Santuario',
  weather?: { temperature: number; condition: string }
): SanctuaryWidgetPayload {
  const allPlants = plants || [];
  const urgentWaterings = allPlants.filter(
    p => p.wateringStatus === 'necesita_riego' || p.daysUntilNextWatering <= 0
  );
  const otherTasks = allPlants.filter(
    p => p.needsPruning || p.needsRepotting || p.needsFertilization || p.needsCleaning
  );

  // Ordenar para encontrar el próximo riego más inmediato
  const sortedByWatering = [...allPlants].sort(
    (a, b) => a.daysUntilNextWatering - b.daysUntilNextWatering
  );
  const nextPlant = sortedByWatering[0];

  let urgency: 'optimo' | 'atencion' | 'urgente' = 'optimo';
  let duoTitle = 'Santuario en paz';
  let duoBody = 'Tus hojas están firmes y con hidratación óptima.';

  if (urgentWaterings.length > 0) {
    urgency = 'urgente';
    const firstUrgent = urgentWaterings[0];
    const name = firstUrgent.nickname ? `«${firstUrgent.nickname}»` : firstUrgent.commonName;
    duoTitle = '¡Riego pendiente!';
    duoBody = `${name} en ${firstUrgent.spaceName} necesita agua hoy para conservar su turgencia.`;
  } else if (nextPlant && nextPlant.daysUntilNextWatering <= 1) {
    urgency = 'atencion';
    const name = nextPlant.nickname ? `«${nextPlant.nickname}»` : nextPlant.commonName;
    duoTitle = 'Atención cercana';
    duoBody = `${name} necesitará hidratación en las próximas 24 horas.`;
  }

  return {
    sanctuaryName,
    streakDays: streak?.currentStreak || 1,
    streakTitle: streak?.levelTitle || 'Brote Primerizo',
    duoMessageTitle: duoTitle,
    duoMessageBody: duoBody,
    urgency,
    pendingWateringsCount: urgentWaterings.length,
    pendingOtherCount: otherTasks.length,
    nextWateringPlantName: nextPlant ? nextPlant.nickname || nextPlant.commonName : 'Sin plantas',
    nextWateringSpaceName: nextPlant ? nextPlant.spaceName : 'Santuario',
    nextWateringDays: nextPlant ? Math.max(0, nextPlant.daysUntilNextWatering) : 0,
    lastUpdatedIso: new Date().toISOString(),
    totalPlantsCount: allPlants.length,
    temperatureCelsius: weather?.temperature,
    weatherCondition: weather?.condition,
  };
}

/**
 * Sincroniza los datos con UserDefaults del App Group de iOS y con almacenamiento local
 */
export async function syncSanctuaryWidgetData(
  plants: UserPlant[],
  streak: CareStreakData,
  sanctuaryName = 'Mi Santuario',
  weather?: { temperature: number; condition: string }
): Promise<SanctuaryWidgetPayload> {
  const payload = buildWidgetPayload(plants, streak, sanctuaryName, weather);

  // 1. Guardar en almacenamiento local
  try {
    await setItem(STORAGE_WIDGET_KEY, payload);
  } catch (_e) {}

  // 2. Si estamos en iOS y el módulo nativo de WidgetBridge existe, enviarlo a UserDefaults
  if (Platform.OS === 'ios') {
    try {
      const bridge = NativeModules.TreegohWidgetBridge;
      if (bridge && typeof bridge.updateWidgetData === 'function') {
        await bridge.updateWidgetData(JSON.stringify(payload));
      }
    } catch (e) {
      console.log('[TreegohWidgetBridge] Aviso sincronizando con WidgetKit:', e);
    }
  }

  // 3. Si estamos en Web, guardarlo en localStorage para debugging y PWA widgets
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem('treegoh_sanctuary_widget', JSON.stringify(payload));
    } catch (_e) {}
  }

  return payload;
}

