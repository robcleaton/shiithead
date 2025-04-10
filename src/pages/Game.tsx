
import { useState, useEffect } from 'react';
import useGame from '@/hooks/useGame';
import Rules from '@/components/Rules';
import Lobby from '@/components/Lobby';

// Import our components
import LoadingGame from '@/components/game/LoadingGame';
import GameSetup from '@/components/game/GameSetup';
import GameOver from '@/components/game/GameOver';
import ActiveGame from '@/components/game/ActiveGame';
import CursorTracker from '@/components/CursorTracker';

const Game = () => {
  const { state, playCard, drawCard, resetGame, selectFaceUpCard, completeSetup, selectMultipleFaceUpCards, refreshGameState } = useGame();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [hasRefreshedSetup, setHasRefreshedSetup] = useState(false);

  // Debugging info about current game state
  useEffect(() => {
    console.log('Game component rendered. Game started:', state.gameStarted);
    console.log('Setup phase:', state.setupPhase);
    console.log('Game over:', state.gameOver);
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

  // Smart refresh for setup phase - only refresh once when entering setup phase
  // or if player has no cards
  useEffect(() => {
    if (state.setupPhase) {
      const player = state.players.find(p => p.id === state.playerId);
      const needsRefresh = !hasRefreshedSetup || 
                           !player || 
                           !player.hand || 
                           player.hand.length === 0;
      
      if (needsRefresh) {
        console.log('Setup phase detected with missing cards, refreshing game state...');
        // Add short delay to ensure database has updated
        const timer = setTimeout(() => {
          refreshGameState();
          setHasRefreshedSetup(true);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        console.log('Setup phase active with cards already loaded - no refresh needed');
      }
    } else if (!state.setupPhase) {
      // Reset the refresh flag when exiting setup phase
      setHasRefreshedSetup(false);
    }
  }, [state.setupPhase, state.players, state.playerId, refreshGameState, hasRefreshedSetup]);

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

  return (
    <div className="">
      {state.isLoading && <LoadingGame />}

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
