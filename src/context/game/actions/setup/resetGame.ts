
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';

export const resetGame = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
  try {
    if (!state.gameId) return;
    
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const { error: gameError } = await supabase
      .from('games')
      .update({ 
        started: false,
        ended: false,
        setup_phase: false,
        deck: [],
        pile: [],
        current_player_id: null
      })
      .eq('id', state.gameId);
      
    if (gameError) throw gameError;
    
    for (const player of state.players) {
      const { error: playerError } = await supabase
        .from('players')
        .update({ 
          hand: [],
          face_down_cards: [],
          face_up_cards: [],
          is_ready: false
        })
        .eq('id', player.id)
        .eq('game_id', state.gameId);
        
      if (playerError) throw playerError;
    }
    
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_LOADING', isLoading: false });
    toast.success('Game has been reset');
  } catch (error) {
    console.error('Error resetting game:', error);
    toast.error('Failed to reset game');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
