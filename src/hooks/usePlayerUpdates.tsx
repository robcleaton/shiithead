
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
        const currentPlayerId = localStorage.getItem('playerId');
        if (removedPlayerId === currentPlayerId) {
          console.log('Current player was removed from the game!');
          toast.error('You have been removed from the game by the host');
          
          // Clear state immediately to ensure the player knows they're removed
          dispatch({ type: 'RESET_GAME' });
          
          // Immediate redirect instead of using timeout
          window.location.href = '/';
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
        
        // Check if current player still exists in the updated players list
        const currentPlayerId = localStorage.getItem('playerId');
        const currentPlayerExists = mappedPlayers.some(p => p.id === currentPlayerId);
        
        if (!currentPlayerExists && currentPlayerId) {
          console.log('Current player no longer exists in player list - they were removed');
          toast.error('You have been removed from the game by the host');
          dispatch({ type: 'RESET_GAME' });
          window.location.href = '/';
          return;
        }
        
        dispatch({ type: 'SET_PLAYERS', players: mappedPlayers });
      } else {
        console.warn('No players data returned for game:', gameId);
        
        // If there are no players and we have a player ID, we might have been removed
        const currentPlayerId = localStorage.getItem('playerId');
        if (currentPlayerId) {
          console.log('No players returned but we have a player ID - checking if removed');
          
          // Double check if our player still exists in the game
          const { data: playerCheck } = await supabase
            .from('players')
            .select('id')
            .eq('id', currentPlayerId)
            .maybeSingle();
            
          if (!playerCheck) {
            console.log('Confirmed player removal - redirecting');
            toast.error('You have been removed from the game by the host');
            dispatch({ type: 'RESET_GAME' });
            window.location.href = '/';
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error processing players update:', error);
      toast.error('Error updating player data. Please refresh.');
    }
  }, [dispatch]);

  return { handlePlayerUpdate };
};
