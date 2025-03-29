
import { Dispatch } from 'react';
import { GameAction, Player } from '@/types/game';
import { verifyGameCards } from '@/utils/gameUtils';

export const updateLocalState = (
  dispatch: Dispatch<GameAction>,
  players: Player[],
  currentPlayerId: string,
  finalHand: any[],
  nextPlayerId: string
): void => {
  // Create completely new player objects with new references to avoid state mutation issues
  const updatedPlayers = players.map(player => {
    if (player.id === currentPlayerId) {
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
    const isValid = verifyGameCards([], [], allPlayerHands);
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
};
