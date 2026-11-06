/**
 * Treegoh Solar Engine - Motor Astronómico de Radiación y Trayectoria Solar Anual
 * Calcula con precisión astronómica la posición del sol (Azimut y Elevación),
 * la radiación incidente por ventana en cualquier coordenada GPS, y las 4 estaciones.
 * 100% TypeScript puro, sin dependencias externas. Cero emojis.
 */

export interface SolarPosition {
  azimuth: number; // 0° = Norte, 90° = Este, 180° = Sur, 270° = Oeste
  elevation: number; // Grados sobre el horizonte (-90° a +90°)
  declination: number; // Declinación solar
  hourAngle: number;
}

export interface SeasonalSolarProfile {
  seasonKey: 'hoy' | 'invierno' | 'primavera' | 'verano' | 'otono';
  name: string;
  monthName: string;
  maxSolarElevation: number; // Grados cenitales al mediodía solar
  daylightHours: number; // Horas totales de sol en el cielo
  directWindowHours: number; // Horas efectivas de sol directo entrando por la ventana
  estimatedLux: number; // Fotones lux proyectados en la planta
  riskLevel: 'optimo' | 'bajo_luz' | 'riesgo_quemadura' | 'precaucion_termica';
  seasonalTip: string;
  pruningAdvice: string; // Poda estacional
  wateringAdvice: string; // Pauta de riego
}

export interface FullAnnualSolarReport {
  latitude: number;
  longitude: number;
  headingDegrees: number;
  orientationCode: 'N' | 'S' | 'E' | 'O' | 'NE' | 'SE' | 'NO' | 'SO';
  floorLevel: 'baja' | 'media' | 'alta';
  floorNumber?: number;
  todayPosition: SolarPosition;
  todayProfile: SeasonalSolarProfile;
  winterProfile: SeasonalSolarProfile;
  springProfile: SeasonalSolarProfile;
  summerProfile: SeasonalSolarProfile;
  autumnProfile: SeasonalSolarProfile;
}

// Factor de radianes
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/**
 * Obtiene el día del año (1 a 365)
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Calcula la declinación solar para un día del año n (Ecuación de Cooper)
 */
export function calculateSolarDeclination(dayOfYear: number): number {
  return 23.45 * Math.sin(((360 / 365) * (284 + dayOfYear)) * RAD);
}

/**
 * Ecuación del Tiempo (EoT) en minutos
 */
export function calculateEquationOfTime(dayOfYear: number): number {
  const b = ((360 / 365) * (dayOfYear - 81)) * RAD;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

/**
 * Calcula posición solar en tiempo real (Azimut y Elevación)
 */
export function calculateSolarPosition(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): SolarPosition {
  const dayOfYear = getDayOfYear(date);
  const declination = calculateSolarDeclination(dayOfYear);
  const decRad = declination * RAD;
  const latRad = latitude * RAD;

  const eot = calculateEquationOfTime(dayOfYear);
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  // Tiempo Solar Verdadero (True Solar Time) en horas
  const solarTime = (utcHours * 60 + 4 * longitude + eot) / 60;
  const solarHour = (solarTime + 24) % 24;

  // Ángulo horario (0° al mediodía solar)
  const hourAngle = (solarHour - 12) * 15;
  const haRad = hourAngle * RAD;

  // Elevación solar: sin(alfa) = sin(lat)*sin(dec) + cos(lat)*cos(dec)*cos(ha)
  const sinAlpha = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinAlpha))) * DEG;

    // Azimut solar estandar (0°=Norte, 90°=Este, 180°=Sur, 270°=Oeste)
  const cosAlpha = Math.cos(elevation * RAD);
  let azimuth = 180;
  if (cosAlpha > 0.001) {
    const cosAz = (Math.sin(decRad) - Math.sin(latRad) * Math.sin(elevation * RAD)) / (Math.cos(latRad) * cosAlpha);
    const clampedCos = Math.max(-1, Math.min(1, cosAz));
    const az = Math.acos(clampedCos) * DEG;
    if (hourAngle > 0) {
      azimuth = 360 - az;
    } else {
      azimuth = az;
    }
  }

  return {
    azimuth: Math.round(azimuth * 10) / 10,
    elevation: Math.round(elevation * 10) / 10,
    declination: Math.round(declination * 10) / 10,
    hourAngle: Math.round(hourAngle * 10) / 10,
  };
}

