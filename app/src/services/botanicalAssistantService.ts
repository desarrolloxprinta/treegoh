/**
 * Treegoh Botanical Assistant Service
 * Servicio conversacional inteligente para el compañero del santuario vegetal.
 * Conecta con OpenRouter (Claude / GPT) alimentado con la telemetría real del hogar:
 * plantas del usuario, lúmenes, orientación cardinal y filtro de seguridad ASPCA.
 * Cero emojis. Tipografía liviana.
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

export interface AssistantSanctuaryContext {
  userName: string;
  city: string;
  activeSpaceName: string;
  activeSpaceLux: number;
  activeSpaceOrientation: string;
  activeSpaceWindowDistance: string;
  spacesCount: number;
  plantsCount: number;
  plantsSummary: Array<{
    commonName: string;
    scientificName: string;
    nickname?: string;
    wateringStatus: string;
    daysUntilNextWatering: number;
    isPetSafe: boolean;
    spaceName: string;
  }>;
  hasPets: boolean;
  petTypes?: string[];
}

function parseAssistantJson(raw: string): {
  text: string;
  mood: string;
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
    return JSON.parse(slice);
  } catch (_e) {
    return null;
  }
}

/**
 * Fallback heurístico botánico conversacional y humano en caso de falta de red o error de API.
 * 100% Offline alimentado con el motor botánico local y los 36 síndromes clínicos fitosanitarios.
 * Lenguaje sencillo, sin jerga científica complicada, con consejos de tierra, maceta, posición y materiales caseros.
 */
