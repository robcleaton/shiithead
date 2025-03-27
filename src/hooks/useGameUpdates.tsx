
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { jsonToCardValues } from '@/utils/gameUtils';
import { GameState, GameAction } from '@/types/game';
import { Dispatch } from 'react';
import { isAIPlayer } from '@/context/game/actions/gamePlay';
import { handleAIPlayerTurn } from '@/context/game/actions/gamePlayActions';

export const useGameUpdates = (
  dispatch: Dispatch<GameAction>,
  gameStateRef: React.MutableRefObject<GameState | null>
) => {
  const handleGameUpdate = useCallback(async (payload: any, gameId: string) => {
    if (payload.eventType !== 'UPDATE' || !gameId) return;
    
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
  }, [dispatch, gameStateRef]);

  return { handleGameUpdate };
};
