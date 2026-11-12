/**
 * Botanical Reminder & Sanctuary Rituals Engine — Treegoh
 * 
 * Motor de recordatorios dinámicos estilo Duolingo y sincronización de alarmas
 * para riego, fertilización, trasplante, limpieza foliar y rotación solar.
 * 
 * Reglas de diseño Treegoh:
 * - Cero emojis en todos los textos y notificaciones.
 * - Vocabulario botánico puro, empático y poético en español.
 * - Sistema de racha de santuario con preservación diaria.
 * - Niveles de urgencia fenológica: Óptimo, Atención temprana y Urgente.
 */

import { getItem, setItem } from './storageService';
import { UserPlant } from '../types/plant';

export type BotanicalRitualType =
  | 'riego'
  | 'fertilizacion'
  | 'trasplante'
  | 'limpieza_foliar'
  | 'rotacion_solar';

export type RitualUrgency = 'optimo' | 'atencion' | 'urgente';

export interface BotanicalTask {
  id: string;
  plantId: string;
  plantName: string;
  plantNickname?: string;
  plantImageUrl: string;
  spaceName: string;
  type: BotanicalRitualType;
  urgency: RitualUrgency;
  title: string;
  description: string;
  actionText: string;
  daysRemaining: number;
  scheduledTime?: string;
}

export interface CareStreakData {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalRitualsCompleted: number;
  levelTitle: string;
  streakShieldAvailable: boolean;
}

export interface DuolingoMicrocopy {
  title: string;
  message: string;
  urgency: RitualUrgency;
  actionLabel: string;
  streakEmphasis: string;
}

const STORAGE_CARE_STREAK_KEY = '@treegoh_care_streak_v1';
const STORAGE_COMPLETED_RITUALS_KEY = '@treegoh_completed_rituals_v1';

const DEFAULT_STREAK: CareStreakData = {
  currentStreak: 1,
  bestStreak: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  totalRitualsCompleted: 0,
  levelTitle: 'Brote Primerizo',
  streakShieldAvailable: true,
};

/**
 * Calcula el título de nivel botánico según la racha acumulada
 */
export function getStreakLevelTitle(days: number): string {
  if (days >= 90) return 'Guardián del Bosque Ancestral';
  if (days >= 60) return 'Maestro del Canopo';
  if (days >= 30) return 'Cultivador de Raíces Profundas';
  if (days >= 14) return 'Custodio del Microclima';
  if (days >= 7) return 'Sembrador Constante';
  if (days >= 3) return 'Brote Emergente';
  return 'Brote Primerizo';
}

/**
 * Obtiene la racha de cuidado botánico actual
 */
export async function getCareStreak(): Promise<CareStreakData> {
  try {
    const saved = await getItem<CareStreakData>(STORAGE_CARE_STREAK_KEY);
    if (!saved) {
      await setItem(STORAGE_CARE_STREAK_KEY, DEFAULT_STREAK);
      return DEFAULT_STREAK;
    }

    // Comprobar si la racha expiró (más de 1 día de ausencia sin escudo)
    const today = new Date().toISOString().split('T')[0];
    const lastDate = saved.lastActiveDate;
    if (lastDate && lastDate !== today) {
      const diffMs = new Date(today).getTime() - new Date(lastDate).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        // Pérdida de racha o consumo de escudo
        if (saved.streakShieldAvailable && diffDays === 2) {
          // Escudo protector absorbe un día de descanso
          saved.streakShieldAvailable = false;
        } else {
          saved.currentStreak = 1;
        }
        await setItem(STORAGE_CARE_STREAK_KEY, saved);
      }
    }

    return saved;
  } catch (_e) {
    return DEFAULT_STREAK;
  }
}

/**
 * Registra la finalización de un ritual y actualiza la racha de días consecutivos
 */
export async function recordRitualCompletion(
  _plantId: string,
  _ritualType: BotanicalRitualType
): Promise<CareStreakData> {
  const current = await getCareStreak();
  const today = new Date().toISOString().split('T')[0];

  let newStreak = current.currentStreak;
  if (current.lastActiveDate !== today) {
    newStreak += 1;
  }

  const updated: CareStreakData = {
    currentStreak: newStreak,
    bestStreak: Math.max(newStreak, current.bestStreak),
    lastActiveDate: today,
    totalRitualsCompleted: (current.totalRitualsCompleted || 0) + 1,
    levelTitle: getStreakLevelTitle(newStreak),
    streakShieldAvailable: newStreak % 7 === 0 ? true : current.streakShieldAvailable,
  };

  await setItem(STORAGE_CARE_STREAK_KEY, updated);

  // Registro histórico en log volátil
  try {
    const history = (await getItem<any[]>(STORAGE_COMPLETED_RITUALS_KEY)) || [];
    history.unshift({
      plantId: _plantId,
      ritualType: _ritualType,
      timestamp: new Date().toISOString(),
    });
    await setItem(STORAGE_COMPLETED_RITUALS_KEY, history.slice(0, 100));
  } catch (_e) {}

  return updated;
}

