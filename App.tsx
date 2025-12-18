
import React, { useState, useEffect, useRef } from 'react';
import { useGameViewModel } from './hooks/useGameViewModel';
import { GameCover } from './components/GameCover';
import { LobbyView } from './components/LobbyView';
import { StatusView } from './components/StatusView';
import { GroupRaidView } from './components/GroupRaidView';
import { StorageView } from './components/StorageView';
import { ProfileView } from './components/ProfileView';
import { DIMENSION_CONFIG, DimensionType, BuffType, BUFF_DESCRIPTIONS } from './constants';
import { MESSAGE_SOUND_BASE64 } from './assets';

import { 
  Home, 
  Users, 
  Package, 
  Sparkles,
  Trophy,
  BarChart, 
  UserCircle,
  TrendingUp,
  Star,
  Zap, // For CRITICAL_x3
  Heart, // For HEAL_LIFE
  Sword, // For DOUBLE_DMG
  X // For close button
} from 'lucide-react';

type Tab = 'LOBBY' | 'STATUS' | 'GROUP' | 'STORAGE' | 'PROFILE';

export default function App() {
  const [appStarted, setAppStarted] = useState(false);
  const [gratitudeInput, setGratitudeInput] = useState('');
  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('LOBBY');
  const [inputName, setInputName] = useState('');
  const [prevLevel, setPrevLevel] = useState<number | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  // XP Animation Logic
  const [isXpFilling, setIsXpFilling] = useState(false);
  const [xpFeedbackData, setXpFeedbackData] = useState<any>(null);

  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const DEFAULT_FRIEND_ROOM = 'friends_party_01'; 

  // FIX: Destructured 'logs' from useGameViewModel to fix the missing variable error on line 157
  const { 
    roomData, 
    currentPlayer, 
    otherPlayers, 
    logs,
    randomTasks,
    isProcessing, 
    lastActionFeedback,
    lastGratitudeFeedback, // NEW: Destructure gratitude feedback
    isLoggedIn,
    joinGame,
    logout,
    completeTutorial,
    joinRaid,
    drinkWater,
    addTodo,
    completeTodo,
    failTodo,
    submitGratitude,
    performAttack, 
    debugRespawn   
  } = useGameViewModel();

  useEffect(() => {
    if (!successAudioRef.current) {
      successAudioRef.current = new Audio(MESSAGE_SOUND_BASE64);
      successAudioRef.current.volume = 0.5;
    }
  }, []);

  // 偵測到任務完成回饋時，啟動進度條動畫
  useEffect(() => {
    if (lastActionFeedback && lastActionFeedback.xp && lastActionFeedback.xp > 0) {
      setXpFeedbackData(lastActionFeedback);
      setIsXpFilling(false); // 重置狀態
      
      // 短暫延遲後觸發 transition 動畫
      const timer = setTimeout(() => {
          setIsXpFilling(true);
          if (successAudioRef.current) {
            successAudioRef.current.currentTime = 0;
            successAudioRef.current.play().catch(() => {});
          }
      }, 100);
      
      return () => clearTimeout(timer);
    } else if (!lastActionFeedback) {
      setXpFeedbackData(null);
      setIsXpFilling(false);
    }
  }, [lastActionFeedback]);

  // NEW: 偵測到感恩回饋時，啟動動畫和音效
  useEffect(() => {
    if (lastGratitudeFeedback) {
        if (successAudioRef.current) {
            successAudioRef.current.currentTime = 0;
            successAudioRef.current.play().catch(() => {});
        }
        // Feedback will automatically clear after its own timeout in ViewModel
    }
  }, [lastGratitudeFeedback]);

  // 偵測等級提升
  useEffect(() => {
    if (currentPlayer && currentPlayer.stats) {
      const totalXP = Object.values(currentPlayer.stats).reduce((a, b) => a + b, 0);
      const currentLevel = Math.floor(totalXP / 500) + 1;
      
      if (prevLevel !== null && currentLevel > prevLevel) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 4000);
      }
      setPrevLevel(currentLevel);
    }
  }, [currentPlayer?.stats]);

  if (!appStarted) {
    return <GameCover onStart={() => setAppStarted(true)} />;
  }

  if (!isLoggedIn || !roomData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-inter">
         <div className="max-w-md w-full bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-pixel text-cyan-400 mb-2 text-center">Enter the Party</h2>
            <div className="space-y-4">
              <input 
                type="text" 
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white focus:border-cyan-500 outline-none text-center font-bold text-lg"
                placeholder="e.g. Alex"
              />
              <button 
                onClick={async () => {
                  await joinGame(DEFAULT_FRIEND_ROOM, inputName);
                  setActiveTab('LOBBY');
                }}
                disabled={!inputName.trim() || isProcessing}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
              >
                {isProcessing ? 'Summoning...' : 'JOIN RAID'}
              </button>
            </div>
         </div>
      </div>
    );
  }

  if (!currentPlayer) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><p className="animate-pulse">同步數據中...</p></div>;

  const totalRaidDamage = otherPlayers.reduce((acc, p) => acc + p.totalDamageDealt, 0);

  // FIX: Changed JSX comment to a standard JavaScript comment within the array literal to prevent TypeScript parsing errors.
  const TABS: {id: Tab, icon: any, label: string}[] = [
      { id: 'LOBBY', icon: Home, label: 'Lobby' },
      { id: 'STATUS', icon: BarChart, label: 'Status' }, 
      { id: 'GROUP', icon: Users, label: 'Group' }, // CHANGED: '討罰' to '團體'
      { id: 'STORAGE', icon: Package, label: 'Storage' },
      { id: 'PROFILE', icon: UserCircle, label: 'Profile' }, 
  ];

  // Helper to get Buff Icon
  const getBuffIcon = (buffType: BuffType) => {
    switch (buffType) {
      case BuffType.CRITICAL_x3: return <Zap size={28} className="text-purple-400" />;
      case BuffType.HEAL_LIFE: return <Heart size={28} className="text-rose-400" />;
      case BuffType.DOUBLE_DMG: return <Sword size={28} className="text-indigo-400" />;
      default: return <Sparkles size={28} className="text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-inter select-none overflow-hidden">
      <div className="max-w-md mx-auto p-4 min-h-screen relative">
         {activeTab === 'LOBBY' && <LobbyView player={currentPlayer} onCompleteQuest={completeTodo} onAddTodo={addTodo} onFailTodo={failTodo} isProcessing={isProcessing} randomTasks={randomTasks} />}
         {activeTab === 'STATUS' && <StatusView player={currentPlayer} onOpenGratitude={() => setShowGratitudeModal(true)} isProcessing={isProcessing} totalDamageContrib={totalRaidDamage} />}
         {activeTab === 'GROUP' && <GroupRaidView roomData={roomData} currentPlayer={currentPlayer} otherPlayers={otherPlayers} logs={logs} onJoinRaid={joinRaid} onDrink={drinkWater} onAttack={performAttack} onOpenGratitude={() => setShowGratitudeModal(true)} onCompleteTutorial={completeTutorial} isProcessing={isProcessing} lastActionFeedback={lastActionFeedback} debugRespawn={debugRespawn} />}
         {activeTab === 'STORAGE' && <StorageView player={currentPlayer} />}
         {activeTab === 'PROFILE' && <ProfileView player={currentPlayer} onLogout={logout} />}

        {/* --- 動態經驗值結算框 (核心需求) --- */}
        {/* --- 動態經驗值結算框 (改進版) --- */}
        {xpFeedbackData && (
          <>
            {/* 背景遮罩 */}
            <div className="fixed inset-0 z-[150] bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300 pointer-events-none"></div>
            
            {/* 浮動 XP 數字 (中央大字) */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[151] pointer-events-none">
              <div className="animate-float-up-fade">
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-yellow-500 drop-shadow-[0_10px_30px_rgba(245,158,11,0.8)] tracking-tight">
                  +{xpFeedbackData.xp} XP
                </div>
                {xpFeedbackData.stats && xpFeedbackData.stats.length > 0 && (
                  <div className="text-white text-base font-bold text-center mt-2 opacity-80">
                    {DIMENSION_CONFIG[xpFeedbackData.stats[0]].label}
                  </div>
                )}
              </div>
            </div>

            {/* 進度條卡片 (底部彈出) */}
            <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[152] w-full max-w-sm px-4 animate-slide-up-bounce pointer-events-auto">
              <div className="bg-slate-900 border-2 border-amber-400/50 rounded-2xl shadow-[0_0_60px_rgba(251,191,36,0.4)] p-6 space-y-4">
                
                {/* 標題 */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy size={24} className="text-amber-400 animate-bounce" />
                  <h3 className="text-lg font-bold text-white">任務達成</h3>
                </div>

                {/* 各維度進度條 */}
                {xpFeedbackData.stats && xpFeedbackData.stats.map((dt: DimensionType) => {
                  const config = DIMENSION_CONFIG[dt];
                  const currentVal = currentPlayer.stats?.[dt] || 0;
                  const progressBefore = Math.max(0, (currentVal - xpFeedbackData.xp) % 100);
                  const progressAfter = currentVal % 100;

                  return (
                    <div key={dt} className="space-y-2">
                      {/* 標籤 */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{config.icon}</span>
                          <span className={`text-xs font-bold ${config.color} uppercase tracking-wider`}>
                            {config.label}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-500">
                          {progressAfter}/100
                        </span>
                      </div>
                      
                      {/* 進度條 */}
                      <div className="relative h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                        {/* 背景光暈 */}
                        <div 
                          className={`absolute inset-0 ${config.bg} opacity-20 blur-sm transition-all duration-1000 ease-out`}
                          style={{ width: isXpFilling ? `${progressAfter}%` : `${progressBefore}%` }}
                        />
                        
                        {/* 主進度條 */}
                        <div 
                          className={`absolute inset-0 ${config.bg} transition-all duration-1000 ease-out shadow-lg`}
                          style={{ width: isXpFilling ? `${progressAfter}%` : `${progressBefore}%` }}
                        >
                          {/* 流光效果 */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                        </div>

                        {/* 閃爍點 */}
                        {isXpFilling && progressAfter > 0 && (
                          <div 
                            className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 ${config.bg} rounded-full animate-pulse shadow-lg transition-all duration-1000 ease-out`}
                            style={{ 
                              left: `${progressAfter}%`, 
                              marginLeft: '-4px' 
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* 獲得稀有物 */}
                {xpFeedbackData.drop && (
                  <div className="flex items-center gap-3 bg-slate-800/80 p-3 px-5 rounded-2xl border border-amber-500/30 animate-scale-in mt-4">
                    <div className="text-3xl animate-bounce">{xpFeedbackData.drop}</div>
                    <div className="text-left">
                      <div className="text-[9px] text-amber-400 font-black uppercase tracking-widest">
                        獲得稀有物
                      </div>
                      <div className="text-xs font-bold text-white">收納進背包</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* --- NEW: 感恩回饋框 --- */}
        {lastGratitudeFeedback && (
            <>
                {/* 背景遮罩 */}
                <div className="fixed inset-0 z-[150] bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300 pointer-events-none"></div>

                {/* 浮動 Buff 提示 (中央大字) */}
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[151] pointer-events-none">
                    <div className="animate-float-up-fade-gratitude">
                        <div className="flex flex-col items-center">
                            {getBuffIcon(lastGratitudeFeedback.buffType)}
                            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-200 to-purple-500 drop-shadow-[0_10px_30px_rgba(168,85,247,0.8)] tracking-tight mt-2">
                                BUFF GET!
                            </div>
                            <div className="text-white text-base font-bold text-center mt-2 opacity-80">
                                {BUFF_DESCRIPTIONS[lastGratitudeFeedback.buffType]}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 感恩回饋卡片 (底部彈出) */}
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[152] w-full max-w-sm px-4 animate-slide-up-bounce pointer-events-auto">
                    <div className="bg-slate-900 border-2 border-purple-400/50 rounded-2xl shadow-[0_0_60px_rgba(168,85,247,0.4)] p-6 space-y-4">
                        
                        {/* 標題 */}
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Sparkles size={24} className="text-purple-400 animate-pulse" />
                            <h3 className="text-lg font-bold text-white">感恩祝福</h3>
                        </div>

                        {/* Buff 類型和描述 */}
                        <div className="flex flex-col items-center text-center p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-3">
                                {getBuffIcon(lastGratitudeFeedback.buffType)}
                                <span className="text-lg font-bold text-purple-300">
                                    {lastGratitudeFeedback.buffType.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                {BUFF_DESCRIPTIONS[lastGratitudeFeedback.buffType]}
                            </p>
                        </div>

                        <div className="text-center text-xs text-slate-500 mt-4">
                            下次攻擊時自動生效！
                        </div>
                    </div>
                </div>
            </>
        )}

        {/* 普通回饋 (如傷害數字、喝水提示) */}
        {lastActionFeedback && !lastActionFeedback.xp && lastActionFeedback.val !== undefined && (
             <div className="fixed inset-0 pointer-events-none z-[100] flex flex-col items-center justify-center">
                 <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl font-pixel drop-shadow-[0_4px_10px_rgba(34,211,238,0.8)] animate-bounce text-cyan-400">
                        {lastActionFeedback.val > 0 ? `-${lastActionFeedback.val}` : lastActionFeedback.msg}
                    </div>
                 </div>
             </div>
        )}

        {/* --- 等級提升慶祝動畫 --- */}
        {showLevelUp && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-yellow-500/10 backdrop-blur-xl animate-in fade-in"></div>
            <div className="flex flex-col items-center animate-[pop-and-shine_1s_ease-out_forwards]">
                <div className="relative">
                    <Star size={120} className="text-yellow-400 animate-[spin_4s_linear_infinite] opacity-30" />
                    <TrendingUp size={80} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg" />
                </div>
                <h1 className="text-5xl font-pixel text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-200 to-amber-500 drop-shadow-[0_10px_20px_rgba(251,191,36,0.8)] mt-6">
                  LEVEL UP!
                </h1>
                <div className="mt-4 px-6 py-2 bg-white/10 rounded-full border border-white/20 backdrop-blur-md">
                   <p className="text-white font-bold tracking-[0.4em] uppercase text-[10px]">新力量等級已達成</p>
                </div>
            </div>
          </div>
        )}

        {/* --- NEW: 感恩輸入彈窗 --- */}
        {showGratitudeModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[300] backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                     {/* Bg FX */}
                     <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                         <Sparkles size={120} className="text-purple-500" />
                     </div>

                    <div className="relative z-10 text-center">
                        <div className="w-16 h-16 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-500/50">
                            <Sparkles className="text-purple-400 animate-pulse" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">分享感恩</h3>

                        <textarea
                            value={gratitudeInput}
                            onChange={(e) => setGratitudeInput(e.target.value)}
                            className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder:text-slate-600 resize-none outline-none focus:border-purple-500 transition-colors mb-6"
                            placeholder="今天你感謝了什麼？..."
                            maxLength={100} // Limit length for brevity
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setGratitudeInput(''); // Clear input on cancel
                                    setShowGratitudeModal(false);
                                }}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                取消
                            </button>
                            <button
                                onClick={async () => {
                                    if (!gratitudeInput.trim()) return;
                                    await submitGratitude(gratitudeInput);
                                    setGratitudeInput(''); // Clear input after submission
                                    setShowGratitudeModal(false);
                                }}
                                disabled={!gratitudeInput.trim() || isProcessing}
                                className="flex-[2] py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isProcessing ? '提交中...' : '提交感恩'}
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setGratitudeInput('');
                                setShowGratitudeModal(false);
                            }}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* 底部導航欄 */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-900/95 border-t border-slate-800 pb-safe z-50 backdrop-blur-lg">
         <div className="max-w-md mx-auto grid grid-cols-5">
            {TABS.map((tab) => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`flex flex-col items-center justify-center py-4 gap-1 relative ${activeTab === tab.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    {activeTab === tab.id && <div className="absolute top-0 w-8 h-1 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] rounded-full"></div>}
                    <tab.icon size={20} />
                    {/* Only show label for the active tab */}
                    {activeTab === tab.id && (
                        <span className="text-[8px] font-bold uppercase tracking-widest">{tab.label}</span>
                    )}
                </button>
            ))}
         </div>
      </div>

      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          20% { opacity: 1; transform: translateY(-20px) scale(1.1); }
          100% { transform: translateY(-120px) scale(1); opacity: 0; }
        }
        @keyframes float-up-fade-gratitude {
            0% { transform: translateY(0) scale(0.8); opacity: 0; }
            20% { opacity: 1; transform: translateY(-20px) scale(1.1); }
            100% { transform: translateY(-120px) scale(1); opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pop-and-shine {
          0% { transform: scale(0); opacity: 0; filter: brightness(2); }
          50% { transform: scale(1.2); opacity: 1; filter: brightness(1.5); }
          100% { transform: scale(1); opacity: 1; filter: brightness(1); }
        }
      `}</style>
    </div>
  );
}
