
import React, { useEffect } from 'react';
import { CardValue } from '@/types/game';
import { 
  GameTableContainer,
  CurrentPlayerDisplay,
  DeckDisplay,
  PileDisplay,
  PickUpPileButton,
  GameStatusInfo
} from './game-table';

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
  // Count special cards in the pile
  const specialCardsCount = pile.filter(card => 
    card.rank === '3' || card.rank === '10' || card.rank === '8'
  ).length;
  
  // Count regular cards that would be picked up
  const regularCardsCount = pile.length - specialCardsCount;
  
  useEffect(() => {
    console.log(`GameTable received deckCount: ${deckCount}`);
  }, [deckCount]);
  
  return (
    <GameTableContainer>
      <CurrentPlayerDisplay currentPlayer={currentPlayer} />
      
      {/* Game area */}
      <div className="flex justify-center mb-6">
        {/* Card counts display */}
        <div className="flex flex-col items-baseline">
          <div className="flex gap-16 mb-2 justify-center">
            <DeckDisplay deckCount={deckCount} />
            <PileDisplay pile={pile} />
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-3">
        <PickUpPileButton 
          isCurrentPlayer={isCurrentPlayer}
          pile={pile}
          mustPickUpPileOrPlayThree={mustPickUpPileOrPlayThree}
          onPickupPile={onPickupPile}
          regularCardsCount={regularCardsCount}
          specialCardsCount={specialCardsCount}
        />
      </div>
      
      <GameStatusInfo 
        pile={pile}
        specialCardsCount={specialCardsCount}
      />
    </GameTableContainer>
  );
};

export default GameTable;
