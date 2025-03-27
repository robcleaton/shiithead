
import React, { useEffect } from 'react';
import { CardValue } from '@/context/GameContext';
import { Button } from './ui/button';
import { HandMetal, Flame, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <div className="flex flex-col items-center">
          <div className="flex gap-10 mb-2 justify-center">
            <div className="flex flex-col items-center">
              <div className="text-xs bg-karma-secondary/70 text-karma-foreground px-2 py-0.5 rounded-full font-medium whitespace-nowrap mb-2">
                {deckCount} card{deckCount !== 1 ? 's' : ''} left
              </div>
              
              {/* Deck */}
              <div className="relative">
                {deckCount > 0 && (
                  <div className="relative">
                    {Array.from({ length: Math.min(5, Math.max(1, Math.ceil(deckCount / 5))) }).map((_, index) => (
                      <div 
                        key={`deck-card-${index}`}
                        className="absolute w-20 h-28 bg-karma-card-back bg-card-texture rounded-lg border border-gray-800/20 shadow-md"
                        style={{ 
                          top: `${-index * 0.5}px`, 
                          left: `${-index * 0.5}px`, 
                          transform: `rotate(${(index - 2) * 0.5}deg)`,
                          zIndex: 5 - index
                        }}
                      />
                    ))}
                    
                    {/* Removed the deck count indicator here */}
                  </div>
                )}
                
                {deckCount === 0 && (
                  <div className="w-20 h-28 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Empty</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="text-xs bg-karma-secondary/70 text-karma-foreground px-2 py-0.5 rounded-full font-medium whitespace-nowrap mb-2">
                {pile.length} card{pile.length !== 1 ? 's' : ''} discarded
              </div>
              
              {/* Pile */}
              <div className="relative">
                {/* Removed the sameRankCount display from above the pile */}
                
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
                          className="absolute w-20 h-28 bg-white rounded-lg border border-gray-200 shadow-md flex items-center justify-center"
                          style={{ 
                            top: `${-3 - index * 2}px`, 
                            left: `${-3 - index * 2}px`, 
                            transform: `rotate(${(index - 1) * -3}deg)`,
                            zIndex: 3 - index
                          }}
                        >
                          <div className={`text-3xl ${topCard.suit === 'hearts' || topCard.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                            {topCard.rank}
                            <span className="text-2xl">
                              {topCard.suit === 'hearts' ? '♥' : 
                              topCard.suit === 'diamonds' ? '♦' : 
                              topCard.suit === 'clubs' ? '♣' : '♠'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                    
                    <div className={`w-20 h-28 bg-white rounded-lg border border-gray-200 shadow-md flex items-center justify-center ${isTenOnTop ? 'ring-2 ring-orange-500' : ''}`}>
                      <div className={`text-3xl ${topCard.suit === 'hearts' || topCard.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                        {topCard.rank}
                        <span className="text-2xl">
                          {topCard.suit === 'hearts' ? '♥' : 
                          topCard.suit === 'diamonds' ? '♦' : 
                          topCard.suit === 'clubs' ? '♣' : '♠'}
                        </span>
                      </div>
                    </div>
                    
                    {pile.length > 1 && (
                      <div className="absolute bottom-0 right-0 translate-x-2 translate-y-2 z-10">
                        <span className="text-xs bg-white/90 rounded-full px-1 text-gray-700 font-medium border border-gray-200">
                          {pile.length}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-20 h-28 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
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
          <>
            <Button
              variant="default"
              size="sm"
              onClick={onDrawCard}
              disabled={deckCount === 0}
              className="bg-karma-primary hover:bg-karma-primary/90"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Draw Card
            </Button>
            
            <Button
              variant={mustPickUpPileOrPlayThree ? "destructive" : "secondary"}
              size="sm"
              onClick={onPickupPile}
              disabled={pile.length === 0}
            >
              <HandMetal className="mr-2 h-4 w-4" />
              Pick Up Pile
            </Button>
          </>
        )}
      </div>
      
      <div className="text-center mt-4 text-xs text-karma-foreground/70">
        {isThreeOnTop && (
          <p className="font-medium text-orange-600 mb-1">Three has been played! {isCurrentPlayer ? "You must" : "Current player must"} pick up the pile or play another 3.</p>
        )}
        {isTenOnTop && (
          <p className="font-medium text-orange-500 mb-1">10 has been played! The entire discard pile has been burned!</p>
        )}
      </div>
    </div>
  );
};

export default GameTable;
