import React, { useState } from 'react';
import { Target, PlusCircle, Activity } from 'lucide-react';
import { WeatherWidget } from '../../components/WeatherWidget';
import { useAppStore } from '../../core/store';
import { db } from '../../core/db';

export function Dashboard() {
  const { setUserLocation } = useAppStore();
  const [isCapturing, setIsCapturing] = useState(false);

  const handleQuickCatch = () => {
    setIsCapturing(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          
          try {
            // Save draft catch
            const newCatch = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              lat: latitude,
              lng: longitude,
              weather_snapshot: null, // We'll populate this from weather cache ideally
              notes: '',
              tackle: '',
              media_uris: []
            };
            
            await db.catches.add(newCatch);
            // Vibrate if supported
            if (navigator.vibrate) navigator.vibrate(200);
            
            // Optionally switch to diary or show a success toast
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

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 pt-16">
      <div className="flex-1 overflow-y-auto pb-24">
        <h1 className="text-3xl font-bold mb-6 text-slate-100">Обзор</h1>
        
        {/* Weather Widget */}
        <div className="mb-8 relative w-full h-auto">
          {/* We are reusing the existing WeatherWidget, but making it static in the flow instead of absolute */}
          <div className="relative z-10 w-full transform-none top-0 left-0">
             <WeatherWidget />
          </div>
        </div>

        {/* Recent Activity summary or other dashboard info could go here */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center gap-3 mb-2 text-slate-400">
            <Activity size={20} />
            <h2 className="font-semibold">Статус</h2>
          </div>
          <p className="text-sm">Ожидание активности...</p>
        </div>
      </div>

      {/* Quick Catch Big Button fixed at bottom */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-50">
        <button
          onClick={handleQuickCatch}
          disabled={isCapturing}
          className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl py-5 px-6 shadow-[0_8px_30px_rgba(5,150,105,0.4)] flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-70"
        >
          {isCapturing ? (
            <span className="animate-pulse font-bold text-xl">Фиксация...</span>
          ) : (
            <>
              <Target size={28} className="text-emerald-100" />
              <span className="font-bold text-xl tracking-wide uppercase">Поимка</span>
              <PlusCircle size={28} className="text-emerald-100 opacity-50 absolute right-6" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
