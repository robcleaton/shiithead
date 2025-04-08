
import { useContext } from 'react';
import { GameContext } from '@/context/game/GameContext';
import { NavigateFunction } from 'react-router-dom';

export interface GameContextType {
  state: any;
  createGame: (playerName: string) => void;
  joinGame: (gameId: string, playerName: string, playerId?: string, navigate?: NavigateFunction) => void;
  startGame: () => void;
  selectFaceUpCard: (cardIndex: number | number[]) => void;
  selectMultipleFaceUpCards: (cardIndices: number[]) => void;
  completeSetup: () => void;
  playCard: (cardIndex: number | number[]) => void;
  drawCard: () => void;
  pickupPile: () => void;
  resetGame: () => void;
  addTestPlayer: (playerName: string) => void;
  invitePlayer: (email: string) => void;
  removePlayer: (playerId: string) => void;
  triggerAITurn: () => void;
  refreshGameState: () => void;
}

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export default useGame;
