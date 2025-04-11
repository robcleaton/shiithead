
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { jsonToCardValues } from '@/utils/gameUtils';
import { GameState, GameAction } from '@/types/game';
import { Dispatch } from 'react';
import { isAIPlayer, handleAIPlayerTurn } from '@/context/game/actions/gamePlay';
import { toast } from 'sonner';

// Define the payload type to match useSupabaseChannel
interface RealtimePayload {
  type?: string;
  event?: string;
  eventType?: string;
  new?: Record<string, any>;
  old?: Record<string, any>;
  record?: Record<string, any>;
  schema?: string;
  table?: string;
  [key: string]: any;
}

export const useGameUpdates = (
  dispatch: Dispatch<GameAction>,
  gameStateRef: React.MutableRefObject<GameState | null>
) => {
  const handleGameUpdate = useCallback(async (payload: RealtimePayload, gameId: string) => {
    if ((payload.eventType !== 'UPDATE' && payload.event !== 'UPDATE') || !gameId) return;
    
    try {
      const { data: gameData, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching game data after update:', error);
        toast.error('Failed to sync game state. Please refresh the page.');
        return;
      }
      
      if (gameData) {
        const prevCurrentPlayerId = gameStateRef.current?.currentPlayerId;
        const deckCards = jsonToCardValues(gameData.deck);
        
        console.log(`Game update: deck count from DB = ${deckCards.length}`);
        console.log(`Game turn update: Current player changing from ${prevCurrentPlayerId} to ${gameData.current_player_id}`);
        
        // Create a complete game state update to ensure consistency
        const updatedGameState = {
          gameStarted: gameData.started,
          gameOver: gameData.ended,
          currentPlayerId: gameData.current_player_id,
          deck: deckCards,
          pile: jsonToCardValues(gameData.pile),
          setupPhase: gameData.setup_phase
        };
        
        dispatch({ type: 'SET_GAME_STATE', gameState: updatedGameState });
        
        // If player turn has changed, handle AI player logic and show toast ONLY for others' turns
        if (prevCurrentPlayerId !== gameData.current_player_id && 
            gameStateRef.current && 
            gameData.current_player_id) {
          
          const currentPlayer = gameStateRef.current.players.find(
            p => p.id === gameData.current_player_id
          );
          
          const selfId = gameStateRef.current.playerId;
          const isSelfTurn = selfId === gameData.current_player_id;
          
          if (currentPlayer) {
            console.log(`Turn changed to player: ${currentPlayer.name} (${currentPlayer.id})`);
            
            // Only show toast for other players' turns, not the user's own turn
            if (!isSelfTurn) {
              toast.info(`It's ${currentPlayer.name}'s turn`);
            }
            
            if (isAIPlayer(currentPlayer.id)) {
              console.log(`AI player ${currentPlayer.name} will take their turn`);
              setTimeout(() => {
                if (gameStateRef.current) {
                  handleAIPlayerTurn(dispatch, {
                    ...gameStateRef.current,
                    currentPlayerId: gameData.current_player_id,
                    deck: deckCards,
                    pile: jsonToCardValues(gameData.pile)
                  });
                }
              }, 1000);
            }
          } else {
            console.warn(`Current player with ID ${gameData.current_player_id} not found in player list`);
          }
        }
      } else {
        console.warn(`No game data returned for game ID: ${gameId}`);
      }
    } catch (error) {
      console.error('Error processing game update:', error);
      toast.error('Error updating game state. Please refresh the page.');
    }
  }, [dispatch, gameStateRef]);

  return { handleGameUpdate };
};
