
import { useCallback, useEffect, useRef } from 'react';
import { GameState, GameAction } from '@/types/game';
import { Dispatch } from 'react';
import { useSupabaseChannel } from './useSupabaseChannel';
import { useFetchPlayers } from './useFetchPlayers';
import { useGameUpdates } from './useGameUpdates';
import { usePlayerUpdates } from './usePlayerUpdates';
import { supabase } from '@/integrations/supabase/client';

export const useGameSubscriptions = (
  gameId: string | null,
  playerId: string,
  dispatch: Dispatch<GameAction>
) => {
  const gameStateRef = useRef<GameState | null>(null);
  const { fetchPlayers } = useFetchPlayers(dispatch);
  const { handleGameUpdate } = useGameUpdates(dispatch, gameStateRef);
  const { handlePlayerUpdate } = usePlayerUpdates(dispatch);
  
  // Setup initial data fetch
  useEffect(() => {
    if (gameId) {
      console.log('Setting up game subscriptions for game ID:', gameId);
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      // Initial fetch of all players
      fetchPlayers(gameId).then(players => {
        console.log('Initial players fetch completed:', players);
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }).catch(error => {
        console.error('Error in initial players fetch:', error);
        dispatch({ type: 'SET_LOADING', isLoading: false });
      });
    }
  }, [gameId, dispatch, fetchPlayers]);

  // Setup game updates channel
  useSupabaseChannel(
    'game_updates', 
    { 
      table: 'games',
      filter: `id=eq.${gameId}`
    },
    (payload) => handleGameUpdate(payload, gameId || ''),
    !!gameId
  );

  // Setup player updates channel - monitor all events for players in this game
  useSupabaseChannel(
    'player_updates', 
    { 
      table: 'players',
      filter: `game_id=eq.${gameId}`,
      event: '*'  // Listen for all events (INSERT, UPDATE, DELETE)
    },
    (payload) => {
      console.log('Player channel event received:', payload);
      handlePlayerUpdate(payload, gameId || '');
    },
    !!gameId
  );

  const updateGameStateRef = useCallback((state: GameState) => {
    gameStateRef.current = state;
  }, []);

  return { updateGameStateRef };
};
