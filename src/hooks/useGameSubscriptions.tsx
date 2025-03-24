
import { useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Dispatch } from 'react';
import { GameAction, GameState } from '@/types/game';
import { jsonToCardValues } from '@/utils/gameUtils';
import { handleAIPlayerTurn, isAIPlayer } from '@/context/game/actions/gamePlayActions';

export const useGameSubscriptions = (
  gameId: string | null,
  playerId: string,
  dispatch: Dispatch<GameAction>
) => {
  const gameChannelRef = useRef<any>(null);
  const playersChannelRef = useRef<any>(null);
  const gameStateRef = useRef<GameState | null>(null);

  // Clean up function to ensure channels are properly removed
  const cleanupChannels = () => {
    if (gameChannelRef.current) {
      supabase.removeChannel(gameChannelRef.current);
      gameChannelRef.current = null;
    }
    
    if (playersChannelRef.current) {
      supabase.removeChannel(playersChannelRef.current);
      playersChannelRef.current = null;
    }
  };

  // This effect updates the ref whenever state changes
  useEffect(() => {
    // Return a proper cleanup function that takes no arguments
    return () => {
      // The cleanup function doesn't need to do anything in this case
      // as we're just using this effect to capture the latest state
    };
  }, []);

  // Function to be called from outside to update the state ref
  const updateGameStateRef = (state: GameState) => {
    gameStateRef.current = state;
  };

  useEffect(() => {
    if (!gameId) {
      cleanupChannels();
      return;
    }
    
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    // Set up game channel
    const gameChannel = supabase
      .channel('game_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      }, async (payload) => {
        console.log('Game update:', payload);
        
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
              // Get previous current player ID before updating state
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
              
              // Check if it's a turn change to an AI player
              if (prevCurrentPlayerId !== gameData.current_player_id && 
                  gameStateRef.current && 
                  gameData.current_player_id) {
                
                const currentPlayer = gameStateRef.current.players.find(
                  p => p.id === gameData.current_player_id
                );
                
                if (currentPlayer && isAIPlayer(currentPlayer)) {
                  // Wait a short moment before AI makes its move
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
      .subscribe();
    
    gameChannelRef.current = gameChannel;
      
    // Set up players channel
    const playersChannel = supabase
      .channel('player_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `game_id=eq.${gameId}`
      }, async (payload) => {
        console.log('Players update:', payload);
        
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
            
            dispatch({ type: 'SET_PLAYERS', players: mappedPlayers });
          }
        } catch (error) {
          console.error('Error processing players update:', error);
        }
      })
      .subscribe();
    
    playersChannelRef.current = playersChannel;
    
    // Clean up on unmount
    return () => {
      cleanupChannels();
    };
  }, [gameId, dispatch, playerId]);

  return { cleanupChannels, updateGameStateRef };
};
