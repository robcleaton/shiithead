
import { createContext, ReactNode, useEffect, useRef } from 'react';
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
    // Update the last player change timestamp whenever players state changes
    lastPlayerChangeRef.current = Date.now();
  }, [gameContext.state.players]);
  
  // Add a heartbeat check to detect and recover from stalled games
  useEffect(() => {
    const { state } = gameContext;
    
    // Only run the stuck game checker if we're in an active game
    if (state.gameStarted && !state.setupPhase && !state.gameOver && state.gameId) {
      // Clear any existing interval
      if (stuckGameCheckerRef.current) {
        clearInterval(stuckGameCheckerRef.current);
      }
      
      // Set up a new interval to check for stuck games every 30 seconds
      stuckGameCheckerRef.current = setInterval(async () => {
        const timeSinceLastChange = Date.now() - lastPlayerChangeRef.current;
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
    gameContext.state.gameId,
    gameContext.state.gameStarted,
    gameContext.state.setupPhase,
    gameContext.state.gameOver,
    gameContext.state.currentPlayerId
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
    </GameContext.Provider>
  );
};
