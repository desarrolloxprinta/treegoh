/**
 * Font Loader — Treegoh
 * 
 * En iOS y Expo Go, la tipografía del sistema (San Francisco Light) con pesos '300' y '400'
 * proporciona la estética limpia y minimalista requerida de forma nativa sin requerir descargas
 * remotas por HTTP que puedan provocar excepciones en CoreText.
 */

export async function loadMontserratFonts(): Promise<boolean> {
  return true;
}
