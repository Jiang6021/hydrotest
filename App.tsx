import React, { useState } from 'react';
import { useGameViewModel } from './hooks/useGameViewModel';
import { BossCard } from './components/BossCard';
import { GameCover } from './components/GameCover';
import { EventBanner } from './components/EventBanner';
import { Droplets, Heart, Sparkles, ScrollText, RefreshCw, Flame, ArrowLeft } from 'lucide-react';
import { Player } from './types';
import { BUFF_DESCRIPTIONS, BuffType } from './constants';

/**
 * Dashboard Screen (dashboard_screen.dart equivalent)
 */
export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [activePlayerId, setActivePlayerId] = useState<string>('user_1');
  const [gratitudeInput, setGratitudeInput] = useState('');
  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  
  const { 
    roomData, 
    currentPlayer, 
    boss, 
    logs, 
    loading, 
    isProcessing, 
    lastActionFeedback,
    drinkWater,
    submitGratitude,
    resetGame
  } = useGameViewModel(activePlayerId);

  // Show Cover Screen if game hasn't started
  if (!gameStarted) {
    return <GameCover onStart={() => setGameStarted(true)} />;
  }

  if (loading || !roomData || !boss || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-cyan-500 font-pixel animate-pulse">Summoning HydroSlayer...</div>
      </div>
    );
  }

  const handleGratitudeSubmit = () => {
    if (gratitudeInput.trim().length > 0) {
      submitGratitude(gratitudeInput);
      setGratitudeInput('');
      setShowGratitudeModal(false);
    }
  };

  const hasBuff = currentPlayer.activeBuff !== BuffType.NONE;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-12 font-inter">
      {/* Navbar */}
      <div className="bg-slate-900/80 backdrop-blur-md p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
            <button onClick={() => setGameStarted(false)} className="text-slate-400 hover:text-white">
                <ArrowLeft size={20} />
            </button>
            <h1 className="font-pixel text-cyan-400 text-sm md:text-lg flex items-center gap-2">
            <Droplets size={20} /> HydroSlayer
            </h1>
        </div>
        <div className="flex gap-2">
          {(Object.values(roomData.players) as Player[]).map(p => (
            <button
              key={p.id}
              onClick={() => setActivePlayerId(p.id)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                activePlayerId === p.id 
                  ? 'bg-cyan-700 text-white font-bold shadow-lg shadow-cyan-900/50' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Daily Event Section */}
        {roomData.dailyEvent && <EventBanner event={roomData.dailyEvent} />}
        
        {/* Boss Section */}
        <BossCard boss={boss} isHit={lastActionFeedback !== null} />
        
        {/* Visual Feedback for Damage */}
        {lastActionFeedback && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
            <div className={`text-4xl font-pixel drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] animate-bounce ${lastActionFeedback.val === 0 ? 'text-green-400' : 'text-cyan-400'}`}>
               {lastActionFeedback.val > 0 ? `-${lastActionFeedback.val}` : '+1 ❤️'}
            </div>
          </div>
        )}

        {/* Player Stats */}
        <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-700">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Lives</span>
            <div className="flex gap-1 mt-1">
               {[...Array(3)].map((_, i) => (
                 <Heart 
                    key={i} 
                    size={20} 
                    className={i < currentPlayer.hp ? "fill-red-500 text-red-500" : "text-slate-700"} 
                 />
               ))}
            </div>
          </div>
          <div className="text-right">
             <span className="text-xs text-slate-400 uppercase tracking-wider">Hydration</span>
             <div className="text-xl font-bold text-cyan-300">{currentPlayer.todayWaterMl} ml</div>
          </div>
        </div>

        {/* Active Buff Display - Reactive UI */}
        {hasBuff && (
          <div className="bg-purple-900/30 border border-purple-500/50 p-3 rounded-lg flex items-center gap-3 animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Sparkles className="text-purple-400" size={24} />
            <div>
              <div className="text-purple-300 font-bold text-sm">ACTIVE BUFF: {currentPlayer.activeBuff}</div>
              <div className="text-purple-200 text-xs">{BUFF_DESCRIPTIONS[currentPlayer.activeBuff]}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
            
            {/* Drink Button */}
            <button
                onClick={() => drinkWater(250)}
                disabled={isProcessing || boss.currentHp <= 0}
                className={`w-full relative overflow-hidden group py-5 rounded-2xl transition-all shadow-xl
                    ${hasBuff 
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 border-2 border-purple-400 hover:shadow-purple-500/30' 
                        : 'bg-gradient-to-r from-cyan-700 to-blue-700 border-b-4 border-blue-900 hover:translate-y-[-2px] active:translate-y-[1px]'
                    }
                `}
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-center gap-3 relative z-10">
                    <Droplets className="text-white" size={28} />
                    <span className="font-pixel text-white text-lg">DRINK 250ML</span>
                </div>
                {hasBuff && <div className="absolute top-1 right-2 text-[10px] font-bold bg-black/40 px-2 rounded text-white">BUFF ACTIVE</div>}
            </button>

            {/* Gratitude Button */}
            <button
                onClick={() => setShowGratitudeModal(true)}
                disabled={isProcessing || boss.currentHp <= 0}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-slate-300 flex items-center justify-center gap-2 transition-all hover:text-white"
            >
                <ScrollText size={20} />
                <span className="font-bold">Gratitude Check-in</span>
            </button>
        </div>

        {/* Victory State */}
        {boss.currentHp === 0 && (
          <div className="text-center p-6 bg-cyan-900/20 rounded-xl border border-cyan-500/30">
            <h3 className="font-pixel text-cyan-400 text-xl mb-2">VICTORY!</h3>
            <p className="text-slate-300 text-sm mb-4">The Fire Demon has been extinguished!</p>
            <button 
              onClick={resetGame}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} /> New Raid
            </button>
          </div>
        )}

        {/* Activity Logs */}
        <div className="bg-black/30 rounded-xl p-4 h-48 flex flex-col border border-slate-800">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
            <Flame size={12} /> Chronicle
          </h3>
          <div className="overflow-y-auto flex-1 space-y-3 pr-2 custom-scrollbar">
            {logs.map((log) => (
              <div key={log.id} className="text-xs flex gap-3">
                 <div className="min-w-[50px] text-slate-600 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </div>
                 <div>
                    <span className={log.userId === activePlayerId ? 'text-cyan-300 font-semibold' : 'text-slate-400'}>
                        {log.message}
                    </span>
                    {log.actionType === 'GRATITUDE' && (
                        <div className="text-slate-500 italic mt-1 pl-2 border-l-2 border-slate-700">
                            "{log.value}"
                        </div>
                    )}
                 </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-slate-600 text-xs italic text-center mt-10">The chronicle is empty...</div>
            )}
          </div>
        </div>

      </div>

      {/* Simple Gratitude Modal */}
      {showGratitudeModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <Sparkles className="text-purple-400" /> Gratitude Journal
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">Write something you are grateful for to receive a random power-up!</p>
                  
                  <textarea 
                    value={gratitudeInput}
                    onChange={(e) => setGratitudeInput(e.target.value)}
                    placeholder="I am grateful for..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 h-24 mb-4 resize-none"
                  />
                  
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setShowGratitudeModal(false)}
                        className="flex-1 py-3 text-slate-400 font-bold hover:text-white"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleGratitudeSubmit}
                        disabled={!gratitudeInput.trim()}
                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold"
                      >
                          Submit
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}