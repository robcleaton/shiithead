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
  const playerExistenceCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if player still exists in the game
  const verifyPlayerInGame = useCallback(async (gameId: string, playerId: string) => {
    if (!gameId || !playerId) return true;
    
    try {
      console.log('Verifying player existence in game:', gameId, 'Player ID:', playerId);
      const { data: playerData, error } = await supabase
        .from('players')
        .select('id')
        .eq('id', playerId)
        .eq('game_id', gameId)
        .maybeSingle();
        
      if (error) {
        console.error('Error verifying player existence:', error);
        return true; // Assume player exists on error to prevent false logouts
      }
      
      if (!playerData) {
        console.log('Player not found in game during verification - triggering reset');
        dispatch({ type: 'RESET_GAME' });
        toast.error('You are no longer part of this game');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Exception in verifyPlayerInGame:', err);
      return true; // Assume player exists on error
    }
  }, [dispatch]);
  
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
            // Player not in initial fetch, do explicit check
            verifyPlayerInGame(gameId, playerId).then(exists => {
              if (!exists) {
                console.log('Player confirmed not in game during initial setup - resetting');
              }
            });
          }
        }
        
        initialCheckDoneRef.current = true;
        dispatch({ type: 'SET_LOADING', isLoading: false });
        
        // Set up periodic check to verify player is still in the game
        if (playerExistenceCheckTimeoutRef.current) {
          clearInterval(playerExistenceCheckTimeoutRef.current);
        }
        
        playerExistenceCheckTimeoutRef.current = setInterval(() => {
          verifyPlayerInGame(gameId, playerId);
        }, 10000); // Check every 10 seconds
        
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
    
    return () => {
      if (playerExistenceCheckTimeoutRef.current) {
        clearInterval(playerExistenceCheckTimeoutRef.current);
        playerExistenceCheckTimeoutRef.current = null;
      }
    };
  }, [gameId, dispatch, fetchPlayers, playerId, verifyPlayerInGame]);

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
        payload.old ? `for removed player: ${payload.old?.id}` : 
        payload.new ? `for player: ${payload.new?.id}` : 
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
