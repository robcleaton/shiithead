
import { useState, useEffect } from 'react';
import { CardValue } from '@/context/GameContext';

interface CardProps {
  card?: CardValue;
  index: number;
  isPlayable?: boolean;
  onPlay?: () => void;
  delay?: number;
  isSelected?: boolean;
  onSelect?: () => void;
  sizeClass?: string;
}

const getSuitSymbol = (suit: string) => {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
    default: return '';
  }
};

const getSuitColor = (suit: string) => {
  return suit === 'hearts' || suit === 'diamonds' ? 'text-shithead-card-red' : 'text-shithead-card-black';
};

const Card = ({ 
  card, 
  index, 
  isPlayable = false, 
  onPlay, 
  delay = 0, 
  isSelected = false, 
  onSelect,
  sizeClass = '' 
}: CardProps) => {
  const [isFlipped, setIsFlipped] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFlipped(false);
    }, 100 + delay * 100);
    
    return () => clearTimeout(timer);
  }, [delay]);

  if (!card) {
    return (
      <div 
        className={`playing-card bg-shithead-card-back bg-card-texture ${sizeClass === 'pile-card' || sizeClass === 'deck-card' ? 'playing-card-lg' : ''}`}
      />
    );
  }

  const handleClick = () => {
    if (isPlayable) {
      // Use onSelect if provided, otherwise fall back to onPlay
      if (onSelect) {
        onSelect();
      } else if (onPlay) {
        onPlay();
      }
    }
  };

  const { suit, rank } = card;
  const suitSymbol = getSuitSymbol(suit);
  const suitColor = getSuitColor(suit);

  return (
    <div
      className={`playing-card relative ${isPlayable ? 'cursor-pointer hover:scale-105' : ''} 
                  ${isSelected ? 'ring-4 ring-shithead-primary shadow-lg scale-105 z-10' : ''} 
                  ${sizeClass === 'pile-card' || sizeClass === 'deck-card' ? 'playing-card-lg' : ''}
                  transition-all duration-200`}
      onClick={handleClick}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-shithead-primary rounded-full flex items-center justify-center z-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      )}
      <div className="card-frontface absolute inset-0 bg-white rounded-lg border border-gray-200">
        <div className={`absolute top-2 left-2 ${suitColor} font-bold text-xl ${sizeClass === 'pile-card' || sizeClass === 'deck-card' ? 'text-2xl' : ''}`}>
          {rank}
        </div>
        <div className={`absolute bottom-2 right-2 ${suitColor} font-bold text-xl ${sizeClass === 'pile-card' || sizeClass === 'deck-card' ? 'text-2xl' : ''} transform rotate-180`}>
          {rank}
        </div>
        <div className={`absolute top-2 right-2 ${suitColor} text-sm ${sizeClass === 'pile-card' || sizeClass === 'deck-card' ? 'text-base' : ''}`}>
          {suitSymbol}
        </div>
        <div className={`absolute bottom-2 left-2 ${suitColor} text-sm ${sizeClass === 'pile-card' || sizeClass === 'deck-card' ? 'text-base' : ''} transform rotate-180`}>
          {suitSymbol}
        </div>
        <div className={`absolute inset-0 flex items-center justify-center ${suitColor} text-4xl ${sizeClass === 'pile-card' || sizeClass === 'deck-card' ? 'text-5xl' : ''}`}>
          {suitSymbol}
        </div>
      </div>
      <div className="card-back absolute inset-0 bg-shithead-card-back bg-card-texture rounded-lg border border-gray-700">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-12 h-12 ${sizeClass === 'pile-card' || sizeClass === 'deck-card' ? 'w-16 h-16' : ''} rounded-full bg-gray-700/90 flex items-center justify-center border border-white/20`}>
            <span className={`text-white text-xl ${sizeClass === 'pile-card' || sizeClass === 'deck-card' ? 'text-2xl' : ''} font-semibold`}>K</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
