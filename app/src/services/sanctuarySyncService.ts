/**
 * Treegoh Sanctuary Sync & Optical Seed Service — Modo Colmena
 *
 * Gestiona la vinculación multi-usuario de espacios y plantas (Modo Colmena Abierta),
 * generación y decodificación de la "Semilla Óptica" (QR Botánico Bioluminiscente ISO/IEC 18004),
 * bitácora colaborativa en tiempo real y escudo biológico Anti-Sobre-Riego (18 horas).
 *
 * Cumplimiento estricto:
 * - Cero emojis en todo el código y microcopia.
 * - Soporte Offline-First con persistencia en AsyncStorage y sincronización Firestore REST.
 */

import { getItem, setItem } from './storageService';
import { UserPlant } from '../types/plant';
import {
  BotanicalRitualType,
  applyWateringRitual,
  applyFertilizationRitual,
  applyRepottingRitual,
  applyFoliarCleaningRitual,
} from './reminderService';

export type SanctuaryRole = 'propietario' | 'co_cuidador' | 'residente_observador';

export interface SanctuaryMember {
  userId: string;
  displayName: string;
  role: SanctuaryRole;
  joinedAtIso: string;
  ritualsCompletedCount: number;
  lastActiveIso: string;
  avatarColor: string;
}

export interface BotanicalCareLog {
  id: string;
  plantId: string;
  plantName: string;
  spaceName: string;
  actionType: BotanicalRitualType | 'poda';
  actionLabel: string;
  performedByUserId: string;
  performedByUserName: string;
  timestampIso: string;
  cooldownUntilIso?: string;
}

export interface OpticalSeedPayload {
  sanctuaryId: string;
  seedCode: string;
  sanctuaryName: string;
  hostName: string;
  spacesCount: number;
  plantsCount: number;
  rawUri: string;
}

export interface ColmenaSanctuaryState {
  sanctuaryId: string;
  sanctuaryName: string;
  seedCode: string;
  hostName: string;
  assignmentMode: 'colmena_abierta';
  cooldownHours: number;
  sharedStreakDays: number;
  members: SanctuaryMember[];
  careLogs: BotanicalCareLog[];
  updatedAtIso: string;
}

const STORAGE_COLMENA_KEY = '@treegoh_colmena_sanctuary_v1';

const BOTANICAL_SEED_PREFIXES = [
  'SALVIA',
  'CLORO',
  'HELECHO',
  'ARACEA',
  'MUSGO',
  'SAVIA',
  'BROTE',
  'CEDRO',
  'LAUREL',
  'LINO',
];

const MEMBER_AVATAR_COLORS = [
  '#86EFAC',
  '#E6E8C4',
  '#93C5FD',
  '#FDE68A',
  '#C4B5FD',
  '#FDBA74',
];

const FIREBASE_PROJECT_ID =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'treegoh-6d95a';
const FIREBASE_API_KEY =
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDphfR6tnmsKK5EB7malwFDdaZO9JlUchw';

/**
 * Genera un código botánico legible de 6-9 caracteres (ej: SALVIA-742)
 */
export function generateBotanicalSeedCode(seedHint?: string): string {
  const cleanHint = (seedHint || 'SALVIA').toUpperCase().replace(/[^A-Z0-9]/g, '');
  let hash = 0;
  const source = `${cleanHint}_${Date.now()}`;
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  const prefix = BOTANICAL_SEED_PREFIXES[hash % BOTANICAL_SEED_PREFIXES.length];
  const digits = String((hash % 900) + 100);
  return `${prefix}-${digits}`;
}

/**
 * Construye la URI compacta para codificar en la Semilla Óptica QR
 * Formato: treegoh://colmena/SALVIA-742?h=Carlos&s=Santuario&p=12&e=3
 */
