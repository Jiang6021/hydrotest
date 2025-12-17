
import React, { useState, useEffect } from 'react';
import { Boss, Player, GameLog, RoomData } from '../types';
import { BossCard } from './BossCard';
import { Droplets, Trophy, Sword, Heart, Sparkles, RotateCcw, Zap, List, AlertCircle, Fingerprint, HelpCircle } from 'lucide-react'; 
import { BuffType, DAILY_WATER_GOAL, WATER_PER_ATTACK_CHARGE, MAX_DAILY_ATTACKS, SIP_VOLUME, ActionType } from '../constants';
import { CC_IMAGE } from '../assets';

type RaidSubTab = '排行' | '動態';

interface GroupRaidViewProps {
  roomData: RoomData;
  currentPlayer: Player;
  otherPlayers: Player[];
  logs: GameLog[];
  onJoinRaid: () => void;
  onDrink: (ml: number) => void;
  onAttack: () => void;
  onOpenGratitude: () => void;
  isProcessing: boolean;
  lastActionFeedback: any;
  debugRespawn: () => void;
}

const TUTORIAL_STEPS = [
    "嘿！新來的勇者！歡迎來到【團隊討伐】戰場！我是你的導航小精靈。",
    "抬頭看看！上方那個就是我們共同的敵人。它的血量是所有玩家共享的，大家要一起努力擊敗它！",
    "想造成傷害？看到中間那個巨大的【ATTACK】按鈕了嗎？那是你的主要武器！",
    "但攻擊需要彈藥... 你的【喝水量】就是彈藥！每喝 500ml 水，就能獲得 1 次攻擊充能。",
    "左邊的【Buff】按鈕也很重要！寫下感恩日記，就能換取隨機戰鬥增益，像是雙倍傷害或爆擊！",
    "最重要的一點：每天都要點擊【ACCEPT MISSION】加入戰局，你的貢獻才會被記錄到排行榜上喔！",
    "就是這樣！現在，喝口水，準備開始你的冒險吧！"
];

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

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    if (boss && !boss.isDefeated) {
        setIsVictoryDismissed(false);
    }
  }, [boss?.isDefeated]);

  // Check Tutorial Seen
  useEffect(() => {
      const hasSeen = localStorage.getItem('has_seen_raid_tutorial_v1');
      if (!hasSeen) {
          setShowTutorial(true);
      }
  }, []);
  
  const handleNextStep = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (tutorialStep < TUTORIAL_STEPS.length - 1) {
          setTutorialStep(prev => prev + 1);
      } else {
          // Finish
          localStorage.setItem('has_seen_raid_tutorial_v1', 'true');
          setShowTutorial(false);
          setTutorialStep(0);
      }
  };

  const restartTutorial = () => {
      setTutorialStep(0);
      setShowTutorial(true);
  };
  
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
        
        {/* Help Button (Top Right Absolute) */}
        <button 
            onClick={restartTutorial}
            className="absolute -top-2 right-0 p-2 text-slate-500 hover:text-cyan-400 transition-colors z-20"
        >
            <HelpCircle size={20} />
        </button>

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
            {!isParticipating && !boss?.isDefeated && !showTutorial && (
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
                
                <div className="divide-y divide-slate-800/50 max-h-60 overflow-y-auto custom-scrollbar">
                    {/* EMPTY STATE FOR RANKING */}
                    {participatingPlayers.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-slate-500 text-sm">Waiting for hunters to join...</p>
                        </div>
                    ) : (
                        sortedPlayers.map((p, idx) => {
                            const isMVP = idx === 0 && p.totalDamageDealt > 0;
                            const isMe = p.id === currentPlayer.id;
                            
                            return (
                                <div key={p.id} className={`flex items-center justify-between p-4 ${isMe ? 'bg-slate-800/30' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono border-2 
                                            ${idx === 0 ? 'bg-yellow-500 text-yellow-950 border-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 
                                            idx === 1 ? 'bg-slate-400 text-slate-800 border-slate-200' :
                                            idx === 2 ? 'bg-orange-700 text-orange-200 border-orange-500' :
                                            'bg-slate-800 text-slate-500 border-slate-700'}
                                        `}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold text-sm ${isMe ? 'text-cyan-400' : 'text-slate-300'}`}>
                                                    {p.name}
                                                </span>
                                                {isMVP && <span className="text-[9px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded border border-yellow-500/50">MVP</span>}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                Lv.{Math.floor((p.stats?.RESILIENCE || 0)/100) + 1} • {p.activeBuff !== BuffType.NONE ? <span className="text-purple-400">{p.activeBuff.split('_')[0]}</span> : 'No Buff'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-orange-400 font-mono font-bold text-sm">{p.totalDamageDealt.toLocaleString()}</div>
                                        <div className="text-[9px] text-slate-600">DAMAGE</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        )}

        {/* --- ACTIVITY LOG TAB --- */}
        {activeSubTab === '動態' && (
             <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
                 <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-1">
                    {logs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No battle logs yet.</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/50 flex gap-2 items-start text-xs animate-in slide-in-from-left-2">
                                <span className="text-slate-500 font-mono whitespace-nowrap pt-0.5">
                                    {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                <div>
                                    <span className="font-bold text-cyan-500">{log.userName}</span>
                                    <span className="text-slate-300 mx-1">
                                        {log.message}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                 </div>
             </div>
        )}

         {/* --- TUTORIAL OVERLAY --- */}
         {showTutorial && (
            <div 
                className="fixed inset-0 z-[150] bg-black/80 flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300 touch-none"
                onClick={handleNextStep}
            >
                <div className="max-w-xs w-full flex flex-col items-center relative">
                     {/* Sprite Image */}
                    <div className="w-32 h-32 mb-6 relative animate-bounce z-10">
                        <img 
                            src={CC_IMAGE} 
                            alt="Guide" 
                            className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]" 
                        />
                    </div>
                    
                    {/* Text Bubble */}
                    <div className="bg-slate-900 border-2 border-cyan-500 rounded-2xl p-6 relative shadow-[0_0_40px_rgba(34,211,238,0.2)] w-full z-10">
                        {/* Triangle Pointer */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[14px] border-b-cyan-500"></div>
                        
                        <p className="text-white text-md leading-relaxed font-bold min-h-[80px] flex items-center justify-center text-center">
                            {TUTORIAL_STEPS[tutorialStep]}
                        </p>
                        
                        <div className="mt-4 flex justify-between items-center">
                            <div className="flex gap-1.5">
                                {TUTORIAL_STEPS.map((_, i) => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === tutorialStep ? 'w-6 bg-cyan-400' : 'w-1.5 bg-slate-700'}`} />
                                ))}
                            </div>
                            <span className="text-[10px] text-cyan-400 animate-pulse uppercase tracking-wider font-bold">
                                {tutorialStep < TUTORIAL_STEPS.length - 1 ? '點擊繼續 ▶' : '開始戰鬥 ⚔️'}
                            </span>
                        </div>
                    </div>

                    {/* Skip Button */}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            localStorage.setItem('has_seen_raid_tutorial_v1', 'true');
                            setShowTutorial(false);
                        }}
                        className="mt-8 text-slate-500 text-xs hover:text-white underline decoration-slate-700 underline-offset-4"
                    >
                        跳過教學
                    </button>
                </div>
            </div>
        )}

    </div>
  );
};
