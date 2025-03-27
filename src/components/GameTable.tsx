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
      
      <div className="flex justify-center gap-16 items-center min-h-24">
        <div className="relative">
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-karma-secondary/70 text-karma-foreground px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
            {deckCount} card{deckCount !== 1 ? 's' : ''} left
          </div>
          
          {deckCount > 0 && (
            <div className="relative">
              {Array.from({ length: Math.min(5, Math.max(1, Math.ceil(deckCount / 5))) }).map((_, index) => (
                <div 
                  key={`deck-card-${index}`}
                  className="absolute w-16 h-20 bg-karma-card-back bg-card-texture rounded-lg border border-gray-800/20 shadow-md"
                  style={{ 
                    top: `${-index * 0.5}px`, 
                    left: `${-index * 0.5}px`, 
                    transform: `rotate(${(index - 2) * 0.5}deg)`,
                    zIndex: 5 - index
                  }}
                />
              ))}
              
              {isCurrentPlayer && (
                <Button 
                  onClick={onDrawCard}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-karma-primary/80 hover:bg-karma-primary z-10"
                  size="sm"
                >
                  <ArrowRight className="w-4 h-4 mr-1" />
                  Draw
                </Button>
              )}
            </div>
          )}
          
          {deckCount === 0 && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-20 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-gray-400 text-xs">Empty</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="mb-2 text-xs text-karma-foreground/70">
              {sameRankCount > 1 && <span className="font-medium">({sameRankCount})</span>}
              {isTenOnTop && (
                <span className="ml-1 font-medium text-orange-500 flex items-center">
                  <Flame className="h-3 w-3 mr-1" /> Burned
                </span>
              )}
            </div>
            
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-karma-secondary/70 text-karma-foreground px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
              {pile.length} card{pile.length !== 1 ? 's' : ''} discarded
            </div>
            
            {topCard ? (
              <div className="relative">
                {sameRankCount > 1 && (
                  Array.from({ length: Math.min(3, sameRankCount - 1) }).map((_, index) => (
                    <div 
                      key={`pile-card-${index}`}
                      className="absolute w-16 h-20 bg-white rounded-lg border border-gray-200 shadow-md flex items-center justify-center"
                      style={{ 
                        top: `${-3 - index * 2}px`, 
                        left: `${-3 - index * 2}px`, 
                        transform: `rotate(${(index - 1) * -3}deg)`,
                        zIndex: 3 - index
                      }}
                    >
                      <div className={`text-2xl ${topCard.suit === 'hearts' || topCard.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                        {topCard.rank}
                        <span className="text-lg">
                          {topCard.suit === 'hearts' ? '♥' : 
                          topCard.suit === 'diamonds' ? '♦' : 
                          topCard.suit === 'clubs' ? '♣' : '♠'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                
                <div className={`w-16 h-20 bg-white rounded-lg border border-gray-200 shadow-md flex items-center justify-center ${isTenOnTop ? 'ring-2 ring-orange-500' : ''}`}>
                  <div className={`text-2xl ${topCard.suit === 'hearts' || topCard.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                    {topCard.rank}
                    <span className="text-lg">
                      {topCard.suit === 'hearts' ? '♥' : 
                      topCard.suit === 'diamonds' ? '♦' : 
                      topCard.suit === 'clubs' ? '♣' : '♠'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-16 h-20 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-gray-400 text-xs">Empty</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-6 gap-3">
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
          <p className="font-medium text-orange-600 mb-1">Three has been played! {isCurrentPlayer ? "You must" : "Current player must"} pick up the pile or play another 3. Any 3s will be removed from the pile when picked up.</p>
        )}
        {isTenOnTop && (
          <p className="font-medium text-orange-500 mb-1">10 has been played! The entire discard pile has been completely burned and removed from the game!</p>
        )}
        <p>Remember: 2, 3, 7, 8, 10 can be played on any card. 7s force the next player to play a card of rank 7 or lower! 10s completely clear the discard pile and give you another turn.</p>
        <p className="font-medium text-blue-500 mt-1">Four of a kind: If 4 cards of the same rank are in the pile (including your play), the pile will be burned and you get another turn!</p>
      </div>
    </div>
  );
};

export default GameTable;
