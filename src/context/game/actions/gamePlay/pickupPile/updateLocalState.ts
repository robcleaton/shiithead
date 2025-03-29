
import { Dispatch } from 'react';
import { GameAction, Player } from '@/types/game';
import { verifyGameCards, copyCard } from '@/utils/gameUtils';

export const updateLocalState = (
  dispatch: Dispatch<GameAction>,
  players: Player[],
  currentPlayerId: string,
  finalHand: any[],
  nextPlayerId: string
): void => {
  // Create a deep copy of all players to avoid reference issues
  const updatedPlayers = players.map(player => {
    if (player.id === currentPlayerId) {
      // For the current player, create a completely new player object
      return {
        ...player,
        hand: finalHand.map(card => copyCard(card)) // Deep copy to avoid reference issues
      };
    } else {
      // For other players, create a new object but don't modify their cards
      return { ...player };
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
  
  // First dispatch the updated players
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