/**
 * Genera el microcopy dinámico estilo Duolingo con tono botánico refinado
 */
export function getDuolingoSanctuaryMessage(
  plants: UserPlant[],
  streak: CareStreakData
): DuolingoMicrocopy {
  const urgentPlants = plants.filter(
    p => p.wateringStatus === 'necesita_riego' || p.daysUntilNextWatering <= 0
  );
  const attentionPlants = plants.filter(p => p.daysUntilNextWatering === 1);
  const repotPlants = plants.filter(p => p.needsRepotting);
  const cleaningPlants = plants.filter(p => p.needsCleaning);

  // Caso 1: Emergencia o riego muy urgente (Tier 3)
  if (urgentPlants.length > 0) {
    const target = urgentPlants[0];
    const name = target.nickname ? `«${target.nickname}»` : target.commonName;

    if (urgentPlants.length === 1) {
      return {
        title: '¡No dejes que se apague la racha!',
        message: `${name} en ${target.spaceName} ha consumido toda su reserva capilar. Un aporte de agua hoy evitará que sus hojas pierdan turgencia.`,
        urgency: 'urgente',
        actionLabel: 'Regar ahora',
        streakEmphasis: `Racha de ${streak.currentStreak} días en juego`,
      };
    }

    return {
      title: 'Tus raíces piden atención',
      message: `${urgentPlants.length} plantas de tu santuario están en sequedad capilar (${name} y otras). Es el momento de hidratar el sustrato.`,
      urgency: 'urgente',
      actionLabel: 'Comenzar ronda de riego',
      streakEmphasis: `Protege tu racha de ${streak.currentStreak} días`,
    };
  }

  // Caso 2: Atención temprana (Tier 2)
  if (attentionPlants.length > 0) {
    const target = attentionPlants[0];
    const name = target.nickname ? `«${target.nickname}»` : target.commonName;
    return {
      title: 'Mañana requerirán agua',
      message: `${name} tiene el sustrato al 25%. Prepárate para el riego matutino con agua reposada.`,
      urgency: 'atencion',
      actionLabel: 'Revisar sustrato',
      streakEmphasis: `Día ${streak.currentStreak} de santuario en equilibrio`,
    };
  }

  // Caso 3: Tareas de trasplante o higiene foliar
  if (repotPlants.length > 0) {
    const target = repotPlants[0];
    return {
      title: 'Tiempo de renovación',
      message: `El cepellón de ${target.commonName} pide espacio para colonizar nueva tierra. Un trasplante a una maceta +3cm estimulará su vigor.`,
      urgency: 'atencion',
      actionLabel: 'Planificar trasplante',
      streakEmphasis: `Racha viva: ${streak.currentStreak} días`,
    };
  }

  if (cleaningPlants.length > 0) {
    const target = cleaningPlants[0];
    return {
      title: 'Estomas listos para respirar',
      message: `El follaje de ${target.commonName} agradecerá una limpieza suave con paño húmedo para optimizar la fotosíntesis.`,
      urgency: 'optimo',
      actionLabel: 'Limpiar hojas',
      streakEmphasis: `Racha de ${streak.currentStreak} días`,
    };
  }

  // Caso 4: Santuario en pleno equilibrio (Tier 0)
  const sereneMessages = [
    `Tus plantas respiran en calma profunda. No hay riegos pendientes hoy; disfruta de la serenidad de tu santuario.`,
    `Humedad capilar óptima en todas tus especies. Tu constancia de ${streak.currentStreak} días se refleja en la vitalidad de las hojas.`,
    `El microclima de tu hogar está en armonía. Las raíces asimilan agua y nutrientes sin estrés hídrico.`,
  ];
  const pickedMsg = sereneMessages[streak.currentStreak % sereneMessages.length];

  return {
    title: 'Santuario en equilibrio',
    message: pickedMsg,
    urgency: 'optimo',
    actionLabel: 'Ver rituales de la semana',
    streakEmphasis: `${streak.currentStreak} días de cuidado ininterrumpido`,
  };
}

/**
 * Genera la lista integral de tareas de cuidado botánico a partir de las plantas del santuario
 */
