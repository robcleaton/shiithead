
import { Dispatch } from 'react';
import { toast } from 'sonner';
import { GameState, GameAction } from '@/types/game';
import { copyCards } from '@/utils/gameUtils';
import { validatePickup } from './validatePickup';
import { preparePickup } from './preparePickup';
import { updateDatabase } from './updateDatabase';
import { updateLocalState } from './updateLocalState';
import { generatePickupMessage } from './generateMessage';

export const pickupPile = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
  try {
    // Validate the pickup action
    const validation = validatePickup(state.currentPlayerId, state.playerId, state.pile);
    if (!validation.valid) {
      return;
    }
    
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
    
    // Prepare the cards to be picked up
    const { finalHand, uniqueCardsToAdd, pileToPickup } = preparePickup(existingHand, state.pile);
    
    // Calculate the next player turn
    const nextPlayerIndex = (playerIndex + 1) % state.players.length;
    const nextPlayerId = state.players[nextPlayerIndex].id;
    
    // CRITICAL: First update the database
    await updateDatabase(currentPlayer.id, state.gameId || '', finalHand, nextPlayerId);
    
    // Update the local state
    updateLocalState(dispatch, state.players, currentPlayer.id, finalHand, nextPlayerId);
    
    // Create detailed message about the pickup
    const specialCardsCount = state.pile.length - pileToPickup.length;
    const message = generatePickupMessage(currentPlayer.name, uniqueCardsToAdd.length, specialCardsCount);
    
    toast.info(message);
    dispatch({ type: 'SET_LOADING', isLoading: false });
    
  } catch (error) {
    console.error('Error picking up pile:', error);
    toast.error('Failed to pick up pile');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
