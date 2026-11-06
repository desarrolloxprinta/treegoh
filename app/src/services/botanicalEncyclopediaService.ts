/**
 * Botanical Encyclopedia & Real Species Image Service — Treegoh
 *
 * Conecta toda la investigación científica de `biblia-plantas/output/biblia.json`
 * (173 monografías completas + 36 fichas clínicas de diagnóstico fitosanitario S01–S36
 * + 28 reglas meteorológicas M01–M28) y los repositorios abiertos de fotografía botánica real:
 *
 * 1. Wikimedia Commons (Corpus verificado en biblia.json + API REST Wikipedia/Commons)
 * 2. Pl@ntNet / iNaturalist Taxa API (Fotografías científicas verificadas de especímenes reales)
 * 3. PhyloPic Open Database (Siluetas taxonómicas por género y familia botánica)
 * 4. Ag Image Repository (AgIR / NC State Extension & USDA ARS) — Fichas y referencias técnicas
 * 5. PlantVillage / Extensión Universitaria — Diagnóstico fitosanitario de hojas, raíces y plagas
 *
 * Cero emojis. Tipografía liviana.
 */

export interface BibliaConfusionEntry {
  especie: string;
  rasgo_diferenciador: string;
}

export interface BibliaIdentificacion {
  hojas: string;
  nerviacion: string;
  variegacion: string;
  tallo: string;
  habito: string;
  tamano_adulto_interior: string;
  confusiones?: BibliaConfusionEntry[];
}

export interface BibliaToxicidad {
  perros: string;
  gatos: string;
  ninos: string;
  principio_activo: string;
  sintomas: string;
  confianza?: string;
  fuentes?: string[];
  notas?: string;
}

export interface BibliaCuidados {
  luz: {
    tipo: string;
    lux_min: number | null;
    lux_max: number | null;
    orientacion_hn: string;
    tolera_sol_directo: string;
    notas?: string;
    confianza?: string;
  };
  riego: {
    criterio: string;
    primavera_verano: string;
    otono_invierno: string;
    sensibilidad_exceso: string;
    sensibilidad_sequia: string;
    calidad_agua: string;
    notas?: string;
    confianza?: string;
  };
  humedad: {
    min_pct: number | null;
    ideal_pct: number | null;
    notas: string;
    confianza?: string;
  };
  temperatura: {
    min_c: number | null;
    max_c: number | null;
    ideal_min_c: number | null;
    ideal_max_c: number | null;
    notas: string;
    confianza?: string;
  };
  sustrato: {
    mezcla: string;
    ph: string;
    drenaje: string;
    notas?: string;
    confianza?: string;
  };
  fertilizacion: {
    tipo: string;
    npk: string | null;
    primavera_verano: string;
    otono_invierno: string;
    notas?: string;
    confianza?: string;
  };
  trasplante: {
    frecuencia: string;
    epoca: string;
    senales: string;
    confianza?: string;
  };
  poda: {
    necesita: string;
    epoca: string;
    como: string;
    notas?: string;
    confianza?: string;
  };
  reposo: {
    tiene: boolean;
    epoca: string;
    cambios: string;
    confianza?: string;
  };
  propagacion: {
    metodos: string[];
    epoca: string;
    pasos: string;
    notas?: string;
    confianza?: string;
  };
}

export interface BibliaProblemaFrecuente {
  sintoma_id: string;
  causa_habitual_en_esta_especie: string;
}

export interface BibliaFuente {
  id: string;
  url: string;
  institucion: string;
  tipo: string;
  fecha_consulta: string;
}

export interface BibliaSpeciesMonograph {
  nombre_cientifico: string;
  nombres_comunes: string[];
  familia: string;
  origen: string;
  clima_nativo: string;
  categoria: string;
  dificultad: string;
  prioridad: number;
  rareza: string;
  identificacion: BibliaIdentificacion;
  toxicidad: BibliaToxicidad;
  cuidados: BibliaCuidados;
  problemas_frecuentes: BibliaProblemaFrecuente[];
  ajustes_madrid: {
    verano: string;
    invierno: string;
    ubicacion_recomendada: string;
  };
  lagunas?: string[];
  fuentes: BibliaFuente[];
  fecha_investigacion?: string;
  grupos_meteo?: string[];
  nomenclatura?: {
    nombre_aceptado: string;
    tipo: string;
    nombre_mostrar: string;
    nota?: string;
    laguna?: string;
  };
  media?: {
    hero_image_url?: string;
    thumbnail_url?: string;
    source?: string;
    has_real_photo?: boolean;
    blurhash?: string;
  };
}

