
import React from 'react';
import { Suit } from '../types';

interface SuitIconProps {
  suit: Suit;
  className?: string;
}

const SuitIcon: React.FC<SuitIconProps> = ({ suit, className = "" }) => {
  const getPath = () => {
    switch (suit) {
      case 'Spades':
        return "M256 32c-7.7 0-14.7 3.5-19.3 9.4L110.1 206.5c-44 56.6-4.6 138 66.4 138h.4c3.3 0 6.6 .2 9.9 .5-13.4 13.5-21.7 31.9-21.7 52.3 0 41.1 33.3 74.4 74.4 74.4s74.4-33.3 74.4-74.4c0-20.3-8.3-38.7-21.7-52.3 3.3-.3 6.6-.5 9.9-.5h.4c71 0 110.4-81.4 66.4-138L275.3 41.4C270.7 35.5 263.7 32 256 32z";
      case 'Hearts':
        return "M256 448l-30-28C108 314 32 244 32 160 32 92 86 38 154 38c38 0 76 18 102 46c26-28 64-46 102-46 68 0 122 54 122 122 0 84-76 154-194 260l-30 28z";
      case 'Clubs':
        return "M256 32c-47 0-85 38-85 85 0 18 5 34 14 48-48 15-84 60-84 114 0 66 53 119 119 119 17 0 32-3 46-10l-21 76c-2 9 4 17 13 17h54c9 0 15-9 13-17l-21-76c14 6 30 10 46 10 66 0 119-53 119-119 0-54-35-99-84-114 9-14 14-30 14-48 0-47-38-85-85-85z";
      case 'Diamonds':
        return "M256 32L64 256l192 224 192-224L256 32z";
      default:
        return "";
    }
  };

  const colorClasses = {
    Spades: 'fill-stone-900',
    Hearts: 'fill-red-600',
    Clubs: 'fill-stone-900',
    Diamonds: 'fill-red-500',
    None: 'fill-indigo-500'
  };

  if (suit === 'None') return <i className={`fa-solid fa-star ${className} text-indigo-500`}></i>;

  return (
    <svg 
      viewBox="0 0 512 512" 
      className={`${className} ${colorClasses[suit]} transition-all duration-300`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${suit} icon`}
    >
      <path d={getPath()} />
    </svg>
  );
};

export default SuitIcon;
