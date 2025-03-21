import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CardValue } from '@/context/GameContext';

interface CardProps {
  card?: CardValue;
  index: number;
  isPlayable?: boolean;
  onPlay?: () => void;
  delay?: number;
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
  return suit === 'hearts' || suit === 'diamonds' ? 'text-karma-card-red' : 'text-karma-card-black';
};

const Card = ({ card, index, isPlayable = false, onPlay, delay = 0 }: CardProps) => {
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
        className="playing-card bg-karma-card-back bg-card-texture"
      />
    );
  }

  const handleClick = () => {
    if (isPlayable && onPlay) {
      onPlay();
    }
  };

  const { suit, rank } = card;
  const suitSymbol = getSuitSymbol(suit);
  const suitColor = getSuitColor(suit);

  return (
    <div
      className={`playing-card ${isPlayable ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={handleClick}
      style={isPlayable ? { boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' } : {}}
    >
      <div className="card-frontface absolute inset-0 bg-white rounded-lg border border-gray-200">
        <div className={`absolute top-2 left-2 ${suitColor} font-bold text-xl`}>
          {rank}
        </div>
        <div className={`absolute bottom-2 right-2 ${suitColor} font-bold text-xl transform rotate-180`}>
          {rank}
        </div>
        <div className={`absolute top-2 right-2 ${suitColor} text-sm`}>
          {suitSymbol}
        </div>
        <div className={`absolute bottom-2 left-2 ${suitColor} text-sm transform rotate-180`}>
          {suitSymbol}
        </div>
        <div className={`absolute inset-0 flex items-center justify-center ${suitColor} text-4xl`}>
          {suitSymbol}
        </div>
      </div>
      <div className="card-back absolute inset-0 bg-karma-card-back bg-card-texture rounded-lg border border-gray-700">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
            <span className="text-white text-xl font-semibold">K</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
