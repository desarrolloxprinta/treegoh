/**
 * Treegoh Botanical Assistant Service — Motor Conversacional de Alta Precisión
 *
 * Conecta con OpenRouter (Gemini 2.5 Flash / GPT-4o-mini / Claude 3.5 Haiku)
 * alimentado con la telemetría real del santuario del usuario:
 * inventario de plantas con IDs, apodos, estado hídrico, lux del espacio,
 * orientación solar y filtro de seguridad ASPCA para mascotas.
 *
 * Cumplimiento estricto:
 * - Cero emojis en todo el código y respuestas.
 * - Respuestas directas, inteligentes, naturales y contextualizadas (cero plantillas robóticas).
 */

import { searchBotanicalSync } from './typesenseService';
import {
  getSpeciesMonograph,
  searchClinicalSymptomsSync,
  BibliaSpeciesMonograph,
  BibliaSymptomEntry,
} from './botanicalEncyclopediaService';

export interface AssistantAction {
  type: 'water_all_in_space' | 'water_plant' | 'summary_status';
  spaceName?: string;
  plantId?: string;
  plantName?: string;
  count?: number;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  mood?: 'neutral' | 'happy' | 'thirsty' | 'warning' | 'listening' | 'curious';
  timestamp: string;
  action?: AssistantAction;
  suggestedFollowUps?: string[];
  imageUri?: string;
  isVoiceNote?: boolean;
  audioDurationSec?: number;
}

export interface AssistantSanctuaryPlantSummary {
  id?: string;
  commonName: string;
  scientificName: string;
  nickname?: string;
  wateringStatus: string;
  daysUntilNextWatering: number;
  isPetSafe: boolean;
  spaceName: string;
  healthAssessment?: string;
}

export interface AssistantSanctuaryContext {
  userName: string;
  city: string;
  activeSpaceName: string;
  activeSpaceLux: number;
  activeSpaceOrientation: string;
  activeSpaceWindowDistance: string;
  spacesCount: number;
  plantsCount: number;
  plantsSummary: AssistantSanctuaryPlantSummary[];
  hasPets: boolean;
  petTypes?: string[];
}

const EMOJI_STRIP_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu;

function normalizeAccents(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Busca si el usuario está mencionando una planta específica de su propio santuario
 */
function findMentionedUserPlant(
  userQuery: string,
  plants: AssistantSanctuaryPlantSummary[]
): AssistantSanctuaryPlantSummary | null {
  if (!plants || plants.length === 0) return null;
  const qNorm = normalizeAccents(userQuery);
  if (qNorm.length < 3) return null;

  for (const p of plants) {
    const commonNorm = normalizeAccents(p.commonName);
    const sciNorm = normalizeAccents(p.scientificName);
    const nickNorm = p.nickname ? normalizeAccents(p.nickname) : '';

    if (commonNorm && qNorm.includes(commonNorm)) return p;
    if (nickNorm && nickNorm.length >= 3 && qNorm.includes(nickNorm)) return p;
    if (sciNorm && qNorm.includes(sciNorm)) return p;

    // Coincidencia por palabra clave principal del nombre (ej: "monstera", "ficus", "cuna", "pachira", "maranta")
    const tokens = [
      ...commonNorm.split(/\s+/),
      ...sciNorm.split(/\s+/),
      ...(nickNorm ? nickNorm.split(/\s+/) : []),
    ].filter(t => t.length >= 4 && !['planta', 'arbol', 'flor', 'hoja', 'rincon'].includes(t));

    for (const tk of tokens) {
      if (qNorm.includes(tk)) {
        return p;
      }
    }
  }

  return null;
}

/**
 * Detecta si la consulta del usuario implica una acción directa en la app (regar una planta o un espacio)
 */
function detectUserIntentAction(
  userQuery: string,
  context: AssistantSanctuaryContext,
  matchedUserPlant: AssistantSanctuaryPlantSummary | null
): AssistantAction | undefined {
  const qNorm = normalizeAccents(userQuery);

  const isWateringAction =
    qNorm.includes('ya regue') ||
    qNorm.includes('he regado') ||
    qNorm.includes('acabo de regar') ||
    qNorm.includes('marca regad') ||
    qNorm.includes('marcar regad') ||
    qNorm.includes('regue ') ||
    qNorm.includes('regar todas') ||
    qNorm.includes('hidrate ');

  if (isWateringAction) {
    if (matchedUserPlant && !qNorm.includes('todas')) {
      return {
        type: 'water_plant',
        plantId: matchedUserPlant.id,
        plantName: matchedUserPlant.commonName,
        spaceName: matchedUserPlant.spaceName,
      };
    }

    let targetSpace = context.activeSpaceName || 'Salón';
    const candidateSpaces = [
      'salon',
      'terraza',
      'dormitorio',
      'estudio',
      'cocina',
      'bano',
      'patio',
      'balcon',
      'despacho',
    ];
    for (const cand of candidateSpaces) {
      if (qNorm.includes(cand)) {
        const matchInSummary = context.plantsSummary.find(p =>
          normalizeAccents(p.spaceName).includes(cand)
        );
        targetSpace = matchInSummary
          ? matchInSummary.spaceName
          : cand.charAt(0).toUpperCase() + cand.slice(1);
        break;
      }
    }

    const count =
      context.plantsSummary.filter(
        p => normalizeAccents(p.spaceName) === normalizeAccents(targetSpace)
      ).length || context.plantsCount;

    return {
      type: 'water_all_in_space',
      spaceName: targetSpace,
      count,
    };
  }

  return undefined;
}

function parseAssistantJson(raw: string): {
  text: string;
  mood?: string;
  action?: AssistantAction;
  suggestedFollowUps?: string[];
} | null {
  if (!raw) return null;
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  const slice = raw.slice(firstBrace, lastBrace + 1);
  try {
    const obj = JSON.parse(slice);
    if (obj && typeof obj.text === 'string') {
      return obj;
    }
    return null;
  } catch (_e) {
    // Si el modelo incluyó saltos de línea sin escapar dentro de "text", extraer el campo text con regex seguro
    const textMatch = slice.match(/"text"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"mood"|,\s*"action"|,\s*"suggestedFollowUps"|\})/);
    if (textMatch && textMatch[1]) {
      return {
        text: textMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
        mood: 'neutral',
      };
    }
    return null;
  }
}

