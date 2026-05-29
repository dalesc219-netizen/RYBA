export interface GCPData {
  lat: number;
  lng: number;
  x: number;
  y: number;
  name: string;
}

export const WARP_GCPS: GCPData[] = [
  { lat: 58.093450, lng: 38.685200, x: 1439, y: 1958, name: 'Поселок Переборы' },
  { lat: 58.006700, lng: 38.272100, x: 977, y: 2293, name: 'Село Глебово' },
  { lat: 58.306000, lng: 37.863300, x: 519, y: 1136, name: 'Село Брейтово' },
  { lat: 58.125600, lng: 38.626800, x: 1374, y: 1833, name: 'Остров Юршинский' },
  { lat: 58.198300, lng: 38.435500, x: 1160, y: 1553, name: 'Город Молога' }
];

export const DEPTH_MAP_GCPS: GCPData[] = [
  { lat: 58.093450, lng: 38.685200, x: Math.round(1439 * (13540 / 1680)), y: Math.round(1958 * (15824 / 2319)), name: 'Поселок Переборы' },
  { lat: 58.006700, lng: 38.272100, x: Math.round(977 * (13540 / 1680)), y: Math.round(2293 * (15824 / 2319)), name: 'Село Глебово' },
  { lat: 58.306000, lng: 37.863300, x: Math.round(519 * (13540 / 1680)), y: Math.round(1136 * (15824 / 2319)), name: 'Село Брейтово' },
  { lat: 58.125600, lng: 38.626800, x: Math.round(1374 * (13540 / 1680)), y: Math.round(1833 * (15824 / 2319)), name: 'Остров Юршинский' },
  { lat: 58.198300, lng: 38.435500, x: Math.round(1160 * (13540 / 1680)), y: Math.round(1553 * (15824 / 2319)), name: 'Город Молога' }
];
