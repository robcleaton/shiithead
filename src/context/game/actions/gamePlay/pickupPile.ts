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
    
    // Count special cards that should be removed from the game (3, 10, 8)
    const specialCardsCount = state.pile.filter(card => 
      card.rank === '3' || card.rank === '10' || card.rank === '8'
    ).length;
    
    // Get all regular cards that should be added to the player's hand
    const regularCards = state.pile.filter(card => 
      card.rank !== '3' && card.rank !== '10' && card.rank !== '8'
    );
    
    console.log(`Player ${currentPlayer.name} is picking up pile with ${state.pile.length} cards`);
    console.log(`Regular cards to add: ${regularCards.length}`);
    console.log(`Special cards to ignore: ${specialCardsCount}`);
    
    // Create a completely new hand array with deep copies of all cards
    // This ensures we don't have any reference issues
    const newHand = [
      ...currentPlayer.hand.map(card => ({...card})),
      ...regularCards.map(card => ({...card}))
    ];
    
    console.log(`Updated hand will have ${newHand.length} cards`);
    
    // Calculate the next player turn
    const nextPlayerIndex = (state.players.findIndex(p => p.id === state.currentPlayerId) + 1) % state.players.length;
    const nextPlayerId = state.players[nextPlayerIndex].id;
    
    // CRITICAL: First update the database before local state
    // 1. Update the player's hand in the database
    const { error: playerError } = await supabase
      .from('players')
      .update({ hand: newHand })
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
    
    // 3. Update local state AFTER database updates succeed
    
    // Create a completely new players array to avoid any reference issues
    const updatedPlayers = state.players.map(player => {
      if (player.id === currentPlayer.id) {
        // Only update the current player's hand with the new cards
        return {
          ...player,
          hand: newHand
        };
      }
      // Important: Create a new reference but keep the same data for other players
      return {...player};
    });
    
    // Update the players in the local state
    dispatch({ type: 'SET_PLAYERS', players: updatedPlayers });
    
    // Clear the pile in local state and update current player
    dispatch({
      type: 'SET_GAME_STATE',
      gameState: {
        pile: [],
        currentPlayerId: nextPlayerId
      }
    });
    
    // Create detailed message about the pickup
    let message = `${currentPlayer.name} picked up ${regularCards.length} card${regularCards.length !== 1 ? 's' : ''}`;
    
    if (specialCardsCount > 0) {
      message += `. ${specialCardsCount} special card${specialCardsCount > 1 ? 's were' : ' was'} removed from the game.`;
    }
    
    toast.info(message);
    dispatch({ type: 'SET_LOADING', isLoading: false });
    
  } catch (error) {
    console.error('Error picking up pile:', error);
    toast.error('Failed to pick up pile');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
