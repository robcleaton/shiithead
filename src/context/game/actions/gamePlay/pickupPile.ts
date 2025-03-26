
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
  
  if (state.pile.length === 0) {
    toast.error("There are no cards to pick up!");
    return;
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const player = state.players.find(p => p.id === state.playerId);
    if (!player) return;
    
    // Check if there are any 3s in the pile
    const hasThrees = state.pile.some(card => card.rank === '3');
    
    // Filter out any cards with rank 3 from the pile
    const pileWithoutThrees = state.pile.filter(card => card.rank !== '3');
    
    // Add remaining cards to the player's hand
    const updatedHand = [...player.hand, ...pileWithoutThrees];
    
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
    
    const cardsRemoved = state.pile.length - pileWithoutThrees.length;
    const threeMessage = cardsRemoved > 0 ? ` (${cardsRemoved} three${cardsRemoved > 1 ? 's' : ''} removed from the game)` : '';
    
    toast.info(`${player.name} picked up the pile (${pileWithoutThrees.length} cards).${threeMessage}`);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error picking up pile:', error);
    toast.error('Failed to pick up pile');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
