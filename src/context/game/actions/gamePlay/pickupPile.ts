
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
    
    // Check how many special cards are in the pile that should not be picked up
    const specialCards = {
      threes: state.pile.filter(card => card.rank === '3'),
      tens: state.pile.filter(card => card.rank === '10'),
      eights: state.pile.filter(card => card.rank === '8')
    };
    
    // Filter out special cards from the pile - we don't add these to the player's hand
    const pileWithoutSpecialCards = state.pile.filter(card => 
      card.rank !== '3' && card.rank !== '10' && card.rank !== '8'
    );
    
    // Add remaining cards to the player's hand
    const updatedHand = [...currentPlayer.hand, ...pileWithoutSpecialCards];
    
    // Calculate the next player turn
    const nextPlayerIndex = (state.players.findIndex(p => p.id === state.currentPlayerId) + 1) % state.players.length;
    const nextPlayerId = state.players[nextPlayerIndex].id;
    
    // Important: Update only the database first to avoid any race conditions
    // Update ONLY the current player's hand in the database
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
    
    // Update game state in the database (pile and current player)
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
    
    // After database update is successful, update local state for just this player
    // This prevents premature state updates that could be overwritten by subscription updates
    // Create a new array with only the current player updated
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
    
    // Clear the pile and update next player in local state
    dispatch({
      type: 'SET_GAME_STATE',
      gameState: {
        pile: [],
        currentPlayerId: nextPlayerId
      }
    });
    
    // Create more detailed message about the pickup
    let specialCardsMessage = [];
    
    if (specialCards.threes.length > 0) {
      specialCardsMessage.push(`${specialCards.threes.length} three${specialCards.threes.length > 1 ? 's' : ''}`);
    }
    if (specialCards.tens.length > 0) {
      specialCardsMessage.push(`${specialCards.tens.length} ten${specialCards.tens.length > 1 ? 's' : ''}`);
    }
    if (specialCards.eights.length > 0) {
      specialCardsMessage.push(`${specialCards.eights.length} eight${specialCards.eights.length > 1 ? 's' : ''}`);
    }
    
    let message = `${currentPlayer.name} picked up the pile (${pileWithoutSpecialCards.length} cards)`;
    
    if (specialCardsMessage.length > 0) {
      const lastSpecialCard = specialCardsMessage.pop();
      const specialCardsText = specialCardsMessage.length 
        ? specialCardsMessage.join(', ') + ' and ' + lastSpecialCard 
        : lastSpecialCard;
      
      message += `. ${specialCardsText} ${specialCardsMessage.length > 0 || specialCards.threes.length + specialCards.tens.length + specialCards.eights.length > 1 ? 'were' : 'was'} removed from the game.`;
    }
    
    toast.info(message);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error picking up pile:', error);
    toast.error('Failed to pick up pile');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