/**
 * Motor conversacional local de alta precisión (para modo sin conexión o fallback instantáneo).
 * Analiza la planta específica del usuario, la enciclopedia de 173+ especies y los 36 síndromes clínicos.
 */
function generateOfflineBotanicalReply(
  userQuery: string,
  context: AssistantSanctuaryContext,
  matchedUserPlant: AssistantSanctuaryPlantSummary | null,
  detectedAction?: AssistantAction,
  typesenseDoc?: any,
  monograph?: BibliaSpeciesMonograph | null,
  matchedSymptom?: BibliaSymptomEntry | null
): {
  text: string;
  mood: 'happy' | 'curious' | 'thirsty' | 'warning' | 'neutral';
  action?: AssistantAction;
  suggestedFollowUps: string[];
} {
  const qNorm = normalizeAccents(userQuery);

  // 1. Acción de riego individual o de espacio completo
  if (detectedAction?.type === 'water_plant' && matchedUserPlant) {
    return {
      text: `Hecho, ${context.userName}. He marcado tu **${matchedUserPlant.commonName}**${
        matchedUserPlant.nickname ? ` («${matchedUserPlant.nickname}»)` : ''
      } en **${matchedUserPlant.spaceName}** como recién hidratada y he activado su escudo de protección de 18 horas.\n\nRecuerda vaciar el agua sobrante del plato inferior pasados 10 minutos para que las raíces respiren sin encharcarse.`,
      mood: 'happy',
      action: detectedAction,
      suggestedFollowUps: [
        `¿Cuándo abonar mi ${matchedUserPlant.commonName}?`,
        '¿Qué otra planta necesita riego hoy?',
      ],
    };
  }

  if (detectedAction?.type === 'water_all_in_space') {
    const sp = detectedAction.spaceName || context.activeSpaceName;
    const cnt = detectedAction.count || context.plantsCount;
    return {
      text: `Perfecto, ${context.userName}. He actualizado el estado de las **${cnt} plantas de ${sp}** como hidratadas hoy.\n\nEn unos 10 minutos revisa si quedó agua acumulada en los platos o cubre-macetas para retirarla y mantener el sustrato oxigenado.`,
      mood: 'happy',
      action: detectedAction,
      suggestedFollowUps: ['¿Cómo está el resto de mi santuario?', '¿Cuándo toca fertilizar?'],
    };
  }

  // 2. El usuario pregunta por una planta específica que TIENE en su santuario
  if (matchedUserPlant) {
    const p = matchedUserPlant;
    const waterStateText =
      p.wateringStatus === 'necesita_riego' || p.daysUntilNextWatering <= 0
        ? 'le toca **riego hoy mismo** (el sustrato ya agotó su reserva de humedad)'
        : p.wateringStatus === 'hidratada'
        ? `está **recién hidratada** y su próximo riego será en **${p.daysUntilNextWatering} días**`
        : `tiene humedad equilibrada y su próximo riego estimado es en **${p.daysUntilNextWatering} días**`;

    const healthNote = p.healthAssessment ? `\n\n• **Estado clínico actual:** ${p.healthAssessment}` : '';
    const petNote = p.isPetSafe
      ? 'Es una especie **segura para mascotas** (certificada por la ASPCA).'
      : context.hasPets
      ? 'Ten en cuenta que **no es apta si tus mascotas la mordisquean**, por lo que conviene mantenerla elevada.'
      : '';

    // Si además pregunta por un síntoma en esa planta (amarilla, seca, caída, plaga...)
    if (
      matchedSymptom ||
      qNorm.includes('amarill') ||
      qNorm.includes('marron') ||
      qNorm.includes('seca') ||
      qNorm.includes('caid') ||
      qNorm.includes('mancha') ||
      qNorm.includes('plaga')
    ) {
      const symptomTitle = matchedSymptom ? matchedSymptom.nombre : 'estrés foliar';
      const causeText =
        matchedSymptom?.causas?.[0]?.causa ||
        'desajuste entre la humedad del fondo de la maceta y la transpiración de las hojas';
      const treatmentList =
        matchedSymptom?.causas?.[0]?.tratamiento?.slice(0, 2).join(' ') ||
        'Comprueba con el dedo o un palillo si los primeros 4 cm de tierra están secos antes de volver a regar y asegúrate de que el plato inferior no retenga agua.';

      return {
        text: `He revisado la ficha de tu **${p.commonName}**${
          p.nickname ? ` («${p.nickname}»)` : ''
        } ubicada en **${p.spaceName}**. Lo que describes apunta a **${symptomTitle}** (${causeText}).\n\n• **Estado en tu santuario:** Ahora mismo ${waterStateText}.${healthNote}\n• **Qué hacer hoy:** ${treatmentList}`,
        mood: 'warning',
        suggestedFollowUps: [
          `Ya regué mi ${p.commonName}`,
          `¿Tiene buena luz en ${p.spaceName}?`,
        ],
      };
    }

    return {
      text: `Tu **${p.commonName}** (*${p.scientificName}*)${
        p.nickname ? `, a la que llamas **«${p.nickname}»**,` : ''
      } está ubicada en **${p.spaceName}** (~${context.activeSpaceLux.toLocaleString()} Lux, orientación ${
        context.activeSpaceOrientation
      }) y ahora mismo ${waterStateText}.${healthNote}${
        monograph?.cuidados?.sustrato?.mezcla
          ? `\n\n• **Sustrato ideal:** ${monograph.cuidados.sustrato.mezcla}.`
          : ''
      }${petNote ? `\n• **Seguridad en casa:** ${petNote}` : ''}`,
      mood: p.wateringStatus === 'necesita_riego' ? 'thirsty' : 'happy',
      suggestedFollowUps: [
        `Marca regada mi ${p.commonName}`,
        `¿Cómo podar o limpiar mi ${p.commonName}?`,
      ],
    };
  }

  // 3. Consulta sobre el estado general de sus plantas / qué regar hoy
  if (
    qNorm.includes('mis plantas') ||
    qNorm.includes('mi santuario') ||
    qNorm.includes('que regar') ||
    qNorm.includes('toca regar') ||
    qNorm.includes('quien tiene sed') ||
    qNorm.includes('como estan') ||
    qNorm.includes('resumen')
  ) {
    const thirsty = context.plantsSummary.filter(
      p => p.wateringStatus === 'necesita_riego' || p.daysUntilNextWatering <= 0
    );
    const soon = context.plantsSummary.filter(
      p => p.wateringStatus !== 'necesita_riego' && p.daysUntilNextWatering === 1
    );
    const healthyCount = Math.max(0, context.plantsCount - thirsty.length);

    if (thirsty.length > 0) {
      const listStr = thirsty
        .map(
          p =>
            `• **${p.commonName}**${p.nickname ? ` («${p.nickname}»)` : ''} en *${p.spaceName}*${
              p.healthAssessment ? ` — ${p.healthAssessment}` : ''
            }`
        )
        .join('\n');

      return {
        text: `En tu santuario de **${context.city}** tienes **${healthyCount} plantas hidratadas** y **${thirsty.length} ${
          thirsty.length === 1 ? 'especie que pide agua hoy' : 'especies que piden agua hoy'
        }**:\n\n${listStr}${
          soon.length > 0
            ? `\n\nAdemás, **${soon.map(s => s.commonName).join(' y ')}** necesitarán riego mañana.`
            : ''
        }\n\nCuando termines de hidratarlas, puedes decirme *"ya regué las plantas de ${context.activeSpaceName}"* y las actualizaré por ti.`,
        mood: 'thirsty',
        action: { type: 'summary_status', spaceName: context.activeSpaceName },
        suggestedFollowUps: [
          `Ya regué las plantas de ${context.activeSpaceName}`,
          '¿Cómo saber si el sustrato drena bien?',
        ],
      };
    }

    return {
      text: `Todas tus **${context.plantsCount} plantas** en **${context.activeSpaceName}** están al día de riego y en equilibrio hídrico.\n\nCon los **~${context.activeSpaceLux.toLocaleString()} Lux** (orientación ${context.activeSpaceOrientation}) de tu espacio, es un buen momento para revisar si alguna hoja acumula polvo o girar un cuarto de vuelta las macetas más cercanas a la ventana.`,
      mood: 'happy',
      action: { type: 'summary_status', spaceName: context.activeSpaceName },
      suggestedFollowUps: [
        '¿Qué planta nueva me recomiendas para este espacio?',
        '¿Cada cuánto debo abonar en esta época?',
      ],
    };
  }

  // 4. Consulta sobre una especie de la enciclopedia (173+ especies)
  if (typesenseDoc) {
    const minL = typesenseDoc.minLux || 800;
    const maxL = typesenseDoc.maxLux || 3500;
    const userLux = context.activeSpaceLux || 3200;
    const fitsSpace =
      userLux >= minL * 0.8 && userLux <= maxL * 1.3
        ? `Se adapta muy bien a los **~${userLux.toLocaleString()} Lux** de tu **${context.activeSpaceName}**.`
        : userLux < minL
        ? `Tu **${context.activeSpaceName}** (~${userLux.toLocaleString()} Lux) tiene algo menos de luz de la que prefiere (${minL}–${maxL} Lux), por lo que conviene situarla a menos de 1 metro de la ventana.`
        : `En tu **${context.activeSpaceName}** (~${userLux.toLocaleString()} Lux) tendrá luz de sobra; tamízala con un visillo si entra sol directo al mediodía.`;

    const substrateMix =
      monograph?.cuidados?.sustrato?.mezcla ||
      'sustrato universal aireado con un 20% de perlita y corteza para facilitar el drenaje';
    const originInfo = monograph?.origen ? ` Originaria de ${monograph.origen.split('.')[0]}.` : '';
    const petInfo = typesenseDoc.isPetSafe
      ? 'Es **100% segura para mascotas** según la ASPCA.'
      : 'Precaución si convives con perros o gatos: contiene compuestos irritantes si mastican las hojas.';

    return {
      text: `**${typesenseDoc.commonName}** (*${typesenseDoc.scientificName}*) — ${typesenseDoc.trait || 'especie botánica de interior'}.${originInfo}\n\n• **Luz en tu hogar:** Requiere entre **${minL.toLocaleString()} y ${maxL.toLocaleString()} Lux**. ${fitsSpace}\n• **Riego:** Cada **${typesenseDoc.wateringIntervalDays || 7} días** aproximadamente, dejando secar la capa superficial entre riegos.\n• **Sustrato y maceta:** Prefiere ${substrateMix}.\n• **Convivencia:** ${petInfo}`,
      mood: 'curious',
      suggestedFollowUps: [
        `¿Qué problemas de hojas suele tener la ${typesenseDoc.commonName}?`,
        `¿Cómo multiplicar una ${typesenseDoc.commonName}?`,
      ],
    };
  }

  // 5. Diagnóstico clínico fitosanitario (36 síndromes o palabras clave de síntomas)
  if (matchedSymptom) {
    const mainCause = matchedSymptom.causas?.[0];
    const secondCause = matchedSymptom.causas?.[1];
    const treatments = (mainCause?.tratamiento || []).slice(0, 3).map(t => `• ${t}`).join('\n');

    return {
      text: `Por lo que describes, el cuadro coincide con **${matchedSymptom.nombre}**.\n\n**Cómo confirmarlo:** ${matchedSymptom.como_se_ve} Fíjate especialmente en: *${matchedSymptom.donde_mirar}*.\n\n**Causa principal:** ${
        mainCause?.causa || 'Desequilibrio de humedad o ventilación'
      }${secondCause ? ` (o en segundo lugar, ${secondCause.causa.toLowerCase()})` : ''}.\n\n**Pasos recomendados:**\n${treatments}`,
      mood: 'warning',
      suggestedFollowUps: [
        'Quiero abrir la cámara para enseñarte la hoja',
        '¿Debo cortar las hojas dañadas o dejarlas?',
      ],
    };
  }

  // 6. Recomendación personalizada para el espacio actual del usuario
  if (
    qNorm.includes('recomiend') ||
    qNorm.includes('que planta pongo') ||
    qNorm.includes('que planta compro') ||
    qNorm.includes('poca luz') ||
    qNorm.includes('mucha luz') ||
    qNorm.includes('principiante')
  ) {
    const lux = context.activeSpaceLux || 3200;
    const isLowLight = qNorm.includes('poca luz') || qNorm.includes('oscur') || lux < 1200;
    const mustBePetSafe = context.hasPets || qNorm.includes('mascota') || qNorm.includes('gato') || qNorm.includes('perro');

    if (isLowLight) {
      return {
        text: mustBePetSafe
          ? `Para un rincón de **luz baja o contenida** y que además sea **100% segura para tus mascotas**, las tres mejores elecciones son:\n\n• **Aspidistra (*Aspidistra elatior*):** Prácticamente indestructible, tolera desde 400 Lux y ambientes secos.\n• **Calathea Lancifolia o Maranta Fascinator:** Viven muy bien con luz filtrada suave y cierran sus hojas de noche.\n• **Chamaedorea (Palmera de Salón):** Aporta volumen verde elegante en sombras luminosas y no es tóxica.`
          : `Para zonas con **poca luz natural** (< 1.000 Lux), estas especies mantienen su follaje impecable sin estirarse:\n\n• **Zamioculcas (*Planta ZZ*):** Almacena agua en sus rizomas y tolera rincones alejados de la ventana regándola solo cada 12–15 días.\n• **Sansevieria (*Lengua de Suegra*):** Purifica el aire de noche y resiste tanto sombra como olvidos de riego.\n• **Aglaonema Silver Bay:** Hojas plateadas muy ornamentales adaptadas a luz interior baja.`,
        mood: 'curious',
        suggestedFollowUps: [
          '¿Cada cuánto se riegan en un rincón con poca luz?',
          '¿Cómo están mis plantas actuales?',
        ],
      };
    }

    return {
      text: `Para los **~${lux.toLocaleString()} Lux** (orientación **${context.activeSpaceOrientation}**) de tu **${context.activeSpaceName}**${
        mustBePetSafe ? ' cuidando la seguridad de tus mascotas' : ''
      }, te recomiendo:\n\n${
        mustBePetSafe
          ? `• **Pachira Acuática:** Tronco trenzado escultural, segura para mascotas y feliz con luz indirecta brillante.\n• **Pilea Peperomioides:** Hojas circulares modernas, muy fácil de reproducir por hijuelos.\n• **Helecho de Boston o Peperomia Obtusifolia:** Excelentes para mesas o estanterías con humedad moderada.`
          : `• **Monstera Deliciosa o Adansonii:** Con ~${lux.toLocaleString()} Lux desarrollará hojas fenestradas grandes y vigorosas.\n• **Ficus Lyrata o Ficus Elástica Borgoña:** Aprovechan muy bien la orientación ${context.activeSpaceOrientation} a 1–2 metros del cristal.\n• **Strelitzia Nicolai (Ave del Paraíso):** Ideal si buscas una planta arquitectónica de porte alto.`
      }`,
      mood: 'curious',
      suggestedFollowUps: [
        '¿Qué sustrato necesitan estas especies?',
        '¿Cómo están mis plantas actuales?',
      ],
    };
  }

  // 7. Saludo o consulta abierta contextualizada con los datos reales de su santuario
  const thirstyCount = context.plantsSummary.filter(
    p => p.wateringStatus === 'necesita_riego' || p.daysUntilNextWatering <= 0
  ).length;
  const sampleNames = context.plantsSummary
    .slice(0, 3)
    .map(p => `**${p.commonName}**`)
    .join(', ');

  return {
    text: `Hola, ${context.userName}. Tengo sincronizado tu santuario en **${context.city}** con tus **${
      context.plantsCount
    } plantas** (${sampleNames || 'tu colección'}) en **${context.activeSpaceName}** (~${context.activeSpaceLux.toLocaleString()} Lux, orientación ${
      context.activeSpaceOrientation
    }).${
      thirstyCount > 0
        ? ` Ahora mismo tienes **${thirstyCount} ${
            thirstyCount === 1 ? 'planta que necesita riego hoy' : 'plantas que necesitan riego hoy'
          }**.`
        : ' Todas tus especies tienen su hidratación al día.'
    }\n\nPuedes preguntarme por cualquiera de tus plantas por su nombre, pedirme que marque un riego completado, describirme cualquier síntoma en una hoja o abrir la cámara para analizarla juntos.`,
    mood: 'happy',
    suggestedFollowUps: [
      thirstyCount > 0 ? '¿Qué plantas tengo que regar hoy?' : '¿Cómo están mis plantas hoy?',
      `Ya regué las plantas de ${context.activeSpaceName}`,
    ],
  };
}

