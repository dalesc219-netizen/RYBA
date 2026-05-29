import type { WeatherData } from '../hooks/useWeather';

export interface Factor {
  name: string;
  value: string; // e.g. "+10%" or "-15%"
  status: 'positive' | 'negative' | 'neutral';
  reason?: string;
}

export interface SpeciesDetail {
  species: string;
  totalScore: number; // 0-100
  factors: Factor[];
}

export interface AnalyticsResult {
  overallScore: number;
  species: SpeciesDetail[];
}

export class ForecastEngine {
  /**
   * Calculate detailed analytic breakdown per species.
   * @param weather current weather snapshot
   * @param pressureDelta12 pressure change over 12h in mm (positive = rise)
   * @param modifiers social radar multipliers (e.g. { zander: 0.5 })
   */
  public static calculateBiteIndex(
    weather: WeatherData,
    pressureDelta12: number,
    modifiers: Record<string, number> = {}
  ): AnalyticsResult {
    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

    function getCardinal(deg: number) {
      const sectors = ['N','NE','E','SE','S','SW','W','NW'];
      return sectors[Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8];
    }

    const speciesKeys: Array<{ key: string; name: string }> = [
      { key: 'zander', name: 'Судак' },
      { key: 'perch', name: 'Окунь' }
    ];

    const results: SpeciesDetail[] = [];

    // Common wind wave penalty
    const wavePenalty = weather.wind_speed_10m > 6 ? -20 : 0;

    for (const s of speciesKeys) {
      let score = 50; // base
      const factors: Factor[] = [];

      // Pressure (weight 30 points)
      let pressureEffect: number;
      let pressureReason: string;
      if (Math.abs(pressureDelta12) >= 4) {
        pressureEffect = -30;
        pressureReason = 'Резкое изменение давления (>=4 мм/12ч)';
      } else if (Math.abs(pressureDelta12) >= 2) {
        pressureEffect = -10;
        pressureReason = 'Небольшая нестабильность давления';
      } else {
        pressureEffect = +10;
        pressureReason = 'Стабильное давление';
      }
      score += pressureEffect;
      factors.push({ name: 'Давление', value: (pressureEffect >= 0 ? '+' : '') + `${pressureEffect}%`, status: pressureEffect >= 0 ? 'positive' : 'negative', reason: pressureReason });

      // Wind direction (weight 20 points)
      const dir = getCardinal(weather.wind_direction_10m ?? 0);
      let windDirEffect: number;
      const windDirReason = `${dir}, ${weather.wind_speed_10m} м/с`;
      if (['N','NE','E'].includes(dir)) {
        windDirEffect = -15;
      } else if (['S','SW','W'].includes(dir)) {
        windDirEffect = +10;
      } else {
        windDirEffect = 0;
      }
      score += windDirEffect;
      factors.push({ name: 'Ветер (направление)', value: (windDirEffect >= 0 ? '+' : '') + `${windDirEffect}%`, status: windDirEffect >= 0 ? 'positive' : (windDirEffect < 0 ? 'negative' : 'neutral'), reason: windDirReason });

      // Wave / strong wind (applies to all predators)
      if (wavePenalty !== 0) {
        score += wavePenalty;
        factors.push({ name: 'Волна/Скорость ветра', value: `${wavePenalty}%`, status: 'negative', reason: `Скорость ${weather.wind_speed_10m} м/с` });
      }

      // Other placeholders (sunlight, cloud) could be added later

      // Clamp intermediate weather score
      const weatherScore = clamp(score);

      // Social radar multiplier (weight 50% as multiplier)
      const rawMod = modifiers[s.key] ?? modifiers[`${s.key}_multiplier`] ?? modifiers['global'] ?? 1;
      const mod = typeof rawMod === 'number' && !Number.isNaN(rawMod) ? rawMod : 1;

      const finalScore = clamp(Math.round(weatherScore * mod));

      const modDeltaPercent = Math.round((mod - 1) * 100);
      const modLabel = (modDeltaPercent >= 0 ? '+' : '') + `${modDeltaPercent}%`;
      factors.push({ name: 'Сводка с водоема', value: modLabel, status: mod >= 1 ? 'positive' : 'negative', reason: `Множитель ${mod}` });

      results.push({ species: s.name, totalScore: finalScore, factors });
    }

    const overall = clamp(results.reduce((acc, r) => acc + r.totalScore, 0) / results.length);

    return { overallScore: overall, species: results };
  }

  // NOTE: twilight helper removed — not used in current analytic model
}
