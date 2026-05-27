import React, { useState, useEffect, useMemo } from 'react';
import { Anchor, Church, Trees, Waves, Home, Map as MapIcon, MapPinPlus } from 'lucide-react';
import { historicalPoints } from './data/mapData';
import type { Category, Point } from './data/mapData';
import { getDistance } from './utils/geo';
import { getCustomPoints, saveCustomPoints } from './utils/storage';
import type { CustomPoint } from './utils/storage';
import { WeatherWidget } from './components/WeatherWidget';
import { FilterPanel } from './components/FilterPanel';
import { RouteInfo } from './components/RouteInfo';
import { MainMap } from './components/MainMap';

const categoriesInfo: Record<Category, { label: string, icon: React.ReactNode, color: string }> = {
  church: { label: 'Затопленные объекты', icon: <Church size={24} color="#a855f7" />, color: 'purple' },
  pit: { label: 'Ямы', icon: <Anchor size={24} color="#3b82f6" />, color: 'blue' },
  island: { label: 'Острова', icon: <Trees size={24} color="#22c55e" />, color: 'green' },
  rivermouth: { label: 'Устья рек', icon: <Waves size={24} color="#06b6d4" />, color: 'cyan' },
  base: { label: 'Базы', icon: <Home size={24} color="#f97316" />, color: 'orange' },
  riverbed: { label: 'Русла', icon: <MapIcon size={24} color="#a16207" />, color: 'brown' },
};

function App() {
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set(Object.keys(categoriesInfo) as Category[]));
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearestMode, setNearestMode] = useState(false);
  const [targetPoint, setTargetPoint] = useState<Point | CustomPoint | null>(null);
  const [customPoints, setCustomPoints] = useState<CustomPoint[]>([]);

  useEffect(() => {
    setCustomPoints(getCustomPoints());
  }, []);

  const toggleCategory = (cat: Category) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
    setNearestMode(false);
  };

  const handleNearest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setNearestMode(true);
      }, (err) => {
        console.error(err);
        alert('Не удалось получить геолокацию. Проверьте разрешения.');
        setUserLocation([58.2, 38.3]);
        setNearestMode(true);
      });
    } else {
      alert('Геолокация не поддерживается вашим браузером');
    }
  };

  const handleSaveCustomPoint = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        
        const name = window.prompt('Введите название точки (например, Щука 3кг):');
        if (name && name.trim()) {
          const newPoint: CustomPoint = {
            id: Date.now().toString(),
            name: name.trim(),
            coords: [latitude, longitude]
          };
          const updatedPoints = [...customPoints, newPoint];
          setCustomPoints(updatedPoints);
          saveCustomPoints(updatedPoints);
        }
      }, (err) => {
        console.error(err);
        alert('Не удалось получить геолокацию для сохранения точки.');
      });
    } else {
      alert('Геолокация не поддерживается вашим браузером');
    }
  };

  const deleteCustomPoint = (id: string) => {
    const updatedPoints = customPoints.filter(p => p.id !== id);
    setCustomPoints(updatedPoints);
    saveCustomPoints(updatedPoints);
    if (targetPoint && 'id' in targetPoint && targetPoint.id === id) {
      setTargetPoint(null);
    }
  };

  const visiblePoints = useMemo(() => {
    if (nearestMode && userLocation) {
      const withDistance = historicalPoints.map(p => ({
        ...p,
        distance: getDistance(userLocation[0], userLocation[1], p.coords[0], p.coords[1])
      }));
      withDistance.sort((a, b) => a.distance - b.distance);
      return withDistance.slice(0, 3);
    }
    return historicalPoints.filter(p => activeCategories.has(p.category));
  }, [activeCategories, nearestMode, userLocation]);

  const handleRoute = (point: Point | CustomPoint) => {
    if (!userLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setTargetPoint(point);
        }, (err) => {
          console.error(err);
          alert('Не удалось получить геолокацию для прокладки маршрута.');
        });
      } else {
        alert('Геолокация не поддерживается вашим браузером');
      }
    } else {
      setTargetPoint(point);
    }
  };

  const targetDistance = useMemo(() => {
    if (targetPoint && userLocation) {
      return getDistance(userLocation[0], userLocation[1], targetPoint.coords[0], targetPoint.coords[1]);
    }
    return null;
  }, [targetPoint, userLocation]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 font-sans text-slate-800">
      <WeatherWidget />
      
      <RouteInfo 
        targetPoint={targetPoint} 
        targetDistance={targetDistance} 
        onClose={() => setTargetPoint(null)} 
      />

      <FilterPanel 
        categoriesInfo={categoriesInfo}
        activeCategories={activeCategories}
        nearestMode={nearestMode}
        onToggleCategory={toggleCategory}
        onNearest={handleNearest}
      />

      <div className="absolute bottom-8 left-6 z-[1000]">
        <button 
          onClick={handleSaveCustomPoint}
          className="flex items-center gap-2 bg-amber-500/90 hover:bg-amber-400 backdrop-blur-md text-slate-900 font-bold py-3 px-5 rounded-2xl shadow-2xl transition-all border border-amber-400/50 hover:scale-105"
        >
          <MapPinPlus size={22} /> Сохранить точку
        </button>
      </div>

      <MainMap 
        visiblePoints={visiblePoints}
        customPoints={customPoints}
        userLocation={userLocation}
        targetPoint={targetPoint}
        nearestMode={nearestMode}
        categoriesInfo={categoriesInfo}
        onRoute={handleRoute}
        onDeleteCustomPoint={deleteCustomPoint}
      />
    </div>
  );
}

export default App;
