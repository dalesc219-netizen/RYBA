import { useState, useEffect } from 'react';
import { Target, Thermometer, Wind, Gauge, Droplets, Fish, MapPin, Search, X } from 'lucide-react';
import { useAppStore } from '../../core/store';
import { db } from '../../core/db';
import { useWeather } from '../../hooks/useWeather';
import { reverseGeocode, forwardGeocode } from '../../utils/geocoding';

function getWindDirection(degrees: number) {
  const dirs = ['Северный', 'Сев-Вост', 'Восточный', 'Юго-Вост', 'Южный', 'Юго-Зап', 'Западный', 'Сев-Зап'];
  return dirs[Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 45) % 8];
}

function getGradientByTime() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'bg-gradient-to-br from-indigo-900 via-sky-800 to-blue-900';
  if (hour >= 10 && hour < 18) return 'bg-gradient-to-br from-blue-800 via-sky-700 to-indigo-900';
  if (hour >= 18 && hour < 22) return 'bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900';
  return 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950'; // Night
}

function calculateBiteIndex(pressureTrend: number, windSpeed: number, temp: number) {
  let score = 100;

  if (Math.abs(pressureTrend) > 2) score -= 30; // Jump in pressure
  if (windSpeed > 5) score -= 20; // Strong wind
  if (windSpeed > 8) score -= 40; // Storm
  if (temp < 0 || temp > 28) score -= 15; // Extreme temp

  score = Math.max(10, Math.min(100, score));

  let status = 'Отличный клёв';
  if (score < 40) status = 'Фаза пассивности';
  else if (score < 70) status = 'Средний клёв';

  return {
    status,
    score,
    species: {
      zander: Math.round(score * 0.8),
      perch: Math.round(score * 0.9),
      pike: Math.round(score * 0.6)
    }
  };
}

export function Dashboard() {
  const { userLocation, setUserLocation } = useAppStore();
  const [isCapturing, setIsCapturing] = useState(false);
  const { data: weather, loading: weatherLoading } = useWeather();
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

  const pressureTrend = 1; // Mocking stable pressure trend for now
  const biteForecast = weather 
    ? calculateBiteIndex(pressureTrend, weather.wind_speed_10m, weather.temperature_2m)
    : null;

  return (
    <div className={`flex flex-col h-full text-slate-100 p-4 transition-colors duration-1000 ${getGradientByTime()}`}>
      <div className="flex-1 overflow-y-auto pb-24 space-y-6">
        
        {/* Top Location Block */}
        <div 
          className="flex items-center justify-center gap-2 mt-2 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setIsModalOpen(true)}
        >
          <MapPin size={18} className="text-white" />
          <span className="text-lg font-medium text-white shadow-sm drop-shadow-md">{locationName}</span>
        </div>
        
        {/* Weather Card - Glassmorphism */}
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

        {/* Bite Forecast Card - Glassmorphism */}
        <section className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white/80 flex items-center gap-2 uppercase tracking-wide">
              <Fish size={18} className="text-white/80" />
              ПРОГНОЗ КЛЁВА
            </h2>
            {biteForecast && (
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-md">
                ИНДЕКС: {biteForecast.score}
              </span>
            )}
          </div>

          {weatherLoading || !biteForecast ? (
             <div className="animate-pulse h-24 bg-white/20 rounded-xl w-full"></div>
          ) : (
            <div>
              <p className="text-2xl font-semibold text-white mb-4 drop-shadow-sm">{biteForecast.status}</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium text-white/90 mb-1">
                    <span>Судак</span>
                    <span>{biteForecast.species.zander}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full" 
                      style={{ width: `${biteForecast.species.zander}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm font-medium text-white/90 mb-1">
                    <span>Окунь</span>
                    <span>{biteForecast.species.perch}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full" 
                      style={{ width: `${biteForecast.species.perch}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium text-white/90 mb-1">
                    <span>Щука</span>
                    <span>{biteForecast.species.pike}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-400 to-rose-300 rounded-full" 
                      style={{ width: `${biteForecast.species.pike}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
        
      </div>

      {/* Quick Catch Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
        <button
          onClick={handleQuickCatch}
          disabled={isCapturing}
          className="w-full bg-white/20 backdrop-blur-lg border border-white/30 hover:bg-white/30 active:bg-white/10 text-white rounded-[16px] py-4 px-6 shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-70 font-semibold"
        >
          { isCapturing ? (
            <span className="animate-pulse text-lg">Фиксация...</span>
          ) : (
            <>
              <Target size={24} className="text-white" />
              <span className="text-lg tracking-wide uppercase drop-shadow-sm">Зафиксировать улов</span>
            </>
          )}
        </button>
      </div>

      {/* Location Modal */}
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