export function generateBotanicalTasks(plants: UserPlant[]): BotanicalTask[] {
  const tasks: BotanicalTask[] = [];

  plants.forEach(plant => {
    // 1. Tarea de Riego
    const daysWater = plant.daysUntilNextWatering;
    if (plant.wateringStatus === 'necesita_riego' || daysWater <= 0) {
      tasks.push({
        id: `task_water_${plant.id}`,
        plantId: plant.id,
        plantName: plant.commonName,
        plantNickname: plant.nickname,
        plantImageUrl: plant.imageUrl,
        spaceName: plant.spaceName,
        type: 'riego',
        urgency: 'urgente',
        title: `Riego urgente: ${plant.nickname || plant.commonName}`,
        description: `Sustrato seco en ${plant.spaceName}. Hidrata abundantemente hasta drenar el 15%.`,
        actionText: 'Marcar regada',
        daysRemaining: 0,
      });
    } else if (daysWater <= 2) {
      tasks.push({
        id: `task_water_${plant.id}`,
        plantId: plant.id,
        plantName: plant.commonName,
        plantNickname: plant.nickname,
        plantImageUrl: plant.imageUrl,
        spaceName: plant.spaceName,
        type: 'riego',
        urgency: 'atencion',
        title: `Próximo riego: ${plant.nickname || plant.commonName}`,
        description: `Restan ${daysWater} ${daysWater === 1 ? 'día' : 'días'} para su ventana óptima de hidratación.`,
        actionText: 'Regar hoy',
        daysRemaining: daysWater,
      });
    }

    // 2. Tarea de Fertilización
    if (plant.needsFertilization) {
      tasks.push({
        id: `task_fert_${plant.id}`,
        plantId: plant.id,
        plantName: plant.commonName,
        plantNickname: plant.nickname,
        plantImageUrl: plant.imageUrl,
        spaceName: plant.spaceName,
        type: 'fertilizacion',
        urgency: 'atencion',
        title: `Nutrición mineral: ${plant.commonName}`,
        description:
          plant.fertilizationNote ||
          'Fase de crecimiento activo. Aplicar fertilizante equilibrado con microelementos a media dosis.',
        actionText: 'Fertilizar',
        daysRemaining: plant.daysUntilNextFertilization || 0,
      });
    }

    // 3. Tarea de Trasplante
    if (plant.needsRepotting) {
      tasks.push({
        id: `task_repot_${plant.id}`,
        plantId: plant.id,
        plantName: plant.commonName,
        plantNickname: plant.nickname,
        plantImageUrl: plant.imageUrl,
        spaceName: plant.spaceName,
        type: 'trasplante',
        urgency: 'atencion',
        title: `Renovación de maceta: ${plant.commonName}`,
        description:
          plant.repottingNote ||
          'Raíces asomando por la base. Trasladar a un recipiente ligeramente mayor con sustrato aireado.',
        actionText: 'Trasplantar',
        daysRemaining: 0,
      });
    }

    // 4. Limpieza foliar / Higiene de estomas
    if (plant.needsCleaning) {
      tasks.push({
        id: `task_clean_${plant.id}`,
        plantId: plant.id,
        plantName: plant.commonName,
        plantNickname: plant.nickname,
        plantImageUrl: plant.imageUrl,
        spaceName: plant.spaceName,
        type: 'limpieza_foliar',
        urgency: 'optimo',
        title: `Higiene de estomas: ${plant.commonName}`,
        description:
          plant.cleaningNote ||
          'Retirar partículas de polvo del haz foliar para maximizar la absorción de luz fotosintética.',
        actionText: 'Limpiar hojas',
        daysRemaining: plant.daysUntilNextCleaning || 0,
      });
    }
  });

  // Ordenar tareas: urgentes primero, luego atención, luego óptimas
  const urgencyWeight: Record<RitualUrgency, number> = {
    urgente: 0,
    atencion: 1,
    optimo: 2,
  };

  return tasks.sort((a, b) => {
    const diff = urgencyWeight[a.urgency] - urgencyWeight[b.urgency];
    if (diff !== 0) return diff;
    return a.daysRemaining - b.daysRemaining;
  });
}

/**
 * Ejecuta el ritual de riego en el modelo de datos
 */
export function applyWateringRitual(plant: UserPlant, intervalDays = 7): UserPlant {
  return {
    ...plant,
    wateringStatus: 'hidratada',
    daysUntilNextWatering: intervalDays,
    lastWateredDate: new Date().toISOString(),
  };
}

/**
 * Ejecuta el ritual de fertilización en el modelo de datos
 */
export function applyFertilizationRitual(plant: UserPlant, intervalDays = 21): UserPlant {
  return {
    ...plant,
    needsFertilization: false,
    daysUntilNextFertilization: intervalDays,
    lastFertilizedDate: new Date().toISOString(),
  };
}

/**
 * Ejecuta el ritual de trasplante en el modelo de datos
 */
export function applyRepottingRitual(plant: UserPlant): UserPlant {
  return {
    ...plant,
    needsRepotting: false,
    repottingNote: undefined,
  };
}

/**
 * Ejecuta la limpieza foliar en el modelo de datos
 */
export function applyFoliarCleaningRitual(plant: UserPlant, intervalDays = 28): UserPlant {
  return {
    ...plant,
    needsCleaning: false,
    daysUntilNextCleaning: intervalDays,
    lastCleanedDate: new Date().toISOString(),
  };
}