function generateOfflineBotanicalReply(
  userQuery: string,
  context: AssistantSanctuaryContext,
  typesenseDoc?: any,
  monograph?: BibliaSpeciesMonograph | null,
  matchedSymptom?: BibliaSymptomEntry | null
): {
  text: string;
  mood: 'happy' | 'curious' | 'thirsty' | 'warning' | 'neutral';
  action?: AssistantAction;
  suggestedFollowUps: string[];
} {
  const q = userQuery.toLowerCase().trim();
  const hourNow = new Date().getHours();
  const isNight = hourNow < 7 || hourNow >= 20;

  // 1. Detección de orden de riego completado ("ya regué las plantas del salón", "he regado", etc.)
  if (
    q.includes('regué') ||
    q.includes('regue') ||
    q.includes('regadas') ||
    q.includes('he regado') ||
    q.includes('ya regué') ||
    q.includes('regar todas') ||
    q.includes('hidraté') ||
    q.includes('hidrate')
  ) {
    let targetSpace = context.activeSpaceName || 'Salón';
    const candidateSpaces = ['salón', 'salon', 'terraza', 'dormitorio', 'estudio', 'cocina', 'baño', 'bano', 'patio'];
    for (const cand of candidateSpaces) {
      if (q.includes(cand)) {
        targetSpace = cand.charAt(0).toUpperCase() + cand.slice(1);
        break;
      }
    }

    const plantsInTarget = context.plantsSummary.filter(
      p => p.spaceName.toLowerCase() === targetSpace.toLowerCase()
    );
    const count = plantsInTarget.length || context.plantsCount;

    return {
      text: `Perfecto, ${context.userName}. Ya dejé anotado que regaste tus **${count} plantas de ${targetSpace}**.\n\nUn consejo casero importante para la **maceta**: dentro de unos diez minutos revisa los platos o cubre-macetas de abajo y vacía el agua que haya sobrado. Si alguna maceta quedó muy pesada, ponle debajo una hoja de **papel de cocina absorbente doblado** unos minutos para que las raíces queden frescas y con buen aire.`,
      mood: 'happy',
      action: {
        type: 'water_all_in_space',
        spaceName: targetSpace,
        count,
      },
      suggestedFollowUps: ['¿Cómo sé cuándo volver a regar?', '¿Qué abono casero puedo usar?'],
    };
  }

  // 2. Consulta explícita sobre las plantas registradas del usuario ("cómo están mis plantas", "mis plantas", etc.)
  if (
    q.includes('mis plantas') ||
    q.includes('mi santuario') ||
    q.includes('cómo están mis') ||
    q.includes('como estan mis') ||
    q.includes('estado de mis')
  ) {
    const thirstyPlants = context.plantsSummary.filter(
      p => p.wateringStatus === 'necesita_riego' || p.daysUntilNextWatering <= 1
    );
    const hydratedPlants = context.plantsSummary.filter(
      p => p.wateringStatus === 'hidratada' || p.wateringStatus === 'optimo'
    );

    const thirstyNames = thirstyPlants.slice(0, 2).map(p => `**${p.commonName}**`).join(' y ');

    return {
      text: thirstyPlants.length > 0
        ? `Ahora mismo tienes **${hydratedPlants.length} plantas** bien de agua, pero conviene revisar a ${thirstyNames}${thirstyPlants.length > 2 ? ` y a otras ${thirstyPlants.length - 2} más` : ''}, que ya pueden tener la tierra seca.\n\nAntes de regarlas, haz la prueba casera del **palillo de madera** (de dientes o de brocheta): clávalo con cuidado por el borde de la maceta hasta abajo. Si sale limpio y sin tierra pegada, riega despacio con **agua que hayas dejado reposar en una jarra**; si sale con tierra húmeda pegada, espera un par de días más.`
        : `Tus **${context.plantsCount} plantas** están muy bien cuidadas y con la humedad de la tierra equilibrada hoy.\n\nAprovecha una vez por semana para **girar cada maceta un cuarto de vuelta** para que no se inclinen buscando la ventana, y pásales un **paño suave apenas humedecido con agua** por las hojas para quitar el polvo de casa.`,
      mood: thirstyPlants.length > 0 ? 'thirsty' : 'happy',
      action: {
        type: 'summary_status',
        spaceName: context.activeSpaceName,
      },
      suggestedFollowUps: ['¿Cómo aflojar la tierra si está dura?', '¿Cómo limpiar las hojas en casa?'],
    };
  }

  // 3. Saludo inicial o conversación abierta
  if (
    q === 'hola' ||
    q.startsWith('hola ') ||
    q.includes('buenos días') ||
    q.includes('buenos dias') ||
    q.includes('buenas tardes') ||
    q.includes('buenas noches') ||
    q.includes('cómo estás') ||
    q.includes('como estas') ||
    q.includes('qué tal') ||
    q.includes('que tal') ||
    q.includes('quién eres') ||
    q.includes('quien eres') ||
    q.includes('qué puedes hacer') ||
    q.includes('que puedes hacer')
  ) {
    return {
      text: `Hola, ${context.userName}. Qué gusto saludarte. Estoy aquí para ayudarte con tus plantas explicándote todo de forma sencilla y práctica: desde dónde colocar la **maceta**, cómo cuidar la **tierra**, hasta trucos con cosas que ya tienes en casa.\n\nCuéntame qué planta quieres que revisemos hoy o tómale una foto con la cámara (incluso si es de noche con la luz de casa, yo lo tendré en cuenta al analizarla).`,
      mood: 'happy',
      suggestedFollowUps: ['¿Por qué se secan las puntas de las hojas?', '¿Qué trucos caseros sirven para abonar?'],
    };
  }

  // 4. Síndrome fitosanitario clínico detectado o problemas foliares
  if (matchedSymptom || q.includes('amarill') || q.includes('mancha') || q.includes('cae') || q.includes('puntas') || q.includes('plaga') || q.includes('cochinilla') || q.includes('araña') || q.includes('bicho') || q.includes('seca') || q.includes('marron') || q.includes('marrón')) {
    const speciesIntro = typesenseDoc
      ? `En tu **${typesenseDoc.commonName}**, `
      : `Cuando una planta muestra este cambio en las hojas, `;

    const symptomName = matchedSymptom ? `este signo coincide con **${matchedSymptom.nombre}**.` : 'conviene fijarse en dónde empieza el cambio.';
    const lookArea = matchedSymptom?.donde_mirar ? `Revisa con buena luz natural: **${matchedSymptom.donde_mirar}**.` : '';

    return {
      text: `${speciesIntro}${symptomName}\n\n• **Si las hojas de abajo están amarillas o blanditas:** Suele ser exceso de humedad en el fondo de la maceta. Saca el plato decorativo, apoya la maceta sobre **papel de cocina absorbente o una toalla vieja** para escurrir el agua retenida, y haz 3 o 4 huecos suaves con un **palillo de brocheta** por el borde de la tierra para que entre aire fresco. Espolvorea una pizca de **canela en polvo** sobre la tierra si huele a humedad estancada.\n• **Si son puntas secas y marrones:** Falta de humedad ambiental o sales del agua corriente. Pon la maceta sobre un **plato con piedritas o tapones y un dedito de agua** (sin que el fondo toque el agua) y riega con **agua reposada de la noche anterior en una jarra**.\n• **Si ves puntitos o pelusa blanca (plaga):** Pasa con delicadeza un **bastoncillo o paño suave con agua tibia y 2 gotas de jabón neutro de platos**. ${lookArea}`,
      mood: 'warning',
      suggestedFollowUps: ['Quiero mostrarte una foto de la hoja', '¿Cada cuánto debo regarla?'],
    };
  }

  // 5. Consulta sobre una especie concreta del catálogo
  if (typesenseDoc) {
    const petPhrase = typesenseDoc.isPetSafe
      ? 'Además es una planta **totalmente segura si tienes perros o gatos en casa** (certificada por la ASPCA).'
      : 'Si tienes perros o gatos curiosos en casa, es mejor poner su maceta en una repisa alta o soporte porque si muerden las hojas les puede irritar la boca.';

    const lightAdvice = typesenseDoc.minLux <= 800
      ? 'Tolera muy bien rincones con luz contenida o indirecta suave.'
      : `Necesita un rincón luminoso con luz filtrada indirecta (entre **${typesenseDoc.minLux} y ${typesenseDoc.maxLux} lux**) a un paso de la ventana.`;

    const originText = monograph?.origen ? ` Es nativa de **${monograph.origen.split('.')[0]}**.` : '';

    return {
      text: `La **${typesenseDoc.commonName}** (*${typesenseDoc.scientificName}*) es una especie maravillosa.${originText}\n\n• **Dónde colocarla (Posición):** ${lightAdvice} Evita que el sol fuerte del mediodía le dé directo a través del cristal para no quemar las hojas. Gira la maceta un cuarto de vuelta cada 15 días.\n• **Riego y sustrato:** Necesita una maceta con orificios de drenaje y tierra suelta. Su pauta estimada es regar cada **${typesenseDoc.wateringIntervalDays} días**, pero comprueba siempre con el truco casero del **palillo de madera**: si sale seco y limpio, riega; si sale con tierra oscura pegada, espera.\n• **Mantenimiento casero:** Pasa un **paño suave apenas humedecido** por las hojas cada 15 días para retirar el polvo doméstico. ${petPhrase}`,
      mood: 'curious',
      suggestedFollowUps: [
        `¿Cómo sacar esquejes de ${typesenseDoc.commonName}?`,
        `¿Cuándo conviene cambiarla a una maceta mayor?`,
      ],
    };
  }

  // 6. Mascotas y plantas seguras en casa
  if (q.includes('gato') || q.includes('perro') || q.includes('mascota') || q.includes('tóxic') || q.includes('aspca')) {
    return {
      text: `Si tienes perros o gatos en casa, puedes tener plantas a su altura sin ninguna preocupación eligiendo especies que no les hacen daño aunque las mordisqueen: las **Calatheas**, las **Marantas**, las **Peperomias**, la **Planta del dinero china (Pilea)**, la **Palmera de salón** y el **Helecho de Boston** son 100% seguras.\n\nEn cambio, plantas como el **Poto, la Costilla de Adán (Monstera) o los Filodendros** les irritan la boca si las muerden. Para esas, el mejor truco casero es colocarlas en **macetas colgantes o estanterías altas**, o poner alrededor del borde de la maceta unas **piñas secas o cáscaras de cítricos (naranja o limón)**, cuyo olor hace que los gatos y perros no quieran escarbar la tierra.`,
      mood: 'warning',
      suggestedFollowUps: ['¿Qué plantas colgantes son fáciles de cuidar?', '¿Cómo evitar que mi mascota escarbe la maceta?'],
    };
  }

  // 7. Sustrato, tierra, maceta, abono casero o trasplante
  if (
    q.includes('abono') ||
    q.includes('fertiliz') ||
    q.includes('sustrato') ||
    q.includes('tierra') ||
    q.includes('maceta') ||
    q.includes('poda') ||
    q.includes('trasplant') ||
    q.includes('esqueje') ||
    q.includes('reproduc')
  ) {
    return {
      text: `Para que una planta esté feliz en casa, la **maceta y la tierra** hacen la mitad del trabajo:\n\n• **La Tierra (Sustrato):** Si notas que al regar el agua se queda estancada arriba o la tierra se ha puesto dura como un bloque, pincha suavemente la superficie cerca del borde con un **palillo de madera o un tenedor** sin dañar las raíces para que vuelva a entrar aire.\n• **La Maceta:** Asegúrate siempre de que tenga agujeros abajo. Si ves que las raíces ya asoman por debajo, pide una maceta apenas **2 o 3 dedos más ancha** que la actual (nunca una gigante de golpe, porque guardaría demasiada agua).\n• **Abonos caseros naturales:** Puedes hervir un par de **cáscaras de plátano** en un litro de agua, dejar que se enfríe por completo y regar con esa agua mezclada con agua normal una vez al mes para darle fuerza a las hojas y flores, o triturar **cáscaras de huevo limpias y secas** muy finitas sobre la tierra.`,
      mood: 'curious',
      suggestedFollowUps: ['¿Cómo hacer un esqueje en un vaso de agua?', '¿Qué hago si sale moho blanco en la tierra?'],
    };
  }

  // 8. Riego, humedad o trucos con agua en casa
  if (q.includes('riego') || q.includes('regar') || q.includes('agua') || q.includes('humedad')) {
    return {
      text: `El mejor truco para no fallar nunca con el riego lo tienes en la cocina: usa un **palillo de madera largo (de brocheta) o un palillo de dientes**.\n\nClávalo en la tierra hasta la mitad de la maceta y sácalo como cuando pruebas si un bizcocho está hecho: si sale con **tierra oscura pegada**, todavía tiene humedad abajo y no hace falta regar; si sale **limpio y seco**, riega despacio hasta que asome un poquito de agua por los agujeros de abajo y vacía el plato pasados 10 minutos.\n\nAdemás, si dejas **reposar el agua del grifo en una jarra abierta desde la noche anterior**, el cloro se evapora solo y el agua toma la temperatura de tu casa, evitando que se sequen las puntas de las hojas.`,
      mood: 'thirsty',
      suggestedFollowUps: ['¿Qué hago si me pasé de agua al regar?', '¿Cómo dar más humedad en días de calefacción?'],
    };
  }

  // 9. Luz de día vs luz artificial de noche y posición en casa
  if (q.includes('luz') || q.includes('lux') || q.includes('sol') || q.includes('sombra') || q.includes('ventana') || q.includes('noche')) {
    const nightNote = isNight
      ? `Como ahora mismo es de noche, recuerda que **las bombillas y lámparas normales de casa nos alumbran a nosotros, pero casi no alimentan a la planta** (además su luz cálida hace que las hojas se vean más amarillas de lo que son). `
      : '';

    return {
      text: `${nightNote}Para elegir la mejor **posición en casa**, piensa siempre en la claridad natural que entra por la ventana durante el día:\n\n• **Un truco casero para medir la luz:** Al mediodía, pon tu mano a unos 20 centímetros por encima de las hojas de la planta. Si tu mano dibuja una **sombra suave pero clara**, tiene muy buena luz; si casi **no se ve ninguna sombra**, ese rincón es demasiado oscuro y conviene acercar la maceta a uno o dos pasos de la ventana.\n• **Cortina como filtro:** Si a esa ventana le pega sol fuerte directo que quema las hojas, basta con correr un **visillo o cortina blanca fina** para transformar ese sol en una claridad suave perfecta.`,
      mood: 'curious',
      suggestedFollowUps: ['¿Qué plantas aguantan rincones con poca luz?', '¿Cada cuánto giro la maceta?'],
    };
  }

  // 10. Respuesta conversacional abierta y natural con enfoque casero
  return {
    text: `Es una muy buena duda. Cuidar una planta en casa se vuelve mucho más sencillo cuando nos fijamos en tres cosas prácticas: **que su tierra esté suelta y respire**, **que su maceta no acumule agua en el plato de abajo** y **que esté colocada donde le llegue claridad natural durante el día** lejos de corrientes o calefacción.\n\nCuéntame qué planta tienes delante o qué notas en sus hojas —o sácale una foto con la cámara, sea de día con luz natural o de noche con la luz de tu casa— y te doy soluciones fáciles con cosas que tienes a mano en casa.`,
    mood: 'curious',
    suggestedFollowUps: ['Quiero analizar una foto con la cámara', '¿Qué trucos caseros sirven para limpiar y cuidar hojas?'],
  };
}

