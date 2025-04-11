
import { createContext, ReactNode } from 'react';
import useGameContext from '@/hooks/useGameContext';
import { GameState } from '@/types/game';
import { useAIPlayerTurns } from '@/hooks/useAIPlayerTurns';
import { useGameNavigation } from '@/hooks/useGameNavigation';
import { usePlayerStateMonitor } from '@/hooks/usePlayerStateMonitor';
import { usePlayerRemovalCheck } from '@/hooks/usePlayerRemovalCheck';
import { useStuckGameDetector } from '@/hooks/useStuckGameDetector';
import { useGameOverNotification } from '@/hooks/useGameOverNotification';

type GameContextType = ReturnType<typeof useGameContext>;

export const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const gameContext = useGameContext();
  const { state, triggerAITurn, resetGame } = gameContext;
  
  // Set up AI player turn handling
  useAIPlayerTurns(state, triggerAITurn);
  
  // Set up navigation based on game state
  useGameNavigation(state);
  
  // Set up player state monitoring
  const { lastPlayerChangeRef } = usePlayerStateMonitor(state, resetGame);
  
  // Set up periodic player removal check
  usePlayerRemovalCheck(state.gameId, state.gameStarted, resetGame);
  
  // Set up stuck game detection
  useStuckGameDetector(state, lastPlayerChangeRef);
  
  // Set up game over notification
  useGameOverNotification(state);
  
  return (
    <GameContext.Provider value={gameContext}>
      {children}
    </GameContext.Provider>
  );
};
