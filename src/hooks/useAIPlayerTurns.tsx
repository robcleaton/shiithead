
import { useEffect } from 'react';
import { isAIPlayer } from '@/context/game/actions/gamePlay/aiPlayerActions';
import { GameState } from '@/types/game';

export const useAIPlayerTurns = (
  state: GameState,
  triggerAITurn: () => void
) => {
  // Set up a watcher for AI player turns
  useEffect(() => {
    if (state.gameStarted && 
        !state.setupPhase && 
        !state.gameOver && 
        state.currentPlayerId && 
        isAIPlayer(state.currentPlayerId)) {
      
      console.log(`AI player turn detected: ${state.currentPlayerId}`);
      
      // Use a short timeout to ensure the UI updates first
      const timeoutId = setTimeout(() => {
        triggerAITurn();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    state.currentPlayerId,
    state.gameStarted,
    state.setupPhase,
    state.gameOver,
    triggerAITurn
  ]);
};
