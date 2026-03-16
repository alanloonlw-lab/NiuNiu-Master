
import React from 'react';

const Logo: React.FC<{ className?: string; onClick?: () => void }> = ({ className = "", onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`flex flex-col items-center justify-center select-none ${onClick ? 'cursor-pointer' : 'pointer-events-none'} ${className}`}
    >
      <div className="relative flex flex-col items-center">
        {/* Crown Icon for 'Master' status */}
        <div className="absolute -top-6 sm:-top-8 text-yellow-500 animate-bounce duration-[3s]">
          <i className="fa-solid fa-crown text-xl sm:text-2xl drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]"></i>
        </div>
        
        <div className="flex items-baseline gap-1 mt-1 sm:mt-2">
          <span className="text-4xl sm:text-7xl font-black gold-text cinzel tracking-tighter drop-shadow-2xl">牛牛</span>
          <div className="flex flex-col items-start -ml-1">
            <span className="text-lg sm:text-3xl font-black text-white italic font-sans tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">MASTER</span>
            <div className="h-[1px] w-full bg-blue-400/50"></div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
          <div className="h-[1px] w-4 sm:w-12 bg-gradient-to-r from-transparent to-yellow-500/50"></div>
          <span className="text-[6px] sm:text-[10px] font-black text-yellow-500/80 uppercase tracking-[0.2em] sm:tracking-[0.4em] cinzel">Fast Arena</span>
          <div className="h-[1px] w-4 sm:w-12 bg-gradient-to-l from-transparent to-yellow-500/50"></div>
        </div>
      </div>
    </div>
  );
};

export default Logo;
