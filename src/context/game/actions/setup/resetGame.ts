
import { Dispatch } from 'react';
import { GameAction, GameState } from '@/types/game';
import { toast } from 'sonner';

export const resetGame = (dispatch: Dispatch<GameAction>, state: GameState) => {
  console.log('Resetting game state and navigating to home');
  
  // Save playerId for future games
  const playerId = state.playerId;
  
  dispatch({ type: 'RESET_GAME' });
  
  toast.info('Game reset. You can start a new game.');
};
