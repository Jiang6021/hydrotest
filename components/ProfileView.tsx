import React from 'react';
import { Player } from '../types';
import { User, LogOut, Info, Settings, Shield } from 'lucide-react';

interface ProfileViewProps {
  player: Player;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ player, onLogout }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 fade-in pb-20 pt-4 px-2">
         
         <div className="flex flex-col items-center py-8">
             <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700 mb-4 text-slate-400">
                 <User size={40} />
             </div>
             <h2 className="text-2xl font-bold text-white">{player.name}</h2>
             <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded mt-1">ID: {player.id.substring(0, 8)}...</span>
         </div>

         <div className="space-y-3">
             <h3 className="text-slate-500 text-xs font-bold uppercase px-1">Account</h3>
             
             <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
                 <div className="p-4 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <Shield size={18} className="text-slate-400" />
                         <span className="text-sm text-slate-200">Total Life Time Damage</span>
                     </div>
                     <span className="font-mono text-orange-400">{player.totalDamageDealt}</span>
                 </div>
                 
                 <div className="p-4 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <Info size={18} className="text-slate-400" />
                         <span className="text-sm text-slate-200">Version</span>
                     </div>
                     <span className="text-slate-500 text-xs">v1.1.0 Beta</span>
                 </div>
             </div>
         </div>

         <div className="space-y-3">
             <h3 className="text-slate-500 text-xs font-bold uppercase px-1">System</h3>
             <button 
                onClick={onLogout}
                className="w-full bg-slate-900 hover:bg-red-950/30 border border-slate-800 hover:border-red-900/50 p-4 rounded-xl flex items-center justify-between group transition-all"
             >
                 <div className="flex items-center gap-3 text-red-400">
                     <LogOut size={18} />
                     <span className="text-sm font-bold">Log Out</span>
                 </div>
             </button>
         </div>
    </div>
  );
};