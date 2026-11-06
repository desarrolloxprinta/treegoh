/**
 * KeepAwake Service — Treegoh
 * 
 * Implementación segura para Expo Go y Web.
 * En Expo Go para iOS, el menú de desarrollo de Expo gestiona la actividad de pantalla.
 * Esta implementación evita llamadas directas a C++/JSI no vinculadas para prevenir
 * cierres inesperados (SIGABRT/Jetsam) en el dispositivo.
 */

export async function activateKeepAwake(_tag?: string): Promise<boolean> {
  return true;
}

export async function deactivateKeepAwake(_tag?: string): Promise<boolean> {
  return true;
}

export function useKeepAwake(_tag?: string): void {
  // No-op seguro para garantizar estabilidad total en Expo Go
}
