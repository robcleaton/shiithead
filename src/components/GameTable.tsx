
import React, { useEffect } from 'react';
import { CardValue } from '@/context/GameContext';
import CurrentPlayerBadge from './game/table/CurrentPlayerBadge';
import DeckDisplay from './game/table/DeckDisplay';
import PileDisplay from './game/table/PileDisplay';
import GameStatusMessages from './game/table/GameStatusMessages';
import PickUpPileButton from './game/table/PickUpPileButton';

interface GameTableProps {
  pile: CardValue[];
  deckCount: number;
  onDrawCard: () => void;
  onPickupPile: () => void;
  currentPlayer: string;
  isCurrentPlayer: boolean;
  mustPickUpPileOrPlayThree: boolean;
  isLoading?: boolean;
}

const GameTable: React.FC<GameTableProps> = ({
  pile,
  deckCount,
  onDrawCard,
  onPickupPile,
  currentPlayer,
  isCurrentPlayer,
  mustPickUpPileOrPlayThree,
  isLoading = false
}) => {
  const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
  const isThreeOnTop = topCard?.rank === '3';
  const isTenOnTop = topCard?.rank === '10';
  const isEightOnTop = topCard?.rank === '8';

  useEffect(() => {
    console.log(`GameTable received deckCount: ${deckCount}`);
  }, [deckCount]);

  return (
    <div className="w-full max-w-2xl p-6 bg-shithead-muted/30 rounded-xl border relative">
      <CurrentPlayerBadge currentPlayer={currentPlayer} />

      {/* Game area */}
      <div className="flex justify-center mb-6">
        {/* Deck count on left */}
        <div className="flex flex-row items-center justify-between w-full">
          <DeckDisplay deckCount={deckCount} />
          
          {/* Pile display centered */}
          <div className="flex-1 flex justify-center">
            <PileDisplay pile={pile} />
          </div>
          
          {/* Empty div to balance layout */}
          <div className="invisible">
            <DeckDisplay deckCount={deckCount} />
          </div>
        </div>
      </div>

      <PickUpPileButton
        isCurrentPlayer={isCurrentPlayer}
        pileHasCards={pile.length > 0}
        mustPickUpPileOrPlayThree={mustPickUpPileOrPlayThree}
        onPickupPile={onPickupPile}
        isLoading={isLoading}
      />

      <GameStatusMessages
        isThreeOnTop={isThreeOnTop}
        isTenOnTop={isTenOnTop}
        isEightOnTop={isEightOnTop}
        isCurrentPlayer={isCurrentPlayer}
      />
    </div>
  );
};

export default GameTable;
