import { useLiveQuery } from 'dexie-react-hooks';
import { MapPin, Clock, Trash2, Camera } from 'lucide-react';
import { db } from '../../core/db';

export function Diary() {
  const catches = useLiveQuery(() => db.catches.orderBy('timestamp').reverse().toArray());

  const handleDelete = async (id: string) => {
    if (window.confirm('Точно удалить эту запись?')) {
      await db.catches.delete(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 pt-20">
      <h1 className="text-3xl font-bold mb-6 text-slate-100">Дневник уловов</h1>
      
      <div className="flex-1 overflow-y-auto pb-6 space-y-4">
        {!catches && (
          <div className="text-center text-slate-500 py-10 animate-pulse">Загрузка...</div>
        )}
        
        {catches && catches.length === 0 && (
          <div className="text-center text-slate-500 py-10 bg-slate-900 rounded-2xl border border-slate-800">
            <p>Дневник пока пуст.</p>
            <p className="text-sm mt-2">Сделайте первую поимку на главном экране!</p>
          </div>
        )}

        {catches && catches.map(record => (
          <div key={record.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl relative group">
            <button 
              onClick={() => handleDelete(record.id)}
              className="absolute top-4 right-4 text-slate-500 hover:text-rose-500 transition-colors"
            >
              <Trash2 size={20} />
            </button>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Clock size={16} />
                <span>{new Date(record.timestamp).toLocaleString('ru-RU')}</span>
              </div>
              
              <div className="flex items-center gap-2 text-slate-300 font-mono text-sm">
                <MapPin size={16} className="text-amber-500" />
                <span>{record.lat.toFixed(5)}, {record.lng.toFixed(5)}</span>
              </div>
              
              {(record.notes || record.tackle) ? (
                <div className="mt-3 p-3 bg-slate-950 rounded-xl text-sm text-slate-300">
                  {record.notes && <p><span className="text-slate-500">Заметка:</span> {record.notes}</p>}
                  {record.tackle && <p className="mt-1"><span className="text-slate-500">Снасть:</span> {record.tackle}</p>}
                </div>
              ) : (
                <div className="mt-3 p-3 bg-slate-950/50 rounded-xl text-sm text-slate-500 italic">
                  Нет заметок (черновик)
                </div>
              )}
              
              {record.media_uris && record.media_uris.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {record.media_uris.map((_, idx) => (
                    <div key={idx} className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 flex-shrink-0">
                      <Camera size={20} className="text-slate-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
