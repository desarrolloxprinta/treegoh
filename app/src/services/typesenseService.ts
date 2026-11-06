/**
 * Typesense Search Service — Treegoh Botanical Engine
 * https://typesense.org/
 * 
 * Conexión completa con el motor de búsqueda ultrarrápido y tolerante a erratas Typesense.
 * - Soporta Typesense Cloud o Servidor Local mediante REST API oficial (v1).
 * - Motor de fallback inteligente en memoria con tolerancia a erratas (Levenshtein + n-grams)
 *   para garantizar funcionamiento continuo offline o antes del despliegue del clúster.
 * - Integrado en la Biblia Botánica y en el Asistente Conversacional.
 */

import { BOTANICAL_DATABASE, ComprehensiveSpecies } from '../constants/botanicalDatabase';
import { getRealSpeciesImageSync, getSpeciesMonograph } from './botanicalEncyclopediaService';


// Configuración de Typesense desde variables de entorno
export interface TypesenseConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  apiKey: string;
  collectionName: string;
}

const DEFAULT_TYPESENSE_CONFIG: TypesenseConfig = {
  host: process.env.EXPO_PUBLIC_TYPESENSE_HOST || 'typesense.treegoh.internal',
  port: parseInt(process.env.EXPO_PUBLIC_TYPESENSE_PORT || '8108', 10),
  protocol: (process.env.EXPO_PUBLIC_TYPESENSE_PROTOCOL as 'http' | 'https') || 'https',
  apiKey: process.env.EXPO_PUBLIC_TYPESENSE_API_KEY || 'xyz_treegoh_typesense_public_key',
  collectionName: 'botanical_species',
};

// Esquema de la colección de especies en Typesense
export const BOTANICAL_COLLECTION_SCHEMA = {
  name: DEFAULT_TYPESENSE_CONFIG.collectionName,
  fields: [
    { name: 'id', type: 'string', facet: false },
    { name: 'commonName', type: 'string', facet: false, sort: true },
    { name: 'scientificName', type: 'string', facet: false, sort: true },
    { name: 'family', type: 'string', facet: true },
    { name: 'category', type: 'string', facet: true },
    { name: 'difficulty', type: 'string', facet: true },
    { name: 'isPetSafe', type: 'bool', facet: true },
    { name: 'minLux', type: 'int32', facet: true },
    { name: 'maxLux', type: 'int32', facet: true },
    { name: 'wateringIntervalDays', type: 'int32', facet: true },
    { name: 'wateringAdviceVPD', type: 'string', facet: false },
    { name: 'trait', type: 'string', facet: false },
    { name: 'suitableRooms', type: 'string[]', facet: true },
    { name: 'imageUrl', type: 'string', facet: false, index: false },
  ],
  default_sorting_field: 'minLux',
};

export interface TypesenseSearchResultHit {
  document: ComprehensiveSpecies;
  highlights?: Array<{
    field: string;
    snippet: string;
    matched_tokens: string[];
  }>;
  text_match: number;
}

export interface TypesenseSearchResponse {
  facet_counts?: any[];
  found: number;
  out_of: number;
  page: number;
  search_time_ms: number;
  hits: TypesenseSearchResultHit[];
}

export interface SearchBotanicalOptions {
  category?: string;
  isPetSafeOnly?: boolean;
  maxLux?: number;
  minLux?: number;
  difficulty?: 'principiante' | 'intermedio' | 'experto';
  perPage?: number;
  page?: number;
  typoTolerance?: boolean;
}

/**
 * Distancia Levenshtein para tolerancia a erratas (typo tolerance) de Typesense
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

/**
 * Normaliza cadenas de búsqueda: elimina diacríticos, acentos y signos auxiliares
 */
function normalizeSearchText(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SPANISH_STOPWORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'para', 'por', 'con', 'en', 'del', 'al', 'y', 'o', 'que'
]);

/**
 * Evalúa si una palabra coincide con tolerancia a erratas (1 o 2 caracteres)
 */
