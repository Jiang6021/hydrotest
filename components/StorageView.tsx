import React from 'react';
import { Player } from '../types';
import { Gift, Package } from 'lucide-react';

interface StorageViewProps {
  player: Player;
}

export const StorageView: React.FC<StorageViewProps> = ({ player }) => {
  const inventory = player.inventory || [];
  
  // Group inventory items by count
  const inventoryCounts = inventory.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 fade-in pb-20 pt-4 px-2">
         
         <div className="flex items-center gap-3 mb-2">
             <div className="bg-amber-900/30 p-3 rounded-xl text-amber-500">
                 <Package size={28} />
             </div>
             <div>
                 <h2 className="text-xl font-bold text-white">Backpack</h2>
                 <p className="text-slate-400 text-xs">Collected trinkets from your journey.</p>
             </div>
         </div>

        {/* Collection Grid */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 min-h-[300px]">
            {inventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-600 text-xs text-center">
                    <Gift size={40} className="mb-2 opacity-20" />
                    <p>Your backpack is empty.</p>
                    <p className="mt-1">Complete quests or drink water to find items!</p>
                </div>
            ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {Object.entries(inventoryCounts).map(([icon, count], idx) => (
                        <div key={idx} className="aspect-square bg-slate-800 rounded-lg flex flex-col items-center justify-center relative border border-slate-700 hover:bg-slate-700 transition-colors group cursor-help shadow-sm">
                            <span className="text-3xl group-hover:scale-125 transition-transform duration-200 filter drop-shadow-md">{icon}</span>
                            {(count as number) > 1 && (
                                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[9px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full border border-slate-900 shadow-sm">
                                    {count as number}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        <div className="text-center text-[10px] text-slate-600">
            Total Items: {inventory.length}
        </div>
    </div>
  );
};