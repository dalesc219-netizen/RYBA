import { create } from 'zustand';

interface AppState {
  activeModule: 'dashboard' | 'map' | 'diary';
  setActiveModule: (module: 'dashboard' | 'map' | 'diary') => void;
  userLocation: [number, number] | null;
  setUserLocation: (location: [number, number] | null) => void;
  isOnline: boolean;
  setIsOnline: (status: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'dashboard',
  setActiveModule: (module) => set({ activeModule: module }),
  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
  isOnline: navigator.onLine,
  setIsOnline: (status) => set({ isOnline: status })
}));

// Setup online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useAppStore.getState().setIsOnline(true));
  window.addEventListener('offline', () => useAppStore.getState().setIsOnline(false));
}
