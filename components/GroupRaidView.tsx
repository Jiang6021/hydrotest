import React from 'react';
import { Boss, Player, GameLog, RoomData } from '../types';
import { BossCard } from './BossCard';
import { EventBanner } from './EventBanner';
import { Droplets, Trophy, Clock } from 'lucide-react';
import { BuffType, DAILY_WATER_GOAL } from '../constants';

interface GroupRaidViewProps {
  roomData: RoomData;
  currentPlayer: Player;
  otherPlayers: Player[];
  logs: GameLog[];
  onDrink: (ml: number) => void;
  onReset?: () => void; // Optional now, or removed if unused
  isProcessing: boolean;
  lastActionFeedback: any;
}

export const GroupRaidView: React.FC<GroupRaidViewProps> = ({ 
  roomData, 
  currentPlayer, 
  otherPlayers, 
  logs, 
  onDrink, 
  isProcessing,
  lastActionFeedback
}) => {
  const boss = roomData.boss;
  const hasBuff = currentPlayer.activeBuff !== BuffType.NONE;
  const totalRaidDamage = otherPlayers.reduce((acc, p) => acc + p.totalDamageDealt, 0);
  const isJustDrank = lastActionFeedback !== null && lastActionFeedback.val > 0;

  return (
    <div className="space-y-5 animate-in slide-in-from-right-8 duration-300 fade-in pb-20 pt-2">
         {/* Daily Event */}
        {roomData.dailyEvent && <EventBanner event={roomData.dailyEvent} />}
        
        {/* Boss Section */}
        {boss && (
            <BossCard 
                boss={boss} 
                isHit={isJustDrank} 
                isSurprised={isProcessing} 
            />
        )}

        {/* --- ACTION BUTTON --- */}
        <button
            onClick={() => onDrink(250)}
            disabled={isProcessing || !boss || boss.isDefeated || currentPlayer.hp <= 0}
            className={`w-full relative overflow-hidden group py-5 rounded-xl transition-all shadow-[0_4px_0_rgb(0,0,0,0.5)] active:shadow-none active:translate-y-1
                ${hasBuff 
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 border-2 border-purple-400' 
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 border-2 border-cyan-400'
                }
                disabled:grayscale disabled:cursor-not-allowed disabled:active:translate-y-0
            `}
        >
            <div className="flex items-center justify-center gap-3">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                     <Droplets className="text-white fill-white" size={24} />
                </div>
                <div className="flex flex-col items-start text-white">
                    <span className="font-pixel text-lg leading-none">ATTACK</span>
                    <span className="text-[10px] font-bold opacity-80">DRINK 250ML</span>
                </div>
            </div>
            {/* Buff Indicator */}
            {hasBuff && (
                <div className="absolute top-2 right-2 text-[10px] bg-purple-900/80 px-2 py-0.5 rounded text-purple-200 font-bold animate-pulse">
                    BUFFED
                </div>
            )}
        </button>

        {/* --- LEADERBOARD --- */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-900 p-3 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Trophy size={14} className="text-yellow-500" /> Leaderboard
                </h3>
                <span className="text-[10px] text-slate-500">{otherPlayers.length} Active</span>
            </div>
            
            <div className="divide-y divide-slate-800/50 max-h-60 overflow-y-auto custom-scrollbar">
                {otherPlayers.map((p, index) => {
                const contribution = totalRaidDamage > 0 ? Math.round((p.totalDamageDealt / totalRaidDamage) * 100) : 0;
                const isMe = p.id === currentPlayer?.id;
                
                return (
                    <div key={p.id} className={`flex items-center p-3 text-sm transition-all ${isMe ? 'bg-amber-900/10 border-l-2 border-amber-500' : ''}`}>
                        <div className={`w-6 text-center font-pixel text-xs mr-2 ${index < 3 ? 'text-yellow-400' : 'text-slate-600'}`}>
                            {index + 1}
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${isMe ? 'text-amber-300' : 'text-slate-300'}`}>
                                    {p.name}
                                </span>
                                {p.hp <= 0 && <span className="text-[9px] bg-red-900 text-red-300 px-1 rounded">KO</span>}
                            </div>
                            <div className="w-24 h-1 bg-slate-800 rounded-full mt-1">
                                <div className="h-full bg-blue-500 rounded-full" style={{width: `${Math.min((p.todayWaterMl/DAILY_WATER_GOAL)*100, 100)}%`}}></div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="font-mono text-orange-400 font-bold">{p.totalDamageDealt}</div>
                            <div className="text-[9px] text-slate-600">{contribution}%</div>
                        </div>
                    </div>
                );
                })}
            </div>
        </div>

        {/* Logs */}
        <div className="bg-black/20 rounded-lg p-3 h-32 flex flex-col border border-slate-800/50">
            <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                {logs.map((log) => (
                <div key={log.id} className="text-[10px] flex gap-2 text-slate-500 border-b border-slate-800/30 pb-1 last:border-0">
                    <span className="text-slate-700 font-mono opacity-50">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span>
                        <span className={log.userId === currentPlayer?.id ? 'text-cyan-500 font-bold' : 'text-slate-400'}>
                            {log.userId === currentPlayer?.id ? 'You' : log.userName}
                        </span> {log.message.replace(log.userName, '')}
                    </span>
                </div>
                ))}
            </div>
        </div>

        {/* Victory Overlay (Daily Task Completed) */}
        {boss && boss.isDefeated && (
         <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in duration-300">
            <div className="bg-slate-900 border-2 border-cyan-500 p-8 rounded-2xl max-w-sm w-full text-center shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                <div className="mb-6">
                    <Trophy size={64} className="text-yellow-400 mx-auto animate-bounce" />
                </div>
                <h3 className="font-pixel text-cyan-400 text-2xl mb-2">DAILY CLEAR!</h3>
                <p className="text-slate-300 text-sm mb-6">The Demon has been driven back.</p>
                
                <div className="bg-slate-800 p-4 rounded-xl mb-6">
                    <div className="text-xs text-slate-500 uppercase mb-2">Today's MVP</div>
                    <div className="text-xl font-bold text-white">{otherPlayers[0]?.name || 'Unknown'}</div>
                    <div className="text-orange-400 font-mono text-sm">{otherPlayers[0]?.totalDamageDealt} DMG</div>
                </div>

                <div className="bg-cyan-900/30 border border-cyan-800 rounded-xl p-4 flex items-center justify-center gap-3 text-cyan-200">
                    <Clock size={20} />
                    <span className="text-xs font-bold">New Boss appears tomorrow</span>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};