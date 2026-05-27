import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, LayersControl, LayerGroup, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { Star } from 'lucide-react';
import { MAP_CENTER, riverBeds } from '../data/mapData';
import type { Category, Point } from '../data/mapData';
import type { CustomPoint } from '../utils/storage';
import { darwinReserveCoords, ichthyologicalZoneCoords } from '../data/zones';

interface MainMapProps {
  visiblePoints: Point[];
  customPoints: CustomPoint[];
  userLocation: [number, number] | null;
  targetPoint: Point | CustomPoint | null;
  nearestMode: boolean;
  categoriesInfo: Record<Category, { label: string, icon: React.ReactNode, color: string }>;
  onRoute: (p: Point | CustomPoint) => void;
  onDeleteCustomPoint: (id: string) => void;
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

const customPointIcon = new L.DivIcon({
  className: 'custom-div-icon bg-slate-800/90 rounded-full p-1.5 shadow-xl border border-amber-500/50 backdrop-blur-sm',
  html: renderToString(<Star size={22} color="#f59e0b" fill="#f59e0b" />),
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

export function MainMap({ 
  visiblePoints, 
  customPoints, 
  userLocation, 
  targetPoint, 
  nearestMode, 
  categoriesInfo, 
  onRoute, 
  onDeleteCustomPoint 
}: MainMapProps) {

  const getIcon = (category: Category) => {
    const info = categoriesInfo[category];
    return new L.DivIcon({
      className: 'custom-div-icon bg-slate-800/90 rounded-full p-1.5 shadow-xl border border-slate-600/50 backdrop-blur-sm',
      html: renderToString(info.icon),
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

        <LayersControl.Overlay checked name="Затопленные русла">
          <LayerGroup>
            {riverBeds.map((bed, idx) => (
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
              <Marker key={point.id} position={point.coords} icon={customPointIcon}>
                <Popup className="custom-popup">
                  <div className="flex flex-col gap-2 p-1 min-w-[160px]">
                    <strong className="text-lg text-slate-800 leading-tight">{point.name}</strong>
                    <span className="text-xs text-amber-600 uppercase tracking-wider font-bold">Личная точка</span>
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

      {visiblePoints.map((point, idx) => (
        <Marker key={idx} position={point.coords} icon={getIcon(point.category)}>
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
