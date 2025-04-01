
import { useReducer, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameReducer, initialState } from '@/context/game/gameReducer';
import { 
  createGame,
  joinGame,
  startGame,
  completeSetup,
  resetGame
} from '@/context/game/actions/setup';

import {
  playCard,
  drawCard,
  pickupPile,
  handleAIPlayerTurn
} from '@/context/game/actions/gamePlayActions';

import {
  selectFaceUpCard,
  selectMultipleFaceUpCards,
  addTestPlayer,
  invitePlayer
} from '@/context/game/actions/playerActions';

import { useGameSubscriptions } from './useGameSubscriptions';
import { useFetchGameData } from './useFetchGameData';
import { useFetchPlayers } from './useFetchPlayers';
import { GameState } from '@/types/game';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { jsonToCardValues } from '@/utils/gameUtils';

const useGameContext = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const navigate = useNavigate();
  
  // Set up real-time subscriptions
  const { updateGameStateRef } = useGameSubscriptions(state.gameId, state.playerId, dispatch);
  
  // Fetch initial game data
  useFetchGameData(state.gameId, state.playerId, dispatch);

  // Update the game state ref whenever state changes
  useEffect(() => {
    updateGameStateRef(state);
  }, [state, updateGameStateRef]);

  // Get the fetchPlayers function from the hook
  const { fetchPlayers } = useFetchPlayers(dispatch);

  // Function to refresh the game state for all players
  const refreshGameState = async () => {
    if (!state.gameId) {
      toast.error("No active game to refresh");
      return;
    }
    
    console.log('Refreshing game state for game:', state.gameId);
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    try {
      // First refresh players data
      await fetchPlayers(state.gameId);
      
      // Then fetch game data directly
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', state.gameId)
        .maybeSingle();
        
      if (gameError) {
        console.error('Error refreshing game data:', gameError);
        throw new Error(`Failed to fetch game data: ${gameError.message}`);
      }
      
      if (gameData) {
        // Force a refresh for all connected clients by updating a timestamp in the database
        const { error: updateError } = await supabase
          .from('games')
          .update({ 
            // Trigger an update that will be picked up by all clients' realtime subscriptions
            // We're updating with the same values to avoid changing game state
            current_player_id: gameData.current_player_id
          })
          .eq('id', state.gameId);
          
        if (updateError) {
          console.error('Error triggering global refresh:', updateError);
          toast.error('Failed to refresh the game for all players');
        } else {
          // Update local state as well
          dispatch({ 
            type: 'SET_GAME_STATE', 
            gameState: {
              gameStarted: gameData.started,
              gameOver: gameData.ended,
              currentPlayerId: gameData.current_player_id,
              deck: jsonToCardValues(gameData.deck),
              pile: jsonToCardValues(gameData.pile),
              setupPhase: gameData.setup_phase
            }
          });
          
          console.log('Game state refreshed successfully for all players');
          toast.success('Game refreshed for all players');
        }
      } else {
        console.warn('No game data found for ID:', state.gameId);
        toast.error('Game not found. Please check if the game still exists.');
      }
    } catch (error) {
      console.error('Error in refreshGameState:', error);
      toast.error('Failed to refresh the game. Please try again.');
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };

  return {
    state,
    createGame: (playerName: string) => createGame(dispatch, playerName, state.playerId, navigate),
    joinGame: (gameId: string, playerName: string) => joinGame(dispatch, gameId, playerName, state.playerId, navigate),
    startGame: () => startGame(dispatch, state),
    selectFaceUpCard: (cardIndex: number | number[]) => selectFaceUpCard(dispatch, state, cardIndex),
    selectMultipleFaceUpCards: (cardIndices: number[]) => selectMultipleFaceUpCards(dispatch, state, cardIndices),
    completeSetup: () => completeSetup(dispatch, state),
    playCard: (cardIndex: number | number[]) => playCard(dispatch, state, cardIndex),
    drawCard: () => drawCard(dispatch, state),
    pickupPile: () => pickupPile(dispatch, state),
    resetGame: () => resetGame(dispatch, state),
    addTestPlayer: (playerName: string) => addTestPlayer(dispatch, state, playerName),
    invitePlayer: (email: string) => invitePlayer(dispatch, state, email),
    triggerAITurn: () => handleAIPlayerTurn(dispatch, state),
    refreshGameState: refreshGameState
  };
};

export default useGameContext;
