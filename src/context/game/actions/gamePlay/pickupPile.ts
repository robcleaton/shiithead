
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
    // Set loading state immediately to prevent multiple clicks
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const player = state.players.find(p => p.id === state.playerId);
    if (!player) {
      toast.error("Player not found!");
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    // Check if there are any 3s in the pile
    const threesInPile = state.pile.filter(card => card.rank === '3');
    
    // Filter out any cards with rank 3 from the pile
    const pileWithoutThrees = state.pile.filter(card => card.rank !== '3');
    
    // Add remaining cards to the player's hand
    const updatedHand = [...player.hand, ...pileWithoutThrees];
    
    // Update local state first for immediate feedback
    const updatedPlayers = [...state.players];
    const playerIndex = updatedPlayers.findIndex(p => p.id === state.playerId);
    if (playerIndex !== -1) {
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        hand: updatedHand
      };
      dispatch({ type: 'SET_PLAYERS', players: updatedPlayers });
    }
    
    // Also update the pile in local state immediately
    dispatch({
      type: 'SET_GAME_STATE',
      gameState: { pile: [] }
    });
    
    // Now update the database
    const { error: playerError } = await supabase
      .from('players')
      .update({ hand: updatedHand })
      .eq('id', player.id)
      .eq('game_id', state.gameId);
      
    if (playerError) throw playerError;
    
    const nextPlayerIndex = (playerIndex + 1) % state.players.length;
    const nextPlayerId = state.players[nextPlayerIndex].id;
    
    const { error: gameError } = await supabase
      .from('games')
      .update({ 
        pile: [],
        current_player_id: nextPlayerId
      })
      .eq('id', state.gameId);
      
    if (gameError) throw gameError;
    
    // Create a more detailed message about the pickup
    let message = `${player.name} picked up the pile (${pileWithoutThrees.length} cards)`;
    
    if (threesInPile.length > 0) {
      message += `. ${threesInPile.length} three${threesInPile.length > 1 ? 's were' : ' was'} removed from the game.`;
    }
    
    toast.info(message);
  } catch (error) {
    console.error('Error picking up pile:', error);
    toast.error('Failed to pick up pile');
  } finally {
    // Always ensure loading state is reset
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
