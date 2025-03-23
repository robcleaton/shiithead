
import { createContext, ReactNode } from 'react';
import useGameContext from '@/hooks/useGameContext';
import { GameState, Player, CardValue } from '@/types/game';

type GameContextType = ReturnType<typeof useGameContext>;

export const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const gameContext = useGameContext();
  
  return (
    <GameContext.Provider value={gameContext}>
      {children}
    </GameContext.Provider>
  );
};
