import React, { useState } from 'react';
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

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      label,
      note,
      importance,
      difficulty
    });
  };

  const getLevelColor = (level: number) => {
    switch(level) {
      case 1: return 'bg-sky-500';
      case 2: return 'bg-emerald-500';
      case 3: return 'bg-amber-500';
      case 4: return 'bg-red-500';
      default: return 'bg-sky-500';
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
    <div className="fixed inset-0 bg-slate-100 z-[200] flex flex-col font-inter animate-in slide-in-from-right duration-300">
      
      {/* Top Bar */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-600 p-1 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-slate-800">建立待辦事項</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-400 p-1" disabled><Trash2 size={22} /></button>
          <button className="text-slate-600 p-1 hover:bg-slate-100 rounded-full"><Paperclip size={22} /></button>
          <button 
            onClick={handleSave}
            disabled={!label.trim()}
            className={`${!label.trim() ? 'text-slate-300' : 'text-slate-800'} p-1 hover:bg-slate-100 rounded-full transition-colors`}
          >
            <Check size={26} />
          </button>
        </div>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100">
        
        {/* Card 1: Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 relative">
          <div className="flex justify-between items-start">
             <h2 className="text-lg font-bold text-slate-800">基本資訊</h2>
             <HelpCircle size={18} className="text-slate-400 opacity-0" /> {/* Spacer/Icon placeholder */}
             <div className="absolute top-5 right-5 text-slate-400"><HelpCircle size={20} /></div>
          </div>
          
          {/* Tag Placeholder */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-sky-500"></div>
            <span className="bg-sky-50 text-sky-600 text-xs font-bold px-3 py-1 rounded-full border border-sky-100">
               日常任務
            </span>
          </div>

          {/* Task Input */}
          <div className="border border-sky-400 rounded-lg p-2 transition-colors focus-within:ring-2 focus-within:ring-sky-200">
            <label className="text-xs text-sky-500 font-bold px-1 block mb-1">任務</label>
            <textarea 
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full text-lg text-slate-800 font-medium placeholder:text-slate-300 outline-none resize-none h-20"
              placeholder=""
              autoFocus
            />
          </div>

          {/* Note Input */}
          <div className="border border-slate-300 rounded-lg p-3">
             <div className="text-sm text-slate-500 mb-1">備註</div>
             <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-sm text-slate-700 placeholder:text-slate-300 outline-none resize-none h-12"
             />
          </div>

          {/* Add Subtask */}
          <button className="flex items-center gap-2 text-sky-500 font-bold text-sm py-2">
            <Plus size={20} /> 新增子任務
          </button>
        </div>

        {/* Card 2: Rewards / Difficulty */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6 relative">
           <div className="absolute top-5 right-5 text-slate-400"><HelpCircle size={20} /></div>
           <h2 className="text-lg font-bold text-slate-800 mb-4">獎勵</h2>

           {/* Importance Slider */}
           <div>
              <label className="text-slate-700 font-bold mb-3 block">重要程度</label>
              <div className="relative pt-6 pb-2 px-2">
                 <input 
                    type="range" 
                    min="1" 
                    max="4" 
                    step="1"
                    value={importance}
                    onChange={(e) => setImportance(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-transparent"
                 />
                 {/* Custom Track Overlay */}
                 <div className="absolute top-6 left-2 right-2 h-2 pointer-events-none flex justify-between items-center px-1">
                 </div>
                 
                 {/* Labels */}
                 <div className="flex justify-between mt-3 px-1">
                    {[1, 2, 3, 4].map((v) => (
                       <span key={v} className={`text-xs font-bold ${importance === v ? 'text-slate-800' : 'text-slate-300'}`}>
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
              <label className="text-slate-700 font-bold mb-3 block">困難程度</label>
              <div className="relative pt-6 pb-2 px-2">
                 <input 
                    type="range" 
                    min="1" 
                    max="4" 
                    step="1"
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                 />
                  
                 {/* Labels */}
                 <div className="flex justify-between mt-3 px-1">
                    {[1, 2, 3, 4].map((v) => (
                       <span key={v} className={`text-xs font-bold ${difficulty === v ? 'text-slate-800' : 'text-slate-300'}`}>
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