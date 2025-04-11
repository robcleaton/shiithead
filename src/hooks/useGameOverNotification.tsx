
import { useEffect } from 'react';
import { GameState } from '@/types/game';
import { toast } from 'sonner';

export const useGameOverNotification = (gameState: GameState) => {
  // Add notification for game over state change
  useEffect(() => {
    if (gameState.gameOver) {
      const winner = gameState.players.find(
        p => p.hand.length === 0 && p.faceUpCards.length === 0 && p.faceDownCards.length === 0
      );
      
      const currentPlayer = gameState.players.find(p => p.id === gameState.playerId);
      
      if (winner && currentPlayer) {
        if (winner.id === currentPlayer.id) {
          toast.success("Congratulations! You won the game! 🎉");
        } else {
          toast.error(`Game Over! ${winner.name} has won the game.`);
        }
      }
    }
  }, [gameState.gameOver, gameState.players, gameState.playerId]);
};