/**
 * Consulta al Asistente Botánico con IA (OpenRouter Gemini 2.5 Flash / GPT-4o-mini)
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
    ? `Hora actual: ${hourNow}:00h (NOCHE). El usuario está en casa con luz artificial nocturna.`
    : `Hora actual: ${hourNow}:00h (DÍA). Hay luz natural diurna.`;

  // Contextualización estructurada del santuario
  const plantsInfo =
    context.plantsSummary.length > 0
      ? context.plantsSummary
          .map(
            p =>
              `- ${p.commonName}: ubicada en "${p.spaceName}", estado "${p.wateringStatus}", riego en ${p.daysUntilNextWatering}d, segura mascotas: ${p.isPetSafe ? 'SÍ' : 'NO'}`
          )
          .join('\n')
      : 'Sin plantas registradas aún.';

  const petInfo = context.hasPets
    ? `Hogar con mascotas (${(context.petTypes || ['mascota']).join(', ')}).`
    : 'Hogar sin mascotas.';

  // 1. Consulta sincrónica instantánea (0 ms) al motor botánico local y al corpus fitosanitario
  let groundingContext = '';
  let matchedSpeciesDoc: any = undefined;
  let matchedMonograph: BibliaSpeciesMonograph | null = null;
  let matchedSymptom: BibliaSymptomEntry | null = null;

  try {
    const searchRes = searchBotanicalSync(userQuery, { perPage: 2 });
    if (searchRes.hits.length > 0) {
      const topHit = searchRes.hits[0];
      const qLower = userQuery.toLowerCase();
      const comLower = (topHit.document.commonName || '').toLowerCase();
      const sciLower = (topHit.document.scientificName || '').toLowerCase();
      const genus = sciLower.split(/\s+/)[0] || '';
      const isDirectMatch =
        topHit.text_match >= 120 ||
        qLower.includes(comLower) ||
        (genus.length > 3 && qLower.includes(genus));

      if (isDirectMatch) {
        matchedSpeciesDoc = topHit.document;
        matchedMonograph = getSpeciesMonograph(matchedSpeciesDoc.scientificName, matchedSpeciesDoc.commonName);
      }
    }

    const clinicalHits = searchClinicalSymptomsSync(userQuery, 1);
    if (clinicalHits.length > 0) {
      matchedSymptom = clinicalHits[0];
    }

    const groundingLines: string[] = [];
    if (matchedSpeciesDoc) {
      const originNote = matchedMonograph?.origen ? ` Origen nativo: ${matchedMonograph.origen}.` : '';
      const variegationNote = matchedMonograph?.identificacion?.variegacion ? ` Nota de variegación: ${matchedMonograph.identificacion.variegacion.slice(0, 140)}...` : '';
      const careNote = matchedMonograph?.cuidados?.sustrato?.mezcla ? ` Sustrato ideal: ${matchedMonograph.cuidados.sustrato.mezcla}.` : '';
      groundingLines.push(
        `Referencia de la planta consultada de la enciclopedia botánica:\n` +
        `- ${matchedSpeciesDoc.commonName} (${matchedSpeciesDoc.scientificName}): Riego cada ${matchedSpeciesDoc.wateringIntervalDays} días, Rango lumínico: ${matchedSpeciesDoc.minLux} a ${matchedSpeciesDoc.maxLux} lux, Segura mascotas (ASPCA): ${matchedSpeciesDoc.isPetSafe ? 'SÍ' : 'NO'}.${originNote}${variegationNote}${careNote}`
      );
    }
    if (matchedSymptom) {
      const mainCause = matchedSymptom.causas?.[0];
      groundingLines.push(
        `Diagnóstico fitosanitario identificado (${matchedSymptom.id} - ${matchedSymptom.nombre}):\n` +
        `- Cómo se ve: ${matchedSymptom.como_se_ve}. Dónde mirar: ${matchedSymptom.donde_mirar}. Causa probable: ${mainCause?.causa || 'Desequilibrio hídrico o lumínico'}. Tratamiento clave: ${(mainCause?.tratamiento || []).slice(0, 2).join('; ')}`
      );
    }

    if (groundingLines.length > 0) {
      groundingContext = `\n${groundingLines.join('\n\n')}\n`;
    }
  } catch (_e) {}

  const systemInstructions = `Eres el compañero de plantas de Treegoh: hablas como una persona cercana, amable y muy práctica que explica cómo cuidar cualquier planta usando palabras sencillas de todos los días y trucos con cosas que cualquiera tiene en su casa.

REGLAS DE ORO QUE DEBES CUMPLIR SIEMPRE:
1. CERO TÉRMINOS CIENTÍFICOS DIFÍCILES: Está prohibido usar palabras técnicas o complicadas como "hipoxia radicular", "déficit de presión de vapor (VPD)", "clorosis intervenal", "filotaxis", "etiolación", "rafidios", "oxalato cálcico", "transpiración estomática" o "necrosis". Explícalo siempre con palabras simples: "las raíces no respiran porque hay mucha agua en el fondo", "el aire de casa está seco", "las hojas pierden color", "los tallos se estiran buscando la ventana".
2. PROHIBIDO EMPEZAR CON FICHAS TÉCNICAS: Nunca empieces con '# Nombre de Planta' ni fichas robóticas. Conversa de forma fluida y natural en 2 o 3 párrafos claros usando **negritas** para destacar lo importante.
3. PRIORIZA MATERIALES Y OBJETOS CASEROS: Siempre que des un consejo, solución o tratamiento, recomienda usar cosas que ya hay en una casa normal:
   - **Palillo de madera (de dientes o brocheta)** clavado en la tierra para saber si sigue húmeda por dentro antes de regar.
   - **Papel de cocina absorbente o una toalla vieja** debajo de la maceta para chupar el exceso de agua si se regó de más.
   - **Canela en polvo de cocina** espolvoreada en pequeños cortes o sobre la tierra húmeda para evitar hongos y moho blanco.
   - **Paño suave con agua tibia y una gotita de jabón neutro de lavar platos** (o un **bastoncillo de algodón**) para limpiar el polvo de las hojas o quitar bichitos como la cochinilla.
   - **Jarra con agua del grifo reposada de un día para otro** para que se vaya el cloro, o un **plato con piedritas o tapones de botella con un poquito de agua** debajo de la maceta para darle humedad sin mojar las raíces.
   - **Agua de cáscara de plátano hervida (ya fría) o cáscara de huevo triturada** como ayuda nutritiva casera.
4. INCLUYE CONSEJOS DE SUSTRATO (TIERRA), MACETA Y POSICIÓN:
   - Habla de la **tierra/sustrato** (si está suelta o dura, cómo airearla suavemente por el borde con un palillo).
   - Habla de la **maceta** (que tenga agujeros de drenaje, vaciar el agua del plato o cubre-maceta tras 10 minutos, o cuándo pide una maceta 2 dedos más ancha).
   - Habla de la **posición** (a cuántos pasos de la ventana ponerla, usar una cortina fina si da sol fuerte, alejarla de radiadores/aire acondicionado y girar la maceta un cuarto de vuelta cada semana).
5. ANÁLISIS LUMÍNICO INTELIGENTE (DÍA VS. NOCHE / LUZ ARTIFICIAL):
   - Ten muy en cuenta el momento actual (${lightingTimeContext}).
   - Recuerda que analizar o ver una planta de noche bajo la luz artificial de casa (bombillas cálidas que tiñen las hojas de tono amarillento y casi no alimentan a la planta) no es lo mismo que la luz natural del sol que entra por la ventana de día. Enséñale el truco casero de **poner la mano a 20 cm sobre la planta de día** para ver qué tan clara es la sombra que proyecta.
6. CERO EMOJIS. No menciones las estancias registradas del usuario ("Salón") salvo que pregunte por "mis plantas".
7. ACCIONES EN LA APP (solo cuando aplique):
   - Si dice que ya regó sus plantas, confirma con cariño e incluye "action": { "type": "water_all_in_space", "spaceName": "<espacio indicado o ${context.activeSpaceName}>" }.
   - Si pregunta cómo están sus plantas registradas, incluye "action": { "type": "summary_status" }.
   - En cualquier otro caso "action" debe ser null.
8. Contexto del usuario (úsalo solo si pregunta por sus plantas):
   - Usuario: ${context.userName} (${context.city}). ${petInfo}
   - Plantas:\n${plantsInfo}${groundingContext}
9. Devuelve SIEMPRE un objeto JSON válido (sin texto fuera del JSON):
{
  "text": "Tu respuesta conversacional sencilla, humana y con trucos caseros...",
  "mood": "happy" | "curious" | "thirsty" | "warning" | "neutral",
  "action": null,
  "suggestedFollowUps": ["Pregunta corta 1", "Pregunta corta 2"]
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

  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu;

  const normalizeLlmContent = (rawContent: unknown) => {
    if (!rawContent || typeof rawContent !== 'string') return null;
    const parsed = parseAssistantJson(rawContent);

    if (parsed && parsed.text) {
      const validMoods = ['happy', 'curious', 'thirsty', 'warning', 'neutral'];
      const resolvedMood = validMoods.includes(parsed.mood) ? (parsed.mood as any) : 'neutral';
      const validActionTypes = ['water_all_in_space', 'water_plant', 'summary_status'];
      const action =
        parsed.action && validActionTypes.includes((parsed.action as any).type)
          ? parsed.action
          : undefined;

      return {
        text: String(parsed.text).replace(emojiRegex, '').trim(),
        mood: resolvedMood,
        action,
        suggestedFollowUps:
          Array.isArray(parsed.suggestedFollowUps) && parsed.suggestedFollowUps.length > 0
            ? parsed.suggestedFollowUps.slice(0, 2).map(s => String(s).replace(emojiRegex, '').trim())
            : [],
      };
    }

    const cleanText = rawContent
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(emojiRegex, '')
      .trim();
    if (!cleanText) return null;
    return {
      text: cleanText,
      mood: 'neutral' as const,
      action: undefined,
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

  // 1. Cadena de modelos estables, avanzados y económicos en OpenRouter (Gemini 2.5 Flash y GPT-4o-mini primero)
  if (apiKey && apiKey.startsWith('sk-or-')) {
    const modelChain = Array.from(
      new Set([
        configuredModel,
        'google/gemini-2.5-flash',
        'openai/gpt-4o-mini',
        'google/gemini-2.0-flash-001',
        'google/gemini-2.0-flash-exp:free',
        'meta-llama/llama-3.3-70b-instruct:free',
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
              temperature: 0.65,
              max_tokens: 700,
            }),
          },
          20000
        );
        if (!response.ok) continue;
        const data = await response.json();
        const normalized = normalizeLlmContent(data?.choices?.[0]?.message?.content);
        if (normalized) return normalized;
      } catch (_e) {
        // probar siguiente modelo
      }
    }
  }

  // 2. Proveedor LLM gratuito compatible con OpenAI (sin API key) como respaldo
  try {
    const response = await fetchWithTimeout(
      'https://text.pollinations.ai/openai',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: chatMessages,
          temperature: 0.65,
        }),
      },
      20000
    );
    if (response.ok) {
      const data = await response.json();
      const normalized = normalizeLlmContent(data?.choices?.[0]?.message?.content);
      if (normalized) return normalized;
    }
  } catch (_e) {}

  // 3. Respaldo conversacional offline enriquecido con la enciclopedia local y síntomas fitosanitarios
  return generateOfflineBotanicalReply(
    userQuery,
    context,
    matchedSpeciesDoc,
    matchedMonograph,
    matchedSymptom
  );
}
