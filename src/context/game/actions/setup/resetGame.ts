
import { Dispatch } from 'react';
import { GameState, GameAction } from '@/types/game';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { clearGameSession } from '@/utils/sessionStorage';

export const resetGame = async (dispatch: Dispatch<GameAction>, state: GameState) => {
  if (!state.gameId) {
    toast.error("No active game to reset");
    return;
  }
  
  try {
    console.log('Resetting game:', state.gameId);
    
    // Clear session data
    clearGameSession();
    
    // Reset local state first for immediate feedback
    dispatch({ type: 'RESET_GAME' });
    
    // Only update database if user is host
    if (state.isHost) {
      // Reset game in database
      const { error: gameError } = await supabase
        .from('games')
        .update({
          deck: [],
          pile: [],
          started: false,
          setup_phase: false,
          current_player_id: null,
          ended: false
        })
        .eq('id', state.gameId);
        
      if (gameError) {
        console.error('Error resetting game:', gameError);
        toast.error('Error resetting game');
        return;
      }
      
      // Reset all players in the game
      const { error: playersError } = await supabase
        .from('players')
        .update({
          hand: [],
          face_down_cards: [],
          face_up_cards: [],
          is_ready: false
        })
        .eq('game_id', state.gameId);
        
      if (playersError) {
        console.error('Error resetting players:', playersError);
        toast.error('Error resetting players');
        return;
      }
      
      toast.success('Game has been reset');
    }
  } catch (error) {
    console.error('Error in resetGame:', error);
    toast.error('Failed to reset game');
  }
};