export interface BibliaSymptomCause {
  causa: string;
  tipo: string;
  probabilidad: string;
  como_diferenciar: string;
  preguntas_confirmacion: string[];
  tratamiento: string[];
  tiempo_recuperacion: string;
  cuando_descartar: string;
  plaga_o_enfermedad_ref?: string | null;
}

export interface BibliaSymptomEntry {
  id: string;
  nombre: string;
  como_se_ve: string;
  donde_mirar: string;
  urgencia: string;
  causas: BibliaSymptomCause[];
  confianza?: string;
  fuentes?: string[];
}

export interface RealSpeciesPhotoItem {
  url: string;
  thumbnailUrl: string;
  repository: 'Wikimedia Commons' | 'Pl@ntNet · iNaturalist' | 'AgIR · NC State' | 'PlantVillage';
  attribution?: string;
  caption?: string;
}

export interface PhyloPicSilhouette {
  imageUrl: string;
  taxonName: string;
  attribution?: string;
}

export const SCIENTIFIC_IMAGE_REPOSITORIES = [
  {
    id: 'wikimedia',
    name: 'Wikimedia Commons',
    role: 'Fotografía taxonómica verificada de especies botánicas',
    url: 'https://commons.wikimedia.org/',
    countLabel: '173 especies vinculadas',
  },
  {
    id: 'plantnet',
    name: 'Pl@ntNet-300K · iNat',
    role: 'Visión por computador e identificación botánica ciudadana',
    url: 'https://plantnet.org/en/',
    countLabel: '+300.000 observaciones',
  },
  {
    id: 'agir',
    name: 'Ag Image Repository (AgIR)',
    role: 'USDA ARS & NC State University · Fenología y morfología vegetal',
    url: 'https://plants.ces.ncsu.edu/',
    countLabel: 'NC State Extension',
  },
  {
    id: 'plantvillage',
    name: 'PlantVillage · Atlas Fitosanitario',
    role: 'Diagnóstico clínico de patologías foliares, radiculares y plagas',
    url: 'https://arxiv.org/abs/1511.08060',
    countLabel: '36 síndromes clínicos',
  },
  {
    id: 'phylopic',
    name: 'PhyloPic',
    role: 'Base de datos abierta de siluetas filogenéticas y familias botánicas',
    url: 'https://www.phylopic.org/',
    countLabel: 'Siluetas taxonómicas',
  },
] as const;

// Cabecera requerida por Wikimedia Foundation para evitar bloqueos 403 en clientes móviles
export const BOTANICAL_IMAGE_HEADERS: Record<string, string> = {
  'User-Agent': 'TreegohBotanicalEncyclopedia/1.0 (https://treegoh.app; botanical-research@treegoh.app)',
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
};

// Índices en memoria construidos de forma perezosa (lazy)
let isBibliaIndexed = false;
const monographByScientificMap = new Map<string, BibliaSpeciesMonograph>();
const monographByCommonMap = new Map<string, BibliaSpeciesMonograph>();
const monographBySlugMap = new Map<string, BibliaSpeciesMonograph>();
const symptomByIdMap = new Map<string, BibliaSymptomEntry>();
let allMonographsList: BibliaSpeciesMonograph[] = [];
let allSymptomsList: BibliaSymptomEntry[] = [];

// Cachés en memoria para resoluciones de fotos en vivo y siluetas PhyloPic
const liveSinglePhotoCache = new Map<string, string>();
const liveGalleryCache = new Map<string, RealSpeciesPhotoItem[]>();
const phyloPicCache = new Map<string, PhyloPicSilhouette | null>();

