
import React, { useState, useMemo, useEffect } from 'react';
import { Player, TodoItem } from '../types';
import { CheckCircle, Circle, Sun, Battery, Plus, Shuffle, ThumbsUp, RotateCcw, Sparkles, X, Skull } from 'lucide-react';
import { CreateTaskView } from './CreateTaskView';
import { DIMENSION_CONFIG, DimensionType } from '../constants';

interface LobbyViewProps {
  player: Player;
  onCompleteQuest: (todoId: string) => void;
  onAddTodo?: (task: { label: string, note?: string, importance: number, difficulty: number, dimension: DimensionType }) => void;
  onFailTodo?: (todoId: string) => void; // New prop for giving up
  isProcessing: boolean;
  randomTasks: string[]; // Receives dynamic tasks from DB
}

export const LobbyView: React.FC<LobbyViewProps> = ({ player, onCompleteQuest, onAddTodo, onFailTodo, isProcessing, randomTasks }) => {
  // State to toggle full screen Create View
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  // State for Random Task Modal
  const [showRandomModal, setShowRandomModal] = useState(false);

  // Track tasks we have already shown to the user in this session to prevent repeats
  const [seenTasks, setSeenTasks] = useState<Set<string>>(new Set());
  const [isExhausted, setIsExhausted] = useState(false);
  
  // Random Task Logic
  const [randomTaskSuggestion, setRandomTaskSuggestion] = useState("Loading tasks...");

  // Effect to Initialize the first task
  useEffect(() => {
      // Only run if we have tasks, haven't picked one yet (or it's the loading state), and haven't exhausted list
      if (randomTasks.length > 0 && (randomTaskSuggestion === "Loading tasks..." || !randomTasks.includes(randomTaskSuggestion)) && !isExhausted) {
          
          // Pick a random one initially
          const initialTask = randomTasks[Math.floor(Math.random() * randomTasks.length)];
          
          setRandomTaskSuggestion(initialTask);
          setSeenTasks(new Set([initialTask])); // Mark as seen
      }
  }, [randomTasks, randomTaskSuggestion, isExhausted]);

  const handleShuffle = () => {
    // 1. Check if valid
    if (!randomTasks || randomTasks.length === 0) return;
    
    // 2. Filter out tasks that are already in the seen set
    const availableTasks = randomTasks.filter(task => !seenTasks.has(task));

    // 3. Check if we ran out of new tasks
    if (availableTasks.length === 0) {
        setRandomTaskSuggestion("哎呀！目前沒有隨機任務啦！");
        setIsExhausted(true);
        return;
    }

    // 4. Pick a random task from the AVAILABLE pool
    const randomIndex = Math.floor(Math.random() * availableTasks.length);
    const newTask = availableTasks[randomIndex];

    // 5. Update state
    setRandomTaskSuggestion(newTask);
    setSeenTasks(prev => {
        const newSet = new Set(prev);
        newSet.add(newTask);
        return newSet;
    });
  };

  const handleAcceptRandom = () => {
    if (onAddTodo && !isExhausted) {
        onAddTodo({
            label: randomTaskSuggestion,
            note: '來自隨機任務建議',
            importance: 1,
            difficulty: 1,
            dimension: DimensionType.RESILIENCE // Default for random
        });
        setShowRandomModal(false); // Close modal on accept
    }
  };

  const handleSaveNewTask = (task: { label: string, note: string, importance: number, difficulty: number, dimension: DimensionType }) => {
      if (onAddTodo) {
          onAddTodo(task);
          setIsCreatingTask(false);
      }
  };

  // Convert todos map to array
  const todoList = useMemo(() => {
      if (!player.todos) return [];
      // Fix: Explicitly type 'a' and 'b' to resolve 'unknown' error
      return Object.values(player.todos).sort((a: TodoItem, b: TodoItem) => b.createdAt - a.createdAt);
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
        <div className="pt-4 px-2 mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Good day, {player.name}</h2>
            <p className="text-slate-400 text-xs">One step closer, Merry Chrismas🎄</p>
        </div>

        {/* Task List Section */}
        <div className="space-y-3 px-1">
            <div className="px-2">
                <h3 className="text-slate-400 text-xs font-bold uppercase">所有任務</h3>
                {/* Horizontal Line */}
                <div className="h-px bg-slate-800 w-full mt-2"></div>
            </div>
            
            {todoList.length === 0 ? (
                // --- EMPTY STATE (Subtle & Clean) ---
                <div className="flex flex-col items-center gap-4 mt-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    
                    <div className="text-center">
                         <p className="text-slate-200 text-sm font-medium">暫無任務，嘗試新增一些吧！</p>
                    </div>

                    {/* Subtle Random Task Button (Pill Shape, Purple Accent) */}
                    <button 
                        onClick={() => setShowRandomModal(true)}
                        className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-900 border border-slate-800 hover:border-purple-500/30 hover:bg-slate-800 transition-all active:scale-95 shadow-sm hover:shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                    >
                         <Sparkles size={14} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
                         <span className="text-xs text-slate-500 group-hover:text-slate-300 font-bold transition-colors">
                            不知道做什麼嗎？
                         </span>
                    </button>
                </div>
            ) : (
                // --- CUSTOM TODO LIST ---
                <div className="grid grid-cols-1 gap-3">
                    {todoList.map((todo) => {
                        const dimConfig = DIMENSION_CONFIG[todo.dimension || DimensionType.RESILIENCE];
                        
                        return (
                            <div
                                key={todo.id}
                                className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-md group relative overflow-hidden flex flex-col gap-3 transition-all hover:bg-slate-750 hover:border-slate-600"
                            >
                                {/* Dimension Tag */}
                                <div className={`absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg text-[9px] font-bold ${dimConfig.bg} text-white opacity-80`}>
                                    {dimConfig.label}
                                </div>

                                <div className="flex items-start justify-between mt-2">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`w-8 h-8 rounded-full border-2 border-slate-600 flex items-center justify-center transition-colors shrink-0 bg-slate-900/50 mt-1`}>
                                            <span className="text-sm">{dimConfig.icon}</span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-200 text-lg leading-tight">{todo.label}</div>
                                            {todo.note && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{todo.note}</div>}
                                            
                                            {/* Difficulty Stars */}
                                            <div className="flex gap-1 mt-2">
                                                {[...Array(todo.difficulty || 1)].map((_, i) => (
                                                    <div key={i} className="w-1.5 h-3 bg-slate-600 rounded-full"></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Row */}
                                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-700/50">
                                    {/* Fail/Delete Button */}
                                    {onFailTodo && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if(confirm("Give up on this task? It will lower your stats.")) {
                                                    onFailTodo(todo.id);
                                                }
                                            }}
                                            disabled={isProcessing}
                                            className="flex-1 py-2 bg-slate-900/50 hover:bg-red-900/20 border border-slate-700 hover:border-red-800 text-slate-500 hover:text-red-400 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
                                        >
                                            <Skull size={16} />
                                            <span className="text-xs font-bold">放棄</span>
                                        </button>
                                    )}

                                    {/* Complete Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCompleteQuest(todo.id);
                                        }}
                                        disabled={isProcessing}
                                        className={`flex-[3] py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 border border-slate-500 hover:border-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]`}
                                    >
                                        <CheckCircle size={18} className="text-emerald-400 group-hover:text-white" />
                                        <span className="text-xs font-bold uppercase tracking-wide">完成</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
        
        {/* Floating Action Button */}
        <button 
            onClick={() => setIsCreatingTask(true)}
            className="group fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-tr from-cyan-600 to-blue-500 rounded-full shadow-[0_4px_14px_rgba(0,255,255,0.4)] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-50 border-2 border-cyan-300"
        >
            <Plus size={32} />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-600 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                建立待辦事項
            </span>
        </button>

        {/* --- RANDOM TASK MODAL --- */}
        {showRandomModal && (
            <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
                    
                    {/* Close Button */}
                    <button 
                        onClick={() => setShowRandomModal(false)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center mb-6">
                        <div className="inline-block p-3 rounded-full bg-slate-800 mb-3 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <Sparkles className="text-indigo-400" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white">命運的安排</h3>
                        <p className="text-slate-400 text-xs mt-1">或許這正是你現在需要的挑戰</p>
                    </div>

                    {/* Card Content */}
                    <div className={`relative w-full p-6 rounded-xl border transition-colors shadow-inner mb-6 flex flex-col items-center justify-center min-h-[140px]
                        ${isExhausted ? 'bg-slate-950 border-red-900/30' : 'bg-slate-950 border-indigo-500/30'}
                    `}>
                        {/* Shuffle Button (Top Right Inside Card) */}
                        <button 
                            onClick={handleShuffle}
                            disabled={isExhausted}
                            className={`absolute top-2 right-2 p-2 rounded-full transition-all active:scale-95 active:rotate-180 duration-500
                                ${isExhausted 
                                    ? 'text-slate-700 cursor-not-allowed' 
                                    : 'text-slate-500 hover:text-white hover:bg-slate-800'
                                }
                            `}
                            title="換一個"
                        >
                            <RotateCcw size={16} />
                        </button>

                        <p className={`text-xl font-bold text-center px-4 ${isExhausted ? 'text-slate-600' : 'text-indigo-300'}`}>
                            {randomTaskSuggestion}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleAcceptRandom}
                            disabled={isProcessing || isExhausted}
                            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold uppercase shadow-lg transition-colors
                                ${isExhausted
                                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/20 active:scale-[0.98]'
                                }
                            `}
                        >
                            <ThumbsUp size={18} /> 
                            接受挑戰
                        </button>
                        <button 
                            onClick={() => setShowRandomModal(false)}
                            className="w-full py-3 text-slate-500 text-xs font-bold hover:text-slate-300 transition-colors"
                        >
                            我再想想
                        </button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};
