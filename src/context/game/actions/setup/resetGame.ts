
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Dispatch } from 'react';
import { GameAction, GameState } from '@/types/game';

export const resetGame = (dispatch: Dispatch<GameAction>, state: GameState) => {
  try {
    console.log('Resetting game state');
    
    // Clear the game ID and player name from localStorage
    localStorage.removeItem('gameId');
    localStorage.removeItem('playerName');
    
    // Reset the game state in the reducer
    dispatch({ type: 'RESET_GAME' });
  } catch (error) {
    console.error('Error in resetGame:', error);
    toast.error('Error resetting game state');
  }
};
