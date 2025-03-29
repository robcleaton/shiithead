
import { Dispatch } from 'react';
import { GameAction, GameState, Player, CardValue } from '@/types/game';

// Function to update the local game state
export const updateLocalState = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  player: Player,
  updatedHand: CardValue[],
  updatedFaceUpCards: CardValue[] | null,
  updatedFaceDownCards: CardValue[] | null,
  updatedPile: CardValue[],
  updatedDeck: CardValue[],
  nextPlayerId: string
): Promise<void> => {
  // First update the local state immediately to reflect changes before database updates
  // Update player's cards in the local state
  const updatedPlayers = [...state.players];
  const playerIndex = updatedPlayers.findIndex(p => p.id === player.id);
  if (playerIndex !== -1) {
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      hand: updatedHand,
      faceUpCards: updatedFaceUpCards !== null ? updatedFaceUpCards : player.faceUpCards,
      faceDownCards: updatedFaceDownCards !== null ? updatedFaceDownCards : player.faceDownCards
    };
    
    dispatch({ type: 'SET_PLAYERS', players: updatedPlayers });
  }
  
  // Update game state in local state
  dispatch({
    type: 'SET_GAME_STATE',
    gameState: {
      pile: updatedPile,
      deck: updatedDeck,
      currentPlayerId: nextPlayerId
    }
  });
};
