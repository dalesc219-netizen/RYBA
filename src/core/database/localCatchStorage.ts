import localforage from 'localforage';

export interface OfflineCatchRecord {
  id: string;
  timestamp: number;
  lat: number;
  lng: number;
  notes?: string;
  tackle?: string;
  media_uris?: string[];
}

const catchStore = localforage.createInstance({
  name: 'FishingAppOffline',
  storeName: 'catches',
  description: 'Offline cache for catch diary records',
});

let isInitialized = false;

async function ensureInitialized() {
  if (isInitialized) return;
  await catchStore.setDriver([localforage.INDEXEDDB, localforage.LOCALSTORAGE]);
  isInitialized = true;
}

export async function initCatchStorage() {
  await ensureInitialized();
}

export async function saveCatch(record: OfflineCatchRecord) {
  await ensureInitialized();
  await catchStore.setItem(record.id, record);
}

export async function getAllCatches(): Promise<OfflineCatchRecord[]> {
  await ensureInitialized();
  const result: OfflineCatchRecord[] = [];

  await catchStore.iterate((value) => {
    if (value && typeof value === 'object') {
      result.push(value as OfflineCatchRecord);
    }
  });

  return result.sort((a, b) => b.timestamp - a.timestamp);
}

export async function deleteCatch(id: string) {
  await ensureInitialized();
  await catchStore.removeItem(id);
}
