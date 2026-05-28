import { GCPs } from '../data/mapData';

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    0.5 - Math.cos(dLat)/2 + 
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    (1 - Math.cos(dLon))/2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export function recalculateCoords(lat: number, lng: number): [number, number] {
  if (!GCPs || GCPs.length === 0) return [lat, lng];

  // Find nearest GCP based on raw coordinates
  let nearestGCP = GCPs[0];
  let minDistance = getDistance(lat, lng, GCPs[0].rawCoords[0], GCPs[0].rawCoords[1]);

  for (let i = 1; i < GCPs.length; i++) {
    const d = getDistance(lat, lng, GCPs[i].rawCoords[0], GCPs[i].rawCoords[1]);
    if (d < minDistance) {
      minDistance = d;
      nearestGCP = GCPs[i];
    }
  }

  // Calculate shift delta from the nearest GCP
  const deltaLat = nearestGCP.trueCoords[0] - nearestGCP.rawCoords[0];
  const deltaLng = nearestGCP.trueCoords[1] - nearestGCP.rawCoords[1];

  return [lat + deltaLat, lng + deltaLng];
}
