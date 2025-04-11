
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameState } from '@/types/game';

export const useGameNavigation = (gameState: GameState) => {
  const navigate = useNavigate();

  // Handle navigation when game state changes (especially player removal)
  useEffect(() => {
    // If player was in a game but now the game state is reset, navigate to home
    if (!gameState.gameId && localStorage.getItem('playerId')) {
      console.log('Game state reset detected, navigating to home');
      navigate('/');
    }
  }, [gameState.gameId, navigate]);
};
