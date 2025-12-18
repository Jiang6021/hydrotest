
import React from 'react';
import { Player } from '../types';
import { WaterSprite } from './WaterSprite';
import { DIMENSION_CONFIG, DimensionType, DAILY_WATER_GOAL } from '../constants';
import { Shield, Sparkles, ChevronRight, Zap } from 'lucide-react';

interface StatusViewProps {
  player: Player;
  onOpenGratitude: () => void;
  isProcessing: boolean;
  totalDamageContrib: number;
}

export const StatusView: React.FC<StatusViewProps> = ({ player, totalDamageContrib }) => {
  // Safe stats fallback
  const stats = player.stats || {
      [DimensionType.RESILIENCE]: 0,
      [DimensionType.CHARM]: 0,
      [DimensionType.ACADEMICS]: 0,
      [DimensionType.PHYSIQUE]: 0,
      [DimensionType.CREATIVITY]: 0,
  };

  const getLevelInfo = (xp: number) => {
      const level = Math.floor(xp / 100) + 1;
      const progress = xp % 100;
      return { level, progress };
  };

  const dimensions = Object.values(DimensionType);
  const totalXP = Object.values(stats).reduce((a, b) => a + b, 0);
  const overallLevel = Math.floor(totalXP / 500) + 1;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in pb-24 pt-4 px-1">
      
      {/* Avatar Section with Pulse Glow */}
      <div className="flex flex-col items-center justify-center py-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none animate-pulse"></div>
          
          <div className="scale-150 mb-6 relative z-10 transition-transform active:scale-[1.4] cursor-pointer">
            <WaterSprite 
                isDrinking={false} 
                isHappy={player.todayWaterMl >= DAILY_WATER_GOAL} 
                isTeamGoalMet={totalDamageContrib > 5000} 
            />
          </div>
          <div className="z-10 bg-slate-900/80 border border-slate-700 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-sm group">
             <Sparkles size={12} className="text-yellow-400 group-hover:rotate-12 transition-transform" />
             <span className="text-[10px] font-pixel text-slate-300 uppercase tracking-tighter">Level {overallLevel} Grandmaster</span>
          </div>
      </div>
      
      {/* --- UNIFIED ATTRIBUTE CORE PANEL --- */}
      <div className="space-y-3">
          <div className="flex justify-between items-end px-2 mb-1">
            <div className="text-slate-500 text-[10px] font-bold uppercase flex items-center gap-2 tracking-[0.2em]">
                <Shield size={12} /> Character Core Dimensions
            </div>
            <div className="flex items-center gap-1 text-[10px] text-cyan-500/80 font-mono font-bold">
                <Zap size={10} /> {totalXP} TOTAL XP
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
              {dimensions.map((dt, index) => {
                  const val = stats[dt] || 0;
                  const config = DIMENSION_CONFIG[dt];
                  const { level, progress } = getLevelInfo(val);
                  const isLast = index === dimensions.length - 1;

                  return (
                      <div 
                        key={dt} 
                        className={`group px-5 py-4 flex flex-col gap-2 transition-all hover:bg-slate-800/30 ${!isLast ? 'border-b border-slate-800/50' : ''}`}
                      >
                          <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-xl ${config.bg} bg-opacity-10 flex items-center justify-center text-xl border border-slate-800/50 group-hover:border-slate-600 transition-all shadow-inner`}>
                                      {config.icon}
                                  </div>
                                  <div>
                                      <div className={`text-xs font-bold ${config.color} tracking-wide group-hover:translate-x-0.5 transition-transform`}>
                                        {config.label}
                                      </div>
                                      <div className="text-[8px] text-slate-600 font-mono uppercase tracking-widest">{dt}</div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="text-white font-pixel text-[11px] tracking-tighter">Lv.{level}</div>
                                  <div className="text-[8px] text-slate-500 font-bold uppercase tabular-nums">{progress} / 100 XP</div>
                              </div>
                          </div>

                          {/* Refined "Liquid" Progress Bar */}
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/40 p-[1px]">
                              <div 
                                  className={`h-full ${config.bg} rounded-full transition-all duration-[1500ms] ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)] relative overflow-hidden`}
                                  style={{ width: `${progress}%` }}
                              >
                                  {/* Moving sheen effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>

          {/* Path to Mastery Button */}
          <div className="px-4 py-4 bg-gradient-to-r from-slate-900/60 to-slate-900/20 border border-slate-800/50 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-slate-700 hover:bg-slate-800/40 transition-all mt-4">
              <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">View Progression History</span>
              </div>
              <ChevronRight size={14} className="text-slate-600 group-hover:translate-x-1 group-hover:text-slate-400 transition-all" />
          </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
