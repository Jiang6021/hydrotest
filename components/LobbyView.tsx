import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { RANDOM_TASKS } from '../constants';
import { CheckCircle, Circle, Sun, Battery, Plus, Shuffle, ThumbsUp } from 'lucide-react';
import { CreateTaskView } from './CreateTaskView';

interface LobbyViewProps {
  player: Player;
  onCompleteQuest: (todoId: string) => void;
  onAddTodo?: (task: { label: string, note?: string, importance: number, difficulty: number }) => void;
  isProcessing: boolean;
}

export const LobbyView: React.FC<LobbyViewProps> = ({ player, onCompleteQuest, onAddTodo, isProcessing }) => {
  // State to toggle full screen Create View
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  // Random Task Logic
  const [randomTaskSuggestion, setRandomTaskSuggestion] = useState(() => {
    return RANDOM_TASKS[Math.floor(Math.random() * RANDOM_TASKS.length)];
  });

  const handleShuffle = () => {
    setRandomTaskSuggestion(RANDOM_TASKS[Math.floor(Math.random() * RANDOM_TASKS.length)]);
  };

  const handleAcceptRandom = () => {
    if (onAddTodo) {
        onAddTodo({
            label: randomTaskSuggestion,
            note: '來自隨機任務建議',
            importance: 1,
            difficulty: 1
        });
    }
  };

  const handleSaveNewTask = (task: { label: string, note: string, importance: number, difficulty: number }) => {
      if (onAddTodo) {
          onAddTodo(task);
          setIsCreatingTask(false);
      }
  };

  // Convert todos map to array
  const todoList = useMemo(() => {
      if (!player.todos) return [];
      // Sort by creation time (newest first)
      return Object.values(player.todos).sort((a, b) => b.createdAt - a.createdAt);
  }, [player.todos]);

  // If in creation mode, render the Create View instead
  if (isCreatingTask) {
      return (
          <CreateTaskView 
            onBack={() => setIsCreatingTask(false)}
            onSave={handleSaveNewTask}
          />
      );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-left-4 duration-300 fade-in pb-24 relative min-h-[80vh]">
        
        {/* Welcome Header */}
        <div className="pt-4 px-2">
            <h2 className="text-2xl font-bold text-white mb-1">早安，{player.name}</h2>
            <p className="text-slate-400 text-xs">積少成多，邁向勝利。</p>
        </div>

        {/* Daily Momentum Card */}
        {todoList.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-5 border border-indigo-500/30 relative overflow-hidden shadow-lg mx-1">
                <div className="absolute right-0 top-0 p-4 opacity-10">
                    <Sun size={80} className="text-yellow-400" />
                </div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">進行中任務</div>
                        <div className="text-2xl font-pixel text-white">{todoList.length} 待完成</div>
                    </div>
                    <Battery className="text-indigo-400" />
                </div>
            </div>
        )}

        {/* Task List or Random Suggestion */}
        <div className="space-y-3 px-1">
            <h3 className="text-slate-400 text-xs font-bold uppercase px-2">您的焦點</h3>
            
            {todoList.length === 0 ? (
                // --- RANDOM SUGGESTION CARD (Empty State) ---
                <div className="bg-slate-800/50 border border-dashed border-slate-600 rounded-2xl p-6 text-center animate-in zoom-in duration-300 flex flex-col items-center gap-4">
                    <div className="bg-slate-700/50 p-4 rounded-full mb-2">
                        <Sun className="text-yellow-200" size={32} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg mb-1">找點有趣的事情做...</h3>
                        <p className="text-slate-400 text-sm">試試看這個如何：</p>
                    </div>
                    
                    <div className="bg-slate-900 w-full p-4 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                        <p className="text-xl font-bold text-indigo-300">{randomTaskSuggestion}</p>
                    </div>

                    <div className="flex gap-3 w-full mt-2">
                        <button 
                            onClick={handleShuffle}
                            className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase"
                        >
                            <Shuffle size={14} /> 換一個
                        </button>
                        <button 
                            onClick={handleAcceptRandom}
                            disabled={isProcessing}
                            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase shadow-lg shadow-indigo-900/20"
                        >
                            <ThumbsUp size={14} /> 接受挑戰
                        </button>
                    </div>
                </div>
            ) : (
                // --- CUSTOM TODO LIST ---
                <div className="grid grid-cols-1 gap-3">
                    {todoList.map((todo) => (
                        <button
                            key={todo.id}
                            onClick={() => onCompleteQuest(todo.id)}
                            disabled={isProcessing}
                            className="bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700 hover:border-emerald-500 p-5 rounded-xl text-left transition-all shadow-md group relative overflow-hidden"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-500 group-hover:border-emerald-400 flex items-center justify-center transition-colors">
                                        <div className="w-3 h-3 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-200 group-hover:text-white transition-colors text-lg">{todo.label}</div>
                                        {todo.note && <div className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{todo.note}</div>}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Circle className="text-slate-600 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                                    <div className="flex gap-1">
                                        {[...Array(todo.difficulty || 1)].map((_, i) => (
                                            <div key={i} className="w-1 h-3 bg-slate-700 rounded-full"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
        
        {/* Floating Action Button */}
        <button 
            onClick={() => setIsCreatingTask(true)}
            className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-tr from-cyan-600 to-blue-500 rounded-full shadow-[0_4px_14px_rgba(0,255,255,0.4)] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-50 border-2 border-cyan-300"
        >
            <Plus size={32} />
        </button>
    </div>
  );
};