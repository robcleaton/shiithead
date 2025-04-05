
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
        {/* Card counts display */}
        <div className="flex flex-col items-baseline">
          <div className="flex gap-16 mb-2 justify-center">
            <DeckDisplay deckCount={deckCount} />
            <PileDisplay pile={pile} />
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
