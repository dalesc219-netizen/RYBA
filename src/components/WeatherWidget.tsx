import { useState, useEffect } from 'react';
import { Thermometer, Wind, Gauge, CloudOff } from 'lucide-react';
import { analyzeFishingConditions } from '../utils/weather';

interface WeatherData {
  temperature_2m: number;
  wind_speed_10m: number;
  surface_pressure: number;
}

interface Props {
  className?: string;
}

export function WeatherWidget({ className }: Props) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
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

  const defaultClasses = className || "absolute top-24 left-4 z-[1000] w-72";
  const containerClasses = `bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl pointer-events-auto border border-slate-700/50 text-slate-100 ${defaultClasses}`;
  const loadingClasses = `bg-slate-800/90 backdrop-blur-md p-4 rounded-xl shadow-2xl pointer-events-auto border border-slate-700 flex items-center justify-center h-36 ${defaultClasses}`;
  const errorClasses = `bg-slate-800/90 backdrop-blur-md p-4 rounded-xl shadow-2xl pointer-events-auto border border-rose-500/50 flex items-center justify-center h-36 ${defaultClasses}`;

  if (loading) {
    return (
      <div className={loadingClasses}>
        <div className="text-sm font-semibold text-slate-300 animate-pulse">Загрузка данных...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={errorClasses}>
        <div className="text-sm font-semibold text-rose-400 flex flex-col items-center gap-2">
          <CloudOff size={28} />
          <span>Датчики недоступны</span>
        </div>
      </div>
    );
  }

  const temp = data.temperature_2m;
  const wind = data.wind_speed_10m;
  const pressureMmHg = Math.round(data.surface_pressure * 0.750062);

  const { status, index, isStorm } = analyzeFishingConditions(wind, pressureMmHg);

  // SVG Circle calculations
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (index / 100) * circumference;
  
  const circleColor = isStorm ? 'text-rose-500' : index > 60 ? 'text-emerald-500' : 'text-blue-500';

  return (
    <div className={containerClasses}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-300 text-xs uppercase tracking-widest">Акватория Рыбинки</h3>
      </div>
      
      <div className="flex justify-between items-center mb-5">
        <div className="flex flex-col items-center">
          <Thermometer size={20} className="text-rose-400 mb-1" />
          <span className="text-xl font-bold">{temp > 0 ? `+${temp}` : temp}°</span>
        </div>
        <div className="flex flex-col items-center">
          <Wind size={20} className={isStorm ? "text-rose-500 mb-1 animate-pulse" : "text-blue-400 mb-1"} />
          <span className={`text-xl font-bold ${isStorm ? 'text-rose-500' : ''}`}>{wind} <span className="text-xs font-normal text-slate-400">м/с</span></span>
        </div>
        <div className="flex flex-col items-center">
          <Gauge size={20} className="text-purple-400 mb-1" />
          <span className="text-xl font-bold">{pressureMmHg}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
        <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
          <svg className="transform -rotate-90 w-14 h-14">
            <circle cx="28" cy="28" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-700" />
            <circle 
              cx="28" cy="28" r={radius} 
              stroke="currentColor" strokeWidth="4" fill="transparent" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              className={`${circleColor} transition-all duration-1000 ease-out`} 
              strokeLinecap="round" 
            />
          </svg>
          <div className="absolute flex items-center justify-center">
            <span className="text-sm font-bold">{index}%</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Прогноз</span>
          <span className={`text-xs font-bold leading-tight ${isStorm ? 'text-rose-500' : 'text-slate-200'}`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