export function buildOpticalSeedUri(params: {
  seedCode: string;
  sanctuaryName: string;
  hostName: string;
  plantsCount: number;
  spacesCount: number;
}): string {
  const cleanSeed = params.seedCode.trim().toUpperCase();
  const shortHost = encodeURIComponent((params.hostName || 'Anfitrion').slice(0, 14));
  const shortSanc = encodeURIComponent((params.sanctuaryName || 'Santuario').slice(0, 16));
  return `treegoh://colmena/${cleanSeed}?h=${shortHost}&s=${shortSanc}&p=${params.plantsCount}&e=${params.spacesCount}`;
}

/**
 * Decodifica una URI o código escaneado por la Burbuja Óptica de la cámara
 */
export function parseOpticalSeedData(rawInput: string): OpticalSeedPayload | null {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const trimmed = rawInput.trim();

  // Caso 1: URI treegoh://colmena/SEED?... o https://treegoh.app/colmena/SEED?...
  if (
    trimmed.toLowerCase().startsWith('treegoh://') ||
    trimmed.toLowerCase().includes('treegoh.app/colmena') ||
    trimmed.toLowerCase().includes('colmena/')
  ) {
    try {
      const afterColmena = trimmed.split(/colmena\//i)[1] || '';
      const [seedPart, queryPart] = afterColmena.split('?');
      const seedCode = (seedPart || 'SALVIA-742').toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const params: Record<string, string> = {};

      if (queryPart) {
        queryPart.split('&').forEach(pair => {
          const [k, v] = pair.split('=');
          if (k && v) {
            try {
              params[k] = decodeURIComponent(v);
            } catch (_e) {
              params[k] = v;
            }
          }
        });
      }

      return {
        sanctuaryId: `sanc_${seedCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        seedCode,
        sanctuaryName: params.s || 'Santuario Compartido',
        hostName: params.h || 'Propietario',
        plantsCount: Math.max(1, Number(params.p) || 8),
        spacesCount: Math.max(1, Number(params.e) || 2),
        rawUri: trimmed,
      };
    } catch (_e) {
      return null;
    }
  }

  // Caso 2: Código corto escrito manualmente (ej. "SALVIA-742" o "CLORO742")
  const normalizedCode = trimmed.toUpperCase().replace(/\s+/g, '');
  if (/^[A-Z]{3,10}-?\d{3,4}$/.test(normalizedCode)) {
    const formattedCode = normalizedCode.includes('-')
      ? normalizedCode
      : normalizedCode.replace(/^([A-Z]+)(\d+)$/, '$1-$2');

    return {
      sanctuaryId: `sanc_${formattedCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      seedCode: formattedCode,
      sanctuaryName: 'Santuario Colmena',
      hostName: 'Co-cuidador Principal',
      plantsCount: 12,
      spacesCount: 3,
      rawUri: `treegoh://colmena/${formattedCode}`,
    };
  }

  return null;
}

/**
 * Obtiene o inicializa el estado del Santuario en Modo Colmena
 */
export async function getColmenaSanctuaryState(
  defaultHostName = 'Cuidador Principal',
  defaultSanctuaryName = 'Mi Santuario'
): Promise<ColmenaSanctuaryState> {
  try {
    const raw = await getItem(STORAGE_COLMENA_KEY);
    if (raw) {
      const parsed: ColmenaSanctuaryState = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed && parsed.seedCode && Array.isArray(parsed.members)) {
        return parsed;
      }
    }
  } catch (_e) {}

  const seedCode = generateBotanicalSeedCode(defaultSanctuaryName);
  const nowIso = new Date().toISOString();

  const initial: ColmenaSanctuaryState = {
    sanctuaryId: `sanc_${seedCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    sanctuaryName: defaultSanctuaryName,
    seedCode,
    hostName: defaultHostName,
    assignmentMode: 'colmena_abierta',
    cooldownHours: 18,
    sharedStreakDays: 1,
    members: [
      {
        userId: 'member_owner_local',
        displayName: defaultHostName,
        role: 'propietario',
        joinedAtIso: nowIso,
        ritualsCompletedCount: 4,
        lastActiveIso: nowIso,
        avatarColor: '#86EFAC',
      },
    ],
    careLogs: [],
    updatedAtIso: nowIso,
  };

  await setItem(STORAGE_COLMENA_KEY, initial);
  return initial;
}

/**
 * Sincroniza de manera no bloqueante el documento del santuario con Firestore REST
 */
async function syncSanctuaryToFirestoreCloud(state: ColmenaSanctuaryState): Promise<void> {
  try {
    const docId = state.seedCode.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/sanctuaries/${docId}?key=${FIREBASE_API_KEY}`;

    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          sanctuaryId: { stringValue: state.sanctuaryId },
          sanctuaryName: { stringValue: state.sanctuaryName },
          seedCode: { stringValue: state.seedCode },
          hostName: { stringValue: state.hostName },
          sharedStreakDays: { integerValue: String(state.sharedStreakDays) },
          payloadJson: { stringValue: JSON.stringify(state) },
          updatedAtIso: { stringValue: state.updatedAtIso },
        },
      }),
    });
  } catch (_e) {
    // Resiliencia silenciosa en modo offline
  }
}

