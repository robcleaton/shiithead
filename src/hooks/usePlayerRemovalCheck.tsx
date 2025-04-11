
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePlayerRemovalCheck = (
  gameId: string | null,
  gameStarted: boolean,
  resetGame: () => void
) => {
  const navigate = useNavigate();
  const playerRemovalCheckRef = useRef<NodeJS.Timeout | null>(null);
  
  // Special periodic check for player removal when in a lobby
  useEffect(() => {
    const currentPlayerId = localStorage.getItem('playerId');
    
    // Only run this check when in a game but not yet started
    if (currentPlayerId && gameId && !gameStarted) {
      // Clear any existing check interval
      if (playerRemovalCheckRef.current) {
        clearInterval(playerRemovalCheckRef.current);
      }
      
      // Set up an interval to check if player still exists (every 10 seconds)
      playerRemovalCheckRef.current = setInterval(async () => {
        try {
          console.log('Performing periodic check to verify player membership in the game');
          const { data } = await supabase
            .from('players')
            .select('id')
            .eq('id', currentPlayerId)
            .eq('game_id', gameId)
            .maybeSingle();
            
          if (!data) {
            console.log('Periodic check detected player removal - leaving game');
            resetGame();
            toast.error('You have been removed from the game by the host');
            navigate('/');
            
            // Clear the interval after redirecting
            if (playerRemovalCheckRef.current) {
              clearInterval(playerRemovalCheckRef.current);
              playerRemovalCheckRef.current = null;
            }
          }
        } catch (error) {
          console.error('Error in periodic player existence check:', error);
        }
      }, 10000);
      
      return () => {
        if (playerRemovalCheckRef.current) {
          clearInterval(playerRemovalCheckRef.current);
          playerRemovalCheckRef.current = null;
        }
      };
    }
  }, [gameId, gameStarted, resetGame, navigate]);
  
  return { playerRemovalCheckRef };
};
