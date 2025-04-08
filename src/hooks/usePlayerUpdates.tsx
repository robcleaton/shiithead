
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { jsonToCardValues } from '@/utils/gameUtils';
import { GameAction } from '@/types/game';
import { Dispatch } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const usePlayerUpdates = (dispatch: Dispatch<GameAction>) => {
  const navigate = useNavigate();

  const handlePlayerUpdate = useCallback(async (payload: any, gameId: string) => {
    if (!gameId) return;
    
    console.log('Player update received for game:', gameId, 'Payload:', payload);
    
    try {
      // Enhanced detection of DELETE events
      const isDeleteEvent = 
        (payload.eventType === 'DELETE') ||
        (payload.event === 'DELETE') || 
        (payload.isDeleteEvent === true);
      
      // Get the player data from the record
      let playerRecord = null;
      if ('old' in payload) {
        playerRecord = payload.old;
      } else if ('record' in payload) {
        playerRecord = payload.record;
      }
      
      console.log('DELETE detection:', isDeleteEvent, 'Player record:', playerRecord);
      
      if (isDeleteEvent && playerRecord) {
        const removedPlayerId = playerRecord.id;
        console.log('Player removed from database:', removedPlayerId);
        
        // If the removed player is the current player, handle removal gracefully
        const currentPlayerId = localStorage.getItem('playerId');
        if (removedPlayerId === currentPlayerId) {
          console.log('Current player was removed from the game');
          
          // Clear game state first
          dispatch({ type: 'RESET_GAME' });
          
          // Show toast message
          toast.error('You have been removed from the game by the host');
          
          // Navigate to home page
          navigate('/');
          
          // Return early to prevent unnecessary player data fetch
          return;
        }
        
        // If it's another player being removed, update our local state without fetching all players
        dispatch({ type: 'REMOVE_PLAYER', playerId: removedPlayerId });
        return;
      }
      
      // For non-DELETE events and as a fallback for DELETE events that didn't properly update the UI
      // This ensures all clients have the latest player data
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
        
        console.log('Updated player list:', mappedPlayers);
        dispatch({ type: 'SET_PLAYERS', players: mappedPlayers });
      } else {
        // If no players returned, check if current player is still in the game
        const currentPlayerId = localStorage.getItem('playerId');
        if (currentPlayerId) {
          const { data: currentPlayerCheck } = await supabase
            .from('players')
            .select('id')
            .eq('id', currentPlayerId)
            .eq('game_id', gameId)
            .maybeSingle();
            
          if (!currentPlayerCheck) {
            console.log('Player not found in game - redirecting to home');
            dispatch({ type: 'RESET_GAME' });
            toast.error('You are no longer part of this game');
            navigate('/');
          }
        }
      }
    } catch (error) {
      console.error('Error processing players update:', error);
      toast.error('Error updating player data');
    }
  }, [dispatch, navigate]);

  return { handlePlayerUpdate };
};