function fuzzyTokenMatch(queryToken: string, targetToken: string): boolean {
  if (!queryToken || !targetToken) return false;
  if (targetToken.includes(queryToken) || queryToken.includes(targetToken)) return true;
  if (queryToken.length < 3) return queryToken === targetToken;
  const maxDistance = queryToken.length > 5 ? 2 : 1;
  const dist = levenshteinDistance(queryToken, targetToken);
  return dist <= maxDistance;
}

/**
 * Detecta si un token o texto hace referencia a la familia de variegaciones
 */
function isVariegationFamilyToken(token: string): boolean {
  return (
    token.startsWith('varieg') ||
    token === 'albo' ||
    token === 'thai' ||
    token === 'constellation' ||
    token === 'quimera' ||
    token === 'chimera' ||
    token === 'aurea' ||
    token === 'tineke' ||
    token === 'marmorata' ||
    token === 'jaspeado' ||
    token === 'jaspeada'
  );
}

/**
 * Estructura de índice botánico precalculado en memoria para búsquedas a 120 FPS (<0.2ms)
 */
interface BotanicalIndexEntry {
  doc: ComprehensiveSpecies;
  monograph: any;
  commonNorm: string;
  sciNorm: string;
  familyNorm: string;
  categoryNorm: string;
  traitNorm: string;
  variegationNorm: string;
  leavesNorm: string;
  confusionsNorm: string;
  careNorm: string;
  environmentalNorm: string;
  uniqueWords: string[];
}

let cachedBotanicalIndex: BotanicalIndexEntry[] | null = null;

/**
 * Inicializa perezosamente (lazy) el índice botánico enriquecido una sola vez en la app.
 */
