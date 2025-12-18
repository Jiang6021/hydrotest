
import React, { useState, useEffect, useRef } from 'react';
import { useGameViewModel } from './hooks/useGameViewModel';
import { GameCover } from './components/GameCover';
import { LobbyView } from './components/LobbyView';
import { StatusView } from './components/StatusView';
import { GroupRaidView } from './components/GroupRaidView';
import { StorageView } from './components/StorageView';
import { ProfileView } from './components/ProfileView';
import { DIMENSION_CONFIG, DimensionType } from './constants';
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
  Star
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-inter select-none overflow-hidden">
      <div className="max-w-md mx-auto p-4 min-h-screen relative">
         {activeTab === 'LOBBY' && <LobbyView player={currentPlayer} onCompleteQuest={completeTodo} onAddTodo={addTodo} onFailTodo={failTodo} isProcessing={isProcessing} randomTasks={randomTasks} />}
         {activeTab === 'STATUS' && <StatusView player={currentPlayer} onOpenGratitude={() => setShowGratitudeModal(true)} isProcessing={isProcessing} totalDamageContrib={totalRaidDamage} />}
         {activeTab === 'GROUP' && <GroupRaidView roomData={roomData} currentPlayer={currentPlayer} otherPlayers={otherPlayers} logs={logs} onJoinRaid={joinRaid} onDrink={drinkWater} onAttack={performAttack} onOpenGratitude={() => setShowGratitudeModal(true)} onCompleteTutorial={completeTutorial} isProcessing={isProcessing} lastActionFeedback={lastActionFeedback} debugRespawn={debugRespawn} />}
         {activeTab === 'STORAGE' && <StorageView player={currentPlayer} />}
         {activeTab === 'PROFILE' && <ProfileView player={currentPlayer} onLogout={logout} />}

        {/* --- 動態經驗值結算框 (核心需求) --- */}
        {xpFeedbackData && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none p-6">
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300"></div>
              
              <div className="relative w-full max-w-xs bg-slate-900 border-2 border-amber-400/50 rounded-[2rem] shadow-[0_0_80px_rgba(251,191,36,0.3)] p-8 flex flex-col items-center animate-in zoom-in-95 duration-500 pointer-events-auto">
                  
                  {/* 浮動 XP 數字動畫 */}
                  <div className="absolute -top-12 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-yellow-500 animate-[float-up_1.5s_ease-out_forwards] drop-shadow-[0_5px_15px_rgba(245,158,11,0.6)] font-pixel">
                      +{xpFeedbackData.xp} XP
                  </div>

                  <Trophy size={48} className="text-amber-400 mb-4 animate-bounce" />
                  <h3 className="text-lg font-pixel text-white mb-6 tracking-tighter">任務達成</h3>

                  <div className="w-full space-y-5">
                      {xpFeedbackData.stats && xpFeedbackData.stats.map((dt: DimensionType) => {
                          const config = DIMENSION_CONFIG[dt];
                          const currentVal = currentPlayer.stats?.[dt] || 0;
                          // 計算舊的百分比 (假設每 100 點一級)
                          const progressBefore = Math.max(0, (currentVal - xpFeedbackData.xp) % 100);
                          const progressAfter = currentVal % 100;

                          return (
                              <div key={dt} className="space-y-2">
                                  <div className="flex justify-between items-center px-1">
                                      <div className="flex items-center gap-2">
                                          <span className="text-lg">{config.icon}</span>
                                          <span className={`text-[10px] font-bold ${config.color} uppercase tracking-widest`}>{config.label}</span>
                                      </div>
                                      <span className="text-[10px] font-mono text-slate-500">注入能量...</span>
                                  </div>
                                  
                                  {/* 動態填充進度條 */}
                                  <div className="h-4 w-full bg-slate-950 rounded-full border border-slate-800 p-[2px] overflow-hidden relative">
                                      {/* 背景底色 */}
                                      <div 
                                          className={`absolute inset-y-[2px] left-[2px] ${config.bg} opacity-20 rounded-full`}
                                          style={{ width: `${progressBefore}%` }}
                                      ></div>
                                      
                                      {/* 增長條 */}
                                      <div 
                                          className={`absolute inset-y-[2px] left-[2px] ${config.bg} rounded-full transition-all duration-[1200ms] ease-out shadow-[0_0_15px_rgba(255,255,255,0.2)]`}
                                          style={{ 
                                              width: isXpFilling ? `${progressAfter}%` : `${progressBefore}%` 
                                          }}
                                      >
                                          {/* 流光效果 */}
                                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]"></div>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>

                  {xpFeedbackData.drop && (
                      <div className="mt-8 flex items-center gap-3 bg-slate-800/80 p-3 px-5 rounded-2xl border border-amber-500/30 animate-in fade-in zoom-in duration-500 delay-500">
                          <div className="text-3xl animate-bounce">{xpFeedbackData.drop}</div>
                          <div className="text-left">
                              <div className="text-[8px] text-amber-400 font-black uppercase tracking-widest">獲得稀有物</div>
                              <div className="text-xs font-bold text-white">收納進背包</div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
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