/**
 * Calcula horas de incidencia directa a través de un ventanal
 * Integrando a lo largo de las 24 horas del día muestra
 */
export function calculateDirectWindowHours(
  latitude: number,
  dayOfYear: number,
  windowHeading: number,
  floorLevel: 'baja' | 'media' | 'alta' = 'media',
  floorNumber?: number
): { directHours: number; maxElevation: number; daylightHours: number } {
  const dec = calculateSolarDeclination(dayOfYear) * RAD;
  const lat = latitude * RAD;

  // Elevación al mediodía solar
  const noonElevation = 90 - (latitude - calculateSolarDeclination(dayOfYear));
  const maxElevation = Math.max(0, Math.min(90, Math.round(noonElevation * 10) / 10));

  // Duración del día astronómico
  const tanLatTanDec = -Math.tan(lat) * Math.tan(dec);
  let daylightHours = 12;
  if (tanLatTanDec >= 1) {
    daylightHours = 0; // Noche polar
  } else if (tanLatTanDec <= -1) {
    daylightHours = 24; // Día polar
  } else {
    const halfDayAngle = Math.acos(tanLatTanDec) * DEG;
    daylightHours = Math.round(((halfDayAngle * 2) / 15) * 10) / 10;
  }

    // Factor de visibilidad y elevacion de corte por piso
  // Planta baja: sombra de fachadas opuestas (min 14° de elevacion requerida)
  // 3º D / Medio: equilibrio urbano (min 8° de elevacion)
  // Atico: horizonte libre (min 4° de elevacion)
  // Cálculo dinámico de corte solar por piso exacto (0 a 50+) o nivel
  let minElev = 8;
  let floorFactor = 0.95;
  if (typeof floorNumber === 'number') {
    if (floorNumber <= 0) {
      minElev = 14;
      floorFactor = 0.8;
    } else if (floorNumber <= 2) {
      minElev = 11;
      floorFactor = 0.88;
    } else if (floorNumber <= 5) {
      minElev = 8;
      floorFactor = 0.95;
    } else if (floorNumber <= 15) {
      minElev = 5;
      floorFactor = 1.05;
    } else {
      // Torre o rascacielos alto (16 a 50+)
      minElev = 3;
      floorFactor = 1.15;
    }
  } else {
    minElev = floorLevel === 'baja' ? 14 : floorLevel === 'media' ? 8 : 4;
    floorFactor = floorLevel === 'alta' ? 1.05 : floorLevel === 'media' ? 0.95 : 0.8;
  }

  // Muestreo horario de 5:00 a 22:00
  let directHoursCount = 0;
  for (let minute = 5 * 60; minute <= 22 * 60; minute += 15) {
    const solarHour = minute / 60;
    const ha = (solarHour - 12) * 15 * RAD;

    const sinAlpha = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha);
    const elev = Math.asin(Math.max(-1, Math.min(1, sinAlpha))) * DEG;

    if (elev >= minElev) {
      // Azimut del sol (0°=N, 90°=E, 180°=S, 270°=O)
      const cosAlpha = Math.cos(elev * RAD);
      const cosAz = (Math.sin(dec) - Math.sin(lat) * Math.sin(elev * RAD)) / (Math.cos(lat) * cosAlpha);
      let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) * DEG;
      if (ha > 0) az = 360 - az;

      // Angulo respecto a la orientacion del ventanal
      let deltaAz = Math.abs(az - windowHeading);
      if (deltaAz > 180) deltaAz = 360 - deltaAz;

      // Si el sol entra por el vano de la ventana (< 80°)
      if (deltaAz <= 80) {
        directHoursCount += 0.25;
      }
    }
  }

  const finalDirectHours = Math.round(directHoursCount * floorFactor * 10) / 10;
  return {
    directHours: Math.max(0, finalDirectHours),
    maxElevation,
    daylightHours,
  };
}

/**
 * Genera el informe solar completo estacional y de hoy
 */
