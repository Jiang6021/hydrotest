
import React, { useState, useEffect } from 'react';
import { Boss, Player, GameLog, RoomData } from '../types';
import { BossCard } from './BossCard';
import { Droplets, Trophy, Sword, Heart, Sparkles, RotateCcw, Zap, List, AlertCircle, Fingerprint } from 'lucide-react'; // Import List icon for Logs tab
import { BuffType, DAILY_WATER_GOAL, WATER_PER_ATTACK_CHARGE, MAX_DAILY_ATTACKS, SIP_VOLUME, ActionType } from '../constants';

type RaidSubTab = '排行' | '動態'; // Define sub-tab types: Changed to Chinese

interface GroupRaidViewProps {
  roomData: RoomData;
  currentPlayer: Player;
  otherPlayers: Player[];
  logs: GameLog[];
  onJoinRaid: () => void; // New prop
  onDrink: (ml: number) => void;
  onAttack: () => void;
  onOpenGratitude: () => void;
  isProcessing: boolean;
  lastActionFeedback: any;
  debugRespawn: () => void; // Added Prop
}

export const GroupRaidView: React.FC<GroupRaidViewProps> = ({ 
  roomData, 
  currentPlayer, 
  otherPlayers, 
  logs, 
  onJoinRaid,
  onDrink, 
  onAttack,
  onOpenGratitude,
  isProcessing,
  lastActionFeedback,
  debugRespawn
}) => {
  const boss = roomData.boss;
  const hasBuff = currentPlayer.activeBuff !== BuffType.NONE;
  
  // Filter active participants for stats calculation
  const participatingPlayers = otherPlayers.filter(p => p.isParticipatingToday);
  const totalRaidDamage = participatingPlayers.reduce((acc, p) => acc + p.totalDamageDealt, 0);
  const activeCount = participatingPlayers.length;

  const isJustAction = lastActionFeedback !== null;
  const isParticipating = currentPlayer.isParticipatingToday;
  
  // Local state to handle victory modal dismissal
  const [isVictoryDismissed, setIsVictoryDismissed] = useState(false);
  // NEW: Local state to manage active sub-tab, default to '排行'
  const [activeSubTab, setActiveSubTab] = useState<RaidSubTab>('排行');

  useEffect(() => {
    if (boss && !boss.isDefeated) {
        setIsVictoryDismissed(false);
    }
  }, [boss?.isDefeated]);
  
  // Attack Calculation
  const attacksPerformed = currentPlayer.attacksPerformed || 0;
  const waterBasedMaxAttacks = Math.floor(currentPlayer.todayWaterMl / WATER_PER_ATTACK_CHARGE);
  const availableAttacks = Math.min(waterBasedMaxAttacks, MAX_DAILY_ATTACKS) - attacksPerformed;
  const nextAttackProgress = (currentPlayer.todayWaterMl % WATER_PER_ATTACK_CHARGE) / WATER_PER_ATTACK_CHARGE * 100;
  const isMaxDailyReached = attacksPerformed >= MAX_DAILY_ATTACKS;
  
  // Sort players by damage (only participating)
  const sortedPlayers = [...participatingPlayers].sort((a,b) => b.totalDamageDealt - a.totalDamageDealt);
  const mvp = sortedPlayers.length > 0 ? sortedPlayers[0] : null;

  return (
    <div className="space-y-5 animate-in slide-in-from-right-8 duration-300 fade-in pb-20 pt-2 relative">
        
        {/* Boss Section (Always Visible) */}
        {boss && (
            <BossCard 
                boss={boss} 
                isHit={isJustAction && lastActionFeedback?.val > 0} 
                isSurprised={isProcessing} 
            />
        )}

        {/* --- UNIFIED CARD: CONTROL PANEL + TABS --- */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm relative overflow-hidden min-h-[220px]">
            {/* Background FX */}
            <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none bg-gradient-to-b from-transparent to-slate-800"></div>

            {/* --- NON-PARTICIPANT OVERLAY (MISSION BRIEFING) --- */}
            {!isParticipating && !boss?.isDefeated && (
                <div className="absolute inset-0 z-50 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                    <div className="mb-4 text-orange-500 animate-pulse">
                        <AlertCircle size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 font-pixel tracking-wide">MISSION BRIEFING</h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-xs leading-relaxed">
                        The Demon waits. <br/>
                        <span className="text-cyan-400">Join {activeCount} other hunters?</span> <br/>
                        <span className="text-xs text-slate-500 mt-2 block">(Difficulty scales with active players)</span>
                    </p>
                    <button 
                        onClick={onJoinRaid}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.4)] flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                    >
                         <Fingerprint size={20} />
                         {isProcessing ? 'INITIALIZING...' : 'ACCEPT MISSION'}
                    </button>
                </div>
            )}

            {/* --- CONTROL PANEL CONTENT (Blurred/Disabled if not participating) --- */}
            <div className={`p-4 relative z-10 transition-opacity duration-500 ${!isParticipating ? 'opacity-20 pointer-events-none filter blur-sm' : 'opacity-100'}`}>
                {/* Attack Status Header */}
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <Sword className={availableAttacks > 0 ? "text-red-400 animate-pulse" : "text-slate-600"} size={20} />
                        <span className="text-xs font-bold text-slate-300 uppercase">
                            {isMaxDailyReached ? 'Daily Limit Reached' : 'Attack Charges'}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        {[...Array(MAX_DAILY_ATTACKS)].map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-3 h-3 rounded-full border border-slate-700 transition-all
                                    ${i < attacksPerformed 
                                        ? 'bg-slate-800' // Used
                                        : i < attacksPerformed + availableAttacks 
                                            ? 'bg-red-500 animate-pulse shadow-[0_0_5px_red]' // Available
                                            : 'bg-slate-950' // Locked
                                    }
                                `} 
                            />
                        ))}
                    </div>
                </div>

                {/* ACTION AREA */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {/* GRATITUDE BUTTON (Small) */}
                    <button
                        onClick={onOpenGratitude}
                        disabled={isProcessing || hasBuff}
                        className={`col-span-1 rounded-xl flex flex-col items-center justify-center p-1 border transition-all active:scale-95
                            ${hasBuff 
                                ? 'bg-purple-900/20 border-purple-500/50 opacity-50 cursor-default' 
                                : 'bg-slate-800 border-slate-700 hover:bg-purple-900/30 hover:border-purple-500'
                            }
                        `}
                    >
                        <Sparkles size={18} className={hasBuff ? 'text-purple-300' : 'text-purple-400 animate-pulse'} />
                        <span className="text-[9px] font-bold text-purple-200 mt-1 leading-none text-center">
                            {hasBuff ? 'Buffed' : 'Buff'}
                        </span>
                    </button>

                    {/* ATTACK BUTTON (Large) */}
                    <button
                        onClick={onAttack}
                        disabled={isProcessing || !boss || boss.isDefeated || availableAttacks <= 0 || currentPlayer.hp <= 0}
                        className={`col-span-3 relative overflow-hidden group py-4 rounded-xl transition-all shadow-[0_4px_0_rgb(0,0,0,0.5)] active:shadow-none active:translate-y-1 flex items-center justify-center gap-3
                            ${boss?.isDefeated 
                                ? 'bg-slate-800 border-2 border-slate-700 cursor-not-allowed opacity-50'
                                : availableAttacks > 0
                                    ? hasBuff 
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-2 border-purple-400' 
                                        : 'bg-gradient-to-r from-red-600 to-orange-600 border-2 border-red-400'
                                    : 'bg-slate-800 border-2 border-slate-700 grayscale'
                            }
                        `}
                    >
                        {hasBuff && availableAttacks > 0 && !boss?.isDefeated && (
                            <div className="absolute top-0 right-0 p-1">
                                <Sparkles size={16} className="text-yellow-300 animate-spin-slow" />
                            </div>
                        )}
                        
                        <span className="font-pixel text-lg leading-none text-white drop-shadow-md">
                            {boss?.isDefeated 
                                ? 'BOSS DEFEATED' 
                                : isMaxDailyReached
                                    ? 'MAX ATKS'
                                    : availableAttacks > 0 
                                        ? 'ATTACK!' 
                                        : 'NEED WATER'}
                        </span>
                    </button>
                </div>

                {/* DRINKING STATION */}
                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800 relative z-10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Droplets size={12} /> Hydration Station
                        </span>
                        <span className="text-[9px] text-slate-500">
                            {isMaxDailyReached
                                ? 'Max Daily Attacks Reached' 
                                : `Next Charge: ${Math.round(nextAttackProgress)}%`
                            }
                        </span>
                    </div>
                    
                    {/* Charge Progress Bar */}
                    {!isMaxDailyReached && (
                        <div className="w-full bg-slate-900 h-1.5 rounded-full mb-3 overflow-hidden">
                            <div className="bg-cyan-600 h-full transition-all duration-500" style={{width: `${nextAttackProgress}%`}}></div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                        <button 
                            onClick={() => onDrink(SIP_VOLUME)}
                            disabled={isProcessing}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2 rounded-lg text-center active:scale-95 transition-all"
                        >
                            <div className="text-xs font-bold text-cyan-200">Sip</div>
                            <div className="text-[9px] text-slate-500">{SIP_VOLUME}ml</div>
                        </button>
                        <button 
                            onClick={() => onDrink(250)}
                            disabled={isProcessing}
                            className="bg-slate-800 hover:bg-cyan-900/30 border border-cyan-800 p-2 rounded-lg text-center active:scale-95 transition-all shadow-sm"
                        >
                            <div className="text-xs font-bold text-cyan-400">Drink</div>
                            <div className="text-[9px] text-slate-500">250ml</div>
                        </button>
                        <button 
                            onClick={() => onDrink(500)}
                            disabled={isProcessing}
                            className="bg-slate-800 hover:bg-blue-900/30 border border-blue-800 p-2 rounded-lg text-center active:scale-95 transition-all shadow-sm"
                        >
                            <div className="text-xs font-bold text-blue-400">Gulp</div>
                            <div className="text-[9px] text-slate-500">500ml</div>
                        </button>
                    </div>
                </div>
            </div>

            {/* SEPARATOR LINE */}
            <div className="h-px bg-slate-800 w-full"></div>

            {/* --- SUB-TAB NAVIGATION (Integrated) --- */}
            <div className="flex justify-around p-1 gap-1 bg-slate-900/30">
                <button 
                    onClick={() => setActiveSubTab('排行')}
                    className={`flex-1 py-3 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all
                        ${activeSubTab === '排行' 
                            ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                            : 'text-slate-500 hover:text-slate-300'
                        }
                    `}
                >
                    <Trophy size={16} /> 排行
                </button>
                <button 
                    onClick={() => setActiveSubTab('動態')}
                    className={`flex-1 py-3 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all
                        ${activeSubTab === '動態' 
                            ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                            : 'text-slate-500 hover:text-slate-300'
                        }
                    `}
                >
                    <List size={16} /> 動態
                </button>
            </div>
        </div>


        {/* --- CONDITIONAL RENDERING FOR SUB-TABS --- */}
        {activeSubTab === '排行' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
                {/* Header Block Removed */}
                
                <div className="divide-y divide-slate-800/50 max-h-60 overflow-y-auto custom-scrollbar">
                    {/* EMPTY STATE FOR RANKING */}
                    {participatingPlayers.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs">
                            No hunters active yet today.
                        </div>
                    ) : (
                        sortedPlayers.map((p, index) => {
                        const contribution = totalRaidDamage > 0 ? Math.round((p.totalDamageDealt / totalRaidDamage) * 100) : 0;
                        const isMe = p.id === currentPlayer?.id;
                        
                        return (
                            <div key={p.id} className={`flex items-center p-3 text-sm transition-all ${isMe ? 'bg-amber-900/10 border-l-2 border-amber-500' : ''}`}>
                                <div className={`w-6 text-center font-pixel text-xs mr-2 ${index < 3 ? 'text-yellow-400' : 'text-slate-600'}`}>
                                    {index + 1}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`font-bold text-xs ${isMe ? 'text-amber-300' : 'text-slate-300'}`}>
                                            {p.name}
                                        </span>
                                        {p.hp <= 0 && <span className="text-[9px] bg-red-900 text-red-300 px-1 rounded">KO</span>}
                                    </div>
                                    
                                    {/* Water Bar for everyone */}
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full flex gap-0.5">
                                        <div 
                                            className="h-full bg-cyan-500 rounded-full" 
                                            style={{width: `${Math.min((p.todayWaterMl/DAILY_WATER_GOAL)*100, 100)}%`}}
                                        ></div>
                                    </div>
                                    <div className="text-[9px] text-slate-500 text-right mt-0.5">{p.todayWaterMl}ml</div>
                                </div>

                                <div className="text-right pl-4">
                                    <div className="font-mono text-orange-400 font-bold text-xs">{p.totalDamageDealt}</div>
                                    <div className="text-[9px] text-slate-600">{contribution}%</div>
                                </div>
                            </div>
                        );
                        })
                    )}
                </div>
            </div>
        )}

        {activeSubTab === '動態' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 h-64 flex flex-col animate-in fade-in duration-300 overflow-hidden">
                <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                    {logs.map((log) => (
                    <div key={log.id} className="text-[10px] flex gap-2 text-slate-500 border-b border-slate-800/30 pb-1 last:border-0">
                        <span className="text-slate-300 font-mono opacity-50 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span>
                            <span className={log.userId === currentPlayer?.id ? 'text-cyan-500 font-bold' : 'text-slate-400'}>
                                {log.userId === currentPlayer?.id ? 'You' : log.userName}
                            </span> 
                            <span className={log.actionType === ActionType.GRATITUDE ? 'text-purple-400' : ''}> {log.message.replace(log.userName, '')}</span>
                        </span>
                    </div>
                    ))}
                </div>
            </div>
        )}

        {/* Victory Overlay (Daily Task Completed) */}
        {boss && boss.isDefeated && !isVictoryDismissed && (
         <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-24 p-4 animate-in fade-in duration-500 pointer-events-none">
            <div className="bg-slate-900/90 border-2 border-amber-500/50 p-6 rounded-2xl max-w-sm w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.2)] pointer-events-auto transform scale-110">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Trophy size={32} className="text-yellow-400 animate-bounce" />
                    <h3 className="font-pixel text-amber-400 text-2xl">VICTORY!</h3>
                </div>
                
                <div className="bg-slate-800/80 p-4 rounded-xl mb-4 border border-slate-700">
                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">MVP</div>
                    <div className="text-xl font-bold text-white mb-1">{mvp?.name || 'Unknown'}</div>
                    <div className="text-orange-400 font-mono text-sm">{mvp?.totalDamageDealt} Damage</div>
                </div>

                <p className="text-slate-400 text-xs mb-6">
                    The Demon is defeated! <br/>
                    Keep drinking water to prepare for tomorrow's battle.
                </p>
                
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => setIsVictoryDismissed(true)}
                        className="text-slate-500 hover:text-white text-xs underline cursor-pointer"
                    >
                        Dismiss
                    </button>
                    
                    {/* DEBUG: RESPAWN BUTTON */}
                    <button 
                        onClick={debugRespawn}
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 py-2 rounded text-xs font-bold"
                    >
                        <RotateCcw size={12} /> Respawn Boss & Reset (Debug)
                    </button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};
