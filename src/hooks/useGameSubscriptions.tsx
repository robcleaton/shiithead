
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const lastToastTimeRef = useRef<number>(0);
  const toastDebounceMs = 10000; // Only show a toast every 10 seconds
  
  // Setup initial data fetch
  useEffect(() => {
    if (gameId) {
      console.log('Setting up game subscriptions for game ID:', gameId, 'Player ID:', playerId);
      dispatch({ type: 'SET_LOADING', isLoading: true });
      setSubscriptionStatus('connecting');
      
      // Initial fetch of all players
      fetchPlayers(gameId).then(players => {
        console.log('Initial players fetch completed:', players?.length || 0, 'players');
        dispatch({ type: 'SET_LOADING', isLoading: false });
        setSubscriptionStatus('connected');
      }).catch(error => {
        console.error('Error in initial players fetch:', error);
        dispatch({ type: 'SET_LOADING', isLoading: false });
        setSubscriptionStatus('error');
        
        // Show toast only if we haven't shown one recently
        const now = Date.now();
        if (now - lastToastTimeRef.current > toastDebounceMs) {
          toast.error('Error fetching game data. Retrying...', {
            id: 'connection-error',
            duration: 3000
          });
          lastToastTimeRef.current = now;
        }
        
        // Retry logic for initial fetch
        const retryTimeout = setTimeout(() => {
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            fetchPlayers(gameId);
          } else {
            toast.error('Failed to connect to game. Please refresh the page.', {
              id: 'connection-failed',
              duration: 5000
            });
          }
        }, 3000);
        
        return () => clearTimeout(retryTimeout);
      });

      // Add an initial fetch of the game state directly to ensure we have the latest state
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

  // Create a stable channel status monitor function
  const monitorChannelStatus = useCallback((status: string) => {
    console.log(`Game updates channel status: ${status}`);
    
    if (status === 'SUBSCRIBED') {
      setSubscriptionStatus('connected');
      reconnectAttemptsRef.current = 0;
    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      const wasConnected = subscriptionStatus === 'connected';
      setSubscriptionStatus('error');
      
      if (reconnectAttemptsRef.current < maxReconnectAttempts && gameId) {
        // Only show toast if we were previously connected and haven't shown one recently
        const now = Date.now();
        if (wasConnected && now - lastToastTimeRef.current > toastDebounceMs) {
          toast.error(`Lost connection to game. Reconnecting...`, {
            id: 'reconnecting',
            duration: 3000
          });
          lastToastTimeRef.current = now;
        }
        
        reconnectAttemptsRef.current++;
        
        // Force a refresh of game data when reconnecting
        setTimeout(() => {
          fetchPlayers(gameId);
        }, 2000);
      }
    }
  }, [fetchPlayers, gameId, subscriptionStatus]);

  // Setup game updates channel
  useSupabaseChannel(
    'game_updates', 
    { 
      table: 'games',
      filter: `id=eq.${gameId}`
    },
    (payload) => {
      console.log('Game update received:', payload.eventType);
      handleGameUpdate(payload, gameId || '');
    },
    !!gameId,
    monitorChannelStatus
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
      console.log('Player update received:', payload.eventType, 'for player:', 
        payload.new?.id || payload.old?.id);
      handlePlayerUpdate(payload, gameId || '');
    },
    !!gameId,
    monitorChannelStatus
  );

  // Regular health check and data refresh for long-running games with less frequent toasts
  useEffect(() => {
    if (!gameId) return;
    
    const healthCheckInterval = setInterval(() => {
      if (subscriptionStatus === 'error' && reconnectAttemptsRef.current < maxReconnectAttempts) {
        console.log('Performing health check and data refresh...');
        fetchPlayers(gameId);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(healthCheckInterval);
  }, [gameId, fetchPlayers, subscriptionStatus]);

  const updateGameStateRef = useCallback((state: GameState) => {
    gameStateRef.current = state;
  }, []);

  return { updateGameStateRef, subscriptionStatus };
};
