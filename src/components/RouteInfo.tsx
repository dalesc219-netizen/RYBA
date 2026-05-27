import { X } from 'lucide-react';
import type { Point } from '../data/mapData';
import type { CustomPoint } from '../utils/storage';

interface RouteInfoProps {
  targetPoint: Point | CustomPoint | null;
  targetDistance: number | null;
  onClose: () => void;
}

export function RouteInfo({ targetPoint, targetDistance, onClose }: RouteInfoProps) {
  if (!targetPoint || targetDistance === null) return null;

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-md text-slate-100 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-5 border border-slate-700/50">
      <div className="flex flex-col">
        <span className="font-bold text-sm text-amber-500 mb-0.5">🎯 Цель: {targetPoint.name}</span>
        <span className="text-sm font-medium">
          Дистанция: {targetDistance < 1 ? (targetDistance * 1000).toFixed(0) + ' м' : targetDistance.toFixed(2) + ' км'}
        </span>
      </div>
      <button 
        onClick={onClose}
        className="p-1.5 hover:bg-slate-700/50 rounded-full transition-colors border border-transparent hover:border-slate-600"
      >
        <X size={18} />
      </button>
    </div>
  );
}
