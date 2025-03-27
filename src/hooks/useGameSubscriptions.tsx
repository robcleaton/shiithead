
import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isAIPlayer } from '@/context/game/actions/gamePlay';
import { GameState, GameAction, Player } from '@/types/game';
import { jsonToCardValues } from '@/utils/gameUtils';
import { handleAIPlayerTurn } from '@/context/game/actions/gamePlayActions';
import { Dispatch } from 'react';
import { toast } from 'sonner';

export const useGameSubscriptions = (
  gameId: string | null,
  playerId: string,
  dispatch: Dispatch<GameAction>
) => {
  const gameChannelRef = useRef<any>(null);
  const playersChannelRef = useRef<any>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupChannels = () => {
    if (gameChannelRef.current) {
      supabase.removeChannel(gameChannelRef.current);
      gameChannelRef.current = null;
    }
    
    if (playersChannelRef.current) {
      supabase.removeChannel(playersChannelRef.current);
      playersChannelRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupChannels();
  }, []);

  const updateGameStateRef = (state: GameState) => {
    gameStateRef.current = state;
  };

  // Helper function to set up subscriptions with retry logic
  const setupSubscriptions = useCallback(async () => {
    if (!gameId) return;
    
    try {
      console.log('Setting up game subscriptions for game ID:', gameId);
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      // Initial fetch of all players for the game
      const fetchInitialPlayers = async () => {
        try {
          const { data: playersData, error } = await supabase
            .from('players')
            .select('*')
            .eq('game_id', gameId);
            
          if (error) {
            console.error('Error fetching initial players:', error);
            return;
          }
          
          if (playersData) {
            const mappedPlayers = playersData.map(p => ({
              id: p.id,
              name: p.name,
              isHost: p.is_host,
              hand: jsonToCardValues(p.hand),
              faceDownCards: jsonToCardValues(p.face_down_cards),
              faceUpCards: jsonToCardValues(p.face_up_cards),
              isActive: p.is_active,
              isReady: p.is_ready,
              gameId: p.game_id
            }));
            
            console.log('Initial players fetched:', mappedPlayers);
            dispatch({ type: 'SET_PLAYERS', players: mappedPlayers });
          }
        } catch (error) {
          console.error('Error in fetchInitialPlayers:', error);
        }
      };
      
      await fetchInitialPlayers();
      
      // Set up game channel subscription
      if (!gameChannelRef.current) {
        const gameChannel = supabase
          .channel('game_updates')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${gameId}`
          }, async (payload) => {
            console.log('Game update received:', payload);
            
            if (payload.eventType === 'UPDATE') {
              try {
                const { data: gameData, error } = await supabase
                  .from('games')
                  .select('*')
                  .eq('id', gameId)
                  .maybeSingle();
                  
                if (error) {
                  console.error('Error fetching game data after update:', error);
                  return;
                }
                
                if (gameData) {
                  const prevCurrentPlayerId = gameStateRef.current?.currentPlayerId;
                  
                  const updatedGameState = {
                    gameStarted: gameData.started,
                    gameOver: gameData.ended,
                    currentPlayerId: gameData.current_player_id,
                    deck: jsonToCardValues(gameData.deck),
                    pile: jsonToCardValues(gameData.pile),
                    setupPhase: gameData.setup_phase
                  };
                  
                  dispatch({ type: 'SET_GAME_STATE', gameState: updatedGameState });
                  
                  if (prevCurrentPlayerId !== gameData.current_player_id && 
                      gameStateRef.current && 
                      gameData.current_player_id) {
                    
                    const currentPlayer = gameStateRef.current.players.find(
                      p => p.id === gameData.current_player_id
                    );
                    
                    if (currentPlayer && isAIPlayer(currentPlayer.id)) {
                      setTimeout(() => {
                        if (gameStateRef.current) {
                          handleAIPlayerTurn(dispatch, {
                            ...gameStateRef.current,
                            currentPlayerId: gameData.current_player_id,
                            deck: jsonToCardValues(gameData.deck),
                            pile: jsonToCardValues(gameData.pile)
                          });
                        }
                      }, 1000);
                    }
                  }
                }
              } catch (error) {
                console.error('Error processing game update:', error);
              }
            }
          })
          .subscribe((status) => {
            console.log('Game channel subscription status:', status);
            if (status === 'SUBSCRIPTION_ERROR') {
              console.error('Game subscription error. Will attempt to reconnect.');
            }
          });
        
        gameChannelRef.current = gameChannel;
      }
      
      // Set up players channel subscription  
      if (!playersChannelRef.current) {
        const playersChannel = supabase
          .channel('player_updates')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'players',
            filter: `game_id=eq.${gameId}`
          }, async (payload) => {
            console.log('Players update received:', payload);
            
            try {
              const { data: playersData, error } = await supabase
                .from('players')
                .select('*')
                .eq('game_id', gameId);
                
              if (error) {
                console.error('Error fetching players data after update:', error);
                return;
              }
                
              if (playersData) {
                const mappedPlayers = playersData.map(p => ({
                  id: p.id,
                  name: p.name,
                  isHost: p.is_host,
                  hand: jsonToCardValues(p.hand),
                  faceDownCards: jsonToCardValues(p.face_down_cards),
                  faceUpCards: jsonToCardValues(p.face_up_cards),
                  isActive: p.is_active,
                  isReady: p.is_ready,
                  gameId: p.game_id
                }));
                
                console.log('Updated players after DB change:', mappedPlayers);
                dispatch({ type: 'SET_PLAYERS', players: mappedPlayers });
              }
            } catch (error) {
              console.error('Error processing players update:', error);
            }
          })
          .subscribe((status) => {
            console.log('Players channel subscription status:', status);
            if (status === 'SUBSCRIPTION_ERROR') {
              console.error('Players subscription error. Will attempt to reconnect.');
            }
          });
        
        playersChannelRef.current = playersChannel;
      }
      
      dispatch({ type: 'SET_LOADING', isLoading: false });
    } catch (error) {
      console.error('Error setting up subscriptions:', error);
      dispatch({ type: 'SET_LOADING', isLoading: false });
      
      // Implement reconnection logic with exponential backoff
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect subscriptions...');
        cleanupChannels();
        setupSubscriptions();
      }, 5000);
    }
  }, [gameId, dispatch, playerId]);

  useEffect(() => {
    if (gameId) {
      setupSubscriptions();
    } else {
      cleanupChannels();
    }
    
    // Cleanup on unmount or gameId change
    return () => {
      cleanupChannels();
    };
  }, [gameId, setupSubscriptions]);

  return { cleanupChannels, updateGameStateRef };
};
