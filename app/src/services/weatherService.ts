import * as Location from 'expo-location';

export type WeatherConditionType = 'lluvia' | 'sol' | 'viento' | 'nublado' | 'despejado';

export interface WeatherData {
  condition: WeatherConditionType;
  temperature: number;
  humidity: number;
  windSpeed: number;
  cityName: string;
  description: string;
  botanicalAdvice: string;
  isRaining: boolean;
  isWindy: boolean;
  isSunny: boolean;
  fetchedAt: string;
}

const DEFAULT_CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  madrid: { lat: 40.4168, lon: -3.7038 },
  barcelona: { lat: 41.3851, lon: 2.1734 },
  valencia: { lat: 39.4699, lon: -0.3763 },
  sevilla: { lat: 37.3891, lon: -5.9845 },
  bilbao: { lat: 43.263, lon: -2.935 },
  bogota: { lat: 4.711, lon: -74.0721 },
  mexico: { lat: 19.4326, lon: -99.1332 },
  cdmx: { lat: 19.4326, lon: -99.1332 },
  buenos_aires: { lat: -34.6037, lon: -58.3816 },
  santiago: { lat: -33.4489, lon: -70.6693 },
  lima: { lat: -12.0464, lon: -77.0428 },
};

let cachedWeather: WeatherData | null = null;
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos

function mapWmoCodeToCondition(code: number, windSpeed: number, isDay: number): {
  condition: WeatherConditionType;
  description: string;
  botanicalAdvice: string;
} {
  // Lluvia / precipitaciones
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) {
    return {
      condition: 'lluvia',
      description: code >= 95 ? 'Tormenta eléctrica' : code >= 63 ? 'Lluvia intensa' : 'Lluvia suave',
      botanicalAdvice: 'Lluvia exterior: la humedad relativa ambiental se eleva. El sustrato retiene más agua; espacia los riegos.',
    };
  }

  // Viento notable (> 22 km/h)
  if (windSpeed >= 22) {
    return {
      condition: 'viento',
      description: `Ráfagas de viento (${Math.round(windSpeed)} km/h)`,
      botanicalAdvice: 'Viento activo: protege las plantas cercanas a ventanas abiertas para evitar rotura foliar y desecación.',
    };
  }

  // Despejado / Sol
  if (code === 0 || code === 1) {
    if (isDay) {
      return {
        condition: 'sol',
        description: 'Cielo despejado y soleado',
        botanicalAdvice: 'Sol pleno: vigila el efecto lupa del cristal en ventanas al Sur para prevenir quemaduras en hojas tiernas.',
      };
    }
    return {
      condition: 'despejado',
      description: 'Noche despejada y estrellada',
      botanicalAdvice: 'Noche en calma: las plantas inician su fase oscura de respiración y absorción pasiva.',
    };
  }

  // Nublado / Niebla
  return {
    condition: 'nublado',
    description: code >= 45 ? 'Niebla o bruma' : 'Cielo cubierto',
    botanicalAdvice: 'Luz difusa equilibrada: condiciones ideales de fotosíntesis sin estrés térmico para tus plantas.',
  };
}

export async function fetchLiveWeather(
  cityNameOrCoords?: string | { latitude?: number; longitude?: number }
): Promise<WeatherData> {
  const now = Date.now();
  if (cachedWeather && now - lastFetchTimestamp < CACHE_TTL_MS) {
    return cachedWeather;
  }

  let lat = 40.4168; // Madrid por defecto
  let lon = -3.7038;
  let resolvedCityName = 'Madrid';

  // 1. Intentar coordenadas explícitas
  if (
    typeof cityNameOrCoords === 'object' &&
    cityNameOrCoords?.latitude &&
    cityNameOrCoords?.longitude
  ) {
    lat = cityNameOrCoords.latitude;
    lon = cityNameOrCoords.longitude;
  } else if (typeof cityNameOrCoords === 'string' && cityNameOrCoords.trim().length > 0) {
    resolvedCityName = cityNameOrCoords.trim();
    const cityKey = resolvedCityName.toLowerCase().replace(/\s+/g, '_');
    if (DEFAULT_CITY_COORDINATES[cityKey]) {
      lat = DEFAULT_CITY_COORDINATES[cityKey].lat;
      lon = DEFAULT_CITY_COORDINATES[cityKey].lon;
    }
  } else {
    // 2. Intentar geolocalización nativa mediante expo-location
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (loc?.coords) {
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        }
      }
    } catch (_e) {
      // Usar Madrid como fallback seguro
    }
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();

    const current = data?.current || {};
    const code = Number(current.weather_code ?? 0);
    const wind = Number(current.wind_speed_10m ?? 8);
    const isDay = Number(current.is_day ?? 1);
    const temp = Math.round(Number(current.temperature_2m ?? 21));
    const hum = Math.round(Number(current.relative_humidity_2m ?? 55));

    const { condition, description, botanicalAdvice } = mapWmoCodeToCondition(code, wind, isDay);

    const result: WeatherData = {
      condition,
      temperature: temp,
      humidity: hum,
      windSpeed: Math.round(wind),
      cityName: resolvedCityName,
      description,
      botanicalAdvice,
      isRaining: condition === 'lluvia',
      isWindy: condition === 'viento',
      isSunny: condition === 'sol',
      fetchedAt: new Date().toISOString(),
    };

    cachedWeather = result;
    lastFetchTimestamp = now;
    return result;
  } catch (_e) {
    // Fallback botánico elegante si no hay conexión a internet
    const fallback: WeatherData = {
      condition: 'despejado',
      temperature: 22,
      humidity: 50,
      windSpeed: 10,
      cityName: resolvedCityName,
      description: 'Tiempo sereno',
      botanicalAdvice: 'Microclima estable: mantén la hidratación regular según el déficit de vapor de tu rincón.',
      isRaining: false,
      isWindy: false,
      isSunny: true,
      fetchedAt: new Date().toISOString(),
    };
    return fallback;
  }
}

