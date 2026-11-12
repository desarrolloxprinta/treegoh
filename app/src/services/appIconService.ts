/**
 * Dynamic App Icon & Favicon Service — Treegoh Sanctuary Engine
 * 
 * Gestiona el cambio dinámico del icono de la aplicación (iOS Alternate Icons)
 * y del favicon en la versión Web según el estado fisiológico de las plantas del santuario.
 * 
 * Estados de Icono:
 * - 'default': Santuario en equilibrio estándar (#E6E8C4 verde salvia / pistacho).
 * - 'thirsty': Sed / Alerta de riego (tono cálido ámbar/terracota con indicación de turgencia).
 * - 'blooming': Santuario en plenitud / racha alta (aura botánica esmeralda resplandeciente).
 */

import { Platform, NativeModules } from 'react-native';
import { getItem, setItem } from './storageService';
import { UserPlant } from '../types/plant';

export type AppIconState = 'default' | 'thirsty' | 'blooming';

const STORAGE_APP_ICON_KEY = '@treegoh_current_app_icon_v1';

/**
 * Evalúa el icono que le corresponde a la app según el estado del santuario
 */
export function evaluateSanctuaryAppIcon(plants: UserPlant[], streakDays = 0): AppIconState {
  if (!plants || plants.length === 0) return 'default';

  // Si hay alguna planta con necesidad urgente de riego o días <= 0 -> Sedienta
  const isThirsty = plants.some(
    p => p.wateringStatus === 'necesita_riego' || p.daysUntilNextWatering <= 0
  );
  if (isThirsty) {
    return 'thirsty';
  }

  // Si todas las plantas están bien hidratadas y la racha es >= 3 días -> Floreciente
  const isFullyHydrated = plants.every(
    p => p.wateringStatus === 'hidratada' || p.wateringStatus === 'optimo'
  );
  if (isFullyHydrated && streakDays >= 3) {
    return 'blooming';
  }

  return 'default';
}

/**
 * Aplica el icono en el entorno nativo de iOS o en el favicon de la Web
 */
export async function setAppIcon(icon: AppIconState): Promise<boolean> {
  try {
    await setItem(STORAGE_APP_ICON_KEY, icon);

    // 1. Manejo en Web (actualización dinámica del <link rel="icon">)
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        const faviconHref =
          icon === 'thirsty'
            ? '/assets/favicon-thirsty.png'
            : icon === 'blooming'
            ? '/assets/favicon-blooming.png'
            : '/assets/favicon.png';

        let link: HTMLLinkElement | null =
          document.querySelector("link[rel*='icon']") ||
          document.querySelector("link[rel='shortcut icon']");

        if (!link) {
          link = document.createElement('link');
          link.rel = 'shortcut icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = faviconHref;

        // Título dinámico en pestaña web para reforzar recordatorio
        if (icon === 'thirsty') {
          document.title = '(Riego pendiente) Treegoh';
        } else if (icon === 'blooming') {
          document.title = 'Treegoh · Santuario Floreciente';
        } else {
          document.title = 'Treegoh · Santuario Botánico';
        }
      } catch (_err) {
        // Fallback no crítico
      }
      return true;
    }

    // 2. Manejo en iOS Nativo (CFBundleAlternateIcons)
    if (Platform.OS === 'ios') {
      const alternateIconName =
        icon === 'thirsty' ? 'icon-thirsty' : icon === 'blooming' ? 'icon-blooming' : null;

      // Puente nativo si está disponible en la compilación nativa de iOS
      if (
        NativeModules.TreegohAlternateIcon &&
        typeof NativeModules.TreegohAlternateIcon.setIcon === 'function'
      ) {
        try {
          await NativeModules.TreegohAlternateIcon.setIcon(alternateIconName);
          return true;
        } catch (e) {
          console.log('[TreegohIcon] Aviso al cambiar icono en iOS:', e);
        }
      }
    }

    return true;
  } catch (err) {
    console.warn('[TreegohIcon] Error al persistir icono:', err);
    return false;
  }
}

/**
 * Obtiene el icono guardado actualmente
 */
export async function getCurrentAppIcon(): Promise<AppIconState> {
  try {
    const saved = await getItem<AppIconState>(STORAGE_APP_ICON_KEY);
    return saved || 'default';
  } catch (_e) {
    return 'default';
  }
}

/**
 * Sincroniza automáticamente el icono y favicon de la app con el estado vivo del santuario
 */
export async function syncAppIconWithSanctuary(
  plants: UserPlant[],
  streakDays = 0
): Promise<AppIconState> {
  const targetIcon = evaluateSanctuaryAppIcon(plants, streakDays);
  await setAppIcon(targetIcon);
  return targetIcon;
}

