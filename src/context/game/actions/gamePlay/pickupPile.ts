
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { getUniqueCards, cardToString, copyCards, copyCard, verifyGameCards } from '@/utils/gameUtils';

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
    
    // Get a completely fresh copy of the current player
    const playerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    if (playerIndex === -1) {
      console.error('Current player not found');
      toast.error("Error: Current player not found");
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    const currentPlayer = state.players[playerIndex];
    console.log(`Player ${currentPlayer.name} is picking up pile with ${state.pile.length} cards`);
    
    // Make a deep copy of the player's current hand using our utility
    const existingHand = copyCards(currentPlayer.hand);
    console.log(`Existing hand has ${existingHand.length} cards`);
    
    // Make a deep copy of the pile, excluding special cards (3, 10, 8)
    const pileToPickup = state.pile
      .filter(card => card.rank !== '3' && card.rank !== '10' && card.rank !== '8')
      .map(copyCard);
    
    console.log(`Pile to pickup: ${pileToPickup.length} cards after filtering special cards`);
    
    // Track all existing card IDs to avoid duplicates
    const existingCardIds = new Set(existingHand.map(cardToString));
    
    // Filter cards in the pile that are already in the player's hand
    const uniqueCardsToAdd = pileToPickup.filter(card => {
      const cardId = cardToString(card);
      if (existingCardIds.has(cardId)) {
        console.warn(`Prevented duplicate card from being added: ${cardId}`);
        return false;
      }
      existingCardIds.add(cardId);
      return true;
    });
    
    console.log(`Unique cards to add: ${uniqueCardsToAdd.length} cards`);
    
    // Create a complete new hand with deep copies of all cards
    const newHand = [...existingHand, ...uniqueCardsToAdd];
    
    // Double-check for any duplicates that might have slipped through
    const finalHand = getUniqueCards(newHand);
    
    console.log(`Final hand will have ${finalHand.length} cards`);
    
    // Calculate the next player turn
    const nextPlayerIndex = (playerIndex + 1) % state.players.length;
    const nextPlayerId = state.players[nextPlayerIndex].id;
    
    // CRITICAL: First update the database
    // 1. Update the player's hand in the database
    const { error: playerError } = await supabase
      .from('players')
      .update({ hand: finalHand })
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
    
    // IMPORTANT: Now we need to handle the local state update carefully to prevent
    // any React state reference issues that could cause cards to be duplicated
    
    // Create completely new player objects with new references to avoid state mutation issues
    const updatedPlayers = state.players.map(player => {
      if (player.id === currentPlayer.id) {
        // For the current player, make a completely new player object with a new hand array
        return {
          ...player,
          hand: [...finalHand] // Create a new array to ensure React detects the change
        };
      } else {
        // For other players, create completely new player objects with their existing data
        // This is crucial to ensure React properly detects state changes and doesn't mix up references
        return {
          ...player,
          hand: player.hand.map(card => ({ ...card })), // Deep copy each card
          faceUpCards: player.faceUpCards.map(card => ({ ...card })), // Deep copy each card
          faceDownCards: player.faceDownCards.map(card => ({ ...card })) // Deep copy each card
        };
      }
    });
    
    // Verify game state integrity in development
    if (process.env.NODE_ENV !== 'production') {
      const allPlayerHands = updatedPlayers.map(p => p.hand);
      const isValid = verifyGameCards(state.deck, [], allPlayerHands);
      if (!isValid) {
        console.error('Game state integrity check failed after pickup pile!');
      } else {
        console.log('Game state integrity verified after pickup pile');
      }
    }
    
    // First dispatch the updated players - this should be done before updating the pile
    // to ensure the state updates are properly sequenced
    dispatch({ type: 'SET_PLAYERS', players: updatedPlayers });
    
    // Then clear the pile in local state and update current player
    dispatch({
      type: 'SET_GAME_STATE',
      gameState: {
        pile: [],
        currentPlayerId: nextPlayerId
      }
    });
    
    // Create detailed message about the pickup
    let message = `${currentPlayer.name} picked up ${uniqueCardsToAdd.length} card${uniqueCardsToAdd.length !== 1 ? 's' : ''}`;
    const specialCardsCount = state.pile.length - pileToPickup.length;
    
    if (specialCardsCount > 0) {
      message += `. ${specialCardsCount} special card${specialCardsCount !== 1 ? 's were' : ' was'} removed from the game.`;
    }
    
    toast.info(message);
    dispatch({ type: 'SET_LOADING', isLoading: false });
    
  } catch (error) {
    console.error('Error picking up pile:', error);
    toast.error('Failed to pick up pile');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
