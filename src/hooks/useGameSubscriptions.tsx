
import { useCallback, useEffect, useRef } from 'react';
import { GameState, GameAction } from '@/types/game';
import { Dispatch } from 'react';
import { useSupabaseChannel } from './useSupabaseChannel';
import { useFetchPlayers } from './useFetchPlayers';
import { useGameUpdates } from './useGameUpdates';
import { usePlayerUpdates } from './usePlayerUpdates';

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
      
      fetchPlayers(gameId).finally(() => {
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

  // Setup player updates channel
  useSupabaseChannel(
    'player_updates', 
    { 
      table: 'players',
      filter: `game_id=eq.${gameId}`
    },
    (payload) => handlePlayerUpdate(payload, gameId || ''),
    !!gameId
  );

  const updateGameStateRef = useCallback((state: GameState) => {
    gameStateRef.current = state;
  }, []);

  return { updateGameStateRef };
};
