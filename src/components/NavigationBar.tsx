import { NavLink } from 'react-router-dom';
import { Target, Map as MapIcon, BookOpen } from 'lucide-react';

export function NavigationBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#1E1E1E]/95 backdrop-blur-md border-t border-slate-800 z-50 flex items-center justify-around px-2 pb-safe">
      <NavLink
        to="/"
        className={({ isActive }) =>
          "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors " +
          (isActive ? "text-emerald-400" : "text-slate-400 hover:text-slate-300")
        }
      >
        <Target size={24} />
        <span className="text-xs font-medium">Дашборд</span>
      </NavLink>

      <NavLink
        to="/map"
        className={({ isActive }) =>
          "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors " +
          (isActive ? "text-blue-400" : "text-slate-400 hover:text-slate-300")
        }
      >
        <MapIcon size={24} />
        <span className="text-xs font-medium">Лоция</span>
      </NavLink>

      <NavLink
        to="/diary"
        className={({ isActive }) =>
          "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors " +
          (isActive ? "text-amber-400" : "text-slate-400 hover:text-slate-300")
        }
      >
        <BookOpen size={24} />
        <span className="text-xs font-medium">Дневник</span>
      </NavLink>
    </nav>
  );
}
