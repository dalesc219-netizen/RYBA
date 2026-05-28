import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, LayersControl, LayerGroup, useMap, Polygon, ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { Star, Target } from 'lucide-react';
import { MAP_CENTER, MAP_BOUNDS, riverBeds, GCPs, historicalPoints } from '../data/mapData';
import type { Category, Point } from '../data/mapData';
import type { CustomPoint } from '../utils/storage';
import { darwinReserveCoords, ichthyologicalZoneCoords } from '../data/zones';
import { recalculateCoords } from '../utils/geo';

interface MainMapProps {
  visiblePoints: Point[];
  customPoints: CustomPoint[];
  userLocation: [number, number] | null;
  targetPoint: Point | CustomPoint | null;
  nearestMode: boolean;
  categoriesInfo: Record<Category, { label: string, icon: React.ReactNode, color: string }>;
  onRoute: (p: Point | CustomPoint) => void;
  onDeleteCustomPoint: (id: string) => void;
  isEditMode: boolean;
  markersOpacity: number;
  onPointDragEnd: (p: Point | CustomPoint, e: any) => void;
  showHistoricalRaster: boolean;
  rasterOpacity: number;
  showVerificationLayer: boolean;
}

function MapEffect({ location }: { location: [number, number] | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (location) {
      map.flyTo(location, 12, { duration: 1.5 });
    }
  }, [location, map]);
  return null;
}

