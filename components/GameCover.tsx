import React, { useEffect, useState } from 'react';
import { Swords, Droplets, Flame, Play } from 'lucide-react';

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

          // Format Time: e.g., "14:30"
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
          setTimeString(now.toLocaleTimeString());
      }
    };

    updateTime();
    // Update minute by minute to keep time fresh without over-rendering
    const timer = setInterval(updateTime, 1000 * 60);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden font-inter text-white p-6">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 text-cyan-500 animate-pulse"><Droplets size={100} /></div>
        <div className="absolute bottom-10 right-10 text-orange-600 animate-pulse delay-700"><Flame size={120} /></div>
      </div>

      <div className="z-10 text-center space-y-12 max-w-md w-full">
        
        {/* Date Display (Taiwan) */}
        <div className="border-b border-slate-700 pb-4">
          <p className="text-slate-400 text-xs tracking-[0.2em] uppercase mb-2">Current Date (Taiwan)</p>
          <h2 className="text-xl md:text-2xl font-bold text-cyan-100 font-pixel">
            {taiwanDate}
          </h2>
          <p className="text-4xl font-black text-slate-700 mt-2 font-pixel opacity-30">{timeString}</p>
        </div>

        {/* Title Logo */}
        <div className="space-y-4">
          <div className="flex justify-center items-center gap-4 mb-4">
            <Swords size={48} className="text-cyan-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-pixel text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
            HYDRO<br/>SLAYER
          </h1>
          <p className="text-slate-400 text-sm md:text-base tracking-widest uppercase">
            Defeat the Fire Demon
          </p>
        </div>

        {/* Start Button */}
        <button 
          onClick={onStart}
          className="group relative w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-6 px-8 rounded-xl transition-all hover:-translate-y-1 shadow-[0_10px_0_rgb(21,94,117)] active:shadow-none active:translate-y-2"
        >
          <div className="flex items-center justify-center gap-4">
            <span className="font-pixel text-xl">START RAID</span>
            <Play className="fill-white group-hover:scale-110 transition-transform" />
          </div>
        </button>

        <div className="text-xs text-slate-600 mt-8">
          v1.0.2 • LINE Browser Fix
        </div>
      </div>
    </div>
  );
};