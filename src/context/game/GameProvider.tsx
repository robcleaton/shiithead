
import { createContext, ReactNode, useEffect, useRef, useState } from 'react';
import useGameContext from '@/hooks/useGameContext';
import { GameState, Player, CardValue } from '@/types/game';
import { isAIPlayer } from './actions/gamePlay/aiPlayerActions';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type GameContextType = ReturnType<typeof useGameContext>;

export const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const gameContext = useGameContext();
  const lastPlayerChangeRef = useRef<number>(Date.now());
  const stuckGameCheckerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);
  const [hasConnectionIssue, setHasConnectionIssue] = useState(false);
  const connectionCheckCountRef = useRef(0);
  const lastToastTimeRef = useRef<number>(0);
  const toastDebounceMs = 10000; // 10 seconds between connection toasts
  
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

  // Check Supabase connection status with debounced toasts
  useEffect(() => {
    const { state } = gameContext;
    if (!state.gameId) return;

    // Setup connection monitoring with progressive intervals
    const checkConnection = async () => {
      try {
        // Use a simple query to check connection
        const { error } = await supabase
          .from('games')
          .select('id')
          .limit(1)
          .single();
        
        const now = Date.now();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned" which is ok
          console.error('Supabase connection check failed:', error);
          connectionCheckCountRef.current++;
          
          if (!hasConnectionIssue) {
            setHasConnectionIssue(true);
            
            // Only show toast if we haven't shown one recently
            if (now - lastToastTimeRef.current > toastDebounceMs) {
              toast.error('Connection issues detected. Trying to reconnect...', {
                id: 'connection-error',
                duration: 5000,
              });
              lastToastTimeRef.current = now;
            }
          }
        } else {
          connectionCheckCountRef.current = 0;
          
          if (hasConnectionIssue) {
            setHasConnectionIssue(false);
            
            // Only show reconnection toast if we had previously shown a disconnection toast
            if (now - lastToastTimeRef.current < 60000) { // Only if disconnection was recent
              toast.success('Connection restored!', {
                id: 'connection-restored',
                duration: 3000,
              });
              lastToastTimeRef.current = now;
            }
            
            // Refresh game data when connection is restored
            gameContext.refreshGameState();
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        connectionCheckCountRef.current++;
        setHasConnectionIssue(true);
      }
    };

    // Initial check
    checkConnection();
    
    // Periodic check with progressive intervals based on failure count
    const connectionChecker = setInterval(() => {
      // Increase check interval when we have multiple consecutive failures
      if (connectionCheckCountRef.current > 3) {
        // Only check every 30s if we have several failures
        if (connectionCheckCountRef.current % 3 !== 0) return;
      }
      checkConnection();
    }, 10000); // Base interval is 10s
    
    return () => {
      clearInterval(connectionChecker);
    };
  }, [gameContext, hasConnectionIssue]);

  // Add debug logging for player state changes
  useEffect(() => {
    console.log('Current players in GameProvider:', gameContext.state.players);
    // Update the last player change timestamp whenever players state changes
    lastPlayerChangeRef.current = Date.now();
  }, [gameContext.state.players]);
  
  // Add a heartbeat check to detect and recover from stalled games
  useEffect(() => {
    const { state, refreshGameState } = gameContext;
    
    // Only run the stuck game checker if we're in an active game
    if (state.gameStarted && !state.setupPhase && !state.gameOver && state.gameId) {
      // Clear any existing interval
      if (stuckGameCheckerRef.current) {
        clearInterval(stuckGameCheckerRef.current);
      }
      
      // Set up a new interval to check for stuck games every 15 seconds (reduced from 30)
      stuckGameCheckerRef.current = setInterval(async () => {
        const timeSinceLastChange = Date.now() - lastPlayerChangeRef.current;
        console.log(`Time since last game state change: ${Math.round(timeSinceLastChange / 1000)}s`);
        
        // If no changes for 30 seconds (reduced from 60), check if we need to refresh game state
        if (timeSinceLastChange > 30000) {
          console.log('Possible stalled game detected, refreshing game state...');
          
          // Prevent refresh spamming (no more than once every 10 seconds)
          const now = Date.now();
          if (now - lastRefreshRef.current > 10000) {
            lastRefreshRef.current = now;
            
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
              
              if (gameData) {
                if (gameData.current_player_id !== state.currentPlayerId ||
                    (gameData.ended && !state.gameOver) ||
                    (!gameData.setup_phase && state.setupPhase)) {
                  console.log(`Game state mismatch detected! DB says it's player ${gameData.current_player_id}'s turn, but local state says ${state.currentPlayerId}`);
                  
                  // Auto refresh game state when mismatch detected, without a toast
                  refreshGameState();
                }
              }
            } catch (error) {
              console.error('Error in stalled game recovery:', error);
            }
          }
        }
      }, 15000);
      
      return () => {
        if (stuckGameCheckerRef.current) {
          clearInterval(stuckGameCheckerRef.current);
          stuckGameCheckerRef.current = null;
        }
      };
    }
  }, [
    gameContext.state.gameId,
    gameContext.state.gameStarted,
    gameContext.state.setupPhase,
    gameContext.state.gameOver,
    gameContext.state.currentPlayerId,
    gameContext.refreshGameState
  ]);
  
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
      {hasConnectionIssue && (
        <div className="fixed bottom-4 left-4 bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded shadow-lg z-50">
          <div className="flex items-center">
            <div className="animate-pulse w-2 h-2 bg-red-600 rounded-full mr-2"></div>
            <span>Connection issue - attempting to reconnect</span>
          </div>
        </div>
      )}
    </GameContext.Provider>
  );
};