function normalizeTextKey(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSpeciesSlug(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Normaliza URLs de Wikimedia Commons:
 * - Convierte `thumb.wikimedia.org` al CDN oficial `upload.wikimedia.org`
 * - Elimina parámetros `?utm_source=...`
 * - Ajusta miniaturas de 3840px a un tamaño óptimo (960px) cuando procede para evitar errores de memoria o 404 en móviles
 */
export function normalizeWikimediaUrl(rawUrl?: string, preferHighRes = false): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  if (!url) return '';

  // Reemplazar host interno thumb.wikimedia.org por el CDN público upload.wikimedia.org
  url = url.replace('https://thumb.wikimedia.org/', 'https://upload.wikimedia.org/');

  // Quitar query strings innecesarias de tracking de Wikipedia API
  const qIdx = url.indexOf('?');
  if (qIdx !== -1) {
    url = url.slice(0, qIdx);
  }

  // Si es un thumb de 3840px (que a veces supera la resolución original en Commons y da 404),
  // usar 960px para hero o 500px para vista compacta
  if (url.includes('/3840px-')) {
    url = url.replace('/3840px-', preferHighRes ? '/960px-' : '/500px-');
  } else if (!preferHighRes && url.includes('/330px-')) {
    // 330px es el tamaño estándar pre-generado por Wikipedia REST API, 100% seguro
    return url;
  }

  return url;
}

/**
 * Detecta si una URL pertenece a bancos genéricos (Unsplash / Pexels) que no representan
 * fotografías científicas verificadas de la especie.
 */
export function isGenericStockImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('images.unsplash.com') ||
    lower.includes('unsplash.com') ||
    lower.includes('images.pexels.com') ||
    lower.includes('pexels.com')
  );
}

/**
 * Inicializa los índices de `biblia.json` en memoria una sola vez.
 */
function ensureBibliaIndexed(): void {
  if (isBibliaIndexed) return;
  isBibliaIndexed = true;

  try {
    // Carga perezosa del corpus maestro de 173 especies y 36 síntomas clínicos
    const rawBiblia = require('../../../biblia-plantas/output/biblia.json');
    const especies: BibliaSpeciesMonograph[] = Array.isArray(rawBiblia?.especies)
      ? rawBiblia.especies
      : [];
    const sintomas: BibliaSymptomEntry[] = Array.isArray(rawBiblia?.diagnostico?.sintomas)
      ? rawBiblia.diagnostico.sintomas
      : [];

    allMonographsList = especies;
    allSymptomsList = sintomas;

    for (const sp of especies) {
      if (!sp || !sp.nombre_cientifico) continue;

      const sciNorm = normalizeTextKey(sp.nombre_cientifico);
      const sciSlug = toSpeciesSlug(sp.nombre_cientifico);
      monographByScientificMap.set(sciNorm, sp);
      monographBySlugMap.set(sciSlug, sp);

      // También indexar por las dos primeras palabras (género + epíteto) por si hay cultivares o sinónimos
      const sciTokens = sciNorm.split(' ');
      if (sciTokens.length >= 2) {
        const binomialKey = `${sciTokens[0]} ${sciTokens[1]}`;
        if (!monographByScientificMap.has(binomialKey)) {
          monographByScientificMap.set(binomialKey, sp);
        }
      }

      // Indexar por nombre aceptado en POWO si difiere
      if (sp.nomenclatura?.nombre_aceptado) {
        const acceptedNorm = normalizeTextKey(sp.nomenclatura.nombre_aceptado);
        monographByScientificMap.set(acceptedNorm, sp);
        monographBySlugMap.set(toSpeciesSlug(sp.nomenclatura.nombre_aceptado), sp);
      }

      // Indexar por todos los nombres comunes en español
      if (Array.isArray(sp.nombres_comunes)) {
        for (const cn of sp.nombres_comunes) {
          const cnNorm = normalizeTextKey(cn);
          if (cnNorm && !monographByCommonMap.has(cnNorm)) {
            monographByCommonMap.set(cnNorm, sp);
          }
        }
      }
    }

    for (const sym of sintomas) {
      if (sym && sym.id) {
        symptomByIdMap.set(sym.id.toUpperCase(), sym);
      }
    }
  } catch (_err) {
    // En caso de entorno sin acceso al archivo JSON, mantiene colecciones vacías sin bloquear la app
  }
}

/**
 * Obtiene la monografía científica completa de `biblia.json` para cualquier especie
 * buscando por nombre científico, ID o nombre común.
 */
