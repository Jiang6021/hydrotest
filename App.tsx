import React, { useState } from 'react';
import { useGameViewModel } from './hooks/useGameViewModel';
import { BossCard } from './components/BossCard';
import { GameCover } from './components/GameCover';
import { EventBanner } from './components/EventBanner';
import { Droplets, Heart, Sparkles, ScrollText, RefreshCw, Flame, ArrowLeft, Users, Shield, Sword, Wand2, LogOut, Trophy, Target, Info } from 'lucide-react';
import { Player } from './types';
import { BUFF_DESCRIPTIONS, BuffType, DAILY_WATER_GOAL } from './constants';

export default function App() {
  const [appStarted, setAppStarted] = useState(false);
  const [gratitudeInput, setGratitudeInput] = useState('');
  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  
  // Login State
  const [inputName, setInputName] = useState('');
  // Hardcoded room for friends to play together easily
  const DEFAULT_FRIEND_ROOM = 'friends_party_01'; 

  const { 
    roomData, 
    currentPlayer, 
    otherPlayers, // Actually all players sorted
    boss, 
    logs, 
    isProcessing, 
    lastActionFeedback,
    isLoggedIn,
    joinGame,
    logout,
    drinkWater,
    submitGratitude,
    resetGame
  } = useGameViewModel();

  // 1. Cover Screen
  if (!appStarted) {
    return <GameCover onStart={() => setAppStarted(true)} />;
  }

  // 2. Login / Lobby Screen
  if (!isLoggedIn || !roomData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-inter">
         <div className="max-w-md w-full bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-10 opacity-5 text-cyan-500 pointer-events-none">
              <Users size={150} />
            </div>

            <h2 className="text-2xl font-pixel text-cyan-400 mb-2 text-center">Enter the Party</h2>
            <p className="text-slate-400 text-xs text-center mb-6">Join your friends to defeat the demon!</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase mb-2">Your Name</label>
                <input 
                  type="text" 
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white focus:border-cyan-500 outline-none text-center font-bold text-lg"
                  placeholder="e.g. Alex"
                />
              </div>

              <button 
                onClick={() => joinGame(DEFAULT_FRIEND_ROOM, inputName)}
                disabled={!inputName.trim() || isProcessing}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-4 rounded-xl font-bold mt-4 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg transform active:scale-95 transition-all"
              >
                {isProcessing ? 'Summoning...' : 'JOIN RAID'}
              </button>
              
               <div className="text-center text-[10px] text-slate-500 mt-2">
                 Entering the same name will resume your session.
              </div>
            </div>
         </div>
      </div>
    );
  }

  // 3. Main Dashboard
  const handleGratitudeSubmit = () => {
    if (gratitudeInput.trim().length > 0) {
      submitGratitude(gratitudeInput);
      setGratitudeInput('');
      setShowGratitudeModal(false);
    }
  };

  const hasBuff = currentPlayer && currentPlayer.activeBuff !== BuffType.NONE;

  // Calculate Progress
  const waterProgress = currentPlayer ? Math.min((currentPlayer.todayWaterMl / DAILY_WATER_GOAL) * 100, 100) : 0;
  const totalRaidDamage = otherPlayers.reduce((acc, p) => acc + p.totalDamageDealt, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-inter">
      {/* Navbar */}
      <div className="bg-slate-900/90 backdrop-blur-md p-3 border-b border-slate-800 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
            <h1 className="font-pixel text-cyan-400 text-sm flex items-center gap-2 leading-none">
              <Droplets size={16} /> HydroSlayer
            </h1>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
              onClick={logout}
              className="text-xs text-red-400/70 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded bg-red-950/30 border border-red-900/30"
            >
               <LogOut size={12} /> Leave
            </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-5">
        
        {/* Daily Event */}
        {roomData.dailyEvent && <EventBanner event={roomData.dailyEvent} />}
        
        {/* Boss Section */}
        {boss && <BossCard boss={boss} isHit={lastActionFeedback !== null} />}
        
        {/* Damage Number Feedback */}
        {lastActionFeedback && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[100]">
            <div className={`text-4xl font-pixel drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] animate-bounce ${lastActionFeedback.val === 0 ? 'text-green-400' : 'text-cyan-400'}`}>
               {lastActionFeedback.val > 0 ? `-${lastActionFeedback.val}` : `-${lastActionFeedback.val}`}
            </div>
            {lastActionFeedback.msg && (
                <div className="text-center text-yellow-300 font-bold text-xs mt-1 animate-pulse drop-shadow-md">
                    {lastActionFeedback.msg}
                </div>
            )}
          </div>
        )}

        {/* --- PERSONAL STATUS CARD --- */}
        {currentPlayer && (
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
                {/* Background Progress Bar */}
                <div 
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000" 
                    style={{width: `${waterProgress}%`}}
                />

                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <h2 className="text-xl font-bold text-white">{currentPlayer.name}</h2>
                        </div>
                        {/* Lives */}
                        <div className="flex gap-1">
                            {[...Array(3)].map((_, i) => (
                                <Heart 
                                    key={i} 
                                    size={16} 
                                    className={i < currentPlayer.hp ? "fill-red-500 text-red-500" : "text-slate-800 fill-slate-800"} 
                                />
                            ))}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 justify-end text-cyan-400 text-xs font-bold uppercase mb-1">
                            <Target size={12} /> Daily Goal
                        </div>
                        <div className="text-2xl font-pixel text-white">
                            {currentPlayer.todayWaterMl} <span className="text-sm text-slate-500 font-sans">/ {DAILY_WATER_GOAL}ml</span>
                        </div>
                    </div>
                </div>

                {/* Progress Visual */}
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden mb-4">
                    <div 
                        className="bg-cyan-500 h-full rounded-full transition-all duration-700 relative"
                        style={{width: `${waterProgress}%`}}
                    >
                        <div className="absolute top-0 right-0 w-full h-full bg-white/20 animate-[shimmer_2s_infinite]" />
                    </div>
                </div>

                 {/* Buff Status */}
                 {hasBuff ? (
                    <div className="bg-purple-900/40 border border-purple-500/50 p-2 rounded-lg flex items-center gap-3 animate-pulse">
                        <Sparkles className="text-purple-400 shrink-0" size={18} />
                        <div>
                        <div className="text-purple-300 font-bold text-xs">BUFF ACTIVE: {currentPlayer.activeBuff}</div>
                        <div className="text-purple-200 text-[10px]">{BUFF_DESCRIPTIONS[currentPlayer.activeBuff]}</div>
                        </div>
                    </div>
                 ) : (
                     <div className="text-center text-[10px] text-slate-600 py-2 border border-dashed border-slate-800 rounded">
                        No active buffs. Use Gratitude Check-in!
                     </div>
                 )}
            </div>
        )}

        {/* --- ACTION BUTTONS --- */}
        <div className="grid grid-cols-4 gap-3">
            <button
                onClick={() => drinkWater(250)}
                disabled={isProcessing || !boss || boss.isDefeated || (currentPlayer?.hp || 0) <= 0}
                className={`col-span-3 relative overflow-hidden group py-4 rounded-xl transition-all shadow-lg
                    ${hasBuff 
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 border-b-4 border-purple-800 active:border-b-0 active:translate-y-1' 
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1'
                    }
                    disabled:grayscale disabled:cursor-not-allowed disabled:active:translate-y-0
                `}
            >
                <div className="flex items-center justify-center gap-2">
                    <Droplets className="text-white fill-white/20" size={24} />
                    <span className="font-pixel text-white text-base">DRINK 250ML</span>
                </div>
            </button>

            <button
                onClick={() => setShowGratitudeModal(true)}
                disabled={isProcessing || !boss || boss.isDefeated}
                className="col-span-1 bg-slate-800 hover:bg-slate-700 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 rounded-xl text-slate-300 flex flex-col items-center justify-center gap-1 transition-all"
            >
                <ScrollText size={20} />
                <span className="text-[10px] font-bold">BUFF</span>
            </button>
        </div>

        {/* --- LEADERBOARD (COMMUNITY) --- */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-900 p-3 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Trophy size={14} className="text-yellow-500" /> Leaderboard
                </h3>
                <span className="text-[10px] text-slate-500">{otherPlayers.length} Heroes Online</span>
            </div>
            
            <div className="divide-y divide-slate-800/50">
                {otherPlayers.map((p, index) => {
                   const contribution = totalRaidDamage > 0 ? Math.round((p.totalDamageDealt / totalRaidDamage) * 100) : 0;
                   const isMe = p.id === currentPlayer?.id;
                   
                   return (
                    <div key={p.id} className={`flex items-center p-3 text-sm transition-all ${isMe ? 'bg-amber-900/20 border-l-4 border-amber-500 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]' : ''}`}>
                        <div className={`w-6 text-center font-pixel text-xs mr-2 ${index < 3 ? 'text-yellow-400' : 'text-slate-500'}`}>
                            {index + 1}
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${isMe ? 'text-amber-300' : 'text-slate-300'}`}>
                                    {p.name} {isMe && '(YOU)'}
                                </span>
                                {p.hp <= 0 && <span className="text-[9px] bg-red-900 text-red-300 px-1 rounded">KO</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                 <div className="w-full max-w-[80px] h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{width: `${Math.min((p.todayWaterMl/DAILY_WATER_GOAL)*100, 100)}%`}}></div>
                                 </div>
                                 <span className="text-[10px] text-slate-500">{p.todayWaterMl}ml</span>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="font-mono text-orange-400 font-bold">{p.totalDamageDealt}</div>
                            <div className="text-[10px] text-slate-600">{contribution}% Contrib</div>
                        </div>
                    </div>
                   );
                })}
            </div>
        </div>

        {/* Logs (Simplified) */}
        <div className="bg-black/20 rounded-lg p-3 h-32 flex flex-col border border-slate-800/50">
          <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
            {logs.map((log) => (
              <div key={log.id} className="text-[10px] flex gap-2 text-slate-500">
                 <span className="text-slate-700 min-w-[30px]">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                 <span>
                    <span className={log.userId === currentPlayer?.id ? 'text-cyan-500' : 'text-slate-400'}>
                        {log.userId === currentPlayer?.id ? 'You' : log.userName}
                    </span> {log.message.replace(log.userName, '')}
                 </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Gratitude Modal */}
      {showGratitudeModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <Sparkles className="text-purple-400" /> Gratitude Buff
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">Share something you are grateful for to roll for a random combat buff.</p>
                  
                  <textarea 
                    value={gratitudeInput}
                    onChange={(e) => setGratitudeInput(e.target.value)}
                    placeholder="I am grateful for..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 h-24 mb-4 resize-none placeholder:text-slate-600"
                    autoFocus
                  />
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setShowGratitudeModal(false)}
                        className="flex-1 py-3 text-slate-400 font-bold hover:text-white transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleGratitudeSubmit}
                        disabled={!gratitudeInput.trim()}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold shadow-lg"
                      >
                          Cast Spell
                      </button>
                  </div>
              </div>
          </div>
      )}
      
      {/* Victory State Overlay */}
      {boss && boss.isDefeated && (
         <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-cyan-500 p-8 rounded-2xl max-w-sm w-full text-center shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                <div className="mb-6">
                    <Trophy size={64} className="text-yellow-400 mx-auto animate-bounce" />
                </div>
                <h3 className="font-pixel text-cyan-400 text-2xl mb-2">VICTORY!</h3>
                <p className="text-slate-300 text-sm mb-6">The Demon has been washed away by your hydration!</p>
                
                <div className="bg-slate-800 p-4 rounded-xl mb-6">
                    <div className="text-xs text-slate-500 uppercase mb-2">MVP</div>
                    <div className="text-xl font-bold text-white">{otherPlayers[0]?.name || 'Unknown'}</div>
                    <div className="text-orange-400 font-mono text-sm">{otherPlayers[0]?.totalDamageDealt} DMG</div>
                </div>

                <button 
                onClick={resetGame}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                <RefreshCw size={18} /> Play Again
                </button>
            </div>
         </div>
      )}
    </div>
  );
}