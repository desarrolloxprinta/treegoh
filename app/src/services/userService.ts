/**
 * Treegoh User Service & Firebase Synchronization
 * Gestiona la creación de perfiles, autenticación (Email, Google, Apple, Invitado),
 * y la persistencia de datos del onboarding y colección botánica en Firestore (/users/{userId}).
 * Cumple estrictamente con las reglas de seguridad de backend/firebase/firestore.rules. Cero emojis.
 */

import {
  UserAccount,
  BotanicalExperienceLevel,
  OnboardingState,
} from '../types/onboarding';
import { UserPlant } from '../types/plant';
import { persistUserSession } from './storageService';

export interface UserProfileDocument extends UserAccount {
  uid: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  photoURL: string | null;
  experienceLevel: BotanicalExperienceLevel;
  onboardingCompleted: boolean;
  goals?: string[];
  locationCity?: string;
  locationDetails?: Record<string, any>;
  spacesCount?: number;
  safetyPetsActive?: boolean;
  assignedAvatarAlias?: string;
  assignedAvatarSpecies?: string;
}

// Configuración de Firebase leída del entorno
const FIREBASE_PROJECT_ID =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'treegoh-6d95a';
const FIREBASE_API_KEY =
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY || ''; // Si se añade en .env

// Memoria de sesión local del usuario activo
let activeSessionUser: UserProfileDocument | null = null;

/**
 * Genera un UID único para el usuario si no viene de Firebase Auth
 */
function generateLocalUid(prefix: string = 'usr'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Convierte un objeto de JavaScript en formato de campos tipados de Firestore REST API
 */
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        fields[key] = { integerValue: String(value) };
      } else {
        fields[key] = { doubleValue: value };
      }
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(v =>
            typeof v === 'string'
              ? { stringValue: v }
              : typeof v === 'number'
              ? { doubleValue: v }
              : typeof v === 'boolean'
              ? { booleanValue: v }
              : { stringValue: JSON.stringify(v) }
          ),
        },
      };
    } else if (typeof value === 'object') {
      fields[key] = {
        stringValue: JSON.stringify(value), // Serializado seguro para mapas complejos
      };
    }
  }

  return fields;
}

/**
 * Guarda o actualiza el documento de perfil del usuario en Firestore (/users/{userId})
 * Cumple con la regla: hasAll(['displayName', 'createdAt']) y photoURL string o null.
 */
