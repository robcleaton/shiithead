
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { jsonToCardValues } from '@/utils/gameUtils';
import { GameAction } from '@/types/game';
import { Dispatch } from 'react';

export const usePlayerUpdates = (dispatch: Dispatch<GameAction>) => {
  const handlePlayerUpdate = useCallback(async (payload: any, gameId: string) => {
    if (!gameId) return;
    
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
  }, [dispatch]);

  return { handlePlayerUpdate };
};
