
import React from 'react';
import { Button } from '@/components/ui/button';
import { HandMetal } from 'lucide-react';

interface PickUpPileButtonProps {
  isCurrentPlayer: boolean;
  pile: any[];
  mustPickUpPileOrPlayThree: boolean;
  onPickupPile: () => void;
  regularCardsCount: number;
  specialCardsCount: number;
}

const PickUpPileButton: React.FC<PickUpPileButtonProps> = ({ 
  isCurrentPlayer,
  pile,
  mustPickUpPileOrPlayThree,
  onPickupPile,
  regularCardsCount,
  specialCardsCount
}) => {
  if (!isCurrentPlayer || pile.length === 0) {
    return null;
  }

  return (
    <Button
      variant={mustPickUpPileOrPlayThree ? "destructive" : "secondary"}
      size="sm"
      onClick={onPickupPile}
      title={regularCardsCount > 0 ? `Pick up ${regularCardsCount} regular cards (special cards will be discarded)` : "No regular cards to pick up"}
    >
      <HandMetal className="mr-2 h-4 w-4" />
      Pick Up Pile
      {regularCardsCount > 0 && specialCardsCount > 0 && (
        <span className="ml-1 text-xs">({regularCardsCount})</span>
      )}
    </Button>
  );
};

export default PickUpPileButton;
