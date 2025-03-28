
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
    
    // Find the current player (the one who's picking up the pile)
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    if (!currentPlayer) {
      console.error('Current player not found');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    // Identify special cards that should be removed from the game (3, 10, 8)
    const specialCards = state.pile.filter(card => 
      card.rank === '3' || card.rank === '10' || card.rank === '8'
    );
    
    // Find all regular cards that should be added to the player's hand
    const cardsToAdd = state.pile.filter(card => 
      card.rank !== '3' && card.rank !== '10' && card.rank !== '8'
    );
    
    // Create deep copies to avoid reference issues
    const updatedHand = JSON.parse(JSON.stringify([...currentPlayer.hand, ...cardsToAdd]));
    
    // Calculate the next player turn
    const nextPlayerIndex = (state.players.findIndex(p => p.id === state.currentPlayerId) + 1) % state.players.length;
    const nextPlayerId = state.players[nextPlayerIndex].id;
    
    console.log(`Player ${currentPlayer.name} is picking up pile with ${state.pile.length} cards`);
    console.log(`Regular cards to add: ${cardsToAdd.length}`);
    console.log(`Special cards to remove: ${specialCards.length}`);
    console.log(`Updated hand size will be: ${updatedHand.length}`);
    
    // CRITICAL FIX: First update the database before modifying local state
    // 1. Update the player's hand
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
    
    // 2. Clear the pile and update next player in database
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
    
    // 3. ONLY after database is updated, update local state to match
    // Updated players array with current player's new hand
    const updatedPlayers = state.players.map(player => {
      if (player.id === currentPlayer.id) {
        return {
          ...player,
          hand: updatedHand
        };
      }
      return player; // Return all other players unchanged
    });
    
    // Update the players in the local state
    dispatch({ type: 'SET_PLAYERS', players: updatedPlayers });
    
    // Clear the pile in local state
    dispatch({
      type: 'SET_GAME_STATE',
      gameState: {
        pile: [],
        currentPlayerId: nextPlayerId
      }
    });
    
    // Create more detailed message about the pickup
    let message = `${currentPlayer.name} picked up ${cardsToAdd.length} card${cardsToAdd.length !== 1 ? 's' : ''}`;
    
    if (specialCards.length > 0) {
      message += `. ${specialCards.length} special card${specialCards.length > 1 ? 's were' : ' was'} removed from the game.`;
    }
    
    toast.info(message);
    dispatch({ type: 'SET_LOADING', isLoading: false });
    
  } catch (error) {
    console.error('Error picking up pile:', error);
    toast.error('Failed to pick up pile');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
