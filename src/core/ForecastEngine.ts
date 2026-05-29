import type { WeatherData } from '../hooks/useWeather';

export interface SpeciesForecast {
  score: number;
  reason: string;
}

export interface ForecastResult {
  status: string;
  score: number;
  species: {
    zander: SpeciesForecast;
    perch: SpeciesForecast;
    pike: SpeciesForecast;
  };
}

export class ForecastEngine {
  public static calculateBiteIndex(
    weather: WeatherData,
    pressureTrend: number,
    modifiers: Record<string, number> = {}
  ): ForecastResult {
    const isDay = weather.is_day === 1;
    const isTwilight = ForecastEngine.checkTwilight(weather);

    const zanderReason: string[] = [];
    let zanderScore = 100;
    if (isDay && !isTwilight) {
      zanderScore -= 40;
      zanderReason.push('Слишком светло');
    } else if (isTwilight) {
      zanderReason.push('Сумерки (оптимально)');
    } else {
      zanderReason.push('Ночь');
    }

    if (Math.abs(pressureTrend) > 2) {
      zanderScore -= 30;
      zanderReason.push('Скачок давления');
    } else {
      zanderReason.push('Стабильное давление');
    }

    if (weather.wind_speed_10m > 5) {
      zanderScore -= 20;
      zanderReason.push('Сильный ветер');
    }

    const perchReason: string[] = [];
    let perchScore = 100;
    if (!isDay) {
      perchScore -= 50;
      perchReason.push('Слишком темно');
    } else {
      perchReason.push('Хороший свет');
    }

    if (weather.wind_speed_10m >= 2 && weather.wind_speed_10m <= 5) {
      perchReason.push('Легкая рябь');
    } else if (weather.wind_speed_10m < 2) {
      perchScore -= 10;
      perchReason.push('Штиль');
    } else {
      perchScore -= 20;
      perchReason.push('Сильный ветер');
    }

    if (pressureTrend < -2) {
      perchScore -= 30;
      perchReason.push('Падение давления');
    }

    const pikeReason: string[] = [];
    let pikeScore = 80;
    if (pressureTrend < 0 && pressureTrend > -4) {
      pikeScore += 20;
      pikeReason.push('Слабое падение давления');
    } else if (pressureTrend > 2) {
      pikeScore -= 20;
      pikeReason.push('Рост давления');
    } else {
      pikeReason.push('Стабильное давление');
    }

    if (weather.cloud_cover > 70) {
      pikeScore += 10;
      pikeReason.push('Пасмурно');
    } else {
      pikeScore -= 10;
      pikeReason.push('Ясно');
    }

    const clamp = (value: number) => Math.max(0, Math.min(100, value));
    const applyModifier = (baseScore: number, key: string) => {
      const raw = modifiers[key] ?? modifiers[`${key}_multiplier`];
      if (typeof raw !== 'number' || Number.isNaN(raw)) return clamp(baseScore);
      return clamp(Math.round(baseScore * raw));
    };

    zanderScore = applyModifier(zanderScore, 'zander');
    perchScore = applyModifier(perchScore, 'perch');
    pikeScore = applyModifier(pikeScore, 'pike');

    const overallScore = clamp(Math.round((zanderScore + perchScore + pikeScore) / 3));

    let status = 'Отличный клёв';
    if (overallScore < 40) status = 'Фаза пассивности';
    else if (overallScore < 70) status = 'Средний клёв';

    return {
      status,
      score: overallScore,
      species: {
        zander: { score: zanderScore, reason: zanderReason.slice(0, 2).join(', ') },
        perch: { score: perchScore, reason: perchReason.slice(0, 2).join(', ') },
        pike: { score: pikeScore, reason: pikeReason.slice(0, 2).join(', ') }
      }
    };
  }

  private static checkTwilight(weather: WeatherData): boolean {
    if (!weather.sunrise || !weather.sunset) return false;

    const now = Date.now();
    const sunrise = new Date(weather.sunrise).getTime();
    const sunset = new Date(weather.sunset).getTime();

    const isSunriseTwilight = Math.abs(now - sunrise) < 3600 * 1000;
    const isSunsetTwilight = Math.abs(now - sunset) < 3600 * 1000;

    return isSunriseTwilight || isSunsetTwilight;
  }
}