export function MainMap({ 
  visiblePoints, 
  customPoints, 
  userLocation, 
  targetPoint, 
  nearestMode, 
  categoriesInfo, 
  onRoute, 
  onDeleteCustomPoint,
  isEditMode,
  markersOpacity,
  onPointDragEnd,
  showHistoricalRaster,
  rasterOpacity,
  showVerificationLayer
}: MainMapProps) {

  // Recalculate riverbed coordinates
  const recalculatedRiverBeds = useMemo(() => {
    return riverBeds.map(bed => ({
      ...bed,
      coords: bed.coords.map(coord => recalculateCoords(coord[0], coord[1])) as [number, number][]
    }));
  }, []);

  const getPointIcon = (point: Point | CustomPoint) => {
    const isCustom = 'id' in point && !('category' in point);
    const isVerified = isCustom && (point as CustomPoint).verified;
    
    // In edit mode, emphasize verified vs raw with background colors
    let bgClass = 'bg-slate-800/90 border-slate-600/50';
    if (isEditMode) {
      if (isVerified) {
        bgClass = 'bg-green-800/90 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'; // Verified
      } else {
        bgClass = 'bg-red-900/90 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'; // Raw
      }
    } else if (isCustom) {
      bgClass = 'bg-slate-800/90 border-amber-500/50';
    }

    const iconContent = isCustom 
      ? <Star size={22} color="#f59e0b" fill="#f59e0b" />
      : categoriesInfo[(point as Point).category].icon;

    return new L.DivIcon({
      className: `custom-div-icon rounded-full p-1.5 shadow-xl border backdrop-blur-sm ${bgClass}`,
      html: renderToString(iconContent),
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });
  };

  return (
    <MapContainer 
      center={MAP_CENTER} 
      zoom={10} 
      className="w-full h-full z-0"
      zoomControl={false}
    >
      <MapEffect location={nearestMode ? userLocation : null} />
      
      <LayersControl position="bottomright">
        <LayersControl.BaseLayer checked name="Спутник (Esri)">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Темная (CartoDB)">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; CARTO"
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Схема (OSM)">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OSM"
          />
        </LayersControl.BaseLayer>

        <LayersControl.Overlay checked name="Контрольные точки (GCP)">
          <LayerGroup>
            {GCPs.map((gcp, idx) => (
              <Marker 
                key={`gcp-true-${idx}`} 
                position={gcp.trueCoords} 
                icon={new L.DivIcon({
                  className: 'custom-div-icon bg-red-600/90 rounded-full p-1.5 shadow-xl border-2 border-white backdrop-blur-sm shadow-[0_0_15px_rgba(220,38,38,0.8)]',
                  html: renderToString(<Target size={22} color="#fff" />),
                  iconSize: [36, 36],
                  iconAnchor: [18, 36],
                })}
              >
                <Popup className="custom-popup">
                  <div className="flex flex-col gap-2 p-1 min-w-[160px]">
                    <strong className="text-lg text-slate-800 leading-tight">{gcp.name}</strong>
                    <span className="text-xs text-red-600 uppercase tracking-wider font-bold">GCP Якорь</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Затопленные русла">
          <LayerGroup>
            {recalculatedRiverBeds.map((bed, idx) => (
              <Polyline 
                key={idx} 
                positions={bed.coords} 
                pathOptions={{ color: bed.color, weight: 3, opacity: 0.8 }} 
              />
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Зоны запрета (Дарвинский)">
          <Polygon 
            positions={darwinReserveCoords} 
            pathOptions={{ fillColor: "red", fillOpacity: 0.3, color: "red", weight: 2 }}
          >
            <Popup>ВНИМАНИЕ: Зона полного запрета!</Popup>
          </Polygon>
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Ихтиологические зоны">
          <Polygon 
            positions={ichthyologicalZoneCoords} 
            pathOptions={{ fillColor: "orange", fillOpacity: 0.3, color: "orange", weight: 2 }}
          >
            <Popup>ВНИМАНИЕ: Зона запрета лова (судак)!</Popup>
          </Polygon>
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Мои точки">
          <LayerGroup>
            {customPoints.map((point) => (
              <Marker 
                key={point.id} 
                position={point.coords} 
                icon={getPointIcon(point)}
                opacity={markersOpacity}
                draggable={isEditMode}
                eventHandlers={{ dragend: (e) => onPointDragEnd(point, e) }}
              >
                <Popup className="custom-popup">
                  <div className="flex flex-col gap-2 p-1 min-w-[160px]">
                    <strong className="text-lg text-slate-800 leading-tight">{point.name}</strong>
                    <span className={`text-xs uppercase tracking-wider font-bold ${point.verified ? 'text-green-600' : 'text-amber-600'}`}>
                      {point.verified ? 'Проверено' : 'Личная точка'}
                    </span>
                    <button onClick={() => onRoute(point)} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all">
                      Маршрут
                    </button>
                    <button onClick={() => onDeleteCustomPoint(point.id)} className="mt-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold py-2 px-4 rounded-xl transition-all text-sm">
                      Удалить
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>

      {userLocation && targetPoint && (
        <Polyline 
          positions={[userLocation, targetPoint.coords]} 
          pathOptions={{ color: '#ef4444', weight: 4, dashArray: '10, 10' }} 
        />
      )}

      {userLocation && (
        <Marker position={userLocation}>
          <Popup>Ваше местоположение</Popup>
        </Marker>
      )}

      {showHistoricalRaster && (
        <ImageOverlay
          url="/karta-rybinskoe-more.jpg.jpg"
          bounds={MAP_BOUNDS}
          opacity={rasterOpacity}
          zIndex={10}
        />
      )}

      {showVerificationLayer && historicalPoints.map((point, idx) => (
        <Marker
          key={`verify-${point.id || idx}`}
          position={point.coords}
          icon={new L.DivIcon({
            className: 'custom-div-icon bg-yellow-400 rounded-full flex items-center justify-center font-bold text-black border-2 border-black shadow-[0_0_10px_rgba(0,0,0,0.5)]',
            html: `<span>${point.id}</span>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}
          zIndexOffset={1000}
        >
          <Popup className="custom-popup">
            <div className="flex flex-col gap-2 p-1 min-w-[160px]">
              <strong className="text-lg text-slate-800 leading-tight">#{point.id} {point.name}</strong>
              <span className="text-xs text-slate-600 font-mono">[{point.coords[0].toFixed(4)}, {point.coords[1].toFixed(4)}]</span>
            </div>
          </Popup>
        </Marker>
      ))}

      {visiblePoints.map((point, idx) => (
        <Marker 
          key={`hist-${idx}`} 
          position={point.coords} 
          icon={getPointIcon(point)}
          opacity={markersOpacity}
          draggable={isEditMode}
          eventHandlers={{ dragend: (e) => onPointDragEnd(point, e) }}
        >
          <Popup className="custom-popup">
            <div className="flex flex-col gap-2 p-1 min-w-[160px]">
              <strong className="text-lg text-slate-800 leading-tight">{point.name}</strong>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{categoriesInfo[point.category].label}</span>
              <button onClick={() => onRoute(point)} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all">
                Маршрут
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
