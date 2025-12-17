
import React, { useState, useEffect, useRef } from 'react';
import { Player, GameLog, RoomData } from '../types';
import { BossCard } from './BossCard';
import { Droplets, Trophy, Sword, Sparkles, List, AlertCircle, Fingerprint, HelpCircle, ArrowUp } from 'lucide-react'; 
import { BuffType, WATER_PER_ATTACK_CHARGE, MAX_DAILY_ATTACKS, SIP_VOLUME, ActionType } from '../constants';
import { CC_IMAGE, MESSAGE_SOUND_BASE64 } from '../assets'; // 導入 MESSAGE_SOUND_BASE64

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

// Tutorial configuration
const TUTORIAL_STEPS = [
    { 
        text: "歡迎來到團隊討伐！我是你的戰鬥導航員。這裡是你與夥伴共同對抗惡魔的地方！", 
        position: 'boss-guide', // 改為自定義位置，顯示在 BOSS 下方
        highlight: '' // 移除突出顯示
    },
    { 
        text: "上方是目前的 BOSS！血量是大家共享的。當你完成任務或攻擊時，BOSS 會受到傷害。", 
        position: 'boss-guide', // 保持在 BOSS 下方，引導視線向上
        highlight: 'boss' 
    },
    { 
        text: "這是【攻擊面板】與【感謝 Buff】！喝水補充彈藥，寫感恩日記獲得增益。", 
        position: 'top', 
        highlight: 'action_panel' 
    },
    { 
        text: "沒子彈了嗎？在【補水站】喝水！每喝 500ml 就能補充 1 次攻擊次數。", 
        position: 'top', 
        highlight: 'water' 
    },
    { 
        text: "最下方的【動態牆】會顯示夥伴們的喝水、攻擊與任務完成紀錄，一起互相激勵吧！", 
        position: 'top', 
        highlight: 'tabs' 
    },
    { 
        text: "最後也是最重要的一步！點擊【接受任務】加入討伐！", 
        position: 'join-guide', 
        highlight: 'join_button' 
    },
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
  
  // Filter active participants
  const participatingPlayers = otherPlayers.filter(p => p.isParticipatingToday);
  const activeCount = participatingPlayers.length;

  const isJustAction = lastActionFeedback !== null;
  const isParticipating = currentPlayer.isParticipatingToday;
  
  const [activeSubTab, setActiveSubTab] = useState<RaidSubTab>('動態');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // 新增：用於播放訊息音效的 Audio 實例
  const messageAudioRef = useRef<HTMLAudioElement | null>(null);

  // 優化：音效初始化與清理 (使用 useRef 避免每次 Render 都重新建立實例)
  useEffect(() => {
    if (!messageAudioRef.current) {
      messageAudioRef.current = new Audio(MESSAGE_SOUND_BASE64);
    }
    // 環境保護：清理函數，確保組件卸載時音訊狀態良好
    return () => {
      if (messageAudioRef.current) {
        messageAudioRef.current.pause(); // 暫停任何正在播放的音訊
        messageAudioRef.current.currentTime = 0; // 重置播放時間
        messageAudioRef.current = null; // 幫助垃圾回收
      }
    };
  }, []); // 空依賴陣列確保只在組件掛載和卸載時運行

  // 播放訊息音效的函數
  const playMessageSound = () => {
    if (messageAudioRef.current) {
      messageAudioRef.current.currentTime = 0; // 重置播放時間，讓音效可以快速連按從頭播放
      messageAudioRef.current.play().catch(e => {
        console.error("Error playing message sound:", e);
      });
    }
  };


  // Check Tutorial Seen
  useEffect(() => {
      const hasSeen = localStorage.getItem('has_seen_raid_tutorial_v7'); // Version bumped for new step
      if (!hasSeen) {
          setShowTutorial(true);
      }
  }, []);
  
  const handleNextStep = (e?: React.MouseEvent) => {
      e?.stopPropagation(); // Prevent backdrop click when button is clicked
      if (tutorialStep < TUTORIAL_STEPS.length - 1) {
          setTutorialStep(prev => prev + 1);
      } else {
          localStorage.setItem('has_seen_raid_tutorial_v7', 'true');
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
  
  // Sort players by damage
  const sortedPlayers = [...participatingPlayers].sort((a,b) => b.totalDamageDealt - a.totalDamageDealt);
  
  // --- FILTER LOGS ---
  const filteredLogs = logs.filter(log => {
      const allowedTypes = [
          ActionType.DRINK,
          ActionType.ATTACK,
          ActionType.GRATITUDE,
          ActionType.QUEST, // Shows Public (Random) tasks
          ActionType.FAIL   
      ];
      return allowedTypes.includes(log.actionType);
  });

  // --- SPOTLIGHT HELPER ---
  const getSpotlightClass = (key: string) => {
      if (!showTutorial) return '';
      const currentHighlight = TUTORIAL_STEPS[tutorialStep].highlight;
      if (currentHighlight === key) {
          // Add a glow ring and elevate z-index above the backdrop
          // Force z-index to 50 to ensure it is above the dimming layer (z-40)
          return 'relative !z-50 ring-4 ring-cyan-400 ring-offset-4 ring-offset-slate-900 shadow-[0_0_50px_rgba(34,211,238,0.5)] transition-all duration-300';
      }
      return '';
  };

  // Helper to determine bubble class based on position config
  const getBubblePositionClass = () => {
      const pos = TUTORIAL_STEPS[tutorialStep].position;
      if (pos === 'top') return 'top-24';
      if (pos === 'boss-guide') return 'top-80'; // Customized for Boss Step
      if (pos === 'join-guide') return 'top-48'; // Customized for Join Step (above center)
      return 'bottom-28';
  };

  const isCurrentStepTopAligned = 
      TUTORIAL_STEPS[tutorialStep].position === 'top' || 
      TUTORIAL_STEPS[tutorialStep].position === 'boss-guide';
      // Removed 'join-guide' so arrow defaults to bottom

  return (
    <div className="pb-24 pt-2 relative min-h-[80vh]">
        
        {/* --- TUTORIAL DIMMING LAYER --- */}
        {showTutorial && (
            <div 
                className="fixed inset-0 bg-slate-950/80 z-40 transition-opacity duration-500 backdrop-blur-[2px]"
                onClick={handleNextStep} 
            />
        )}

        {/* --- TUTORIAL GUIDE BUBBLE --- */}
        {showTutorial && (
            <div className={`fixed left-0 right-0 z-[60] px-4 flex justify-center pointer-events-none transition-all duration-500 ${getBubblePositionClass()}`}>
                <div className="flex items-end gap-3 max-w-sm w-full animate-in zoom-in-95 duration-300">
                    <img 
                        src={CC_IMAGE} 
                        className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-bounce"
                        alt="Guide"
                    />
                    <div className="bg-slate-900 border-2 border-cyan-500 rounded-2xl p-4 shadow-2xl flex-1 relative pointer-events-auto">
                        {/* Arrow Logic: Top, Boss-Guide, or Join-Guide uses top-left arrow */}
                        {isCurrentStepTopAligned ? (
                            <div className="absolute top-4 -left-2 w-4 h-4 bg-slate-900 border-l-2 border-b-2 border-cyan-500 rotate-45"></div>
                        ) : (
                            <div className="absolute bottom-4 -left-2 w-4 h-4 bg-slate-900 border-l-2 border-b-2 border-cyan-500 rotate-45"></div>
                        )}
                        <p className="text-white text-sm font-bold leading-relaxed">
                            {TUTORIAL_STEPS[tutorialStep].text}
                        </p>
                        <div className="mt-3 flex justify-end gap-2">
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    localStorage.setItem('has_seen_raid_tutorial_v7', 'true');
                                    setShowTutorial(false);
                                }}
                                className="text-slate-500 text-xs px-2 py-1 underline hover:text-slate-300"
                            >
                                跳過
                            </button>
                            <button 
                                onClick={(e) => { // 添加音效
                                    playMessageSound();
                                    handleNextStep(e);
                                }}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3 py-1.5 rounded-full font-bold transition-colors shadow-lg active:scale-95"
                            >
                                {tutorialStep < TUTORIAL_STEPS.length - 1 ? '下一步' : '我知道了'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Help Button */}
        <button 
            onClick={restartTutorial}
            className="absolute -top-2 right-0 p-2 text-slate-500 hover:text-cyan-400 transition-colors z-20"
        >
            <HelpCircle size={20} />
        </button>

        {/* --- SECTION 1: BOSS --- */}
        <div className={`mb-4 transition-transform duration-300 ${getSpotlightClass('boss')}`}>
            {boss && (
                <BossCard 
                    boss={boss} 
                    isHit={isJustAction && lastActionFeedback?.val > 0} 
                    isSurprised={isProcessing} 
                />
            )}
        </div>

        {/* --- NON-PARTICIPANT OVERLAY --- */}
        {/* Logic update: Show if NOT participating AND (Not in tutorial OR It is the join step of tutorial) */}
        {!isParticipating && !boss?.isDefeated && (!showTutorial || TUTORIAL_STEPS[tutorialStep].highlight === 'join_button') && (
            <div className={`relative z-30 bg-slate-950/90 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in mb-4 min-h-[300px] ${getSpotlightClass('join_button')}`}>
                <div className="mb-4 text-orange-500 animate-pulse">
                    <AlertCircle size={48} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-pixel tracking-wide">MISSION BRIEFING</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-xs leading-relaxed">
                    The Demon waits. <br/>
                    <span className="text-cyan-400">Join {activeCount} other hunters?</span>
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

        {/* --- CONTROL PANEL CONTAINER (Visible if participating) --- */}
        <div className={`transition-all duration-500 ${(!isParticipating && !showTutorial) ? 'opacity-20 pointer-events-none filter blur-sm h-0 overflow-hidden' : 'opacity-100'}`}>
            
            {/* --- SECTION 2: ATTACK & BUFF (Rebuilt to match screenshot) --- */}
            <div className={`bg-slate-900/80 border border-slate-800 rounded-t-2xl p-4 relative ${getSpotlightClass('action_panel')}`}>
                
                {/* Header Row: Icon + Charges */}
                <div className="flex justify-between items-center mb-3">
                     <div className="flex items-center gap-2 opacity-50">
                        <Sword size={16} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ATTACK CHARGES</span>
                     </div>
                     {/* Charges Circles */}
                     <div className="flex gap-1.5">
                        {[...Array(MAX_DAILY_ATTACKS)].map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-3 h-3 rounded-full border border-slate-700 transition-all
                                    ${i < attacksPerformed 
                                        ? 'bg-slate-800' // Used
                                        : i < attacksPerformed + availableAttacks 
                                            ? 'bg-red-600 shadow-[0_0_5px_red]' // Available
                                            : 'bg-slate-900' // Locked
                                    }
                                `} 
                            />
                        ))}
                    </div>
                </div>

                {/* Main Action Row */}
                <div className="flex gap-3 h-16">
                    {/* Buff Button (Left, Small) */}
                    <button
                        onClick={onOpenGratitude}
                        disabled={isProcessing || hasBuff}
                        className={`w-1/4 rounded-xl border border-slate-700 flex flex-col items-center justify-center gap-1 transition-all active:scale-95
                             ${hasBuff 
                                ? 'bg-slate-900/50 opacity-50 cursor-default border-purple-900' 
                                : 'bg-slate-950 hover:bg-slate-800'
                             }
                        `}
                    >
                        <Sparkles size={18} className={hasBuff ? 'text-purple-300' : 'text-slate-500'} />
                        <span className={`text-[9px] font-bold ${hasBuff ? 'text-purple-200' : 'text-slate-500'}`}>
                            {hasBuff ? 'Buffed' : 'Buff'}
                        </span>
                    </button>

                    {/* Attack / Need Water Button (Right, Large) */}
                    <button
                        onClick={onAttack}
                        disabled={isProcessing || !boss || boss.isDefeated || availableAttacks <= 0 || currentPlayer.hp <= 0}
                        className={`flex-1 rounded-xl border-2 relative overflow-hidden group transition-all active:scale-[0.98]
                            ${boss?.isDefeated 
                                ? 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'
                                : availableAttacks > 0
                                    ? hasBuff 
                                        ? 'bg-gradient-to-r from-purple-900 to-slate-900 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                                        : 'bg-gradient-to-r from-red-900 to-slate-900 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                                    : 'bg-slate-950 border-slate-800' // Need Water State (Dark)
                            }
                        `}
                    >
                         <span className={`font-pixel text-lg tracking-widest relative z-10
                             ${availableAttacks > 0 
                                ? 'text-white drop-shadow-[0_2px_0_rgba(0,0,0,1)]' 
                                : 'text-slate-600' // Darker text for Need Water
                             }
                         `}>
                            {boss?.isDefeated 
                                ? 'DEFEATED' 
                                : isMaxDailyReached
                                    ? 'MAX LIMIT'
                                    : availableAttacks > 0 
                                        ? 'ATTACK!' 
                                        : 'NEED WATER'}
                        </span>
                        
                        {/* Scanline Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] bg-[length:100%_4px,3px_100%] pointer-events-none"></div>
                    </button>
                </div>
            </div>

            {/* --- SECTION 3: WATER STATION --- */}
            <div className={`bg-slate-900/80 border-x border-b border-slate-800 rounded-b-2xl p-4 mb-4 relative ${getSpotlightClass('water')}`}>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-cyan-500">
                        <Droplets size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">HYDRATION STATION</span>
                    </div>
                    <span className="text-[9px] text-slate-600 font-bold">
                        {isMaxDailyReached
                                ? 'MAX CHARGE' 
                                : `Next Charge: ${Math.round(nextAttackProgress)}%`
                        }
                    </span>
                </div>

                {/* Progress Line */}
                {!isMaxDailyReached && (
                    <div className="w-full bg-slate-950 h-1 rounded-full mb-4 overflow-hidden">
                        <div className="bg-cyan-700 h-full transition-all duration-500 shadow-[0_0_5px_cyan]" style={{width: `${nextAttackProgress}%`}}></div>
                    </div>
                )}

                 <div className="grid grid-cols-3 gap-3">
                        {/* Sip - Matches screenshot arrow pointing */}
                        <button 
                            onClick={() => onDrink(SIP_VOLUME)}
                            disabled={isProcessing}
                            className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3 rounded-xl text-center active:scale-95 transition-all group relative"
                        >
                            <div className="text-sm font-bold text-cyan-200 mb-0.5">Sip</div>
                            <div className="text-[9px] text-slate-500">{SIP_VOLUME}ml</div>
                            {/* Pointing Arrow Animation (Removed) */}
                        </button>
                        {/* Drink */}
                        <button 
                            onClick={() => onDrink(250)}
                            disabled={isProcessing}
                            className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3 rounded-xl text-center active:scale-95 transition-all"
                        >
                            <div className="text-sm font-bold text-cyan-400 mb-0.5">Drink</div>
                            <div className="text-[9px] text-slate-500">250ml</div>
                        </button>
                        {/* Gulp */}
                        <button 
                            onClick={() => onDrink(500)}
                            disabled={isProcessing}
                            className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3 rounded-xl text-center active:scale-95 transition-all"
                        >
                            <div className="text-sm font-bold text-blue-400 mb-0.5">Gulp</div>
                            <div className="text-[9px] text-slate-500">500ml</div>
                        </button>
                    </div>
            </div>
        </div>

        {/* --- SECTION 4: TABS & CONTENT --- */}
        <div className={`relative ${getSpotlightClass('tabs')}`}>
            {/* TABS */}
            <div className="flex justify-around p-1 gap-1 bg-slate-900/60 border border-slate-800 rounded-xl mb-2 backdrop-blur-sm">
                <button 
                    onClick={() => setActiveSubTab('動態')}
                    className={`flex-1 py-3 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all
                        ${activeSubTab === '動態' 
                            ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                            : 'text-slate-500 hover:text-slate-300'
                        }
                    `}
                >
                    <List size={16} /> 動態
                </button>
                <button 
                    onClick={() => setActiveSubTab('排行')}
                    className={`flex-1 py-3 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all
                        ${activeSubTab === '排行' 
                            ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                            : 'text-slate-500 hover:text-slate-300'
                        }
                    `}
                >
                    <Trophy size={16} /> 排行
                </button>
            </div>

            {/* CONTENT */}
            {activeSubTab === '排行' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
                    <div className="divide-y divide-slate-800/50 max-h-60 overflow-y-auto custom-scrollbar">
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

            {activeSubTab === '動態' && (
                 <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300">
                     <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-1">
                        {filteredLogs.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">No recent activity.</div>
                        ) : (
                            filteredLogs.map((log) => (
                                <div key={log.id} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/50 flex gap-2 items-start text-xs animate-in slide-in-from-left-2">
                                    <span className="text-slate-500 font-mono whitespace-nowrap pt-0.5">
                                        {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                    <div>
                                        <span className={`font-bold ${
                                            log.userId === currentPlayer.id ? 'text-cyan-400' : 'text-slate-300'
                                        }`}>
                                            {log.userName}
                                        </span>
                                        <span className="text-slate-400 mx-1">
                                            {log.message}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                     </div>
                 </div>
            )}
        </div>
    </div>
  );
};