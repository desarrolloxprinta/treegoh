/**
 * Treegoh • Image Delivery & Zero-Bloat Cache Service
 * 
 * Regla Fundamental de Rendimiento:
 * - El binario móvil no almacena fotos de plantas (Zero-Bundle Bloat).
 * - Carga on-demand según la especie del usuario con Blurhash instantáneo.
 * - LRU Cache con límite estricto de 50 MB en dispositivo.
 */

export type ImageSizeVariant = 'thumbnail' | 'card' | 'hero';

export interface ImageDeliveryConfig {
  baseUrl: string; // CDN o Firebase Storage
  cacheLimitMb: number; // Por defecto 50 MB
}

export interface OptimizedPlantImage {
  speciesId: string;
  variant: ImageSizeVariant;
  url: string;
  width: number;
  height: number;
  blurhash: string; // Tono orgánico de fondo antes de descargar
}

export class PlantImageDeliveryService {
  private static readonly STORAGE_BASE = 'https://firebasestorage.googleapis.com/v0/b/treegoh-6d95a.firebasestorage.app/o';

  // Dimensiones canónicas optimizadas para móvil
  private static readonly SIZES: Record<ImageSizeVariant, { width: number; height: number; approxKb: number }> = {
    thumbnail: { width: 120, height: 120, approxKb: 4 },
    card: { width: 400, height: 500, approxKb: 22 },
    hero: { width: 800, height: 1200, approxKb: 65 }
  };

  /**
   * Construye la URL optimizada servida por CDN para evitar descargar megabytes innecesarios
   */
  static getOptimizedImageUrl(speciesId: string, variant: ImageSizeVariant = 'card'): string {
    const encodedPath = encodeURIComponent(`biblia_media/${speciesId}/${variant}.webp`);
    return `${this.STORAGE_BASE}/${encodedPath}?alt=media`;
  }

  /**
   * Blurhash base para transiciones elegantes Light Luxury (#EBEAE4 / #84A98C)
   * Evita saltos bruscos en pantalla (CLS = 0)
   */
  static getDefaultBotanicalBlurhash(): string {
    return 'L8E|L,t700of_4bH%May00Rj~qof'; // Tono salvia y niebla cálida
  }
}
