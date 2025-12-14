import React from 'react';
import { Player } from '../types';
import { WaterSprite } from './WaterSprite';
import { BUFF_DESCRIPTIONS, BuffType, DAILY_WATER_GOAL } from '../constants';
import { Heart, Sparkles, ScrollText, Droplets, Shield } from 'lucide-react';

interface StatusViewProps {
  player: Player;
  onOpenGratitude: () => void;
  isProcessing: boolean;
  totalDamageContrib: number;
}

export const StatusView: React.FC<StatusViewProps> = ({ player, onOpenGratitude, isProcessing, totalDamageContrib }) => {
  const hasBuff = player.activeBuff !== BuffType.NONE;
  const progressPercent = Math.min((player.todayWaterMl / DAILY_WATER_GOAL) * 100, 100);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in pb-20 pt-4">
      
      {/* Avatar Section */}
      <div className="flex flex-col items-center justify-center py-6 relative">
          <div className="absolute top-0 w-full h-full bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="scale-150 mb-6 relative z-10">
            <WaterSprite 
                isDrinking={false} 
                isHappy={player.todayWaterMl >= DAILY_WATER_GOAL} 
                isTeamGoalMet={totalDamageContrib > 5000} 
            />
          </div>
          
          <h2 className="text-2xl font-bold text-white font-pixel mb-2">{player.name}</h2>
          
          <div className="flex gap-1 mb-4 bg-slate-900/50 p-2 rounded-full border border-slate-800">
            {[...Array(3)].map((_, i) => (
                <Heart 
                    key={i} 
                    size={20} 
                    className={i < player.hp ? "fill-red-500 text-red-500 drop-shadow-md" : "text-slate-700 fill-slate-700"} 
                />
            ))}
          </div>

          {/* Buff Card */}
          <div 
            onClick={onOpenGratitude}
            className={`cursor-pointer w-full max-w-xs p-4 rounded-xl border transition-all active:scale-95
                ${hasBuff 
                    ? 'bg-purple-900/20 border-purple-500/50 hover:bg-purple-900/30' 
                    : 'bg-slate-800/50 border-slate-700 border-dashed hover:border-slate-500'
                }
            `}
          >
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${hasBuff ? 'bg-purple-900 text-purple-300' : 'bg-slate-800 text-slate-500'}`}>
                          {hasBuff ? <Sparkles size={20} /> : <ScrollText size={20} />}
                      </div>
                      <div className="text-left">
                          <div className={`text-xs font-bold uppercase ${hasBuff ? 'text-purple-300' : 'text-slate-400'}`}>
                              {hasBuff ? 'Active Buff' : 'No Buff Active'}
                          </div>
                          <div className={`text-sm font-medium ${hasBuff ? 'text-white' : 'text-slate-500'}`}>
                              {hasBuff ? BUFF_DESCRIPTIONS[player.activeBuff] : 'Tap to cast Gratitude'}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                  <Droplets size={12} /> Today's Intake
              </div>
              <div className="text-2xl font-pixel text-cyan-400">
                  {player.todayWaterMl}<span className="text-xs text-slate-600 font-sans ml-1">/ {DAILY_WATER_GOAL}ml</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-cyan-500 h-full" style={{width: `${progressPercent}%`}}></div>
              </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                  <Shield size={12} /> Total Contribution
              </div>
              <div className="text-xl font-mono font-bold text-orange-400">
                  {player.totalDamageDealt} <span className="text-xs text-orange-600/70">DMG</span>
              </div>
          </div>
      </div>
    </div>
  );
};