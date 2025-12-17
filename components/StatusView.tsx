
import React from 'react';
import { Player } from '../types';
import { WaterSprite } from './WaterSprite';
import { DIMENSION_CONFIG, DimensionType, DAILY_WATER_GOAL } from '../constants';
import { Shield } from 'lucide-react';

interface StatusViewProps {
  player: Player;
  onOpenGratitude: () => void; // 雖然此處不再使用，但為保持 ViewModel 接口一致保留
  isProcessing: boolean; // 不再使用，但為保持 ViewModel 接口一致保留
  totalDamageContrib: number; // 僅用於 WaterSprite 的 isTeamGoalMet prop
}

export const StatusView: React.FC<StatusViewProps> = ({ player, totalDamageContrib }) => {
  // Safe stats
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

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in pb-20 pt-4">
      
      {/* Avatar Section - Retained */}
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
      </div>
      
      {/* --- DIMENSION STATS DISPLAY - Retained --- */}
      <div className="px-1">
          <div className="text-slate-400 text-xs font-bold uppercase mb-3 flex items-center gap-2">
            <Shield size={14} /> Attributes
          </div>
          <div className="grid grid-cols-1 gap-3">
              {Object.values(DimensionType).map((dt) => {
                  const val = stats[dt] || 0;
                  const config = DIMENSION_CONFIG[dt];
                  const { level, progress } = getLevelInfo(val);

                  return (
                      <div key={dt} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center gap-4 relative overflow-hidden">
                          {/* Background Progress Tint */}
                          <div 
                            className={`absolute left-0 top-0 h-full ${config.bg} opacity-5 transition-all duration-700`}
                            style={{ width: `${progress}%` }}
                          ></div>

                          <div className={`w-10 h-10 rounded-full ${config.bg} bg-opacity-20 flex items-center justify-center text-xl shrink-0 border border-slate-700`}>
                              {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                  <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
                                  <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                    Lv.{level}
                                  </span>
                              </div>
                              <div className="relative w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/50">
                                  <div 
                                    className={`h-full ${config.bg} transition-all duration-700 ease-out`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                              </div>
                              <div className="text-[9px] text-slate-500 text-right mt-1 font-mono">
                                  {progress} / 100 XP
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* The following sections have been removed:
          - Player Hearts (Lives) display
          - Buff Card / Gratitude button
          - Today's Intake (Water Progress)
          - Total Contribution (Damage Dealt)
      */}
    </div>
  );
};
