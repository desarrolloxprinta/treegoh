export type CircadianPhaseId =
  | 'dawn'
  | 'morning'
  | 'midday'
  | 'sunset'
  | 'night';

export interface CircadianQuote {
  text: string;
  author: string;
}

export interface CircadianThemeConfig {
  id: CircadianPhaseId;
  label: string;
  subLabel: string;
  gradientColors: [string, string, string, ...string[]];
  ambientOrbTop: string;
  ambientOrbCenter: string;
  ambientOrbBottom: string;
  sunElevationAngle: number; // 0° en horizonte a 75° en mediodía
  sunAzimuthDegrees: number;
  statusBadgeColor: string;
  quote: CircadianQuote;
  biologicalNote: string;
}

const CIRCADIAN_QUOTES: Record<CircadianPhaseId, CircadianQuote[]> = {
  dawn: [
    {
      text: 'Cada mañana las hojas se orientan de nuevo hacia el horizonte.',
      author: 'Observación Botánica',
    },
    {
      text: 'El amanecer abre los estomas y renueva el intercambio de vida.',
      author: 'Fisiología Vegetal',
    },
  ],
  morning: [
    {
      text: 'Este es un día maravilloso; nunca antes había visto uno igual.',
      author: 'Maya Angelou',
    },
    {
      text: 'La luz de la mañana es la caricia más pura para el verdor de tu hogar.',
      author: 'Sabiduría Biofílica',
    },
  ],
  midday: [
    {
      text: 'La naturaleza no se apresura; sin embargo, todo florece a su debido tiempo.',
      author: 'Lao Tsé',
    },
    {
      text: 'El sol en el cenit culmina la síntesis de luz y quietud.',
      author: 'Ritmo Circadiano',
    },
  ],
  sunset: [
    {
      text: 'La memoria afectiva trae la luz de otros días a nuestro alrededor.',
      author: 'Thomas Moore',
    },
    {
      text: 'Al caer la tarde, las plantas suspiran y reposan su transpiración.',
      author: 'Guía Fenológica',
    },
    {
      text: 'El ocaso tiñe de ámbar cada rincón, recordándonos la belleza de la calma.',
      author: 'Santuario Treegoh',
    },
  ],
  night: [
    {
      text: 'En el silencio nocturno, las raíces continúan bebiendo en calma.',
      author: 'Metabolismo CAM',
    },
    {
      text: 'La noche es el tiempo donde la vida respira hacia adentro.',
      author: 'Reposo Botánico',
    },
  ],
};

export function getCircadianTheme(
  forcedPhase?: CircadianPhaseId,
  date: Date = new Date(),
  _coords?: { latitude?: number; longitude?: number }
): CircadianThemeConfig {
  let phase: CircadianPhaseId;

  if (forcedPhase) {
    phase = forcedPhase;
  } else {
    const hours = date.getHours() + date.getMinutes() / 60;
    if (hours >= 6 && hours < 8.5) {
      phase = 'dawn';
    } else if (hours >= 8.5 && hours < 13) {
      phase = 'morning';
    } else if (hours >= 13 && hours < 17.5) {
      phase = 'midday';
    } else if (hours >= 17.5 && hours < 21) {
      phase = 'sunset';
    } else {
      phase = 'night';
    }
  }

  const quotes = CIRCADIAN_QUOTES[phase];
  const quote = quotes[Math.floor(Math.random() * quotes.length)] || quotes[0];

  switch (phase) {
    case 'dawn':
      return {
        id: 'dawn',
        label: 'Amanecer Dorado',
        subLabel: '6:00 AM – 8:30 AM · Despertar de estomas',
        gradientColors: ['#3B5266', '#4E6E85', '#6C8FA6', '#A3B5BC'],
        ambientOrbTop: 'rgba(235, 186, 122, 0.28)',
        ambientOrbCenter: 'rgba(100, 154, 185, 0.24)',
        ambientOrbBottom: 'rgba(240, 204, 156, 0.30)',
        sunElevationAngle: 15,
        sunAzimuthDegrees: 85,
        statusBadgeColor: '#F7D070',
        quote,
        biologicalNote: 'Luz difusa de baja intensidad. Momento óptimo para hidratar sin choque térmico.',
      };

    case 'morning':
      // Referencia 1: Azul Matinal Sereno (TIDE Morning 11:05 AM)
      return {
        id: 'morning',
        label: 'Mañana Serena',
        subLabel: '8:30 AM – 1:00 PM · Fotosíntesis activa',
        gradientColors: ['#34566E', '#46708E', '#5B8CAE', '#7CA6C2'],
        ambientOrbTop: 'rgba(125, 185, 215, 0.32)',
        ambientOrbCenter: 'rgba(92, 148, 178, 0.26)',
        ambientOrbBottom: 'rgba(178, 208, 224, 0.28)',
        sunElevationAngle: 45,
        sunAzimuthDegrees: 125,
        statusBadgeColor: '#93C5FD',
        quote,
        biologicalNote: 'Pico de asimilación de fotones azules y activación de clorofila A.',
      };

    case 'midday':
      // Referencia: Luz Cenital Diurna / Verde Mineral Sabiduría Botánica
      return {
        id: 'midday',
        label: 'Luz Cenital',
        subLabel: '1:00 PM – 5:30 PM · Máxima irradiancia',
        gradientColors: ['#2D5242', '#3D6B57', '#50856E', '#6DA188'],
        ambientOrbTop: 'rgba(255, 248, 220, 0.36)',
        ambientOrbCenter: 'rgba(134, 239, 172, 0.28)',
        ambientOrbBottom: 'rgba(215, 232, 210, 0.30)',
        sunElevationAngle: 68,
        sunAzimuthDegrees: 180,
        statusBadgeColor: '#86EFAC',
        quote,
        biologicalNote: 'Vigila la radiación directa en ventanas orientadas al Sur.',
      };

    case 'sunset':
      // Referencia 2: Ocaso Rojizo, Teja y Ámbar Cálido (TIDE Good Day 5:46 PM)
      return {
        id: 'sunset',
        label: 'Ocaso Cálido',
        subLabel: '5:30 PM – 9:00 PM · Crepúsculo botánico',
        gradientColors: ['#443B4F', '#634A52', '#8C5858', '#BD6E5D', '#D99177'],
        ambientOrbTop: 'rgba(138, 92, 126, 0.28)',
        ambientOrbCenter: 'rgba(202, 98, 76, 0.32)',
        ambientOrbBottom: 'rgba(235, 142, 106, 0.38)',
        sunElevationAngle: 12,
        sunAzimuthDegrees: 255,
        statusBadgeColor: '#F97316',
        quote,
        biologicalNote: 'El sol se inclina. Las hojas reducen transpiración y se preparan para la noche.',
      };

    case 'night':
    default:
      // Referencia 4: Azul Noche Botánico Sereno (No negro de inicio para que el 80% del Asistente destaque al cambiar)
      return {
        id: 'night',
        label: 'Reposo Nocturno',
        subLabel: '9:00 PM – 6:00 AM · Respiración y calma',
        gradientColors: ['#263244', '#314159', '#3E526E', '#2C3B50'],
        ambientOrbTop: 'rgba(96, 125, 165, 0.24)',
        ambientOrbCenter: 'rgba(65, 92, 128, 0.28)',
        ambientOrbBottom: 'rgba(85, 115, 152, 0.24)',
        sunElevationAngle: -25,
        sunAzimuthDegrees: 0,
        statusBadgeColor: '#C4B5FD',
        quote,
        biologicalNote: 'Fase oscura fotosintética. Plantas CAM absorben CO₂ y purifican el aire.',
      };
  }
}

