
import { useEffect, useRef } from 'react';
import { GameState } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const usePlayerStateMonitor = (
  gameState: GameState,
  resetGame: () => void
) => {
  const navigate = useNavigate();
  const lastPlayerChangeRef = useRef<number>(Date.now());

  // Add debug logging for player state changes
  useEffect(() => {
    console.log('Current players in GameProvider:', gameState.players);
    // Update the last player change timestamp whenever players state changes
    lastPlayerChangeRef.current = Date.now();
    
    // Verify player existence in game
    const currentPlayerId = localStorage.getItem('playerId');
    if (currentPlayerId && gameState.gameId && gameState.players.length > 0) {
      const playerExists = gameState.players.some(p => p.id === currentPlayerId);
      
      if (!playerExists) {
        console.log('Current player no longer exists in local game state!');
        
        // Double check with database before taking action
        const checkPlayerExistence = async () => {
          try {
            const { data } = await supabase
              .from('players')
              .select('id')
              .eq('id', currentPlayerId)
              .eq('game_id', gameState.gameId)
              .maybeSingle();
              
            if (!data) {
              console.log('Player confirmed removed from database - resetting game');
              resetGame();
              toast.error('You have been removed from the game');
              navigate('/');
            }
          } catch (error) {
            console.error('Error checking player existence:', error);
          }
        };
        
        checkPlayerExistence();
      }
    }
  }, [gameState.players, gameState.gameId, resetGame, navigate]);

  return { lastPlayerChangeRef };
};
