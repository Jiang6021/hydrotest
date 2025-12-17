
import React, { useState, useMemo, useEffect } from 'react';
import { Player, TodoItem } from '../types';
import { CheckCircle, Plus, Shuffle, ThumbsUp, Sparkles, X, Skull } from 'lucide-react';
import { CreateTaskView } from './CreateTaskView';
import { DIMENSION_CONFIG, DimensionType } from '../constants';

interface LobbyViewProps {
  player: Player;
  onCompleteQuest: (todoId: string) => void;
  // Ensure 'dimensions' matches App.tsx
  onAddTodo?: (task: { label: string, note?: string, importance: number, difficulty: number, dimensions: DimensionType[] }) => void;
  onFailTodo?: (todoId: string) => void;
  isProcessing: boolean;
  randomTasks: string[];
}

export const LobbyView: React.FC<LobbyViewProps> = ({ player, onCompleteQuest, onAddTodo, onFailTodo, isProcessing, randomTasks }) => {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [seenTasks, setSeenTasks] = useState<Set<string>>(new Set());
  const [isExhausted, setIsExhausted] = useState(false);
  const [randomTaskSuggestion, setRandomTaskSuggestion] = useState("Loading tasks...");

  useEffect(() => {
      if (randomTasks.length > 0 && (randomTaskSuggestion === "Loading tasks..." || !randomTasks.includes(randomTaskSuggestion)) && !isExhausted) {
          const initialTask = randomTasks[Math.floor(Math.random() * randomTasks.length)];
          setRandomTaskSuggestion(initialTask);
          setSeenTasks(new Set([initialTask]));
      }
  }, [randomTasks, randomTaskSuggestion, isExhausted]);

  const handleShuffle = () => {
    if (!randomTasks || randomTasks.length === 0) return;
    const availableTasks = randomTasks.filter(task => !seenTasks.has(task));

    if (availableTasks.length === 0) {
        setRandomTaskSuggestion("哎呀！目前沒有隨機任務啦！");
        setIsExhausted(true);
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableTasks.length);
    const newTask = availableTasks[randomIndex];
    setRandomTaskSuggestion(newTask);
    setSeenTasks(prev => {
        const newSet = new Set(prev);
        newSet.add(newTask);
        return newSet;
    });
  };

  const handleAcceptRandom = () => {
    if (onAddTodo && !isExhausted) {
        // Correctly pass dimensions array
        onAddTodo({
            label: randomTaskSuggestion,
            note: '來自隨機任務建議',
            importance: 1,
            difficulty: 1,
            dimensions: [DimensionType.RESILIENCE] 
        });
        setShowRandomModal(false);
    }
  };

  const handleSaveNewTask = (task: { label: string, note: string, importance: number, difficulty: number, dimensions: DimensionType[] }) => {
      if (onAddTodo) {
          onAddTodo(task);
          setIsCreatingTask(false);
      }
  };

  const todoList = useMemo(() => {
      if (!player.todos) return [];
      return Object.values(player.todos).sort((a: TodoItem, b: TodoItem) => b.createdAt - a.createdAt);
  }, [player.todos]);

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
        <div className="pt-4 px-2 mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Good day, {player.name}</h2>
            <p className="text-slate-400 text-xs">One step closer, Merry Chrismas🎄</p>
        </div>

        <div className="space-y-3 px-1">
            <div className="px-2">
                <h3 className="text-slate-400 text-xs font-bold uppercase">所有任務</h3>
                <div className="h-px bg-slate-800 w-full mt-2"></div>
            </div>
            
            {todoList.length === 0 ? (
                <div className="flex flex-col items-center gap-4 mt-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="text-center">
                         <p className="text-slate-200 text-sm font-medium">暫無任務，嘗試新增一些吧！</p>
                    </div>
                    <button 
                        onClick={() => setShowRandomModal(true)}
                        className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-900 border border-slate-800 hover:border-purple-500/30 hover:bg-slate-800 transition-all active:scale-95 shadow-sm hover:shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                    >
                         <Sparkles size={14} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
                         <span className="text-xs text-slate-500 group-hover:text-slate-300 font-bold transition-colors">
                            不知道做什麼嗎？
                         </span>
                    </button>
                    {/* Add Task Button for empty state */}
                     <button
                        onClick={() => setIsCreatingTask(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-lg hover:shadow-[0_0_15px_rgba(8,145,178,0.5)]"
                    >
                        <Plus size={16} /> 新增任務
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {todoList.map((todo) => {
                        // FIX: Ensure types are correct. todo.dimensions is DimensionType[]
                        const dims = todo.dimensions || [];
                        const primaryDim = dims.length > 0 ? dims[0] : DimensionType.RESILIENCE;
                        
                        // FIX: Ensure indexing is safe.
                        const dimConfig = DIMENSION_CONFIG[primaryDim] || DIMENSION_CONFIG[DimensionType.RESILIENCE];
                        
                        return (
                            <div
                                key={todo.id}
                                className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-md group relative overflow-hidden flex flex-col gap-3 transition-all hover:bg-slate-750 hover:border-slate-600"
                            >
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
                                            
                                            <div className="flex gap-1 mt-2">
                                                {[...Array(todo.difficulty || 1)].map((_, i) => (
                                                    <div key={i} className="w-1.5 h-3 bg-slate-600 rounded-full"></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-700/50">
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
                                     <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCompleteQuest(todo.id);
                                        }}
                                        disabled={isProcessing}
                                        className="flex-[2] py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                                    >
                                        <CheckCircle size={18} />
                                        <span className="text-sm font-bold">完成</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Floating Add Button (Only show if list not empty) */}
        {todoList.length > 0 && (
             <button
                onClick={() => setIsCreatingTask(true)}
                className="fixed bottom-24 right-6 w-14 h-14 bg-cyan-500 hover:bg-cyan-400 text-white rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center transition-transform hover:scale-110 active:scale-90 z-40 border-2 border-white/20"
            >
                <Plus size={28} />
            </button>
        )}

        {/* Random Task Modal */}
        {showRandomModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm relative overflow-hidden">
                     {/* Bg FX */}
                     <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                         <Shuffle size={120} className="text-purple-500" />
                     </div>

                    <div className="relative z-10 text-center">
                        <div className="w-16 h-16 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-500/50">
                            <Sparkles className="text-purple-400 animate-pulse" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">不知道做什麼？</h3>
                        <p className="text-slate-400 text-xs mb-6 px-4">
                            讓系統為你指派一個隨機任務，開始新的一天！
                        </p>

                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 min-h-[80px] flex items-center justify-center relative">
                             {isExhausted ? (
                                 <span className="text-slate-500 text-sm">已無更多建議</span>
                             ) : (
                                 <span className="text-white font-bold text-lg animate-in fade-in zoom-in duration-300 key={randomTaskSuggestion}">
                                    {randomTaskSuggestion}
                                 </span>
                             )}
                        </div>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={handleShuffle}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <Shuffle size={16} /> 換一個
                            </button>
                            <button 
                                onClick={handleAcceptRandom}
                                disabled={isExhausted}
                                className="flex-[2] py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <ThumbsUp size={16} /> 接受挑戰
                            </button>
                        </div>
                        
                        <button 
                            onClick={() => setShowRandomModal(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
