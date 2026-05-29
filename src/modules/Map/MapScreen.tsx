import React, { useState, useMemo } from 'react';
import { Anchor, Church, Trees, Waves, Home, Map as MapIcon, MapPinPlus, Download, Edit3, Eye, Layers, ListOrdered, Image as ImageIcon, Copy } from 'lucide-react';
import type { LeafletEvent, Marker } from 'leaflet';
import { historicalPoints } from '../../data/mapData';
import type { Category, Point } from '../../data/mapData';
import { getDistance } from '../../utils/geo';
import { getCustomPoints, saveCustomPoints } from '../../utils/storage';
import type { CustomPoint } from '../../utils/storage';
import { WeatherWidget } from '../../components/WeatherWidget';
import { FilterPanel } from '../../components/FilterPanel';
import { RouteInfo } from '../../components/RouteInfo';
import { MainMap } from '../../components/MainMap';

const categoriesInfo: Record<Category, { label: string, icon: React.ReactNode, color: string }> = {
  church: { label: 'Затопленные объекты', icon: <Church size={24} color="#a855f7" />, color: 'purple' },
  pit: { label: 'Ямы', icon: <Anchor size={24} color="#3b82f6" />, color: 'blue' },
  island: { label: 'Острова', icon: <Trees size={24} color="#22c55e" />, color: 'green' },
  rivermouth: { label: 'Устья рек', icon: <Waves size={24} color="#06b6d4" />, color: 'cyan' },
  base: { label: 'Базы', icon: <Home size={24} color="#f97316" />, color: 'orange' },
  riverbed: { label: 'Русла', icon: <MapIcon size={24} color="#a16207" />, color: 'brown' },
};

export function MapScreen() {
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set(Object.keys(categoriesInfo) as Category[]));
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearestMode, setNearestMode] = useState(false);
  const [targetPoint, setTargetPoint] = useState<Point | CustomPoint | null>(null);
  const [customPoints, setCustomPoints] = useState<CustomPoint[]>(() => getCustomPoints());
  const [mapPoints, setMapPoints] = useState<Point[]>(historicalPoints);

  // Inspector states
  const [isEditMode, setIsEditMode] = useState(false);
  const [markersOpacity, setMarkersOpacity] = useState(1);

  // Verification Layer and Raster states
  const [showHistoricalRaster, setShowHistoricalRaster] = useState(false);
  const [rasterOpacity, setRasterOpacity] = useState(0.7);
  const [showVerificationLayer, setShowVerificationLayer] = useState(false);

  // Depth Map Layer states
  const [showDepthMap, setShowDepthMap] = useState(false);
  const [depthOpacity, setDepthOpacity] = useState(0.6);

  // Raster Calibration State
  const [rasterBounds, setRasterBounds] = useState<[[number, number], [number, number]]>([
    [57.8300, 37.8900], // Исходный выверенный South-West
    [58.5900, 39.0100]  // Исходный выверенный North-East
  ]);

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
        setUserLocation([58.2715, 38.3810]);
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

  const handlePointDragEnd = (point: Point | CustomPoint, event: LeafletEvent) => {
    if (!isEditMode) return;
    const marker = event.target as Marker;
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

  // Calibration Helpers
  const updateBounds = (index: 0 | 1, coordIndex: 0 | 1, amount: number) => {
    setRasterBounds(prev => {
      const newBounds = [...prev] as [[number, number], [number, number]];
      newBounds[index][coordIndex] = Number((newBounds[index][coordIndex] + amount).toFixed(4));
      return newBounds;
    });
  };

  const copyBoundsToClipboard = () => {
    const text = `[\n  [${rasterBounds[0][0]}, ${rasterBounds[0][1]}], // South-West\n  [${rasterBounds[1][0]}, ${rasterBounds[1][1]}]  // North-East\n]`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Координаты скопированы в буфер обмена!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('Ошибка при копировании.');
    });
  };

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
      <div className="absolute top-24 right-4 z-[1000] bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-600 flex flex-col gap-4 w-80 max-h-[80vh] overflow-y-auto">
        <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Layers size={18} className="text-indigo-400" />
          Верификация
        </h3>
        
        <div className="flex flex-col gap-3">
          {/* Historical Map Block */}
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
            <div className="flex flex-col gap-3 pl-6">
              <div className="flex items-center gap-2">
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
              
              {/* Calibration UI */}
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 flex flex-col gap-2">
                <h4 className="text-xs text-slate-300 font-bold uppercase mb-1">Калибровка растра</h4>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 w-16">North (N)</span>
                  <div className="flex gap-1">
                    <button onClick={() => updateBounds(1, 0, -0.001)} className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded">-</button>
                    <span className="text-slate-300 w-16 text-center font-mono">{rasterBounds[1][0].toFixed(4)}</span>
                    <button onClick={() => updateBounds(1, 0, 0.001)} className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded">+</button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 w-16">South (S)</span>
                  <div className="flex gap-1">
                    <button onClick={() => updateBounds(0, 0, -0.001)} className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded">-</button>
                    <span className="text-slate-300 w-16 text-center font-mono">{rasterBounds[0][0].toFixed(4)}</span>
                    <button onClick={() => updateBounds(0, 0, 0.001)} className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded">+</button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 w-16">East (E)</span>
                  <div className="flex gap-1">
                    <button onClick={() => updateBounds(1, 1, -0.001)} className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded">-</button>
                    <span className="text-slate-300 w-16 text-center font-mono">{rasterBounds[1][1].toFixed(4)}</span>
                    <button onClick={() => updateBounds(1, 1, 0.001)} className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded">+</button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 w-16">West (W)</span>
                  <div className="flex gap-1">
                    <button onClick={() => updateBounds(0, 1, -0.001)} className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded">-</button>
                    <span className="text-slate-300 w-16 text-center font-mono">{rasterBounds[0][1].toFixed(4)}</span>
                    <button onClick={() => updateBounds(0, 1, 0.001)} className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded">+</button>
                  </div>
                </div>

                <button 
                  onClick={copyBoundsToClipboard}
                  className="mt-2 flex items-center justify-center gap-2 bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-all"
                >
                  <Copy size={14} /> Копировать Bounds
                </button>
              </div>
            </div>
          )}

          <div className="w-full h-px bg-slate-700 my-1"></div>

          {/* Depth Map Layer Block */}
          <label className="flex items-center justify-between text-slate-200 text-sm cursor-pointer">
            <span className="flex items-center gap-2"><MapIcon size={16} className="text-cyan-400" /> Карта глубин (Лоция)</span>
            <input 
              type="checkbox" 
              checked={showDepthMap} 
              onChange={(e) => setShowDepthMap(e.target.checked)}
              className="accent-cyan-500 w-4 h-4 cursor-pointer"
            />
          </label>

          {showDepthMap && (
            <div className="flex items-center gap-2 pl-6">
              <Eye size={14} className="text-slate-400" />
              <input 
                type="range" 
                min="0" max="1" step="0.1" 
                value={depthOpacity} 
                onChange={(e) => setDepthOpacity(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
                title="Прозрачность лоции"
              />
              <span className="text-xs text-slate-400 w-6">{Math.round(depthOpacity * 100)}%</span>
            </div>
          )}

          <div className="w-full h-px bg-slate-700 my-1"></div>

          {/* Verification Layer Block */}
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
        showDepthMap={showDepthMap}
        depthOpacity={depthOpacity}
        showVerificationLayer={showVerificationLayer}
        
      />
    </div>
  );
}

