import React, { useEffect, useState } from 'react';
import { Swords, Droplets, Flame, Play, CheckSquare, Shield, Sparkles } from 'lucide-react';

interface GameCoverProps {
  onStart: () => void;
}

export const GameCover: React.FC<GameCoverProps> = ({ onStart }) => {
  const [taiwanDate, setTaiwanDate] = useState('');
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    // Function to update time for Taiwan Zone
    const updateTime = () => {
      const now = new Date();
      
      try {
          // Format Date: e.g., "2023年10月27日 星期五"
          const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
            timeZone: 'Asia/Taipei',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          });

          // Format Time: e.g., "14:30" (Seconds removed)
          const timeFormatter = new Intl.DateTimeFormat('zh-TW', {
            timeZone: 'Asia/Taipei',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });

          setTaiwanDate(dateFormatter.format(now));
          setTimeString(timeFormatter.format(now));
      } catch (e) {
          // Fallback for browsers that don't support timeZone option perfectly
          setTaiwanDate(now.toLocaleDateString());
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          setTimeString(`${hours}:${minutes}`);
      }
    };

    updateTime();
    // Keep checking every second to ensure the minute flips exactly when it happens
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  const FEATURES = [
      {
          icon: <CheckSquare size={20} className="text-emerald-400" />,
          title: "任務成長",
          desc: "完成現實待辦事項\n對惡魔造成真實傷害"
      },
      {
          icon: <Droplets size={20} className="text-cyan-400" />,
          title: "喝水充能",
          desc: "攝取水分補充彈藥\n保持體力發動攻擊"
      },
      {
          icon: <Sparkles size={20} className="text-purple-400" />,
          title: "感恩祝福",
          desc: "寫下感恩日記\n隨機獲得戰鬥 Buff"
      },
      {
          icon: <Shield size={20} className="text-orange-400" />,
          title: "團隊討伐",
          desc: "與好友組成隊伍\n共同擊敗巨型 Boss"
      }
  ];

  return (
    <div className="h-[100dvh] w-full bg-slate-950 flex flex-col items-center relative overflow-hidden font-inter text-white px-6 py-6 touch-none select-none">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 text-cyan-500 animate-pulse"><Droplets size={100} /></div>
        <div className="absolute bottom-10 right-10 text-orange-600 animate-pulse delay-700"><Flame size={120} /></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-900/20 blur-[100px] rounded-full"></div>
      </div>

      <div className="z-10 w-full max-w-md flex flex-col h-full justify-between">
        
        {/* Top Section */}
        <div className="flex flex-col gap-1 shrink-0">
            {/* Header: Date & Time */}
            <div className="border-b border-slate-800 pb-2 mb-2">
            <div className="flex justify-between items-end gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-slate-400 text-[10px] tracking-[0.2em] uppercase mb-1">Taiwan System Time</p>
                    {/* Added whitespace-nowrap to prevent date wrapping */}
                    <h2 className="text-sm font-bold text-cyan-100 whitespace-nowrap overflow-hidden text-ellipsis">
                        {taiwanDate}
                    </h2>
                </div>
                {/* Reduced font size slightly to ensure date fits */}
                <p className="text-3xl font-black text-slate-700 font-pixel opacity-50 text-right leading-none shrink-0">{timeString}</p>
            </div>
            </div>

            {/* Title Logo Section */}
            <div className="text-center mb-2 relative">
            <div className="inline-flex justify-center items-center gap-2 mb-2 bg-slate-900/50 p-2 px-4 rounded-full border border-slate-700/50 backdrop-blur-sm">
                <Swords size={16} className="text-cyan-400" />
                <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase">Gamified Habit RPG</span>
            </div>
            {/* Responsive text size */}
            <h1 className="text-4xl sm:text-5xl font-pixel text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] leading-tight mb-2">
                HYDRO<br/>SLAYER
            </h1>
            <p className="text-slate-400 text-[10px] sm:text-xs tracking-widest uppercase pb-1">
                v1.1.0 • Defeat the Fire Demon
            </p>
            </div>
        </div>

        {/* --- Feature Grid --- */}
        {/* Removed min-h-0 constraint and allow grid to take space appropriately */}
        <div className="grid grid-cols-2 gap-3 mb-2 flex-1 content-center">
            {FEATURES.map((feat, idx) => (
                <div 
                    key={idx} 
                    // Changed max-h to min-h and h-auto to allow text expansion
                    className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl backdrop-blur-sm hover:bg-slate-800/60 transition-colors group flex flex-col justify-center h-auto min-h-[90px]"
                >
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800 group-hover:border-slate-600 transition-colors shrink-0">
                            {feat.icon}
                        </div>
                        <h3 className="font-bold text-sm text-slate-200 leading-tight">{feat.title}</h3>
                    </div>
                    {/* Removed line-clamp to show full text */}
                    <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-line">
                        {feat.desc}
                    </p>
                </div>
            ))}
        </div>

        {/* Start Button Area (Footer) */}
        <div className="mt-auto space-y-3 shrink-0 pb-4">
            <button 
                onClick={onStart}
                className="group relative w-full bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl transition-all hover:-translate-y-1 shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-[0.98] border border-cyan-500/30"
            >
            <div className="flex items-center justify-center gap-3">
                <span className="font-pixel text-lg tracking-wide">START ADVENTURE</span>
                <Play className="fill-white group-hover:translate-x-1 transition-transform" size={20} />
            </div>
            </button>
            
            <p className="text-center text-[10px] text-slate-600">
                Data persists locally & syncs with party via Firebase
            </p>
        </div>

      </div>
    </div>
  );
};