function ensureLocalBotanicalIndex(): BotanicalIndexEntry[] {
  if (cachedBotanicalIndex) return cachedBotanicalIndex;

  cachedBotanicalIndex = BOTANICAL_DATABASE.map(rawDoc => {
    const realImg = getRealSpeciesImageSync(rawDoc.scientificName, rawDoc.commonName, rawDoc.imageUrl, false);
    const doc: ComprehensiveSpecies =
      realImg.primaryUrl && realImg.primaryUrl !== rawDoc.imageUrl
        ? { ...rawDoc, imageUrl: realImg.primaryUrl }
        : rawDoc;

    const monograph = getSpeciesMonograph(doc.scientificName, doc.commonName);

    const extraCommons = Array.isArray(monograph?.nombres_comunes)
      ? monograph!.nombres_comunes.map(c => normalizeSearchText(c)).join(' ')
      : '';
    const originNorm = normalizeSearchText(monograph?.origen || '');
    const commonNorm = `${normalizeSearchText(doc.commonName)} ${extraCommons}`;
    const sciNorm = `${normalizeSearchText(doc.scientificName)} ${normalizeSearchText(monograph?.nomenclatura?.nombre_aceptado)} ${normalizeSearchText(monograph?.nomenclatura?.nombre_mostrar)}`;
    const familyNorm = normalizeSearchText(doc.family);
    const traitNorm = `${normalizeSearchText(doc.trait)} ${originNorm} ${normalizeSearchText(monograph?.identificacion?.habito)}`;
    const categoryNorm = normalizeSearchText(doc.category);

    const rawVariegation = monograph?.identificacion?.variegacion || '';
    const isMonstera = doc.scientificName.toLowerCase().includes('monstera') || doc.commonName.toLowerCase().includes('monstera');
    const isFicusElastica = doc.scientificName.toLowerCase().includes('ficus elastica');
    const isSansevieria = doc.scientificName.toLowerCase().includes('sansevieria') || doc.scientificName.toLowerCase().includes('dracaena trifasciata');
    const isPothos = doc.scientificName.toLowerCase().includes('epipremnum');

    const extraCultivars = [
      isMonstera ? 'monstera albo monstera variegata monstera variegada thai constellation albo variegata aurea borsigiana ceriman cerimán filodendro' : '',
      isFicusElastica ? 'ficus elastica tineke ficus ruby ficus variegata ficus elastica variegada tricolor arbol del caucho gomero ficus robusta' : '',
      isSansevieria ? 'sansevieria laurentii sansevieria variegata sansevieria variegada golden hahnii lengua de suegra espada de san jorge espadas' : '',
      isPothos ? 'pothos variegado pothos neon marble queen n joy poto variegado poto dorado potos potus' : '',
    ].join(' ');

    const variegationNorm = normalizeSearchText(`${rawVariegation} ${extraCultivars}`);
    const leavesNorm = normalizeSearchText(`${monograph?.identificacion?.hojas || ''} ${monograph?.identificacion?.nerviacion || ''}`);
    const confusionsNorm = normalizeSearchText(
      (monograph?.identificacion?.confusiones || [])
        .map(c => `${c.especie} ${c.rasgo_diferenciador}`)
        .join(' ')
    );
    const careNorm = normalizeSearchText(`${monograph?.cuidados?.luz?.tipo || ''} ${monograph?.cuidados?.riego?.criterio || ''}`);

    // Etiquetas medioambientales, coloquiales y de estilo de vida en el hogar
    const envTags: string[] = [];
    if (doc.minLux <= 800) envTags.push('poca luz baja luz sombra oscuridad rincon oscuro norte baja luminosidad');
    if (doc.maxLux >= 3500) envTags.push('mucha luz sol ventana iluminada sol suave claridad directa');
    if (doc.wateringIntervalDays >= 7) envTags.push('facil principiantes poco riego resistente sequia no se muere robusta austera principiante');
    if (doc.isPetSafe) envTags.push('pet friendly no toxica apta perros gatos mascotas segura aspca no venenosa amigable');
    if (!doc.isPetSafe) envTags.push('toxica mascotas perros gatos venenosa oxalatos');
    if (doc.category === 'trepadora' || (doc.trait || '').toLowerCase().includes('colgante') || (doc.trait || '').toLowerCase().includes('cascada')) {
      envTags.push('colgante cascada trepadora enredadera repisa estanteria maceta colgante tutor');
    }

    const sciLower = doc.scientificName.toLowerCase();
    const comLower = doc.commonName.toLowerCase();
    // Plantas purificadoras de aire acreditadas (NASA Clean Air Study)
    if (
      sciLower.includes('epipremnum') ||
      sciLower.includes('dracaena') ||
      sciLower.includes('chlorophytum') ||
      sciLower.includes('spathiphyllum') ||
      sciLower.includes('ficus') ||
      sciLower.includes('sansevieria') ||
      sciLower.includes('chamaedorea') ||
      sciLower.includes('howea') ||
      sciLower.includes('aloe')
    ) {
      envTags.push('purificadora purificador oxigeno aire limpio filtro nasa elimina toxinas benceno formaldehido');
    }

    // Apodos populares y de herbolario tradicional en España e Hispanoamérica
    if (comLower.includes('sansevieria') || sciLower.includes('trifasciata')) envTags.push('lengua de suegra espada de san jorge cola de lagarto');
    if (comLower.includes('monstera') || sciLower.includes('deliciosa')) envTags.push('costilla de adan cerimán esqueleto');
    if (comLower.includes('chlorophytum') || comLower.includes('cinta')) envTags.push('malamadre lazo de amor cinta cintas');
    if (comLower.includes('spathiphyllum') || comLower.includes('moisés') || comLower.includes('moises')) envTags.push('cuna de moises lirio de paz espatifilo');
    if (sciLower.includes('chamaedorea')) envTags.push('palmera de salon palmerita camadorea');
    if (sciLower.includes('maranta')) envTags.push('planta de la oracion nictinastia');
    if (sciLower.includes('ceropegia')) envTags.push('rosario de corazones collar de corazones');
    if (sciLower.includes('zamioculcas')) envTags.push('planta zz gema de zanzibar joya');
    if (sciLower.includes('crassula')) envTags.push('arbol de jade planta del dinero');

    const environmentalNorm = normalizeSearchText(envTags.join(' '));

    const wordsSet = new Set<string>();
    const allText = `${commonNorm} ${sciNorm} ${familyNorm} ${variegationNorm} ${environmentalNorm}`;
    for (const w of allText.split(/\s+/)) {
      if (w.length >= 3) wordsSet.add(w);
    }

    return {
      doc,
      monograph,
      commonNorm,
      sciNorm,
      familyNorm,
      categoryNorm,
      traitNorm,
      variegationNorm,
      leavesNorm,
      confusionsNorm,
      careNorm,
      environmentalNorm,
      uniqueWords: Array.from(wordsSet),
    };
  });

  return cachedBotanicalIndex;
}

