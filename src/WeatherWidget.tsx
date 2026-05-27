import { useState, useEffect } from 'react';
import { Thermometer, Wind, Gauge, AlertTriangle } from 'lucide-react';

interface WeatherData {
  temperature_2m: number;
  wind_speed_10m: number;
  surface_pressure: number;
}

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Используем wind_speed_unit=ms для получения скорости в м/с
    fetch('https://api.open-meteo.com/v1/forecast?latitude=58.2715&longitude=38.3810&current=temperature_2m,wind_speed_10m,surface_pressure&wind_speed_unit=ms')
      .then(res => res.json())
      .then(json => {
        if (json.current) {
          setData(json.current);
        } else {
          setError(true);
        }
      })
      .catch((err) => {
        console.error("Ошибка при получении погоды:", err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="absolute top-24 left-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg w-64 pointer-events-auto border border-white/50 flex items-center justify-center h-32">
        <div className="text-sm font-bold text-gray-600 animate-pulse">Загрузка погоды...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="absolute top-24 left-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg w-64 pointer-events-auto border border-red-200 flex items-center justify-center h-32">
        <div className="text-sm font-bold text-red-600 flex flex-col items-center gap-2">
          <AlertTriangle size={24} />
          <span>Нет связи с метеостанцией</span>
        </div>
      </div>
    );
  }

  const temp = data.temperature_2m;
  const wind = data.wind_speed_10m;
  const pressureMmHg = Math.round(data.surface_pressure * 0.750062);

  let status = "Стабильный клёв";
  let index = 60;
  let isStorm = false;

  if (wind > 7) {
    status = "Шторм! Опасно для лодок";
    index = 10;
    isStorm = true;
  } else if (pressureMmHg < 740) {
    status = "Клёв щуки: Высокий";
    index = 80;
  } else if (pressureMmHg > 755) {
    status = "Клёв белой рыбы: Высокий";
    index = 70;
  }

  return (
    <div className="absolute top-24 left-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg w-64 pointer-events-auto border border-white/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Рыбинское вдхр.</h3>
      </div>
      
      <div className="flex justify-between mb-5">
        <div className="flex flex-col items-center">
          <Thermometer size={22} className="text-red-500 mb-1" />
          <span className="text-sm font-bold text-gray-700">{temp > 0 ? `+${temp}` : temp}°C</span>
        </div>
        <div className="flex flex-col items-center">
          <Wind size={22} className={isStorm ? "text-red-600 mb-1 animate-pulse" : "text-blue-500 mb-1"} />
          <span className={`text-sm font-bold ${isStorm ? 'text-red-600' : 'text-gray-700'}`}>{wind} м/с</span>
        </div>
        <div className="flex flex-col items-center">
          <Gauge size={22} className="text-purple-500 mb-1" />
          <span className="text-sm font-bold text-gray-700">{pressureMmHg} мм</span>
        </div>
      </div>

      <div className="mb-2 flex justify-between items-end">
        <span className={`text-xs font-bold leading-tight ${isStorm ? 'text-red-600' : 'text-gray-700'}`}>{status}</span>
        <span className="text-xs font-black text-gray-900">{index}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
        <div 
          className={`h-3 rounded-full transition-all duration-1000 ${isStorm ? 'bg-red-600' : index > 60 ? 'bg-green-500' : 'bg-blue-500'}`} 
          style={{ width: `${index}%` }}
        ></div>
      </div>
    </div>
  );
}
