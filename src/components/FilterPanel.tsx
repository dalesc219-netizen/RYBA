import React from 'react';
import { Navigation, Crosshair } from 'lucide-react';
import type { Category } from '../data/mapData';

interface FilterPanelProps {
  categoriesInfo: Record<Category, { label: string, icon: React.ReactNode, color: string }>;
  activeCategories: Set<Category>;
  nearestMode: boolean;
  onToggleCategory: (cat: Category) => void;
  onNearest: () => void;
}

export function FilterPanel({ categoriesInfo, activeCategories, nearestMode, onToggleCategory, onNearest }: FilterPanelProps) {
  return (
    <div className="absolute top-2 left-2 right-14 z-[1000] flex flex-col gap-2 pointer-events-none">
      <div className="flex gap-2 overflow-x-auto pb-2 pointer-events-auto hide-scrollbar">
        <button 
          onClick={onNearest}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg font-semibold text-sm transition-all backdrop-blur-md border ${
            nearestMode 
            ? 'bg-blue-600/90 text-white border-blue-500' 
            : 'bg-slate-900/80 text-slate-200 border-slate-700/50 hover:bg-slate-800'
          }`}
        >
          <Navigation size={18} /> Ближайшие
        </button>
        
        {(Object.keys(categoriesInfo) as Category[]).map(cat => {
          const isActive = activeCategories.has(cat) && !nearestMode;
          const info = categoriesInfo[cat];
          return (
            <button
              key={cat}
              onClick={() => onToggleCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg font-semibold text-sm transition-all backdrop-blur-md border ${
                isActive 
                ? 'bg-slate-100 text-slate-900 border-slate-300' 
                : 'bg-slate-900/80 text-slate-300 border-slate-700/50 hover:bg-slate-800'
              }`}
            >
              {isActive ? <Crosshair size={16} /> : null}
              {info.label}
            </button>
          )
        })}
      </div>
    </div>
  );
}
