
import React from 'react';
import Card from '@/components/Card';

interface DeckDisplayProps {
  deckCount: number;
}

const DeckDisplay: React.FC<DeckDisplayProps> = ({ deckCount }) => {
  return (
    <div className="flex flex-col items-baseline">
      <div className="text-xs bg-shithead-primary text-white px-2 py-0.5 rounded-full font-medium whitespace-nowrap mb-2">
        {deckCount} card{deckCount !== 1 ? 's' : ''} left
      </div>
      
      <div className="relative flex justify-center">
        {deckCount > 0 && (
          <div className="relative">
            {Array.from({ length: Math.min(5, Math.max(1, Math.ceil(deckCount / 5))) }).map((_, index) => (
              <div 
                key={`deck-card-${index}`}
                className="absolute"
                style={{ 
                  top: `${-index * 0.5}px`, 
                  left: `${-index * 0.5}px`, 
                  transform: `rotate(${(index - 2) * 0.5}deg)`,
                  zIndex: 5 - index
                }}
              >
                <Card 
                  index={index} 
                  isPlayable={false}
                />
              </div>
            ))}
          </div>
        )}
        
        {deckCount === 0 && (
          <div className="playing-card bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-gray-400 text-xs">Empty</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckDisplay;
