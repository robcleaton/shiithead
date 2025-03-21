
import React from 'react';
import { CardValue } from '@/context/GameContext';
import { Button } from './ui/button';
import { Layers } from 'lucide-react';

interface GameTableProps {
  pile: CardValue[];
  deckCount: number;
  onDrawCard: () => void;
  currentPlayer: string;
}

const GameTable: React.FC<GameTableProps> = ({ pile, deckCount, onDrawCard, currentPlayer }) => {
  const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
  
  return (
    <div className="w-full max-w-2xl p-6 bg-karma-muted/30 backdrop-blur-sm rounded-xl border border-karma-border shadow-sm relative">
      <div className="flex justify-center items-center mb-4">
        <span className="px-3 py-1 bg-karma-secondary/50 rounded-full text-xs">
          Current Player: <strong>{currentPlayer}</strong>
        </span>
      </div>
      
      <div className="flex justify-center gap-16 items-center min-h-24">
        {/* Deck */}
        <div className="relative">
          <div className="flex flex-col items-center">
            {deckCount > 0 && (
              <div className="w-16 h-20 bg-karma-card-back bg-card-texture rounded-lg border border-gray-800/20 shadow-md mb-2"></div>
            )}
            <div className="text-xs text-karma-foreground/70">{deckCount} cards left</div>
          </div>
          
          {deckCount > 0 && (
            <div className="absolute inset-0 flex items-center justify-center transform -rotate-3 -translate-x-1 -translate-y-2 pointer-events-none z-0">
              <div className="w-16 h-20 bg-karma-card-back bg-card-texture rounded-lg border border-gray-800/20 shadow-md"></div>
            </div>
          )}
        </div>
        
        {/* Pile */}
        <div className="flex flex-col items-center">
          <div className="mb-2 text-xs text-karma-foreground/70">Discard Pile</div>
          {topCard ? (
            <div className="w-16 h-20 bg-white rounded-lg border border-gray-200 shadow-md flex items-center justify-center">
              <div className={`text-2xl ${topCard.suit === 'hearts' || topCard.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                {topCard.rank}
              </div>
            </div>
          ) : (
            <div className="w-16 h-20 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-gray-400 text-xs">Empty</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Draw button moved below cards and centered */}
      <div className="flex justify-center mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onDrawCard}
          disabled={deckCount === 0}
          className="bg-karma-card-back text-white hover:bg-karma-card-back/90"
        >
          <Layers className="mr-2 h-4 w-4" />
          Draw
        </Button>
      </div>
      
      <div className="text-center mt-4 text-xs text-karma-foreground/70">
        <p>Remember: 2, 3, 7, 8, 10 can be played on any card. 7s force the next card to be rank 7 or lower! 10s (except on 7s) burn the pile and give you another turn.</p>
      </div>
    </div>
  );
};

export default GameTable;
