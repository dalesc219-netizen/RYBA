import React, { useState, useEffect, useMemo } from 'react';
import { Anchor, Church, Trees, Waves, Home, Map as MapIcon, MapPinPlus, Download, Edit3, Eye, Layers, ListOrdered, Image as ImageIcon } from 'lucide-react';
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
  const [mapPoints, setMapPoints] = useState<Point[]>(historicalPoints);

  // Inspector states
  const [isEditMode, setIsEditMode] = useState(false);
  const [markersOpacity, setMarkersOpacity] = useState(1);

  // Verification Layer and Raster states
  const [showHistoricalRaster, setShowHistoricalRaster] = useState(false);
  const [rasterOpacity, setRasterOpacity] = useState(0.7);
  const [showVerificationLayer, setShowVerificationLayer] = useState(false);

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
            coords: [latitude, longitude],
            verified: true
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

  const handlePointDragEnd = (point: Point | CustomPoint, event: any) => {
    if (!isEditMode) return;
    const marker = event.target;
    const position = marker.getLatLng();
    const newCoords: [number, number] = [position.lat, position.lng];
    const oldCoordsStr = `${point.coords[0].toFixed(5)}, ${point.coords[1].toFixed(5)}`;
    const newCoordsStr = `${newCoords[0].toFixed(5)}, ${newCoords[1].toFixed(5)}`;

    if ('id' in point) {
      if (window.confirm(`Сохранить новые координаты для личной точки "${point.name}"?\n\nСтарые: ${oldCoordsStr}\nНовые: ${newCoordsStr}`)) {
        const updatedPoints = customPoints.map(p => 
          p.id === point.id ? { ...p, coords: newCoords, verified: true } : p
        );
        setCustomPoints(updatedPoints);
        saveCustomPoints(updatedPoints);
      } else {
        marker.setLatLng(point.coords);
      }
    } else {
      if (window.confirm(`Обновить координаты для исторической точки "${point.name}"?\n\nСтарые: ${oldCoordsStr}\nНовые: ${newCoordsStr}`)) {
        const deltaLat = position.lat - point.coords[0];
        const deltaLng = position.lng - point.coords[1];
        
        if (window.confirm(`СДВИГ КАТЕГОРИИ:\nПрименить этот же сдвиг (Lat: ${deltaLat.toFixed(5)}, Lng: ${deltaLng.toFixed(5)}) ко всем точкам категории "${categoriesInfo[point.category as Category].label}"?`)) {
          setMapPoints(prev => prev.map(p => p.category === point.category ? {
            ...p,
            coords: [p.coords[0] + deltaLat, p.coords[1] + deltaLng]
          } : p));
        } else {
          setMapPoints(prev => prev.map(p => p.name === point.name ? {
            ...p,
            coords: newCoords
          } : p));
        }
      } else {
        marker.setLatLng(point.coords);
      }
    }
  };

  const exportEdits = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mapPoints, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "corrected_points.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const visiblePoints = useMemo(() => {
    if (nearestMode && userLocation) {
      const withDistance = mapPoints.map(p => ({
        ...p,
        distance: getDistance(userLocation[0], userLocation[1], p.coords[0], p.coords[1])
      }));
      withDistance.sort((a, b) => a.distance - b.distance);
      return withDistance.slice(0, 3);
    }
    return mapPoints.filter(p => activeCategories.has(p.category));
  }, [activeCategories, nearestMode, userLocation, mapPoints]);

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

      {/* Inspector Panel */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-slate-800/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-slate-600 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Edit3 size={18} className={isEditMode ? "text-amber-400" : "text-slate-400"} />
          <label className="text-white text-sm font-semibold flex items-center gap-2 cursor-pointer">
            Инспектор
            <input 
              type="checkbox" 
              checked={isEditMode} 
              onChange={(e) => setIsEditMode(e.target.checked)}
              className="accent-amber-500 w-4 h-4"
            />
          </label>
        </div>
        <div className="w-px h-6 bg-slate-600"></div>
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-slate-400" />
          <input 
            type="range" 
            min="0.2" max="1" step="0.1" 
            value={markersOpacity} 
            onChange={(e) => setMarkersOpacity(parseFloat(e.target.value))}
            className="w-24 accent-amber-500"
            title="Прозрачность маркеров"
          />
        </div>
        <div className="w-px h-6 bg-slate-600"></div>
        <button 
          onClick={exportEdits}
          className="flex items-center gap-2 text-sm bg-indigo-500/90 hover:bg-indigo-400 text-white font-bold py-1.5 px-3 rounded-xl transition-all"
        >
          <Download size={16} /> JSON
        </button>
      </div>

      {/* Verification & Raster Control Panel */}
      <div className="absolute top-24 right-4 z-[1000] bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-600 flex flex-col gap-4 w-72">
        <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Layers size={18} className="text-indigo-400" />
          Верификация
        </h3>
        
        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between text-slate-200 text-sm cursor-pointer">
            <span className="flex items-center gap-2"><ImageIcon size={16} className="text-blue-400" /> Исторический растр</span>
            <input 
              type="checkbox" 
              checked={showHistoricalRaster} 
              onChange={(e) => setShowHistoricalRaster(e.target.checked)}
              className="accent-blue-500 w-4 h-4 cursor-pointer"
            />
          </label>
          
          {showHistoricalRaster && (
            <div className="flex items-center gap-2 pl-6">
              <Eye size={14} className="text-slate-400" />
              <input 
                type="range" 
                min="0" max="1" step="0.1" 
                value={rasterOpacity} 
                onChange={(e) => setRasterOpacity(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
                title="Прозрачность растра"
              />
              <span className="text-xs text-slate-400 w-6">{Math.round(rasterOpacity * 100)}%</span>
            </div>
          )}

          <div className="w-full h-px bg-slate-700 my-1"></div>

          <label className="flex items-center justify-between text-slate-200 text-sm cursor-pointer">
            <span className="flex items-center gap-2"><ListOrdered size={16} className="text-yellow-400" /> Сквозная нумерация</span>
            <input 
              type="checkbox" 
              checked={showVerificationLayer} 
              onChange={(e) => setShowVerificationLayer(e.target.checked)}
              className="accent-yellow-500 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>
      </div>

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
        isEditMode={isEditMode}
        markersOpacity={markersOpacity}
        onPointDragEnd={handlePointDragEnd}
        showHistoricalRaster={showHistoricalRaster}
        rasterOpacity={rasterOpacity}
        showVerificationLayer={showVerificationLayer}
      />
    </div>
  );
}

export default App;
