
import { useState, useEffect, useCallback } from 'react';
import useGame from '@/hooks/useGame';
import Rules from '@/components/Rules';
import Lobby from '@/components/Lobby';

// Import our components
import LoadingGame from '@/components/game/LoadingGame';
import GameSetup from '@/components/game/GameSetup';
import GameOver from '@/components/game/GameOver';
import ActiveGame from '@/components/game/ActiveGame';
import CursorTracker from '@/components/CursorTracker';
import { toast } from 'sonner';

const Game = () => {
  const { state, playCard, drawCard, resetGame, selectFaceUpCard, completeSetup, selectMultipleFaceUpCards, refreshGameState } = useGame();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const lastToastTimeRef = useRef<number>(0);
  const toastDebounceMs = 8000; // 8 seconds between recovery toasts

  useEffect(() => {
    console.log('Game component rendered. Game started:', state.gameStarted);
    console.log('Setup phase:', state.setupPhase);
    console.log('Players in game:', state.players);
    console.log('Current game state:', state);

    const currentPlayer = state.players.find(p => p.id === state.playerId);
    if (currentPlayer) {
      console.log('Current player hand:', currentPlayer.hand);
      console.log('Face down cards:', currentPlayer.faceDownCards);
      console.log('Face up cards:', currentPlayer.faceUpCards);
      console.log('Player is ready:', currentPlayer.isReady);
    }
  }, [state]);

  const player = state.players.find(p => p.id === state.playerId);

  // Add debug info for setup phase
  useEffect(() => {
    if (state.setupPhase && player) {
      console.log('DEBUG - Setup phase active');
      console.log('Player ready state:', player.isReady);
      console.log('Player face up cards:', player.faceUpCards);
      console.log('Player hand:', player.hand);
    }
  }, [state.setupPhase, player]);

  // Auto-recovery mechanism for when game state appears inconsistent
  useEffect(() => {
    let recoveryTimer: NodeJS.Timeout;
    
    if (state.gameId && state.gameStarted && !state.isLoading && state.players.length > 0) {
      // If there's no current player assigned but the game has started
      if (!state.currentPlayerId && !state.gameOver && !state.setupPhase) {
        console.log('Detected missing current player in active game. Attempting recovery...');
        setConnectionIssue(true);
        
        recoveryTimer = setTimeout(() => {
          refreshGameState();
          setRetryCount(prev => prev + 1);
          
          // After 3 retries, suggest manual refresh but less aggressively
          if (retryCount >= 2) {
            const now = Date.now();
            if (now - lastToastTimeRef.current > toastDebounceMs) {
              toast.error('Game state sync issue. Try refreshing the page if problem persists.', {
                id: 'recovery-failed'
              });
              lastToastTimeRef.current = now;
            }
          }
        }, 3000);
      } else {
        setConnectionIssue(false);
        setRetryCount(0);
      }
    }
    
    return () => {
      clearTimeout(recoveryTimer);
    };
  }, [state.gameId, state.gameStarted, state.currentPlayerId, state.gameOver, 
      state.setupPhase, state.players, state.isLoading, refreshGameState, retryCount]);

  // Handle manual refresh when needed
  const handleRefreshGame = useCallback(() => {
    const now = Date.now();
    if (now - lastToastTimeRef.current > toastDebounceMs) {
      toast.info('Refreshing game state...', { id: 'manual-refresh' });
      lastToastTimeRef.current = now;
    }
    refreshGameState();
    setRetryCount(0);
  }, [refreshGameState]);

  return (
    <div className="">
      {state.isLoading && <LoadingGame />}

      {connectionIssue && !state.isLoading && (
        <div className="fixed top-4 right-4 bg-amber-100 border border-amber-400 text-amber-800 px-4 py-2 rounded shadow-md z-50">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></div>
            <span>Syncing game state...</span>
          </div>
        </div>
      )}

      {!state.isLoading && !state.gameStarted && !state.setupPhase && <Lobby />}

      {!state.isLoading && state.gameOver && (
        <GameOver players={state.players} resetGame={resetGame} />
      )}

      {!state.isLoading && state.setupPhase && player && (
        <>
          <GameSetup
            player={player}
            players={state.players}
            isHost={state.isHost}
            completeSetup={completeSetup}
            selectFaceUpCard={selectFaceUpCard}
            selectMultipleFaceUpCards={selectMultipleFaceUpCards}
            onOpenRules={() => setRulesOpen(true)}
          />
          <Rules open={rulesOpen} onOpenChange={setRulesOpen} />
        </>
      )}

      {!state.isLoading && state.gameStarted && !state.setupPhase && !state.gameOver && (
        <>
          <ActiveGame
            players={state.players}
            playerId={state.playerId}
            currentPlayerId={state.currentPlayerId}
            pile={state.pile}
            deck={state.deck}
            drawCard={drawCard}
            playCard={playCard}
            resetGame={resetGame}
            onOpenRules={() => setRulesOpen(true)}
            isLoading={state.isLoading}
            refreshGame={handleRefreshGame}
          />
          <Rules open={rulesOpen} onOpenChange={setRulesOpen} />
          <CursorTracker hideUserCursor={true} />
        </>
      )}

      {/* Add cursor tracker only for lobby, with hideUserCursor */}
      {state.gameId && !state.gameStarted && !state.setupPhase && <CursorTracker hideUserCursor={true} />}
    </div>
  );
};

export default Game;
