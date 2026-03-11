
import React from 'react';
import { Card } from '../types';
import { getSuitIcon } from '../utils';
import SuitIcon from './SuitIcon';
import Logo from './Logo';

interface CardUIProps {
  card?: Card;
  isFlipped: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

const CardUI: React.FC<CardUIProps> = ({ card, isFlipped, isSelected, onClick, className = '' }) => {
  const suitInfo = card ? getSuitIcon(card.suit) : null;
  const isJoker = card?.rank === 'Joker';
  const isFaceCard = ['J', 'Q', 'K'].includes(card?.rank || '');

  return (
    <div 
      className={`card-ui-container perspective-1000 relative w-[16vw] max-w-[58px] h-[23vw] max-h-[84px] sm:w-20 sm:h-28 md:w-24 md:h-36 lg:w-32 lg:h-44 cursor-pointer transition-all duration-300 transform ${isSelected ? '-translate-y-4 sm:-translate-y-8 scale-110 ring-4 ring-yellow-400/50 rounded-xl' : 'hover:-translate-y-1'} ${className}`}
      onClick={onClick}
    >
      <div className={`card-inner relative w-full h-full rounded-lg sm:rounded-xl transition-transform duration-500 shadow-2xl ${isFlipped ? 'card-flipped' : ''}`}>
        
        {/* Card Back: Featuring the Niu Master Logo with Intricate Pattern */}
        <div className="card-back overflow-hidden relative border-[3px] border-yellow-500/60 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#2a0a0a] via-[#1a0a0a] to-black">
          {/* Large Background '牛' Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07]">
            <span className="text-[120px] sm:text-[180px] font-black cinzel text-yellow-500 leading-none select-none">牛</span>
          </div>

          {/* Intricate Mandala Pattern */}
          <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fde047' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6zM36 4V0h-2v4h-4v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
          
          <div className="absolute inset-0 flex items-center justify-center p-2">
             <div className="w-full h-full border-2 border-yellow-500/20 rounded-md flex items-center justify-center relative bg-black/20 backdrop-blur-[1px]">
                <div className="absolute inset-0 border border-yellow-500/10 m-1 rounded-sm"></div>
                <Logo className="w-[80%] h-[80%] opacity-90 scale-110" />
             </div>
          </div>
          
          {/* Corner Flourishes */}
          <div className="absolute top-1 left-1 text-yellow-500/30 text-[8px]"><i className="fa-solid fa-clover"></i></div>
          <div className="absolute top-1 right-1 text-yellow-500/30 text-[8px]"><i className="fa-solid fa-clover"></i></div>
          <div className="absolute bottom-1 left-1 text-yellow-500/30 text-[8px]"><i className="fa-solid fa-clover"></i></div>
          <div className="absolute bottom-1 right-1 text-yellow-500/30 text-[8px]"><i className="fa-solid fa-clover"></i></div>
        </div>

        {/* Card Front: High Contrast and Balanced Layout */}
        {card && (
          <div className={`card-front flex flex-col p-1 sm:p-2 select-none border-2 ${isFaceCard ? 'border-yellow-500/50 shadow-[inset_0_0_15px_rgba(234,179,8,0.1)]' : 'border-stone-200'} shadow-md ${isJoker ? 'bg-indigo-50' : 'bg-white'} rounded-lg sm:rounded-xl overflow-hidden relative`}>
            {/* Linen Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)'/%3E%3C/svg%3E")`
            }}></div>

            {isJoker ? (
              <div className="h-full flex flex-col items-center justify-between text-indigo-900 relative z-10 py-1">
                <span className="cinzel font-black text-[6px] sm:text-[10px] self-start px-0.5 tracking-tighter uppercase opacity-60">Master Wild</span>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative">
                    <i className="fa-solid fa-mask text-2xl sm:text-6xl mb-2 text-indigo-600 animate-pulse"></i>
                    <i className="fa-solid fa-crown absolute -top-4 -right-2 text-yellow-500 text-xs sm:text-xl rotate-12"></i>
                  </div>
                  <span className="cinzel font-black text-[8px] sm:text-lg tracking-widest gold-text">JOKER</span>
                </div>
                <span className="cinzel font-black text-[6px] sm:text-[10px] self-end px-0.5 rotate-180 tracking-tighter uppercase opacity-60">Master Wild</span>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-between relative z-10">
                {/* Top Corner Index */}
                <div className={`flex flex-col items-start ${suitInfo?.color} leading-none`}>
                  <span className={`text-[10px] sm:text-2xl font-black ${isFaceCard ? 'gold-text' : ''}`}>{card.rank}</span>
                  <SuitIcon suit={card.suit} className="w-2 h-2 sm:w-5 sm:h-5" />
                </div>
                
                {/* Central Art */}
                <div className="flex-1 flex items-center justify-center p-1 relative">
                  {isFaceCard ? (
                    <div className="relative flex items-center justify-center">
                       <div className="absolute inset-0 bg-yellow-500/5 rounded-full blur-xl scale-150"></div>
                       <SuitIcon suit={card.suit} className="w-10 h-10 sm:w-24 sm:h-24 opacity-90 drop-shadow-md" />
                       <div className="absolute -top-2 -right-2 text-yellow-600/40 text-xs sm:text-2xl"><i className="fa-solid fa-shield-halved"></i></div>
                    </div>
                  ) : (
                    <SuitIcon suit={card.suit} className="w-10 h-10 sm:w-24 sm:h-24 opacity-80 drop-shadow-sm" />
                  )}
                </div>

                {/* Bottom Corner Index */}
                <div className={`flex flex-col items-start ${suitInfo?.color} leading-none rotate-180`}>
                  <span className={`text-[10px] sm:text-2xl font-black ${isFaceCard ? 'gold-text' : ''}`}>{card.rank}</span>
                  <SuitIcon suit={card.suit} className="w-2 h-2 sm:w-5 sm:h-5" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardUI;
