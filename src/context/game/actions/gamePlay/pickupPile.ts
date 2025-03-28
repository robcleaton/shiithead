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
    
    // Find the player who is picking up the pile (current player)
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    if (!currentPlayer) {
      console.error('Current player not found');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    // Check if there are any 3s in the pile
    const threesInPile = state.pile.filter(card => card.rank === '3');
    
    // Filter out any cards with rank 3 from the pile - we don't add these to the player's hand
    const pileWithoutThrees = state.pile.filter(card => card.rank !== '3');
    
    // Add remaining cards to the player's hand
    const updatedHand = [...currentPlayer.hand, ...pileWithoutThrees];
    
    // Create a new array of players to avoid mutation
    const updatedPlayers = state.players.map(player => {
      // Only update the hand of the current player
      if (player.id === currentPlayer.id) {
        return {
          ...player,
          hand: updatedHand
        };
      }
      // Return all other players unchanged
      return player;
    });
    
    // Update the players in the local state
    dispatch({ type: 'SET_PLAYERS', players: updatedPlayers });
    
    // Update the pile and next player in the local state
    const nextPlayerIndex = (state.players.findIndex(p => p.id === state.currentPlayerId) + 1) % state.players.length;
    const nextPlayerId = state.players[nextPlayerIndex].id;
    
    // Clear the pile in local state
    dispatch({
      type: 'SET_GAME_STATE',
      gameState: {
        pile: [],
        currentPlayerId: nextPlayerId
      }
    });
    
    // Now update the database - important to do this AFTER updating local state
    const { error: playerError } = await supabase
      .from('players')
      .update({ hand: updatedHand })
      .eq('id', currentPlayer.id)
      .eq('game_id', state.gameId);
      
    if (playerError) {
      console.error('Error updating player hand:', playerError);
      toast.error('Failed to pick up pile');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    const { error: gameError } = await supabase
      .from('games')
      .update({ 
        pile: [],
        current_player_id: nextPlayerId
      })
      .eq('id', state.gameId);
      
    if (gameError) {
      console.error('Error updating game state:', gameError);
      toast.error('Failed to pick up pile');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    // Create a more detailed message about the pickup
    let message = `${currentPlayer.name} picked up the pile (${pileWithoutThrees.length} cards)`;
    
    if (threesInPile.length > 0) {
      message += `. ${threesInPile.length} three${threesInPile.length > 1 ? 's were' : ' was'} removed from the game.`;
    }
    
    toast.info(message);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error picking up pile:', error);
    toast.error('Failed to pick up pile');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
