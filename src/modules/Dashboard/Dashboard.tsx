import { useState, useEffect } from 'react';
import { Target, Thermometer, Wind, Gauge, Droplets, Fish, MapPin, Search, X, MessageCircle } from 'lucide-react';
import { Bug } from 'lucide-react';
import { useAppStore } from '../../core/store';
import { db } from '../../core/db';
import { useWeather } from '../../hooks/useWeather';
import { useParserReports } from '../../hooks/useParserReports';
import { reverseGeocode, forwardGeocode } from '../../utils/geocoding';
import { ForecastEngine } from '../../core/ForecastEngine';

function getWindDirection(degrees: number) {
  const dirs = ['Северный', 'Сев-Вост', 'Восточный', 'Юго-Вост', 'Южный', 'Юго-Зап', 'Западный', 'Сев-Зап'];
  return dirs[Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 45) % 8];
}

function getGradientByTime() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'bg-gradient-to-br from-indigo-900 via-sky-800 to-blue-900';
  if (hour >= 10 && hour < 18) return 'bg-gradient-to-br from-blue-800 via-sky-700 to-indigo-900';
  if (hour >= 18 && hour < 22) return 'bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900';
  return 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950';
}

export function Dashboard() {
  const { userLocation, setUserLocation } = useAppStore();
  const [isCapturing, setIsCapturing] = useState(false);
  const { data: weather, loading: weatherLoading } = useWeather();
  const { data: report, loading: reportLoading } = useParserReports();
  const [locationName, setLocationName] = useState('Определение локации...');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (userLocation) {
      reverseGeocode(userLocation[0], userLocation[1]).then(name => setLocationName(name));
    }
  }, [userLocation]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const coords = await forwardGeocode(searchQuery);
    setIsSearching(false);
    if (coords) {
      setUserLocation(coords);
      setIsModalOpen(false);
      setSearchQuery('');
    } else {
      alert('Локация не найдена');
    }
  };

  const handleQuickCatch = () => {
    setIsCapturing(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);

          try {
            const newCatch = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              lat: latitude,
              lng: longitude,
              weather_snapshot: weather || null,
              notes: '',
              tackle: '',
              media_uris: []
            };

            await db.catches.add(newCatch);
            if (navigator.vibrate) navigator.vibrate(200);
            alert('Черновик поимки сохранен!');
          } catch (error) {
            console.error('Failed to save catch:', error);
            alert('Ошибка при сохранении');
          } finally {
            setIsCapturing(false);
          }
        },
        (error) => {
          console.error(error);
          alert('Не удалось получить координаты. Включите GPS.');
          setIsCapturing(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Геолокация не поддерживается');
      setIsCapturing(false);
    }
  };

  

  // Debug / mock scenarios
  const [debugMode, setDebugMode] = useState(false);
  const [debugScenario, setDebugScenario] = useState<0|1|2 | null>(null);

  const baseWeather = weather ?? {
    wind_speed_10m: 0,
    wind_direction_10m: 0,
    surface_pressure: 750,
    temperature_2m: 10,
    sunrise: new Date().toISOString(),
    sunset: new Date().toISOString(),
    is_day: 1,
    cloud_cover: 0
  };

  const scenarios = {
    0: {
      name: 'Идеально',
      weather: { ...baseWeather, wind_speed_10m: 3, wind_direction_10m: 225, is_day: 1, cloud_cover: 20 }, // SW
      pressureDelta12: 0,
      report: { modifiers: { zander: 1.3, perch: 1.3 }, hot_lures: ['Воблер', 'Твич'], summary: 'Идеальный клёв на русле' }
    },
    1: {
      name: 'Шторм',
      weather: { ...baseWeather, wind_speed_10m: 8, wind_direction_10m: 45, is_day: 0, cloud_cover: 100 }, // NE
      pressureDelta12: 5,
      report: { modifiers: { zander: 0.4, perch: 0.4 }, hot_lures: ['Блесна'], summary: 'Штормовые условия, осторожно' }
    },
    2: {
      name: 'Реальность',
      weather: { ...baseWeather, wind_speed_10m: 4, wind_direction_10m: 135, is_day: 1, cloud_cover: 55 }, // SE
      pressureDelta12: -2,
      report: { modifiers: { zander: 1.0, perch: 1.0 }, hot_lures: [], summary: 'Обычная смена погоды' }
    }
  } as const;

  // Determine active inputs (allow debug overrides)
  const activeWeather = (debugMode && debugScenario !== null) ? scenarios[debugScenario].weather : weather;
  const effectiveWeather = activeWeather ?? baseWeather;
  const pressureDelta12 = (debugMode && debugScenario !== null) ? scenarios[debugScenario].pressureDelta12 : 0;
  const activeReport = (debugMode && debugScenario !== null) ? scenarios[debugScenario].report : report;

  const biteForecast = ForecastEngine.calculateBiteIndex(effectiveWeather, pressureDelta12, activeReport?.modifiers ?? {});

  return (
    <div className={`flex flex-col h-full text-slate-100 p-4 transition-colors duration-1000 ${getGradientByTime()}`}>
      <div className="flex-1 overflow-y-auto pb-24 space-y-6">
        <div
          className="flex items-center justify-center gap-2 mt-2 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setIsModalOpen(true)}
        >
          <MapPin size={18} className="text-white" />
          <span className="text-lg font-medium text-white shadow-sm drop-shadow-md">{locationName}</span>
        </div>

        <section className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl p-5">
          <h2 className="text-base font-semibold text-white/80 mb-4 flex items-center gap-2">
            <Thermometer size={18} className="text-white/80" />
            ТЕКУЩАЯ ПОГОДА
          </h2>

          {weatherLoading || !weather ? (
            <div className="animate-pulse">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <div className="h-14 w-24 bg-white/20 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-white/20 rounded"></div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="h-4 w-20 bg-white/20 rounded mb-2"></div>
                  <div className="h-3 w-16 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <div className="text-6xl font-light text-white tracking-tighter drop-shadow-sm">
                    {weather.temperature_2m > 0 ? '+' : ''}{Math.round(weather.temperature_2m)}°
                  </div>
                  <div className="text-white/80 text-sm mt-1 font-medium">
                    Ощущается как {weather.temperature_2m > 0 ? '+' : ''}{Math.round(weather.temperature_2m - 2)}°
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-white font-semibold drop-shadow-sm">
                    <Gauge size={16} />
                    <span>{weather.surface_pressure} мм</span>
                  </div>
                  <div className="text-white/70 text-xs mt-1 font-medium">Стабильно</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-black/20 rounded-xl p-3 border border-white/10">
                  <Wind size={20} className="text-white/80" />
                  <div>
                    <div className="text-white font-semibold">{weather.wind_speed_10m} м/с</div>
                    <div className="text-white/60 text-xs truncate max-w-[80px]">{getWindDirection(weather.wind_direction_10m)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-black/20 rounded-xl p-3 border border-white/10">
                  <Droplets size={20} className="text-white/80" />
                  <div>
                    <div className="text-white font-semibold">68%</div>
                    <div className="text-white/60 text-xs">Влажность</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl p-5 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white/80 flex items-center gap-2 uppercase tracking-wide">
              <Fish size={18} className="text-white/80" />
              ПРОГНОЗ КЛЁВА
            </h2>
            <button
              title="Debug scenarios"
              onClick={() => { setDebugMode(true); setDebugScenario(prev => (prev === null ? 0 : ((prev + 1) % 3) as 0|1|2)); }}
              className="absolute top-4 right-4 p-1 opacity-20 hover:opacity-80 transition-opacity"
            >
              <Bug size={18} className="text-white/70" />
            </button>
          </div>

          {weatherLoading || !biteForecast ? (
            <div className="animate-pulse h-44 bg-white/20 rounded-xl w-full"></div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-40 h-40 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#10b981 ${biteForecast.overallScore}%, rgba(255,255,255,0.06) 0)` }}>
                <div className="w-32 h-32 rounded-full bg-black/60 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-white">{biteForecast.overallScore}%</div>
                  <div className="text-xs text-white/70">Итоговый индекс</div>
                </div>
              </div>

              <div className="flex-1 w-full">
                {biteForecast.species.map((s) => (
                  <div key={s.species} className="mb-3">
                    <div className="w-full text-left bg-black/20 p-3 rounded-xl flex items-center justify-between border border-white/10">
                      <div>
                        <div className="text-sm text-white/90 font-semibold">{s.species}</div>
                        <div className="text-xs text-white/60">Итог: {s.totalScore}%</div>
                      </div>
                      <div className="text-white font-bold">{s.totalScore}%</div>
                    </div>

                    <div className="mt-2 bg-black/10 rounded-xl p-3 border border-white/5">
                      <div className="grid grid-cols-1 gap-2">
                        {s.factors.map((f) => (
                          <div key={f.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`px-2 py-1 text-xs font-medium rounded ${f.status === 'positive' ? 'bg-emerald-600 text-white' : f.status === 'negative' ? 'bg-rose-600 text-white' : 'bg-slate-700 text-white'}`}>{f.value}</div>
                              <div className="text-sm text-white/80">
                                <div className="font-medium">{f.name}</div>
                                <div className="text-xs text-white/60">{f.reason}</div>
                              </div>
                            </div>
                            <div className="text-sm text-white/70">{f.status === 'positive' ? 'Плюс' : f.status === 'negative' ? 'Минус' : ''}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={18} className="text-white/80" />
            <h2 className="text-base font-semibold text-white/80 uppercase tracking-wide">Сводка с форумов</h2>
          </div>

          {reportLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-white/20 rounded w-3/4"></div>
              <div className="h-4 bg-white/20 rounded w-1/2"></div>
              <div className="h-8 bg-white/20 rounded"></div>
            </div>
          ) : report ? (
            <>
              <p className="text-slate-200/80 italic leading-relaxed">{report.summary || 'Свежая информация отсутствует.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {report.hot_lures && report.hot_lures.length > 0 ? (
                  report.hot_lures.map((lure) => (
                    <span key={lure} className="bg-slate-800/70 text-slate-100 text-xs font-medium px-3 py-1.5 rounded-full border border-white/10">
                      {lure}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-sm">Рабочие приманки не найдены.</span>
                )}
              </div>
            </>
          ) : (
            <p className="text-slate-300/70">Не удалось загрузить данные сводки. Продолжаем работу без внешнего парсера.</p>
          )}
        </section>
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
        <button
          onClick={handleQuickCatch}
          disabled={isCapturing}
          className="w-full bg-white/20 backdrop-blur-lg border border-white/30 hover:bg-white/30 active:bg-white/10 text-white rounded-[16px] py-4 px-6 shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-70 font-semibold"
        >
          {isCapturing ? (
            <span className="animate-pulse text-lg">Фиксация...</span>
          ) : (
            <>
              <Target size={24} className="text-white" />
              <span className="text-lg tracking-wide uppercase drop-shadow-sm">Зафиксировать улов</span>
            </>
          )}
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Изменить локацию</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Например: Легково, Рыбинское"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    autoFocus
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  {isSearching ? 'Поиск...' : 'Найти и применить'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