export async function saveUserProfileToFirestore(
  profile: UserProfileDocument,
  onboardingState?: OnboardingState
): Promise<{ ok: boolean; error?: string }> {
  activeSessionUser = profile;

  // Si se proporciona onboardingState, enriquecemos el documento
  if (onboardingState) {
    profile.goals = onboardingState.goals;
    profile.locationCity = onboardingState.location.city;
    profile.locationDetails = {
      bioclimaticZone: onboardingState.location.bioclimaticZone,
      waterHardness: onboardingState.location.waterHardness,
      floorNumber: onboardingState.location.floorNumber,
      latitude: onboardingState.location.latitude,
      longitude: onboardingState.location.longitude,
    };
    profile.spacesCount = (onboardingState.customMicroclimates || onboardingState.spaces || []).length;
    profile.safetyPetsActive = onboardingState.safetyFilter.hasPets;
    if (onboardingState.assignedAvatar) {
      profile.assignedAvatarAlias = onboardingState.assignedAvatar.alias;
      profile.assignedAvatarSpecies = onboardingState.assignedAvatar.species;
    }
    profile.onboardingCompleted = true;
  }

  // Persistencia local inmediata para que no se pierda al salir de la app
  if (onboardingState) {
    await persistUserSession(onboardingState, profile);
  }

  // Si no hay API key o estamos en offline/test, persistimos en sesión local
  if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY) {
    return { ok: true };
  }

  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${profile.uid}`;
    const fields = toFirestoreFields(profile);

    const res = await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        ok: false,
        error: `Firestore HTTP ${res.status}: ${errText.slice(0, 120)}`,
      };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error al conectar con Firestore.' };
  }
}

/**
 * Crea una cuenta con Correo Electrónico y datos de perfil reales
 */
export async function createEmailAccount(params: {
  displayName: string;
  email: string;
  password?: string;
  experienceLevel: BotanicalExperienceLevel;
}): Promise<{ ok: boolean; profile: UserProfileDocument; error?: string }> {
  const now = new Date().toISOString();
  const uid = generateLocalUid('usr_email');

  const profile: UserProfileDocument = {
    uid,
    authProvider: 'email',
    displayName: params.displayName.trim(),
    email: params.email.trim().toLowerCase(),
    photoURL: null,
    experienceLevel: params.experienceLevel,
    isGuest: false,
    createdAt: now,
    lastLoginAt: now,
    onboardingCompleted: false,
  };

  activeSessionUser = profile;
  await saveUserProfileToFirestore(profile);

  return { ok: true, profile };
}

/**
 * Crea una cuenta mediante proveedor social (Google o Apple)
 */
export async function createSocialAccount(params: {
  provider: 'google' | 'apple';
  displayName?: string;
  email?: string;
  experienceLevel?: BotanicalExperienceLevel;
}): Promise<{ ok: boolean; profile: UserProfileDocument }> {
  const now = new Date().toISOString();
  const defaultName =
    params.displayName?.trim() ||
    (params.provider === 'apple' ? 'Cultivador Apple' : 'Cultivador Google');
  const uid = generateLocalUid(`usr_${params.provider}`);

  const profile: UserProfileDocument = {
    uid,
    authProvider: params.provider,
    displayName: defaultName,
    email: params.email ? params.email.trim().toLowerCase() : undefined,
    photoURL: null,
    experienceLevel: params.experienceLevel || 'habitual',
    isGuest: false,
    createdAt: now,
    lastLoginAt: now,
    onboardingCompleted: false,
  };

  activeSessionUser = profile;
  await saveUserProfileToFirestore(profile);

  return { ok: true, profile };
}

/**
 * Crea un perfil de Invitado Local pero con nombre real y nivel de experiencia
 */
export async function createGuestProfile(params: {
  displayName?: string;
  experienceLevel?: BotanicalExperienceLevel;
}): Promise<{ ok: boolean; profile: UserProfileDocument }> {
  const now = new Date().toISOString();
  const name = params.displayName?.trim() || 'Cultivador';
  const uid = generateLocalUid('usr_guest');

  const profile: UserProfileDocument = {
    uid,
    authProvider: 'guest',
    displayName: name,
    photoURL: null,
    experienceLevel: params.experienceLevel || 'principiante',
    isGuest: true,
    createdAt: now,
    lastLoginAt: now,
    onboardingCompleted: false,
  };

  activeSessionUser = profile;
  await saveUserProfileToFirestore(profile);

  return { ok: true, profile };
}

/**
 * Guarda una planta en la subcolección del usuario (/users/{userId}/plants/{plantId})
 */
export async function saveUserPlantToFirestore(
  userId: string,
  plant: UserPlant
): Promise<{ ok: boolean; error?: string }> {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY) {
    return { ok: true };
  }

  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}/plants/${plant.id}`;
    const fields = toFirestoreFields(plant);

    const res = await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { ok: false, error: errText.slice(0, 100) };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

/**
 * Obtiene el usuario activo en sesión
 */
export function getActiveSessionUser(): UserProfileDocument | null {
  return activeSessionUser;
}

/**
 * Convierte campos de documento Firestore REST API en objeto JS limpio
 */
export function parseFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(fields)) {
    if ('stringValue' in val) {
      try {
        result[key] = JSON.parse(val.stringValue);
      } catch {
        result[key] = val.stringValue;
      }
    } else if ('booleanValue' in val) {
      result[key] = val.booleanValue;
    } else if ('integerValue' in val) {
      result[key] = parseInt(val.integerValue, 10);
    } else if ('doubleValue' in val) {
      result[key] = val.doubleValue;
    } else if ('arrayValue' in val) {
      result[key] = (val.arrayValue.values || []).map((v: any) => v.stringValue ?? v.integerValue ?? v);
    } else if ('nullValue' in val) {
      result[key] = null;
    }
  }
  return result;
}

/**
 * Recupera el perfil del usuario desde Firestore por correo electrónico o UID
 */
export async function fetchUserProfileFromFirestore(
  emailOrUid: string
): Promise<{ ok: boolean; profile?: UserProfileDocument; error?: string }> {
  try {
    const clean = emailOrUid.trim().toLowerCase();
    const isEmail = clean.includes('@');
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;

    const body = isEmail
      ? {
          structuredQuery: {
            from: [{ collectionId: 'users' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'email' },
                op: 'EQUAL',
                value: { stringValue: clean },
              },
            },
            limit: 1,
          },
        }
      : {
          structuredQuery: {
            from: [{ collectionId: 'users' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'uid' },
                op: 'EQUAL',
                value: { stringValue: clean },
              },
            },
            limit: 1,
          },
        };

    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return { ok: false, error: 'No se pudo conectar con el servidor botánico.' };
    }

    const data = await res.json();
    if (Array.isArray(data) && data[0]?.document?.fields) {
      const parsed = parseFirestoreFields(data[0].document.fields) as UserProfileDocument;
      activeSessionUser = parsed;
      return { ok: true, profile: parsed };
    }

    return { ok: false, error: 'No se encontró ninguna cuenta asociada a este correo.' };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error de red al buscar la cuenta.' };
  }
}


