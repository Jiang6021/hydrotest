import React from 'react';
import { Player } from '../types';
import { DAILY_QUESTS } from '../constants';
import { CheckCircle, Circle, Sun, Battery } from 'lucide-react';

interface LobbyViewProps {
  player: Player;
  onCompleteQuest: (id: string, label: string) => void;
  isProcessing: boolean;
}

export const LobbyView: React.FC<LobbyViewProps> = ({ player, onCompleteQuest, isProcessing }) => {
  const completed = player.completedQuests || [];
  
  // Filter to show only UNCOMPLETED quests to reduce clutter (or show completed at bottom)
  const uncompletedQuests = DAILY_QUESTS.filter(q => !completed.includes(q.id));
  const completedCount = completed.length;
  const totalCount = DAILY_QUESTS.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-6 animate-in slide-in-from-left-4 duration-300 fade-in pb-20">
        
        {/* Welcome Header */}
        <div className="pt-4 px-2">
            <h2 className="text-2xl font-bold text-white mb-1">Good Day, {player.name}</h2>
            <p className="text-slate-400 text-xs">Small steps lead to big victories.</p>
        </div>

        {/* Daily Momentum Card */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-5 border border-indigo-500/30 relative overflow-hidden shadow-lg">
             <div className="absolute right-0 top-0 p-4 opacity-10">
                 <Sun size={80} className="text-yellow-400" />
             </div>
             
             <div className="relative z-10">
                 <div className="flex justify-between items-end mb-2">
                     <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Daily Momentum</span>
                     <span className="text-2xl font-pixel text-white">{progress}%</span>
                 </div>
                 <div className="w-full bg-slate-950/50 h-2 rounded-full overflow-hidden">
                     <div className="bg-indigo-400 h-full transition-all duration-1000" style={{width: `${progress}%`}}></div>
                 </div>
                 <div className="mt-2 text-[10px] text-indigo-300 flex items-center gap-1">
                     <Battery size={10} /> {completedCount}/{totalCount} actions completed
                 </div>
             </div>
        </div>

        {/* 1% Action Cards */}
        <div className="space-y-3">
            <h3 className="text-slate-400 text-xs font-bold uppercase px-2">Today's 1% Actions</h3>
            
            {uncompletedQuests.length === 0 ? (
                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-8 text-center animate-in zoom-in duration-300">
                    <CheckCircle className="mx-auto text-emerald-400 mb-2" size={40} />
                    <h3 className="text-emerald-300 font-bold mb-1">All Clear!</h3>
                    <p className="text-slate-400 text-xs">You've built great momentum today.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {uncompletedQuests.map((quest) => (
                        <button
                            key={quest.id}
                            onClick={() => onCompleteQuest(quest.id, quest.label)}
                            disabled={isProcessing}
                            className="bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700 hover:border-indigo-500 p-5 rounded-xl text-left transition-all shadow-md group relative overflow-hidden"
                        >
                            <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl bg-slate-900 w-12 h-12 rounded-full flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-200">
                                        {quest.icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{quest.label}</div>
                                        <div className="text-[10px] text-indigo-400 font-medium mt-0.5"> Tap to complete</div>
                                    </div>
                                </div>
                                <Circle className="text-slate-600 group-hover:text-indigo-400" size={24} />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
        
        {/* Completed list (faded) */}
        {completedCount > 0 && uncompletedQuests.length > 0 && (
            <div className="px-2 pt-4 border-t border-slate-800/50">
                 <p className="text-xs text-slate-600 mb-2">Completed</p>
                 <div className="flex flex-wrap gap-2">
                     {completed.map(id => {
                         const q = DAILY_QUESTS.find(q => q.id === id);
                         if(!q) return null;
                         return (
                             <span key={id} className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center gap-1 opacity-60">
                                 <CheckCircle size={10} /> {q.label}
                             </span>
                         )
                     })}
                 </div>
            </div>
        )}
    </div>
  );
};