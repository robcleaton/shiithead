
import { useCallback, useEffect, useRef } from 'react';
import { GameState, GameAction } from '@/types/game';
import { Dispatch } from 'react';
import { useSupabaseChannel } from './useSupabaseChannel';
import { useFetchPlayers } from './useFetchPlayers';
import { useGameUpdates } from './useGameUpdates';
import { usePlayerUpdates } from './usePlayerUpdates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useGameSubscriptions = (
  gameId: string | null,
  playerId: string,
  dispatch: Dispatch<GameAction>
) => {
  const gameStateRef = useRef<GameState | null>(null);
  const { fetchPlayers } = useFetchPlayers(dispatch);
  const { handleGameUpdate } = useGameUpdates(dispatch, gameStateRef);
  const { handlePlayerUpdate } = usePlayerUpdates(dispatch);
  const initialCheckDoneRef = useRef<boolean>(false);
  
  useEffect(() => {
    if (gameId && playerId && !initialCheckDoneRef.current) {
      console.log('Setting up game subscriptions for game ID:', gameId, 'Player ID:', playerId);
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      fetchPlayers(gameId).then(players => {
        console.log('Initial players fetch completed:', players?.length || 0, 'players');
        
        // Verify if current player exists in this game
        if (playerId && players && players.length > 0) {
          const currentPlayerExists = players.some(p => p.id === playerId);
          if (!currentPlayerExists) {
            // Only check database once to verify if player is truly not in the game
            console.log('Current player not found in initial players fetch');
            
            // Add a final database check before resetting
            supabase
              .from('players')
              .select('id')
              .eq('id', playerId)
              .eq('game_id', gameId)
              .maybeSingle()
              .then(({ data }) => {
                if (!data) {
                  console.log('Player confirmed not in database - resetting game');
                  dispatch({ type: 'RESET_GAME' });
                  toast.error('You are no longer part of this game');
                } else {
                  console.log('Player found in database despite not being in fetched players - keeping game state');
                }
              });
          }
        }
        
        initialCheckDoneRef.current = true;
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }).catch(error => {
        console.error('Error in initial players fetch:', error);
        dispatch({ type: 'SET_LOADING', isLoading: false });
        initialCheckDoneRef.current = true;
      });

      const fetchInitialGameState = async () => {
        try {
          const { data: gameData, error } = await supabase
            .from('games')
            .select('*')
            .eq('id', gameId)
            .maybeSingle();
            
          if (error) {
            console.error('Error fetching initial game state:', error);
            return;
          }
          
          if (gameData) {
            console.log('Initial game state fetch:', {
              currentPlayer: gameData.current_player_id,
              started: gameData.started,
              setup: gameData.setup_phase,
              ended: gameData.ended
            });
          }
        } catch (err) {
          console.error('Error in fetchInitialGameState:', err);
        }
      };
      
      fetchInitialGameState();
    }
  }, [gameId, dispatch, fetchPlayers, playerId]);

  // Set up player updates with explicit DELETE event listening
  useSupabaseChannel(
    'player_updates', 
    { 
      table: 'players',
      filter: `game_id=eq.${gameId}`,
      event: '*'  // Listen for all events (INSERT, UPDATE, DELETE)
    },
    (payload) => {
      console.log('Player update received:',  
        'old' in payload ? `for removed player: ${payload.old?.id}` : 
        'new' in payload ? `for player: ${payload.new?.id}` : 
        'unknown player event');
      handlePlayerUpdate(payload, gameId || '');
    },
    !!gameId
  );

  // Set up game updates
  useSupabaseChannel(
    'game_updates', 
    { 
      table: 'games',
      filter: `id=eq.${gameId}`
    },
    (payload) => {
      console.log('Game update received');
      handleGameUpdate(payload, gameId || '');
    },
    !!gameId
  );

  const updateGameStateRef = useCallback((state: GameState) => {
    gameStateRef.current = state;
  }, []);

  return { updateGameStateRef };
};
