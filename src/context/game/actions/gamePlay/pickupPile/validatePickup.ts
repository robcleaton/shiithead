
import { toast } from 'sonner';
import { GameState } from '@/types/game';

export const validatePickup = (
  currentPlayerId: string, 
  playerId: string,
  pile: any[]
): { valid: boolean; errorMessage?: string } => {
  if (currentPlayerId !== playerId) {
    toast.error("It's not your turn!");
    return { valid: false };
  }
  
  if (pile.length === 0) {
    toast.error("There are no cards to pick up!");
    return { valid: false };
  }
  
  return { valid: true };
};
