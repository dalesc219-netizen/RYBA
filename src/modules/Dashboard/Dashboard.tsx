import { useState } from 'react';
import { Target, Thermometer, Wind, Gauge, Droplets, Fish } from 'lucide-react';
import { useAppStore } from '../../core/store';
import { db } from '../../core/db';

export function Dashboard() {
  const { setUserLocation } = useAppStore();
  const [isCapturing, setIsCapturing]= useState(false);

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
              weather_snapshot: null,
              notes: '',
              tackle: '',
              media_uris: []
            };
            
            await db.catches.add(newCatch);
            if (navigator.vibrate) navigator.vibrate(200);
            alert('Перновик поимки сохранен!');
          } catch (error) {
            console.error('Failed to save catch:', error);
            alert('Ошибка при сохранении');
          } finally {
            setIsCapturing(false);
          }
        },
        (error) => {
          console.error(error);
          alert('Не удалось поймать координаты. Включите GPS.');
          setIsCapturing(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Геолокация не поддерживается');
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] text-slate-100 p-4">
      <div className="flex-1 overflow-y-auto pb-24 space-y-6">
        <h1 className="text-3xl font-bold text-white mb-2">Обзор</h1>
        
        {/* Карточка "Погода" */}
        <section className="bg-[#1E1E1E] rounded-[12px] p-5 shadow-lg shadow-black/20 border border-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Thermometer size={20} className="text-blue-400" />
            Текущая погода
          </h2>
          
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-5xl font-bold text-white tracking-tighter">+18°C</div>
              <div className="text-slate-400 text-sm mt-1">Ощущается как +16°C</div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-emerald-400 font-medium">
                <Gauge size={16} />
                <span>752 мм рт.ст. ↗</span>
              </div>
              <div className="text-slate-500 text-xs mt-1">Растет</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-[#121212] rounded-lg p-3">
              <Wind size={24} className="text-slate-400" />
              <div>
                <div className="text-white font-medium">4.2 м/с.</div>
                <div className="text-slate-500 text-xs">Юго-Западный</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[#121212] rounded-lgp-3">
              <Droplets size={24} className="text-blue-400" />
              <div>
                <div className="text-white font-medium">68%</div>
                <div className="text-slate-500 text-xs">Влажность</div>
              </div>
            </div>
          </div>
        </section>

        {/* Карточка "Прогноз клёва" */}
        <section className="bg-[#1E1E1E] rounded-[12px] p-5 shadow-lg shadow-black/20 border border-slate-800/50 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-300 mb-1 flex items-center gap-2">
              <Fish size={20} className="text-emerald-400" />
              Прогноз клёва
            </h2>
            <p className="text-2xl font-bold text-white mb-1">Стабильный клёв</p>
            <p className="text-sm text-slate-400">Лучшее врем�: 18:00 - 21:00</p>
          </div>
          
          ${/* Индикатор (круговой график - мок) */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 drop-shadow-md"
                strokeDasharray="75, 100"
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-lg font-bold text-white">75%</span>
          </div>
        </section>
        
      </div>

      {/* Кнопка Быстрый старт */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
        <button
          onClick={handleQuickCatch}
          disabled={isCapturing}
          className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-[12px] py-4 px-6 shadow-[0_8px_30px_rgba(5,150,105,0.3)] flex/items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-70 font-semibold"
        >
          { isCapturing ? (
            <span className="animate-pulse text-lg">Фиксация...</span>
          ) : (
            <>
              <Target size={24} className="text-emerald-100" />
              <span className="text-lg tracking-wide uppercase">Зафиксировать улов</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}