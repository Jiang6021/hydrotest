import React, { useState } from 'react';
import { useGameViewModel } from './hooks/useGameViewModel';
import { GameCover } from './components/GameCover';
import { LobbyView } from './components/LobbyView';
import { StatusView } from './components/StatusView';
import { GroupRaidView } from './components/GroupRaidView';
import { StorageView } from './components/StorageView';
import { ProfileView } from './components/ProfileView';

// Icons
import { 
  Home, 
  User, 
  Users, 
  Package, 
  Settings, 
  Sparkles
} from 'lucide-react';

type Tab = 'LOBBY' | 'STATUS' | 'GROUP' | 'STORAGE' | 'PROFILE';

export default function App() {
  const [appStarted, setAppStarted] = useState(false);
  const [gratitudeInput, setGratitudeInput] = useState('');
  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  
  // Default to LOBBY as the "Home"
  const [activeTab, setActiveTab] = useState<Tab>('LOBBY');
  
  // Login State
  const [inputName, setInputName] = useState('');
  const DEFAULT_FRIEND_ROOM = 'friends_party_01'; 

  // Call hook ONCE at the top level
  const { 
    roomData, 
    currentPlayer, 
    otherPlayers, 
    boss, 
    logs, 
    isProcessing, 
    lastActionFeedback,
    isLoggedIn,
    joinGame,
    logout,
    drinkWater,
    completeQuest,
    submitGratitude,
    performAttack, 
    debugRespawn   
  } = useGameViewModel();

  // 1. Cover Screen
  if (!appStarted) {
    return <GameCover onStart={() => setAppStarted(true)} />;
  }

  // 2. Login / Lobby Screen
  if (!isLoggedIn || !roomData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-inter force-gpu-render">
         <div className="max-w-md w-full bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
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
                onClick={async () => {
                  await joinGame(DEFAULT_FRIEND_ROOM, inputName);
                  setActiveTab('LOBBY');
                }}
                disabled={!inputName.trim() || isProcessing}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-4 rounded-xl font-bold mt-4 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg transform active:scale-95 transition-all"
              >
                {isProcessing ? 'Summoning...' : 'JOIN RAID'}
              </button>
            </div>
         </div>
      </div>
    );
  }

  // 2.5 Safety Check: If logged in but player data missing (e.g. DB reset), show sync/loading
  // This prevents passing 'null' to components that expect 'Player', fixing the build error.
  if (!currentPlayer) {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-400 font-inter">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-4"></div>
            <p className="text-xs">Syncing Wizard Data...</p>
            <button 
                onClick={logout}
                className="mt-8 px-4 py-2 bg-slate-800 rounded text-xs text-red-400 hover:bg-slate-700 transition-colors"
            >
                Reset Session
            </button>
        </div>
    );
  }

  // 3. Main Dashboard Handlers
  const handleGratitudeSubmit = () => {
    if (gratitudeInput.trim().length > 0) {
      submitGratitude(gratitudeInput);
      setGratitudeInput('');
      setShowGratitudeModal(false);
    }
  };

  const handleLogout = () => {
    logout();
    setActiveTab('LOBBY');
  };

  const totalRaidDamage = otherPlayers.reduce((acc, p) => acc + p.totalDamageDealt, 0);

  // --- TAB DEFINITIONS ---
  const TABS: {id: Tab, icon: any, label: string}[] = [
      { id: 'LOBBY', icon: Home, label: 'Lobby' },
      { id: 'STATUS', icon: User, label: 'Status' },
      { id: 'GROUP', icon: Users, label: 'Group' },
      { id: 'STORAGE', icon: Package, label: 'Storage' },
      { id: 'PROFILE', icon: Settings, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-inter">
      
      {/* Main Content Area */}
      <div className="max-w-md mx-auto p-4 min-h-screen relative force-gpu-render">
         {/* Render Active View */}
         {activeTab === 'LOBBY' && <LobbyView player={currentPlayer} onCompleteQuest={completeQuest} isProcessing={isProcessing} />}
         {activeTab === 'STATUS' && <StatusView player={currentPlayer} onOpenGratitude={() => setShowGratitudeModal(true)} isProcessing={isProcessing} totalDamageContrib={totalRaidDamage} />}
         {activeTab === 'GROUP' && <GroupRaidView 
                roomData={roomData}
                currentPlayer={currentPlayer}
                otherPlayers={otherPlayers}
                logs={logs}
                onDrink={drinkWater}
                onAttack={performAttack}
                onOpenGratitude={() => setShowGratitudeModal(true)}
                isProcessing={isProcessing}
                lastActionFeedback={lastActionFeedback}
                debugRespawn={debugRespawn}
            />}
         {activeTab === 'STORAGE' && <StorageView player={currentPlayer} />}
         {activeTab === 'PROFILE' && <ProfileView player={currentPlayer} onLogout={handleLogout} />}

        {/* Damage/Drop Feedback Overlay (Global) */}
        {lastActionFeedback && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[100] flex flex-col items-center gap-2">
            {lastActionFeedback.val > 0 && (
                <div className={`text-4xl font-pixel drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] animate-bounce ${lastActionFeedback.val === 0 ? 'text-green-400' : 'text-cyan-400'}`}>
                    {lastActionFeedback.val > 0 ? `-${lastActionFeedback.val}` : `-${lastActionFeedback.val}`}
                </div>
            )}
            {lastActionFeedback.msg && (
                <div className="text-center text-yellow-300 font-bold text-xs animate-pulse drop-shadow-md">
                    {lastActionFeedback.msg}
                </div>
            )}
             {lastActionFeedback.drop && (
                <div className="text-center bg-white/10 backdrop-blur rounded-xl p-4 animate-in zoom-in spin-in-3 border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]">
                    <div className="text-xs text-yellow-200 uppercase font-bold mb-1">Found Item!</div>
                    <div className="text-6xl animate-bounce">{lastActionFeedback.drop}</div>
                </div>
            )}
          </div>
        )}
      </div>

      {/* --- 5-TAB BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 pb-safe z-50">
         <div className="max-w-md mx-auto grid grid-cols-5">
            {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center py-3 gap-1 transition-all relative group
                            ${isActive ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}
                        `}
                    >
                        {isActive && (
                            <div className="absolute top-0 w-8 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] rounded-full"></div>
                        )}
                        <Icon size={22} className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-active:scale-95'}`} />
                        <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
                    </button>
                );
            })}
         </div>
      </div>

      {/* Gratitude Modal (Global) */}
      {showGratitudeModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm animate-in fade-in duration-200 force-gpu-render">
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm">
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
    </div>
  );
}