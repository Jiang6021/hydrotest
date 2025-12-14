import React from 'react';
import { Boss } from '../types';
import { Flame } from 'lucide-react';

interface BossCardProps {
  boss: Boss;
  isHit: boolean;
  isSurprised?: boolean;
}

export const BossCard: React.FC<BossCardProps> = ({ boss, isHit, isSurprised }) => {
  const hpPercentage = (boss.currentHp / boss.maxHp) * 100;
  
  return (
    <div className={`relative bg-orange-950/40 rounded-xl p-6 border-2 border-orange-700 shadow-[0_0_20px_rgba(234,88,12,0.3)] overflow-hidden transition-transform ${isHit ? 'shake-animation' : ''} ${isSurprised ? 'scale-[0.98]' : ''}`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Flame size={120} className="text-orange-500" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Boss Avatar */}
        <div className={`w-24 h-24 bg-orange-900/50 rounded-full flex items-center justify-center border-4 ${boss.isDefeated ? 'border-slate-600 bg-slate-800' : 'border-orange-600'} mb-4 shadow-[0_0_15px_rgba(234,88,12,0.5)] transition-all ${isSurprised ? 'scale-110 border-orange-400' : ''}`}>
          {boss.isDefeated ? (
             // Dead Face: XX Eyes and Tongue
             <div className="relative w-16 h-16 flex flex-col items-center justify-center">
                 <div className="flex gap-2 mb-1">
                     <div className="text-xl font-bold text-slate-400">X</div>
                     <div className="text-xl font-bold text-slate-400">X</div>
                 </div>
                 {/* Tongue */}
                 <div className="w-4 h-6 bg-pink-500 rounded-b-full absolute -bottom-1 left-1/2 -translate-x-1/2 border border-pink-700"></div>
             </div>
          ) : (
             // Alive Face
             <span className="text-5xl animate-pulse">🔥</span>
          )}
        </div>
        
        <h2 className={`text-2xl font-pixel mb-1 uppercase tracking-widest drop-shadow-md ${boss.isDefeated ? 'text-slate-500 line-through' : 'text-orange-100'}`}>
            {boss.name}
        </h2>
        <p className="text-orange-400 text-sm mb-4 font-pixel">HP: {boss.currentHp} / {boss.maxHp}</p>

        {/* Health Bar Container */}
        <div className="w-full bg-slate-900 h-6 rounded-full border border-orange-900/50 relative overflow-hidden">
          {/* Fill */}
          <div 
            className={`h-full transition-all duration-500 ease-out ${boss.isDefeated ? 'bg-slate-700' : 'bg-gradient-to-r from-red-600 to-orange-500'}`}
            style={{ width: `${hpPercentage}%` }}
          >
          </div>
        </div>
      </div>
    </div>
  );
};