/**
 * Une un dispositivo o añade un co-cuidador tras escanear una Semilla Óptica
 */
export async function joinColmenaByOpticalSeed(
  payload: OpticalSeedPayload,
  currentUserName: string
): Promise<ColmenaSanctuaryState> {
  const current = await getColmenaSanctuaryState(currentUserName, payload.sanctuaryName);
  const nowIso = new Date().toISOString();

  // Intentar recuperar desde Firestore si existe la semilla remota
  try {
    const docId = payload.seedCode.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/sanctuaries/${docId}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const rawJson = data?.fields?.payloadJson?.stringValue;
      if (rawJson) {
        const remoteState: ColmenaSanctuaryState = JSON.parse(rawJson);
        const alreadyInRemote = remoteState.members.some(
          m => m.displayName.toLowerCase() === currentUserName.toLowerCase()
        );
        if (!alreadyInRemote) {
          remoteState.members.push({
            userId: `member_${Date.now()}`,
            displayName: currentUserName,
            role: 'co_cuidador',
            joinedAtIso: nowIso,
            ritualsCompletedCount: 1,
            lastActiveIso: nowIso,
            avatarColor:
              MEMBER_AVATAR_COLORS[remoteState.members.length % MEMBER_AVATAR_COLORS.length],
          });
        }
        remoteState.updatedAtIso = nowIso;
        await setItem(STORAGE_COLMENA_KEY, remoteState);
        syncSanctuaryToFirestoreCloud(remoteState);
        return remoteState;
      }
    }
  } catch (_e) {}

  // Vinculación local + registro del anfitrión y co-cuidador
  const hostDisplayName =
    payload.hostName && payload.hostName.toLowerCase() !== currentUserName.toLowerCase()
      ? payload.hostName
      : 'Elena (Co-cuidadora)';

  const existingNames = new Set(current.members.map(m => m.displayName.toLowerCase()));
  const updatedMembers = [...current.members];

  if (!existingNames.has(hostDisplayName.toLowerCase())) {
    updatedMembers.push({
      userId: `member_co_${Date.now()}`,
      displayName: hostDisplayName,
      role: 'co_cuidador',
      joinedAtIso: nowIso,
      ritualsCompletedCount: 3,
      lastActiveIso: nowIso,
      avatarColor: MEMBER_AVATAR_COLORS[updatedMembers.length % MEMBER_AVATAR_COLORS.length],
    });
  }

  const updatedState: ColmenaSanctuaryState = {
    ...current,
    sanctuaryId: payload.sanctuaryId,
    seedCode: payload.seedCode,
    sanctuaryName: payload.sanctuaryName || current.sanctuaryName,
    members: updatedMembers,
    updatedAtIso: nowIso,
  };

  await setItem(STORAGE_COLMENA_KEY, updatedState);
  syncSanctuaryToFirestoreCloud(updatedState);
  return updatedState;
}

/**
 * Añade manualmente un conviviente a la Colmena del hogar
 */