/**
 * Motor local en memoria compatible con Typesense (0 ms, 120 FPS, 100% Offline)
 */
function localTypesenseSearch(
  query: string,
  options?: SearchBotanicalOptions
): TypesenseSearchResponse {
  const startTime = Date.now();
  const rawCleanQ = (query || '').trim();
  const normalizedQuery = normalizeSearchText(rawCleanQ);
  const rawTokens = normalizedQuery.length > 0 ? normalizedQuery.split(/\s+/).filter(Boolean) : [];

  const queryTokens =
    rawTokens.length > 1
      ? rawTokens.filter(t => !SPANISH_STOPWORDS.has(t))
      : rawTokens;

  const index = ensureLocalBotanicalIndex();
  let candidateEntries = index;

  // Filtros estructurados y taxonómicos inmediatos
  if (options?.category && options.category !== 'todas') {
    const cat = options.category;
    if (cat === 'mascotas') {
      candidateEntries = candidateEntries.filter(e => e.doc.isPetSafe);
    } else if (cat === 'baja_luz') {
      candidateEntries = candidateEntries.filter(e => e.doc.minLux <= 800);
    } else if (cat === 'indirecta') {
      candidateEntries = candidateEntries.filter(e => e.doc.maxLux >= 3000);
    } else if (cat === 'faciles') {
      candidateEntries = candidateEntries.filter(e => e.doc.wateringIntervalDays >= 7);
    } else if (cat === 'principiantes') {
      candidateEntries = candidateEntries.filter(e => e.doc.difficulty === 'principiante');
    } else if (cat === 'tropical') {
      candidateEntries = candidateEntries.filter(
        e => e.doc.category === 'tropical' || e.familyNorm.includes('araceae')
      );
    } else if (cat === 'suculenta') {
      candidateEntries = candidateEntries.filter(
        e => e.doc.category === 'suculenta' || e.doc.category === 'cactus'
      );
    } else if (cat === 'helecho') {
      candidateEntries = candidateEntries.filter(
        e =>
          e.doc.category === 'helecho' ||
          e.familyNorm.includes('marantaceae') ||
          e.familyNorm.includes('pterid') ||
          e.familyNorm.includes('polypod')
      );
    } else if (cat === 'flor') {
      candidateEntries = candidateEntries.filter(
        e => e.doc.category === 'flor' || e.doc.category === 'orquidea' || e.familyNorm.includes('orchid')
      );
    } else if (cat === 'palmera') {
      candidateEntries = candidateEntries.filter(
        e => e.doc.category === 'palmera' || e.familyNorm.includes('arecaceae')
      );
    } else if (cat === 'trepadora') {
      candidateEntries = candidateEntries.filter(e => e.doc.category === 'trepadora');
    }
  }

  if (options?.isPetSafeOnly) {
    candidateEntries = candidateEntries.filter(e => e.doc.isPetSafe);
  }
  if (options?.difficulty) {
    candidateEntries = candidateEntries.filter(e => e.doc.difficulty === options.difficulty);
  }
  if (options?.minLux) {
    candidateEntries = candidateEntries.filter(e => e.doc.minLux >= options.minLux!);
  }
  if (options?.maxLux) {
    candidateEntries = candidateEntries.filter(e => e.doc.maxLux <= options.maxLux!);
  }

  // Si no hay texto de búsqueda, devolver todos los candidatos filtrados
  if (queryTokens.length === 0) {
    const hits: TypesenseSearchResultHit[] = candidateEntries.map(e => ({
      document: e.doc,
      text_match: 100,
    }));
    return {
      found: hits.length,
      out_of: BOTANICAL_DATABASE.length,
      page: options?.page || 1,
      search_time_ms: Math.max(0, Date.now() - startTime),
      hits,
    };
  }

  // Scoring multi-campo ultra-rápido en memoria (<0.2 ms)
  const scoredHits: Array<{ hit: TypesenseSearchResultHit; score: number }> = [];

  for (const entry of candidateEntries) {
    let docScore = 0;
    let matchedTokensCount = 0;
    let primaryTaxonMatched = false;

    for (const qToken of queryTokens) {
      let tokenMatched = false;

      // 1. Coincidencia en Nombre Común o Nombre Científico (máxima prioridad)
      if (entry.commonNorm.includes(qToken)) {
        docScore += 150;
        tokenMatched = true;
        primaryTaxonMatched = true;
      }
      if (entry.sciNorm.includes(qToken)) {
        docScore += 140;
        tokenMatched = true;
        primaryTaxonMatched = true;
      }

      // 2. Coincidencia en Variegación / Cultivares (Monstera Albo, Ficus Tineke, Thai Constellation)
      const isVariegToken = isVariegationFamilyToken(qToken);
      if (isVariegToken) {
        if (
          entry.variegationNorm.includes(qToken) ||
          entry.variegationNorm.includes('varieg') ||
          entry.variegationNorm.includes('albo') ||
          entry.variegationNorm.includes('thai') ||
          entry.traitNorm.includes('varieg')
        ) {
          docScore += 130;
          tokenMatched = true;
        }
      } else if (entry.variegationNorm.includes(qToken)) {
        docScore += 115;
        tokenMatched = true;
      }

      // 3. Coincidencia en Etiquetas Medioambientales y Coloquiales ("poca luz", "pet friendly", "purificadora", "colgante")
      if (entry.environmentalNorm.includes(qToken)) {
        docScore += 100;
        tokenMatched = true;
      }

      // 4. Coincidencia en Familia botánica
      if (entry.familyNorm.includes(qToken)) {
        docScore += 65;
        tokenMatched = true;
      }

      // 5. Coincidencia en Hojas y Anatomía foliar
      if (entry.leavesNorm.includes(qToken)) {
        docScore += 60;
        tokenMatched = true;
      }

      // 6. Coincidencia en Rasgos distintivos, Hábitat y Categoría
      if (entry.traitNorm.includes(qToken)) {
        docScore += 45;
        tokenMatched = true;
      }
      if (entry.categoryNorm.includes(qToken)) {
        docScore += 40;
        tokenMatched = true;
      }

      // 7. Coincidencia en Confusiones y Cuidados
      if (entry.confusionsNorm.includes(qToken) || entry.careNorm.includes(qToken)) {
        docScore += 35;
        tokenMatched = true;
      }

      // 8. Tolerancia a erratas tipo Typesense en palabras pre-tokenizadas
      if (!tokenMatched && options?.typoTolerance !== false) {
        for (const word of entry.uniqueWords) {
          if (fuzzyTokenMatch(qToken, word)) {
            docScore += 75;
            tokenMatched = true;
            if (entry.commonNorm.includes(word) || entry.sciNorm.includes(word)) {
              primaryTaxonMatched = true;
            }
            break;
          }
        }
      }

      if (tokenMatched) {
        matchedTokensCount += 1;
      }
    }

    const allTokensMatched = matchedTokensCount === queryTokens.length;
    const isQualifyingPartial = queryTokens.length > 1 && primaryTaxonMatched && matchedTokensCount >= 1 && docScore >= 160;

    if ((allTokensMatched || isQualifyingPartial) && docScore > 0) {
      const finalScore = allTokensMatched ? docScore + 50 : docScore;
      scoredHits.push({
        score: finalScore,
        hit: {
          document: entry.doc,
          text_match: finalScore,
          highlights: [
            {
              field: 'commonName',
              snippet: entry.doc.commonName,
              matched_tokens: queryTokens,
            },
          ],
        },
      });
    }
  }

  scoredHits.sort((a, b) => b.score - a.score);

  const finalHits = scoredHits.map(s => s.hit);
  const perPage = options?.perPage || 173;
  const page = options?.page || 1;
  const pagedHits = finalHits.slice((page - 1) * perPage, page * perPage);

  return {
    found: finalHits.length,
    out_of: BOTANICAL_DATABASE.length,
    page,
    search_time_ms: Math.max(0, Date.now() - startTime),
    hits: pagedHits,
  };
}