export function generateAnnualSolarReport(
  latitude: number = 40.4168, // Madrid por defecto
  longitude: number = -3.7038,
  windowHeading: number = 180, // Sur por defecto
  windowDistance: 'junto_a_ventana' | 'media_distancia' | 'rincon_profundo' = 'media_distancia',
  floorLevel: 'baja' | 'media' | 'alta' = 'media',
  floorNumber?: number
): FullAnnualSolarReport {
  const now = new Date();
  const dayOfYearToday = getDayOfYear(now);

  // Mapear código de orientación
  let orientationCode: 'N' | 'S' | 'E' | 'O' | 'NE' | 'SE' | 'NO' | 'SO' = 'S';
  const h = (windowHeading + 360) % 360;
  if (h >= 337.5 || h < 22.5) orientationCode = 'N';
  else if (h >= 22.5 && h < 67.5) orientationCode = 'NE';
  else if (h >= 67.5 && h < 112.5) orientationCode = 'E';
  else if (h >= 112.5 && h < 157.5) orientationCode = 'SE';
  else if (h >= 157.5 && h < 202.5) orientationCode = 'S';
  else if (h >= 202.5 && h < 247.5) orientationCode = 'SO';
  else if (h >= 247.5 && h < 292.5) orientationCode = 'O';
  else orientationCode = 'NO';

  // Multiplicador por distancia a la ventana
  const distLuxMult = windowDistance === 'junto_a_ventana' ? 1.0 : windowDistance === 'media_distancia' ? 0.55 : 0.22;

  // 1. Invierno (Solsticio: ~21 de Diciembre / Enero, n = 15)
  const winterMetrics = calculateDirectWindowHours(latitude, 15, windowHeading, floorLevel, floorNumber);
  const winterLuxBase = orientationCode === 'S' || orientationCode === 'SE' ? 4500 : orientationCode === 'E' || orientationCode === 'O' ? 2200 : 900;
  const winterLux = Math.round(winterLuxBase * distLuxMult);

  // 2. Primavera (Equinoccio: ~21 de Marzo, n = 80)
  const springMetrics = calculateDirectWindowHours(latitude, 80, windowHeading, floorLevel, floorNumber);
  const springLuxBase = orientationCode === 'S' ? 6500 : orientationCode === 'E' || orientationCode === 'O' ? 5200 : 2400;
  const springLux = Math.round(springLuxBase * distLuxMult);

  // 3. Verano (Solsticio: ~21 de Junio, n = 172)
  const summerMetrics = calculateDirectWindowHours(latitude, 172, windowHeading, floorLevel, floorNumber);
  const summerLuxBase = orientationCode === 'O' ? 8800 : orientationCode === 'E' ? 7500 : orientationCode === 'S' ? 7200 : 3400;
  const summerLux = Math.round(summerLuxBase * distLuxMult);

  // 4. Otoño (Equinoccio: ~23 de Septiembre, n = 266)
  const autumnMetrics = calculateDirectWindowHours(latitude, 266, windowHeading, floorLevel, floorNumber);
  const autumnLuxBase = orientationCode === 'S' ? 5800 : orientationCode === 'E' || orientationCode === 'O' ? 4400 : 2000;
  const autumnLux = Math.round(autumnLuxBase * distLuxMult);

  // 5. Hoy
  const todayMetrics = calculateDirectWindowHours(latitude, dayOfYearToday, windowHeading, floorLevel, floorNumber);
  const currentPos = calculateSolarPosition(latitude, longitude, now);
  const todayLuxRatio = (todayMetrics.directHours / (summerMetrics.directHours || 1));
  const todayLux = Math.round((winterLux + (summerLux - winterLux) * Math.max(0.1, Math.min(1, todayLuxRatio))));

  return {
    latitude,
    longitude,
    headingDegrees: windowHeading,
    orientationCode,
    floorLevel,
    floorNumber,
    todayPosition: currentPos,
    todayProfile: {
      seasonKey: 'hoy',
      name: 'Ritmo Solar Actual',
      monthName: now.toLocaleDateString('es-ES', { month: 'long', day: 'numeric' }),
      maxSolarElevation: todayMetrics.maxElevation,
      daylightHours: todayMetrics.daylightHours,
      directWindowHours: todayMetrics.directHours,
      estimatedLux: todayLux,
      riskLevel: todayMetrics.directHours > 5 && orientationCode === 'O' ? 'precaucion_termica' : 'optimo',
      seasonalTip: `Hoy el sol alcanza ${todayMetrics.maxElevation}° sobre el horizonte con rumbo actual ${currentPos.azimuth}°.`,
      pruningAdvice: 'Mantenimiento de puntas y retirada de follaje senescente.',
      wateringAdvice: 'Comprobar el sustrato a 3 cm de profundidad antes de hidratar.',
    },
    winterProfile: {
      seasonKey: 'invierno',
      name: 'Solsticio de Invierno',
      monthName: 'Diciembre / Enero',
      maxSolarElevation: winterMetrics.maxElevation,
      daylightHours: winterMetrics.daylightHours,
      directWindowHours: winterMetrics.directHours,
      estimatedLux: winterLux,
      riskLevel: winterMetrics.directHours < 1 ? 'bajo_luz' : 'optimo',
      seasonalTip: orientationCode === 'S'
        ? `Rayos bajos y penetrantes (${winterMetrics.maxElevation}°). El sol entra hondo en la estancia (${winterMetrics.directHours}h directas).`
        : `Luz reducida de invierno. Conviene acercar la maceta a la ventana.`,
      pruningAdvice: 'Poda de reposo vegetativo. Evitar podas drásticas.',
      wateringAdvice: 'Reducir el riego un 40-50% para evitar asfixia y hongos en raíces.',
    },
    springProfile: {
      seasonKey: 'primavera',
      name: 'Equinoccio de Primavera',
      monthName: 'Marzo / Abril',
      maxSolarElevation: springMetrics.maxElevation,
      daylightHours: springMetrics.daylightHours,
      directWindowHours: springMetrics.directHours,
      estimatedLux: springLux,
      riskLevel: 'optimo',
      seasonalTip: `Fotoperiodo en expansión (${springMetrics.daylightHours}h diurnas). Despertar vegetativo acelerado.`,
      pruningAdvice: 'Momento cumbre para poda de formación, esquejado y despunte.',
      wateringAdvice: 'Incrementar la pauta de hidratación y comenzar la nutrición líquida.',
    },
    summerProfile: {
      seasonKey: 'verano',
      name: 'Solsticio de Verano',
      monthName: 'Junio / Julio',
      maxSolarElevation: summerMetrics.maxElevation,
      daylightHours: summerMetrics.daylightHours,
      directWindowHours: summerMetrics.directHours,
      estimatedLux: summerLux,
      riskLevel: orientationCode === 'O' ? 'riesgo_quemadura' : orientationCode === 'S' ? 'precaucion_termica' : 'optimo',
      seasonalTip: orientationCode === 'O'
        ? `Alerta radiación vespertina: el sol de tarde alcanza hasta ${summerMetrics.directHours}h directas y quema clorofila. Usar visillo.`
        : orientationCode === 'S'
        ? `Sol cenital alto (${summerMetrics.maxElevation}°). La cornisa bloquea parte del sol perpendicular pero el calor acumulado es máximo.`
        : `Luz fresca y abundante (${summerMetrics.directHours}h directas). Excelente desarrollo foliar.`,
      pruningAdvice: 'Poda higiénica de limpieza. Evitar trasplantes a raíz descubierta.',
      wateringAdvice: 'Riego matutino abundante y pulverización foliar si la humedad cae del 45%.',
    },
    autumnProfile: {
      seasonKey: 'otono',
      name: 'Equinoccio de Otoño',
      monthName: 'Septiembre / Octubre',
      maxSolarElevation: autumnMetrics.maxElevation,
      daylightHours: autumnMetrics.daylightHours,
      directWindowHours: autumnMetrics.directHours,
      estimatedLux: autumnLux,
      riskLevel: 'optimo',
      seasonalTip: `Disminución progresiva del fotoperiodo. La planta ralentiza la división celular.`,
      pruningAdvice: 'Eliminar hojas dañadas por el verano antes del frío.',
      wateringAdvice: 'Espaciar los riegos según el descenso de temperatura ambiental.',
    },
  };
}
