
import React from 'react';
import { CardValue } from '@/types/game';

interface GameStatusInfoProps {
  pile: CardValue[];
  specialCardsCount: number;
}

const GameStatusInfo: React.FC<GameStatusInfoProps> = ({ pile, specialCardsCount }) => {
  if (pile.length === 0) {
    return null;
  }

  const topCard = pile[pile.length - 1];
  const isThreeOnTop = topCard?.rank === '3';
  const isTenOnTop = topCard?.rank === '10';
  const isEightOnTop = topCard?.rank === '8';

  return (
    <div className="text-center mt-4 text-xs text-karma-foreground/70">
      {isThreeOnTop && (
        <p className="font-medium text-orange-600 mb-1">Three has been played! You must pick up the pile or play another 3.</p>
      )}
      {isTenOnTop && (
        <p className="font-medium text-orange-500 mb-1">10 has been played! The entire discard pile has been burned!</p>
      )}
      {isEightOnTop && (
        <p className="font-medium text-blue-500 mb-1">8 has been played! This card is transparent - play on the card below it.</p>
      )}
      {pile.length > 0 && specialCardsCount > 0 && (
        <p className="font-medium text-gray-500 mt-2">Note: Special cards (3s, 8s, 10s) will be discarded when picking up the pile.</p>
      )}
    </div>
  );
};

export default GameStatusInfo;
