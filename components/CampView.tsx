import React from 'react';
import { Player } from '../types';
import { DAILY_QUESTS } from '../constants';
import { Tent, Gift, CheckCircle, Circle, Map } from 'lucide-react';

interface CampViewProps {
  player: Player;
  onCompleteQuest: (id: string, label: string) => void;
  isProcessing: boolean;
}

export const CampView: React.FC<CampViewProps> = ({ player, onCompleteQuest, isProcessing }) => {
  const completed = player.completedQuests || [];
  const inventory = player.inventory || [];
  
  // Group inventory items by count
  const inventoryCounts = inventory.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Area */}
        <div className="bg-emerald-900/40 p-6 rounded-2xl border border-emerald-800/50 flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                 <div className="absolute top-2 left-2 text-emerald-400"><Tent size={100} /></div>
             </div>
             
             <h2 className="text-2xl font-pixel text-emerald-300 mb-1 z-10">Resting Camp</h2>
             <p className="text-emerald-500/80 text-xs z-10 max-w-xs">
                Take a break from the battle. Complete simple wellness tasks to find hidden treasures.
             </p>
        </div>

        {/* Quest Board */}
        <div className="space-y-3">
            <h3 className="text-slate-400 text-xs font-bold uppercase flex items-center gap-2">
                <Map size={14} /> Guild Requests (Daily)
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
                {DAILY_QUESTS.map((quest) => {
                    const isDone = completed.includes(quest.id);
                    return (
                        <button
                            key={quest.id}
                            onClick={() => !isDone && onCompleteQuest(quest.id, quest.label)}
                            disabled={isDone || isProcessing}
                            className={`
                                relative p-4 rounded-xl border flex items-center justify-between group transition-all
                                ${isDone 
                                    ? 'bg-slate-900/50 border-slate-800 opacity-60' 
                                    : 'bg-slate-800 border-slate-700 hover:border-emerald-500 hover:bg-slate-800/80 active:scale-[0.98]'
                                }
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-slate-900 ${isDone ? 'grayscale' : ''}`}>
                                    {quest.icon}
                                </div>
                                <div className="text-left">
                                    <div className={`font-bold ${isDone ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                        {quest.label}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                        Reward: Mystery Trinket
                                    </div>
                                </div>
                            </div>
                            
                            <div className={isDone ? 'text-emerald-500' : 'text-slate-600 group-hover:text-emerald-400'}>
                                {isDone ? <CheckCircle size={24} /> : <Circle size={24} />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Collection Grid */}
        <div className="space-y-3">
            <h3 className="text-slate-400 text-xs font-bold uppercase flex items-center gap-2">
                <Gift size={14} /> Trinket Collection
            </h3>
            
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 min-h-[120px]">
                {inventory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 text-slate-600 text-xs text-center">
                        <p>Your backpack is empty.</p>
                        <p>Complete quests or drink water to find items!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-5 gap-2">
                        {Object.entries(inventoryCounts).map(([icon, count], idx) => (
                            <div key={idx} className="aspect-square bg-slate-800 rounded-lg flex flex-col items-center justify-center relative border border-slate-700 hover:bg-slate-700 transition-colors group cursor-help" title={`You have ${count}`}>
                                <span className="text-2xl group-hover:scale-125 transition-transform duration-200">{icon}</span>
                                {(count as number) > 1 && (
                                    <span className="absolute -top-1 -right-1 bg-slate-950 text-emerald-400 text-[9px] font-bold px-1.5 rounded-full border border-slate-700">
                                        {count as number}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};