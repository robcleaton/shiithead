
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
      // If this is a DELETE event, we need to remove the player from the state
      if (payload.eventType === 'DELETE' && payload.old) {
        const removedPlayerId = payload.old.id;
        console.log('Player removed from database:', removedPlayerId);
        
        // If the removed player is the current player, redirect them back to home
        if (payload.old.id === localStorage.getItem('playerId')) {
          console.log('Current player was removed from the game!');
          toast.error('You have been removed from the game by the host');
          
          // Clear state and redirect
          dispatch({ type: 'RESET_GAME' });
          
          // Use a short timeout to ensure the toast is visible before redirecting
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
          
          return;
        }
        
        dispatch({ type: 'REMOVE_PLAYER', playerId: removedPlayerId });
        return;
      }
      
      // For other events (INSERT, UPDATE), fetch all players to update the state
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
