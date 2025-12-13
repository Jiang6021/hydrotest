import React from 'react';
import { DailyEvent } from '../types';
import { Zap, AlertTriangle, Shield } from 'lucide-react';

interface EventBannerProps {
  event: DailyEvent;
}

export const EventBanner: React.FC<EventBannerProps> = ({ event }) => {
  const getStyles = () => {
    switch (event.type) {
      case 'CRITICAL_DAY':
        return { bg: 'bg-emerald-900/50', border: 'border-emerald-500', icon: <Zap className="text-emerald-400" /> };
      case 'CURSE':
        return { bg: 'bg-purple-900/50', border: 'border-purple-500', icon: <AlertTriangle className="text-purple-400" /> };
      default:
        return { bg: 'bg-blue-900/50', border: 'border-blue-500', icon: <Shield className="text-blue-400" /> };
    }
  };

  const style = getStyles();

  return (
    <div className={`${style.bg} border-l-4 ${style.border} p-4 rounded-r-lg shadow-lg flex items-center gap-4 mb-6`}>
      <div className="p-2 bg-slate-900/50 rounded-full">
        {style.icon}
      </div>
      <div>
        <h3 className="font-bold text-sm uppercase tracking-wide text-slate-300">Daily Event</h3>
        <p className="text-lg font-semibold text-white">
          {event.description} <span className="text-xs opacity-70 ml-2">({event.type})</span>
        </p>
      </div>
    </div>
  );
};