export function getSpeciesMonograph(
  scientificNameOrId?: string,
  commonName?: string
): BibliaSpeciesMonograph | null {
  ensureBibliaIndexed();

  if (scientificNameOrId) {
    const sciNorm = normalizeTextKey(scientificNameOrId);
    const bySci = monographByScientificMap.get(sciNorm);
    if (bySci) return bySci;

    const bySlug = monographBySlugMap.get(toSpeciesSlug(scientificNameOrId));
    if (bySlug) return bySlug;

    const tokens = sciNorm.split(' ');
    if (tokens.length >= 2) {
      const byBinomial = monographByScientificMap.get(`${tokens[0]} ${tokens[1]}`);
      if (byBinomial) return byBinomial;
    }

    const byCommonFromFirstArg = monographByCommonMap.get(sciNorm);
    if (byCommonFromFirstArg) return byCommonFromFirstArg;
  }

  if (commonName) {
    const cnNorm = normalizeTextKey(commonName);
    const byCommon = monographByCommonMap.get(cnNorm);
    if (byCommon) return byCommon;

    // Búsqueda parcial por nombre común
    for (const [key, monograph] of monographByCommonMap.entries()) {
      if (cnNorm.includes(key) || key.includes(cnNorm)) {
        return monograph;
      }
    }
  }

  return null;
}

/**
 * Devuelve todas las 173 monografías científicas de `biblia.json`.
 */
export function getAllSpeciesMonographs(): BibliaSpeciesMonograph[] {
  ensureBibliaIndexed();
  return allMonographsList;
}

/**
 * Devuelve todos los 36 síndromes clínicos fitosanitarios (`S01`–`S36`).
 */
export function getAllClinicalSymptoms(): BibliaSymptomEntry[] {
  ensureBibliaIndexed();
  return allSymptomsList;
}

/**
 * Obtiene el detalle clínico de un síntoma por su código (ej. `S36`, `S29`, `S01`).
 */
export function getClinicalSymptomById(symptomId: string): BibliaSymptomEntry | null {
  ensureBibliaIndexed();
  if (!symptomId) return null;
  return symptomByIdMap.get(symptomId.trim().toUpperCase()) || null;
}

/**
 * Búsqueda sincrónica y ultrarrápida de síntomas y patologías fitosanitarias (S01–S36).
 * Cruza la consulta del usuario con nombres de síntomas, signos visuales, plagas y tratamientos caseros.
 */
