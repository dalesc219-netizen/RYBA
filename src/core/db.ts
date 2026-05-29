import Dexie, { type Table } from 'dexie';

export interface CatchRecord {
  id: string; // UUID
  timestamp: number;
  lat: number;
  lng: number;
  weather_snapshot: any; // JSON
  notes: string;
  tackle: string;
  media_uris: string[]; // JSON array
}

export interface WeatherCacheRecord {
  id: number; // Always 1 for current, or could be days
  last_updated: number;
  forecast_data: any; // JSON
}

export class FishingAppDB extends Dexie {
  catches!: Table<CatchRecord>;
  weather_cache!: Table<WeatherCacheRecord>;

  constructor() {
    super('FishingAppDB');
    this.version(1).stores({
      catches: 'id, timestamp, lat, lng',
      weather_cache: 'id'
    });
  }
}

export const db = new FishingAppDB();