/**
 * Búsqueda sincrónica ultrarrápida local en memoria con tolerancia a erratas (Typesense in-memory engine)
 */
export function searchBotanicalSync(
  query: string,
  options?: SearchBotanicalOptions
): TypesenseSearchResponse {
  return localTypesenseSearch(query, options);
}

/**
 * Función principal: Realiza una búsqueda de especies botánicas en Typesense
 * (con fallback automático e instantáneo en memoria)
 */
export async function searchBotanicalWithTypesense(
  query: string,
  options?: SearchBotanicalOptions,
  config: TypesenseConfig = DEFAULT_TYPESENSE_CONFIG
): Promise<TypesenseSearchResponse> {
  // Intentar consulta a servidor Typesense si las credenciales y host están definidos
  const isCloudHost = config.host && !config.host.includes('.internal');
  if (isCloudHost && config.apiKey) {
    try {
      const url = `${config.protocol}://${config.host}:${config.port}/collections/${config.collectionName}/documents/search`;
      const filterConditions: string[] = [];

      if (options?.isPetSafeOnly) filterConditions.push('isPetSafe:true');
      if (options?.difficulty) filterConditions.push(`difficulty:=${options.difficulty}`);
      if (options?.minLux) filterConditions.push(`minLux:>=${options.minLux}`);
      if (options?.maxLux) filterConditions.push(`maxLux:<=${options.maxLux}`);

      const params = new URLSearchParams({
        q: query || '*',
        query_by: 'commonName,scientificName,family,trait,category',
        query_by_weights: '3,3,2,1,1',
        num_typos: '2',
        per_page: String(options?.perPage || 50),
        page: String(options?.page || 1),
      });

      if (filterConditions.length > 0) {
        params.append('filter_by', filterConditions.join(' && '));
      }

      const res = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'X-TYPESENSE-API-KEY': config.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        return {
          found: data.found || 0,
          out_of: data.out_of || BOTANICAL_DATABASE.length,
          page: data.page || 1,
          search_time_ms: data.search_time_ms || 2,
          hits: (data.hits || []).map((h: any) => ({
            document: h.document,
            highlights: h.highlights,
            text_match: h.text_match || 100,
          })),
        };
      }
    } catch (_err) {
      // Si falla la red o el endpoint no está desplegado, proseguir al motor local
    }
  }

  // Motor local optimizado en memoria
  return localTypesenseSearch(query, options);
}

