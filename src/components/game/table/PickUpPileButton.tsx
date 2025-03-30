
import React from 'react';
import { Button } from '@/components/ui/button';
import { HandMetal } from 'lucide-react';

interface PickUpPileButtonProps {
  isCurrentPlayer: boolean;
  pileHasCards: boolean;
  mustPickUpPileOrPlayThree: boolean;
  onPickupPile: () => void;
  isLoading: boolean;
}

const PickUpPileButton: React.FC<PickUpPileButtonProps> = ({ 
  isCurrentPlayer, 
  pileHasCards, 
  mustPickUpPileOrPlayThree,
  onPickupPile,
  isLoading
}) => {
  if (!isCurrentPlayer || !pileHasCards) {
    return null;
  }
  
  return (
    <div className="flex justify-center gap-3">
      <Button
        variant={mustPickUpPileOrPlayThree ? "destructive" : "secondary"}
        size="sm"
        onClick={onPickupPile}
        disabled={isLoading}
      >
        <HandMetal className="mr-2 h-4 w-4" />
        {isLoading ? "Picking up..." : "Pick Up Pile"}
      </Button>
    </div>
  );
};

export default PickUpPileButton;
