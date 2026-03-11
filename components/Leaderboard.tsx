
import React from 'react';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const getPlatformIcon = (platform?: string) => {
  switch (platform) {
    case 'Facebook': return <i className="fa-brands fa-facebook text-blue-400 text-xs"></i>;
    case 'TikTok': return <i className="fa-brands fa-tiktok text-white text-xs"></i>;
    case 'Instagram': return <i className="fa-brands fa-instagram text-pink-400 text-xs"></i>;
    default: return <i className="fa-solid fa-globe text-stone-600 text-[10px]"></i>;
  }
};

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, isLoading, onRefresh }) => {
  return (
    <div className="w-full max-w-sm bg-stone-900 rounded-3xl border border-white/10 p-6 backdrop-blur-xl shadow-2xl relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="cinzel text-xl font-black gold-text flex items-center gap-2">
          <i className="fa-solid fa-trophy text-yellow-500"></i>
          Hall of Bulls
        </h3>
        <button 
          onClick={onRefresh}
          className={`text-stone-500 hover:text-white transition-all ${isLoading ? 'animate-spin' : ''}`}
        >
          <i className="fa-solid fa-arrows-rotate"></i>
        </button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar min-h-[200px]">
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center flex-col gap-3">
            <div className="w-10 h-10 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin"></div>
            <span className="text-stone-500 text-[10px] font-black uppercase tracking-widest">Fetching Legends...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center flex-col text-center p-4">
            <i className="fa-solid fa-ghost text-stone-700 text-4xl mb-2"></i>
            <span className="text-stone-500 text-xs font-bold">No legends yet.<br/>Be the first to join!</span>
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div 
              key={`${entry.uid}-${idx}`} 
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${entry.isPlayer ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 text-center font-black ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-stone-300' : idx === 2 ? 'text-orange-400' : 'text-stone-500'}`}>{idx + 1}</span>
                <div className="flex flex-col">
                   <div className="flex items-center gap-1.5">
                      <span className={`font-bold ${entry.isPlayer ? 'text-yellow-400' : 'text-stone-300'} truncate max-w-[120px]`}>{entry.displayName}</span>
                   </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-white text-sm">
                  {entry.totalScore?.toLocaleString() || '0'}
                </div>
                <div className="text-[8px] text-stone-500 font-black uppercase tracking-widest">Total Score</div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5 text-center">
         <span className="text-[8px] text-stone-600 font-black uppercase tracking-[0.2em]">Powered by Firebase Real-time DB</span>
      </div>
    </div>
  );
};

export default Leaderboard;
