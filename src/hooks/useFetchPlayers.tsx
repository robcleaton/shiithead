
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { jsonToCardValues } from '@/utils/gameUtils';
import { Player, GameAction } from '@/types/game';
import { Dispatch } from 'react';

export const useFetchPlayers = (dispatch: Dispatch<GameAction>) => {
  const fetchPlayers = useCallback(async (gameId: string) => {
    if (!gameId) return [];
    
    console.log('Fetching players for game:', gameId);
    
    try {
      const { data: playersData, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId);
        
      if (error) {
        console.error('Error fetching players:', error);
        return [];
      }
      
      if (playersData && playersData.length > 0) {
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
        
        console.log('Players fetched successfully:', mappedPlayers);
        dispatch({ type: 'SET_PLAYERS', players: mappedPlayers });
        return mappedPlayers;
      } else {
        console.warn('No players found for game:', gameId);
      }
    } catch (error) {
      console.error('Error in fetchPlayers:', error);
    }
    
    return [];
  }, [dispatch]);

  return { fetchPlayers };
};
