import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Trash2, Paperclip, Check, HelpCircle, Plus } from 'lucide-react';

interface CreateTaskViewProps {
  onBack: () => void;
  onSave: (task: { label: string, note: string, importance: number, difficulty: number }) => void;
}

export const CreateTaskView: React.FC<CreateTaskViewProps> = ({ onBack, onSave }) => {
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [importance, setImportance] = useState(1);
  const [difficulty, setDifficulty] = useState(1);

  // Refs for auto-resizing textareas
  const labelRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      label,
      note,
      importance,
      difficulty
    });
  };

  // Auto-resize helper
  const adjustHeight = (ref: React.RefObject<HTMLTextAreaElement | null>) => {
    if (ref.current) {
      ref.current.style.height = 'auto'; // Reset height
      ref.current.style.height = `${ref.current.scrollHeight}px`; // Set to scroll height
    }
  };

  // Adjust height on mount/change
  useEffect(() => adjustHeight(labelRef), [label]);
  useEffect(() => adjustHeight(noteRef), [note]);

  const getLevelColor = (level: number) => {
    switch(level) {
      case 1: return 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]';
      case 2: return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      case 3: return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
      case 4: return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
      default: return 'bg-cyan-500';
    }
  };

  const getLevelLabel = (level: number) => {
      switch(level) {
          case 1: return 'Lv1';
          case 2: return 'Lv2';
          case 3: return 'Lv3';
          case 4: return 'Lv4';
          default: return '';
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[200] flex flex-col font-inter animate-in slide-in-from-right duration-300 text-slate-200">
      
      {/* Top Bar */}
      <div className="bg-slate-900 px-4 py-3 flex items-center justify-between shadow-md border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-400 p-1 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white font-pixel tracking-wide">建立任務</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-600 p-1" disabled><Trash2 size={22} /></button>
          <button className="text-slate-400 p-1 hover:bg-slate-800 rounded-full transition-colors"><Paperclip size={22} /></button>
          <button 
            onClick={handleSave}
            disabled={!label.trim()}
            className={`${!label.trim() ? 'text-slate-600' : 'text-cyan-400 hover:text-cyan-300'} p-1 transition-colors`}
          >
            <Check size={26} />
          </button>
        </div>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 custom-scrollbar pb-24">
        
        {/* Card 1: Basic Info */}
        <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-5 space-y-5 relative">
          <div className="flex justify-between items-start">
             <h2 className="text-lg font-bold text-slate-200">基本資訊</h2>
             <div className="absolute top-5 right-5 text-slate-600"><HelpCircle size={20} /></div>
          </div>
          
          {/* Tag Placeholder */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_cyan]"></div>
            <span className="bg-cyan-950/50 text-cyan-400 text-xs font-bold px-3 py-1 rounded-full border border-cyan-800/50">
               日常任務
            </span>
          </div>

          {/* Task Input (Auto-growing) */}
          <div className="border border-cyan-700/50 rounded-lg p-3 transition-colors focus-within:border-cyan-500 focus-within:bg-slate-800/50 bg-slate-950">
            <label className="text-xs text-cyan-500 font-bold px-0.5 block mb-1 uppercase tracking-wider">任務名稱</label>
            <textarea 
              ref={labelRef}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full text-lg text-white font-medium placeholder:text-slate-600 bg-transparent outline-none resize-none overflow-hidden min-h-[32px]"
              placeholder="輸入任務..."
              rows={1}
              autoFocus
            />
          </div>

          {/* Note Input (Auto-growing) */}
          <div className="border border-slate-700 rounded-lg p-3 focus-within:border-slate-500 bg-slate-950">
             <div className="text-xs text-slate-500 mb-1 font-bold uppercase tracking-wider">備註</div>
             <textarea 
                ref={noteRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-sm text-slate-300 placeholder:text-slate-600 bg-transparent outline-none resize-none overflow-hidden min-h-[24px]"
                placeholder="新增備註..."
                rows={1}
             />
          </div>
        </div>

        {/* Card 2: Rewards / Difficulty */}
        <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-5 space-y-6 relative">
           <div className="absolute top-5 right-5 text-slate-600"><HelpCircle size={20} /></div>
           <h2 className="text-lg font-bold text-slate-200 mb-2">獎勵設定</h2>

           {/* Importance Slider */}
           <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 block">重要程度 (Importance)</label>
              <div className="relative pt-6 pb-2 px-2">
                 <input 
                    type="range" 
                    min="1" 
                    max="4" 
                    step="1"
                    value={importance}
                    onChange={(e) => setImportance(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-transparent"
                 />
                 
                 {/* Labels */}
                 <div className="flex justify-between mt-3 px-1">
                    {[1, 2, 3, 4].map((v) => (
                       <span key={v} className={`text-xs font-bold ${importance === v ? 'text-white' : 'text-slate-600'}`}>
                           {getLevelLabel(v)}
                       </span>
                    ))}
                 </div>
                 
                 {/* Current Value Indicator (Floating) */}
                 <div 
                    className={`absolute -top-1 px-3 py-1 rounded text-white text-xs font-bold ${getLevelColor(importance)} transition-all duration-200`}
                    style={{ left: `${((importance - 1) / 3) * 100}%`, transform: 'translateX(-50%)' }}
                 >
                    {getLevelLabel(importance)}
                 </div>
              </div>
           </div>

           {/* Difficulty Slider */}
           <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 block">困難程度 (Difficulty)</label>
              <div className="relative pt-6 pb-2 px-2">
                 <input 
                    type="range" 
                    min="1" 
                    max="4" 
                    step="1"
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                 />
                  
                 {/* Labels */}
                 <div className="flex justify-between mt-3 px-1">
                    {[1, 2, 3, 4].map((v) => (
                       <span key={v} className={`text-xs font-bold ${difficulty === v ? 'text-white' : 'text-slate-600'}`}>
                           {getLevelLabel(v)}
                       </span>
                    ))}
                 </div>
                 
                  {/* Current Value Indicator (Floating) */}
                  <div 
                    className={`absolute -top-1 px-3 py-1 rounded text-white text-xs font-bold ${getLevelColor(difficulty)} transition-all duration-200`}
                    style={{ left: `${((difficulty - 1) / 3) * 100}%`, transform: 'translateX(-50%)' }}
                 >
                    {getLevelLabel(difficulty)}
                 </div>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
};