/**
 * Consulta al Asistente Botánico con IA (OpenRouter Gemini 2.5 Flash / GPT-4o-mini / Claude 3.5 Haiku)
 */
export async function queryBotanicalAssistant(
  userQuery: string,
  arg2: AssistantSanctuaryContext | AssistantMessage[],
  arg3?: AssistantSanctuaryContext
): Promise<{
  text: string;
  mood: 'neutral' | 'happy' | 'thirsty' | 'warning' | 'listening' | 'curious';
  action?: AssistantAction;
  suggestedFollowUps: string[];
}> {
  const context: AssistantSanctuaryContext = Array.isArray(arg2)
    ? (arg3 as AssistantSanctuaryContext)
    : (arg2 as AssistantSanctuaryContext);

  const history: AssistantMessage[] = Array.isArray(arg2) ? arg2 : [];
  const apiKey =
    process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    '';

  const configuredModel =
    process.env.EXPO_PUBLIC_OPENROUTER_MODEL ||
    process.env.OPENROUTER_DEFAULT_MODEL ||
    'google/gemini-2.5-flash';

  const hourNow = new Date().getHours();
  const isNight = hourNow < 7 || hourNow >= 20;
  const lightingTimeContext = isNight
    ? `Hora actual: ${hourNow}:00h (Noche, luz artificial interior).`
    : `Hora actual: ${hourNow}:00h (Día, luz solar natural).`;

  // 1. Reconocimiento instantáneo en el inventario del usuario, la enciclopedia (173+ especies) y los 36 síndromes
  const matchedUserPlant = findMentionedUserPlant(userQuery, context.plantsSummary);
  const detectedAction = detectUserIntentAction(userQuery, context, matchedUserPlant);

  let matchedSpeciesDoc: any = undefined;
  let matchedMonograph: BibliaSpeciesMonograph | null = null;
  let matchedSymptom: BibliaSymptomEntry | null = null;
  let groundingContext = '';

  try {
    const searchTarget = matchedUserPlant
      ? `${matchedUserPlant.commonName} ${matchedUserPlant.scientificName}`
      : userQuery;
    const searchRes = searchBotanicalSync(searchTarget, { perPage: 2 });
    if (searchRes.hits.length > 0) {
      const topHit = searchRes.hits[0];
      const qNorm = normalizeAccents(searchTarget);
      const comNorm = normalizeAccents(topHit.document.commonName || '');
      const sciNorm = normalizeAccents(topHit.document.scientificName || '');
      const genus = sciNorm.split(/\s+/)[0] || '';
      const isMatch =
        Boolean(matchedUserPlant) ||
        topHit.text_match >= 45 ||
        (comNorm.length >= 3 && qNorm.includes(comNorm)) ||
        (genus.length > 3 && qNorm.includes(genus));

      if (isMatch) {
        matchedSpeciesDoc = topHit.document;
        matchedMonograph = getSpeciesMonograph(
          matchedSpeciesDoc.scientificName,
          matchedSpeciesDoc.commonName
        );
      }
    }

    const clinicalHits = searchClinicalSymptomsSync(userQuery, 2);
    if (clinicalHits.length > 0) {
      matchedSymptom = clinicalHits[0];
    }

    const groundingLines: string[] = [];
    if (matchedUserPlant) {
      groundingLines.push(
        `PLANTA DEL USUARIO MENCIONADA EN LA CONSULTA:\n` +
          `- ID: "${matchedUserPlant.id || ''}", Nombre: ${matchedUserPlant.commonName} (${matchedUserPlant.scientificName})${
            matchedUserPlant.nickname ? `, Apodo: "${matchedUserPlant.nickname}"` : ''
          }, Espacio: "${matchedUserPlant.spaceName}", Estado hídrico: "${
            matchedUserPlant.wateringStatus
          }", Próximo riego en: ${matchedUserPlant.daysUntilNextWatering} días, Segura mascotas: ${
            matchedUserPlant.isPetSafe ? 'SÍ' : 'NO'
          }${
            matchedUserPlant.healthAssessment
              ? `, Diagnóstico previo: "${matchedUserPlant.healthAssessment}"`
              : ''
          }.`
      );
    }
    if (matchedSpeciesDoc) {
      const careNote = matchedMonograph?.cuidados?.sustrato?.mezcla
        ? ` Sustrato óptimo: ${matchedMonograph.cuidados.sustrato.mezcla}.`
        : '';
      groundingLines.push(
        `FICHA BOTÁNICA DE REFERENCIA:\n` +
          `- ${matchedSpeciesDoc.commonName} (${matchedSpeciesDoc.scientificName}): Riego cada ${matchedSpeciesDoc.wateringIntervalDays} días, Demanda lumínica: ${matchedSpeciesDoc.minLux}–${matchedSpeciesDoc.maxLux} Lux, Segura mascotas (ASPCA): ${
            matchedSpeciesDoc.isPetSafe ? 'SÍ' : 'NO'
          }.${careNote}`
      );
    }
    if (matchedSymptom) {
      const mainCause = matchedSymptom.causas?.[0];
      groundingLines.push(
        `SÍNDROME CLÍNICO RELACIONADO (${matchedSymptom.nombre}):\n` +
          `- Síntoma visual: ${matchedSymptom.como_se_ve}. Dónde inspeccionar: ${matchedSymptom.donde_mirar}. Causa principal: ${
            mainCause?.causa || 'Desequilibrio hídrico/lumínico'
          }. Acción correctiva: ${(mainCause?.tratamiento || []).slice(0, 2).join('; ')}`
      );
    }

    if (groundingLines.length > 0) {
      groundingContext = `\n\nDATOS TÉCNICOS DETECTADOS PARA ESTA CONSULTA:\n${groundingLines.join('\n')}`;
    }
  } catch (_e) {}

  const plantsInfo =
    context.plantsSummary.length > 0
      ? context.plantsSummary
          .map(
            p =>
              `- [ID:${p.id || p.commonName}] ${p.commonName}${
                p.nickname ? ` ("${p.nickname}")` : ''
              } en "${p.spaceName}": estado="${p.wateringStatus}", próximo riego=${
                p.daysUntilNextWatering
              }d, segura_mascotas=${p.isPetSafe ? 'SÍ' : 'NO'}${
                p.healthAssessment ? `, nota="${p.healthAssessment}"` : ''
              }`
          )
          .join('\n')
      : 'Sin plantas registradas.';

  const petInfo = context.hasPets
    ? `Convive con mascotas (${(context.petTypes || ['mascota']).join(', ')}).`
    : 'Hogar sin mascotas.';

  const systemInstructions = `Eres Treegoh, el botánico experto e inteligente del hogar de ${context.userName} en ${context.city}.
Tu personalidad es perceptiva, cálida, directa y culta pero accesible: respondes exactamente a lo que el usuario pregunta sin rodeos, sin sonar robótico y sin repetir muletillas ni listas prefabricadas.

CONTEXTO REAL DEL SANTUARIO DEL USUARIO:
- Usuario: ${context.userName} | Ciudad: ${context.city} | ${lightingTimeContext}
- Espacio activo: "${context.activeSpaceName}" (~${context.activeSpaceLux} Lux, orientación ${context.activeSpaceOrientation}, distancia ventana ${context.activeSpaceWindowDistance}).
- Mascotas: ${petInfo}
- Inventario actual de plantas (${context.plantsCount}):
${plantsInfo}${groundingContext}

DIRECTRICES DE INTELIGENCIA CONVERSACIONAL:
1. RESPONDE DIRECTAMENTE A LA INTENCIÓN DEL USUARIO:
   - Si pregunta por una de sus plantas o qué regar hoy, usa los datos reales de su inventario (menciona sus nombres, apodos, ubicación y días de riego reales).
   - Si describe un síntoma (hojas amarillas, puntas secas, caída, manchas, plagas, falta de crecimiento), haz un diagnóstico diferencial preciso para esa especie concreta y explica qué hacer paso a paso.
   - Si hace una pregunta breve o conversacional, responde con agilidad y naturalidad sin soltar manuales innecesarios.
   - Nunca repitas de memoria una lista fija de utensilios de cocina salvo que un consejo casero puntual realmente aporte valor a ese problema concreto.
2. FORMATO Y ESTILO:
   - 100% en español natural. CERO emojis.
   - Usa **negritas** para resaltar conceptos clave o nombres de especies y viñetas limpias (•) solo cuando enumeres pasos o plantas.
3. RESPUESTA ESTRUCTURADA:
   Devuelve un objeto JSON válido con esta estructura exacta:
   {
     "text": "Tu respuesta directa, inteligente y natural...",
     "mood": "happy" | "curious" | "thirsty" | "warning" | "neutral",
     "suggestedFollowUps": ["Siguiente pregunta útil 1", "Siguiente pregunta útil 2"]
   }`;

  const conversationHistory = history.slice(-8).map(m => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.text,
  }));

  const chatMessages = [
    { role: 'system', content: systemInstructions },
    ...conversationHistory,
    { role: 'user', content: userQuery },
  ];

  const normalizeLlmContent = (rawContent: unknown) => {
    if (!rawContent || typeof rawContent !== 'string') return null;
    const parsed = parseAssistantJson(rawContent);

    if (parsed && parsed.text) {
      const validMoods = ['happy', 'curious', 'thirsty', 'warning', 'neutral'];
      const resolvedMood =
        parsed.mood && validMoods.includes(parsed.mood) ? (parsed.mood as any) : 'neutral';

      return {
        text: String(parsed.text).replace(EMOJI_STRIP_REGEX, '').trim(),
        mood: resolvedMood,
        action: detectedAction || parsed.action,
        suggestedFollowUps:
          Array.isArray(parsed.suggestedFollowUps) && parsed.suggestedFollowUps.length > 0
            ? parsed.suggestedFollowUps
                .slice(0, 2)
                .map(s => String(s).replace(EMOJI_STRIP_REGEX, '').trim())
            : [],
      };
    }

    const cleanText = rawContent
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(EMOJI_STRIP_REGEX, '')
      .trim();
    if (!cleanText || cleanText.startsWith('{')) return null;

    return {
      text: cleanText,
      mood: 'neutral' as const,
      action: detectedAction,
      suggestedFollowUps: [],
    };
  };

  const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => controller?.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller?.signal as any });
    } finally {
      clearTimeout(timer);
    }
  };

  if (apiKey && apiKey.startsWith('sk-or-')) {
    const modelChain = Array.from(
      new Set([
        configuredModel,
        'google/gemini-2.5-flash',
        'openai/gpt-4o-mini',
        'anthropic/claude-3.5-haiku',
        'google/gemini-2.0-flash-001',
      ])
    );

    for (const model of modelChain) {
      try {
        const response = await fetchWithTimeout(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
              'HTTP-Referer': 'https://treegoh.app',
              'X-Title': 'Treegoh Botanical Assistant',
            },
            body: JSON.stringify({
              model,
              messages: chatMessages,
              temperature: 0.55,
              max_tokens: 650,
            }),
          },
          9500
        );
        if (!response.ok) continue;
        const data = await response.json();
        const normalized = normalizeLlmContent(data?.choices?.[0]?.message?.content);
        if (normalized) return normalized;
      } catch (_e) {
        // Probar siguiente modelo de la cadena de baja latencia
      }
    }
  }

  return generateOfflineBotanicalReply(
    userQuery,
    context,
    matchedUserPlant,
    detectedAction,
    matchedSpeciesDoc,
    matchedMonograph,
    matchedSymptom
  );
}
