import React from 'react';
import { Menu, X, Map as MapIcon, BookOpen, Target, Wifi, WifiOff } from 'lucide-react';
import { useAppStore } from './core/store';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { Dashboard } from './modules/Dashboard/Dashboard';
import { MapScreen } from './modules/Map/MapScreen';
import { Diary } from './modules/Diary/Diary';

export default function App() {
  const { activeModule, setActiveModule, isOnline } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navigateTo = (module: 'dashboard' | 'map' | 'diary') => {
    setActiveModule(module);
    setIsMenuOpen(false);
  };

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col relative">
      
      {/* Top Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-md z-[2000] border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          <span className="font-bold text-lg tracking-wide">Внедорожник</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {isOnline ? (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full"><Wifi size={14} /> Online</span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full"><WifiOff size={14} /> Offline</span>
          )}
        </div>
      </header>

      {/* Burger Menu Overlay */}
      {isMenuOpen && (
        <div className="absolute inset-0 z-[1900] bg-slate-950/95 backdrop-blur-xl pt-20 px-4">
          <nav className="flex flex-col gap-4">
            <button 
              onClick={() => navigateTo('dashboard')}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeModule === 'dashboard' ? 'bg-emerald-600/20 border border-emerald-500/30' : 'bg-slate-900 border border-slate-800 hover:bg-slate-800'}`}
            >
              <Target size={24} className={activeModule === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'} />
              <span className={`text-xl font-medium ${activeModule === 'dashboard' ? 'text-emerald-100' : 'text-slate-200'}`}>Главная</span>
            </button>
            <button 
              onClick={() => navigateTo('map')}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeModule === 'map' ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-slate-900 border border-slate-800 hover:bg-slate-800'}`}
            >
              <MapIcon size={24} className={activeModule === 'map' ? 'text-blue-400' : 'text-slate-400'} />
              <span className={`text-xl font-medium ${activeModule === 'map' ? 'text-blue-100' : 'text-slate-200'}`}>Навигация</span>
            </button>
            <button 
              onClick={() => navigateTo('diary')}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeModule === 'diary' ? 'bg-amber-600/20 border border-amber-500/30' : 'bg-slate-900 border border-slate-800 hover:bg-slate-800'}`}
            >
              <BookOpen size={24} className={activeModule === 'diary' ? 'text-amber-400' : 'text-slate-400'} />
              <span className={`text-xl font-medium ${activeModule === 'diary' ? 'text-amber-100' : 'text-slate-200'}`}>Дневник уловов</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full relative">
        <ErrorBoundary>
          {activeModule === 'dashboard' && <Dashboard />}
          {activeModule === 'map' && <MapScreen />}
          {activeModule === 'diary' && <Diary />}
        </ErrorBoundary>
      </main>
    </div>
  );
}
