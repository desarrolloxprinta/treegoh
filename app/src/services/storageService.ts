/**
 * Treegoh Local Storage Service
 * Abstracción de persistencia local segura para Expo Go y React Native.
 * Almacena el estado completo del onboarding, perfil del usuario y colección de plantas.
 * Diseñado con fallback seguro para que la app nunca crashee si la librería está en proceso de instalación.
 */

import { OnboardingState } from '../types/onboarding';
import { UserProfileDocument } from './userService';

const STORAGE_KEYS = {
  ONBOARDING_STATE: '@treegoh_onboarding_state_v1',
  USER_PROFILE: '@treegoh_user_profile_v1',
  IS_ONBOARDING_DONE: '@treegoh_is_onboarding_done_v1',
  LAST_LOGIN_TIMESTAMP: '@treegoh_last_login_v1',
};

// Intento dinámico de carga de AsyncStorage
let asyncStorageModule: any = null;

function getAsyncStorage(): any {
  if (asyncStorageModule) return asyncStorageModule;
  try {
    const mod = require('@react-native-async-storage/async-storage');
    asyncStorageModule = mod.default || mod;
    return asyncStorageModule;
  } catch (_e) {
    // Si no está instalado aún en node_modules
    return null;
  }
}

// Memoria volátil de respaldo en caso de que AsyncStorage no esté presente
const memoryFallback = new Map<string, string>();

/**
 * Guarda un valor en almacenamiento persistente asegurando serialización a string
 */
export async function setItem(key: string, value: any): Promise<boolean> {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  const storage = getAsyncStorage();
  if (storage && typeof storage.setItem === 'function') {
    try {
      await storage.setItem(key, stringValue);
      return true;
    } catch (e) {
      console.warn('[TreegohStorage] Error escribiendo en AsyncStorage:', e);
    }
  }
  memoryFallback.set(key, stringValue);
  return true;
}

/**
 * Obtiene un valor de almacenamiento persistente con deserialización automática
 */
export async function getItem<T = any>(key: string): Promise<T | null> {
  const storage = getAsyncStorage();
  let raw: string | null = null;
  if (storage && typeof storage.getItem === 'function') {
    try {
      raw = await storage.getItem(key);
    } catch (e) {
      console.warn('[TreegohStorage] Error leyendo de AsyncStorage:', e);
    }
  }
  if (raw === null) {
    raw = memoryFallback.get(key) || null;
  }
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

/**
 * Elimina una clave de almacenamiento
 */
export async function removeItem(key: string): Promise<boolean> {
  const storage = getAsyncStorage();
  if (storage && typeof storage.removeItem === 'function') {
    try {
      await storage.removeItem(key);
    } catch (e) {
      console.warn('[TreegohStorage] Error borrando en AsyncStorage:', e);
    }
  }
  memoryFallback.delete(key);
  return true;
}

/**
 * Guarda la sesión completa del usuario tras el onboarding o inicio de sesión
 */
export async function persistUserSession(
  onboardingData: OnboardingState,
  profile?: UserProfileDocument
): Promise<boolean> {
  try {
    await setItem(STORAGE_KEYS.ONBOARDING_STATE, JSON.stringify(onboardingData));
    await setItem(STORAGE_KEYS.IS_ONBOARDING_DONE, 'true');
    await setItem(STORAGE_KEYS.LAST_LOGIN_TIMESTAMP, new Date().toISOString());

    if (profile) {
      await setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } else if (onboardingData.account) {
      await setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(onboardingData.account));
    }
    return true;
  } catch (err) {
    console.error('[TreegohStorage] Error al persistir sesión de usuario:', err);
    return false;
  }
}

/**
 * Carga la sesión guardada del usuario al iniciar la app
 */
export async function loadPersistedUserSession(): Promise<{
  isOnboardingDone: boolean;
  onboardingData: OnboardingState | null;
  userProfile: UserProfileDocument | null;
}> {
  try {
    const isDoneVal = await getItem<any>(STORAGE_KEYS.IS_ONBOARDING_DONE);
    const dataVal = await getItem<any>(STORAGE_KEYS.ONBOARDING_STATE);
    const profileVal = await getItem<any>(STORAGE_KEYS.USER_PROFILE);

    const isOnboardingDone = (isDoneVal === true || isDoneVal === 'true') && !!dataVal;
    let onboardingData: OnboardingState | null = null;
    if (dataVal && typeof dataVal === 'object') {
      onboardingData = dataVal as OnboardingState;
    } else if (typeof dataVal === 'string') {
      try {
        onboardingData = JSON.parse(dataVal) as OnboardingState;
      } catch {
        onboardingData = null;
      }
    }

    let userProfile: UserProfileDocument | null = null;
    if (profileVal && typeof profileVal === 'object') {
      userProfile = profileVal as UserProfileDocument;
    } else if (typeof profileVal === 'string') {
      try {
        userProfile = JSON.parse(profileVal) as UserProfileDocument;
      } catch {
        userProfile = null;
      }
    }

    return {
      isOnboardingDone,
      onboardingData,
      userProfile,
    };
  } catch (err) {
    console.warn('[TreegohStorage] Error cargando sesión persistente:', err);
    return {
      isOnboardingDone: false,
      onboardingData: null,
      userProfile: null,
    };
  }
}

/**
 * Limpia la sesión local (logout o reseteo de onboarding)
 */
export async function clearUserSession(): Promise<void> {
  await removeItem(STORAGE_KEYS.ONBOARDING_STATE);
  await removeItem(STORAGE_KEYS.USER_PROFILE);
  await removeItem(STORAGE_KEYS.IS_ONBOARDING_DONE);
  await removeItem(STORAGE_KEYS.LAST_LOGIN_TIMESTAMP);
}

