
import { useEffect, useRef } from 'react';
import { GameState } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useStuckGameDetector = (
  state: GameState,
  lastPlayerChangeRef: React.RefObject<number>
) => {
  const stuckGameCheckerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add a heartbeat check to detect and recover from stalled games
  useEffect(() => {
    // Only run the stuck game checker if we're in an active game
    if (state.gameStarted && !state.setupPhase && !state.gameOver && state.gameId) {
      // Clear any existing interval
      if (stuckGameCheckerRef.current) {
        clearInterval(stuckGameCheckerRef.current);
      }
      
      // Set up a new interval to check for stuck games every 30 seconds
      stuckGameCheckerRef.current = setInterval(async () => {
        const timeSinceLastChange = Date.now() - (lastPlayerChangeRef.current || Date.now());
        console.log(`Time since last game state change: ${Math.round(timeSinceLastChange / 1000)}s`);
        
        // If no changes for 60 seconds, check if we need to refresh game state
        if (timeSinceLastChange > 60000) {
          console.log('Possible stalled game detected, refreshing game state...');
          
          try {
            // Fetch latest game state directly
            const { data: gameData, error: gameError } = await supabase
              .from('games')
              .select('*')
              .eq('id', state.gameId)
              .maybeSingle();
              
            if (gameError) {
              console.error('Error refreshing game state:', gameError);
              return;
            }
            
            if (gameData && gameData.current_player_id !== state.currentPlayerId) {
              console.log(`Game state mismatch detected! DB says it's player ${gameData.current_player_id}'s turn, but local state says ${state.currentPlayerId}`);
              
              // Force a refresh if there's a mismatch
              toast.info('Refreshing game state...', { duration: 2000 });
              window.location.reload();
            }
          } catch (error) {
            console.error('Error in stalled game recovery:', error);
          }
        }
      }, 30000);
      
      return () => {
        if (stuckGameCheckerRef.current) {
          clearInterval(stuckGameCheckerRef.current);
          stuckGameCheckerRef.current = null;
        }
      };
    }
  }, [
    state.gameId,
    state.gameStarted,
    state.setupPhase,
    state.gameOver,
    state.currentPlayerId,
    lastPlayerChangeRef
  ]);
  
  return { stuckGameCheckerRef };
};
