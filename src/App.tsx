import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Wifi, WifiOff } from 'lucide-react';
import { useAppStore } from './core/store';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { Dashboard } from './modules/Dashboard/Dashboard';
import { Diary } from './modules/Diary/Diary';
import { NavigationBar } from './components/NavigationBar';

// Lazy load MapScreen to improve startup performance
const MapScreen = React.lazy(() => import('./modules/Map/MapScreen').then(module => ({ default: module.MapScreen })));

export default function App() {
  const { isOnline } = useAppStore();

  return (
    <Router>
      <div className="w-screen h-screen bg-[#121212] text-slate-100 overflow-hidden flex flex-col relative">
        {/* Top Status Bar (Minimal) */}
        <header className="absolute top-0 left-0 right-0 h-14 bg-[#1E1E1E]/80 backdrop-blur-md z-[2000] border-b border-slate-800 flex items-center justify-between px-4">
          <span className="font-bold text-lg tracking-wide">Внедорожник</span>
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                <Wifi size={14} /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">
                <WifiOff size={14} /> Offline
              </span>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full relative pt-14 pb-16">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex-1 flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/map" element={<MapScreen />} />
                <Route path="/diary" element={<Diary />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* Bottom Navigation */}
        <NavigationBar />
      </div>
    </Router>
  );
}