/**
 * Script de inicialización e indexación en lote hacia Typesense (para DevOps / Setup)
 */
export async function indexAllSpeciesToTypesense(
  config: TypesenseConfig = DEFAULT_TYPESENSE_CONFIG
): Promise<{ success: boolean; indexedCount: number; message: string }> {
  try {
    const baseUrl = `${config.protocol}://${config.host}:${config.port}`;
    const headers = {
      'X-TYPESENSE-API-KEY': config.apiKey,
      'Content-Type': 'application/json',
    };

    // 1. Crear colección si no existe
    await fetch(`${baseUrl}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(BOTANICAL_COLLECTION_SCHEMA),
    });

    // 2. Importar documentos en lote (JSONL)
    const jsonlPayload = BOTANICAL_DATABASE.map(doc => JSON.stringify(doc)).join('\n');
    const importRes = await fetch(
      `${baseUrl}/collections/${config.collectionName}/documents/import?action=upsert`,
      {
        method: 'POST',
        headers: {
          'X-TYPESENSE-API-KEY': config.apiKey,
          'Content-Type': 'text/plain',
        },
        body: jsonlPayload,
      }
    );

    if (importRes.ok) {
      return {
        success: true,
        indexedCount: BOTANICAL_DATABASE.length,
        message: `Se indexaron ${BOTANICAL_DATABASE.length} especies botánicas en Typesense con éxito.`,
      };
    } else {
      const errText = await importRes.text();
      return {
        success: false,
        indexedCount: 0,
        message: `Error importando a Typesense: ${errText}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      indexedCount: 0,
      message: `No se pudo contactar con Typesense: ${err?.message || err}`,
    };
  }
}