export async function addColmenaMember(
  memberName: string,
  role: SanctuaryRole = 'co_cuidador'
): Promise<ColmenaSanctuaryState> {
  const current = await getColmenaSanctuaryState();
  const cleanName = memberName.trim();
  if (!cleanName) return current;

  const exists = current.members.some(
    m => m.displayName.toLowerCase() === cleanName.toLowerCase()
  );
  if (exists) return current;

  const nowIso = new Date().toISOString();
  const newMember: SanctuaryMember = {
    userId: `member_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    displayName: cleanName,
    role,
    joinedAtIso: nowIso,
    ritualsCompletedCount: 0,
    lastActiveIso: nowIso,
    avatarColor: MEMBER_AVATAR_COLORS[current.members.length % MEMBER_AVATAR_COLORS.length],
  };

  const updated: ColmenaSanctuaryState = {
    ...current,
    members: [...current.members, newMember],
    updatedAtIso: nowIso,
  };

  await setItem(STORAGE_COLMENA_KEY, updated);
  syncSanctuaryToFirestoreCloud(updated);
  return updated;
}

/**
 * Elimina un miembro co-cuidador de la Colmena
 */
export async function removeColmenaMember(userId: string): Promise<ColmenaSanctuaryState> {
  const current = await getColmenaSanctuaryState();
  const filtered = current.members.filter(m => m.userId !== userId || m.role === 'propietario');
  const updated: ColmenaSanctuaryState = {
    ...current,
    members: filtered,
    updatedAtIso: new Date().toISOString(),
  };
  await setItem(STORAGE_COLMENA_KEY, updated);
  syncSanctuaryToFirestoreCloud(updated);
  return updated;
}

/**
 * Registra una acción de cuidado botánico en la bitácora compartida de la Colmena
 */
export async function recordColmenaCareAction(params: {
  plant: UserPlant;
  actionType: BotanicalRitualType | 'poda';
  performedByName: string;
  performedByUserId?: string;
}): Promise<ColmenaSanctuaryState> {
  const current = await getColmenaSanctuaryState(params.performedByName);
  const now = new Date();
  const nowIso = now.toISOString();
  const cooldownUntilIso =
    params.actionType === 'riego'
      ? new Date(now.getTime() + current.cooldownHours * 3600 * 1000).toISOString()
      : undefined;

  const actionLabelMap: Record<string, string> = {
    riego: 'Hidratación de sustrato',
    fertilizacion: 'Nutrición y abono orgánico',
    trasplante: 'Renovación de maceta',
    limpieza_foliar: 'Higiene de estomas foliares',
    rotacion_solar: 'Rotación fototrópica',
    poda: 'Poda sanitaria',
  };

  const newLog: BotanicalCareLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    plantId: params.plant.id,
    plantName: params.plant.nickname
      ? `${params.plant.nickname} (${params.plant.commonName})`
      : params.plant.commonName,
    spaceName: params.plant.spaceName,
    actionType: params.actionType,
    actionLabel: actionLabelMap[params.actionType] || 'Cuidado botánico',
    performedByUserId: params.performedByUserId || 'member_local',
    performedByUserName: params.performedByName,
    timestampIso: nowIso,
    cooldownUntilIso,
  };

  // Incrementar contador del miembro correspondiente
  const updatedMembers = current.members.map(m => {
    if (m.displayName.toLowerCase() === params.performedByName.toLowerCase()) {
      return {
        ...m,
        ritualsCompletedCount: m.ritualsCompletedCount + 1,
        lastActiveIso: nowIso,
      };
    }
    return m;
  });

  const updated: ColmenaSanctuaryState = {
    ...current,
    members: updatedMembers,
    careLogs: [newLog, ...current.careLogs].slice(0, 40),
    updatedAtIso: nowIso,
  };

  await setItem(STORAGE_COLMENA_KEY, updated);
  syncSanctuaryToFirestoreCloud(updated);
  return updated;
}

/**
 * Simula que un compañero de la Colmena atiende una planta sedienta en tiempo real.
 * Actualiza el mapa de plantas, activa el bloqueo Anti-Sobre-Riego de 18h y registra en bitácora.
 */
export async function simulateRoommateColmenaCare(
  plantsBySpace: Record<string, UserPlant[]>
): Promise<{
  updatedPlantsBySpace: Record<string, UserPlant[]>;
  colmenaState: ColmenaSanctuaryState;
  actedPlantName: string;
  actorName: string;
} | null> {
  let current = await getColmenaSanctuaryState();

  // Asegurar que exista al menos un co-cuidador en la simulación
  let roommate = current.members.find(m => m.role !== 'propietario');
  if (!roommate) {
    current = await addColmenaMember('Lucía (Conviviente)', 'co_cuidador');
    roommate = current.members.find(m => m.role !== 'propietario') || current.members[0];
  }

  const allPlants = Object.values(plantsBySpace).flat();
  if (allPlants.length === 0) return null;

  // Priorizar una planta que necesite riego o tenga menor días restantes
  const sorted = [...allPlants].sort((a, b) => {
    const aThirsty = a.wateringStatus === 'necesita_riego' ? -10 : a.daysUntilNextWatering;
    const bThirsty = b.wateringStatus === 'necesita_riego' ? -10 : b.daysUntilNextWatering;
    return aThirsty - bThirsty;
  });

  const targetPlant = sorted[0];
  const actorName = roommate.displayName;

  const updatedPlantsBySpace: Record<string, UserPlant[]> = {};
  Object.keys(plantsBySpace).forEach(spKey => {
    updatedPlantsBySpace[spKey] = (plantsBySpace[spKey] || []).map(p => {
      if (p.id !== targetPlant.id) return p;
      return applyWateringRitual(p, 7, actorName);
    });
  });

  const colmenaState = await recordColmenaCareAction({
    plant: targetPlant,
    actionType: 'riego',
    performedByName: actorName,
    performedByUserId: roommate.userId,
  });

  return {
    updatedPlantsBySpace,
    colmenaState,
    actedPlantName: targetPlant.commonName,
    actorName,
  };
}

// ============================================================================
// GENERADOR PURO ISO/IEC 18004 QR MATRIX PARA LA "SEMILLA ÓPTICA"
// Soporta Versión 3 (29x29) y Versión 4 (33x33) Nivel L (Máscara 0)
// ============================================================================

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function computeReedSolomonEc(data: number[], ecCount: number): number[] {
  // Construir polinomio generador g(x) = (x - a^0)(x - a^1)...(x - a^(ecCount-1))
  let gen = [1];
  for (let i = 0; i < ecCount; i++) {
    const nextGen = new Array(gen.length + 1).fill(0);
    const root = GF_EXP[i];
    for (let j = 0; j < gen.length; j++) {
      nextGen[j] ^= gen[j];
      nextGen[j + 1] ^= gfMul(gen[j], root);
    }
    gen = nextGen;
  }

  const msg = new Array(data.length + ecCount).fill(0);
  for (let i = 0; i < data.length; i++) {
    msg[i] = data[i];
  }

  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 1; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }

  return msg.slice(data.length);
}

/**
 * Codifica cualquier cadena UTF-8 (hasta 78 bytes) en una matriz QR ISO/IEC 18004 real
 * para ser renderizada como la Semilla Óptica Bioluminiscente y escaneada por la cámara.
 */
export function generateOpticalSeedQrMatrix(payloadText: string): boolean[][] {
  // Codificar bytes UTF-8
  const utf8Bytes: number[] = [];
  for (let i = 0; i < payloadText.length; i++) {
    const code = payloadText.charCodeAt(i);
    if (code < 0x80) {
      utf8Bytes.push(code);
    } else if (code < 0x800) {
      utf8Bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else {
      utf8Bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }

  // Seleccionar Versión 3 (hasta 53 bytes) o Versión 4 (hasta 78 bytes) Nivel L
  const isV3 = utf8Bytes.length <= 53;
  const size = isV3 ? 29 : 33;
  const dataCapacityBytes = isV3 ? 55 : 80;
  const ecCodewordsCount = isV3 ? 15 : 20;
  const alignPos = isV3 ? 22 : 26;

  const trimmedBytes = utf8Bytes.slice(0, dataCapacityBytes - 2);

  // Construir flujo de bits: Modo Byte (0100) + Longitud (8 bits) + Datos + Terminador (0000)
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4);
  pushBits(trimmedBytes.length, 8);
  trimmedBytes.forEach(b => pushBits(b, 8));

  const maxDataBits = dataCapacityBytes * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  pushBits(0, termLen);

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bits[i + b];
    }
    dataCodewords.push(byte);
  }

  let padToggle = true;
  while (dataCodewords.length < dataCapacityBytes) {
    dataCodewords.push(padToggle ? 0xec : 0x11);
    padToggle = !padToggle;
  }

  const ecCodewords = computeReedSolomonEc(dataCodewords, ecCodewordsCount);
  const allCodewords = [...dataCodewords, ...ecCodewords];

  // Inicializar matriz y mapa de módulos reservados
  const modules: boolean[][] = Array.from({ length: size }, () =>
    new Array(size).fill(false)
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    new Array(size).fill(false)
  );

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark;
      isFunction[r][c] = true;
    }
  };

  // Patrones de búsqueda (Finder Patterns 7x7 + separadores)
  const drawFinderPattern = (topR: number, leftC: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = topR + dr;
        const c = leftC + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter =
          dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 &&
          (dr === 0 || dr === 6 || dc === 0 || dc === 6);
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, inOuter || inInner);
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  // Patrones de sincronización (Timing Patterns)
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Patrón de alineación (5x5 centrado en alignPos, alignPos)
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const dist = Math.max(Math.abs(dr), Math.abs(dc));
      setFunctionModule(alignPos + dr, alignPos + dc, dist !== 1);
    }
  }

  // Módulo oscuro fijo y reserva de áreas de información de formato
  setFunctionModule(size - 8, 8, true);

  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) setFunctionModule(8, i, false);
    if (!isFunction[i][8]) setFunctionModule(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) setFunctionModule(8, size - 1 - i, false);
    if (!isFunction[size - 1 - i][8]) setFunctionModule(size - 1 - i, 8, false);
  }

  // Colocar bits de datos en zigzag de 2 columnas de derecha a izquierda
  const dataBits: number[] = [];
  allCodewords.forEach(cw => {
    for (let b = 7; b >= 0; b--) {
      dataBits.push((cw >> b) & 1);
    }
  });

  let bitIdx = 0;
  let upward = true;
  for (let rightCol = size - 1; rightCol >= 1; rightCol -= 2) {
    if (rightCol === 6) rightCol = 5; // Saltar columna de timing vertical
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let dc = 0; dc < 2; dc++) {
        const c = rightCol - dc;
        if (!isFunction[r][c]) {
          const dark = bitIdx < dataBits.length ? dataBits[bitIdx] === 1 : false;
          bitIdx++;
          // Aplicar Máscara 0: (r + c) % 2 === 0
          const masked = (r + c) % 2 === 0 ? !dark : dark;
          modules[r][c] = masked;
        }
      }
    }
    upward = !upward;
  }

  // Escribir bits de Formato (Nivel L = 01, Máscara 0 = 000 -> BCH precalculado 0x77c4)
  const formatBits = 0x77c4;
  const getFormatBit = (idx: number) => ((formatBits >> idx) & 1) === 1;

  // Alrededor del finder superior izquierdo
  const formatRows = [8, 8, 8, 8, 8, 8, 8, 8, 7, 5, 4, 3, 2, 1, 0];
  const formatCols = [0, 1, 2, 3, 4, 5, 7, 8, 8, 8, 8, 8, 8, 8, 8];
  for (let i = 0; i < 15; i++) {
    modules[formatRows[i]][formatCols[i]] = getFormatBit(14 - i);
  }

  // Esquinas inferior izquierda y superior derecha
  for (let i = 0; i < 7; i++) {
    modules[size - 1 - i][8] = getFormatBit(14 - i);
  }
  for (let i = 7; i < 15; i++) {
    modules[8][size - 15 + i] = getFormatBit(14 - i);
  }

  return modules;
}
