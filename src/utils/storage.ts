export interface CustomPoint {
  id: string;
  name: string;
  coords: [number, number];
  verified?: boolean;
}

const STORAGE_KEY = 'rybinka_my_points';

export function getCustomPoints(): CustomPoint[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse custom points", e);
    }
  }
  return [];
}

export function saveCustomPoints(points: CustomPoint[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
}