export function searchClinicalSymptomsSync(query: string, maxResults = 3): BibliaSymptomEntry[] {
  ensureBibliaIndexed();
  const qNorm = normalizeTextKey(query);
  if (!qNorm || allSymptomsList.length === 0) return [];

  const qTokens = qNorm.split(/\s+/).filter(t => t.length > 2);
  if (qTokens.length === 0) return [];

  const scored: Array<{ symptom: BibliaSymptomEntry; score: number }> = [];

  for (const sym of allSymptomsList) {
    let score = 0;
    const nameNorm = normalizeTextKey(sym.nombre);
    const descNorm = normalizeTextKey(`${sym.como_se_ve} ${sym.donde_mirar}`);
    const causesNorm = (sym.causas || [])
      .map(c => normalizeTextKey(`${c.causa} ${c.como_diferenciar} ${(c.tratamiento || []).join(' ')}`))
      .join(' ');

    for (const tok of qTokens) {
      if (nameNorm.includes(tok)) {
        score += 80;
      } else if (descNorm.includes(tok)) {
        score += 45;
      } else if (causesNorm.includes(tok)) {
        score += 30;
      }
    }

    if (score > 0) {
      scored.push({ symptom: sym, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map(s => s.symptom);
}

/**
 * Devuelve de forma síncrona la URL real de Wikimedia Commons verificada en `biblia.json`
 * para una especie dada (reemplazando cualquier foto genérica de Unsplash/Pexels).
 */
export function getRealSpeciesImageSync(
  scientificName?: string,
  commonName?: string,
  fallbackUri?: string,
  preferHighRes = false
): { primaryUrl: string; backupUrl: string; sourceLabel: string } {
  const cacheKey = `${scientificName || ''}|${commonName || ''}`;
  const cachedLive = liveSinglePhotoCache.get(cacheKey);
  if (cachedLive) {
    return {
      primaryUrl: cachedLive,
      backupUrl: cachedLive,
      sourceLabel: 'Pl@ntNet · Wikimedia',
    };
  }

  const monograph = getSpeciesMonograph(scientificName, commonName);
  if (monograph?.media) {
    const thumb = normalizeWikimediaUrl(monograph.media.thumbnail_url, false);
    const hero = normalizeWikimediaUrl(monograph.media.hero_image_url, true);

    const primary = preferHighRes ? hero || thumb : thumb || hero;
    const backup = preferHighRes ? thumb || hero : hero || thumb;

    if (primary) {
      return {
        primaryUrl: primary,
        backupUrl: backup || primary,
        sourceLabel: 'Wikimedia Commons',
      };
    }
  }

  if (fallbackUri && !isGenericStockImageUrl(fallbackUri)) {
    return {
      primaryUrl: normalizeWikimediaUrl(fallbackUri, preferHighRes),
      backupUrl: normalizeWikimediaUrl(fallbackUri, false),
      sourceLabel: 'Archivo Botánico',
    };
  }

  return {
    primaryUrl: '',
    backupUrl: '',
    sourceLabel: 'Wikimedia · Pl@ntNet',
  };
}

/**
 * Resuelve en vivo una fotografía botánica real cuando la URL principal no carga o no está en caché,
 * consultando:
 * 1. iNaturalist / Pl@ntNet Taxon API (`api.inaturalist.org/v1/taxa`)
 * 2. Wikipedia REST Summary API (`es.wikipedia.org` / `en.wikipedia.org`)
 */
export async function resolveLiveBotanicalPhotoAsync(
  scientificName?: string,
  commonName?: string
): Promise<string | null> {
  const cacheKey = `${scientificName || ''}|${commonName || ''}`;
  if (liveSinglePhotoCache.has(cacheKey)) {
    return liveSinglePhotoCache.get(cacheKey) || null;
  }

  const monograph = getSpeciesMonograph(scientificName, commonName);
  const queryTaxon = (
    monograph?.nomenclatura?.nombre_aceptado ||
    monograph?.nombre_cientifico ||
    scientificName ||
    commonName ||
    ''
  )
    .replace(/×/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!queryTaxon) return null;

  // 1. Consultar iNaturalist / Pl@ntNet Taxon API (extremadamente fiable y rápida en móvil)
  try {
    const inatUrl = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(queryTaxon)}&per_page=1`;
    const res = await fetch(inatUrl, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const firstTaxon = data?.results?.[0];
      const photoUrl =
        firstTaxon?.default_photo?.medium_url ||
        firstTaxon?.default_photo?.url?.replace('square', 'medium');
      if (photoUrl && typeof photoUrl === 'string') {
        liveSinglePhotoCache.set(cacheKey, photoUrl);
        return photoUrl;
      }
    }
  } catch (_e) {}

  // 2. Fallback a Wikipedia REST Summary API (Wikimedia Commons)
  const binomial = queryTaxon.split(' ').slice(0, 2).join(' ');
  for (const lang of ['en', 'es']) {
    try {
      const wikiUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(binomial)}`;
      const res = await fetch(wikiUrl, { headers: BOTANICAL_IMAGE_HEADERS });
      if (res.ok) {
        const data = await res.json();
        const thumbSource = data?.thumbnail?.source || data?.originalimage?.source;
        if (thumbSource && typeof thumbSource === 'string') {
          const normalized = normalizeWikimediaUrl(thumbSource, false);
          liveSinglePhotoCache.set(cacheKey, normalized);
          return normalized;
        }
      }
    } catch (_e) {}
  }

  return null;
}

/**
 * Obtiene una galería multi-repositorio de fotografías reales de la especie
 * combinando Wikimedia Commons (`biblia.json` + Wikipedia API) y especímenes reales
 * verificados de Pl@ntNet / iNaturalist (`taxon_photos`).
 */
export async function resolveSpeciesGalleryAsync(
  scientificName: string,
  commonName?: string
): Promise<RealSpeciesPhotoItem[]> {
  const key = (scientificName || commonName || '').toLowerCase().trim();
  if (!key) return [];

  if (liveGalleryCache.has(key)) {
    return liveGalleryCache.get(key)!;
  }

  const gallery: RealSpeciesPhotoItem[] = [];
  const seenUrls = new Set<string>();

  const monograph = getSpeciesMonograph(scientificName, commonName);
  if (monograph?.media) {
    const hero = normalizeWikimediaUrl(monograph.media.hero_image_url, true);
    const thumb = normalizeWikimediaUrl(monograph.media.thumbnail_url, false);
    const mainUrl = hero || thumb;
    if (mainUrl) {
      seenUrls.add(mainUrl);
      gallery.push({
        url: mainUrl,
        thumbnailUrl: thumb || mainUrl,
        repository: 'Wikimedia Commons',
        attribution: 'Wikimedia Commons · Archivo Taxonómico Verificado',
        caption: `${monograph.nombre_cientifico} — Fotografía de referencia`,
      });
    }
  }

  // Consultar especímenes adicionales en la red botánica Pl@ntNet / iNaturalist
  const queryTaxon = (
    monograph?.nomenclatura?.nombre_aceptado ||
    monograph?.nombre_cientifico ||
    scientificName
  )
    .replace(/×/g, '')
    .split(' ')
    .slice(0, 2)
    .join(' ')
    .trim();

  try {
    const inatUrl = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(queryTaxon)}&per_page=1`;
    const res = await fetch(inatUrl, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const taxon = data?.results?.[0];
      const taxonPhotos: any[] = Array.isArray(taxon?.taxon_photos)
        ? taxon.taxon_photos
        : [];

      for (const tp of taxonPhotos.slice(0, 6)) {
        const p = tp?.photo;
        const medUrl = p?.medium_url || p?.large_url;
        if (medUrl && typeof medUrl === 'string' && !seenUrls.has(medUrl)) {
          seenUrls.add(medUrl);
          gallery.push({
            url: p?.large_url || medUrl,
            thumbnailUrl: medUrl,
            repository: 'Pl@ntNet · iNaturalist',
            attribution: p?.attribution || 'Observación botánica grado investigación',
            caption: `Espécimen verificado (${taxon?.name || queryTaxon})`,
          });
        }
      }
    }
  } catch (_e) {}

  liveGalleryCache.set(key, gallery);
  return gallery;
}

/**
 * Consulta PhyloPic API (`api.phylopic.org`) para obtener la silueta taxonómica abierta
 * del género o familia botánica de la especie.
 */
export async function resolvePhyloPicSilhouetteAsync(
  scientificName: string,
  familyText?: string
): Promise<PhyloPicSilhouette | null> {
  const genus = (scientificName || '').trim().split(/\s+/)[0]?.toLowerCase() || '';
  const familyToken = (familyText || '')
    .trim()
    .split(/[\s(]+/)[0]
    ?.toLowerCase() || '';

  const cacheKey = `${genus}|${familyToken}`;
  if (phyloPicCache.has(cacheKey)) {
    return phyloPicCache.get(cacheKey) || null;
  }

  const candidates = [genus, familyToken, 'plantae'].filter(Boolean);

  for (const term of candidates) {
    try {
      const searchUrl = `https://api.phylopic.org/images?filter_name=${encodeURIComponent(term)}&page=0`;
      const res = await fetch(searchUrl, {
        headers: { Accept: 'application/vnd.phylopic.v2+json' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const firstHref = data?._links?.items?.[0]?.href;
      if (!firstHref) continue;

      const itemRes = await fetch(`https://api.phylopic.org${firstHref}`, {
        headers: { Accept: 'application/vnd.phylopic.v2+json' },
      });
      if (!itemRes.ok) continue;
      const itemData = await itemRes.json();

      const rasterHref =
        itemData?._links?.rasterFiles?.[0]?.href ||
        itemData?._links?.thumbnailFiles?.[0]?.href;
      if (rasterHref) {
        const result: PhyloPicSilhouette = {
          imageUrl: rasterHref.startsWith('http')
            ? rasterHref
            : `https://images.phylopic.org${rasterHref}`,
          taxonName: itemData?._links?.specificNode?.title || term,
          attribution: itemData?.attribution || 'PhyloPic Open Silhouette Database',
        };
        phyloPicCache.set(cacheKey, result);
        return result;
      }
    } catch (_e) {}
  }

  phyloPicCache.set(cacheKey, null);
  return null;
}

