
import React, { useEffect } from 'react';
import { CardValue } from '@/context/GameContext';
import { Button } from './ui/button';
import { HandMetal, Flame, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Card from './Card';

interface GameTableProps {
  pile: CardValue[];
  deckCount: number;
  onDrawCard: () => void;
  onPickupPile: () => void;
  currentPlayer: string;
  isCurrentPlayer: boolean;
  mustPickUpPileOrPlayThree: boolean;
}

const GameTable: React.FC<GameTableProps> = ({ 
  pile, 
  deckCount, 
  onDrawCard, 
  onPickupPile,
  currentPlayer, 
  isCurrentPlayer,
  mustPickUpPileOrPlayThree
}) => {
  const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
  const sameRankCount = pile.length > 0 
    ? pile.filter(card => card.rank === topCard?.rank).length
    : 0;
  
  const isThreeOnTop = topCard?.rank === '3';
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
  
  useEffect(() => {
    console.log(`GameTable received deckCount: ${deckCount}`);
  }, [deckCount]);
  
  return (
    <div className="w-full max-w-2xl p-6 bg-karma-muted/30 backdrop-blur-sm rounded-xl border border-karma-border shadow-sm relative">
      <div className="flex justify-center items-center mb-4">
        <span className="px-3 py-1 bg-karma-secondary/50 rounded-full text-xs">
          Current Player: <strong>{currentPlayer}</strong>
        </span>
      </div>
      
      {/* Game area */}
      <div className="flex justify-center mb-6">
        {/* Card counts display */}
        <div className="flex flex-col items-baseline">
          <div className="flex gap-16 mb-2 justify-center">
            <div className="flex flex-col items-baseline">
              <div className="text-xs bg-karma-primary text-white px-2 py-0.5 rounded-full font-medium whitespace-nowrap mb-2">
                {deckCount} card{deckCount !== 1 ? 's' : ''} left
              </div>
              
              {/* Deck - Centered below title */}
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
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-10">
                        <span className="text-xs bg-blue-500 text-white rounded-full px-2 py-0.5 font-medium border border-blue-600/20">
                          Play on {cardBelowEight.rank} of {cardBelowEight.suit}
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
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-3">
        {isCurrentPlayer && (
          <Button
            variant={mustPickUpPileOrPlayThree ? "destructive" : "secondary"}
            size="sm"
            onClick={onPickupPile}
            disabled={pile.length === 0}
          >
            <HandMetal className="mr-2 h-4 w-4" />
            Pick Up Pile
          </Button>
        )}
      </div>
      
      <div className="text-center mt-4 text-xs text-karma-foreground/70">
        {isThreeOnTop && (
          <p className="font-medium text-orange-600 mb-1">Three has been played! {isCurrentPlayer ? "You must" : "Current player must"} pick up the pile or play another 3.</p>
        )}
        {isTenOnTop && (
          <p className="font-medium text-orange-500 mb-1">10 has been played! The entire discard pile has been burned!</p>
        )}
        {isEightOnTop && (
          <p className="font-medium text-blue-500 mb-1">8 has been played! This card is transparent - play on the card below it.</p>
        )}
      </div>
    </div>
  );
};

export default GameTable;
