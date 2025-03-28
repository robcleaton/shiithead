
import React from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/Card';
import { CardValue } from '@/types/game';
import { Flame } from 'lucide-react';

interface PileDisplayProps {
  pile: CardValue[];
}

const PileDisplay: React.FC<PileDisplayProps> = ({ pile }) => {
  const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
  const sameRankCount = pile.length > 0 
    ? pile.filter(card => card.rank === topCard?.rank).length
    : 0;
  
  const isTenOnTop = topCard?.rank === '10';
  const isEightOnTop = topCard?.rank === '8';
  
  // Find the first non-8 card below the top card
  const findCardBelowEight = (): CardValue | null => {
    if (!isEightOnTop || pile.length <= 1) return null;
    
    // Start from the second-to-last card (index pile.length - 2)
    for (let i = pile.length - 2; i >= 0; i--) {
      if (pile[i].rank !== '8') {
        return pile[i];
      }
    }
    return null;
  };
  
  const cardBelowEight = findCardBelowEight();
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs bg-karma-primary text-white px-2 py-0.5 rounded-full font-medium whitespace-nowrap mb-2">
        {pile.length} card{pile.length !== 1 ? 's' : ''} discarded
      </div>
      
      {/* Pile */}
      <div className="relative">
        {isTenOnTop && (
          <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs text-karma-foreground/70 text-center">
            <span className="font-medium text-orange-500 flex items-center justify-center">
              <Flame className="h-3 w-3 mr-1" /> Burned
            </span>
          </div>
        )}
        
        {topCard ? (
          <div className="relative">
            {sameRankCount > 1 && (
              Array.from({ length: Math.min(3, sameRankCount - 1) }).map((_, index) => (
                <div 
                  key={`pile-card-${index}`}
                  className="absolute"
                  style={{ 
                    top: `${-3 - index * 2}px`, 
                    left: `${-3 - index * 2}px`, 
                    transform: `rotate(${(index - 1) * -3}deg)`,
                    zIndex: 3 - index
                  }}
                >
                  <Card 
                    card={topCard} 
                    index={index} 
                    isPlayable={false}
                  />
                </div>
              ))
            )}
            
            <div className={cn(
              isTenOnTop ? 'ring-2 ring-orange-500' : '',
              isEightOnTop ? 'opacity-70' : ''
            )}>
              <Card 
                card={topCard} 
                index={0} 
                isPlayable={false}
              />
            </div>
            
            {sameRankCount > 1 && (
              <div className="absolute bottom-0 right-0 translate-x-2 translate-y-2 z-10">
                <span className="text-xs bg-karma-primary text-white rounded-full px-2 py-0.5 font-medium border border-karma-border/20">
                  {sameRankCount}
                </span>
              </div>
            )}
            
            {isEightOnTop && cardBelowEight && (
              <div className="absolute -bottom-6 left-0 right-0 transform z-10 w-full">
                <span className="block text-xs bg-blue-500 text-white rounded-md px-3 py-1 font-medium border border-blue-600/20 w-full text-center">
                  Play on {cardBelowEight.rank}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="playing-card bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-gray-400 text-xs">Empty</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PileDisplay;
