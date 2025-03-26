
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';

export const pickupPile = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
  if (state.currentPlayerId !== state.playerId) {
    toast.error("It's not your turn!");
    return;
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const player = state.players.find(p => p.id === state.playerId);
    if (!player) return;
    
    // Check if the pile only contains 3s
    if (state.pile.length > 0 && state.pile.every(card => card.rank === '3')) {
      const hasThree = player.hand.some(card => card.rank === '3');
      
      if (!hasThree) {
        // Player doesn't have any 3s, so skip their turn and reset the pile
        const playerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
        const nextIndex = (playerIndex + 1) % state.players.length;
        const nextPlayerId = state.players[nextIndex].id;
        
        const { error: gameError } = await supabase
          .from('games')
          .update({ 
            pile: [],
            current_player_id: nextPlayerId
          })
          .eq('id', state.gameId);
          
        if (gameError) throw gameError;
        
        toast.info(`${player.name} couldn't play a 3, so the pile has been reset and their turn is skipped.`);
        dispatch({ type: 'SET_LOADING', isLoading: false });
        return;
      }
    }
    
    const updatedHand = [...player.hand, ...state.pile];
    
    const { error: playerError } = await supabase
      .from('players')
      .update({ hand: updatedHand })
      .eq('id', player.id)
      .eq('game_id', state.gameId);
      
    if (playerError) throw playerError;
    
    const playerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    const nextIndex = (playerIndex + 1) % state.players.length;
    const nextPlayerId = state.players[nextIndex].id;
    
    const { error: gameError } = await supabase
      .from('games')
      .update({ 
        pile: [],
        current_player_id: nextPlayerId
      })
      .eq('id', state.gameId);
      
    if (gameError) throw gameError;
    
    toast.info(`${player.name} picked up the pile (${state.pile.length} cards).`);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error picking up pile:', error);
    toast.error('Failed to pick up pile');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
