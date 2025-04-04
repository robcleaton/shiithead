
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { jsonToCardValues } from '@/utils/gameUtils';
import { GameAction } from '@/types/game';
import { Dispatch } from 'react';
import { toast } from 'sonner';

export const usePlayerUpdates = (dispatch: Dispatch<GameAction>) => {
  const handlePlayerUpdate = useCallback(async (payload: any, gameId: string) => {
    if (!gameId) return;
    
    console.log('Player update received for game:', gameId, 'Type:', payload.eventType);
    
    try {
      const { data: playersData, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId);
        
      if (error) {
        console.error('Error fetching players data after update:', error);
        toast.error('Failed to sync player data. Please refresh.');
        return;
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
        
        // Log important player state for debugging
        const playerInfo = mappedPlayers.map(p => ({
          id: p.id,
          name: p.name,
          handCount: p.hand.length,
          faceUpCount: p.faceUpCards.length,
          faceDownCount: p.faceDownCards.length,
          isReady: p.isReady
        }));
        console.log('Updated players after DB change:', playerInfo);
        
        dispatch({ type: 'SET_PLAYERS', players: mappedPlayers });
      } else {
        console.warn('No players data returned for game:', gameId);
      }
    } catch (error) {
      console.error('Error processing players update:', error);
      toast.error('Error updating player data. Please refresh.');
    }
  }, [dispatch]);

  return { handlePlayerUpdate };
};
