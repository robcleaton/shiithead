
import { createContext, ReactNode, useEffect } from 'react';
import useGameContext from '@/hooks/useGameContext';
import { GameState, Player, CardValue } from '@/types/game';
import { isAIPlayer } from './actions/gamePlay/aiPlayerActions';
import { toast } from 'sonner';

type GameContextType = ReturnType<typeof useGameContext>;

export const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const gameContext = useGameContext();
  
  // Set up a watcher for AI player turns
  useEffect(() => {
    const { state, triggerAITurn } = gameContext;
    
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
    gameContext.state.currentPlayerId,
    gameContext.state.gameStarted,
    gameContext.state.setupPhase,
    gameContext.state.gameOver
  ]);

  // Add debug logging for player state changes
  useEffect(() => {
    console.log('Current players in GameProvider:', gameContext.state.players);
  }, [gameContext.state.players]);
  
  // Add notification for game over state change
  useEffect(() => {
    if (gameContext.state.gameOver) {
      const winner = gameContext.state.players.find(
        p => p.hand.length === 0 && p.faceUpCards.length === 0 && p.faceDownCards.length === 0
      );
      
      const currentPlayer = gameContext.state.players.find(p => p.id === gameContext.state.playerId);
      
      if (winner && currentPlayer) {
        if (winner.id === currentPlayer.id) {
          toast.success("Congratulations! You won the game! 🎉");
        } else {
          toast.error(`Game Over! ${winner.name} has won the game.`);
        }
      }
    }
  }, [gameContext.state.gameOver, gameContext.state.players, gameContext.state.playerId]);
  
  return (
    <GameContext.Provider value={gameContext}>
      {children}
    </GameContext.Provider>
  );
};
